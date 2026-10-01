import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";

async function template(extra = false) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("내 로젠 출고");
  sheet.getRow(2).values = [
    "받는분성명",
    "휴대전화",
    "배송주소",
    "내용품명",
    "우편번호",
    "Qty",
    "특이사항",
    ...(extra ? ["거래코드"] : []),
  ];
  sheet.getRow(3).values = [
    "SHOULD_NOT_PERSIST",
    "01000000000",
    "PRIVATE_ADDRESS",
  ];
  sheet.getColumn(1).width = 24;
  return {
    name: "내택배양식.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(await book.xlsx.writeBuffer()),
  };
}
test("사용자 로젠 양식 등록·수동 연결·저장·재방문·다운로드 및 다른 택배사 분리", async ({
  page,
}) => {
  const uploads: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") uploads.push(r.url());
  });
  await page.goto("/");
  await page
    .getByLabel("주문 엑셀 파일 선택")
    .setInputFiles("samples/coupang.xlsx");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByRole("button", { name: "로젠택배 내 양식 등록" }).click();
  await page
    .getByLabel("로젠택배 택배사 양식 선택")
    .setInputFiles(await template());
  await expect(page.getByLabel("제목 행", { exact: true })).toHaveValue("2");
  await page.getByRole("button", { name: "이 위치로 항목 연결하기" }).click();
  await page.getByLabel("7열 특이사항 연결").selectOption("deliveryMessage");
  await page.getByLabel("양식 이름", { exact: true }).fill("로젠 계약 A");
  await page.getByLabel("제목·양식 이름·고정값에 고객 개인정보가 없고").check();
  await page.getByRole("button", { name: "확인한 양식 적용" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "양식과 항목 연결을 저장" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "변환 결과 미리보기", exact: true }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "로젠택배 엑셀 다운로드" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("로젠 계약 A_출고.xlsx");
  const path = await download.path();
  const output = new ExcelJS.Workbook();
  await output.xlsx.readFile(path!);
  const sheet = output.getWorksheet("내 로젠 출고")!;
  expect(sheet.getCell("A2").value).toBe("받는분성명");
  expect(sheet.getColumn(1).width).toBe(24);
  expect(sheet.getRow(3).getCell(1).value).not.toBe("SHOULD_NOT_PERSIST");
  expect(sheet.getRow(3).getCell(2).type).toBe(ExcelJS.ValueType.String);
  expect(sheet.getRow(3).getCell(6).type).toBe(ExcelJS.ValueType.Number);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "롯데택배 기존 양식" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "로젠택배 내 양식 등록" }).click();
  await expect(page.getByLabel("등록한 양식", { exact: true })).toContainText(
    "로젠 계약 A",
  );
  await expect(
    page.getByRole("heading", { name: "변환 결과 미리보기", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("주문 엑셀 파일 선택")
    .setInputFiles("samples/coupang.xlsx");
  await expect(
    page.getByRole("button", { name: "로젠택배 엑셀 다운로드" }),
  ).toBeEnabled();
  const stored = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("ns-shipping-templates", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = reject;
    });
    return new Promise<{ columns: unknown; bytes: number[] }[]>((resolve) => {
      const r = db.transaction("profiles").objectStore("profiles").getAll();
      r.onsuccess = () => {
        db.close();
        resolve(
          r.result.map((p) => ({
            columns: p.columns,
            bytes: Array.from(new Uint8Array(p.workbook)),
          })),
        );
      };
    });
  });
  const savedBook = new ExcelJS.Workbook();
  await savedBook.xlsx.load(Uint8Array.from(stored[0].bytes).buffer);
  expect(JSON.stringify(savedBook.model)).not.toContain("SHOULD_NOT_PERSIST");
  expect(
    savedBook.getWorksheet("내 로젠 출고")!.getCell("A3").value,
  ).toBeNull();
  // Replacing a different structure requires a second explicit confirmation.
  await page
    .getByLabel("로젠택배 택배사 양식 선택")
    .setInputFiles(await template(true));
  await page.getByRole("button", { name: "이 위치로 항목 연결하기" }).click();
  await page.getByLabel("제목·양식 이름·고정값에 고객 개인정보가 없고").check();
  await page.getByRole("button", { name: "확인한 양식 적용" }).click();
  await expect(page.locator(".template-confirm[role=alert]")).toContainText("컬럼 구성이 다릅니다");
  await page.getByRole("button", { name: "변경 취소" }).click();
  await expect(
    page.getByRole("button", { name: "로젠택배 엑셀 다운로드" }),
  ).toBeEnabled();
  for (const label of [
    "CJ대한통운",
    "한진택배",
    "우체국택배",
    "기타 / 사용자 지정",
  ]) {
    await page.getByRole("button", { name: `${label} 내 양식 등록` }).click();
    await expect(
      page.getByLabel("등록한 양식", { exact: true }),
    ).not.toContainText("로젠 계약 A");
    await expect(
      page.getByRole("button", { name: `${label} 엑셀 다운로드` }),
    ).toBeDisabled();
  }
  expect(uploads).toEqual([]);
  await page.getByRole("button", { name: "로젠택배 내 양식 등록" }).click();
  await expect(
    page.getByRole("button", { name: "로젠택배 엑셀 다운로드" }),
  ).toBeEnabled();
  await page.screenshot({
    path: "outputs/verification/carrier-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "outputs/verification/carrier-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "등록 양식 삭제" }).click();
  await page.getByRole("button", { name: "양식 삭제 확인" }).click();
  await expect(
    page.getByRole("button", { name: "로젠택배 엑셀 다운로드" }),
  ).toBeDisabled();
});
