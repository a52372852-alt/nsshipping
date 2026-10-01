export type Platform = "coupang" | "smartstore" | "toss";
export const PLATFORM_LABELS: Record<Platform, string> = {
  coupang: "쿠팡",
  smartstore: "스마트스토어",
  toss: "토스쇼핑",
};
export interface NormalizedOrder {
  id: string;
  fileId: string;
  platform: Platform;
  sourceFileName: string;
  sourceSheet: string;
  sourceRow: number;
  orderId: string;
  productOrderId: string;
  receiverName: string;
  receiverPhone1: string;
  receiverPhone2: string;
  postalCode: string;
  address: string;
  productName: string;
  optionName: string;
  quantity: number;
  deliveryMessage: string;
  sourceIssues: Issue[];
}
export type EditableField =
  | "orderId"
  | "productOrderId"
  | "receiverName"
  | "receiverPhone1"
  | "receiverPhone2"
  | "postalCode"
  | "address"
  | "productName"
  | "optionName"
  | "quantity"
  | "deliveryMessage";
export interface Issue {
  level: "error" | "warning";
  message: string;
  field?: EditableField;
}
export interface SenderSettings {
  name: string;
  phone: string;
  phone2: string;
  postalCode: string;
  address: string;
  freight: string;
}
export interface ProductRule {
  id: string;
  from: string;
  to: string;
}
export const DEFAULT_SENDER: SenderSettings = {
  name: "엔에스벨류몰",
  phone: "",
  phone2: "",
  postalCode: "",
  address: "",
  freight: "신용",
};
export interface ImportedFile {
  id: string;
  name: string;
  size: number;
  status: "ready" | "error";
  platforms: Platform[];
  count: number;
  details: string;
  error?: string;
}
