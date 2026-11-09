using System.Text.Json;
using ComputerInventory.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Testcontainers.MsSql;

namespace ComputerInventory.Api.IntegrationTests;

/// <summary>
/// Boots the real API against a throwaway SQL Server container. Startup applies migrations
/// and seeds the database exactly like the real app does.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MsSqlContainer _database = new MsSqlBuilder("mcr.microsoft.com/mssql/server:2022-latest").Build();

    public string ConnectionString => new SqlConnectionStringBuilder(_database.GetConnectionString())
    {
        InitialCatalog = "ComputerInventoryTests",
    }.ConnectionString;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Default", ConnectionString);
        // The whole suite shares one client "IP": keep the limiter out of the way, except in the
        // test that checks it (which sets its own low limit).
        builder.UseSetting("RateLimiting:PermitLimit", "1000000");
    }

    /// <summary>The API's own JSON settings, so tests read responses exactly like the API writes them.</summary>
    public JsonSerializerOptions JsonOptions =>
        Services.GetRequiredService<IOptions<Microsoft.AspNetCore.Http.Json.JsonOptions>>().Value.SerializerOptions;

    /// <summary>A context configured exactly like the app's. Dispose it when done.</summary>
    public AppDbContext CreateDbContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseSqlServer(ConnectionString).Options);

    public Task InitializeAsync() => _database.StartAsync();

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _database.DisposeAsync();
        await DisposeAsync();
    }
}

[CollectionDefinition(Name)]
public sealed class ApiTestGroup : ICollectionFixture<ApiFactory>
{
    public const string Name = "Api";
}
