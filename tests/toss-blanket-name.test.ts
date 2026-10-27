import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { applyProductRules } from "@/lib/excel/transforms/productNameRules";
import { shortenBlanketName } from "@/lib/excel/transforms/blanketName";
import { exportSplitGroup } from "@/lib/private-shipping/converter";
import { DEFAULT_SENDER, type NormalizedOrder } from "@/types/order";
const base: NormalizedOrder = {
  id: "test",
  fileId: "test",
  platform: "toss",
  sourceFileName: "test.xlsx",
  sourceSheet: "주문내역",
  sourceRow: 4,
  orderId: "order",
  productOrderId: "product-order",
  receiverName: "테스트",
  receiverPhone1: "010-0000-0000",
  receiverPhone2: "",
  postalCode: "12345",
  address: "테스트로 1",
  productName: "NS 극세사 블랭킷 무릎 담요",
  optionName: "",
  quantity: 2,
  deliveryMessage: "문 앞",
  sourceIssues: [],
};
const sender = { ...DEFAULT_SENDER, phone: "02-0000-0000" };
const load = async (b: ArrayBuffer) => {
  const w = new ExcelJS.Workbook();
  await w.xlsx.load(b);
  return w.worksheets[0];
};
describe("토스 옵션 치수 우선 출력", () => {
  it.each([
    ["크림 베이지, 150x200, 1개", 1, "베이지싱글"],
    ["그레이, 150X200, 1개", 3, "그레이싱글"],
    ["포레스트 그린, 180x200, 1개", 2, "포레스트그린더블"],
    ["크림 베이지, 180 × 200 cm, 1개", 1, "베이지더블"],
    ["코지 블루, 100x150, 1개", 2, "무릎담요_블루"],
    ["크림 베이지, 120*160, 1개", 1, "무릎담요_베이지"],
    ["그레이, 150x2000, 1개", 2, "무릎담요_그레이"],
    ["포레스트 그린, 100x150, 1개", 1, "무릎담요_포레스트그린"],
    ["라벤더, 120x160, 1개", 1, "무릎담요_라벤더"],
  ])(
    "%s → %s개 상품을 치수와 수량으로 출력",
    async (optionName, quantity, name) => {
      const original = { ...base, optionName, quantity };
      const before = structuredClone(original);
      const order = applyProductRules(original, []);
      expect(order.productName).toBe(name);
      expect(order.optionName).toBe(name);
      const s = await load(
        await exportSplitGroup([{ order, group: "plain" }], "plain", sender),
      );
      expect(s.getCell("L2").value).toBe(`${name}-${quantity}개`);
      expect(s.getCell("M2").value).toBe(`${name}-${quantity}개`);
      expect(s.getCell("N2").value).toBe(1);
      expect(applyProductRules(order, [])).toEqual(order);
      expect(original).toEqual(before);
    },
  );
  it.each(["coupang", "smartstore"] as const)(
    "%s는 기존 상품명 변환과 출력 유지",
    async (platform) => {
      const original = {
        ...base,
        platform,
        optionName: "크림 베이지, 150x200, 1개",
      };
      const before = shortenBlanketName(original);
      const after = applyProductRules(original, []);
      expect(after).toEqual(before);
      const a = await load(
        await exportSplitGroup(
          [{ order: before, group: "plain" }],
          "plain",
          sender,
        ),
      );
      const b = await load(
        await exportSplitGroup(
          [{ order: after, group: "plain" }],
          "plain",
          sender,
        ),
      );
      expect(b.getRow(2).values).toEqual(a.getRow(2).values);
    },
  );
  it("토스의 저장된 무릎담요 치환명보다 실제 옵션 사이즈를 우선한다", () => {
    const original = { ...base, optionName: "크림 베이지, 150x200, 1개" };
    expect(
      applyProductRules(original, [
        { id: "old", from: original.productName, to: "무릎담요_베이지" },
      ]).productName,
    ).toBe("베이지싱글");
  });
  it("싱글·더블·무릎담요 묶음의 상품별 수량과 지정송하인 Blanket 유지", async () => {
    const orders = ["150x200", "180x200", "100x150"].map((size, i) =>
      applyProductRules(
        {
          ...base,
          id: String(i),
          optionName: `베이지, ${size}, 1개`,
          quantity: i + 1,
        },
        [],
      ),
    );
    const s = await load(
      await exportSplitGroup(
        orders.map((order) => ({ order, group: "plain" })),
        "plain",
        sender,
      ),
    );
    expect(s.rowCount).toBe(2);
    expect(s.getCell("L2").value).toBe(
      "베이지싱글-1개 ■ 베이지더블-2개 ■ 무릎담요_베이지-3개",
    );
    expect(s.getCell("M2").value).toBe(s.getCell("L2").value);
    const orange = await load(
      await exportSplitGroup(
        orders.map((order) => ({ order, group: "orange" })),
        "orange",
        sender,
      ),
    );
    expect(orange.getCell("L2").value).toBe("Blanket");
    expect(orange.getCell("M2").value).toBe("베이지싱글");
  });
});
