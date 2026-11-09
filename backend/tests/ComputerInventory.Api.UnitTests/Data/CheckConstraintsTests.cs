using ComputerInventory.Api.Data.Configurations;
using ComputerInventory.Api.Entities;

namespace ComputerInventory.Api.UnitTests.Data;

public sealed class CheckConstraintsTests
{
    [Fact]
    public void Builds_in_clause_from_every_enum_member() =>
        Assert.Equal("[PortType] IN ('Usb2', 'Usb3', 'UsbC')", CheckConstraints.InEnum<UsbPortType>("PortType"));

    [Fact]
    public void Uses_enum_names_as_stored_by_the_string_converter() =>
        Assert.Equal("[StorageType] IN ('Hdd', 'Ssd')", CheckConstraints.InEnum<StorageType>("StorageType"));
}
