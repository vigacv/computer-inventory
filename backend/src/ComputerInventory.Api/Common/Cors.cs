namespace ComputerInventory.Api.Common;

public static class CorsExtensions
{
    public const string SectionName = "Cors";

    /// <summary>
    /// Lets the SPA call the API from its own origin. Only origins listed in
    /// <c>Cors:AllowedOrigins</c> are allowed; with none configured, cross-origin calls are blocked.
    /// </summary>
    public static IServiceCollection AddApiCors(this IServiceCollection services, IConfiguration configuration)
    {
        var origins = configuration.GetSection($"{SectionName}:AllowedOrigins").Get<string[]>() ?? [];

        services.AddCors(cors => cors.AddDefaultPolicy(policy => policy
            .WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithExposedHeaders("Retry-After")));

        return services;
    }
}
