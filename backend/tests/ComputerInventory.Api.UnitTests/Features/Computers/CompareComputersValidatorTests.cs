using ComputerInventory.Api.Features.Computers;
using FluentValidation.TestHelper;

namespace ComputerInventory.Api.UnitTests.Features.Computers;

public sealed class CompareComputersValidatorTests
{
    private readonly CompareComputers.Validator _validator = new();

    [Theory]
    [InlineData(new[] { 1, 2 })]
    [InlineData(new[] { 4, 1, 9, 2 })]
    public void Two_to_four_distinct_ids_are_valid(int[] ids) =>
        _validator.TestValidate(new CompareComputers.Request(ids)).ShouldNotHaveAnyValidationErrors();

    [Theory]
    [InlineData(new int[0])]
    [InlineData(new[] { 1 })]
    [InlineData(new[] { 1, 2, 3, 4, 5 })]
    public void Needs_two_to_four_computers(int[] ids) =>
        _validator.TestValidate(new CompareComputers.Request(ids))
            .ShouldHaveValidationErrorFor(r => r.Ids)
            .WithErrorMessage("Choose 2 to 4 computers to compare.");

    [Fact]
    public void Ids_are_required() =>
        _validator.TestValidate(new CompareComputers.Request(null)).ShouldHaveValidationErrorFor(r => r.Ids);

    [Fact]
    public void Ids_cannot_repeat() =>
        _validator.TestValidate(new CompareComputers.Request([3, 3]))
            .ShouldHaveValidationErrorFor(r => r.Ids)
            .WithErrorMessage("Each computer can only be compared once.");

    [Fact]
    public void Ids_must_be_positive() =>
        _validator.TestValidate(new CompareComputers.Request([1, 0]))
            .ShouldHaveValidationErrorFor(r => r.Ids)
            .WithErrorMessage("Ids must be positive.");
}
