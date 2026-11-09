using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using ComputerInventory.Api.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.Computers;

/// <summary>Paged, sorted, searchable and filterable list of computers.</summary>
public static class SearchComputers
{
    public const int MaxPageSize = 100;
    public const int MaxSearchLength = 100;

    /// <summary>All filters are optional and combined with AND.</summary>
    /// <remarks>
    /// Defaults must be constructor parameters: [AsParameters] binding treats a non-nullable
    /// property as required even if it has an initializer.
    /// </remarks>
    /// <param name="Search">Whitespace-separated terms; each must match the CPU or GPU model or manufacturer.</param>
    /// <param name="UsbPortType">Computers with at least one port of this type.</param>
    public sealed record Request(
        int Page = 1,
        int PageSize = 25,
        string? SortBy = null,
        string? SortDir = null,
        string? Search = null,
        int? MinRamMb = null,
        int? MaxRamMb = null,
        int? MinStorageGb = null,
        int? MaxStorageGb = null,
        StorageType? StorageType = null,
        int? ProcessorManufacturerId = null,
        int? GraphicsCardManufacturerId = null,
        UsbPortType? UsbPortType = null,
        int? MinPsuWatts = null)
    {
        public bool Descending => string.Equals(SortDir, "desc", StringComparison.OrdinalIgnoreCase);

        public string[] SearchTerms =>
            Search?.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ?? [];
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

            RuleFor(r => r.Search).MaximumLength(MaxSearchLength);

            RuleFor(r => r.MinRamMb).GreaterThan(0);
            RuleFor(r => r.MaxRamMb).GreaterThan(0);
            RuleFor(r => r.MaxRamMb)
                .GreaterThanOrEqualTo(r => r.MinRamMb).When(r => r.MinRamMb.HasValue)
                .WithMessage("MaxRamMb must be greater than or equal to MinRamMb.");

            RuleFor(r => r.MinStorageGb).GreaterThan(0);
            RuleFor(r => r.MaxStorageGb).GreaterThan(0);
            RuleFor(r => r.MaxStorageGb)
                .GreaterThanOrEqualTo(r => r.MinStorageGb).When(r => r.MinStorageGb.HasValue)
                .WithMessage("MaxStorageGb must be greater than or equal to MinStorageGb.");

            RuleFor(r => r.MinPsuWatts).GreaterThan(0);
            RuleFor(r => r.ProcessorManufacturerId).GreaterThan(0);
            RuleFor(r => r.GraphicsCardManufacturerId).GreaterThan(0);
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
        var filtered = await ApplyFiltersAsync(db, db.Computers.AsNoTracking(), request, ct);
        if (filtered is null)
        {
            // A search term matches no processor or graphics card: no need to look at computers at all.
            return TypedResults.Ok(new PagedResult<ComputerSummary>([], request.Page, request.PageSize, 0));
        }

        var totalCount = await filtered.CountAsync(ct);

        // Ids first: sorting and paging only the narrow (sort key, id) pairs is far cheaper than sorting
        // every column of every matching computer, which is what one projected query would do.
        // Ties are broken by id in the same direction, so one (column, Id) index serves both directions.
        var sort = request.SortBy is null ? Sorts["id"] : Sorts[request.SortBy];
        var pageIds = await sort(filtered, request.Descending)
            .ThenBy(c => c.Id, request.Descending)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => c.Id)
            .ToListAsync(ct);

        var byId = await db.Computers
            .AsNoTracking()
            .Where(c => pageIds.Contains(c.Id))
            .Select(ComputerSummary.Projection)
            .ToDictionaryAsync(c => c.Id, ct);

        return TypedResults.Ok(new PagedResult<ComputerSummary>(
            [.. pageIds.Select(id => byId[id])], request.Page, request.PageSize, totalCount));
    }

    /// <summary>Returns null when a search term matches no component, meaning no computer can match.</summary>
    private static async Task<IQueryable<Computer>?> ApplyFiltersAsync(
        AppDbContext db, IQueryable<Computer> query, Request request, CancellationToken ct)
    {
        // Each term must match the computer's processor or graphics card (model or manufacturer).
        // The LIKE runs on the small component tables (thousands of rows), not on every computer joined
        // to its components: a leading wildcard can't use an index, so that would scan all computers.
        // Computers are then found by component id, through the foreign key indexes.
        foreach (var term in request.SearchTerms)
        {
            var processorIds = await db.Processors
                .Where(p => p.Model.Contains(term) || p.Manufacturer.Name.Contains(term))
                .Select(p => p.Id)
                .ToListAsync(ct);
            var graphicsCardIds = await db.GraphicsCards
                .Where(g => g.Model.Contains(term) || g.Manufacturer.Name.Contains(term))
                .Select(g => g.Id)
                .ToListAsync(ct);

            if (processorIds.Count == 0 && graphicsCardIds.Count == 0)
            {
                return null;
            }

            query = WhereUsesAny(query, processorIds, graphicsCardIds);
        }

        if (request.MinRamMb is { } minRam) query = query.Where(c => c.RamMb >= minRam);
        if (request.MaxRamMb is { } maxRam) query = query.Where(c => c.RamMb <= maxRam);
        if (request.MinStorageGb is { } minStorage) query = query.Where(c => c.StorageCapacityGb >= minStorage);
        if (request.MaxStorageGb is { } maxStorage) query = query.Where(c => c.StorageCapacityGb <= maxStorage);
        if (request.StorageType is { } storageType) query = query.Where(c => c.StorageType == storageType);
        if (request.ProcessorManufacturerId is { } cpuMaker) query = query.Where(c => c.Processor.ManufacturerId == cpuMaker);
        if (request.GraphicsCardManufacturerId is { } gpuMaker) query = query.Where(c => c.GraphicsCard.ManufacturerId == gpuMaker);
        if (request.UsbPortType is { } usb) query = query.Where(c => c.UsbPorts.Any(p => p.PortType == usb));
        if (request.MinPsuWatts is { } minPsu) query = query.Where(c => c.PsuWatts >= minPsu);

        return query;
    }

    /// <summary>
    /// Computers using one of these processors or graphics cards. (Long id lists are fine: EF switches to a
    /// single JSON parameter past SQL Server's 2,100-parameter limit; covered by an integration test.)
    /// </summary>
    private static IQueryable<Computer> WhereUsesAny(IQueryable<Computer> query, List<int> processorIds, List<int> graphicsCardIds)
    {
        // A condition on a single column lets SQL Server seek its index; an OR across two columns usually can't.
        return (processorIds.Count, graphicsCardIds.Count) switch
        {
            (_, 0) => query.Where(c => processorIds.Contains(c.ProcessorId)),
            (0, _) => query.Where(c => graphicsCardIds.Contains(c.GraphicsCardId)),
            _ => query.Where(c => processorIds.Contains(c.ProcessorId) || graphicsCardIds.Contains(c.GraphicsCardId)),
        };
    }
}
