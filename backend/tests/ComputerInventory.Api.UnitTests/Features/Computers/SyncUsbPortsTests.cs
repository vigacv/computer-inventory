using ComputerInventory.Api.Entities;
using ComputerInventory.Api.Features.Computers;

namespace ComputerInventory.Api.UnitTests.Features.Computers;

public sealed class SyncUsbPortsTests
{
    private static List<ComputerUsbPort> Ports(params (UsbPortType Type, int Count)[] ports) =>
        [.. ports.Select(p => new ComputerUsbPort { ComputerId = 7, PortType = p.Type, Count = p.Count })];

    private static (UsbPortType, int)[] Snapshot(IEnumerable<ComputerUsbPort> ports) =>
        [.. ports.OrderBy(p => p.PortType).Select(p => (p.PortType, p.Count))];

    [Fact]
    public void Updates_adds_and_removes_to_match()
    {
        var current = Ports((UsbPortType.Usb2, 4), (UsbPortType.Usb3, 2));

        ComputerSpecs.SyncUsbPorts(current, [new(UsbPortType.Usb3, 6), new(UsbPortType.UsbC, 1)]);

        Assert.Equal([(UsbPortType.Usb3, 6), (UsbPortType.UsbC, 1)], Snapshot(current));
    }

    [Fact]
    public void Keeps_existing_entries_instead_of_replacing_them()
    {
        var current = Ports((UsbPortType.Usb3, 2));
        var original = current[0];

        ComputerSpecs.SyncUsbPorts(current, [new(UsbPortType.Usb3, 8)]);

        // Same instance: EF sees an update, not a delete + insert of the same key.
        Assert.Same(original, Assert.Single(current));
        Assert.Equal(8, original.Count);
    }

    [Fact]
    public void Empty_desired_list_removes_everything()
    {
        var current = Ports((UsbPortType.Usb2, 4), (UsbPortType.UsbC, 1));

        ComputerSpecs.SyncUsbPorts(current, []);

        Assert.Empty(current);
    }

    [Fact]
    public void Adds_to_an_empty_list()
    {
        var current = Ports();

        ComputerSpecs.SyncUsbPorts(current, [new(UsbPortType.Usb2, 2)]);

        Assert.Equal([(UsbPortType.Usb2, 2)], Snapshot(current));
    }
}
