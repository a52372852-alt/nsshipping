import ExcelJS from "exceljs";
import { mkdir, writeFile } from "node:fs/promises";
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("samples/lotte-template.xlsx");
const ws = wb.worksheets[0];
// Only structural metadata is extracted. Sample rows, notes and sender data are never bundled.
const schema = {
  sheetName: ws.name,
  headers: Array.from({ length: 18 }, (_, i) => ws.getCell(1, i + 1).text),
  widths: Array.from({ length: 18 }, (_, i) => ws.getColumn(i + 1).width ?? 12),
  headerHeight: ws.getRow(1).height ?? 24,
  headerStyles: Array.from(
    { length: 18 },
    (_, i) => ws.getCell(1, i + 1).style,
  ),
  dataStyles: Array.from({ length: 18 }, (_, i) => ws.getCell(2, i + 1).style),
};
await mkdir("src/lib/excel/exporters", { recursive: true });
await writeFile(
  "src/lib/excel/exporters/template-schema.json",
  JSON.stringify(schema, null, 2) + "\n",
);
console.log(
  `Extracted ${schema.headers.length} columns from ${schema.sheetName}; no sample data copied.`,
);
