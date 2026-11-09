using System.Net.Http.Json;
using ComputerInventory.Api.Features.Computers;

namespace ComputerInventory.Api.IntegrationTests.Features.Components;

[Collection(ApiTestGroup.Name)]
public sealed class ListComponentsTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<List<string>> Names(string url) =>
        [.. (await _client.GetFromJsonAsync<List<ComponentInfo>>(url, factory.JsonOptions))!
            .Select(c => $"{c.Manufacturer} {c.Model}")];

    [Fact]
    public async Task Lists_processors_by_manufacturer_then_model() =>
        Assert.Equal(
            ["AMD Athlon 5150", "AMD FX-4300", "AMD FX-8350", "AMD FX-8370",
             "Intel Celeron N3050", "Intel Core i5-6400", "Intel Core i7 Extreme Edition", "Intel Core i7-6700K"],
            await Names("/api/processors"));

    [Fact]
    public async Task Lists_graphics_cards_by_manufacturer_then_model() =>
        Assert.Equal(
            ["AMD FirePro W4100", "AMD Radeon R7 360", "AMD Radeon R9 380", "AMD Radeon RX 480",
             "NVIDIA GeForce GTX 1080", "NVIDIA GeForce GTX 770", "NVIDIA GeForce GTX 960"],
            await Names("/api/graphics-cards"));
}
