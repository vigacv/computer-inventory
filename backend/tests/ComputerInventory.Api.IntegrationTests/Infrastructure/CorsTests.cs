using Microsoft.AspNetCore.Hosting;

namespace ComputerInventory.Api.IntegrationTests.Infrastructure;

[Collection(ApiTestGroup.Name)]
public sealed class CorsTests(ApiFactory factory)
{
    private const string AllowedOrigin = "http://localhost:5173";

    private HttpClient CreateClient() => factory
        .WithWebHostBuilder(b => b.UseSetting("Cors:AllowedOrigins:0", AllowedOrigin))
        .CreateClient();

    private static HttpRequestMessage Preflight(string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Options, new Uri("/api/computers", UriKind.Relative));
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "PUT");
        return request;
    }

    [Fact]
    public async Task Configured_origin_is_allowed()
    {
        using var request = Preflight(AllowedOrigin);

        var response = await CreateClient().SendAsync(request);

        Assert.Equal(AllowedOrigin, Assert.Single(response.Headers.GetValues("Access-Control-Allow-Origin")));
    }

    [Fact]
    public async Task Other_origins_are_not_allowed()
    {
        using var request = Preflight("https://evil.example.com");

        var response = await CreateClient().SendAsync(request);

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }
}
