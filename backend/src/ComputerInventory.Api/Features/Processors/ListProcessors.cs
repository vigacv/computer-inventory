using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using ComputerInventory.Api.Features.Computers;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.Processors;

/// <summary>All processors, for choosing one in the computer form.</summary>
public static class ListProcessors
{
    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app) =>
            app.MapGet("/processors", Handle)
               .WithTags("Processors")
               .WithName(nameof(ListProcessors));
    }

    internal static async Task<Ok<List<ComponentInfo>>> Handle(AppDbContext db, CancellationToken ct) =>
        TypedResults.Ok(await db.Processors
            .AsNoTracking()
            .OrderBy(p => p.Manufacturer.Name).ThenBy(p => p.Model)
            .Select(p => new ComponentInfo(p.Id, p.Manufacturer.Name, p.Model))
            .ToListAsync(ct));
}
