namespace ComputerInventory.Api.Entities;

/// <summary>Entities whose creation/modification times are stamped automatically on save.</summary>
public interface IAuditable
{
    DateTimeOffset CreatedAt { get; set; }
    DateTimeOffset UpdatedAt { get; set; }
}
