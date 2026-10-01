import type { NormalizedOrder, ProductRule } from "@/types/order";
export function applyProductRules(
  order: NormalizedOrder,
  rules: ProductRule[],
): NormalizedOrder {
  const rule = rules.find(
    (rule) =>
      rule.from.trim() &&
      rule.to.trim() &&
      rule.from.trim() === order.productName.trim(),
  );
  return rule ? { ...order, productName: rule.to.trim() } : order;
}
