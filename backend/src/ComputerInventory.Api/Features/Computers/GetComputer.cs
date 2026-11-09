using System.Linq.Expressions;
using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using ComputerInventory.Api.Entities;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.Computers;

/// <summary>A single computer with everything the details view shows.</summary>
public static class GetComputer
{
    public sealed record Response(
        int Id,
        int RamMb,
        int StorageCapacityGb,
        StorageType StorageType,
        int WeightGrams,
        int PsuWatts,
        ComponentInfo Processor,
        ComponentInfo GraphicsCard,
        IReadOnlyList<UsbPortInfo> UsbPorts,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt)
    {
        public static readonly Expression<Func<Computer, Response>> Projection = c => new Response(
            c.Id,
            c.RamMb,
            c.StorageCapacityGb,
            c.StorageType,
            c.WeightGrams,
            c.PsuWatts,
            new ComponentInfo(c.Processor.Id, c.Processor.Manufacturer.Name, c.Processor.Model),
            new ComponentInfo(c.GraphicsCard.Id, c.GraphicsCard.Manufacturer.Name, c.GraphicsCard.Model),
            c.UsbPorts
                .OrderBy(p => p.PortType)
                .Select(p => new UsbPortInfo(p.PortType, p.Count))
                .ToList(),
            c.CreatedAt,
            c.UpdatedAt);
    }

    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app) =>
            app.MapGet("/computers/{id:int}", Handle)
               .WithTags("Computers")
               .WithName(nameof(GetComputer))
               .ProducesProblem(StatusCodes.Status404NotFound);
    }

    internal static async Task<Results<Ok<Response>, ProblemHttpResult>> Handle(int id, AppDbContext db, CancellationToken ct)
    {
        var computer = await db.Computers
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(Response.Projection)
            .SingleOrDefaultAsync(ct);

        return computer is null
            ? TypedResults.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Computer not found",
                detail: $"There is no computer with id {id}.")
            : TypedResults.Ok(computer);
    }
}
