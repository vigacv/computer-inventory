using System.Net.Http.Json;
using ComputerInventory.Api.Entities;
using ComputerInventory.Api.Features.Lookups;

namespace ComputerInventory.Api.IntegrationTests.Features.Lookups;

[Collection(ApiTestGroup.Name)]
public sealed class GetLookupsTests(ApiFactory factory)
{
    [Fact]
    public async Task Returns_manufacturers_sorted_and_enum_values()
    {
        var lookups = await factory.CreateClient()
            .GetFromJsonAsync<GetLookups.Response>("/api/lookups", factory.JsonOptions);

        Assert.NotNull(lookups);
        Assert.Equal(["AMD", "Intel", "NVIDIA"], lookups.Manufacturers.Select(m => m.Name));
        Assert.Equal([StorageType.Hdd, StorageType.Ssd], lookups.StorageTypes);
        Assert.Equal([UsbPortType.Usb2, UsbPortType.Usb3, UsbPortType.UsbC], lookups.UsbPortTypes);
    }

    [Fact]
    public async Task Serializes_enums_as_strings()
    {
        var json = await factory.CreateClient().GetStringAsync(new Uri("/api/lookups", UriKind.Relative));

        Assert.Contains("\"usbPortTypes\":[\"Usb2\",\"Usb3\",\"UsbC\"]", json, StringComparison.Ordinal);
    }
}
