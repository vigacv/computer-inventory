using System.Net;
using System.Net.Http.Json;
using ComputerInventory.Api.Entities;
using ComputerInventory.Api.Features.Computers;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.IntegrationTests.Features.Computers;

[Collection(ApiTestGroup.Name)]
public sealed class CreateComputerTests(ApiFactory factory) : IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateClient();
    private readonly List<int> _created = [];

    public Task InitializeAsync() => Task.CompletedTask;

    // Remove what the test added, so the seeded catalogue stays as other tests expect it.
    public async Task DisposeAsync()
    {
        await using var db = factory.CreateDbContext();
        await db.Computers.Where(c => _created.Contains(c.Id)).ExecuteDeleteAsync();
    }

    private async Task<CreateComputer.Request> ValidRequest()
    {
        await using var db = factory.CreateDbContext();
        return new CreateComputer.Request(
            RamMb: 65536,
            StorageCapacityGb: 4000,
            StorageType: StorageType.Ssd,
            WeightGrams: 9500,
            PsuWatts: 850,
            ProcessorId: await db.Processors.Where(p => p.Model == "Core i7-6700K").Select(p => p.Id).SingleAsync(),
            GraphicsCardId: await db.GraphicsCards.Where(g => g.Model == "GeForce GTX 1080").Select(g => g.Id).SingleAsync(),
            UsbPorts: [new UsbPortInput(UsbPortType.UsbC, 2), new UsbPortInput(UsbPortType.Usb3, 4)]);
    }

    /// <summary>Posts and, on success, reads the created computer (once) and records it for cleanup.</summary>
    private async Task<(HttpResponseMessage Response, GetComputer.Response? Created)> Post(CreateComputer.Request request)
    {
        var response = await _client.PostAsJsonAsync("/api/computers", request, factory.JsonOptions);
        if (!response.IsSuccessStatusCode)
        {
            return (response, null);
        }
        var created = await response.Content.ReadFromJsonAsync<GetComputer.Response>(factory.JsonOptions);
        _created.Add(created!.Id);
        return (response, created);
    }

    [Fact]
    public async Task Creates_a_computer_and_returns_its_location_and_details()
    {
        var before = DateTimeOffset.UtcNow;

        var (response, created) = await Post(await ValidRequest());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal($"/api/computers/{created!.Id}", response.Headers.Location?.OriginalString);
        Assert.Equal((65536, 4000, StorageType.Ssd, 9500, 850),
            (created.RamMb, created.StorageCapacityGb, created.StorageType, created.WeightGrams, created.PsuWatts));
        Assert.Equal(("Intel", "Core i7-6700K"), (created.Processor.Manufacturer, created.Processor.Model));
        Assert.Equal(("NVIDIA", "GeForce GTX 1080"), (created.GraphicsCard.Manufacturer, created.GraphicsCard.Model));
        Assert.Equal([new UsbPortInfo(UsbPortType.Usb3, 4), new UsbPortInfo(UsbPortType.UsbC, 2)], created.UsbPorts);
        Assert.True(created.CreatedAt >= before.AddSeconds(-5));
        Assert.Equal(created.CreatedAt, created.UpdatedAt);
        Assert.NotEmpty(created.RowVersion);
    }

    [Fact]
    public async Task Created_computer_can_be_read_back()
    {
        var (response, created) = await Post(await ValidRequest());

        var loaded = await _client.GetFromJsonAsync<GetComputer.Response>(response.Headers.Location!, factory.JsonOptions);

        Assert.Equivalent(created, loaded);
    }

    [Fact]
    public async Task Computer_without_usb_ports_is_allowed()
    {
        var (response, _) = await Post(await ValidRequest() with { UsbPorts = [] });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Unknown_components_are_field_errors()
    {
        var (response, _) = await Post(await ValidRequest() with { ProcessorId = 999_999 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(factory.JsonOptions);
        Assert.Equal(["ProcessorId"], problem!.Errors.Keys);
    }

    [Fact]
    public async Task Invalid_request_returns_validation_problem()
    {
        var (response, _) = await Post(await ValidRequest() with { PsuWatts = 0, StorageType = null });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(factory.JsonOptions);
        Assert.Contains("PsuWatts", problem!.Errors.Keys);
        Assert.Contains("StorageType", problem.Errors.Keys);
    }
}
