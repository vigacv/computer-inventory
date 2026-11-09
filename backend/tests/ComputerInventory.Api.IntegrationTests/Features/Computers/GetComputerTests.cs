using System.Net;
using System.Net.Http.Json;
using ComputerInventory.Api.Entities;
using ComputerInventory.Api.Features.Computers;
using Microsoft.AspNetCore.Mvc;

namespace ComputerInventory.Api.IntegrationTests.Features.Computers;

[Collection(ApiTestGroup.Name)]
public sealed class GetComputerTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Returns_full_details()
    {
        var computer = await _client.GetFromJsonAsync<GetComputer.Response>("/api/computers/5", factory.JsonOptions);

        Assert.NotNull(computer);
        Assert.Equal(5, computer.Id);
        Assert.Equal(32768, computer.RamMb);
        Assert.Equal(750, computer.StorageCapacityGb);
        Assert.Equal(StorageType.Ssd, computer.StorageType);
        Assert.Equal(7000, computer.WeightGrams);
        Assert.Equal(1000, computer.PsuWatts);
        Assert.Equal(("AMD", "FX-8370"), (computer.Processor.Manufacturer, computer.Processor.Model));
        Assert.Equal(("AMD", "Radeon RX 480"), (computer.GraphicsCard.Manufacturer, computer.GraphicsCard.Model));
        Assert.Equal(
            [new UsbPortInfo(UsbPortType.Usb2, 2), new UsbPortInfo(UsbPortType.Usb3, 2), new UsbPortInfo(UsbPortType.UsbC, 1)],
            computer.UsbPorts);
    }

    [Fact]
    public async Task Includes_audit_timestamps()
    {
        var computer = await _client.GetFromJsonAsync<GetComputer.Response>("/api/computers/1", factory.JsonOptions);

        Assert.NotEqual(default, computer!.CreatedAt);
        Assert.True(computer.UpdatedAt >= computer.CreatedAt);
    }

    [Fact]
    public async Task Unknown_id_returns_not_found_problem()
    {
        var response = await _client.GetAsync(new Uri("/api/computers/999999", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(factory.JsonOptions);
        Assert.Equal("Computer not found", problem!.Title);
        Assert.Equal("There is no computer with id 999999.", problem.Detail);
    }

    [Fact]
    public async Task Non_numeric_id_does_not_match_the_route()
    {
        var response = await _client.GetAsync(new Uri("/api/computers/abc", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
