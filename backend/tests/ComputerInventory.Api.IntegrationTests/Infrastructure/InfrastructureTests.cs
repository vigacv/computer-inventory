using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;

namespace ComputerInventory.Api.IntegrationTests.Infrastructure;

[Collection(ApiTestGroup.Name)]
public sealed class InfrastructureTests(ApiFactory factory)
{
    [Fact]
    public void Model_has_no_pending_changes_without_a_migration()
    {
        using var db = factory.CreateDbContext();

        Assert.False(db.Database.HasPendingModelChanges(),
            "The EF model changed without a migration. Run: dotnet ef migrations add <Name>");
    }

    [Fact]
    public async Task Health_endpoint_responds()
    {
        var response = await factory.CreateClient().GetAsync(new Uri("/api/health", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Requests_over_the_rate_limit_get_429_problem_details()
    {
        using var limitedFactory = factory.WithWebHostBuilder(b => b.UseSetting("RateLimiting:PermitLimit", "2"));
        var client = limitedFactory.CreateClient();
        var uri = new Uri("/api/health", UriKind.Relative);

        await client.GetAsync(uri);
        await client.GetAsync(uri);
        var response = await client.GetAsync(uri);

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(TestJson.Options);
        Assert.Equal(429, problem?.Status);
    }
}
