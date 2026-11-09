using System.Net;
using System.Net.Http.Json;
using ComputerInventory.Api.Common;
using ComputerInventory.Api.Entities;
using ComputerInventory.Api.Features.Computers;
using Microsoft.AspNetCore.Http;

namespace ComputerInventory.Api.Tests.Features.Computers;

[Collection(ApiTestGroup.Name)]
public sealed class SearchComputersTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    private Task<PagedResult<ComputerSummary>?> Search(string query = "") =>
        _client.GetFromJsonAsync<PagedResult<ComputerSummary>>($"/api/computers{query}", TestJson.Options);

    [Fact]
    public async Task Returns_first_page_with_defaults()
    {
        var result = await Search();

        Assert.NotNull(result);
        Assert.Equal(1, result.Page);
        Assert.Equal(25, result.PageSize);
        Assert.Equal(10, result.TotalCount);
        Assert.Equal(10, result.Items.Count);
        Assert.Equal(Enumerable.Range(1, 10), result.Items.Select(c => c.Id));
    }

    [Fact]
    public async Task Pages_through_results()
    {
        var result = await Search("?page=4&pageSize=3");

        Assert.NotNull(result);
        Assert.Equal(4, result.TotalPages);
        Assert.Equal([10], result.Items.Select(c => c.Id));
    }

    [Fact]
    public async Task Page_past_the_end_is_empty()
    {
        var result = await Search("?page=99");

        Assert.NotNull(result);
        Assert.Empty(result.Items);
        Assert.Equal(10, result.TotalCount);
    }

    [Fact]
    public async Task Projects_components_and_usb_ports()
    {
        var result = await Search("?pageSize=1");
        var first = Assert.Single(result!.Items);

        Assert.Equal(new ComponentInfo(first.Processor.Id, "Intel", "Celeron N3050"), first.Processor);
        Assert.Equal("NVIDIA", first.GraphicsCard.Manufacturer);
        Assert.Equal(StorageType.Ssd, first.StorageType);
        Assert.Equal([new UsbPortInfo(UsbPortType.Usb2, 4), new UsbPortInfo(UsbPortType.Usb3, 2)], first.UsbPorts);
    }

    [Theory]
    [InlineData("ramMb", "asc", 512)]
    [InlineData("ramMb", "desc", 32768)]
    [InlineData("RAMMB", "DESC", 32768)] // case-insensitive
    public async Task Sorts_by_ram(string sortBy, string sortDir, int expectedFirstRam)
    {
        var result = await Search($"?sortBy={sortBy}&sortDir={sortDir}");

        Assert.Equal(expectedFirstRam, result!.Items[0].RamMb);
    }

    [Fact]
    public async Task Sorts_by_processor_manufacturer_then_model()
    {
        var result = await Search("?sortBy=processor");
        var processors = result!.Items.Select(c => $"{c.Processor.Manufacturer} {c.Processor.Model}").ToList();

        Assert.Equal(processors.Order(StringComparer.Ordinal), processors);
        Assert.StartsWith("AMD", processors[0], StringComparison.Ordinal);
    }

    [Fact]
    public async Task Ties_are_broken_by_id_for_stable_paging()
    {
        var result = await Search("?sortBy=psuWatts");
        var at500 = result!.Items.Where(c => c.PsuWatts == 500).Select(c => c.Id).ToList();

        Assert.Equal([1, 2, 4], at500);
    }

    [Theory]
    [InlineData("?page=0", "Page")]
    [InlineData("?pageSize=101", "PageSize")]
    [InlineData("?sortBy=price", "SortBy")]
    [InlineData("?sortDir=up", "SortDir")]
    public async Task Rejects_invalid_parameters(string query, string invalidField)
    {
        var response = await _client.GetAsync(new Uri($"/api/computers{query}", UriKind.Relative));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(TestJson.Options);
        Assert.Contains(invalidField, problem!.Errors.Keys);
    }
}
