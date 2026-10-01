import type { Cell } from "exceljs";
// Identifiers never pass through Number(). Text cells preserve every digit and leading zero.
export function cellText(cell: Cell): string {
  const value = cell.value;
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") {
    const format = cell.numFmt;
    if (/^0+$/.test(format) && Number.isInteger(value))
      return value.toFixed(0).padStart(format.length, "0");
    return Number.isInteger(value) ? value.toFixed(0) : String(value);
  }
  if (typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if ("richText" in value)
    return value.richText
      .map((part) => part.text)
      .join("")
      .trim();
  if ("text" in value) return value.text.trim();
  // Formula cells are not evaluated or silently used as trusted order data.
  return cell.text?.trim() ?? "";
}
export const normalizeHeader = (value: string) =>
  value.trim().replace(/\s+/g, "");
