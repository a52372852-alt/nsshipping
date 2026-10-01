"use client";
import { useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { validateOrder } from "@/lib/excel/validators/orderValidator";
import type { EditableField, NormalizedOrder } from "@/types/order";
const fields: [EditableField, string][] = [
  ["orderId", "주문번호"],
  ["productOrderId", "상품주문번호"],
  ["receiverName", "받는사람"],
  ["receiverPhone1", "전화번호1"],
  ["receiverPhone2", "전화번호2"],
  ["postalCode", "우편번호"],
  ["address", "주소"],
  ["productName", "상품명"],
  ["optionName", "옵션"],
  ["quantity", "수량"],
  ["deliveryMessage", "배송메시지"],
];
export function OrderEditor({
  order,
  onClose,
  onSave,
}: {
  order: NormalizedOrder;
  onClose: () => void;
  onSave: (order: NormalizedOrder) => void;
}) {
  const [draft, setDraft] = useState(order);
  const issues = validateOrder(draft);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="주문 확인 및 수정"
      description={`${order.sourceFileName} · ${order.sourceSheet} ${order.sourceRow}행`}
      wide
    >
      <div className="editor-issues">
        {issues.map((issue, index) => (
          <p key={index} className={issue.level}>
            <AlertCircle size={14} />
            {issue.message}
          </p>
        ))}
        {!issues.length && (
          <p className="success">
            <Check size={15} /> 모든 필수 항목이 올바릅니다.
          </p>
        )}
      </div>
      <div className="form-grid">
        {fields.map(([field, label]) => (
          <label
            key={field}
            className={
              [
                "address",
                "productName",
                "optionName",
                "deliveryMessage",
              ].includes(field)
                ? "full"
                : ""
            }
          >
            {label}
            {field === "address" ||
            field === "productName" ||
            field === "deliveryMessage" ? (
              <textarea
                value={String(draft[field])}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    [field]: e.target.value,
                    sourceIssues: draft.sourceIssues.filter(
                      (issue) => issue.field !== field,
                    ),
                  })
                }
              />
            ) : (
              <input
                type={field === "quantity" ? "number" : "text"}
                min={field === "quantity" ? 1 : undefined}
                step={field === "quantity" ? 1 : undefined}
                value={
                  field === "quantity" && !Number.isFinite(draft.quantity)
                    ? ""
                    : draft[field]
                }
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    [field]:
                      field === "quantity"
                        ? Number(e.target.value)
                        : e.target.value,
                    sourceIssues: draft.sourceIssues.filter(
                      (issue) => issue.field !== field,
                    ),
                  })
                }
              />
            )}
          </label>
        ))}
      </div>
      <div className="dialog-footer">
        <p>수정 내용은 현재 작업에만 적용됩니다.</p>
        <Button
          onClick={() => {
            onSave(draft);
            onClose();
          }}
        >
          <Check size={16} /> 수정 저장
        </Button>
      </div>
    </Dialog>
  );
}
