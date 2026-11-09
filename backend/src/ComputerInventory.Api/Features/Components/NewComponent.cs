using System.Text.RegularExpressions;
using ComputerInventory.Api.Data;
using ComputerInventory.Api.Entities;
using FluentValidation;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.Components;

/// <summary>
/// A processor or graphics card to add. The manufacturer is given by name: an existing one is
/// reused (case-insensitive), otherwise it's created, so new brands can be added from the form.
/// </summary>
public sealed record NewComponent(string? Manufacturer, string? Model)
{
    /// <summary>Trimmed, with runs of whitespace collapsed ("  Core   i9 " → "Core i9").</summary>
    public string ManufacturerName => Normalize(Manufacturer);

    public string ModelName => Normalize(Model);

    private static string Normalize(string? value) => Regex.Replace(value ?? "", @"\s+", " ").Trim();
}

public sealed class NewComponentValidator : AbstractValidator<NewComponent>
{
    public const int MaxManufacturerLength = 100;
    public const int MaxModelLength = 150;

    public NewComponentValidator()
    {
        RuleFor(c => c.ManufacturerName)
            .NotEmpty().WithMessage("Enter the manufacturer.")
            .MaximumLength(MaxManufacturerLength)
            .OverridePropertyName(nameof(NewComponent.Manufacturer));
        RuleFor(c => c.ModelName)
            .NotEmpty().WithMessage("Enter the model.")
            .MaximumLength(MaxModelLength)
            .OverridePropertyName(nameof(NewComponent.Model));
    }
}

internal static class ComponentCreation
{
    /// <summary>The manufacturer with this name (any casing), or a new one added to the context.</summary>
    public static async Task<Manufacturer> FindOrAddManufacturerAsync(AppDbContext db, string name, CancellationToken ct) =>
        // SQL Server's default collation compares case-insensitively, so "intel" finds "Intel".
        await db.Manufacturers.SingleOrDefaultAsync(m => m.Name == name, ct)
        ?? db.Manufacturers.Add(new Manufacturer { Name = name }).Entity;

    public static Dictionary<string, string[]> DuplicateError(string kind) =>
        new() { [nameof(NewComponent.Model)] = [$"This {kind} already exists for that manufacturer."] };

    /// <summary>
    /// A unique index rejected the insert: someone added the same model (or manufacturer) between our
    /// check and our save. Reported like the up-front duplicate check.
    /// </summary>
    public static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqlException { Number: 2601 or 2627 };
}
