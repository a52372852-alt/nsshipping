"use client";
import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PlatformBadge } from "./platform-badge";
import { Button } from "./ui/button";
import type { Issue, NormalizedOrder } from "@/types/order";
export interface ReviewedOrder {
  order: NormalizedOrder;
  issues: Issue[];
  duplicate: boolean;
  excluded: boolean;
  status: "error" | "warning" | "valid";
}
export function OrdersTable({
  rows,
  onToggle,
  onEdit,
  onRules,
}: {
  rows: ReviewedOrder[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onRules: () => void;
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const filtered = rows.filter(
    (row) =>
      (filter === "all" ||
        (filter === "duplicate" && row.duplicate) ||
        row.status === filter) &&
      [
        row.order.orderId,
        row.order.receiverName,
        row.order.productName,
        row.order.address,
      ].some((value) => value.toLowerCase().includes(search.toLowerCase())),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * 20, currentPage * 20 + 20);
  return (
    <section className="preview-card">
      <div className="preview-heading">
        <div>
          <h2>
            변환 미리보기 <span>{rows.length}</span>
          </h2>
          <p>주문을 확인하고, 필요한 항목은 직접 수정하세요.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRules}>
          <SlidersHorizontal size={15} />
          상품명 규칙
        </Button>
      </div>
      <div className="table-toolbar">
        <div className="tabs" role="tablist" aria-label="주문 상태 필터">
          {(
            [
              ["all", "전체"],
              ["valid", "정상"],
              ["warning", "확인 필요"],
              ["error", "오류"],
              ["duplicate", "중복 의심"],
            ] as const
          ).map(([value, label]) => (
            <button
              role="tab"
              aria-selected={filter === value}
              className={filter === value ? "active" : ""}
              key={value}
              onClick={() => {
                setFilter(value);
                setPage(0);
              }}
            >
              {label}
              {value === "error" && rows.some((r) => r.status === "error") && (
                <span className="count-error">
                  {rows.filter((r) => r.status === "error").length}
                </span>
              )}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="주문 검색"
            placeholder="주문번호, 받는사람, 상품 검색"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="주문 미리보기 표"
      >
        <table>
          <thead>
            <tr>
              <th>포함</th>
              <th>플랫폼</th>
              <th>주문번호</th>
              <th>받는사람</th>
              <th>전화번호</th>
              <th>주소</th>
              <th>상품명</th>
              <th>옵션</th>
              <th>수량</th>
              <th>상태</th>
              <th>
                <span className="sr-only">수정</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ order, issues, duplicate, excluded, status }) => (
              <tr
                key={order.id}
                className={`${excluded ? "excluded" : ""} ${status === "error" ? "error-row" : ""}`}
              >
                <td>
                  <input
                    type="checkbox"
                    aria-label={`${order.orderId || "미입력"} ${order.sourceRow}행 포함`}
                    checked={!excluded}
                    onChange={() => onToggle(order.id)}
                  />
                </td>
                <td>
                  <PlatformBadge platform={order.platform} />
                </td>
                <td className="mono">
                  <button
                    className="text-button"
                    title={`${order.sourceFileName} · ${order.sourceSheet} ${order.sourceRow}행`}
                    onClick={() => onEdit(order.id)}
                  >
                    {order.orderId || (
                      <span className="text-error">미입력</span>
                    )}
                  </button>
                </td>
                <td>{order.receiverName || "—"}</td>
                <td className="mono nowrap">{order.receiverPhone1 || "—"}</td>
                {(["address", "productName", "optionName"] as const).map(
                  (field) => (
                    <td key={field}>
                      <button
                        className={`truncate-cell ${field === "address" ? "address-cell" : ""}`}
                        title={order[field]}
                        onClick={() => onEdit(order.id)}
                      >
                        {order[field] || "—"}
                      </button>
                    </td>
                  ),
                )}
                <td className="quantity">
                  {Number.isFinite(order.quantity) ? order.quantity : "—"}
                </td>
                <td>
                  <button
                    onClick={() => onEdit(order.id)}
                    className={`status-pill ${status}`}
                    title={issues.map((issue) => issue.message).join("\n")}
                  >
                    {status === "error"
                      ? "오류"
                      : duplicate
                        ? "중복 의심"
                        : status === "warning"
                          ? "확인 필요"
                          : "정상"}
                  </button>
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`${order.orderId || "미입력"} 주문 수정`}
                    onClick={() => onEdit(order.id)}
                  >
                    <Pencil size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <div className="table-empty">조건에 맞는 주문이 없습니다.</div>
        )}
      </div>
      <div className="table-footer">
        <span>
          {filtered.length ? currentPage * 20 + 1 : 0}–
          {Math.min((currentPage + 1) * 20, filtered.length)} /{" "}
          {filtered.length}건{" "}
          <span className="footer-hint">
            · 오류 주문은 다운로드에서 자동 제외됩니다
          </span>
        </span>
        <div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="이전 페이지"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={17} />
          </Button>
          <span>
            {currentPage + 1} / {pageCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="다음 페이지"
            disabled={currentPage + 1 >= pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={17} />
          </Button>
        </div>
      </div>
    </section>
  );
}
