using ComputerInventory.Api.Features.Computers;
using FluentValidation.TestHelper;

namespace ComputerInventory.Api.UnitTests.Features.Computers;

public sealed class SearchComputersValidatorTests
{
    private readonly SearchComputers.Validator _validator = new();

    [Fact]
    public void Defaults_are_valid() =>
        _validator.TestValidate(new SearchComputers.Request()).ShouldNotHaveAnyValidationErrors();

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Page_must_be_at_least_one(int page) =>
        _validator.TestValidate(new SearchComputers.Request(Page: page)).ShouldHaveValidationErrorFor(r => r.Page);

    [Theory]
    [InlineData(0)]
    [InlineData(SearchComputers.MaxPageSize + 1)]
    public void Page_size_out_of_range_is_invalid(int pageSize) =>
        _validator.TestValidate(new SearchComputers.Request(PageSize: pageSize)).ShouldHaveValidationErrorFor(r => r.PageSize);

    [Theory]
    [InlineData(1)]
    [InlineData(SearchComputers.MaxPageSize)]
    public void Page_size_bounds_are_valid(int pageSize) =>
        _validator.TestValidate(new SearchComputers.Request(PageSize: pageSize)).ShouldNotHaveValidationErrorFor(r => r.PageSize);

    [Theory]
    [InlineData("ramMb")]
    [InlineData("RAMMB")]
    [InlineData("processor")]
    [InlineData("graphicsCard")]
    [InlineData(null)]
    public void Known_sort_keys_are_valid_case_insensitively(string? sortBy) =>
        _validator.TestValidate(new SearchComputers.Request(SortBy: sortBy)).ShouldNotHaveValidationErrorFor(r => r.SortBy);

    [Theory]
    [InlineData("price")]
    [InlineData("")]
    public void Unknown_sort_keys_are_rejected(string sortBy) =>
        _validator.TestValidate(new SearchComputers.Request(SortBy: sortBy))
            .ShouldHaveValidationErrorFor(r => r.SortBy)
            .WithErrorMessage("SortBy must be one of: id, ramMb, storageCapacityGb, weightGrams, psuWatts, processor, graphicsCard.");

    [Theory]
    [InlineData("asc", false)]
    [InlineData("desc", true)]
    [InlineData("DESC", true)]
    [InlineData(null, false)]
    public void Sort_direction_is_parsed_case_insensitively(string? sortDir, bool descending)
    {
        var request = new SearchComputers.Request(SortDir: sortDir);

        _validator.TestValidate(request).ShouldNotHaveValidationErrorFor(r => r.SortDir);
        Assert.Equal(descending, request.Descending);
    }

    [Fact]
    public void Unknown_sort_direction_is_rejected() =>
        _validator.TestValidate(new SearchComputers.Request(SortDir: "up")).ShouldHaveValidationErrorFor(r => r.SortDir);
}
