import { test, expect } from "@playwright/test";

const paths = [
  "/tools/coupang-lotte",
  "/tools/smartstore-lotte",
  "/tools/toss-lotte",
  "/help",
  "/about",
  "/contact",
  "/terms",
];
test("검색 페이지는 고유 메타데이터와 실제 본문을 제공한다", async ({
  page,
  request,
}) => {
  const titles = new Set();
  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://nshome.life${path}`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `https://nshome.life${path}`,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    titles.add(await page.title());
    expect(await page.locator("main").innerText()).not.toContain("Lorem ipsum");
    // Critical content is in static HTML, even without client JavaScript execution.
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain("<h1");
  }
  expect(titles.size).toBe(paths.length);
  await page.goto("/help");
  const faq = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((el) => JSON.parse(el.textContent!));
  expect(faq["@type"]).toBe("FAQPage");
  for (const item of faq.mainEntity) {
    await expect(page.locator("main")).toContainText(item.name);
    await expect(page.locator("main")).toContainText(item.acceptedAnswer.text);
  }
  await page.goto("/contact");
  await expect(
    page.getByRole("link", { name: "marine485@gmail.com" }),
  ).toHaveAttribute("href", "mailto:marine485@gmail.com");
  const sitemap = await request.get("/sitemap.xml");
  for (const path of paths)
    expect(await sitemap.text()).toContain(`https://nshome.life${path}`);
});

test("새 콘텐츠는 모바일에서 넘치지 않고 광고 스크립트를 로드하지 않는다", async ({
  page,
}) => {
  const thirdParty: string[] = [];
  page.on("request", (request) => {
    if (/googlesyndication|doubleclick|google-analytics/.test(request.url()))
      thirdParty.push(request.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [...paths, "/"]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".ad-slot")).toHaveCount(0);
  }
  expect(thirdParty).toEqual([]);
  await page.goto("/tools/coupang-lotte");
  await page.screenshot({
    path: "outputs/verification/seo-tool-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({
    path: "outputs/verification/seo-home-desktop.png",
    fullPage: true,
  });
});
