import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { matchHeader } from "@/lib/templates/matching";
import {
  readTemplate,
  suggestHeader,
  templateColumns,
  cleanTemplate,
  templateFingerprint,
  exportCustomTemplate,
  connectionIssues,
  outputValue,
} from "@/lib/templates/workbook";
import { DEFAULT_SENDER, type NormalizedOrder } from "@/types/order";
import type { TemplateProfile } from "@/lib/templates/types";
const order: NormalizedOrder = {
  id: "synthetic",
  fileId: "f",
  platform: "coupang",
  sourceFileName: "test.xlsx",
  sourceSheet: "주문",
  sourceRow: 2,
  orderId: "123456789012345678",
  productOrderId: "",
  receiverName: "테스트 수취인",
  receiverPhone1: "01012345678",
  receiverPhone2: "0411234567",
  postalCode: "01234",
  address: "테스트시  테스트로 1   101호",
  addressBase: "테스트시 테스트로 1",
  addressDetail: "101호",
  productName: "긴 한글 상품명".repeat(60),
  optionName: "베이지",
  quantity: 3,
  deliveryMessage: "",
  sourceIssues: [],
};
function fixture() {
  const book = new ExcelJS.Workbook();
  book.creator = "PRIVATE_CREATOR";
  const sheet = book.addWorksheet("내 출고 양식");
  sheet.mergeCells("A1:C1");
  sheet.getCell("A1").value = "PRIVATE_INTRO";
  sheet.getRow(3).values = [
    "받는분성명",
    "휴대전화",
    "배송주소",
    "내용품명",
    "우편번호",
    "Qty",
    "배송요청사항",
    "특별코드",
    "전화번호2",
    "",
    "내용품명",
  ];
  sheet.getColumn(1).width = 22;
  sheet.getRow(3).height = 32;
  sheet.getCell("A3").font = { bold: true, color: { argb: "FF123456" } };
  sheet.getRow(5).values = [
    "PRIVATE_RECIPIENT",
    "PRIVATE_PHONE",
    "PRIVATE_ADDRESS",
  ];
  sheet.getRow(5).height = 26;
  sheet.getCell("A5").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEEEEE" },
  };
  sheet.getCell("A5").note = "PRIVATE_NOTE";
  sheet.getCell("G6").value = {
    formula: '"PRIVATE_FORMULA"',
    result: "PRIVATE_RESULT",
  };
  const hidden = book.addWorksheet("추가 시트");
  hidden.state = "hidden";
  hidden.getCell("A1").value = "PRIVATE_HIDDEN";
  return book;
}
async function profile(): Promise<TemplateProfile> {
  const book = fixture();
  const columns = templateColumns(book, "내 출고 양식", 3);
  return {
    version: 1,
    id: "test",
    name: "로젠 환경 A",
    carrier: "logen",
    sheetName: "내 출고 양식",
    headerRow: 3,
    dataStart: 5,
    fingerprint: templateFingerprint("내 출고 양식", columns, 3, 5),
    columns,
    phoneFormat: "original",
    workbook: await cleanTemplate(book, "내 출고 양식", 3, 5),
  };
}
describe("사용자 택배사 양식", () => {
  it("정규화한 확실한 별칭만 연결한다", () => {
    expect(matchHeader("받는분\n성명")).toBe("receiverName");
    expect(matchHeader("우편번호(5자리)")).toBe("postalCode");
    expect(matchHeader(" Q_T_Y ")).toBe("quantity");
    expect(matchHeader("출고 담당자 전화")).toBeNull();
    expect(matchHeader("상세주소")).toBe("addressDetail");
  });
  it("실제 헤더 행을 찾고 중복·빈 열 위치를 보존한다", () => {
    const book = fixture();
    expect(suggestHeader(book)).toMatchObject({
      sheetName: "내 출고 양식",
      headerRow: 3,
    });
    const columns = templateColumns(book, "내 출고 양식", 3);
    expect(columns).toHaveLength(11);
    expect(columns[9].header).toBe("");
    expect(columns[10].field).toBe("productName");
  });
  it("저장본에서 기존 주문·수식·메모·다른 시트 값과 작성자를 제거하고 서식을 유지한다", async () => {
    const p = await profile();
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(p.workbook);
    const model = JSON.stringify(book.model);
    expect(model).not.toContain("PRIVATE_");
    const sheet = book.getWorksheet(p.sheetName)!;
    expect(sheet.getCell("A3").value).toBe("받는분성명");
    expect(sheet.getColumn(1).width).toBe(22);
    expect(sheet.getRow(3).height).toBe(32);
    expect(sheet.getRow(5).height).toBe(26);
    expect(sheet.getCell("A3").font.bold).toBe(true);
    expect(sheet.model.merges).toContain("A1:C1");
    expect(book.worksheets.map((s) => s.name)).toEqual([
      "내 출고 양식",
      "추가 시트",
    ]);
  });
  it("한글·긴 상품명·수량·0으로 시작하는 전화와 우편번호를 실제 출력에서 보존한다", async () => {
    const p = await profile();
    p.columns[7] = { ...p.columns[7], field: "constant", constant: "0012" };
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(
      await exportCustomTemplate(
        p,
        [order, { ...order, id: "two" }],
        DEFAULT_SENDER,
      ),
    );
    const sheet = book.getWorksheet(p.sheetName)!;
    expect(sheet.getRow(5).values).toEqual([
      undefined,
      order.receiverName,
      "01012345678",
      "테스트시 테스트로 1 101호",
      order.productName,
      "01234",
      3,
      "",
      "0012",
      "0411234567",
      "",
      order.productName,
    ]);
    expect(sheet.getCell("E5").numFmt).toBe("@");
    expect(sheet.getCell("F5").type).toBe(ExcelJS.ValueType.Number);
    expect(sheet.getCell("A6").fill).toEqual(sheet.getCell("A5").fill);
    expect(sheet.getCell("A6").value).toBe(order.receiverName);
  });
  it("기본·상세주소 분리와 전화 형식을 선택할 수 있다", async () => {
    const p = await profile();
    const b = p.columns[0];
    expect(
      outputValue(
        { ...b, field: "addressDetail" },
        order,
        DEFAULT_SENDER,
        "original",
      ),
    ).toBe("101호");
    expect(
      outputValue(
        { ...b, field: "receiverPhone1" },
        order,
        DEFAULT_SENDER,
        "hyphen",
      ),
    ).toBe("010-1234-5678");
    expect(
      outputValue(
        { ...b, field: "receiverPhone2" },
        order,
        DEFAULT_SENDER,
        "hyphen",
      ),
    ).toBe("041-123-4567");
    expect(
      outputValue(
        { ...b, field: "receiverPhone1" },
        { ...order, receiverPhone1: "010 1234-5678" },
        DEFAULT_SENDER,
        "digits",
      ),
    ).toBe("01012345678");
  });
  it("파일 데이터가 달라도 구조 식별자는 같고 열 순서가 바뀌면 달라진다", async () => {
    const p = await profile();
    expect(p.fingerprint).not.toContain("PRIVATE_");
    expect(
      templateFingerprint(p.sheetName, [...p.columns].reverse(), 3, 5),
    ).not.toBe(p.fingerprint);
  });
  it("불완전 연결·오류 주문·필요한 발송인 값은 다운로드를 막는다", async () => {
    const p = await profile();
    expect(connectionIssues({ columns: [] })).toHaveLength(4);
    await expect(
      exportCustomTemplate(p, [{ ...order, receiverName: "" }], DEFAULT_SENDER),
    ).rejects.toThrow("오류");
    p.columns[7].field = "senderPhone";
    await expect(
      exportCustomTemplate(p, [order], DEFAULT_SENDER),
    ).rejects.toThrow("발송인");
  });
  it("병합된 입력 영역과 잘못된 위치는 손상된 출력을 만들지 않고 안내한다", async () => {
    const book = fixture();
    book.getWorksheet("내 출고 양식")!.mergeCells("B5:C5");
    await expect(cleanTemplate(book, "내 출고 양식", 3, 5)).rejects.toThrow(
      "병합",
    );
    await expect(
      cleanTemplate(fixture(), "내 출고 양식", 3, 2),
    ).rejects.toThrow("시작 행");
  });
  it("매크로·다른 파일 형식과 손상 파일을 거절한다", async () => {
    await expect(readTemplate(new ArrayBuffer(2), "test.xlsm")).rejects.toThrow(
      ".xlsx",
    );
    await expect(readTemplate(new ArrayBuffer(2), "test.xlsx")).rejects.toThrow(
      "읽지",
    );
  });
});
