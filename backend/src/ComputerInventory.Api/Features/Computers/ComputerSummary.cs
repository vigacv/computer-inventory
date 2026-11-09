using System.Linq.Expressions;
using ComputerInventory.Api.Entities;

namespace ComputerInventory.Api.Features.Computers;

public sealed record ComponentInfo(int Id, string Manufacturer, string Model);

public sealed record UsbPortInfo(UsbPortType Type, int Count);

/// <summary>A computer as shown in lists. Measurements are in canonical units; the client formats them.</summary>
public sealed record ComputerSummary(
    int Id,
    int RamMb,
    int StorageCapacityGb,
    StorageType StorageType,
    int WeightGrams,
    int PsuWatts,
    ComponentInfo Processor,
    ComponentInfo GraphicsCard,
    IReadOnlyList<UsbPortInfo> UsbPorts)
{
    /// <summary>Translated to SQL by EF, so only the needed columns are read.</summary>
    public static readonly Expression<Func<Computer, ComputerSummary>> Projection = c => new ComputerSummary(
        c.Id,
        c.RamMb,
        c.StorageCapacityGb,
        c.StorageType,
        c.WeightGrams,
        c.PsuWatts,
        new ComponentInfo(c.Processor.Id, c.Processor.Manufacturer.Name, c.Processor.Model),
        new ComponentInfo(c.GraphicsCard.Id, c.GraphicsCard.Manufacturer.Name, c.GraphicsCard.Model),
        c.UsbPorts
            .OrderBy(p => p.PortType)
            .Select(p => new UsbPortInfo(p.PortType, p.Count))
            .ToList());
}
