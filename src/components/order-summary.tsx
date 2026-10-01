import { AlertTriangle } from "lucide-react";
import {
  PLATFORM_LABELS,
  type Platform,
  type NormalizedOrder,
} from "@/types/order";
import type { ReviewedOrder } from "./orders-table";
export function OrderSummary({
  orders,
  reviewed,
  excluded,
  duplicate,
}: {
  orders: NormalizedOrder[];
  reviewed: ReviewedOrder[];
  excluded: Set<string>;
  duplicate: Set<string>;
}) {
  const errors = reviewed.filter((r) => r.status === "error").length;
  const warnings = reviewed.filter((r) => r.status === "warning").length;
  const valid = reviewed.filter((r) => r.status === "valid").length;
  return (
    <>
      <div className="stats-grid">
        {[
          {
            label: "총 주문",
            value: orders.length,
            cls: "total",
            sub: "업로드한 모든 주문",
          },
          {
            label: "정상",
            value: valid,
            cls: "valid",
            sub: "필수값 검증 완료",
          },
          {
            label: "확인 필요",
            value: warnings,
            cls: "warning",
            sub: "경고 또는 중복 의심",
          },
          {
            label: "오류",
            value: errors,
            cls: "error",
            sub: "수정 전 출력 제외",
          },
        ].map((stat) => (
          <div className={`stat-card ${stat.cls}`} key={stat.label}>
            <span>{stat.label}</span>
            <strong>
              {stat.value}
              <small>건</small>
            </strong>
            <p>{stat.sub}</p>
          </div>
        ))}
      </div>
      <div className="platform-counts">
        {(["coupang", "smartstore", "toss"] as Platform[]).map((platform) => (
          <span key={platform}>
            {PLATFORM_LABELS[platform]}{" "}
            <strong>
              {orders.filter((order) => order.platform === platform).length}건
            </strong>
          </span>
        ))}
        <span className="counts-total">
          선택 제외 <strong>{excluded.size}건</strong>
        </span>
      </div>
      {duplicate.size > 0 && (
        <div className="warning-banner">
          <AlertTriangle size={18} />
          <div>
            <strong>중복 의심 주문 {duplicate.size}건</strong>
            <p>
              같은 주문이 포함되어 있습니다. ‘중복 의심’ 탭에서 확인하고 포함
              체크를 해제할 수 있습니다. 자동 삭제하지 않습니다.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
