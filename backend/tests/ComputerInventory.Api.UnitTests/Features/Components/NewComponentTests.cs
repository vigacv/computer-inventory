using ComputerInventory.Api.Features.Components;
using FluentValidation.TestHelper;

namespace ComputerInventory.Api.UnitTests.Features.Components;

public sealed class NewComponentTests
{
    private readonly NewComponentValidator _validator = new();

    [Theory]
    [InlineData("  Intel ", "Intel")]
    [InlineData("Core   i9-14900K", "Core i9-14900K")]
    [InlineData("\tRadeon\nRX 7900 ", "Radeon RX 7900")]
    [InlineData(null, "")]
    public void Names_are_trimmed_and_whitespace_collapsed(string? raw, string expected)
    {
        Assert.Equal(expected, new NewComponent(raw, null).ManufacturerName);
        Assert.Equal(expected, new NewComponent(null, raw).ModelName);
    }

    [Fact]
    public void Valid_component_passes() =>
        _validator.TestValidate(new NewComponent("Apple", "M3 Max")).ShouldNotHaveAnyValidationErrors();

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Both_names_are_required(string? blank)
    {
        var result = _validator.TestValidate(new NewComponent(blank, blank));

        result.ShouldHaveValidationErrorFor(nameof(NewComponent.Manufacturer)).WithErrorMessage("Enter the manufacturer.");
        result.ShouldHaveValidationErrorFor(nameof(NewComponent.Model)).WithErrorMessage("Enter the model.");
    }

    [Fact]
    public void Names_are_limited_in_length()
    {
        var result = _validator.TestValidate(new NewComponent(
            new string('m', NewComponentValidator.MaxManufacturerLength + 1),
            new string('x', NewComponentValidator.MaxModelLength + 1)));

        result.ShouldHaveValidationErrorFor(nameof(NewComponent.Manufacturer));
        result.ShouldHaveValidationErrorFor(nameof(NewComponent.Model));
    }
}
