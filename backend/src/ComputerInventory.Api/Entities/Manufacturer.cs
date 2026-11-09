namespace ComputerInventory.Api.Entities;

/// <summary>
/// A hardware vendor. Shared by processors and graphics cards (e.g. AMD makes both),
/// which enables queries like "all-AMD machines".
/// </summary>
public class Manufacturer
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public ICollection<Processor> Processors { get; } = [];
    public ICollection<GraphicsCard> GraphicsCards { get; } = [];
}
