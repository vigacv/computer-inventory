namespace ComputerInventory.Api.Entities;

/// <summary>
/// A computer's specification. All measurements are stored in a single canonical unit
/// so they can be compared, sorted and range-filtered; formatting happens at the edges.
/// </summary>
public class Computer : IAuditable
{
    public int Id { get; set; }

    public int RamMb { get; set; }
    public int StorageCapacityGb { get; set; }
    public StorageType StorageType { get; set; }
    public int WeightGrams { get; set; }
    public int PsuWatts { get; set; }

    public int ProcessorId { get; set; }
    public Processor Processor { get; set; } = null!;

    public int GraphicsCardId { get; set; }
    public GraphicsCard GraphicsCard { get; set; } = null!;

    public ICollection<ComputerUsbPort> UsbPorts { get; set; } = [];

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    /// <summary>SQL Server rowversion used for optimistic concurrency.</summary>
    public byte[] RowVersion { get; set; } = [];
}
