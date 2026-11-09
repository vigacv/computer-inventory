using System.Net;
using System.Net.Http.Json;
using ComputerInventory.Api.Features.Computers;
using Microsoft.AspNetCore.Http;

namespace ComputerInventory.Api.IntegrationTests.Features.Computers;

[Collection(ApiTestGroup.Name)]
public sealed class CompareComputersTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    private static string Url(params int[] ids) => "/api/computers/compare?" + string.Join('&', ids.Select(id => $"ids={id}"));

    [Fact]
    public async Task Returns_full_details_in_the_requested_order()
    {
        var result = await _client.GetFromJsonAsync<CompareComputers.Response>(Url(7, 2, 5), factory.JsonOptions);

        Assert.Equal([7, 2, 5], result!.Computers.Select(c => c.Id));
        Assert.Empty(result.NotFound);
        var five = result.Computers[2];
        Assert.Equal(("AMD", "FX-8370"), (five.Processor.Manufacturer, five.Processor.Model));
        Assert.Equal(3, five.UsbPorts.Count);
    }

    [Fact]
    public async Task Lists_ids_that_do_not_exist_instead_of_failing()
    {
        var result = await _client.GetFromJsonAsync<CompareComputers.Response>(Url(1, 999_999, 3), factory.JsonOptions);

        Assert.Equal([1, 3], result!.Computers.Select(c => c.Id));
        Assert.Equal([999_999], result.NotFound);
    }

    // Validation rules are unit-tested; this proves the validator is wired into the endpoint.
    [Fact]
    public async Task Invalid_selection_returns_validation_problem()
    {
        var response = await _client.GetAsync(new Uri(Url(1), UriKind.Relative));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(factory.JsonOptions);
        Assert.Contains("Ids", problem!.Errors.Keys);
    }

    [Fact]
    public async Task Does_not_clash_with_the_details_route()
    {
        var response = await _client.GetAsync(new Uri("/api/computers/compare", UriKind.Relative));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode); // compare endpoint, not "computer 'compare' not found"
    }
}
