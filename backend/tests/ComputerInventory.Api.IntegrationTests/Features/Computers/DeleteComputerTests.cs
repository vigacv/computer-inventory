using System.Net;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.IntegrationTests.Features.Computers;

[Collection(ApiTestGroup.Name)]
public sealed class DeleteComputerTests(ApiFactory factory) : IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateClient();
    private TestComputer _computer = null!;

    public async Task InitializeAsync() => _computer = await TestComputer.CreateAsync(factory);

    public async Task DisposeAsync() => await _computer.DisposeAsync(); // no-op if the test deleted it

    private Task<HttpResponseMessage> Delete(int id) =>
        _client.DeleteAsync(new Uri($"/api/computers/{id}", UriKind.Relative));

    [Fact]
    public async Task Deletes_the_computer_and_its_usb_ports()
    {
        var response = await Delete(_computer.Id);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync(new Uri($"/api/computers/{_computer.Id}", UriKind.Relative))).StatusCode);
        await using var db = factory.CreateDbContext();
        Assert.False(await db.ComputerUsbPorts.AnyAsync(p => p.ComputerId == _computer.Id));
    }

    [Fact]
    public async Task Deleting_twice_is_not_found_the_second_time()
    {
        await Delete(_computer.Id);

        var response = await Delete(_computer.Id);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Deletes_only_that_computer()
    {
        await using var db = factory.CreateDbContext();
        var before = await db.Computers.CountAsync();

        await Delete(_computer.Id);

        Assert.Equal(before - 1, await db.Computers.CountAsync());
    }
}
