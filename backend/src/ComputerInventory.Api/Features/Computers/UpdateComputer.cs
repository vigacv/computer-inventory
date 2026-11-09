using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using ComputerInventory.Api.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.Computers;

/// <summary>
/// Replaces a computer's specification. Uses optimistic concurrency: the client sends back the
/// <c>RowVersion</c> it loaded, and the update is rejected with 409 if someone saved in between.
/// </summary>
public static class UpdateComputer
{
    public sealed record Request(
        int RamMb,
        int StorageCapacityGb,
        StorageType? StorageType,
        int WeightGrams,
        int PsuWatts,
        int ProcessorId,
        int GraphicsCardId,
        IReadOnlyList<UsbPortInput>? UsbPorts,
        byte[]? RowVersion) : IComputerSpec;

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            Include(new ComputerSpecValidator());
            RuleFor(r => r.RowVersion).NotEmpty().WithMessage("RowVersion is required. Load the computer before updating it.");
        }
    }

    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app) =>
            app.MapPut("/computers/{id:int}", Handle)
               .WithValidation<Request>()
               .WithTags("Computers")
               .WithName(nameof(UpdateComputer))
               .ProducesProblem(StatusCodes.Status404NotFound)
               .ProducesProblem(StatusCodes.Status409Conflict);
    }

    internal static async Task<Results<Ok<GetComputer.Response>, ValidationProblem, ProblemHttpResult>> Handle(
        int id, Request request, AppDbContext db, CancellationToken ct)
    {
        var computer = await db.Computers.Include(c => c.UsbPorts).SingleOrDefaultAsync(c => c.Id == id, ct);
        if (computer is null)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Computer not found",
                detail: $"There is no computer with id {id}.");
        }

        var referenceErrors = await ComputerSpecs.ValidateReferencesAsync(db, request, ct);
        if (referenceErrors.Count > 0)
        {
            return TypedResults.ValidationProblem(referenceErrors);
        }

        // Compare against the version the client loaded, not the one we just read.
        db.Entry(computer).Property(c => c.RowVersion).OriginalValue = request.RowVersion!;

        request.ApplyTo(computer);

        // Always update the computer row, even when only USB ports changed: that's what runs the
        // RowVersion check (and moves UpdatedAt), so concurrent USB-only edits are caught too.
        db.Entry(computer).Property(c => c.UpdatedAt).IsModified = true;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Edit conflict",
                detail: "This computer was changed or deleted by someone else after you loaded it. Reload it and try again.");
        }

        var updated = await db.Computers
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(GetComputer.Response.Projection)
            .SingleAsync(ct);

        return TypedResults.Ok(updated);
    }
}
