import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
let browserErrors: string[] = [];
test.beforeEach(async ({ page }) => {
  browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
});
test.afterEach(() => expect(browserErrors).toEqual([]));
test("한 페이지 전체 변환, 오류 수정, 규칙 저장 및 개인정보 비전송", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "주문 엑셀을 여기에 놓아주세요" }),
  ).toBeVisible();
  await page.screenshot({
    path: "outputs/verification/desktop-empty.png",
    fullPage: true,
    caret: "initial",
  });
  await page
    .getByLabel("주문 엑셀 파일 선택")
    .setInputFiles([
      "samples/coupang.xlsx",
      "samples/smartstore.xlsx",
      "samples/toss.xlsx",
    ]);
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await expect(page.locator(".file-item")).toHaveCount(3);
  await expect(page.locator(".stat-card.total strong")).toHaveText("10건");
  await page.getByRole("button", { name: "롯데택배 엑셀 다운로드" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByLabel("발송인 전화번호", { exact: true })
    .fill("02-0000-0000");
  await page.getByRole("button", { name: "설정 저장" }).click();
  await page
    .locator("tbody tr")
    .first()
    .getByRole("button", { name: /주문 수정/ })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "주소", exact: true })
    .fill("");
  await page.getByRole("button", { name: "수정 저장" }).click();
  await expect(page.locator(".stat-card.error strong")).toHaveText("1건");
  await expect(page.locator(".download-bar")).toContainText("9건");
  await page.getByRole("tab", { name: "오류" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .locator("tbody tr")
    .first()
    .getByRole("button", { name: /주문 수정/ })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "주소", exact: true })
    .fill("서울특별시 테스트로 1 101호");
  await page.getByRole("button", { name: "수정 저장" }).click();
  await expect(page.locator(".stat-card.error strong")).toHaveText("0건");
  await page.getByRole("tab", { name: "전체", exact: true }).click();
  await page.getByRole("button", { name: "상품명 규칙", exact: true }).click();
  await page.getByRole("button", { name: "규칙 추가" }).click();
  await page.getByLabel("원본 상품명 1").fill("코지 베이지 무릎담요(100x150)");
  await page.getByLabel("변환 상품명", { exact: true }).fill("블랭킷");
  await page.getByRole("button", { name: "설정 저장" }).click();
  await expect(
    page
      .locator("tbody tr")
      .first()
      .getByRole("button", { name: "블랭킷", exact: true }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "롯데택배 엑셀 다운로드" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^롯데택배_송장등록_\d{4}-\d{2}-\d{2}\.xlsx$/,
  );
  const path = await download.path();
  expect(path).toBeTruthy();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(new Uint8Array(await readFile(path!)).buffer);
  expect(wb.worksheets[0].rowCount).toBe(11);
  expect(wb.worksheets[0].getCell("L2").value).toBe("블랭킷");
  expect(wb.worksheets[0].getCell("C2").value).toBe("02-0000-0000");
  expect(wb.worksheets[0].getCell("J2").value).toBe("01619");
  await page.screenshot({
    path: "outputs/verification/desktop-workspace.png",
    fullPage: true,
    caret: "initial",
    mask: [page.locator("tbody"), page.locator(".conversion-settings")],
  });
  const saved = await page.evaluate(() =>
    localStorage.getItem("ns-shipping-settings-v1"),
  );
  expect(saved).toContain("블랭킷");
  expect(saved).not.toContain('"orderId"');
  expect(posts).toEqual([]);
  expect(errors).toEqual([]);
  await page.reload();
  await expect(page.locator(".file-item")).toHaveCount(0);
  await page.getByRole("button", { name: "설정", exact: true }).click();
  await expect(page.getByLabel("발송인 전화번호", { exact: true })).toHaveValue(
    "02-0000-0000",
  );
});
test("중복 표시, 포함/제외, 파일 제거, 새 작업", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("주문 엑셀 파일 선택")
    .setInputFiles("samples/coupang.xlsx");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page
    .getByLabel("주문 엑셀 파일 선택")
    .setInputFiles("samples/coupang.xlsx");
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await expect(page.locator(".warning-banner")).toContainText(
    "중복 의심 주문 6건",
  );
  await page.getByRole("tab", { name: "중복 의심" }).click();
  await page.locator("tbody tr").last().getByRole("checkbox").uncheck();
  await expect(page.locator(".download-bar")).toContainText("5건");
  await page.getByRole("button", { name: "coupang.xlsx 제거" }).last().click();
  await expect(page.locator(".warning-banner")).toHaveCount(0);
  await page.getByRole("tab", { name: "전체", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByRole("button", { name: "새 작업", exact: true }).click();
  await page.getByRole("button", { name: "새 작업 시작" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "주문 엑셀 올리기" }),
  ).toBeVisible();
});
test("미지원·손상·암호화 오류와 모바일 레이아웃", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "outputs/verification/mobile-empty.png",
    fullPage: true,
    caret: "initial",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByLabel("주문 엑셀 파일 선택")
    .setInputFiles("samples/lotte-template.xlsx");
  await expect(page.locator(".file-error")).toContainText(
    "지원하지 않는 주문 양식",
  );
  await expect(page.locator(".file-error")).toContainText("Sheet1");
  await page.getByLabel("주문 엑셀 파일 선택").setInputFiles({
    name: "broken.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from("broken"),
  });
  await expect(page.locator(".file-error").last()).toContainText(
    "Excel 파일을 읽을 수 없습니다",
  );
  await page.getByLabel("주문 엑셀 파일 선택").setInputFiles({
    name: "encrypted.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0]),
  });
  await expect(page.locator(".file-error").last()).toContainText(
    "암호화된 Excel",
  );
  await page
    .getByLabel("주문 엑셀 파일 선택")
    .setInputFiles("samples/toss.xlsx");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "outputs/verification/mobile-workspace.png",
    fullPage: true,
    caret: "initial",
    mask: [page.locator("tbody")],
  });
  await page.getByRole("button", { name: "상품명 규칙", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("실제 구조의 익명 데이터로 드래그앤드롭과 표 화면 확인", async ({
  page,
}) => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(
    new Uint8Array(await readFile("samples/coupang.xlsx")).buffer,
  );
  const ws = wb.worksheets[0];
  for (let row = 2; row <= ws.rowCount; row++) {
    ws.getCell(`C${row}`).value = `20260929000000${row}`;
    ws.getCell(`AA${row}`).value = `테스트 수령인 ${row - 1}`;
    ws.getCell(`AB${row}`).value = "0504-0000-0000";
    ws.getCell(`AC${row}`).value = "01234";
    ws.getCell(`AD${row}`).value = "서울특별시 테스트로 100 테스트동 101호";
  }
  const bytes = Array.from(new Uint8Array(await wb.xlsx.writeBuffer()));
  await page.goto("/");
  const dataTransfer = await page.evaluateHandle((bytes) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([new Uint8Array(bytes)], "화면검증_익명주문.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    return transfer;
  }, bytes);
  await page.locator(".upload-zone").dispatchEvent("drop", { dataTransfer });
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page
    .locator(".preview-card")
    .screenshot({
      path: "outputs/verification/table-anonymous.png",
      caret: "initial",
    });
  await page.getByRole("button", { name: "상품명 규칙", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "상품명 규칙", exact: true }),
  ).toBeFocused();
});
