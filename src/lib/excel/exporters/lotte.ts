import ExcelJS from "exceljs";
import schema from "./template-schema.json";
import { normalizePhone } from "../transforms/normalizePhone";
import { validateOrder } from "../validators/orderValidator";
import type { NormalizedOrder, SenderSettings } from "@/types/order";
export const LOTTE_HEADERS = schema.headers;
export async function exportLotte(
  orders: NormalizedOrder[],
  sender: SenderSettings,
): Promise<ArrayBuffer> {
  if (!sender.name.trim() || !sender.phone.trim())
    throw new Error("발송인 이름과 전화번호를 설정해주세요.");
  if (!orders.length) throw new Error("출력할 주문이 없습니다.");
  if (
    orders.some((order) =>
      validateOrder(order).some((issue) => issue.level === "error"),
    )
  )
    throw new Error("오류 주문은 수정 후 출력해주세요.");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NS Shipping";
  const sheet = workbook.addWorksheet(schema.sheetName);
  sheet.columns = schema.headers.map((header, index) => ({
    header,
    width: schema.widths[index],
  }));
  sheet.getRow(1).height = schema.headerHeight;
  schema.headerStyles.forEach((style, index) => {
    sheet.getCell(1, index + 1).style = structuredClone(style) as ExcelJS.Style;
  });
  for (const order of orders) {
    const row = sheet.addRow([
      order.orderId,
      sender.name.trim(),
      normalizePhone(sender.phone),
      normalizePhone(sender.phone2),
      sender.postalCode.trim(),
      sender.address.trim(),
      order.receiverName,
      normalizePhone(order.receiverPhone1),
      normalizePhone(order.receiverPhone2),
      order.postalCode,
      order.address,
      order.productName,
      order.optionName,
      order.quantity,
      order.deliveryMessage,
      sender.freight,
      "",
      "",
    ]);
    for (let col = 1; col <= 18; col++) {
      row.getCell(col).style = structuredClone(
        schema.dataStyles[col - 1],
      ) as ExcelJS.Style;
      row.getCell(col).numFmt = col === 14 ? "0" : "@";
    }
  }
  const buffer = await workbook.xlsx.writeBuffer();
  // Copy into a native ArrayBuffer for both Node and browser Blob interoperability.
  return new Uint8Array(buffer).slice().buffer;
}
export function downloadName(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return `롯데택배_송장등록_${parts}.xlsx`;
}
