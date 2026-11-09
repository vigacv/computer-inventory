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
        _validator.TestValidate(new SearchComputers.Request { Page = page }).ShouldHaveValidationErrorFor(r => r.Page);

    [Theory]
    [InlineData(0)]
    [InlineData(SearchComputers.MaxPageSize + 1)]
    public void Page_size_out_of_range_is_invalid(int pageSize) =>
        _validator.TestValidate(new SearchComputers.Request { PageSize = pageSize }).ShouldHaveValidationErrorFor(r => r.PageSize);

    [Theory]
    [InlineData(1)]
    [InlineData(SearchComputers.MaxPageSize)]
    public void Page_size_bounds_are_valid(int pageSize) =>
        _validator.TestValidate(new SearchComputers.Request { PageSize = pageSize }).ShouldNotHaveValidationErrorFor(r => r.PageSize);

    [Theory]
    [InlineData("ramMb")]
    [InlineData("RAMMB")]
    [InlineData("processor")]
    [InlineData("graphicsCard")]
    [InlineData(null)]
    public void Known_sort_keys_are_valid_case_insensitively(string? sortBy) =>
        _validator.TestValidate(new SearchComputers.Request { SortBy = sortBy }).ShouldNotHaveValidationErrorFor(r => r.SortBy);

    [Theory]
    [InlineData("price")]
    [InlineData("")]
    public void Unknown_sort_keys_are_rejected(string sortBy) =>
        _validator.TestValidate(new SearchComputers.Request { SortBy = sortBy })
            .ShouldHaveValidationErrorFor(r => r.SortBy)
            .WithErrorMessage("SortBy must be one of: id, ramMb, storageCapacityGb, weightGrams, psuWatts, processor, graphicsCard.");

    [Theory]
    [InlineData("asc", false)]
    [InlineData("desc", true)]
    [InlineData("DESC", true)]
    [InlineData(null, false)]
    public void Sort_direction_is_parsed_case_insensitively(string? sortDir, bool descending)
    {
        var request = new SearchComputers.Request { SortDir = sortDir };

        _validator.TestValidate(request).ShouldNotHaveValidationErrorFor(r => r.SortDir);
        Assert.Equal(descending, request.Descending);
    }

    [Fact]
    public void Unknown_sort_direction_is_rejected() =>
        _validator.TestValidate(new SearchComputers.Request { SortDir = "up" }).ShouldHaveValidationErrorFor(r => r.SortDir);

    [Theory]
    [InlineData(0)]
    [InlineData(-8192)]
    public void Ram_bounds_must_be_positive(int value)
    {
        var result = _validator.TestValidate(new SearchComputers.Request { MinRamMb = value, MaxRamMb = value });

        result.ShouldHaveValidationErrorFor(r => r.MinRamMb);
        result.ShouldHaveValidationErrorFor(r => r.MaxRamMb);
    }

    [Fact]
    public void Max_ram_is_checked_even_without_a_min() =>
        _validator.TestValidate(new SearchComputers.Request { MaxRamMb = 0 }).ShouldHaveValidationErrorFor(r => r.MaxRamMb);

    [Fact]
    public void Ram_range_cannot_be_inverted() =>
        _validator.TestValidate(new SearchComputers.Request { MinRamMb = 16384, MaxRamMb = 8192 })
            .ShouldHaveValidationErrorFor(r => r.MaxRamMb)
            .WithErrorMessage("MaxRamMb must be greater than or equal to MinRamMb.");

    [Fact]
    public void Storage_range_cannot_be_inverted() =>
        _validator.TestValidate(new SearchComputers.Request { MinStorageGb = 2000, MaxStorageGb = 1000 })
            .ShouldHaveValidationErrorFor(r => r.MaxStorageGb)
            .WithErrorMessage("MaxStorageGb must be greater than or equal to MinStorageGb.");

    [Fact]
    public void Equal_bounds_are_a_valid_range()
    {
        var result = _validator.TestValidate(new SearchComputers.Request
        {
            MinRamMb = 8192, MaxRamMb = 8192, MinStorageGb = 1000, MaxStorageGb = 1000,
        });

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Search_is_limited_in_length()
    {
        _validator.TestValidate(new SearchComputers.Request { Search = new string('a', SearchComputers.MaxSearchLength) })
            .ShouldNotHaveValidationErrorFor(r => r.Search);
        _validator.TestValidate(new SearchComputers.Request { Search = new string('a', SearchComputers.MaxSearchLength + 1) })
            .ShouldHaveValidationErrorFor(r => r.Search);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Ids_and_psu_must_be_positive(int value)
    {
        var result = _validator.TestValidate(new SearchComputers.Request
        {
            ProcessorManufacturerId = value, GraphicsCardManufacturerId = value, MinPsuWatts = value,
        });

        result.ShouldHaveValidationErrorFor(r => r.ProcessorManufacturerId);
        result.ShouldHaveValidationErrorFor(r => r.GraphicsCardManufacturerId);
        result.ShouldHaveValidationErrorFor(r => r.MinPsuWatts);
    }

    [Theory]
    [InlineData(null, new string[0])]
    [InlineData("   ", new string[0])]
    [InlineData("gtx", new[] { "gtx" })]
    [InlineData("  intel   radeon ", new[] { "intel", "radeon" })]
    public void Search_is_split_into_terms(string? search, string[] expected) =>
        Assert.Equal(expected, new SearchComputers.Request { Search = search }.SearchTerms);
}
