import type { Adapter } from "./shared";
export const smartstore: Adapter = {
  platform: "smartstore",
  signature: ["상품주문번호", "주문번호", "수취인명"],
  addressFallback: ["기본배송지", "상세배송지"],
  mapping: {
    orderId: ["주문번호"],
    productOrderId: ["상품주문번호"],
    receiverName: ["수취인명"],
    receiverPhone1: ["수취인연락처1"],
    receiverPhone2: ["수취인연락처2"],
    postalCode: ["우편번호"],
    address: ["통합배송지"],
    productName: ["상품명"],
    optionName: ["옵션정보"],
    quantity: ["수량"],
    deliveryMessage: ["배송메세지", "배송메시지"],
  },
};
