import type { Adapter } from "./shared";
export const coupang: Adapter = {
  platform: "coupang",
  signature: ["묶음배송번호", "주문번호", "수취인이름", "수취인 주소"],
  mapping: {
    orderId: ["주문번호"],
    receiverName: ["수취인이름"],
    receiverPhone1: ["수취인전화번호"],
    postalCode: ["우편번호"],
    address: ["수취인 주소"],
    // User mapping: sample column L (등록옵션명) is the Lotte product name.
    productName: ["등록옵션명"],
    optionName: ["등록옵션명"],
    quantity: ["구매수(수량)"],
    deliveryMessage: ["배송메세지", "배송메시지"],
  },
};
