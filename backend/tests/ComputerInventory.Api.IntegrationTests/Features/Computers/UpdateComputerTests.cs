using System.Net;
using System.Net.Http.Json;
using ComputerInventory.Api.Entities;
using ComputerInventory.Api.Features.Computers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.IntegrationTests.Features.Computers;

[Collection(ApiTestGroup.Name)]
public sealed class UpdateComputerTests(ApiFactory factory) : IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateClient();
    private TestComputer _computer = null!;

    public async Task InitializeAsync() => _computer = await TestComputer.CreateAsync(factory);

    public async Task DisposeAsync() => await _computer.DisposeAsync();

    private async Task<GetComputer.Response> Load() =>
        (await _client.GetFromJsonAsync<GetComputer.Response>($"/api/computers/{_computer.Id}", factory.JsonOptions))!;

    private static UpdateComputer.Request RequestFrom(GetComputer.Response c) => new(
        c.RamMb, c.StorageCapacityGb, c.StorageType, c.WeightGrams, c.PsuWatts,
        c.Processor.Id, c.GraphicsCard.Id,
        [.. c.UsbPorts.Select(p => new UsbPortInput(p.Type, p.Count))],
        c.RowVersion);

    private Task<HttpResponseMessage> Put(UpdateComputer.Request request, int? id = null) =>
        _client.PutAsJsonAsync($"/api/computers/{id ?? _computer.Id}", request, factory.JsonOptions);

    [Fact]
    public async Task Updates_specs_and_returns_the_new_state()
    {
        var before = await Load();
        var request = RequestFrom(before) with
        {
            RamMb = 65536, StorageCapacityGb = 2000, StorageType = StorageType.Ssd, WeightGrams = 7257, PsuWatts = 850,
        };

        var response = await Put(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<GetComputer.Response>(factory.JsonOptions);
        Assert.Equal((65536, 2000, StorageType.Ssd, 7257, 850),
            (updated!.RamMb, updated.StorageCapacityGb, updated.StorageType, updated.WeightGrams, updated.PsuWatts));
        Assert.Equal(before.CreatedAt, updated.CreatedAt);
        Assert.True(updated.UpdatedAt > before.UpdatedAt);
        Assert.NotEqual(before.RowVersion, updated.RowVersion);
        Assert.Equivalent(updated, await Load()); // persisted
    }

    [Fact]
    public async Task Changes_processor_and_graphics_card()
    {
        await using var db = factory.CreateDbContext();
        var cpu = await db.Processors.OrderByDescending(p => p.Id).FirstAsync();
        var gpu = await db.GraphicsCards.OrderByDescending(g => g.Id).FirstAsync();

        var response = await Put(RequestFrom(await Load()) with { ProcessorId = cpu.Id, GraphicsCardId = gpu.Id });
        var updated = await response.Content.ReadFromJsonAsync<GetComputer.Response>(factory.JsonOptions);

        Assert.Equal(cpu.Model, updated!.Processor.Model);
        Assert.Equal(gpu.Model, updated.GraphicsCard.Model);
    }

    [Fact]
    public async Task Replaces_usb_ports()
    {
        var request = RequestFrom(await Load()) with
        {
            UsbPorts = [new UsbPortInput(UsbPortType.UsbC, 2), new UsbPortInput(UsbPortType.Usb3, 4)],
        };

        var updated = await (await Put(request)).Content.ReadFromJsonAsync<GetComputer.Response>(factory.JsonOptions);

        Assert.Equal([new UsbPortInput(UsbPortType.Usb3, 4).ToInfo(), new UsbPortInput(UsbPortType.UsbC, 2).ToInfo()], updated!.UsbPorts);
    }

    [Fact]
    public async Task Usb_only_change_still_moves_version_and_timestamp()
    {
        var before = await Load();

        var updated = await (await Put(RequestFrom(before) with { UsbPorts = [] }))
            .Content.ReadFromJsonAsync<GetComputer.Response>(factory.JsonOptions);

        Assert.Empty(updated!.UsbPorts);
        Assert.NotEqual(before.RowVersion, updated.RowVersion);
        Assert.True(updated.UpdatedAt > before.UpdatedAt);
    }

    [Fact]
    public async Task Stale_version_is_rejected_with_conflict_and_nothing_changes()
    {
        var loadedByAlice = await Load();
        var loadedByBob = await Load();
        Assert.Equal(HttpStatusCode.OK, (await Put(RequestFrom(loadedByAlice) with { RamMb = 4096 })).StatusCode);

        var response = await Put(RequestFrom(loadedByBob) with { RamMb = 2048 });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(factory.JsonOptions);
        Assert.Equal("Edit conflict", problem!.Title);
        Assert.Equal(4096, (await Load()).RamMb); // Alice's change survives
    }

    [Fact]
    public async Task Stale_version_is_rejected_even_for_usb_only_changes()
    {
        var loadedByAlice = await Load();
        var loadedByBob = await Load();
        await Put(RequestFrom(loadedByAlice) with { UsbPorts = [new UsbPortInput(UsbPortType.UsbC, 1)] });

        var response = await Put(RequestFrom(loadedByBob) with { UsbPorts = [new UsbPortInput(UsbPortType.Usb3, 9)] });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Unknown_computer_is_not_found()
    {
        var response = await Put(RequestFrom(await Load()), id: 999_999);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Unknown_components_are_field_errors()
    {
        var response = await Put(RequestFrom(await Load()) with { ProcessorId = 999_999, GraphicsCardId = 999_999 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(factory.JsonOptions);
        Assert.Equal(["The selected processor does not exist."], problem!.Errors["ProcessorId"]);
        Assert.Equal(["The selected graphics card does not exist."], problem.Errors["GraphicsCardId"]);
    }

    // Validation rules are unit-tested; this proves the validator is wired into the endpoint.
    [Fact]
    public async Task Invalid_request_returns_validation_problem()
    {
        var response = await Put(RequestFrom(await Load()) with { RamMb = 0, RowVersion = null });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(factory.JsonOptions);
        Assert.Contains("RamMb", problem!.Errors.Keys);
        Assert.Contains("RowVersion", problem.Errors.Keys);
    }
}

internal static class UsbPortInputExtensions
{
    public static UsbPortInfo ToInfo(this UsbPortInput port) => new(port.Type, port.Count);
}
