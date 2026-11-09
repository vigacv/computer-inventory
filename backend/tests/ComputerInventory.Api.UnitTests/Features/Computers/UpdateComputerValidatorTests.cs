using ComputerInventory.Api.Entities;
using ComputerInventory.Api.Features.Computers;
using FluentValidation.TestHelper;

namespace ComputerInventory.Api.UnitTests.Features.Computers;

public sealed class UpdateComputerValidatorTests
{
    private readonly UpdateComputer.Validator _validator = new();

    private static readonly UpdateComputer.Request Valid = new(
        RamMb: 16384,
        StorageCapacityGb: 1000,
        StorageType: StorageType.Ssd,
        WeightGrams: 8100,
        PsuWatts: 500,
        ProcessorId: 1,
        GraphicsCardId: 1,
        UsbPorts: [new UsbPortInput(UsbPortType.Usb3, 2), new UsbPortInput(UsbPortType.UsbC, 1)],
        RowVersion: [1, 2, 3, 4, 5, 6, 7, 8]);

    [Fact]
    public void Valid_request_passes() => _validator.TestValidate(Valid).ShouldNotHaveAnyValidationErrors();

    [Fact]
    public void No_usb_ports_is_valid() =>
        _validator.TestValidate(Valid with { UsbPorts = [] }).ShouldNotHaveAnyValidationErrors();

    [Theory]
    [InlineData(0)]
    [InlineData(ComputerLimits.MaxRamMb + 1)]
    public void Ram_must_be_within_limits(int ramMb) =>
        _validator.TestValidate(Valid with { RamMb = ramMb }).ShouldHaveValidationErrorFor(r => r.RamMb);

    [Theory]
    [InlineData(0)]
    [InlineData(ComputerLimits.MaxStorageGb + 1)]
    public void Storage_must_be_within_limits(int gb) =>
        _validator.TestValidate(Valid with { StorageCapacityGb = gb }).ShouldHaveValidationErrorFor(r => r.StorageCapacityGb);

    [Theory]
    [InlineData(0)]
    [InlineData(ComputerLimits.MaxWeightGrams + 1)]
    public void Weight_must_be_within_limits(int grams) =>
        _validator.TestValidate(Valid with { WeightGrams = grams }).ShouldHaveValidationErrorFor(r => r.WeightGrams);

    [Theory]
    [InlineData(0)]
    [InlineData(ComputerLimits.MaxPsuWatts + 1)]
    public void Psu_must_be_within_limits(int watts) =>
        _validator.TestValidate(Valid with { PsuWatts = watts }).ShouldHaveValidationErrorFor(r => r.PsuWatts);

    [Fact]
    public void Storage_type_is_required() =>
        _validator.TestValidate(Valid with { StorageType = null }).ShouldHaveValidationErrorFor(r => r.StorageType);

    [Fact]
    public void Components_must_be_chosen()
    {
        var result = _validator.TestValidate(Valid with { ProcessorId = 0, GraphicsCardId = 0 });

        result.ShouldHaveValidationErrorFor(r => r.ProcessorId).WithErrorMessage("Choose a processor.");
        result.ShouldHaveValidationErrorFor(r => r.GraphicsCardId).WithErrorMessage("Choose a graphics card.");
    }

    [Fact]
    public void Usb_ports_are_required() =>
        _validator.TestValidate(Valid with { UsbPorts = null }).ShouldHaveValidationErrorFor(r => r.UsbPorts);

    [Fact]
    public void Usb_port_types_cannot_repeat() =>
        _validator.TestValidate(Valid with
            {
                UsbPorts = [new UsbPortInput(UsbPortType.Usb3, 2), new UsbPortInput(UsbPortType.Usb3, 1)],
            })
            .ShouldHaveValidationErrorFor(r => r.UsbPorts)
            .WithErrorMessage("Each USB port type can only be listed once.");

    [Theory]
    [InlineData(0)]
    [InlineData(ComputerLimits.MaxPortsPerType + 1)]
    public void Usb_port_count_must_be_within_limits(int count) =>
        _validator.TestValidate(Valid with { UsbPorts = [new UsbPortInput(UsbPortType.Usb2, count)] })
            .ShouldHaveValidationErrorFor("UsbPorts[0].Count");

    [Fact]
    public void Unknown_usb_port_type_is_rejected() =>
        _validator.TestValidate(Valid with { UsbPorts = [new UsbPortInput((UsbPortType)99, 1)] })
            .ShouldHaveValidationErrorFor("UsbPorts[0].Type");

    [Fact]
    public void Row_version_is_required()
    {
        _validator.TestValidate(Valid with { RowVersion = null }).ShouldHaveValidationErrorFor(r => r.RowVersion);
        _validator.TestValidate(Valid with { RowVersion = [] }).ShouldHaveValidationErrorFor(r => r.RowVersion);
    }
}
