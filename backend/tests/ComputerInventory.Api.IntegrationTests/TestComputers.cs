using ComputerInventory.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.IntegrationTests;

/// <summary>
/// A computer created directly in the database for one test and deleted afterwards, so tests that
/// change data never touch the seeded catalogue other tests rely on. (Tests in the shared
/// collection run one at a time, so read tests never see it.)
/// </summary>
public sealed class TestComputer(ApiFactory factory, int id) : IAsyncDisposable
{
    public int Id { get; } = id;

    public static async Task<TestComputer> CreateAsync(ApiFactory factory)
    {
        await using var db = factory.CreateDbContext();
        var computer = new Computer
        {
            RamMb = 8192,
            StorageCapacityGb = 1000,
            StorageType = StorageType.Hdd,
            WeightGrams = 5000,
            PsuWatts = 400,
            ProcessorId = await db.Processors.OrderBy(p => p.Id).Select(p => p.Id).FirstAsync(),
            GraphicsCardId = await db.GraphicsCards.OrderBy(g => g.Id).Select(g => g.Id).FirstAsync(),
            UsbPorts = [new ComputerUsbPort { PortType = UsbPortType.Usb2, Count = 2 }],
        };
        db.Computers.Add(computer);
        await db.SaveChangesAsync();
        return new TestComputer(factory, computer.Id);
    }

    public async ValueTask DisposeAsync()
    {
        await using var db = factory.CreateDbContext();
        await db.Computers.Where(c => c.Id == Id).ExecuteDeleteAsync();
    }
}
