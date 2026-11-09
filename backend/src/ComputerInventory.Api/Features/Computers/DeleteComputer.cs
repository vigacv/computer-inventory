using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.Computers;

/// <summary>Deletes a computer; its USB ports go with it (cascade delete in the database).</summary>
public static class DeleteComputer
{
    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app) =>
            app.MapDelete("/computers/{id:int}", Handle)
               .WithTags("Computers")
               .WithName(nameof(DeleteComputer))
               .ProducesProblem(StatusCodes.Status404NotFound);
    }

    internal static async Task<Results<NoContent, ProblemHttpResult>> Handle(int id, AppDbContext db, CancellationToken ct)
    {
        // A single DELETE statement: no need to load the computer first.
        var deleted = await db.Computers.Where(c => c.Id == id).ExecuteDeleteAsync(ct);

        return deleted == 0
            ? TypedResults.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Computer not found",
                detail: $"There is no computer with id {id}.")
            : TypedResults.NoContent();
    }
}
