import type { Workbook } from "exceljs";
import { cellText, normalizeHeader } from "./cells";
import { coupang } from "./parsers/coupang";
import { smartstore } from "./parsers/smartstore";
import { toss } from "./parsers/toss";
import type { SheetMatch } from "./parsers/shared";
export const adapters = [coupang, smartstore, toss];
export function detectPlatform(workbook: Workbook): SheetMatch[] {
  const matches: SheetMatch[] = [];
  for (const sheet of workbook.worksheets) {
    for (let rowNo = 1; rowNo <= Math.min(sheet.rowCount, 30); rowNo++) {
      const headers = new Map<string, number>();
      sheet.getRow(rowNo).eachCell((cell, col) => {
        if (cellText(cell)) headers.set(normalizeHeader(cellText(cell)), col);
      });
      const adapter = adapters.find((candidate) =>
        candidate.signature.every((header) =>
          headers.has(normalizeHeader(header)),
        ),
      );
      if (adapter) {
        matches.push({ adapter, sheet, headerRow: rowNo, headers });
        break;
      }
    }
  }
  return matches;
}
