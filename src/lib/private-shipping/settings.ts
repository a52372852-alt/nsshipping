import { loadSettings } from "@/lib/settings";
import type { SenderSettings } from "@/types/order";

export const PRIVATE_SETTINGS_KEY = "ns-shipping-private-sender-v1";
export function loadPrivateSender(): SenderSettings {
  const fallback = loadSettings().sender;
  try {
    const saved = JSON.parse(
      localStorage.getItem(PRIVATE_SETTINGS_KEY) || "null",
    );
    if (!saved || typeof saved !== "object") return { ...fallback };
    return Object.fromEntries(
      Object.entries(fallback).map(([key, value]) => [
        key,
        typeof saved[key] === "string" ? saved[key] : value,
      ]),
    ) as unknown as SenderSettings;
  } catch {
    return { ...fallback };
  }
}
export function savePrivateSender(sender: SenderSettings) {
  localStorage.setItem(PRIVATE_SETTINGS_KEY, JSON.stringify(sender));
}
