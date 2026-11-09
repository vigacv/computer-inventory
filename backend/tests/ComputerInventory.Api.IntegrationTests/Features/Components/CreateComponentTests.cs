using System.Net;
using System.Net.Http.Json;
using ComputerInventory.Api.Features.Components;
using ComputerInventory.Api.Features.Computers;
using ComputerInventory.Api.Features.Lookups;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.IntegrationTests.Features.Components;

/// <summary>Runs every scenario for both endpoints, which behave the same.</summary>
[Collection(ApiTestGroup.Name)]
public sealed class CreateComponentTests(ApiFactory factory) : IAsyncLifetime
{
    public static TheoryData<string> Endpoints => ["/api/processors", "/api/graphics-cards"];

    private static readonly string[] SeededManufacturers = ["AMD", "Intel", "NVIDIA"];

    private readonly HttpClient _client = factory.CreateClient();

    public Task InitializeAsync() => Task.CompletedTask;

    // Remove anything the test added (components first, then manufacturers it created).
    public async Task DisposeAsync()
    {
        await using var db = factory.CreateDbContext();
        await db.Processors.Where(p => p.Model.StartsWith("Test ")).ExecuteDeleteAsync();
        await db.GraphicsCards.Where(g => g.Model.StartsWith("Test ")).ExecuteDeleteAsync();
        await db.Manufacturers.Where(m => !SeededManufacturers.Contains(m.Name)).ExecuteDeleteAsync();
    }

    private Task<HttpResponseMessage> Post(string endpoint, string? manufacturer, string? model) =>
        _client.PostAsJsonAsync(endpoint, new NewComponent(manufacturer, model), factory.JsonOptions);

    private async Task<List<ComponentInfo>> List(string endpoint) =>
        (await _client.GetFromJsonAsync<List<ComponentInfo>>(endpoint, factory.JsonOptions))!;

    [Theory]
    [MemberData(nameof(Endpoints))]
    public async Task Adds_to_an_existing_manufacturer_matching_any_casing(string endpoint)
    {
        var response = await Post(endpoint, "  amd ", "  Test   Model 1 ");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<ComponentInfo>(factory.JsonOptions);
        Assert.Equal(("AMD", "Test Model 1"), (created!.Manufacturer, created.Model)); // canonical name, normalized model
        Assert.Contains(created, await List(endpoint));

        await using var db = factory.CreateDbContext();
        Assert.Equal(3, await db.Manufacturers.CountAsync()); // no "amd" duplicate
    }

    [Theory]
    [MemberData(nameof(Endpoints))]
    public async Task Creates_a_new_manufacturer_when_needed(string endpoint)
    {
        var response = await Post(endpoint, "Apple", "Test M3 Max");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var lookups = await _client.GetFromJsonAsync<GetLookups.Response>("/api/lookups", factory.JsonOptions);
        var apple = Assert.Single(lookups!.Manufacturers, m => m.Name == "Apple");
        Assert.Equal(endpoint == "/api/processors", apple.MakesProcessors);
        Assert.Equal(endpoint == "/api/graphics-cards", apple.MakesGraphicsCards);
    }

    [Theory]
    [MemberData(nameof(Endpoints))]
    public async Task Duplicate_model_is_a_field_error_regardless_of_casing(string endpoint)
    {
        await Post(endpoint, "Intel", "Test Duplicate");

        var response = await Post(endpoint, "INTEL", "test   duplicate");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(factory.JsonOptions);
        Assert.StartsWith("This ", Assert.Single(problem!.Errors["Model"]));
    }

    [Theory]
    [MemberData(nameof(Endpoints))]
    public async Task Same_model_under_another_manufacturer_is_allowed(string endpoint)
    {
        await Post(endpoint, "Intel", "Test Shared Name");

        var response = await Post(endpoint, "AMD", "Test Shared Name");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Theory]
    [MemberData(nameof(Endpoints))]
    public async Task Blank_names_are_rejected(string endpoint)
    {
        var response = await Post(endpoint, " ", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(factory.JsonOptions);
        Assert.Equal(["Manufacturer", "Model"], problem!.Errors.Keys.Order());
    }
}
