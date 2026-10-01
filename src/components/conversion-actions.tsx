import {
  Package,
  ChevronRight,
  SlidersHorizontal,
  ArrowDownToLine,
  LoaderCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import type { SenderSettings, ProductRule } from "@/types/order";
import type { ReviewedOrder } from "./orders-table";
export function ConversionActions({
  sender,
  rules,
  eligible,
  errors,
  excluded,
  busy,
  downloading,
  setSettings,
  download,
  carrierLabel = "롯데택배",
  custom = false,
  templateReady = true,
}: {
  sender: SenderSettings;
  rules: ProductRule[];
  eligible: ReviewedOrder[];
  errors: number;
  excluded: Set<string>;
  busy: boolean;
  downloading: boolean;
  setSettings: (tab: "sender" | "rules") => void;
  download: () => void;
  carrierLabel?: string;
  custom?: boolean;
  templateReady?: boolean;
}) {
  return (
    <>
      <div className="conversion-settings">
        <button onClick={() => setSettings("sender")}>
          <span className="settings-tile-icon">
            <Package size={19} />
          </span>
          <span>
            <small>발송인</small>
            <strong>{sender.name || "설정 필요"}</strong>
            <span className={!sender.phone ? "text-warning" : ""}>
              {sender.phone || "전화번호를 설정해주세요"}
            </span>
          </span>
          <ChevronRight size={17} />
        </button>
        <button onClick={() => setSettings("rules")}>
          <span className="settings-tile-icon">
            <SlidersHorizontal size={19} />
          </span>
          <span>
            <small>상품명 규칙</small>
            <strong>{rules.length}개의 규칙 적용 중</strong>
            <span>긴 상품명을 짧고 간결하게</span>
          </span>
          <ChevronRight size={17} />
        </button>
      </div>
      <section className="download-bar">
        <div>
          <span className="download-icon">
            <ArrowDownToLine size={25} />
          </span>
          <div>
            <h2>
              {eligible.length === 0
                ? "출력할 주문을 확인해주세요"
                : !templateReady
                  ? "택배사 양식 연결을 마무리해주세요"
                  : !custom && (!sender.phone.trim() || !sender.name.trim())
                    ? "발송인 설정을 마무리해주세요"
                    : `${carrierLabel} 등록 준비가 되었습니다`}
            </h2>
            <p>
              출력 가능한 주문 <strong>{eligible.length}건</strong>
              {errors > 0 ? ` · 오류 ${errors}건 제외` : ""}
              {excluded.size > 0 ? ` · 선택 제외 ${excluded.size}건` : ""}
            </p>
            {eligible.some((row) => row.status === "warning") && (
              <p className="download-warning">
                확인 필요 주문{" "}
                {eligible.filter((row) => row.status === "warning").length}
                건이 포함됩니다.
              </p>
            )}
          </div>
        </div>
        <Button
          disabled={
            busy || downloading || eligible.length === 0 || !templateReady
          }
          onClick={download}
        >
          {downloading ? (
            <LoaderCircle size={18} className="spin" />
          ) : (
            <ArrowDownToLine size={18} />
          )}{" "}
          {downloading ? "엑셀 생성 중…" : `${carrierLabel} 엑셀 다운로드`}
        </Button>
      </section>
    </>
  );
}
