using System.Globalization;
using ComputerInventory.Api.Entities;
using ComputerInventory.Api.Features.Computers;
using FluentValidation;
using FluentValidation.TestHelper;

namespace ComputerInventory.Api.UnitTests.Features.Computers;

/// <summary>Built-in FluentValidation messages are localized; the API pins them to English.</summary>
public sealed class ValidationMessagesTests
{
    [Fact]
    public void Built_in_messages_are_english_with_readable_field_names()
    {
        var previousUiCulture = CultureInfo.CurrentUICulture;
        var previousLanguage = ValidatorOptions.Global.LanguageManager.Culture;
        try
        {
            CultureInfo.CurrentUICulture = new CultureInfo("es-ES"); // e.g. a Spanish-language server
            ValidatorOptions.Global.LanguageManager.Culture = CultureInfo.InvariantCulture; // as Program.cs does

            var request = new UpdateComputer.Request(0, 1000, StorageType.Ssd, 5000, 500, 1, 1, [], [1]);

            new UpdateComputer.Validator().TestValidate(request)
                .ShouldHaveValidationErrorFor(r => r.RamMb)
                .WithErrorMessage("'RAM (MB)' must be between 1 and 1048576. You entered 0.");
        }
        finally
        {
            CultureInfo.CurrentUICulture = previousUiCulture;
            ValidatorOptions.Global.LanguageManager.Culture = previousLanguage;
        }
    }
}
