"use client";
import { createId } from "@/lib/createId";
import { useState } from "react";
import { Plus, Trash2, Check, LockKeyhole } from "lucide-react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import type { ProductRule, SenderSettings } from "@/types/order";
import { getExcelPassword, saveExcelPassword } from "@/lib/excel/password";
export function SettingsDialog({
  open,
  onClose,
  sender,
  rules,
  onSave,
  initialTab = "sender",
}: {
  open: boolean;
  onClose: () => void;
  sender: SenderSettings;
  rules: ProductRule[];
  onSave: (s: SenderSettings, r: ProductRule[]) => void;
  initialTab?: "sender" | "rules";
}) {
  const [tab, setTab] = useState(initialTab);
  const [draft, setDraft] = useState(sender);
  const [draftRules, setDraftRules] = useState(rules);
  const [error, setError] = useState("");
  const [excelPassword, setExcelPassword] = useState(getExcelPassword);
  function save() {
    if (!draft.name.trim()) {
      setError("보내는 사람을 입력해주세요.");
      setTab("sender");
      return;
    }
    if (draftRules.some((r) => !r.from.trim() || !r.to.trim())) {
      setError("상품명 규칙의 원본과 변환 상품명을 모두 입력해주세요.");
      setTab("rules");
      return;
    }
    if (
      new Set(draftRules.map((r) => r.from.trim())).size !== draftRules.length
    ) {
      setError("같은 원본 상품명의 규칙은 하나만 등록할 수 있습니다.");
      setTab("rules");
      return;
    }
    try {
      saveExcelPassword(excelPassword);
    } catch {
      setError(
        "브라우저 저장소에 Excel 비밀번호를 저장할 수 없습니다. 사이트 저장소 사용을 허용해주세요.",
      );
      return;
    }
    onSave(draft, draftRules);
    onClose();
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      title="변환 설정"
      description="자주 쓰는 발송인과 상품명을 설정해두세요."
      wide
    >
      <div className="tabs" role="tablist" aria-label="설정 종류">
        <button
          role="tab"
          aria-selected={tab === "sender"}
          onClick={() => setTab("sender")}
          className={tab === "sender" ? "active" : ""}
        >
          발송인 설정
        </button>
        <button
          role="tab"
          aria-selected={tab === "rules"}
          onClick={() => setTab("rules")}
          className={tab === "rules" ? "active" : ""}
        >
          상품명 규칙 <span>{draftRules.length}</span>
        </button>
      </div>
      {tab === "sender" ? (
        <div className="form-grid">
          <label className="full">
            Excel 비밀번호
            <input
              type="password"
              value={excelPassword}
              onChange={(e) => setExcelPassword(e.target.value)}
              autoComplete="off"
            />
            <span className="field-help">
              스마트스토어 암호 파일에 자동으로 사용합니다. 이 브라우저에만
              저장됩니다.
            </span>
          </label>
          {(
            [
              ["name", "보내는 사람", "엔에스벨류몰"],
              ["phone", "발송인 전화번호", "예: 02-1234-5678"],
              ["phone2", "추가 전화번호 (선택)", ""],
              ["postalCode", "발송인 우편번호 (선택)", "5자리 우편번호"],
              ["address", "발송인 주소 (선택)", ""],
            ] as const
          ).map(([key, label, placeholder]) => (
            <label key={key} className={key === "address" ? "full" : ""}>
              {label}
              <input
                value={draft[key]}
                placeholder={placeholder}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                autoComplete="off"
              />
            </label>
          ))}
          <label>
            운임구분
            <select
              value={draft.freight}
              onChange={(e) => setDraft({ ...draft, freight: e.target.value })}
            >
              <option>신용</option>
              <option>선불</option>
              <option>착불</option>
            </select>
          </label>
          <p className="field-help full">
            발송인 전화번호를 입력하면 다운로드할 수 있습니다. 주문정보는
            저장하지 않습니다.
          </p>
        </div>
      ) : (
        <div className="rules-editor">
          <div className="info-note">
            원본 상품명과 정확히 일치할 때 치환합니다. 옵션과 수량은 그대로
            유지됩니다.
          </div>
          {draftRules.length === 0 && (
            <div className="rules-empty">
              등록한 규칙이 없습니다.
              <br />
              <span>긴 상품명을 송장에 쓸 짧은 이름으로 바꿔보세요.</span>
            </div>
          )}
          {draftRules.map((rule, index) => (
            <div className="rule-row" key={rule.id}>
              <label>
                원본 상품명 {index + 1}
                <input
                  value={rule.from}
                  placeholder="쇼핑몰의 상품명"
                  onChange={(e) =>
                    setDraftRules(
                      draftRules.map((r) =>
                        r.id === rule.id ? { ...r, from: e.target.value } : r,
                      ),
                    )
                  }
                />
              </label>
              <span className="rule-equals">→</span>
              <label>
                변환 상품명
                <input
                  value={rule.to}
                  placeholder="송장에 표시할 상품명"
                  onChange={(e) =>
                    setDraftRules(
                      draftRules.map((r) =>
                        r.id === rule.id ? { ...r, to: e.target.value } : r,
                      ),
                    )
                  }
                />
              </label>
              <button
                className="icon-button"
                aria-label={`규칙 ${index + 1} 삭제`}
                onClick={() =>
                  setDraftRules(draftRules.filter((r) => r.id !== rule.id))
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setDraftRules([
                ...draftRules,
                { id: createId(), from: "", to: "" },
              ])
            }
          >
            <Plus size={16} />
            규칙 추가
          </Button>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog-footer">
        <p>
          <LockKeyhole size={14} /> 이 브라우저에만 저장됩니다
        </p>
        <Button onClick={save}>
          <Check size={16} /> 설정 저장
        </Button>
      </div>
    </Dialog>
  );
}
