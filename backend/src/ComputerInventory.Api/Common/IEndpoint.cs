namespace ComputerInventory.Api.Common;

/// <summary>
/// Implemented by every feature slice to register its own route(s).
/// Slices are discovered automatically via <see cref="EndpointExtensions"/>.
/// </summary>
public interface IEndpoint
{
    void Map(IEndpointRouteBuilder app);
}
