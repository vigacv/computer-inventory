using System.Globalization;
using System.Text.Json.Serialization;
using ComputerInventory.Api.Common;
using ComputerInventory.Api.Data;
using ComputerInventory.Api.Features.Health;
using FluentValidation;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddSingleton(TimeProvider.System);
// API messages are always English, whatever the server's locale (FluentValidation localizes by default).
ValidatorOptions.Global.LanguageManager.Culture = CultureInfo.InvariantCulture;
builder.Services.AddValidatorsFromAssemblyContaining<Program>(includeInternalTypes: true);
builder.Services.AddApiCors(builder.Configuration);
builder.Services.AddApiRateLimiting(builder.Configuration);
builder.Services.AddEndpoints(typeof(Program).Assembly);
builder.Services.AddDatabase(builder.Configuration);
builder.Services.AddApiHealthChecks();

var app = builder.Build();

// Applying migrations on startup is convenient for local runs and the Docker demo. With several
// instances or stricter change control, run them as a separate deployment step instead.
if (app.Configuration.GetValue("Database:MigrateOnStartup", defaultValue: !app.Environment.IsProduction()))
{
    await app.MigrateDatabaseAsync();
}

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();
app.UseRateLimiter();

// API docs: always in Development; elsewhere only when enabled (e.g. the Docker demo).
if (app.Configuration.GetValue("ApiDocs:Enabled", defaultValue: app.Environment.IsDevelopment()))
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapEndpoints();

await app.RunAsync();

// Exposed for WebApplicationFactory in integration tests.
public partial class Program;
