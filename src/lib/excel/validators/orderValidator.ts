import type { EditableField, Issue, NormalizedOrder } from "@/types/order";
export function validateOrder(order: NormalizedOrder): Issue[] {
  const issues = [...order.sourceIssues];
  const required: [EditableField, string][] = [
    ["orderId", "주문번호"],
    ["receiverName", "받는사람"],
    ["receiverPhone1", "전화번호"],
    ["address", "주소"],
    ["productName", "상품명"],
  ];
  for (const [field, label] of required)
    if (!String(order[field]).trim())
      issues.push({
        level: "error",
        field,
        message: `${label}이(가) 없습니다.`,
      });
  for (const field of ["orderId", "productOrderId"] as const)
    if (/^[+-]?\d+(?:\.\d+)?e[+-]?\d+$/i.test(order[field]))
      issues.push({
        level: "error",
        field,
        message:
          "주문번호가 지수 표기입니다. 원본의 전체 번호를 텍스트로 입력해주세요.",
      });
  if (!Number.isSafeInteger(order.quantity) || order.quantity < 1)
    issues.push({
      level: "error",
      field: "quantity",
      message: "수량은 1 이상의 정수여야 합니다.",
    });
  for (const field of ["receiverPhone1", "receiverPhone2"] as const)
    if (order[field] && !/^0[\d\s()-]{8,15}$/.test(order[field]))
      issues.push({
        level: "warning",
        field,
        message: `${field === "receiverPhone1" ? "전화번호1" : "전화번호2"} 형식을 확인해주세요. 원본은 유지됩니다.`,
      });
  if (!/^\d{5}$/.test(order.postalCode))
    issues.push({
      level: "warning",
      field: "postalCode",
      message: "5자리 우편번호를 확인해주세요.",
    });
  if (!order.optionName)
    issues.push({
      level: "warning",
      field: "optionName",
      message: "옵션명이 없습니다.",
    });
  if (!order.deliveryMessage)
    issues.push({
      level: "warning",
      field: "deliveryMessage",
      message: "배송메시지가 없습니다.",
    });
  return issues;
}
export function duplicateIds(orders: NormalizedOrder[]): Set<string> {
  const groups = new Map<string, string[]>();
  for (const order of orders) {
    const key = JSON.stringify(
      order.productOrderId
        ? [order.platform, order.orderId, order.productOrderId]
        : [
            order.platform,
            order.orderId,
            order.receiverName,
            order.productName,
          ],
    );
    const group = groups.get(key) ?? [];
    group.push(order.id);
    groups.set(key, group);
  }
  return new Set(
    [...groups.values()].filter((group) => group.length > 1).flat(),
  );
}
