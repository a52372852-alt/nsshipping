import ExcelJS from "exceljs";
import { detectPlatform } from "./detectPlatform";
import { parseSheet } from "./parsers/shared";
import { ExcelImportError } from "./errors";
import type { ImportedFile } from "@/types/order";
import { decryptWorkbook, type WorkbookDecryptor } from "./decrypt";
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export async function readOrders(
  data: ArrayBuffer,
  fileName: string,
  fileId: string,
  decrypt: WorkbookDecryptor = decryptWorkbook,
  inspectWorkbook?: (workbook: ExcelJS.Workbook) => void,
) {
  if (!/\.xlsx$/i.test(fileName))
    throw new ExcelImportError(
      "unsupported",
      ".xlsx 형식의 주문 파일을 선택해주세요.",
    );
  if (data.byteLength > MAX_FILE_BYTES)
    throw new ExcelImportError(
      "limit",
      "파일당 최대 20MB까지 처리할 수 있습니다. 파일을 나누어 올려주세요.",
    );
  const bytes = new Uint8Array(data);
  let readable = data;
  const encrypted = bytes[0] === 0xd0 && bytes[1] === 0xcf;
  if (encrypted) {
    try {
      readable = await decrypt(data);
    } catch (error) {
      throw new ExcelImportError(
        "encrypted",
        typeof window !== "undefined" && error instanceof Error
          ? error.message
          : "암호화된 Excel을 열 수 없습니다. 설정의 Excel 비밀번호를 확인해주세요.",
      );
    }
  }
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(readable);
  } catch {
    throw new ExcelImportError(
      "corrupt",
      "Excel 파일을 읽을 수 없습니다.",
      "파일이 손상되었거나 실제 .xlsx 형식이 아닙니다. Excel에서 다시 저장한 후 올려주세요.",
    );
  }
  if (
    workbook.worksheets.some(
      (sheet) => sheet.rowCount > 50000 || sheet.columnCount > 500,
    )
  )
    throw new ExcelImportError(
      "limit",
      "시트당 최대 50,000행, 500열까지 처리할 수 있습니다.",
    );
  const matches = detectPlatform(workbook);
  if (!matches.length)
    throw new ExcelImportError(
      "unsupported",
      "지원하지 않는 주문 양식입니다.",
      `확인한 시트: ${workbook.worksheets.map((s) => s.name).join(", ") || "없음"}. 주문번호와 수취인 컬럼이 있는 쿠팡, 스마트스토어 또는 토스쇼핑 원본 주문 파일인지 확인해주세요.`,
    );
  const orders = matches.flatMap((match) =>
    parseSheet(match, fileId, fileName),
  );
  inspectWorkbook?.(workbook);
  const ignored = workbook.worksheets.filter(
    (sheet) => !matches.some((m) => m.sheet.id === sheet.id),
  );
  const file: ImportedFile = {
    id: fileId,
    name: fileName,
    size: data.byteLength,
    status: "ready",
    platforms: [...new Set(matches.map((m) => m.adapter.platform))],
    count: orders.length,
    details:
      matches
        .map((m) => `${m.sheet.name} · 헤더 ${m.headerRow}행`)
        .join(" / ") +
      (ignored.length
        ? ` · 미인식 시트 제외: ${ignored.map((s) => s.name).join(", ")}`
        : ""),
  };
  if (!orders.length) file.details += " · 주문 데이터가 없습니다.";
  if (encrypted) file.details += " · 암호 해제 완료";
  return { orders, file };
}
