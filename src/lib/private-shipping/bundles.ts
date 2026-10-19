import type { NormalizedOrder } from "@/types/order";
import type { SplitGroup, SplitOrder } from "./converter";

export interface ShippingBundle {
  group: SplitGroup;
  orders: NormalizedOrder[];
}

// Keep preview counts and numbering aligned with the exported parcels.
export function bundleSplitOrders(rows: SplitOrder[]): ShippingBundle[] {
  const bundles: ShippingBundle[] = [];
  const plainByAddress = new Map<string, ShippingBundle>();
  for (const { order, group } of rows) {
    if (group === "orange") {
      bundles.push({ group, orders: [order] });
      continue;
    }
    const key = order.address.trim().replace(/\s+/g, " ");
    const existing = plainByAddress.get(key);
    if (existing) existing.orders.push(order);
    else {
      const bundle = { group, orders: [order] };
      plainByAddress.set(key, bundle);
      bundles.push(bundle);
    }
  }
  return bundles;
}
