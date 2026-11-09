using ComputerInventory.Api.Entities;
using ComputerInventory.Api.Features.Computers;
using FluentValidation.TestHelper;

namespace ComputerInventory.Api.UnitTests.Features.Computers;

/// <summary>The spec rules themselves are covered in UpdateComputerValidatorTests; this checks create uses them.</summary>
public sealed class CreateComputerValidatorTests
{
    private readonly CreateComputer.Validator _validator = new();

    private static readonly CreateComputer.Request Valid = new(
        16384, 1000, StorageType.Ssd, 8100, 500, 1, 1, [new UsbPortInput(UsbPortType.Usb3, 2)]);

    [Fact]
    public void Valid_request_passes() => _validator.TestValidate(Valid).ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void Applies_the_shared_spec_rules()
    {
        var result = _validator.TestValidate(Valid with
        {
            RamMb = 0,
            StorageType = null,
            ProcessorId = 0,
            UsbPorts = [new UsbPortInput(UsbPortType.Usb3, 1), new UsbPortInput(UsbPortType.Usb3, 2)],
        });

        result.ShouldHaveValidationErrorFor(r => r.RamMb);
        result.ShouldHaveValidationErrorFor(r => r.StorageType);
        result.ShouldHaveValidationErrorFor(r => r.ProcessorId);
        result.ShouldHaveValidationErrorFor(r => r.UsbPorts);
    }
}
