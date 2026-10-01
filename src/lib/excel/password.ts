// User-authorized default for this private shipping workflow.
export const DEFAULT_EXCEL_PASSWORD = "0000";
export const EXCEL_PASSWORD_KEY = "ns-shipping-excel-password-v1";
export function getExcelPassword(): string {
  try {
    return localStorage.getItem(EXCEL_PASSWORD_KEY) ?? DEFAULT_EXCEL_PASSWORD;
  } catch {
    return DEFAULT_EXCEL_PASSWORD;
  }
}
export function saveExcelPassword(password: string) {
  localStorage.setItem(EXCEL_PASSWORD_KEY, password);
}
