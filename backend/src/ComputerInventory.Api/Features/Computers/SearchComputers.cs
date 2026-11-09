using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using ComputerInventory.Api.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.Computers;

/// <summary>Paged, sorted list of computers.</summary>
public static class SearchComputers
{
    public const int MaxPageSize = 100;

    public sealed record Request(int Page = 1, int PageSize = 25, string? SortBy = null, string? SortDir = null)
    {
        public bool Descending => string.Equals(SortDir, "desc", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Allowed sort keys mapped to their ordering. Unknown keys are rejected by the validator.</summary>
    private static readonly Dictionary<string, Func<IQueryable<Computer>, bool, IOrderedQueryable<Computer>>> Sorts =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["id"] = (q, desc) => q.OrderBy(c => c.Id, desc),
            ["ramMb"] = (q, desc) => q.OrderBy(c => c.RamMb, desc),
            ["storageCapacityGb"] = (q, desc) => q.OrderBy(c => c.StorageCapacityGb, desc),
            ["weightGrams"] = (q, desc) => q.OrderBy(c => c.WeightGrams, desc),
            ["psuWatts"] = (q, desc) => q.OrderBy(c => c.PsuWatts, desc),
            ["processor"] = (q, desc) => q.OrderBy(c => c.Processor.Manufacturer.Name, desc).ThenBy(c => c.Processor.Model, desc),
            ["graphicsCard"] = (q, desc) => q.OrderBy(c => c.GraphicsCard.Manufacturer.Name, desc).ThenBy(c => c.GraphicsCard.Model, desc),
        };

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(r => r.Page).GreaterThanOrEqualTo(1);
            RuleFor(r => r.PageSize).InclusiveBetween(1, MaxPageSize);
            RuleFor(r => r.SortBy)
                .Must(s => s is null || Sorts.ContainsKey(s))
                .WithMessage($"SortBy must be one of: {string.Join(", ", Sorts.Keys)}.");
            RuleFor(r => r.SortDir)
                .Must(s => s is null || s.Equals("asc", StringComparison.OrdinalIgnoreCase) || s.Equals("desc", StringComparison.OrdinalIgnoreCase))
                .WithMessage("SortDir must be 'asc' or 'desc'.");
        }
    }

    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app) =>
            app.MapGet("/computers", Handle)
               .WithValidation<Request>()
               .WithTags("Computers")
               .WithName(nameof(SearchComputers));
    }

    internal static async Task<Ok<PagedResult<ComputerSummary>>> Handle(
        [AsParameters] Request request, AppDbContext db, CancellationToken ct)
    {
        var query = db.Computers.AsNoTracking();

        var totalCount = await query.CountAsync(ct);

        var sort = request.SortBy is null ? Sorts["id"] : Sorts[request.SortBy];
        var items = await sort(query, request.Descending)
            .ThenBy(c => c.Id) // deterministic paging when sort keys tie
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(ComputerSummary.Projection)
            .ToListAsync(ct);

        return TypedResults.Ok(new PagedResult<ComputerSummary>(items, request.Page, request.PageSize, totalCount));
    }
}
