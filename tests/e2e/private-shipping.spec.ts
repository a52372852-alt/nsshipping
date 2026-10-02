import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
import { readFile } from "node:fs/promises";

test("개인용 두 다운로드와 전화번호 자동 저장·재방문·새 작업", async ({
  page,
}) => {
  const errors: string[] = [];
  const posts: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.goto("/my-shipping");
  const phone = page.getByLabel("발송인 전화번호", { exact: true });
  await phone.fill("02-0000-0000");
  await page.reload();
  await expect(phone).toHaveValue("02-0000-0000");
  let upload: string | { name: string; mimeType: string; buffer: Buffer };
  if (process.env.PRIVATE_ORDER_SAMPLE) {
    upload = process.env.PRIVATE_ORDER_SAMPLE;
  } else {
    const w = new ExcelJS.Workbook();
    await w.xlsx.readFile("samples/toss.xlsx");
    let col = 0;
    w.worksheets[0].getRow(2).eachCell((c, i) => {
      if (c.text === "수령인명") col = i;
    });
    w.worksheets[0].getCell(4, col).style = structuredClone(
      w.worksheets[0].getCell(4, col).style,
    );
    w.worksheets[0].getCell(4, col).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF00" },
    };
    w.worksheets[0].getCell(5, col).style = structuredClone(
      w.worksheets[0].getCell(5, col).style,
    );
    w.worksheets[0].getCell(5, col).fill = { type: "pattern", pattern: "none" };
    upload = {
      name: "toss.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from(await w.xlsx.writeBuffer()),
    };
  }
  await page.getByLabel("주문 엑셀 파일 선택").setInputFiles(upload);
  const counts = process.env.PRIVATE_ORDER_SAMPLE ? [8, 1] : [1, 1];
  await expect(page.locator("tbody tr")).toHaveCount(counts[0] + counts[1]);
  for (const [index, button] of [
    "지정송하인 엑셀 다운로드",
    "지정 엑셀 다운로드",
  ].entries()) {
    const promise = page.waitForEvent("download");
    await page.getByRole("button", { name: button, exact: true }).click();
    const download = await promise;
    expect(download.suggestedFilename()).toMatch(
      index === 0
        ? /^엔에스벨류몰_B-type\[지정송하인\]_\d{8}\.xlsx$/
        : /^엔에스벨류몰_B타입 전용\(지정\)_\d{8}\.xlsx$/,
    );
    const w = new ExcelJS.Workbook();
    await w.xlsx.load(
      new Uint8Array(await readFile((await download.path())!)).buffer,
    );
    const s = w.worksheets[0];
    expect(s.rowCount).toBe(counts[index] + 1);
    for (let r = 2; r <= s.rowCount; r++) {
      expect(s.getCell(r, 3).text).toBe("02-0000-0000");
      if (index === 0) expect(s.getCell(r, 15).text.startsWith("®")).toBe(true);
      else expect(s.getCell(r, 19).value).toBeNull();
    }
  }
  await page.getByRole("button", { name: "새 작업", exact: true }).click();
  await expect(phone).toHaveValue("02-0000-0000");
  await phone.fill("02-1111-2222");
  await page.reload();
  await expect(phone).toHaveValue("02-1111-2222");
  expect(errors).toEqual([]);
  expect(posts).toEqual([]);
});
