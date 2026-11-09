using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComputerInventory.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSortAndFilterIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ComputerUsbPorts_PortType",
                table: "ComputerUsbPorts",
                column: "PortType");

            migrationBuilder.CreateIndex(
                name: "IX_Computers_PsuWatts_Id",
                table: "Computers",
                columns: new[] { "PsuWatts", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Computers_RamMb_Id",
                table: "Computers",
                columns: new[] { "RamMb", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Computers_StorageCapacityGb_Id",
                table: "Computers",
                columns: new[] { "StorageCapacityGb", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Computers_WeightGrams_Id",
                table: "Computers",
                columns: new[] { "WeightGrams", "Id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ComputerUsbPorts_PortType",
                table: "ComputerUsbPorts");

            migrationBuilder.DropIndex(
                name: "IX_Computers_PsuWatts_Id",
                table: "Computers");

            migrationBuilder.DropIndex(
                name: "IX_Computers_RamMb_Id",
                table: "Computers");

            migrationBuilder.DropIndex(
                name: "IX_Computers_StorageCapacityGb_Id",
                table: "Computers");

            migrationBuilder.DropIndex(
                name: "IX_Computers_WeightGrams_Id",
                table: "Computers");
        }
    }
}
