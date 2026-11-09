using ComputerInventory.Api.Data.Seed;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.Data;

public static partial class DatabaseExtensions
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");

        services.AddDbContext<AppDbContext>(options => options
            .UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure())
            .UseAsyncSeeding((context, _, ct) => SeedData.SeedAsync(context, ct))
            .UseSeeding((context, _) => SeedData.SeedAsync(context).GetAwaiter().GetResult()));

        return services;
    }

    /// <summary>
    /// Applies pending migrations (which also runs seeding). SQL Server can take a while to accept
    /// connections after its container starts, so keep retrying for a bounded time.
    /// </summary>
    public static async Task MigrateDatabaseAsync(this WebApplication app, CancellationToken ct = default)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(DatabaseExtensions));

        const int maxAttempts = 10;
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                await db.Database.MigrateAsync(ct);
                return;
            }
            catch (Exception ex) when (attempt < maxAttempts && ex is not OperationCanceledException)
            {
                LogDatabaseNotReady(logger, ex, attempt, maxAttempts);
                await Task.Delay(TimeSpan.FromSeconds(3), ct);
            }
        }
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Database not ready (attempt {Attempt}/{Max}); retrying")]
    private static partial void LogDatabaseNotReady(ILogger logger, Exception ex, int attempt, int max);
}
