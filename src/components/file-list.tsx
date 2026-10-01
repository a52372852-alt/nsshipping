import { FileSpreadsheet, CheckCircle2, X } from "lucide-react";
import { PlatformBadge } from "./platform-badge";
import type { ImportedFile } from "@/types/order";
export function FileList({
  files,
  disabled,
  onRemove,
}: {
  files: ImportedFile[];
  disabled: boolean;
  onRemove: (id: string) => void;
}) {
  return (
    <>
      <div className="file-list">
        {files.map((file) => (
          <div
            className={`file-item ${file.status === "error" ? "file-error" : ""}`}
            key={file.id}
          >
            <span className="file-icon">
              <FileSpreadsheet size={22} />
            </span>
            <div className="file-content">
              <div className="file-title">
                <span title={file.name}>{file.name}</span>
                {file.platforms.map((platform) => (
                  <PlatformBadge key={platform} platform={platform} />
                ))}
              </div>
              <p>
                {file.error || file.details}
                {file.error && file.details ? ` ${file.details}` : ""}
              </p>
            </div>
            <div className="file-count">
              {file.status === "ready" ? (
                <>
                  <strong>{file.count}</strong>건 <CheckCircle2 size={15} />
                </>
              ) : (
                <span>확인 필요</span>
              )}
            </div>
            <button
              className="icon-button"
              aria-label={`${file.name} 제거`}
              disabled={disabled}
              onClick={() => onRemove(file.id)}
            >
              <X size={17} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
