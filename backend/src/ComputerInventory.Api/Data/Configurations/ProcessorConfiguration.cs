using ComputerInventory.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ComputerInventory.Api.Data.Configurations;

internal sealed class ProcessorConfiguration : IEntityTypeConfiguration<Processor>
{
    public void Configure(EntityTypeBuilder<Processor> builder)
    {
        builder.Property(p => p.Model).HasMaxLength(150);
        builder.HasIndex(p => new { p.ManufacturerId, p.Model }).IsUnique();

        builder.HasOne(p => p.Manufacturer)
            .WithMany(m => m.Processors)
            .HasForeignKey(p => p.ManufacturerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
