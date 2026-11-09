using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using ComputerInventory.Api.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.Computers;

/// <summary>Adds a computer. Responds 201 with its location and full details (including RowVersion).</summary>
public static class CreateComputer
{
    public sealed record Request(
        int RamMb,
        int StorageCapacityGb,
        StorageType? StorageType,
        int WeightGrams,
        int PsuWatts,
        int ProcessorId,
        int GraphicsCardId,
        IReadOnlyList<UsbPortInput>? UsbPorts) : IComputerSpec;

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator() => Include(new ComputerSpecValidator());
    }

    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app) =>
            app.MapPost("/computers", Handle)
               .WithValidation<Request>()
               .WithTags("Computers")
               .WithName(nameof(CreateComputer));
    }

    internal static async Task<Results<Created<GetComputer.Response>, ValidationProblem>> Handle(
        Request request, AppDbContext db, CancellationToken ct)
    {
        var referenceErrors = await ComputerSpecs.ValidateReferencesAsync(db, request, ct);
        if (referenceErrors.Count > 0)
        {
            return TypedResults.ValidationProblem(referenceErrors);
        }

        var computer = new Computer();
        request.ApplyTo(computer);
        db.Computers.Add(computer);
        await db.SaveChangesAsync(ct);

        var created = await db.Computers
            .AsNoTracking()
            .Where(c => c.Id == computer.Id)
            .Select(GetComputer.Response.Projection)
            .SingleAsync(ct);

        return TypedResults.Created($"/api/computers/{created.Id}", created);
    }
}
