using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace ComputerInventory.Api.Common;

public sealed class RateLimitingOptions
{
    public const string SectionName = "RateLimiting";
    public const string ApiPolicy = "api";

    public int PermitLimit { get; set; } = 300;
    public int WindowSeconds { get; set; } = 60;
}

public static class RateLimitingExtensions
{
    /// <summary>
    /// Fixed-window limit per client IP on the API, to throttle scraping and abuse.
    /// Rejections are returned as RFC 7807 ProblemDetails with a Retry-After header.
    /// </summary>
    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        var options = configuration.GetSection(RateLimitingOptions.SectionName).Get<RateLimitingOptions>()
            ?? new RateLimitingOptions();

        services.AddRateLimiter(limiter =>
        {
            limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            limiter.AddPolicy(RateLimitingOptions.ApiPolicy, http => RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = options.PermitLimit,
                    Window = TimeSpan.FromSeconds(options.WindowSeconds),
                    QueueLimit = 0,
                }));

            limiter.OnRejected = async (context, ct) =>
            {
                var http = context.HttpContext;
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    http.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString(System.Globalization.CultureInfo.InvariantCulture);
                }

                await http.RequestServices.GetRequiredService<IProblemDetailsService>().WriteAsync(new ProblemDetailsContext
                {
                    HttpContext = http,
                    ProblemDetails =
                    {
                        Status = StatusCodes.Status429TooManyRequests,
                        Title = "Too many requests",
                        Detail = "Request limit exceeded. Please try again later.",
                    },
                });
            };
        });

        return services;
    }
}
