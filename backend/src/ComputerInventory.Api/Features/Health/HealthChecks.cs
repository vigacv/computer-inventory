using System.Text.Json;
using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ComputerInventory.Api.Features.Health;

/// <summary>
/// Two probes, as container orchestrators expect:
/// <list type="bullet">
/// <item><c>/api/health/live</c>: the process is up (no dependencies checked), so it isn't restarted
/// just because the database is briefly unavailable.</item>
/// <item><c>/api/health/ready</c>: the database is reachable, so the API can serve requests.
/// Responds 503 otherwise.</item>
/// </list>
/// </summary>
public static class HealthChecks
{
    private const string ReadyTag = "ready";

    public static IServiceCollection AddApiHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks().AddDbContextCheck<AppDbContext>("database", tags: [ReadyTag]);
        return services;
    }

    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app)
        {
            app.MapHealthChecks("/health/live", new HealthCheckOptions
            {
                Predicate = _ => false,
                ResponseWriter = WriteJsonAsync,
            }).WithTags("Health");

            app.MapHealthChecks("/health/ready", new HealthCheckOptions
            {
                Predicate = check => check.Tags.Contains(ReadyTag),
                ResponseWriter = WriteJsonAsync,
            }).WithTags("Health");
        }
    }

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <summary>{ "status": "Healthy", "checks": [{ "name": "database", "status": "Healthy", "durationMs": 3 }] }</summary>
    private static Task WriteJsonAsync(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";
        return context.Response.WriteAsJsonAsync(new
        {
            Status = report.Status.ToString(),
            Checks = report.Entries.Select(e => new
            {
                Name = e.Key,
                Status = e.Value.Status.ToString(),
                DurationMs = (int)e.Value.Duration.TotalMilliseconds,
            }),
        }, Json);
    }
}
