using ComputerInventory.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Manufacturer> Manufacturers => Set<Manufacturer>();
    public DbSet<Processor> Processors => Set<Processor>();
    public DbSet<GraphicsCard> GraphicsCards => Set<GraphicsCard>();
    public DbSet<Computer> Computers => Set<Computer>();
    public DbSet<ComputerUsbPort> ComputerUsbPorts => Set<ComputerUsbPort>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
}
