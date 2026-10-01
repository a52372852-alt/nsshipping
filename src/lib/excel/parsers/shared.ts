import type { Worksheet } from "exceljs";
import { cellText, normalizeHeader } from "../cells";
import type { EditableField, NormalizedOrder, Platform } from "@/types/order";
export type Mapping = Partial<Record<EditableField, readonly string[]>>;
export interface Adapter {
  platform: Platform;
  signature: readonly string[];
  mapping: Mapping;
  addressFallback?: readonly string[];
  skipInstruction?: boolean;
}
export interface SheetMatch {
  adapter: Adapter;
  sheet: Worksheet;
  headerRow: number;
  headers: Map<string, number>;
}
export function parseSheet(
  match: SheetMatch,
  fileId: string,
  sourceFileName: string,
): NormalizedOrder[] {
  const { adapter, sheet, headers, headerRow } = match;
  const orders: NormalizedOrder[] = [];
  for (let rowNo = headerRow + 1; rowNo <= sheet.rowCount; rowNo++) {
    const row = sheet.getRow(rowNo);
    const getByHeader = (header: string) => {
      const index = headers.get(normalizeHeader(header));
      return index ? row.getCell(index) : undefined;
    };
    const read = (field: EditableField) => {
      for (const alias of adapter.mapping[field] ?? []) {
        const cell = getByHeader(alias);
        if (cell) return cellText(cell);
      }
      return "";
    };
    // Toss's third row consists only of editability labels. Detect its contents,
    // rather than dropping the first order when a user has removed that row.
    const meaningful: string[] = [];
    row.eachCell((cell) => {
      const text = cellText(cell);
      if (text) meaningful.push(text);
    });
    if (!meaningful.length) continue;
    if (
      adapter.skipInstruction &&
      meaningful.every((text) => /^수정\s*(가능|불가)$/.test(text))
    )
      continue;
    // Do not skip partial/malformed orders just because orderId is missing.
    const mapped = Object.keys(adapter.mapping) as EditableField[];
    if (!mapped.some((field) => read(field))) continue;
    const order: NormalizedOrder = {
      id: `${fileId}:${sheet.id}:${rowNo}`,
      fileId,
      platform: adapter.platform,
      sourceFileName,
      sourceSheet: sheet.name,
      sourceRow: rowNo,
      orderId: read("orderId"),
      productOrderId: read("productOrderId"),
      receiverName: read("receiverName"),
      receiverPhone1: read("receiverPhone1"),
      receiverPhone2: read("receiverPhone2"),
      postalCode: read("postalCode"),
      address: read("address"),
      productName: read("productName"),
      optionName: read("optionName"),
      quantity: read("quantity") ? Number(read("quantity")) : 0,
      deliveryMessage: read("deliveryMessage"),
      sourceIssues: [],
    };
    if (!order.address && adapter.addressFallback)
      order.address = adapter.addressFallback
        .map((header) => {
          const cell = getByHeader(header);
          return cell ? cellText(cell) : "";
        })
        .filter(Boolean)
        .join(" ");
    // Optional components for user templates; the existing full address stays unchanged.
    const addressParts = adapter.addressFallback?.map((header) => {
      const cell = getByHeader(header);
      return cell ? cellText(cell) : "";
    });
    order.addressBase = addressParts?.[0] || order.address;
    order.addressDetail = addressParts?.[0] ? addressParts[1] || "" : "";
    for (const field of mapped) {
      const names = adapter.mapping[field] ?? [];
      const cell = names.map(getByHeader).find(Boolean);
      if (!cell) continue;
      if (cell.type === 6)
        order.sourceIssues.push({
          level: "error",
          field,
          message: "수식 셀입니다. 원본 값을 확인하고 직접 입력해주세요.",
        });
      if (
        (field === "orderId" || field === "productOrderId") &&
        typeof cell.value === "number" &&
        (Math.abs(cell.value) >= 1e15 || !Number.isSafeInteger(cell.value))
      )
        order.sourceIssues.push({
          level: "error",
          field,
          message:
            "숫자로 저장된 긴 주문번호는 정밀도를 보장할 수 없습니다. 원본 번호를 확인해 텍스트로 입력해주세요.",
        });
      if (
        (field === "receiverPhone1" || field === "receiverPhone2") &&
        typeof cell.value === "number"
      )
        order.sourceIssues.push({
          level: "warning",
          field,
          message:
            "전화번호가 숫자 셀입니다. 누락된 앞자리 0이 없는지 확인해주세요.",
        });
    }
    // Domestic five-digit postal codes can be reconstructed from a numeric cell.
    if (/^\d{1,4}$/.test(order.postalCode))
      order.postalCode = order.postalCode.padStart(5, "0");
    orders.push(order);
  }
  return orders;
}
