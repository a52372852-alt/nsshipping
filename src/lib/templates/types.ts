import type { NormalizedOrder } from "@/types/order";
export const CARRIERS = {
  lotte: "롯데택배",
  cj: "CJ대한통운",
  hanjin: "한진택배",
  logen: "로젠택배",
  post: "우체국택배",
  custom: "기타 / 사용자 지정",
} as const;
export type Carrier = keyof typeof CARRIERS;
export type CustomCarrier = Exclude<Carrier, "lotte">;
export const FIELDS = {
  receiverName: "수취인 이름",
  receiverPhone1: "수취인 전화번호",
  receiverPhone2: "수취인 전화번호2",
  postalCode: "수취인 우편번호",
  address: "전체 배송주소",
  addressBase: "기본주소 (별도 제공 시)",
  addressDetail: "상세주소 (별도 제공 시)",
  productName: "상품명",
  optionName: "옵션명",
  productAndOption: "상품명 + 옵션명",
  quantity: "수량",
  deliveryMessage: "배송메모",
  orderId: "주문번호",
  productOrderId: "상품주문번호",
  senderName: "발송인 이름",
  senderPhone: "발송인 전화번호",
  senderPhone2: "발송인 전화번호2",
  senderPostalCode: "발송인 우편번호",
  senderAddress: "발송인 주소",
  freight: "운임구분",
  blank: "빈칸",
  constant: "직접 입력한 고정값",
} as const;
export type Field = keyof typeof FIELDS;
export type ColumnBinding = {
  column: number;
  header: string;
  field: Field;
  constant: string;
  automatic: boolean;
};
export type TemplateProfile = {
  version: 1;
  id: string;
  name: string;
  carrier: CustomCarrier;
  sheetName: string;
  headerRow: number;
  dataStart: number;
  fingerprint: string;
  columns: ColumnBinding[];
  phoneFormat: "original" | "digits" | "hyphen";
  workbook: ArrayBuffer;
};
export type PreviewOrder = NormalizedOrder;
