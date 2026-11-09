using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;

namespace ComputerInventory.Api.IntegrationTests.Infrastructure;

[Collection(ApiTestGroup.Name)]
public sealed class HealthCheckTests(ApiFactory factory)
{
    private static async Task<(HttpStatusCode Status, JsonElement Body)> Get(HttpClient client, string path)
    {
        var response = await client.GetAsync(new Uri(path, UriKind.Relative));
        return (response.StatusCode, JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement);
    }

    [Fact]
    public async Task Ready_checks_the_database()
    {
        var (status, body) = await Get(factory.CreateClient(), "/api/health/ready");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal("Healthy", body.GetProperty("status").GetString());
        var check = Assert.Single(body.GetProperty("checks").EnumerateArray());
        Assert.Equal("database", check.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Without_a_database_ready_fails_but_live_stays_up()
    {
        // Nothing listens on port 1; also don't try to migrate on startup, which would fail.
        using var broken = factory.WithWebHostBuilder(b => b
            .UseSetting("ConnectionStrings:Default", "Server=127.0.0.1,1;Database=x;User Id=sa;Password=x;Connect Timeout=1;TrustServerCertificate=True")
            .UseSetting("Database:MigrateOnStartup", "false"));
        var client = broken.CreateClient();

        var (readyStatus, readyBody) = await Get(client, "/api/health/ready");
        var (liveStatus, _) = await Get(client, "/api/health/live");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, readyStatus);
        Assert.Equal("Unhealthy", readyBody.GetProperty("status").GetString());
        Assert.Equal(HttpStatusCode.OK, liveStatus);
    }
}
