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
    const old = await load(await exportLotte(regular.orders, sender));
    expect(old.getCell("O2").text).toBe(regular.orders[0].deliveryMessage);
    const expected = await load(
      await exportLotte(
        [
          {
            ...regular.orders[0],
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
