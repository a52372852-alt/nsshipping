"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UploadZone } from "./upload-zone";
import { Button } from "./ui/button";
import { DEFAULT_SENDER, type SenderSettings } from "@/types/order";
import { createId } from "@/lib/createId";
import { loadSettings } from "@/lib/settings";
import { applyProductRules } from "@/lib/excel/transforms/productNameRules";
import { validateOrder } from "@/lib/excel/validators/orderValidator";
import {
  loadPrivateSender,
  savePrivateSender,
} from "@/lib/private-shipping/settings";
import type { SplitOrder } from "@/lib/private-shipping/converter";
import styles from "./private-shipping.module.css";

export default function PrivateShipping() {
  const [rows, setRows] = useState<SplitOrder[]>([]);
  const [sender, setSender] = useState<SenderSettings>(DEFAULT_SENDER);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [storageMessage, setStorageMessage] = useState("");
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const working = useRef(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSender(loadPrivateSender());
    setReady(true);
  }, []);
  function changeSender(key: keyof SenderSettings, value: string) {
    const next = { ...sender, [key]: value };
    setSender(next);
    try {
      savePrivateSender(next);
      setStorageMessage(
        "자동 저장됨 · 수정하기 전까지 이 브라우저에서 유지됩니다.",
      );
    } catch {
      setStorageMessage(
        "저장할 수 없습니다. 브라우저의 사이트 저장소 허용 여부를 확인해주세요. 현재 작업에는 적용됩니다.",
      );
    }
  }
  async function upload(files: File[]) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setNotice("");
    setDownloaded([]);
    // A new upload replaces the previous batch; failed reads cannot leave old downloads available.
    setRows([]);
    setFileNames([]);
    try {
      const { readSplitOrders } =
        await import("@/lib/private-shipping/converter");
      const next: SplitOrder[] = [];
      const rules = loadSettings().rules;
      for (const file of files) {
        const result = await readSplitOrders(
          await file.arrayBuffer(),
          file.name,
          createId(),
        );
        next.push(
          ...result.split.map((r) => ({
            ...r,
            order: applyProductRules(r.order, rules),
          })),
        );
      }
      setRows(next);
      setFileNames(files.map((f) => f.name));
      if (!next.length)
        setNotice(
          "주문이 없습니다. 쇼핑몰에서 받은 원본 주문 파일을 올려주세요.",
        );
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "주문 파일을 읽지 못했습니다.",
      );
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  const issues = rows.flatMap((r) => [
    ...validateOrder(r.order)
      .filter((i) => i.level === "error")
      .map((i) => `${r.order.sourceRow}행: ${i.message}`),
  ]);
  async function download(group: "orange" | "plain") {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setNotice("");
    try {
      const { exportSplitGroup, splitFilename } =
        await import("@/lib/private-shipping/converter");
      const buffer = await exportSplitGroup(rows, group, sender);
      const url = URL.createObjectURL(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = splitFilename(group);
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setDownloaded((prev) => [...new Set([...prev, group])]);
      setNotice(
        `${group === "orange" ? "지정송하인" : "지정"} 파일을 다운로드했습니다.`,
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "다운로드하지 못했습니다.");
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <header className={`site-header ${styles.header}`}>
        <div className={`header-inner ${styles.headerInner}`}>
          <Link href="/" className="brand">
            NS Shipping
          </Link>
          <strong className={styles.titleBox}>내 롯데택배 분리 출력</strong>
        </div>
      </header>
      <main
        className="workspace-shell"
        style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}
      >
        <h1>주문 파일 하나, 롯데택배 엑셀 두 개</h1>
        <p style={{ margin: "16px 0 24px" }}>
          수령인 이름이 표준 주황색이면 지정송하인, 그 외에는 지정 양식으로
          분리합니다.
        </p>
        <aside className="privacy-notice">
          <strong>
            엑셀은 브라우저에서 처리되며 파일을 서버로 전송하지 않습니다.
          </strong>
        </aside>
        <section className="carrier-section" data-nosnippet>
          <h2>발송인 설정</h2>
          <p>입력하면 자동 저장됩니다. 새 작업을 시작해도 유지됩니다.</p>
          <div className="form-grid" style={{ marginTop: 20 }}>
            {(
              [
                ["name", "보내는 사람"],
                ["phone", "발송인 전화번호"],
                ["phone2", "추가 전화번호"],
                ["postalCode", "발송인 우편번호"],
                ["address", "발송인 주소"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  disabled={!ready || busy}
                  value={sender[key]}
                  onChange={(e) => changeSender(key, e.target.value)}
                  type={key.includes("phone") ? "tel" : "text"}
                />
              </label>
            ))}
            <label>
              운임구분
              <select
                disabled={!ready || busy}
                value={sender.freight}
                onChange={(e) => changeSender("freight", e.target.value)}
              >
                <option>신용</option>
                <option>선불</option>
                <option>착불</option>
              </select>
            </label>
          </div>
          <p role="status" className="field-help">
            {storageMessage ||
              (ready && sender.phone
                ? "저장된 발송인 정보를 불러왔습니다."
                : "처음 한 번만 입력해주세요.")}
          </p>
        </section>
        <section style={{ margin: "28px 0" }}>
          <h2>쇼핑몰 원본 주문 파일</h2>
          <p>
            다운로드한 롯데 결과 파일이 아닌, 주황색으로 표시한
            쿠팡·스마트스토어·토스 주문 파일을 올려주세요.
          </p>
          <UploadZone
            compact={rows.length > 0}
            busy={busy || !ready}
            onFiles={upload}
          />
        </section>
        {notice && (
          <p role="alert" className="notice">
            {notice}
          </p>
        )}
        {issues.length > 0 && (
          <div role="alert" className="form-error">
            {issues.map((i, n) => (
              <p key={n}>{i}</p>
            ))}
          </div>
        )}
        {rows.length > 0 && (
          <section data-nosnippet>
            <div className="workspace-title">
              <h2>
                총 {rows.length}건 · 파일 {fileNames.length}개
              </h2>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setRows([]);
                  setFileNames([]);
                  setDownloaded([]);
                  setNotice("");
                }}
              >
                새 작업
              </Button>
            </div>
            <div className="carrier-options" style={{ margin: "24px 0" }}>
              {(["orange", "plain"] as const).map((group) => {
                const count = rows.filter((r) => r.group === group).length;
                return (
                  <section
                    key={group}
                    className="carrier-section"
                    style={{ margin: 0 }}
                  >
                    <h3>
                      {group === "orange"
                        ? "주황색 · 지정송하인"
                        : "그 외 · 지정"}{" "}
                      {count}건
                    </h3>
                    <p>
                      {group === "orange"
                        ? "기존 양식 · 배송메시지 앞에 [R] 표시"
                        : "새 B타입 양식 · N열 수량, S열 공란"}
                    </p>
                    {count === 0 && <p>해당 주문이 없어 헤더만 출력합니다.</p>}
                    <Button
                      disabled={
                        busy ||
                        issues.length > 0 ||
                        !sender.name.trim() ||
                        !sender.phone.trim()
                      }
                      onClick={() => download(group)}
                    >
                      {group === "orange"
                        ? "지정송하인 엑셀 다운로드"
                        : "지정 엑셀 다운로드"}
                    </Button>
                    {downloaded.includes(group) && <p>다운로드 완료</p>}
                  </section>
                );
              })}
            </div>
            {(!sender.phone.trim() || !sender.name.trim()) && (
              <p className="form-error">
                위 발송인 이름과 전화번호를 입력하면 두 파일을 다운로드할 수
                있습니다.
              </p>
            )}
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>원본 행</th>
                    <th>수령인</th>
                    <th>상품명</th>
                    <th>수량</th>
                    <th>출력 양식</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ order, group }) => (
                    <tr key={order.id}>
                      <td>{order.sourceRow}</td>
                      <td>{order.receiverName}</td>
                      <td>{order.productName}</td>
                      <td>{order.quantity}</td>
                      <td>{group === "orange" ? "지정송하인" : "지정"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
