using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using ComputerInventory.Api.Entities;
using ComputerInventory.Api.Features.Components;
using ComputerInventory.Api.Features.Computers;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.GraphicsCards;

/// <summary>Adds a graphics card, creating its manufacturer if it's new. Duplicate models are field errors.</summary>
public static class CreateGraphicsCard
{
    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app) =>
            app.MapPost("/graphics-cards", Handle)
               .WithValidation<NewComponent>()
               .WithTags("Graphics cards")
               .WithName(nameof(CreateGraphicsCard));
    }

    internal static async Task<Results<Created<ComponentInfo>, ValidationProblem>> Handle(
        NewComponent request, AppDbContext db, CancellationToken ct)
    {
        var manufacturer = await ComponentCreation.FindOrAddManufacturerAsync(db, request.ManufacturerName, ct);

        var exists = manufacturer.Id != 0 &&
            await db.GraphicsCards.AnyAsync(g => g.ManufacturerId == manufacturer.Id && g.Model == request.ModelName, ct);
        if (exists)
        {
            return TypedResults.ValidationProblem(ComponentCreation.DuplicateError("graphics card"));
        }

        var card = db.GraphicsCards.Add(new GraphicsCard { Manufacturer = manufacturer, Model = request.ModelName }).Entity;
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ComponentCreation.IsUniqueViolation(ex))
        {
            return TypedResults.ValidationProblem(ComponentCreation.DuplicateError("graphics card"));
        }

        return TypedResults.Created((string?)null, new ComponentInfo(card.Id, manufacturer.Name, card.Model));
    }
}
