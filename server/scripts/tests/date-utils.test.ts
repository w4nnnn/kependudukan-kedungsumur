import { assertEqual } from "./assertions.js";
import { parseExcelDate } from "../../src/lib/date-utils.js";

async function run() {
  console.log("Running date-utils test...");

  const dateObj = new Date(1995, 7, 17);
  const parsedFromDate = parseExcelDate(dateObj);
  assertEqual(parsedFromDate, "1995-08-17", "Date object should format to exact local YYYY-MM-DD");

  assertEqual(parseExcelDate("1980-01-01"), "1980-01-01", "Standard ISO YYYY-MM-DD");
  assertEqual(parseExcelDate("17/08/1995"), "1995-08-17", "Indonesian DD/MM/YYYY");
  assertEqual(parseExcelDate("17-08-1995"), "1995-08-17", "Indonesian DD-MM-YYYY");
  assertEqual(parseExcelDate("invalid-date"), null, "Invalid date returns null");
  assertEqual(parseExcelDate(""), null, "Empty string returns null");
  assertEqual(parseExcelDate(null), null, "null returns null");
  assertEqual(parseExcelDate(undefined), null, "undefined returns null");

  console.log("✅ All date-utils tests passed!");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
