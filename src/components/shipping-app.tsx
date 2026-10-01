"use client";
import { createId } from "@/lib/createId";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  CARRIERS,
  type Carrier,
  type TemplateProfile,
} from "@/lib/templates/types";
const CarrierTemplate = dynamic(
  () => import("./carrier-template").then((m) => m.CarrierTemplate),
  { ssr: false, loading: () => <p>택배사 양식 설정을 불러오는 중…</p> },
);
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Package,
  Settings2,
  Check,
  ArrowRight,
  X,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { UploadZone } from "./upload-zone";
import { PlatformBadge } from "./platform-badge";
import { SettingsDialog } from "./settings-dialog";
import { OrderEditor } from "./order-editor";
import { OrdersTable, type ReviewedOrder } from "./orders-table";
import {
  duplicateIds,
  validateOrder,
} from "@/lib/excel/validators/orderValidator";
import { applyProductRules } from "@/lib/excel/transforms/productNameRules";
import { loadSettings, SETTINGS_KEY } from "@/lib/settings";
import {
  DEFAULT_SENDER,
  type ImportedFile,
  type NormalizedOrder,
  type Platform,
  type ProductRule,
  type SenderSettings,
} from "@/types/order";
import { FileList } from "./file-list";
import { OrderSummary } from "./order-summary";
import { ConversionActions } from "./conversion-actions";
import { ServiceGuide } from "./service-guide";
type SettingsTab = "sender" | "rules";
export default function ShippingApp() {
  const [carrier, setCarrier] = useState<Carrier>("lotte");
  const [template, setTemplate] = useState<TemplateProfile | null>(null);
  const [templateEditing, setTemplateEditing] = useState(false);
  const [files, setFiles] = useState<ImportedFile[]>([]);
  const [orders, setOrders] = useState<NormalizedOrder[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [sender, setSender] = useState(DEFAULT_SENDER);
  const [rules, setRules] = useState<ProductRule[]>([]);
  const [settings, setSettings] = useState<SettingsTab | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const uploading = useRef(false);
  const workRef = useRef<HTMLDivElement>(null);
  // localStorage is a browser-only external store. Read after hydration to keep
  // the server-rendered first frame identical and avoid exposing saved settings to SSR.
  useEffect(() => {
    const saved = loadSettings();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSender(saved.sender);
    setRules(saved.rules);
  }, []);
  const duplicate = useMemo(() => duplicateIds(orders), [orders]);
  const reviewed = useMemo<ReviewedOrder[]>(
    () =>
      orders.map((original) => {
        const order = applyProductRules(original, rules);
        const issues = validateOrder(order);
        const isDuplicate = duplicate.has(order.id);
        return {
          order,
          issues,
          duplicate: isDuplicate,
          excluded: excluded.has(order.id),
          status: issues.some((i) => i.level === "error")
            ? "error"
            : issues.length || isDuplicate
              ? "warning"
              : "valid",
        };
      }),
    [orders, rules, excluded, duplicate],
  );
  const eligible = reviewed.filter(
    (row) => !row.excluded && row.status !== "error",
  );
  const errors = reviewed.filter((row) => row.status === "error").length;
  const editingOrder = orders.find((order) => order.id === editing);
  async function upload(incoming: File[]) {
    if (uploading.current || !incoming.length) return;
    uploading.current = true;
    setBusy(true);
    setNotice("");
    try {
      const { readOrders } = await import("@/lib/excel/reader");
      for (const file of incoming) {
        const id = createId();
        try {
          if (file.size > 20 * 1024 * 1024)
            throw new Error("파일당 최대 20MB까지 처리할 수 있습니다.");
          const result = await readOrders(
            await file.arrayBuffer(),
            file.name,
            id,
          );
          setFiles((prev) => [...prev, result.file]);
          setOrders((prev) => [...prev, ...result.orders]);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "파일을 처리하지 못했습니다.";
          const details =
            error && typeof error === "object" && "details" in error
              ? String(error.details)
              : "";
          setFiles((prev) => [
            ...prev,
            {
              id,
              name: file.name,
              size: file.size,
              status: "error",
              platforms: [],
              count: 0,
              error: message,
              details,
            },
          ]);
        }
      }
      setTimeout(
        () =>
          workRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        100,
      );
    } catch {
      setNotice(
        "Excel 모듈을 불러오지 못했습니다. 페이지를 새로고침한 후 다시 시도해주세요.",
      );
    } finally {
      uploading.current = false;
      setBusy(false);
    }
  }
  function saveSettings(nextSender: SenderSettings, nextRules: ProductRule[]) {
    setSender(nextSender);
    setRules(nextRules);
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ sender: nextSender, rules: nextRules }),
      );
      setNotice("설정을 저장했습니다.");
    } catch {
      setNotice(
        "설정은 현재 작업에 적용되었습니다. 브라우저 저장소를 사용할 수 없어 다음 방문에는 유지되지 않습니다.",
      );
    }
  }
  function removeFile(id: string) {
    setFiles((prev) => prev.filter((file) => file.id !== id));
    setOrders((prev) => prev.filter((order) => order.fileId !== id));
    setExcluded(
      (prev) => new Set([...prev].filter((key) => !key.startsWith(id + ":"))),
    );
    setNotice("");
  }
  function toggle(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  async function download() {
    if (carrier === "lotte" && (!sender.name.trim() || !sender.phone.trim())) {
      setSettings("sender");
      return;
    }
    setDownloading(true);
    setNotice("");
    try {
      let buffer: ArrayBuffer;
      let fileName: string;
      if (carrier === "lotte") {
        const { exportLotte, downloadName } =
          await import("@/lib/excel/exporters/lotte");
        buffer = await exportLotte(
          eligible.map((row) => row.order),
          sender,
        );
        fileName = downloadName();
      } else {
        if (!template || template.carrier !== carrier || templateEditing)
          throw new Error("택배사 양식과 항목 연결을 먼저 확인해주세요.");
        const { exportCustomTemplate } =
          await import("@/lib/templates/workbook");
        buffer = await exportCustomTemplate(
          template,
          eligible.map((row) => row.order),
          sender,
        );
        fileName = `${template.name.replace(/[\\/:*?"<>|]/g, "_")}_출고.xlsx`;
      }
      const url = URL.createObjectURL(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setNotice(
        `${eligible.length}건의 ${CARRIERS[carrier]} 파일을 생성했습니다. 다운로드 폴더를 확인해주세요.`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "파일을 생성하지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      setDownloading(false);
    }
  }
  return (
    <>
      <a href="#upload" className="skip-link">
        엑셀 업로드로 바로가기
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a href="#" className="brand">
            <span className="brand-icon">
              <Package size={21} />
            </span>
            <span>
              NS <strong>Shipping</strong>
            </span>
          </a>
          <nav aria-label="주요 메뉴" className="shipping-nav">
            <a href="#markets">지원 마켓</a>
            <Link
              href="/guides"
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
            >
              사용 방법<span className="sr-only"> (새 탭)</span>
            </Link>
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
            >
              개인정보 보호<span className="sr-only"> (새 탭)</span>
            </Link>
          </nav>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettings("sender")}
          >
            <Settings2 size={16} />
            <span>설정</span>
          </Button>
        </div>
      </header>
      <main>
        <section className={`hero ${files.length ? "has-files" : ""}`}>
          <div className="hero-eyebrow">
            <span /> 주문 정리부터 송장 등록까지, 한 곳에서
          </div>
          <h1>
            마켓 주문 엑셀을
            <br />
            <span>내 택배사 양식으로</span> 한 번에.
          </h1>
          <p className="hero-description">
            쿠팡 · 스마트스토어 · 토스쇼핑 주문 엑셀을 올리면
            <br className="desktop-br" /> 자동으로 분석하고, 송장 등록 파일로
            변환합니다.
          </p>
          <div className="trust-row">
            <span>
              <Check size={14} />
              서버 저장 없음
            </span>
            <span>
              <Check size={14} />
              플랫폼 자동 감지
            </span>
            <span>
              <Check size={14} />
              여러 마켓 한 번에
            </span>
          </div>
        </section>
        <div className="main-container">
          <section id="upload" className="upload-section">
            <aside
              className="upload-privacy"
              aria-label="주문 파일 개인정보 안내"
            >
              <ShieldCheck size={25} aria-hidden="true" />
              <div>
                <strong>
                  엑셀은 브라우저에서 처리되며 파일을 서버로 전송하지 않습니다.
                </strong>
                <p>
                  주문 파일과 주문 데이터를 서버에 저장하지 않습니다.
                  발송인·상품명 규칙·비밀번호 설정은 이 브라우저에 저장됩니다.
                </p>
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                >
                  개인정보 처리 방식 보기 <span>(새 탭)</span> →
                </Link>
              </div>
            </aside>
            <div className="section-kicker">
              <span>01</span> 주문 파일 업로드{" "}
              <span className="kicker-right">복잡한 양식 정리는 이제 그만</span>
            </div>
            <UploadZone
              onFiles={upload}
              busy={busy}
              compact={files.length > 0}
            />
            <div id="markets" className="market-flow">
              <span className="market-label">지원 마켓</span>
              {(["coupang", "smartstore", "toss"] as Platform[]).map(
                (platform) => (
                  <PlatformBadge platform={platform} key={platform} />
                ),
              )}
              <ArrowRight size={17} className="flow-arrow" />
              <span className="lotte-badge">
                <Package size={17} />
                {CARRIERS[carrier]}
              </span>
              <span className="auto-label">양식 자동 변환</span>
            </div>
          </section>
          <div aria-live="polite" className={notice ? "notice" : "sr-only"}>
            {notice && (
              <>
                <CheckCircle2 size={18} />
                <span>{notice}</span>
                <button
                  className="icon-button"
                  onClick={() => setNotice("")}
                  aria-label="알림 닫기"
                >
                  <X size={16} />
                </button>
              </>
            )}
          </div>
          <section className="carrier-section" aria-labelledby="carrier-title">
            <div className="section-kicker">
              <span>02</span>
              <h2 id="carrier-title">출력할 택배사 선택</h2>
            </div>
            <div
              className="carrier-options"
              role="group"
              aria-label="택배사 선택"
            >
              {Object.entries(CARRIERS).map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={carrier === id}
                  disabled={busy || downloading}
                  onClick={() => {
                    if (id === carrier) return;
                    setCarrier(id as Carrier);
                    setTemplate(null);
                    setTemplateEditing(id !== "lotte");
                  }}
                >
                  {label}
                  <small>
                    {id === "lotte"
                      ? "기존 양식 바로 사용"
                      : "내 양식 등록 · 재사용"}
                  </small>
                </button>
              ))}
            </div>
            {carrier === "lotte" ? (
              <p className="carrier-note">
                기존 롯데택배 출력 양식을 그대로 사용합니다. 별도의 양식 등록은
                필요 없습니다.
              </p>
            ) : (
              <CarrierTemplate
                key={carrier}
                carrier={carrier}
                profile={template}
                onChange={setTemplate}
                orders={eligible.map((row) => row.order)}
                sender={sender}
                disabled={busy || downloading}
                onEditingChange={setTemplateEditing}
              />
            )}
          </section>
          {files.length > 0 && (
            <div className="workspace" ref={workRef}>
              <div className="workspace-title">
                <div className="section-kicker">
                  <span>03</span> 주문 확인 및 변환
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy || downloading}
                  onClick={() => setResetOpen(true)}
                >
                  <RotateCcw size={15} />새 작업
                </Button>
              </div>
              <FileList
                files={files}
                disabled={busy || downloading}
                onRemove={removeFile}
              />
              {orders.length > 0 && (
                <>
                  <OrderSummary
                    orders={orders}
                    reviewed={reviewed}
                    excluded={excluded}
                    duplicate={duplicate}
                  />
                  <OrdersTable
                    rows={reviewed}
                    onToggle={toggle}
                    onEdit={setEditing}
                    onRules={() => setSettings("rules")}
                  />
                  <ConversionActions
                    sender={sender}
                    rules={rules}
                    eligible={eligible}
                    errors={errors}
                    excluded={excluded}
                    busy={busy}
                    downloading={downloading}
                    setSettings={setSettings}
                    download={download}
                    carrierLabel={CARRIERS[carrier]}
                    custom={carrier !== "lotte"}
                    templateReady={
                      carrier === "lotte" || (!!template && !templateEditing)
                    }
                  />
                </>
              )}
            </div>
          )}
          <ServiceGuide />
        </div>
      </main>
      <footer>
        <a href="#" className="brand">
          <Package size={18} />
          <span>
            NS <strong>Shipping</strong>
          </span>
        </a>
        <nav aria-label="서비스 정보" className="footer-service-links">
          {[
            ["/tools", "지원 마켓·택배사"],
            ["/help", "자주 묻는 질문"],
            ["/about", "서비스 소개"],
            ["/terms", "이용 안내"],
            ["/contact", "문의"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
            >
              {label}
              <span className="sr-only"> (새 탭)</span>
            </Link>
          ))}
        </nav>
        <span>© {new Date().getFullYear()} NS Shipping</span>
      </footer>
      {settings && (
        <SettingsDialog
          key={settings}
          open
          initialTab={settings}
          sender={sender}
          rules={rules}
          onSave={saveSettings}
          onClose={() => setSettings(null)}
        />
      )}
      {editingOrder && (
        <OrderEditor
          key={editingOrder.id}
          order={editingOrder}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            setOrders((prev) =>
              prev.map((order) => (order.id === next.id ? next : order)),
            );
            setNotice("주문을 수정하고 다시 검증했습니다.");
          }}
        />
      )}
      <Dialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="새 작업을 시작할까요?"
        description="업로드한 주문과 수정 내용이 초기화됩니다. 저장한 발송인과 상품명 규칙은 유지됩니다."
      >
        <div className="dialog-actions">
          <Button variant="outline" onClick={() => setResetOpen(false)}>
            취소
          </Button>
          <Button
            onClick={() => {
              setFiles([]);
              setOrders([]);
              setExcluded(new Set());
              setNotice("");
              setResetOpen(false);
            }}
          >
            새 작업 시작
          </Button>
        </div>
      </Dialog>
    </>
  );
}
