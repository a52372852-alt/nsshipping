import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import officeCrypto from "officecrypto-tool";
import ExcelJS from "exceljs";
import { readOrders } from "@/lib/excel/reader";
import { DEFAULT_EXCEL_PASSWORD } from "@/lib/excel/password";
import { exportLotte } from "@/lib/excel/exporters/lotte";
import { DEFAULT_SENDER } from "@/types/order";
it("실제 암호 파일을 기본 비밀번호로 열고 주문 및 롯데 출력 값을 보존한다", async () => {
  const data = await readFile("samples/smartstore-encrypted.xlsx");
  const decrypted = await officeCrypto.decrypt(data, {
    password: DEFAULT_EXCEL_PASSWORD,
  });
  const source = new ExcelJS.Workbook();
  await source.xlsx.load(new Uint8Array(decrypted).buffer);
  const result = await readOrders(
    new Uint8Array(data).buffer,
    "smartstore-encrypted.xlsx",
    "encrypted",
    async () => new Uint8Array(decrypted).buffer,
  );
  expect(result.orders).toHaveLength(1);
  expect(result.file.platforms).toEqual(["smartstore"]);
  expect(result.orders[0].orderId).toBe(
    source.worksheets[0].getCell("B3").text,
  );
  expect(result.file.details).toContain("암호 해제 완료");
  expect(result.orders[0].productName).toBe(
    source.worksheets[0].getCell("U3").text,
  );
  expect(result.orders[0].optionName).toBe(
    source.worksheets[0].getCell("Y3").text,
  );
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(
    await exportLotte(result.orders, {
      ...DEFAULT_SENDER,
      phone: "02-0000-0000",
    }),
  );
  expect(wb.worksheets[0].getCell("A2").value).toBe(result.orders[0].orderId);
  expect(wb.worksheets[0].getCell("L2").value).toBe(
    source.worksheets[0].getCell("U3").text,
  );
  expect(wb.worksheets[0].getCell("M2").value).toBe(
    source.worksheets[0].getCell("Y3").text,
  );
  expect(wb.worksheets[0].getCell("J2").value).toBe(
    result.orders[0].postalCode,
  );
  await expect(
    officeCrypto.decrypt(data, { password: "wrong-password" }),
  ).rejects.toThrow();
});
