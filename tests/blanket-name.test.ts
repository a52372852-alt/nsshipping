import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { applyProductRules } from "@/lib/excel/transforms/productNameRules";
import {
  readSplitOrders,
  exportSplitGroup,
} from "@/lib/private-shipping/converter";
import { exportLotte } from "@/lib/excel/exporters/lotte";
import { DEFAULT_SENDER, type NormalizedOrder } from "@/types/order";
import { coupang } from "@/lib/excel/parsers/coupang";
import { toss } from "@/lib/excel/parsers/toss";
import { smartstore } from "@/lib/excel/parsers/smartstore";

const names = [
  "무릎담요_그레이",
  "무릎담요_베이지",
  "무릎담요_블루",
  "베이지싱글",
  "베이지더블",
  "그레이싱글",
  "그레이더블",
  "포레스트그린싱글",
  "포레스트그린더블",
];
const sender = { ...DEFAULT_SENDER, phone: "02-0000-0000" };
const base: NormalizedOrder = {
  id: "1",
  fileId: "test",
  platform: "coupang",
  sourceFileName: "test.xlsx",
  sourceSheet: "주문",
  sourceRow: 2,
  orderId: "order-1",
  productOrderId: "",
  receiverName: "테스트",
  receiverPhone1: "010-0000-0000",
  receiverPhone2: "",
  postalCode: "12345",
  address: "테스트 주소 1",
  productName: "",
  optionName: "",
  quantity: 2,
  deliveryMessage: "문 앞",
  sourceIssues: [],
};
const load = async (data: ArrayBuffer) => {
  const w = new ExcelJS.Workbook();
  await w.xlsx.load(data);
  return w.worksheets[0];
};

