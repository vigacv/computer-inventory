using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using ComputerInventory.Api.Entities;
using ComputerInventory.Api.Features.Components;
using ComputerInventory.Api.Features.Computers;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.Processors;

/// <summary>Adds a processor, creating its manufacturer if it's new. Duplicate models are field errors.</summary>
public static class CreateProcessor
{
    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app) =>
            app.MapPost("/processors", Handle)
               .WithValidation<NewComponent>()
               .WithTags("Processors")
               .WithName(nameof(CreateProcessor));
    }

    internal static async Task<Results<Created<ComponentInfo>, ValidationProblem>> Handle(
        NewComponent request, AppDbContext db, CancellationToken ct)
    {
        var manufacturer = await ComponentCreation.FindOrAddManufacturerAsync(db, request.ManufacturerName, ct);

        var exists = manufacturer.Id != 0 &&
            await db.Processors.AnyAsync(p => p.ManufacturerId == manufacturer.Id && p.Model == request.ModelName, ct);
        if (exists)
        {
            return TypedResults.ValidationProblem(ComponentCreation.DuplicateError("processor"));
        }

        var processor = db.Processors.Add(new Processor { Manufacturer = manufacturer, Model = request.ModelName }).Entity;
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ComponentCreation.IsUniqueViolation(ex))
        {
            return TypedResults.ValidationProblem(ComponentCreation.DuplicateError("processor"));
        }

        return TypedResults.Created((string?)null, new ComponentInfo(processor.Id, manufacturer.Name, processor.Model));
    }
}
