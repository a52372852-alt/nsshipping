import { test, expect } from "@playwright/test";

test("안내를 새 탭에서 읽어도 원래 주문과 개인정보가 유지된다", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("complementary", { name: "주문 파일 개인정보 안내" }),
  ).toContainText("파일을 서버로 전송하지 않습니다");
  await page.screenshot({
    path: "outputs/verification/privacy-home-desktop.png",
    fullPage: true,
  });
  await page
    .getByLabel("주문 엑셀 파일 선택")
    .setInputFiles("samples/coupang.xlsx");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  const rowsBefore = await page.locator("tbody").innerText();
  const popupPromise = page.waitForEvent("popup");
  await page
    .getByRole("navigation", { name: "주요 메뉴" })
    .getByRole("link", { name: "사용 방법" })
    .click();
  const help = await popupPromise;
  await expect(help.locator(".guide-card")).toHaveCount(4);
  await help.screenshot({
    path: "outputs/verification/guides-desktop.png",
    fullPage: true,
  });
  const hrefs = await help
    .locator(".guide-card")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")!));
  const titles = new Set<string>();
  for (const href of hrefs) {
    await help.goto(new URL(href, help.url()).href);
    await expect(help.locator("h1")).toHaveCount(1);
    await expect(help.locator(".guide-section").first()).toBeVisible();
    await expect(help.locator('meta[name="robots"]')).not.toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(help.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://nshome.life${href}`,
    );
    await expect(help.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    titles.add(await help.title());
    await expect(
      help.getByRole("link", { name: "엑셀 변환 화면 열기" }),
    ).toHaveAttribute("href", "/#upload");
  }
  expect(titles.size).toBe(4);
  await help.getByRole("link", { name: "개인정보 처리 방식 보기" }).click();
  await expect(help.locator("h1")).toContainText("내 브라우저에서 처리");
  await expect(help.locator("main")).toContainText(
    "새 작업’이나 새로고침만으로는",
  );
  await help.close();
  expect((await page.locator("tbody").innerText()) === rowsBefore).toBe(true);
  expect(posts).toEqual([]);
});

test("모바일에서도 메뉴·안내·표가 페이지 너비를 넘지 않는다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/",
    "/guides",
    "/guides/smartstore-lotte",
    "/guides/coupang-product-options",
    "/guides/password-protected-excel",
    "/guides/errors-and-duplicates",
    "/privacy",
  ]) {
    await page.goto(path);
    await expect(
      page
        .getByRole("navigation")
        .first()
        .getByRole("link", { name: "사용 방법" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/guides");
  await page.screenshot({
    path: "outputs/verification/guides-mobile.png",
    fullPage: true,
  });
});
