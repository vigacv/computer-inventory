using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.Computers;

/// <summary>
/// Several computers' full details in one request, for side-by-side comparison:
/// <c>GET /api/computers/compare?ids=1&amp;ids=5&amp;ids=7</c>. Ids that don't exist (e.g. deleted since the
/// comparison link was shared) are listed in <c>NotFound</c> rather than failing the whole request.
/// </summary>
public static class CompareComputers
{
    public const int MinComputers = 2;
    public const int MaxComputers = 4;

    public sealed record Request([FromQuery(Name = "ids")] int[]? Ids);

    /// <param name="Computers">In the order the ids were requested.</param>
    public sealed record Response(IReadOnlyList<GetComputer.Response> Computers, IReadOnlyList<int> NotFound);

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(r => r.Ids)
                .Cascade(CascadeMode.Stop)
                .NotNull().WithMessage($"Choose {MinComputers} to {MaxComputers} computers to compare.")
                .Must(ids => ids!.Length is >= MinComputers and <= MaxComputers)
                .WithMessage($"Choose {MinComputers} to {MaxComputers} computers to compare.")
                .Must(ids => ids!.Distinct().Count() == ids!.Length).WithMessage("Each computer can only be compared once.")
                .Must(ids => ids!.All(id => id > 0)).WithMessage("Ids must be positive.");
        }
    }

    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app) =>
            app.MapGet("/computers/compare", Handle)
               .WithValidation<Request>()
               .WithTags("Computers")
               .WithName(nameof(CompareComputers));
    }

    internal static async Task<Ok<Response>> Handle([AsParameters] Request request, AppDbContext db, CancellationToken ct)
    {
        var ids = request.Ids!;

        var found = await db.Computers
            .AsNoTracking()
            .Where(c => ids.Contains(c.Id))
            .Select(GetComputer.Response.Projection)
            .ToDictionaryAsync(c => c.Id, ct);

        return TypedResults.Ok(new Response(
            [.. ids.Where(found.ContainsKey).Select(id => found[id])],
            [.. ids.Where(id => !found.ContainsKey(id))]));
    }
}
