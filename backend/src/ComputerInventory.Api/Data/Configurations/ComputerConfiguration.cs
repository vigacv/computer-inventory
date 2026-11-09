using ComputerInventory.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ComputerInventory.Api.Data.Configurations;

internal sealed class ComputerConfiguration : IEntityTypeConfiguration<Computer>
{
    public void Configure(EntityTypeBuilder<Computer> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Computers_RamMb", "[RamMb] > 0");
            t.HasCheckConstraint("CK_Computers_StorageCapacityGb", "[StorageCapacityGb] > 0");
            t.HasCheckConstraint("CK_Computers_WeightGrams", "[WeightGrams] > 0");
            t.HasCheckConstraint("CK_Computers_PsuWatts", "[PsuWatts] > 0");
            t.HasCheckConstraint("CK_Computers_StorageType", CheckConstraints.InEnum<StorageType>(nameof(Computer.StorageType)));
        });

        builder.Property(c => c.StorageType).HasConversion<string>().HasMaxLength(10);
        builder.Property(c => c.RowVersion).IsRowVersion();

        builder.HasOne(c => c.Processor)
            .WithMany()
            .HasForeignKey(c => c.ProcessorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.GraphicsCard)
            .WithMany()
            .HasForeignKey(c => c.GraphicsCardId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.UsbPorts)
            .WithOne()
            .HasForeignKey(p => p.ComputerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
