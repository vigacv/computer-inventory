using ComputerInventory.Api.Common;

namespace ComputerInventory.Api.Features.Health;

public static class GetHealth
{
    public sealed record Response(string Status, DateTimeOffset Timestamp);

    public sealed class Endpoint : IEndpoint
    {
        public void Map(IEndpointRouteBuilder app) =>
            app.MapGet("/health", Handle)
               .WithTags("Health")
               .WithName(nameof(GetHealth));
    }

    internal static Response Handle(TimeProvider clock) => new("Healthy", clock.GetUtcNow());
}
