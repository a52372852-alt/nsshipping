export type ExcelErrorCode = "unsupported" | "encrypted" | "corrupt" | "limit";
export class ExcelImportError extends Error {
  constructor(
    public code: ExcelErrorCode,
    message: string,
    public details = "",
  ) {
    super(message);
    this.name = "ExcelImportError";
  }
}
