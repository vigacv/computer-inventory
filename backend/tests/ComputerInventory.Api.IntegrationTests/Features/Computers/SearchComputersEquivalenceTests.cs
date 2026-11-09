using System.Net.Http.Json;
using ComputerInventory.Api.Common;
using ComputerInventory.Api.Entities;
using ComputerInventory.Api.Features.Computers;
using Microsoft.EntityFrameworkCore;

namespace ComputerInventory.Api.IntegrationTests.Features.Computers;

/// <summary>
/// The search query is optimized (component ids first, ids-first paging); these check it still returns
/// exactly what the plain definition says, against the same data.
/// </summary>
[Collection(ApiTestGroup.Name)]
public sealed class SearchComputersEquivalenceTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<PagedResult<ComputerSummary>> Search(string query) =>
        (await _client.GetFromJsonAsync<PagedResult<ComputerSummary>>($"/api/computers?{query}", factory.JsonOptions))!;

    [Theory]
    [InlineData("e")]              // matches most components
    [InlineData("a 7")]            // two broad terms
    [InlineData("amd nvidia")]     // one term per component
    [InlineData("radeon r9 380")]
    [InlineData("INTEL")]
    public async Task Search_matches_the_plain_definition(string search)
    {
        await using var db = factory.CreateDbContext();
        var all = await db.Computers
            .Select(c => new { c.Id, Cpu = c.Processor.Manufacturer.Name + " " + c.Processor.Model, Gpu = c.GraphicsCard.Manufacturer.Name + " " + c.GraphicsCard.Model })
            .ToListAsync();
        var expected = all
            .Where(c => search.Split(' ', StringSplitOptions.RemoveEmptyEntries).All(term =>
                c.Cpu.Contains(term, StringComparison.OrdinalIgnoreCase) || c.Gpu.Contains(term, StringComparison.OrdinalIgnoreCase)))
            .Select(c => c.Id)
            .Order()
            .ToList();

        var result = await Search($"search={Uri.EscapeDataString(search)}&pageSize=100");

        Assert.Equal(expected, result.Items.Select(c => c.Id));
        Assert.Equal(expected.Count, result.TotalCount);
    }

    [Fact]
    public async Task Ties_follow_the_sort_direction()
    {
        var ascending = await Search("sortBy=psuWatts&sortDir=asc");
        var descending = await Search("sortBy=psuWatts&sortDir=desc");

        Assert.Equal([1, 2, 4], ascending.Items.Where(c => c.PsuWatts == 500).Select(c => c.Id));
        Assert.Equal([4, 2, 1], descending.Items.Where(c => c.PsuWatts == 500).Select(c => c.Id));
        Assert.Equal(ascending.Items.Select(c => c.Id).Reverse(), descending.Items.Select(c => c.Id));
    }

    [Fact]
    public async Task Pages_keep_the_sort_order_and_never_repeat_or_skip()
    {
        var pages = new List<int>();
        for (var page = 1; page <= 4; page++)
        {
            pages.AddRange((await Search($"sortBy=ramMb&sortDir=desc&pageSize=3&page={page}")).Items.Select(c => c.Id));
        }

        var all = (await Search("sortBy=ramMb&sortDir=desc&pageSize=100")).Items.Select(c => c.Id);
        Assert.Equal(all, pages);
    }

    [Fact]
    public async Task Search_matching_more_components_than_sql_server_allows_parameters_still_works()
    {
        // 2,200 matching ids: more than SQL Server's 2,100-parameter limit (EF must send them another way).
        await using var db = factory.CreateDbContext();
        var amd = await db.Manufacturers.SingleAsync(m => m.Name == "AMD");
        db.Processors.AddRange(Enumerable.Range(1, 2200).Select(i => new Processor { Manufacturer = amd, Model = $"Bulkchip {i}" }));
        await db.SaveChangesAsync();
        var computer = await TestComputer.CreateAsync(factory);
        await db.Computers.Where(c => c.Id == computer.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.ProcessorId, db.Processors.Where(p => p.Model == "Bulkchip 777").Select(p => p.Id).Single()));
        try
        {
            var result = await Search("search=bulkchip");

            Assert.Equal([computer.Id], result.Items.Select(c => c.Id));
        }
        finally
        {
            await computer.DisposeAsync();
            await db.Processors.Where(p => p.Model.StartsWith("Bulkchip ")).ExecuteDeleteAsync();
        }
    }
}
