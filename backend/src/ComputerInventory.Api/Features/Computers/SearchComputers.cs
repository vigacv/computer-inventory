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
        var query = ApplyFilters(db.Computers.AsNoTracking(), request);

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

    private static IQueryable<Computer> ApplyFilters(IQueryable<Computer> query, Request request)
    {
        // Each term narrows the results (AND); a term may match any component field (OR).
        // EF translates Contains to LIKE with wildcards escaped, and SQL Server's default collation is case-insensitive.
        foreach (var term in request.SearchTerms)
        {
            query = query.Where(c =>
                c.Processor.Model.Contains(term) ||
                c.Processor.Manufacturer.Name.Contains(term) ||
                c.GraphicsCard.Model.Contains(term) ||
                c.GraphicsCard.Manufacturer.Name.Contains(term));
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
}
