import { test, expect } from "@playwright/test";
test("브라우저에서 암호 파일을 자동으로 열고 변경한 비밀번호를 유지한다", async ({
  page,
}) => {
  const posts: string[] = [];
  const errors: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByLabel("주문 엑셀 파일 선택")
    .setInputFiles("samples/smartstore-encrypted.xlsx");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator(".file-item")).toContainText("암호 해제 완료");
  await page.getByRole("button", { name: "설정", exact: true }).click();
  await expect(page.getByLabel("Excel 비밀번호")).toHaveValue("0000");
  await page.getByLabel("Excel 비밀번호").fill("wrong-password");
  await page.getByRole("button", { name: "설정 저장" }).click();
  await page.reload();
  await page
    .getByLabel("주문 엑셀 파일 선택")
    .setInputFiles("samples/smartstore-encrypted.xlsx");
  await expect(page.locator(".file-error")).toContainText("비밀번호");
  await page.getByRole("button", { name: "설정", exact: true }).click();
  await expect(page.getByLabel("Excel 비밀번호")).toHaveValue("wrong-password");
  await page.getByLabel("Excel 비밀번호").fill("0000");
  await page.getByRole("button", { name: "설정 저장" }).click();
  await page.reload();
  await page
    .getByLabel("주문 엑셀 파일 선택")
    .setInputFiles("samples/smartstore-encrypted.xlsx");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  expect(posts).toEqual([]);
  expect(errors).toEqual([]);
});
