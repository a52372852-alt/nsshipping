import ExcelJS from "exceljs";
import { readOrders } from "@/lib/excel/reader";
import { detectPlatform } from "@/lib/excel/detectPlatform";
import { normalizeHeader } from "@/lib/excel/cells";
import { exportLotte } from "@/lib/excel/exporters/lotte";
import { validateOrder } from "@/lib/excel/validators/orderValidator";
import aSchema from "@/lib/excel/exporters/template-schema.json";
import bSchema from "./b-template-schema.json";
import type { NormalizedOrder, SenderSettings } from "@/types/order";

export type SplitGroup = "orange" | "plain" | "unknown";
export interface SplitOrder {
  order: NormalizedOrder;
  group: SplitGroup;
}

export function classifyFill(fill: ExcelJS.Fill | undefined): SplitGroup {
  if (!fill || (fill.type === "pattern" && fill.pattern === "none"))
    return "plain";
  if (fill.type !== "pattern" || fill.pattern !== "solid") return "unknown";
  const color = fill.fgColor as
    (Partial<ExcelJS.Color> & { indexed?: number }) | undefined;
  const rgb = color?.argb?.toUpperCase().slice(-6);
  if (rgb === "FFC000") return "orange";
  // White and the default neutral backgrounds observed in the Toss export.
  if (["FFFFFF", "F8F9FA", "F3F3F3"].includes(rgb ?? "")) return "plain";
  return "unknown";
}

export async function readSplitOrders(
  data: ArrayBuffer,
  name: string,
  id: string,
) {
  const marks = new Map<string, SplitGroup>();
  const result = await readOrders(data, name, id, undefined, (workbook) => {
    for (const match of detectPlatform(workbook)) {
      const col = match.adapter.mapping.receiverName
        ?.map((h) => match.headers.get(normalizeHeader(h)))
        .find(Boolean);
      if (!col) continue;
      // Conditional formatting cannot be inferred from the cell's base fill.
      // Require an explicit fill when the sheet has conditional rules.
      const conditional =
        ((match.sheet as unknown as { conditionalFormattings?: unknown[] })
          .conditionalFormattings?.length ?? 0) > 0;
      for (let r = match.headerRow + 1; r <= match.sheet.rowCount; r++) {
        const cell = match.sheet.getCell(r, col);
        marks.set(
          `${match.sheet.name}:${r}`,
          conditional || cell.isMerged ? "unknown" : classifyFill(cell.fill),
        );
      }
    }
  });
  return {
    ...result,
    split: result.orders.map((order): SplitOrder => ({
      order,
      group: marks.get(`${order.sourceSheet}:${order.sourceRow}`) ?? "unknown",
    })),
  };
}

export function splitFilename(group: "orange" | "plain", date = new Date()) {
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" })
    .format(date)
    .replaceAll("-", "");
  return group === "orange"
    ? `엔에스벨류몰_B-type[지정송하인]_${day}.xlsx`
    : `엔에스벨류몰_B타입 전용(지정)_${day}.xlsx`;
}

export function markDeliveryMessage(message: string): string {
  const body = message.replace(/^(?:®|\[R\])\s*/, "");
  return body ? `[R] ${body}` : "[R]";
}

export async function exportSplitGroup(
  rows: SplitOrder[],
  group: "orange" | "plain",
  sender: SenderSettings,
) {
  if (rows.some((r) => r.group === "unknown"))
    throw new Error(
      "수령인 셀의 색상을 인식하지 못했습니다. 지정송하인 주문은 표준 주황색으로 표시해주세요.",
    );
  if (rows.some((r) => validateOrder(r.order).some((i) => i.level === "error")))
    throw new Error("오류 주문이 있습니다. 원본을 수정한 뒤 다시 올려주세요.");
  if (!sender.name.trim() || !sender.phone.trim())
    throw new Error("발송인 이름과 전화번호를 입력해주세요.");
  const orders = rows.filter((r) => r.group === group).map((r) => r.order);
  if (group === "orange" && orders.length)
    return exportLotte(
      orders.map((order) => ({
        ...order,
        deliveryMessage: markDeliveryMessage(order.deliveryMessage),
      })),
      sender,
    );
  const schema = group === "orange" ? aSchema : bSchema;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NS Shipping";
  const sheet = workbook.addWorksheet(schema.sheetName);
  sheet.columns = schema.headers.map((header, i) => ({
    header,
    width: schema.widths[i],
  }));
  sheet.getRow(1).height = schema.headerHeight;
  schema.headerStyles.forEach((s, i) => {
    sheet.getCell(1, i + 1).style = structuredClone(s) as ExcelJS.Style;
  });
  for (const order of orders) {
    const row = sheet.addRow([
      order.orderId,
      sender.name.trim(),
      sender.phone.trim(),
      sender.phone2.trim(),
      sender.postalCode.trim(),
      sender.address.trim(),
      order.receiverName,
      order.receiverPhone1,
      order.receiverPhone2,
      order.postalCode,
      order.address,
      order.productName,
      order.optionName,
      order.quantity,
      order.deliveryMessage,
      sender.freight,
      "",
      "",
      null,
    ]);
    for (let c = 1; c <= 19; c++) {
      row.getCell(c).style = structuredClone(
        aSchema.dataStyles[Math.min(c - 1, 17)],
      ) as ExcelJS.Style;
      row.getCell(c).numFmt = c === 14 ? "0" : "@";
    }
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer()).slice().buffer;
}
