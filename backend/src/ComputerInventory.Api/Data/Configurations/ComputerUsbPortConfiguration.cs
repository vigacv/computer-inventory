using ComputerInventory.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ComputerInventory.Api.Data.Configurations;

internal sealed class ComputerUsbPortConfiguration : IEntityTypeConfiguration<ComputerUsbPort>
{
    public void Configure(EntityTypeBuilder<ComputerUsbPort> builder)
    {
        builder.HasKey(p => new { p.ComputerId, p.PortType });

        builder.Property(p => p.PortType).HasConversion<string>().HasMaxLength(10);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_ComputerUsbPorts_Count", "[Count] > 0");
            t.HasCheckConstraint("CK_ComputerUsbPorts_PortType", CheckConstraints.InEnum<UsbPortType>(nameof(ComputerUsbPort.PortType)));
        });
    }
}
