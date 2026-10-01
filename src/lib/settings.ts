import {
  DEFAULT_SENDER,
  type ProductRule,
  type SenderSettings,
} from "@/types/order";
export const SETTINGS_KEY = "ns-shipping-settings-v1";
export function loadSettings(): {
  sender: SenderSettings;
  rules: ProductRule[];
} {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) || "null",
    );
    if (!data || typeof data !== "object")
      return { sender: DEFAULT_SENDER, rules: [] };
    const saved = data as { sender?: Record<string, unknown>; rules?: unknown };
    const sender = { ...DEFAULT_SENDER };
    for (const key of Object.keys(sender) as (keyof SenderSettings)[])
      if (typeof saved.sender?.[key] === "string")
        sender[key] = saved.sender[key];
    const rules = Array.isArray(saved.rules)
      ? saved.rules.filter(
          (r): r is ProductRule =>
            !!r &&
            typeof r.id === "string" &&
            typeof r.from === "string" &&
            typeof r.to === "string",
        )
      : [];
    return { sender, rules };
  } catch {
    return { sender: DEFAULT_SENDER, rules: [] };
  }
}
