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

        // Sortable grid columns. (column, Id) matches "ORDER BY column, Id" in either direction (the search
        // breaks ties by id in the sort direction), so a page is read straight from the index instead of
        // sorting the whole table: measured on 500k computers, 75 ms → 4 ms for a sorted page, for about
        // +0.03 ms per insert. They also serve the range filters.
        builder.HasIndex(c => new { c.RamMb, c.Id });
        builder.HasIndex(c => new { c.StorageCapacityGb, c.Id });
        builder.HasIndex(c => new { c.WeightGrams, c.Id });
        builder.HasIndex(c => new { c.PsuWatts, c.Id });
    }
}
