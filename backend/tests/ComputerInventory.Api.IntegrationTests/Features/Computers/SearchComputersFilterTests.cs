using System.Net;
using System.Net.Http.Json;
using ComputerInventory.Api.Common;
using ComputerInventory.Api.Features.Computers;
using ComputerInventory.Api.Features.Lookups;

namespace ComputerInventory.Api.IntegrationTests.Features.Computers;

/// <summary>
/// Each filter runs against the seeded catalogue on real SQL Server, so these also prove
/// the LINQ translates (LIKE escaping, collation, EXISTS for USB ports).
/// </summary>
[Collection(ApiTestGroup.Name)]
public sealed class SearchComputersFilterTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<int[]> Ids(string query)
    {
        var result = await _client.GetFromJsonAsync<PagedResult<ComputerSummary>>($"/api/computers?{query}", factory.JsonOptions);
        Assert.Equal(result!.Items.Count, result.TotalCount); // all seeded data fits on one page
        return [.. result.Items.Select(c => c.Id)];
    }

    private async Task<int> ManufacturerId(string name)
    {
        var lookups = await _client.GetFromJsonAsync<GetLookups.Response>("/api/lookups", factory.JsonOptions);
        return lookups!.Manufacturers.Single(m => m.Name == name).Id;
    }

    [Theory]
    [InlineData("gtx", new[] { 1, 2, 4, 7, 8 })]
    [InlineData("GTX", new[] { 1, 2, 4, 7, 8 })]                // case-insensitive
    [InlineData("geforce gtx 1080", new[] { 4, 7 })]           // terms across one model
    [InlineData("intel radeon", new[] { 6, 10 })]              // terms across CPU and GPU (AND)
    [InlineData("nvidia", new[] { 1, 2, 4, 7, 8 })]            // manufacturer name
    [InlineData("i5-6400", new[] { 7, 8, 10 })]
    [InlineData("quantum", new int[0])]
    [InlineData("%", new int[0])]                               // LIKE wildcards are matched literally
    public async Task Search_matches_every_term(string search, int[] expected) =>
        Assert.Equal(expected, await Ids($"search={Uri.EscapeDataString(search)}"));

    [Theory]
    [InlineData("minRamMb=16384", new[] { 2, 4, 5, 6, 8 })]
    [InlineData("maxRamMb=2048", new[] { 9, 10 })]
    [InlineData("minRamMb=8192&maxRamMb=16384", new[] { 1, 2, 3, 4, 7, 8 })]
    [InlineData("minStorageGb=2000", new[] { 2, 3, 4, 6, 7, 9 })]
    [InlineData("maxStorageGb=750", new[] { 5, 8, 10 })]
    [InlineData("storageType=Ssd", new[] { 1, 5, 6, 8, 10 })]
    [InlineData("storageType=Hdd", new[] { 2, 3, 4, 7, 9 })]
    [InlineData("usbPortType=UsbC", new[] { 5, 6, 9 })]
    [InlineData("minPsuWatts=750", new[] { 5, 7, 8 })]
    public async Task Filters_by_specs(string query, int[] expected) =>
        Assert.Equal(expected, await Ids(query));

    [Fact]
    public async Task Filters_by_processor_manufacturer() =>
        Assert.Equal(new[] { 2, 3, 4, 5 }, await Ids($"processorManufacturerId={await ManufacturerId("AMD")}"));

    [Fact]
    public async Task Filters_by_graphics_card_manufacturer() =>
        Assert.Equal(new[] { 1, 2, 4, 7, 8 }, await Ids($"graphicsCardManufacturerId={await ManufacturerId("NVIDIA")}"));

    [Fact]
    public async Task Combines_filters_and_search_with_and() =>
        Assert.Equal(new[] { 6 }, await Ids("search=intel&storageType=Ssd&usbPortType=UsbC"));

    [Fact]
    public async Task Total_count_reflects_filters_not_the_page()
    {
        var result = await _client.GetFromJsonAsync<PagedResult<ComputerSummary>>(
            "/api/computers?storageType=Hdd&pageSize=2&page=2", factory.JsonOptions);

        Assert.Equal(5, result!.TotalCount);
        Assert.Equal(3, result.TotalPages);
        Assert.Equal([4, 7], result.Items.Select(c => c.Id));
    }

    [Fact]
    public async Task Unknown_enum_value_is_a_bad_request()
    {
        var response = await _client.GetAsync(new Uri("/api/computers?storageType=Nvme", UriKind.Relative));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
