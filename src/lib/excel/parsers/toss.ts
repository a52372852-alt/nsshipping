import type { Adapter } from "./shared";
export const toss: Adapter = {
  platform: "toss",
  signature: ["주문상품번호", "주문번호", "수령인명", "배송지"],
  skipInstruction: true,
  mapping: {
    orderId: ["주문번호"],
    productOrderId: ["주문상품번호"],
    receiverName: ["수령인명"],
    receiverPhone1: ["수령인 연락처"],
    postalCode: ["우편번호"],
    address: ["배송지"],
    productName: ["상품명"],
    optionName: ["옵션명"],
    quantity: ["주문건수"],
    deliveryMessage: ["주문요청사항"],
  },
};
