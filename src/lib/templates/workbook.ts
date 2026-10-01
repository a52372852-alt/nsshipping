import ExcelJS from "exceljs";
import { cellText } from "@/lib/excel/cells";
import { validateOrder } from "@/lib/excel/validators/orderValidator";
import type { NormalizedOrder, SenderSettings } from "@/types/order";
import { matchHeader } from "./matching";
import { FIELDS, type ColumnBinding, type TemplateProfile } from "./types";

export async function readTemplate(data: ArrayBuffer, fileName: string) {
  if (!/\.xlsx$/i.test(fileName))
    throw new Error(
      "택배사 양식은 .xlsx 파일을 사용해주세요. 매크로 파일은 지원하지 않습니다.",
    );
  if (data.byteLength > 20 * 1024 * 1024)
    throw new Error("양식 파일은 최대 20MB까지 읽을 수 있습니다.");
  const book = new ExcelJS.Workbook();
  try {
    await book.xlsx.load(data);
  } catch {
    throw new Error(
      "양식을 읽지 못했습니다. 암호 없는 .xlsx 양식인지 확인해주세요.",
    );
  }
  if (!book.worksheets.length) throw new Error("시트가 없는 파일입니다.");
  if (book.worksheets.some((s) => s.rowCount > 5000 || s.columnCount > 200))
    throw new Error(
      "양식은 시트당 5,000행·200열 이하의 빈 양식으로 준비해주세요.",
    );
  return book;
}
export function suggestHeader(book: ExcelJS.Workbook) {
  let best = { sheetName: book.worksheets[0].name, headerRow: 1, score: 0 };
  for (const sheet of book.worksheets)
    for (let row = 1; row <= Math.min(50, sheet.rowCount); row++) {
      const fields = new Set<string>();
      sheet.getRow(row).eachCell((cell) => {
        const match = matchHeader(cellText(cell));
        if (match) fields.add(match);
      });
      if (fields.size > best.score)
        best = { sheetName: sheet.name, headerRow: row, score: fields.size };
    }
  return best;
}
export function templateColumns(
  book: ExcelJS.Workbook,
  sheetName: string,
  headerRow: number,
): ColumnBinding[] {
  const sheet = book.getWorksheet(sheetName);
  if (
    !sheet ||
    !Number.isInteger(headerRow) ||
    headerRow < 1 ||
    headerRow > Math.max(1, sheet.rowCount)
  )
    throw new Error("제목 행 번호를 확인해주세요.");
  const count = Math.max(sheet.columnCount, sheet.getRow(headerRow).cellCount);
  const columns: ColumnBinding[] = [];
  for (let column = 1; column <= count; column++) {
    const cell = sheet.getCell(headerRow, column);
    if (cell.isMerged)
      throw new Error(
        "제목 행의 병합 셀은 자동 연결할 수 없습니다. 각 열의 제목이 나뉘어 있는 행을 선택해주세요.",
      );
    const header = cellText(cell);
    const field = matchHeader(header);
    columns.push({
      column,
      header,
      field: field ?? "blank",
      constant: "",
      automatic: !!field,
    });
  }
  if (!columns.some((c) => c.header))
    throw new Error("선택한 행에 열 제목이 없습니다.");
  return columns;
}
export function templateFingerprint(
  sheetName: string,
  columns: ColumnBinding[],
  headerRow: number,
  dataStart: number,
) {
  // Canonical structural identity, not a hash of the file or any order values.
  return JSON.stringify([
    sheetName,
    headerRow,
    dataStart,
    columns.map((c) => [c.column, c.header]),
  ]);
}
export async function cleanTemplate(
  book: ExcelJS.Workbook,
  sheetName: string,
  headerRow: number,
  dataStart: number,
): Promise<ArrayBuffer> {
  const columns = templateColumns(book, sheetName, headerRow);
  if (
    !Number.isInteger(dataStart) ||
    dataStart <= headerRow ||
    dataStart > 5001
  )
    throw new Error(
      "데이터 시작 행은 제목 행 다음부터 5,001행 사이로 선택해주세요.",
    );
  const clean = new ExcelJS.Workbook();
  for (const source of book.worksheets) {
    const target = clean.addWorksheet(source.name);
    target.state = source.name === sheetName ? "visible" : source.state;
    target.properties = structuredClone(source.properties);
    target.pageSetup = structuredClone(source.pageSetup);
    target.views = structuredClone(source.views);
    for (let c = 1; c <= source.columnCount; c++) {
      const from = source.getColumn(c),
        to = target.getColumn(c);
      to.width = from.width;
      to.hidden = from.hidden;
      to.outlineLevel = from.outlineLevel;
      to.style = structuredClone(from.style);
    }
    source.eachRow({ includeEmpty: true }, (row, r) => {
      const dest = target.getRow(r);
      dest.height = row.height;
      dest.hidden = row.hidden;
      dest.outlineLevel = row.outlineLevel;
      row.eachCell({ includeEmpty: true }, (cell, c) => {
        dest.getCell(c).style = structuredClone(cell.style);
      });
    });
    for (const range of source.model.merges ?? []) {
      // Never write into merged data cells or silently shift a footer region.
      const bottom = Number(range.split(":").at(-1)!.replace(/[A-Z]/gi, ""));
      if (source.name === sheetName && bottom >= dataStart)
        throw new Error(
          "데이터 영역에 병합 셀이 있습니다. 한 주문을 한 행에 넣는 빈 양식으로 준비해주세요.",
        );
      target.mergeCells(range);
    }
  }
  const sheet = clean.getWorksheet(sheetName)!;
  columns.forEach((c) => {
    sheet.getCell(headerRow, c.column).value = c.header || null;
  });
  const buffer = await clean.xlsx.writeBuffer();
  return new Uint8Array(buffer).slice().buffer;
}
export function connectionIssues(
  profile: Pick<TemplateProfile, "columns">,
): string[] {
  const fields = new Set(profile.columns.map((c) => c.field));
  const required = [
    "receiverName",
    "receiverPhone1",
    "address",
    "productName",
  ] as const;
  return required
    .filter(
      (field) =>
        !fields.has(field) &&
        !(
          field === "address" &&
          fields.has("addressBase") &&
          fields.has("addressDetail")
        ) &&
        !(field === "productName" && fields.has("productAndOption")),
    )
    .map((field) => `${FIELDS[field]}을 연결해주세요.`);
}
export function outputValue(
  binding: ColumnBinding,
  order: NormalizedOrder,
  sender: SenderSettings,
  phoneFormat: TemplateProfile["phoneFormat"],
): string | number {
  const { field } = binding;
  if (field === "blank") return "";
  if (field === "constant") return binding.constant;
  if (field === "productAndOption")
    return [order.productName, order.optionName].filter(Boolean).join(" / ");
  const senders: Record<string, string> = {
    senderName: sender.name,
    senderPhone: sender.phone,
    senderPhone2: sender.phone2,
    senderAddress: sender.address,
    senderPostalCode: sender.postalCode,
    freight: sender.freight,
  };
  let value =
    field in senders ? senders[field] : order[field as keyof NormalizedOrder];
  if (field === "quantity") return order.quantity;
  if (field === "addressBase") value = order.addressBase ?? order.address;
  if (field === "addressDetail") value = order.addressDetail ?? "";
  value = String(value ?? "");
  if (
    [
      "receiverPhone1",
      "receiverPhone2",
      "senderPhone",
      "senderPhone2",
    ].includes(field)
  ) {
    if (phoneFormat === "digits") return value.replace(/[\s-]/g, "");
    if (phoneFormat === "hyphen") {
      const digits = value.replace(/[\s-]/g, "");
      if (/^02\d{7,8}$/.test(digits))
        return digits.replace(/^(02)(\d{3,4})(\d{4})$/, "$1-$2-$3");
      if (/^0\d{9,10}$/.test(digits))
        return digits.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
      return value;
    }
  }
  if (field === "address" || field === "senderAddress")
    return value.replace(/\s+/g, " ").trim();
  return value;
}
export function senderIssues(
  profile: TemplateProfile,
  sender: SenderSettings,
): string[] {
  const required: Record<string, string> = {
    senderName: sender.name,
    senderPhone: sender.phone,
    senderAddress: sender.address,
    senderPostalCode: sender.postalCode,
  };
  return [...new Set(profile.columns.map((c) => c.field))]
    .filter((f) => f in required && !required[f].trim())
    .map((f) => `${FIELDS[f]} 설정이 필요합니다.`);
}
export async function exportCustomTemplate(
  profile: TemplateProfile,
  orders: NormalizedOrder[],
  sender: SenderSettings,
): Promise<ArrayBuffer> {
  const errors = [
    ...connectionIssues(profile),
    ...senderIssues(profile, sender),
  ];
  if (errors.length) throw new Error(errors.join(" "));
  if (!orders.length) throw new Error("출력할 주문이 없습니다.");
  if (orders.some((o) => validateOrder(o).some((i) => i.level === "error")))
    throw new Error("오류 주문은 수정 후 출력해주세요.");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(profile.workbook);
  const sheet = workbook.getWorksheet(profile.sheetName);
  if (!sheet) throw new Error("저장한 양식을 다시 등록해주세요.");
  const sample = sheet.getRow(profile.dataStart);
  const styles = profile.columns.map((c) =>
    structuredClone(sample.getCell(c.column).style),
  );
  const height = sample.height;
  orders.forEach((order, i) => {
    const row = sheet.getRow(profile.dataStart + i);
    row.height = height;
    row.hidden = false;
    profile.columns.forEach((binding, index) => {
      const cell = row.getCell(binding.column);
      cell.style = structuredClone(styles[index]);
      cell.value = outputValue(binding, order, sender, profile.phoneFormat);
      cell.numFmt = binding.field === "quantity" ? "0" : "@";
    });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer).slice().buffer;
}
