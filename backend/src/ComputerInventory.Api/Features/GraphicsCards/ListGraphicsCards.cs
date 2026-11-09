using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using ComputerInventory.Api.Features.Computers;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.GraphicsCards;

/// <summary>All graphics cards, for choosing one in the computer form.</summary>
public static class ListGraphicsCards
{
    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app) =>
            app.MapGet("/graphics-cards", Handle)
               .WithTags("Graphics cards")
               .WithName(nameof(ListGraphicsCards));
    }

    internal static async Task<Ok<List<ComponentInfo>>> Handle(AppDbContext db, CancellationToken ct) =>
        TypedResults.Ok(await db.GraphicsCards
            .AsNoTracking()
            .OrderBy(g => g.Manufacturer.Name).ThenBy(g => g.Model)
            .Select(g => new ComponentInfo(g.Id, g.Manufacturer.Name, g.Model))
            .ToListAsync(ct));
}
