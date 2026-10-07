import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import {
  readSplitOrders,
  exportSplitGroup,
  splitFilename,
  classifyFill,
  markDeliveryMessage,
} from "@/lib/private-shipping/converter";
import { readOrders } from "@/lib/excel/reader";
import { exportLotte, LOTTE_HEADERS } from "@/lib/excel/exporters/lotte";
import { DEFAULT_SENDER } from "@/types/order";

const sender = { ...DEFAULT_SENDER, phone: "02-0000-0000" };
const bytes = async (w: ExcelJS.Workbook) =>
  new Uint8Array(await w.xlsx.writeBuffer()).buffer;
const load = async (b: ArrayBuffer) => {
  const w = new ExcelJS.Workbook();
  await w.xlsx.load(b);
  return w.worksheets[0];
};
describe("개인용 분리 출력", () => {
  it("표준 주황색과 원본 기본 배경을 구분하고 이전 노란색은 지정송하인으로 분류하지 않는다", () => {
    for (const argb of ["FFFFC000", "FFC000"]) {
      expect(
        classifyFill({ type: "pattern", pattern: "solid", fgColor: { argb } }),
      ).toBe("orange");
    }
    for (const argb of ["FFFFFFFF", "FFF8F9FA", "FFF3F3F3"]) {
      expect(
        classifyFill({ type: "pattern", pattern: "solid", fgColor: { argb } }),
      ).toBe("plain");
    }
    expect(classifyFill(undefined)).toBe("plain");
    expect(
      classifyFill({
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" },
      }),
    ).toBe("plain");
  });
  it("배송메시지 표시를 선명하게 바꾸고 중복 표시를 방지한다", () => {
    expect(markDeliveryMessage("문 앞에 놓아주세요")).toBe(
      "[R] 문 앞에 놓아주세요",
    );
    expect(markDeliveryMessage("")).toBe("[R]");
    expect(markDeliveryMessage("®문 앞")).toBe("[R] 문 앞");
    expect(markDeliveryMessage("[R] 문 앞")).toBe("[R] 문 앞");
  });
  it("실제 토스 구조에서 수령인 색상만 사용하고 일반 출력은 그대로 유지한다", async () => {
    const w = new ExcelJS.Workbook();
    await w.xlsx.readFile("samples/toss.xlsx");
    const s = w.worksheets[0];
    const header = s.getRow(2);
    const col = (name: string) => {
      let n = 0;
      header.eachCell((c, i) => {
        if (c.text === name) n = i;
      });
      return n;
    };
    s.getCell(4, col("수령인명")).style = structuredClone(
      s.getCell(4, col("수령인명")).style,
    );
    s.getCell(4, col("수령인명")).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFC000" },
    };
    s.getCell(5, col("수령인명")).style = structuredClone(
      s.getCell(5, col("수령인명")).style,
    );
    s.getCell(5, col("수령인명")).fill = { type: "pattern", pattern: "none" };
    s.getCell(5, col("구매자명")).style = structuredClone(
      s.getCell(5, col("구매자명")).style,
    );
    s.getCell(5, col("구매자명")).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFC000" },
    };
    const data = await bytes(w);
    const result = await readSplitOrders(data, "toss.xlsx", "test");
    expect(result.split.map((r) => r.group)).toEqual(["orange", "plain"]);
    const regular = await readOrders(data, "toss.xlsx", "test");
    expect(result.orders).toEqual(regular.orders);
    result.split.forEach(({ order }, i) => {
      expect(order.productName).toBe(regular.orders[i].productName);
      expect(order.productName).toBe(s.getCell(order.sourceRow, 10).text);
    });
    const orange = await load(
      await exportSplitGroup(result.split, "orange", sender),
    );
    const plain = await load(
      await exportSplitGroup(result.split, "plain", sender),
    );
    expect(
      Array.from({ length: 18 }, (_, i) => orange.getCell(1, i + 1).text),
    ).toEqual(LOTTE_HEADERS);
    expect(orange.getCell("O2").text).toBe(
      ("[R] " + result.orders[0].deliveryMessage).trimEnd(),
    );
    expect(plain.getCell("N1").text).toBe("수량(B타입)");
    expect(plain.getCell("S1").text).toBe("수량(A타입)");
    expect(plain.getCell("N2").value).toBe(result.orders[1].quantity);
    expect(plain.getCell("S2").value).toBeNull();
    expect(orange.getCell("L2").text).toBe(regular.orders[0].optionName);
    expect(plain.getCell("L2").text).toBe(regular.orders[1].optionName);
    expect(plain.getCell("K1").text).toBe("주소");
    expect(plain.getCell("L1").text).toBe("상품명1");
    expect(plain.getCell("K2").text).toBe(regular.orders[1].address);
    const old = await load(await exportLotte(regular.orders, sender));
    expect(old.getCell("L2").text).toBe(regular.orders[0].productName);
    expect(old.getCell("O2").text).toBe(regular.orders[0].deliveryMessage);
    const expected = await load(
      await exportLotte(
        [
          {
            ...regular.orders[0],
            productName: regular.orders[0].optionName,
            optionName: regular.orders[0].productName,
            deliveryMessage: (
              "[R] " + regular.orders[0].deliveryMessage
            ).trimEnd(),
          },
        ],
        sender,
      ),
    );
    for (let c = 1; c <= 18; c++) {
      expect(orange.getCell(2, c).style).toEqual(expected.getCell(2, c).style);
      expect(orange.getCell(2, c).value).toEqual(expected.getCell(2, c).value);
    }
    expect(splitFilename("orange", new Date("2026-10-02T00:00:00Z"))).toBe(
      "엔에스벨류몰_B-type[지정송하인]_20261002.xlsx",
    );
  });
  it("토스 K열이 비어 있으면 상품명으로 대체하지 않고 출력 오류를 알린다", async () => {
    const w = new ExcelJS.Workbook();
    await w.xlsx.readFile("samples/toss.xlsx");
    const sheet = w.worksheets[0];
    sheet.getRow(2).eachCell((cell, column) => {
      if (cell.text === "옵션명") {
        sheet.getCell(4, column).value = "";
        sheet.getCell(5, column).value = "   ";
      }
    });
    const result = await readSplitOrders(await bytes(w), "toss.xlsx", "test");
    result.split.forEach(({ order }) => {
      expect(order.optionName).toBe("");
    });
    await expect(exportSplitGroup(result.split, "plain", sender)).rejects.toThrow("오류 주문");
  });
  it.each(["orange", "plain"] as const)("%s 출력 L·M 데이터만 토스 옵션명·원래 상품명으로 교환한다", async (group) => {
    const w = new ExcelJS.Workbook();
    await w.xlsx.readFile("samples/toss.xlsx");
    const result = await readSplitOrders(await bytes(w), "toss.xlsx", "test");
    const rows = result.split.map(({ order }) => ({
      group,
      order,
    }));
    const sheet = await load(await exportSplitGroup(rows, group, sender));
    expect(sheet.getCell("L1").text).toBe("상품명1");
    expect(sheet.getCell("M1").text).toBe("상품상세1");
    rows.forEach(({ order }, i) => {
      expect(sheet.getCell(i + 2, 12).text).toBe(w.worksheets[0].getCell(order.sourceRow, 11).text);
      expect(sheet.getCell(i + 2, 13).text).toBe(w.worksheets[0].getCell(order.sourceRow, 10).text);
      expect(sheet.getCell(i + 2, 11).text).toBe(order.address);
    });
  });
  it.each(["coupang", "smartstore"])("%s의 상품명은 그대로 유지한다", async (platform) => {
    const w = new ExcelJS.Workbook();
    await w.xlsx.readFile(`samples/${platform}.xlsx`);
    const result = await readSplitOrders(await bytes(w), `${platform}.xlsx`, "test");
    expect(result.split.map(({ order }) => order)).toEqual(result.orders);
    for (const group of ["orange", "plain"] as const) {
      const sheet = await load(await exportSplitGroup(
        result.split.map((row) => ({ ...row, group })), group, sender,
      ));
      result.orders.forEach((order, i) => {
        expect(sheet.getCell(i + 2, 12).text).toBe(order.productName);
        expect(sheet.getCell(i + 2, 13).text).toBe(order.optionName);
      });
    }
  });
  it("주황색 외에는 지정으로 분류하고 주문이 없는 쪽은 헤더만 만든다", async () => {
    expect(
      classifyFill({
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF0000" },
      }),
    ).toBe("plain");
    for (const group of ["orange", "plain"] as const) {
      const s = await load(await exportSplitGroup([], group, sender));
      expect(s.rowCount).toBe(1);
    }
  });
});
