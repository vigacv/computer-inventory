using ComputerInventory.Api.Data;
using ComputerInventory.Api.Entities;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Features.Computers;

public sealed record UsbPortInput(UsbPortType Type, int Count);

/// <summary>The editable specification of a computer, shared by create and update requests.</summary>
public interface IComputerSpec
{
    int RamMb { get; }
    int StorageCapacityGb { get; }
    StorageType? StorageType { get; }
    int WeightGrams { get; }
    int PsuWatts { get; }
    int ProcessorId { get; }
    int GraphicsCardId { get; }
    IReadOnlyList<UsbPortInput>? UsbPorts { get; }
}

/// <summary>Sanity limits: generous for real hardware, but they catch typos like an extra zero or two.</summary>
public static class ComputerLimits
{
    public const int MaxRamMb = 1024 * 1024;       // 1 TB
    public const int MaxStorageGb = 1_000_000;     // 1 PB
    public const int MaxWeightGrams = 200_000;     // 200 kg
    public const int MaxPsuWatts = 5_000;
    public const int MaxPortsPerType = 50;
}

public sealed class ComputerSpecValidator : AbstractValidator<IComputerSpec>
{
    public ComputerSpecValidator()
    {
        RuleFor(c => c.RamMb).InclusiveBetween(1, ComputerLimits.MaxRamMb).WithName("RAM (MB)");
        RuleFor(c => c.StorageCapacityGb).InclusiveBetween(1, ComputerLimits.MaxStorageGb).WithName("Storage capacity (GB)");
        RuleFor(c => c.StorageType).NotNull().WithName("Storage type");
        RuleFor(c => c.WeightGrams).InclusiveBetween(1, ComputerLimits.MaxWeightGrams).WithName("Weight (g)");
        RuleFor(c => c.PsuWatts).InclusiveBetween(1, ComputerLimits.MaxPsuWatts).WithName("PSU wattage");
        RuleFor(c => c.ProcessorId).GreaterThan(0).WithMessage("Choose a processor.");
        RuleFor(c => c.GraphicsCardId).GreaterThan(0).WithMessage("Choose a graphics card.");

        RuleFor(c => c.UsbPorts)
            .Cascade(CascadeMode.Stop) // don't run the duplicate check on a missing list
            .NotNull()
            .Must(ports => ports!.Select(p => p.Type).Distinct().Count() == ports!.Count)
            .WithMessage("Each USB port type can only be listed once.");
        RuleForEach(c => c.UsbPorts).ChildRules(port =>
        {
            port.RuleFor(p => p.Type).IsInEnum();
            port.RuleFor(p => p.Count).InclusiveBetween(1, ComputerLimits.MaxPortsPerType).WithName("Port count");
        });
    }
}

internal static class ComputerSpecs
{
    /// <summary>
    /// Checks the referenced processor and graphics card exist. Returned as field errors,
    /// since a missing reference is a problem with what the client sent.
    /// </summary>
    public static async Task<Dictionary<string, string[]>> ValidateReferencesAsync(
        AppDbContext db, IComputerSpec spec, CancellationToken ct)
    {
        var errors = new Dictionary<string, string[]>();
        if (!await db.Processors.AnyAsync(p => p.Id == spec.ProcessorId, ct))
        {
            errors[nameof(IComputerSpec.ProcessorId)] = ["The selected processor does not exist."];
        }
        if (!await db.GraphicsCards.AnyAsync(g => g.Id == spec.GraphicsCardId, ct))
        {
            errors[nameof(IComputerSpec.GraphicsCardId)] = ["The selected graphics card does not exist."];
        }
        return errors;
    }

    /// <summary>Copies the spec onto the entity, syncing USB ports in place.</summary>
    public static void ApplyTo(this IComputerSpec spec, Computer computer)
    {
        computer.RamMb = spec.RamMb;
        computer.StorageCapacityGb = spec.StorageCapacityGb;
        computer.StorageType = spec.StorageType!.Value;
        computer.WeightGrams = spec.WeightGrams;
        computer.PsuWatts = spec.PsuWatts;
        computer.ProcessorId = spec.ProcessorId;
        computer.GraphicsCardId = spec.GraphicsCardId;
        SyncUsbPorts(computer.UsbPorts, spec.UsbPorts ?? []);
    }

    /// <summary>
    /// Makes <paramref name="current"/> match <paramref name="desired"/> by updating, removing and adding
    /// entries. Ports are keyed by (computer, type), so they're updated in place rather than replaced:
    /// deleting and re-adding the same key in one save would clash in EF's change tracker.
    /// </summary>
    internal static void SyncUsbPorts(ICollection<ComputerUsbPort> current, IEnumerable<UsbPortInput> desired)
    {
        var wanted = desired.ToDictionary(p => p.Type, p => p.Count);

        foreach (var port in current.ToList())
        {
            if (wanted.TryGetValue(port.PortType, out var count))
            {
                port.Count = count;
            }
            else
            {
                current.Remove(port);
            }
        }

        foreach (var (type, count) in wanted)
        {
            if (!current.Any(p => p.PortType == type))
            {
                current.Add(new ComputerUsbPort { PortType = type, Count = count });
            }
        }
    }
}
