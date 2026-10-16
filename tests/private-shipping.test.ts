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
    expect(plain.getCell("N2").value).toBe(1);
    expect(plain.getCell("S2").value).toBeNull();
    const old = await load(await exportLotte(regular.orders, sender));
    expect(old.getCell("O2").text).toBe(regular.orders[0].deliveryMessage);
    const expected = await load(
      await exportLotte(
        [
          {
            ...regular.orders[0],
            productName: "Blanket",
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
  it.each(["toss", "coupang", "smartstore"])("%s 지정송하인의 모든 L열은 Blanket이고 다른 출력 항목과 원본은 유지한다", async (platform) => {
    const w = new ExcelJS.Workbook();
    await w.xlsx.readFile(`samples/${platform}.xlsx`);
    const result = await readSplitOrders(await bytes(w), `${platform}.xlsx`, "test");
    const original = structuredClone(result.orders);
    for (const group of ["orange", "plain"] as const) {
      const sheet = await load(await exportSplitGroup(
        result.split.map((row) => ({ ...row, group })), group, sender,
      ));
      expect(sheet.getCell("L1").text).toBe("상품명1");
      result.orders.forEach((order, i) => {
        const singleParcel = group === "plain";
        expect(sheet.getCell(i + 2, 12).text).toBe(group === "orange" ? "Blanket" : `${order.optionName}-${order.quantity}개`);
        expect(sheet.getCell(i + 2, 13).text).toBe(group === "orange" ? order.optionName : singleParcel ? `${order.productName}-${order.quantity}개` : order.productName);
        expect(sheet.getCell(i + 2, 11).text).toBe(order.address);
        expect(sheet.getCell(i + 2, 14).value).toBe(singleParcel ? 1 : order.quantity);
      });
    }
    const regular = await load(await exportLotte(result.orders, sender));
    result.orders.forEach((order, i) => {
      expect(regular.getCell(i + 2, 12).text).toBe(order.productName);
    });
    expect(result.orders).toEqual(original);
  });
  it.each(["coupang", "smartstore", "toss"].flatMap((platform) => [1, 2, 3, 4, 12].map((quantity) => [platform, quantity] as const)))("%s 지정 %i개 주문은 한 건으로 출력하고 상품상세에 실제 수량을 표시한다", async (platform, quantity) => {
    const w = new ExcelJS.Workbook();
    await w.xlsx.readFile(`samples/${platform}.xlsx`);
    const result = await readSplitOrders(await bytes(w), `${platform}.xlsx`, "test");
    const order = { ...result.orders[0], productName: "코지 블루 무릎담요(100x150)", quantity };
    const original = structuredClone(order);
    const rows = [{ order, group: "plain" as const }];
    const sheet = await load(await exportSplitGroup(rows, "plain", sender));
    expect(sheet.rowCount).toBe(2);
    expect(sheet.getCell("L2").text).toBe(`${order.optionName}-${quantity}개`);
    expect(sheet.getCell("M2").text).toBe(`코지 블루 무릎담요(100x150)-${quantity}개`);
    expect(sheet.getCell("N2").value).toBe(1);
    // Repeated downloads must not mutate the source or append the quantity twice.
    const repeated = await load(await exportSplitGroup(rows, "plain", sender));
    expect(repeated.getRow(2).values).toEqual(sheet.getRow(2).values);
    expect(order).toEqual(original);
    const regular = await load(await exportLotte([order], sender));
    expect(regular.getCell("N2").value).toBe(quantity);
  });
  it.each(["coupang", "smartstore", "toss"])("%s 수령인이 달라도 같은 주소의 여러 상품을 한 행으로 묶는다", async (platform) => {
    const w = new ExcelJS.Workbook();
    await w.xlsx.readFile(`samples/${platform}.xlsx`);
    const result = await readSplitOrders(await bytes(w), `${platform}.xlsx`, "test");
    const base = { ...result.orders[0], orderId: "order-1", receiverName: "테스트", address: "서울시 테스트로 1 101호", quantity: 4,
      optionName: "코지 베이지 무릎담요(100x150)", productName: "베이지 상품", deliveryMessage: "문 앞" };
    const otherAddress = { ...base, orderId: "order-2", address: "서울시 테스트로 1 102호" };
    const second = { ...base, orderId: "order-3", optionName: "코지 그레이 무릎담요(100x150)", productName: "그레이 상품", deliveryMessage: "벨 눌러주세요" };
    const otherReceiver = { ...base, orderId: "order-4", receiverName: "다른 수령인" };
    const orders = [base, otherAddress, second, otherReceiver];
    const original = structuredClone(orders);
    const rows = orders.map((order) => ({ order, group: "plain" as const }));
    const sheet = await load(await exportSplitGroup(rows, "plain", sender));
    expect(sheet.rowCount).toBe(3);
    expect(sheet.getCell("A2").text).toBe("order-1,order-3,order-4");
    expect(sheet.getCell("L2").text).toBe("코지 베이지 무릎담요(100x150)-4개 ■ 코지 그레이 무릎담요(100x150)-4개 ■ 코지 베이지 무릎담요(100x150)-4개");
    expect(sheet.getCell("M2").text).toBe("베이지 상품-4개 ■ 그레이 상품-4개 ■ 베이지 상품-4개");
    expect(sheet.getCell("N2").value).toBe(1);
    expect(sheet.getCell("O2").text).toBe("문 앞,벨 눌러주세요");
    expect(sheet.getCell("K3").text).toBe(otherAddress.address);
    expect(sheet.getCell("G2").text).toBe(base.receiverName);
    const single = await load(await exportSplitGroup([rows[0]], "plain", sender));
    for (let c = 1; c <= 19; c++) {
      expect(sheet.getCell(2, c).style).toEqual(single.getCell(2, c).style);
      if (![1, 12, 13, 15].includes(c)) expect(sheet.getCell(2, c).value).toEqual(single.getCell(2, c).value);
    }
    const repeated = await load(await exportSplitGroup(rows, "plain", sender));
    expect(repeated.getRow(2).values).toEqual(sheet.getRow(2).values);
    expect(orders).toEqual(original);
    const orange = await load(await exportSplitGroup(rows.map((r) => ({ ...r, group: "orange" })), "orange", sender));
    expect(orange.rowCount).toBe(5);
    expect(orange.getCell("L2").text).toBe("Blanket");
    expect((await load(await exportLotte(orders, sender))).rowCount).toBe(5);
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