describe("담요 상품명 단축", () => {
  for (const adapter of [coupang, toss, smartstore]) {
    it(`${adapter.platform}: 아홉 종류의 원본 주문 → 화면용 이름 → 지정·지정송하인·일반 출력`, async () => {
      const w = new ExcelJS.Workbook();
      const s = w.addWorksheet("주문");
      const headers = [
        ...new Set([
          ...adapter.signature,
          ...Object.values(adapter.mapping).map((v) => v![0]),
        ]),
      ];
      s.addRow(headers);
      names.forEach((name, index) => {
        const knee = name.startsWith("무릎담요_");
        const color = knee
          ? name.split("_")[1]
          : name.replace(/싱글|더블/g, "");
        const size = knee
          ? "무릎 담요(100x150)"
          : name.endsWith("싱글")
            ? "싱글"
            : "더블";
        const full = `[무료배송] NS 극세사 블랭킷 코지 ${color} ${size}`;
        const order = {
          ...base,
          orderId: `order-${index}`,
          productName: full,
          optionName: `색상: ${color} / 사이즈: ${knee ? "100x150" : size}`,
          address: `테스트 주소 ${index}`,
        };
        s.addRow(
          headers.map((h) => {
            const key = Object.entries(adapter.mapping).find(
              ([, aliases]) => aliases?.[0] === h,
            )?.[0];
            return key ? order[key as keyof typeof order] : "";
          }),
        );
      });
      const data = new Uint8Array(await w.xlsx.writeBuffer()).buffer;
      const parsed = await readSplitOrders(
        data,
        `${adapter.platform}.xlsx`,
        "test",
      );
      const original = structuredClone(parsed.split);
      const rows = parsed.split.map((r) => ({
        ...r,
        order: applyProductRules(r.order, []),
      }));
      expect(rows.map((r) => r.order.productName)).toEqual(names);
      expect(rows.map((r) => r.order.optionName)).toEqual(names);
      const plain = await load(await exportSplitGroup(rows, "plain", sender));
      const orange = await load(
        await exportSplitGroup(
          rows.map((r) => ({ ...r, group: "orange" as const })),
          "orange",
          sender,
        ),
      );
      const normal = await load(
        await exportLotte(
          rows.map((r) => r.order),
          sender,
        ),
      );
      names.forEach((name, i) => {
        expect(plain.getCell(i + 2, 12).value).toBe(`${name}-2개`);
        expect(plain.getCell(i + 2, 13).value).toBe(`${name}-2개`);
        expect(plain.getCell(i + 2, 14).value).toBe(1);
        expect(orange.getCell(i + 2, 12).value).toBe("Blanket");
        expect(orange.getCell(i + 2, 13).value).toBe(name);
        expect(orange.getCell(i + 2, 14).value).toBe(2);
        expect(normal.getCell(i + 2, 12).value).toBe(name);
        expect(normal.getCell(i + 2, 13).value).toBe(name);
      });
      expect(parsed.split).toEqual(original);
    });
  }
  for (const platform of ["coupang", "toss", "smartstore"] as const) {
    it(`${platform}: 담요 단어 없는 단축명 뒤 치수를 제거하고 엑셀 수량 유지`, async () => {
      const dimensions = [
        "(150x200)",
        " 180×200cm",
        "[150*200cm]",
        "180cmX200cm",
        "(150 x 200)cm",
        "_180x200, 1개",
      ];
      const rows = names.slice(3).map((name, i) => {
        const text = name + dimensions[i];
        const order = applyProductRules(
          {
            ...base,
            id: String(i),
            platform,
            productName: text,
            optionName: text,
            quantity: i + 1,
          },
          [],
        );
        expect(order.productName).toBe(name);
        expect(order.optionName).toBe(name);
        return { order, group: "plain" as const };
      });
      const sheet = await load(await exportSplitGroup(rows, "plain", sender));
      const expected = names
        .slice(3)
        .map((name, i) => `${name}-${i + 1}개`)
        .join(" ■ ");
      expect(sheet.getCell("L2").value).toBe(expected);
      expect(sheet.getCell("M2").value).toBe(expected);
      expect(sheet.getCell("N2").value).toBe(1);
      const orange = await load(
        await exportSplitGroup(
          rows.map((r) => ({ ...r, group: "orange" as const })),
          "orange",
          sender,
        ),
      );
      names.slice(3).forEach((name, i) => {
        expect(orange.getCell(i + 2, 12).value).toBe("Blanket");
        expect(orange.getCell(i + 2, 13).value).toBe(name);
        expect(orange.getCell(i + 2, 14).value).toBe(i + 1);
      });
    });
  }
  it("사용자 저장 치환명에 붙은 치수도 제거한다", () => {
    const order = {
      ...base,
      productName: "판매 상품",
      optionName: "그레이더블(180×200cm)",
    };
    const result = applyProductRules(order, [
      { id: "r", from: order.productName, to: "그레이더블(180×200cm)" },
    ]);
    expect(result.productName).toBe("그레이더블");
    expect(result.optionName).toBe("그레이더블");
    expect(result.quantity).toBe(2);
  });
  it("선택 옵션을 제목의 여러 색상·사이즈보다 우선하고 묶음별 상품 수량을 유지한다", async () => {
    const order = applyProductRules(
      {
        ...base,
        productName: "NS 담요 베이지 그레이 싱글 더블",
        optionName: "포레스트 그린 / 더블",
      },
      [],
    );
    expect(order.productName).toBe("포레스트그린더블");
    const other = applyProductRules(
      {
        ...base,
        id: "2",
        productName: "NS 무릎 담요",
        optionName: "그레이 100x150, 1개",
        quantity: 1,
      },
      [],
    );
    const sheet = await load(
      await exportSplitGroup(
        [
          { order, group: "plain" },
          { order: other, group: "plain" },
        ],
        "plain",
        sender,
      ),
    );
    expect(sheet.rowCount).toBe(2);
    expect(sheet.getCell("L2").value).toBe(
      "포레스트그린더블-2개 ■ 무릎담요_그레이-1개",
    );
    expect(sheet.getCell("M2").value).toBe(sheet.getCell("L2").value);
  });
  it.each([
    ["베이지 싱글 침대 프레임", ""],
    ["NS 무릎 담요", "색상: 그레이/베이지"],
    ["NS 담요", "베이지 슈퍼싱글"],
    ["NS 담요", "블루 더블"],
    ["NS 담요", "포레스트그린 무릎담요"],
    ["NS 담요", "베이지 150x200"],
    ["NS 담요", "베이지 100x1500"],
    ["NS 담요", "베이지 싱글 더블"],
    ["NS 무릎담요", ""],
  ])(
    "불명확하거나 요청 범위 밖의 상품은 유지: %s / %s",
    (productName, optionName) => {
      const order = { ...base, productName, optionName };
      expect(applyProductRules(order, [])).toBe(order);
    },
  );
  it.each(names)("이미 단축된 이름은 반복 처리해도 동일: %s", (name) => {
    const order = { ...base, productName: name, optionName: name };
    expect(applyProductRules(applyProductRules(order, []), [])).toEqual(order);
  });
  it("명시적으로 저장한 사용자 치환 규칙을 우선한다", () => {
    const order = {
      ...base,
      productName: "NS 무릎담요 베이지",
      optionName: "베이지",
    };
    expect(
      applyProductRules(order, [
        { id: "r", from: order.productName, to: "맞춤상품" },
      ]),
    ).toEqual({ ...order, productName: "맞춤상품" });
  });
});
