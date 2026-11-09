namespace ComputerInventory.Api.Domain;

public class Processor
{
    public int Id { get; set; }
    public int ManufacturerId { get; set; }
    public Manufacturer Manufacturer { get; set; } = null!;
    public required string Model { get; set; }
}
