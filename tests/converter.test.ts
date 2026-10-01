import { beforeAll, describe, expect, it } from "vitest";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { readOrders } from "@/lib/excel/reader";
import { detectPlatform } from "@/lib/excel/detectPlatform";
import {
  exportLotte,
  LOTTE_HEADERS,
  downloadName,
} from "@/lib/excel/exporters/lotte";
import {
  validateOrder,
  duplicateIds,
} from "@/lib/excel/validators/orderValidator";
import { applyProductRules } from "@/lib/excel/transforms/productNameRules";
import {
  DEFAULT_SENDER,
  type NormalizedOrder,
  type Platform,
} from "@/types/order";
const platforms: Platform[] = ["coupang", "smartstore", "toss"];
const sample = async (name: string) =>
  new Uint8Array(await readFile(`samples/${name}.xlsx`)).buffer;
const serialize = async (wb: ExcelJS.Workbook) =>
  new Uint8Array(await wb.xlsx.writeBuffer()).buffer;
const sender = { ...DEFAULT_SENDER, phone: "02-0000-0000" };
let orders: NormalizedOrder[] = [];
let expected: Record<Platform, Partial<NormalizedOrder>[]>;
beforeAll(async () => {
  expected = JSON.parse(await readFile("samples/expected.json", "utf8"));
  orders = (
    await Promise.all(
      platforms.map(
        async (platform) =>
          (
            await readOrders(
              await sample(platform),
              `${platform}.xlsx`,
              platform,
            )
          ).orders,
      ),
    )
  ).flat();
});
describe("실제 샘플 기반 감지·파싱", () => {
  for (const [platform, count, header] of [
    ["coupang", 3, 1],
    ["smartstore", 5, 2],
    ["toss", 2, 2],
  ] as const) {
    it(`${platform}: 실제 헤더 및 ${count}건을 감지한다`, async () => {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await sample(platform));
      const matches = detectPlatform(wb);
      expect(matches).toHaveLength(1);
      expect(matches[0].adapter.platform).toBe(platform);
      expect(matches[0].headerRow).toBe(header);
      expect(orders.filter((o) => o.platform === platform)).toHaveLength(count);
    });
    it(`${platform}: 첫 주문을 포함해 모든 주문을 독립 XML 판독값과 대조한다`, () => {
      const actual = orders.filter((o) => o.platform === platform);
      actual.forEach((order, index) => {
        expect(order).toMatchObject(expected[platform][index]);
        expect(typeof order.orderId).toBe("string");
        expect(typeof order.receiverPhone1).toBe("string");
        expect(typeof order.postalCode).toBe("string");
      });
    });
  }
  it("토스의 수정 안내 행을 주문으로 취급하지 않는다", () => {
    expect(
      orders.filter((o) => o.platform === "toss").map((o) => o.sourceRow),
    ).toEqual([4, 5]);
  });
  it("토스 안내 행이 삭제된 파일도 첫 주문을 버리지 않는다", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await sample("toss"));
    wb.worksheets[0].spliceRows(3, 1);
    const result = await readOrders(await serialize(wb), "toss.xlsx", "x");
    expect(result.orders).toHaveLength(2);
    expect(result.orders[0].orderId).toBe(expected.toss[0].orderId);
  });
  it("스마트스토어 통합배송지가 없을 때만 기본·상세 주소를 합친다", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await sample("smartstore"));
    const ws = wb.worksheets[0];
    ws.getCell("AY3").value = "";
    ws.getCell("AZ3").value = "서울특별시 테스트로 1";
    ws.getCell("BA3").value = "101호";
    const result = await readOrders(
      await serialize(wb),
      "smartstore.xlsx",
      "x",
    );
    expect(result.orders[0].address).toBe("서울특별시 테스트로 1 101호");
    expect(result.orders[1].address).toBe(expected.smartstore[1].address);
  });
  it("주문번호가 빠진 행도 읽고 오류로 표시한다", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await sample("coupang"));
    wb.worksheets[0].getCell("C2").value = null;
    const result = await readOrders(await serialize(wb), "coupang.xlsx", "x");
    expect(result.orders).toHaveLength(3);
    expect(validateOrder(result.orders[0])).toContainEqual(
      expect.objectContaining({ level: "error", field: "orderId" }),
    );
  });
  it("모든 지원 시트를 처리하고 미인식 시트를 알린다", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await sample("coupang"));
    const copy = wb.addWorksheet("복사");
    wb.worksheets[0].eachRow((row) => copy.addRow(row.values));
    wb.addWorksheet("메모").addRow(["내용"]);
    const result = await readOrders(await serialize(wb), "multi.xlsx", "multi");
    expect(result.orders).toHaveLength(6);
    expect(result.file.details).toContain("미인식 시트 제외: 메모");
  });
});
describe("데이터 보존·검증", () => {
  it("긴 텍스트 주문번호와 앞자리 0, 안심번호를 보존한다", () => {
    expect(orders[0].postalCode).toBe("01619");
    expect(orders[0].receiverPhone1).toMatch(/^0504-/);
    expect(
      orders.find((o) => o.platform === "smartstore")?.orderId,
    ).toHaveLength(16);
  });
  it("숫자형 긴 주문번호는 정밀도 위험으로 출력 차단한다", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await sample("smartstore"));
    wb.worksheets[0].getCell("B3").value = 1234567890123456;
    const result = await readOrders(
      await serialize(wb),
      "smartstore.xlsx",
      "x",
    );
    expect(validateOrder(result.orders[0])).toContainEqual(
      expect.objectContaining({ level: "error", field: "orderId" }),
    );
  });
  it("수식 셀은 확인 없이 사용하지 않는다", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await sample("coupang"));
    wb.worksheets[0].getCell("C2").value = {
      formula: '"12345"',
      result: "12345",
    };
    const result = await readOrders(await serialize(wb), "coupang.xlsx", "x");
    expect(result.orders[0].sourceIssues).toContainEqual(
      expect.objectContaining({ level: "error", field: "orderId" }),
    );
  });
  it("지수 표기 텍스트 주문번호도 그대로 출력하지 않는다", () => {
    expect(
      validateOrder({ ...orders[0], orderId: "1.31033E+13" }),
    ).toContainEqual(
      expect.objectContaining({ level: "error", field: "orderId" }),
    );
  });
  it("수량 0·음수·소수·NaN 및 필수값 누락을 오류로 분류한다", () => {
    for (const quantity of [0, -1, 1.5, NaN])
      expect(validateOrder({ ...orders[0], quantity })).toContainEqual(
        expect.objectContaining({ level: "error", field: "quantity" }),
      );
    for (const field of [
      "receiverName",
      "receiverPhone1",
      "address",
      "productName",
    ] as const)
      expect(validateOrder({ ...orders[0], [field]: "" })).toContainEqual(
        expect.objectContaining({ level: "error", field }),
      );
  });
  it("옵션·메시지 누락 및 특이 전화번호는 경고로만 남긴다", () => {
    const order = {
      ...orders[0],
      optionName: "",
      deliveryMessage: "",
      receiverPhone1: "+82 10 1234 5678",
    };
    expect(validateOrder(order).every((i) => i.level === "warning")).toBe(true);
    expect(order.receiverPhone1).toBe("+82 10 1234 5678");
  });
  it("중복의 모든 행을 표시하되 플랫폼·상품주문번호를 구분한다", () => {
    expect(duplicateIds(orders).size).toBe(0);
    expect(duplicateIds([...orders, { ...orders[0], id: "copy" }]).size).toBe(
      2,
    );
    const n = orders.find((o) => o.platform === "smartstore")!;
    expect(
      duplicateIds([n, { ...n, id: "other", productOrderId: "other" }]).size,
    ).toBe(0);
  });
  it("상품명 규칙은 정확한 이름만 치환하고 원본을 변경하지 않는다", () => {
    const original = orders[0];
    const result = applyProductRules(original, [
      { id: "rule", from: original.productName, to: "블랭킷" },
    ]);
    expect(result.productName).toBe("블랭킷");
    expect(original.productName).not.toBe("블랭킷");
    expect(result.optionName).toBe(original.optionName);
    expect(
      applyProductRules(original, [
        { id: "r", from: "일부 문자열", to: "변환" },
      ]),
    ).toBe(original);
  });
});
describe("롯데 출력과 다시 읽기", () => {
  it("원본 18열·단일 시트·서식·전체 주문 값 및 타입을 보존한다", async () => {
    const template = new ExcelJS.Workbook();
    await template.xlsx.load(await sample("lotte-template"));
    const output = await exportLotte(orders, sender);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(output);
    expect(wb.worksheets).toHaveLength(1);
    const ws = wb.worksheets[0];
    expect(ws.name).toBe(template.worksheets[0].name);
    expect(ws.columnCount).toBe(18);
    expect(ws.rowCount).toBe(11);
    expect(ws.getRow(1).values).toEqual(
      template.worksheets[0].getRow(1).values,
    );
    expect(LOTTE_HEADERS).toHaveLength(18);
    for (let col = 1; col <= 18; col++) {
      expect(ws.getColumn(col).width).toBe(
        template.worksheets[0].getColumn(col).width,
      );
      expect(ws.getCell(1, col).style).toEqual(
        template.worksheets[0].getCell(1, col).style,
      );
    }
    orders.forEach((order, i) => {
      const row = ws.getRow(i + 2);
      expect(row.getCell(1).value).toBe(order.orderId);
      expect(row.getCell(7).value).toBe(order.receiverName);
      expect(row.getCell(8).value).toBe(order.receiverPhone1);
      expect(row.getCell(9).value).toBe(order.receiverPhone2);
      expect(row.getCell(10).value).toBe(order.postalCode);
      expect(row.getCell(11).value).toBe(order.address);
      expect(row.getCell(12).value).toBe(order.productName);
      expect(row.getCell(13).value).toBe(order.optionName);
      expect(row.getCell(14).value).toBe(order.quantity);
      expect(row.getCell(15).value).toBe(order.deliveryMessage);
      expect(row.getCell(16).value).toBe("신용");
      expect(row.getCell(17).value).toBe("");
      expect(row.getCell(18).value).toBe("");
      for (const col of [1, 3, 4, 5, 8, 9, 10]) {
        expect(row.getCell(col).type).toBe(ExcelJS.ValueType.String);
        expect(row.getCell(col).numFmt).toBe("@");
      }
    });
    await mkdir("outputs/verification", { recursive: true });
    await writeFile(
      "outputs/verification/lotte-all-markets.xlsx",
      new Uint8Array(output),
    );
  });
  for (const platform of platforms)
    it(`${platform} 단독 출력도 생성하여 재검증한다`, async () => {
      const subset = orders.filter((o) => o.platform === platform);
      const wb = new ExcelJS.Workbook();
      const buffer = await exportLotte(subset, sender);
      await wb.xlsx.load(buffer);
      expect(wb.worksheets[0].rowCount).toBe(subset.length + 1);
      await mkdir("outputs/verification", { recursive: true });
      await writeFile(
        `outputs/verification/lotte-${platform}.xlsx`,
        new Uint8Array(buffer),
      );
    });
  it("문자열 =로 시작하는 값은 실행 가능한 Excel 수식이 되지 않는다", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(
      await exportLotte(
        [
          {
            ...orders[0],
            productName: '=HYPERLINK("https://example.invalid")',
          },
        ],
        sender,
      ),
    );
    expect(wb.worksheets[0].getCell("L2").type).toBe(ExcelJS.ValueType.String);
  });
  it("오류 주문·빈 출력·누락 발송인을 거부한다", async () => {
    await expect(
      exportLotte([{ ...orders[0], address: "" }], sender),
    ).rejects.toThrow("오류");
    await expect(exportLotte([], sender)).rejects.toThrow("없습니다");
    await expect(exportLotte(orders, DEFAULT_SENDER)).rejects.toThrow("발송인");
  });
  it("한국 시간 기준 파일명을 만든다", () => {
    expect(downloadName(new Date("2026-09-29T16:00:00Z"))).toBe(
      "롯데택배_송장등록_2026-09-30.xlsx",
    );
  });
});
describe("파일 오류", () => {
  it("암호화 파일·손상 파일·다른 확장자를 구분한다", async () => {
    await expect(
      readOrders(
        Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0]).buffer,
        "locked.xlsx",
        "x",
      ),
    ).rejects.toMatchObject({ code: "encrypted" });
    await expect(
      readOrders(new ArrayBuffer(10), "bad.xlsx", "x"),
    ).rejects.toMatchObject({ code: "corrupt" });
    await expect(
      readOrders(new ArrayBuffer(10), "bad.csv", "x"),
    ).rejects.toMatchObject({ code: "unsupported" });
  });
  it("미지원 파일에 시트 정보를 제공한다", async () => {
    await expect(
      readOrders(await sample("lotte-template"), "template.xlsx", "x"),
    ).rejects.toMatchObject({
      code: "unsupported",
      details: expect.stringContaining("Sheet1"),
    });
  });
});
