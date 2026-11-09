namespace ComputerInventory.Api.Domain;

/// <summary>How many ports of a given USB type a computer has.</summary>
public class ComputerUsbPort
{
    public int ComputerId { get; set; }
    public UsbPortType PortType { get; set; }
    public int Count { get; set; }
}
