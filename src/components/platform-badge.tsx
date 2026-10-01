import { PLATFORM_LABELS, type Platform } from "@/types/order";
export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className={`platform-badge ${platform}`}>
      <span className="platform-mark">
        {platform === "smartstore" ? "N" : platform === "toss" ? "t" : "c"}
      </span>
      {PLATFORM_LABELS[platform]}
    </span>
  );
}
