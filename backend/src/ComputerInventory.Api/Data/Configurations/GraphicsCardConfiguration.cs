using ComputerInventory.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ComputerInventory.Api.Data.Configurations;

internal sealed class GraphicsCardConfiguration : IEntityTypeConfiguration<GraphicsCard>
{
    public void Configure(EntityTypeBuilder<GraphicsCard> builder)
    {
        builder.Property(g => g.Model).HasMaxLength(150);
        builder.HasIndex(g => new { g.ManufacturerId, g.Model }).IsUnique();

        builder.HasOne(g => g.Manufacturer)
            .WithMany(m => m.GraphicsCards)
            .HasForeignKey(g => g.ManufacturerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
