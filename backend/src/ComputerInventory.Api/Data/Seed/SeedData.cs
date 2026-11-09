using ComputerInventory.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Data.Seed;

/// <summary>
/// Initial catalogue, already normalized into canonical units
/// (RAM in MB, storage in decimal GB, weight in grams, PSU in watts).
/// Runs only when the database is empty, so it's safe to call on every startup.
/// </summary>
public static class SeedData
{
    public static async Task SeedAsync(DbContext context, CancellationToken ct = default)
    {
        var db = (AppDbContext)context;
        if (await db.Manufacturers.AnyAsync(ct))
        {
            return;
        }

        var intel = new Manufacturer { Name = "Intel" };
        var amd = new Manufacturer { Name = "AMD" };
        var nvidia = new Manufacturer { Name = "NVIDIA" };

        var celeronN3050 = Cpu(intel, "Celeron N3050");
        var fx4300 = Cpu(amd, "FX-4300");
        var athlon5150 = Cpu(amd, "Athlon 5150");
        var fx8350 = Cpu(amd, "FX-8350");
        var fx8370 = Cpu(amd, "FX-8370");
        var i7_6700K = Cpu(intel, "Core i7-6700K");
        var i5_6400 = Cpu(intel, "Core i5-6400");
        var i7Extreme = Cpu(intel, "Core i7 Extreme Edition");

        var gtx770 = Gpu(nvidia, "GeForce GTX 770");
        var gtx960 = Gpu(nvidia, "GeForce GTX 960");
        var gtx1080 = Gpu(nvidia, "GeForce GTX 1080");
        var r7_360 = Gpu(amd, "Radeon R7 360");
        var rx480 = Gpu(amd, "Radeon RX 480");
        var r9_380 = Gpu(amd, "Radeon R9 380");
        var w4100 = Gpu(amd, "FirePro W4100");

        db.Computers.AddRange(
            Pc(8 * Gb, 1000, StorageType.Ssd, Kg(8.1), 500, celeronN3050, gtx770, (UsbPortType.Usb3, 2), (UsbPortType.Usb2, 4)),
            Pc(16 * Gb, 2000, StorageType.Hdd, Kg(12), 500, fx4300, gtx960, (UsbPortType.Usb3, 3), (UsbPortType.Usb2, 4)),
            Pc(8 * Gb, 3000, StorageType.Hdd, Lb(16), 450, athlon5150, r7_360, (UsbPortType.Usb3, 4), (UsbPortType.Usb2, 4)),
            Pc(16 * Gb, 4000, StorageType.Hdd, Lb(13.8), 500, fx8350, gtx1080, (UsbPortType.Usb2, 5), (UsbPortType.Usb3, 4)),
            Pc(32 * Gb, 750, StorageType.Ssd, Kg(7), 1000, fx8370, rx480, (UsbPortType.Usb3, 2), (UsbPortType.Usb2, 2), (UsbPortType.UsbC, 1)),
            Pc(32 * Gb, 2000, StorageType.Ssd, Kg(6), 450, i7_6700K, r9_380, (UsbPortType.UsbC, 2), (UsbPortType.Usb3, 4)),
            Pc(8 * Gb, 2000, StorageType.Hdd, Lb(15), 1000, i5_6400, gtx1080, (UsbPortType.Usb3, 8)),
            Pc(16 * Gb, 500, StorageType.Ssd, Lb(8), 750, i5_6400, gtx770, (UsbPortType.Usb2, 4)),
            Pc(2 * Gb, 2000, StorageType.Hdd, Kg(9), 508, i7Extreme, w4100, (UsbPortType.Usb3, 10), (UsbPortType.Usb2, 10), (UsbPortType.UsbC, 10)),
            Pc(512, 80, StorageType.Ssd, Lb(22), 700, i5_6400, rx480, (UsbPortType.Usb3, 19), (UsbPortType.Usb2, 4)));

        await db.SaveChangesAsync(ct);
    }

    private const int Gb = 1024;
    private const double GramsPerPound = 453.59237;

    private static int Kg(double kg) => (int)Math.Round(kg * 1000);
    private static int Lb(double lb) => (int)Math.Round(lb * GramsPerPound);

    private static Processor Cpu(Manufacturer manufacturer, string model) =>
        new() { Manufacturer = manufacturer, Model = model };

    private static GraphicsCard Gpu(Manufacturer manufacturer, string model) =>
        new() { Manufacturer = manufacturer, Model = model };

    private static Computer Pc(
        int ramMb, int storageGb, StorageType storageType, int weightGrams, int psuWatts,
        Processor cpu, GraphicsCard gpu, params (UsbPortType Type, int Count)[] usb) => new()
    {
        RamMb = ramMb,
        StorageCapacityGb = storageGb,
        StorageType = storageType,
        WeightGrams = weightGrams,
        PsuWatts = psuWatts,
        Processor = cpu,
        GraphicsCard = gpu,
        UsbPorts = [.. usb.Select(u => new ComputerUsbPort { PortType = u.Type, Count = u.Count })],
    };
}
