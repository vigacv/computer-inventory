using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using ComputerInventory.Api.Entities;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.Lookups;

/// <summary>Reference data for filters and forms, in a single round trip.</summary>
public static class GetLookups
{
    public sealed record ManufacturerItem(int Id, string Name);

    public sealed record Response(
        IReadOnlyList<ManufacturerItem> Manufacturers,
        IReadOnlyList<StorageType> StorageTypes,
        IReadOnlyList<UsbPortType> UsbPortTypes);

    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app) =>
            app.MapGet("/lookups", Handle)
               .WithTags("Lookups")
               .WithName(nameof(GetLookups));
    }

    internal static async Task<Ok<Response>> Handle(AppDbContext db, CancellationToken ct)
    {
        var manufacturers = await db.Manufacturers
            .AsNoTracking()
            .OrderBy(m => m.Name)
            .Select(m => new ManufacturerItem(m.Id, m.Name))
            .ToListAsync(ct);

        return TypedResults.Ok(new Response(manufacturers, Enum.GetValues<StorageType>(), Enum.GetValues<UsbPortType>()));
    }
}
