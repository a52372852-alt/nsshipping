"use client";
import { useRef, useState } from "react";
import {
  CloudUpload,
  FileSpreadsheet,
  LoaderCircle,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "./ui/button";
export function UploadZone({
  onFiles,
  busy,
  compact,
}: {
  onFiles: (files: File[]) => void;
  busy: boolean;
  compact: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  return (
    <div
      className={`upload-zone ${dragging ? "dragging" : ""} ${compact ? "compact" : ""}`}
      onClick={(e) => {
        if (
          !busy &&
          e.target instanceof Element &&
          !e.target.closest("button,input")
        )
          input.current?.click();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current++;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        if (--depth.current <= 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        if (!busy) onFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <input
        ref={input}
        type="file"
        multiple
        accept=".xlsx"
        aria-label="주문 엑셀 파일 선택"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <div className="upload-icon">
        {busy ? (
          <LoaderCircle size={30} className="spin" />
        ) : (
          <CloudUpload size={30} />
        )}
      </div>
      <div className="upload-copy">
        <h2>
          {busy
            ? "주문 파일을 분석하고 있습니다"
            : compact
              ? "다른 주문 파일도 함께 올려보세요"
              : "주문 엑셀을 여기에 놓아주세요"}
        </h2>
        <p>
          {compact
            ? "추가한 주문은 아래 목록에 자동으로 통합됩니다."
            : ".xlsx 파일을 드래그하거나 클릭해서 선택하세요."}
        </p>
      </div>
      <Button onClick={() => input.current?.click()} disabled={busy}>
        {compact ? <Plus size={17} /> : <FileSpreadsheet size={17} />}{" "}
        {busy ? "분석 중…" : compact ? "파일 추가" : "주문 엑셀 올리기"}
      </Button>
      {!compact && (
        <div className="upload-note">
          여러 파일 동시 업로드 <span /> 파일당 최대 20MB
        </div>
      )}
      {!compact && (
        <div className="upload-privacy">
          <ShieldCheck size={15} /> 파일은 브라우저에서만 처리됩니다
        </div>
      )}
    </div>
  );
}
