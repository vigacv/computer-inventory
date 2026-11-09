using ComputerInventory.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options, TimeProvider clock) : DbContext(options)
{
    public DbSet<Manufacturer> Manufacturers => Set<Manufacturer>();
    public DbSet<Processor> Processors => Set<Processor>();
    public DbSet<GraphicsCard> GraphicsCards => Set<GraphicsCard>();
    public DbSet<Computer> Computers => Set<Computer>();
    public DbSet<ComputerUsbPort> ComputerUsbPorts => Set<ComputerUsbPort>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        StampAuditFields();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        StampAuditFields();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void StampAuditFields()
    {
        var now = clock.GetUtcNow();

        foreach (var entry in ChangeTracker.Entries<Computer>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }
    }
}
