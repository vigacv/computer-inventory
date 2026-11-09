using ComputerInventory.Api.Common;

namespace ComputerInventory.Api.UnitTests.Common;

public sealed class PagedResultTests
{
    [Theory]
    [InlineData(0, 25, 0)]
    [InlineData(10, 25, 1)]
    [InlineData(25, 25, 1)]
    [InlineData(26, 25, 2)]
    [InlineData(10, 3, 4)]
    [InlineData(10, 0, 0)]
    public void Total_pages_rounds_up(int totalCount, int pageSize, int expected) =>
        Assert.Equal(expected, new PagedResult<int>([], 1, pageSize, totalCount).TotalPages);
}
