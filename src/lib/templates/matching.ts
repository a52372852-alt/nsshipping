import type { Field } from "./types";
export const normalizeLabel = (value: string) =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
const aliases: Partial<Record<Field, string[]>> = {
  receiverName: [
    "수취인",
    "수취인이름",
    "수취인명",
    "수령인",
    "수령인명",
    "받는분",
    "받는분성명",
    "받는사람",
    "받는사람이름",
    "고객명",
  ],
  receiverPhone1: [
    "휴대폰",
    "휴대전화",
    "전화번호",
    "전화번호1",
    "연락처",
    "연락처1",
    "수취인전화",
    "수취인전화번호",
    "수취인연락처1",
    "받는분전화번호",
    "받는사람전화",
    "핸드폰",
  ],
  receiverPhone2: [
    "전화번호2",
    "연락처2",
    "수취인연락처2",
    "수취인전화번호2",
    "받는분전화번호2",
  ],
  address: [
    "주소",
    "전체주소",
    "통합배송지",
    "배송주소",
    "배송지",
    "수취인주소",
    "받는분주소",
    "받는사람주소",
    "배달주소",
  ],
  addressBase: ["기본주소", "기본배송지"],
  addressDetail: ["상세주소", "상세배송지"],
  postalCode: [
    "우편번호",
    "우편번호5자리",
    "ZIP",
    "zipcode",
    "수취인우편번호",
    "받는분우편번호",
  ],
  productName: [
    "상품명",
    "상품명1",
    "품목명",
    "물품명",
    "내용품",
    "내용품명",
    "제품명",
    "품명",
  ],
  optionName: ["옵션", "옵션명", "옵션정보", "상품상세1"],
  quantity: ["수량", "주문수량", "개수", "Qty", "수량A타입"],
  deliveryMessage: [
    "배송메모",
    "배송메세지",
    "배송메시지",
    "배송요청사항",
    "배송요청",
    "주문요청사항",
  ],
  orderId: ["주문번호", "고객주문번호"],
  productOrderId: ["상품주문번호", "주문상품번호"],
  senderName: [
    "보내는분",
    "보내는사람",
    "보내는분성명",
    "발송인",
    "발송인명",
    "송하인명",
  ],
  senderPhone: ["보내는분전화번호", "발송인전화번호", "송하인전화번호"],
  senderPhone2: ["발송인전화번호2", "보내는분전화번호2"],
  senderAddress: ["발송인주소", "보내는분주소", "송하인주소"],
  senderPostalCode: ["발송인우편번호", "보내는분우편번호"],
  freight: ["운임구분", "운임"],
};
export function matchHeader(header: string): Field | null {
  const label = normalizeLabel(header);
  const matches = Object.entries(aliases).filter(([, values]) =>
    values.some((v) => normalizeLabel(v) === label),
  );
  // Exact normalized aliases only: ambiguous or unfamiliar labels require confirmation.
  return matches.length === 1 ? (matches[0][0] as Field) : null;
}
