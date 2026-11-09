namespace ComputerInventory.Api.Data.Configurations;

internal static class CheckConstraints
{
    /// <summary>
    /// Builds "[Column] IN ('A', 'B', ...)" from an enum stored as a string, so the database
    /// constraint is derived from the code. Changing the enum changes the EF model, which then
    /// requires a migration (startup fails on pending model changes if one is forgotten).
    /// </summary>
    public static string InEnum<TEnum>(string column) where TEnum : struct, Enum =>
        $"[{column}] IN ({string.Join(", ", Enum.GetNames<TEnum>().Select(n => $"'{n}'"))})";
}
