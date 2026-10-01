"use client";
import { useEffect, useRef, useState } from "react";
import type { Workbook } from "exceljs";
import { Button } from "./ui/button";
import { createId } from "@/lib/createId";
import {
  CARRIERS,
  FIELDS,
  type CustomCarrier,
  type TemplateProfile,
  type ColumnBinding,
} from "@/lib/templates/types";
import {
  listProfiles,
  saveProfile,
  deleteProfile,
} from "@/lib/templates/storage";
import {
  readTemplate,
  suggestHeader,
  templateColumns,
  templateFingerprint,
  cleanTemplate,
  connectionIssues,
  outputValue,
} from "@/lib/templates/workbook";
import type { NormalizedOrder, SenderSettings } from "@/types/order";

type Props = {
  carrier: CustomCarrier;
  profile: TemplateProfile | null;
  onChange: (profile: TemplateProfile | null) => void;
  orders: NormalizedOrder[];
  sender: SenderSettings;
  disabled: boolean;
  onEditingChange: (editing: boolean) => void;
};
export function CarrierTemplate({
  carrier,
  profile,
  onChange,
  orders,
  sender,
  disabled,
  onEditingChange,
}: Props) {
  const [saved, setSaved] = useState<TemplateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [book, setBook] = useState<Workbook | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [headerRow, setHeaderRow] = useState(1);
  const [dataStart, setDataStart] = useState(2);
  const [draft, setDraft] = useState<TemplateProfile | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [persist, setPersist] = useState(true);
  const [changed, setChanged] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    listProfiles()
      .then((all) => {
        if (!mounted.current) return;
        const matches = all.filter((p) => p.carrier === carrier);
        setSaved(matches);
        onChange(matches[0] ?? null);
      })
      .catch(() => {
        if (mounted.current)
          setMessage(
            "저장한 양식을 불러오지 못했습니다. 새 양식을 등록해 현재 작업에서 사용할 수 있습니다.",
          );
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, [carrier, onChange]);
  useEffect(() => {
    onEditingChange(!!book || !!draft || working || loading);
  }, [book, draft, working, loading, onEditingChange]);
  const locked = disabled || working || loading;
  function resetEditor() {
    setBook(null);
    setDraft(null);
    setReviewed(false);
    setChanged(false);
    setDeleteOpen(false);
  }
  async function choose(file?: File) {
    if (!file) return;
    setWorking(true);
    setMessage("");
    setDraft(null);
    setBook(null);
    setReviewed(false);
    setChanged(false);
    try {
      if (file.size > 20 * 1024 * 1024)
        throw new Error("양식 파일은 최대 20MB까지 읽을 수 있습니다.");
      const workbook = await readTemplate(await file.arrayBuffer(), file.name);
      if (!mounted.current) return;
      const suggestion = suggestHeader(workbook);
      setBook(workbook);
      setSheetName(suggestion.sheetName);
      setHeaderRow(suggestion.headerRow);
      setDataStart(suggestion.headerRow + 1);
    } catch (error) {
      if (mounted.current)
        setMessage(
          error instanceof Error ? error.message : "양식을 읽지 못했습니다.",
        );
    } finally {
      if (mounted.current) setWorking(false);
    }
  }
  async function analyze() {
    if (!book) return;
    setWorking(true);
    setMessage("");
    setReviewed(false);
    setChanged(false);
    try {
      const columns = templateColumns(book, sheetName, headerRow);
      const workbook = await cleanTemplate(
        book,
        sheetName,
        headerRow,
        dataStart,
      );
      if (!mounted.current) return;
      const fingerprint = templateFingerprint(
        sheetName,
        columns,
        headerRow,
        dataStart,
      );
      const same = profile?.fingerprint === fingerprint;
      setDraft({
        version: 1,
        id: profile?.id ?? createId(),
        name: profile?.name ?? `${CARRIERS[carrier]} 사용자 양식`,
        carrier,
        sheetName,
        headerRow,
        dataStart,
        fingerprint,
        workbook,
        columns: same ? profile.columns : columns,
        phoneFormat: profile?.phoneFormat ?? "original",
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "항목을 확인하지 못했습니다.",
      );
    } finally {
      setWorking(false);
    }
  }
  function updateColumn(index: number, patch: Partial<ColumnBinding>) {
    setDraft(
      (prev) =>
        prev && {
          ...prev,
          columns: prev.columns.map((c, i) =>
            i === index ? { ...c, ...patch, automatic: false } : c,
          ),
        },
    );
    setReviewed(false);
    setChanged(false);
  }
  async function apply() {
    if (!draft || !reviewed) return;
    const errors = connectionIssues(draft);
    if (!draft.name.trim()) errors.push("양식 이름을 입력해주세요.");
    if (errors.length) {
      setMessage(errors.join(" "));
      return;
    }
    if (profile && profile.fingerprint !== draft.fingerprint && !changed) {
      setChanged(true);
      return;
    }
    setWorking(true);
    setMessage("");
    if (persist) {
      try {
        await saveProfile(draft);
        setSaved((prev) => [...prev.filter((p) => p.id !== draft.id), draft]);
      } catch (error) {
        setMessage(
          `${error instanceof Error ? error.message : "저장 실패"} 현재 작업에만 적용했습니다.`,
        );
        onChange(draft);
        resetEditor();
        setWorking(false);
        return;
      }
    }
    onChange(draft);
    resetEditor();
    setMessage(
      persist
        ? "이 브라우저에 양식과 항목 연결을 저장했습니다."
        : "현재 작업에 적용했습니다. 다음 방문에는 다시 등록해주세요.",
    );
    setWorking(false);
  }
  const preview = draft ?? profile;
  return (
    <div className="carrier-template">
      <input
        ref={input}
        type="file"
        accept=".xlsx"
        aria-label={`${CARRIERS[carrier]} 택배사 양식 선택`}
        className="sr-only"
        disabled={locked}
        onChange={(e) => {
          void choose(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="template-toolbar">
        <label>
          등록한 양식
          <select
            aria-label="등록한 양식"
            value={profile?.id ?? ""}
            disabled={locked}
            onChange={(e) => {
              onChange(saved.find((p) => p.id === e.target.value) ?? null);
              resetEditor();
            }}
          >
            <option value="">새 양식 등록</option>
            {saved.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            {profile && !saved.some((p) => p.id === profile.id) && (
              <option value={profile.id}>{profile.name} (이번 작업)</option>
            )}
          </select>
        </label>
        <Button
          variant="outline"
          disabled={locked}
          onClick={() => input.current?.click()}
        >
          {working
            ? "양식 처리 중…"
            : profile
              ? "택배사 양식 다시 등록"
              : "택배사 양식 등록"}
        </Button>
        {profile && (
          <>
            <Button
              variant="outline"
              disabled={locked}
              onClick={() => {
                setDraft(structuredClone(profile));
                setBook(null);
                setReviewed(false);
              }}
            >
              항목 연결 수정
            </Button>
            <Button
              variant="ghost"
              disabled={locked}
              onClick={() => {
                onChange(null);
                resetEditor();
              }}
            >
              새 양식 추가
            </Button>
            <Button
              variant="ghost"
              disabled={locked}
              onClick={() => setDeleteOpen(true)}
            >
              등록 양식 삭제
            </Button>
          </>
        )}
      </div>
      {!profile && !book && !draft && (
        <p>
          {CARRIERS[carrier]}에서 사용 중인 엑셀 양식을 최초 1회 등록해주세요.
          다른 사람의 양식이 아닌 본인 계약 환경의 .xlsx 파일을 사용하세요.
        </p>
      )}
      <a
        className="guide-inline-link"
        href="/guides/custom-carrier-template"
        target="_blank"
        rel="noopener noreferrer"
      >
        택배사 양식 등록 방법 (새 탭) →
      </a>
      <p className="template-help">
        양식은 이 기기에서만 읽습니다. 제목 행·시트 이름·열 순서·서식을
        보관하고, 제목 행 이외의 셀 값·수식·메모·이미지는 제거합니다. 제목 위
        안내문과 다른 시트의 값도 비워집니다. 고정값은 아래에서 직접 입력하세요.
        원본은 변경하지 않습니다.
      </p>
      {message && (
        <p role="status" className="template-status">
          {message}
        </p>
      )}
      {deleteOpen && profile && (
        <div className="template-confirm" role="alert">
          <p>‘{profile.name}’을 이 브라우저에서 삭제할까요?</p>
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>
            취소
          </Button>
          <Button
            disabled={locked}
            onClick={async () => {
              setWorking(true);
              try {
                await deleteProfile(profile.id);
                setSaved((prev) => prev.filter((p) => p.id !== profile.id));
                onChange(null);
                resetEditor();
              } catch {
                setMessage("삭제하지 못했습니다. 다시 시도해주세요.");
              } finally {
                setWorking(false);
              }
            }}
          >
            양식 삭제 확인
          </Button>
        </div>
      )}
      {book && (
        <section className="template-editor">
          <h3>1. 양식의 제목과 입력 위치 확인</h3>
          <p>
            자동으로 찾은 위치를 확인하세요. 제목 행에는 고객 이름·주소가 아닌
            열 이름만 있어야 합니다. 데이터 시작 행은 첫 주문을 입력할 행입니다.
          </p>
          <div className="template-fields">
            <label>
              출력 시트
              <select
                value={sheetName}
                disabled={locked}
                onChange={(e) => {
                  setSheetName(e.target.value);
                  setDraft(null);
                }}
              >
                {book.worksheets.map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label>
              제목 행
              <input
                aria-label="제목 행"
                type="number"
                min="1"
                max="5000"
                value={headerRow}
                disabled={locked}
                onChange={(e) => {
                  setHeaderRow(Number(e.target.value));
                  setDraft(null);
                }}
              />
            </label>
            <label>
              데이터 시작 행
              <input
                aria-label="데이터 시작 행"
                type="number"
                min={headerRow + 1}
                max="5001"
                value={dataStart}
                disabled={locked}
                onChange={(e) => {
                  setDataStart(Number(e.target.value));
                  setDraft(null);
                }}
              />
            </label>
          </div>
          <div className="template-scroll" data-nosnippet>
            <table>
              <caption>선택한 시트의 제목 행 확인</caption>
              <tbody>
                <tr>
                  {Array.from(
                    {
                      length: Math.min(
                        book.getWorksheet(sheetName)?.columnCount ?? 0,
                        200,
                      ),
                    },
                    (_, i) => (
                      <td key={i}>
                        {book
                          .getWorksheet(sheetName)
                          ?.getCell(
                            Math.max(1, Math.min(5000, headerRow || 1)),
                            i + 1,
                          ).text || "(빈 제목)"}
                      </td>
                    ),
                  )}
                </tr>
              </tbody>
            </table>
          </div>
          <Button disabled={locked} onClick={() => void analyze()}>
            이 위치로 항목 연결하기
          </Button>
        </section>
      )}
      {draft && (
        <section className="template-editor">
          <h3>2. 엑셀 항목 연결 확인</h3>
          <div className="template-fields">
            <label>
              양식 이름
              <input
                aria-label="양식 이름"
                value={draft.name}
                disabled={locked}
                maxLength={80}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label>
              전화번호 출력
              <select
                aria-label="전화번호 출력"
                value={draft.phoneFormat}
                disabled={locked}
                onChange={(e) => {
                  setDraft({
                    ...draft,
                    phoneFormat: e.target
                      .value as TemplateProfile["phoneFormat"],
                  });
                  setReviewed(false);
                }}
              >
                <option value="original">원본 유지</option>
                <option value="digits">공백·하이픈 제거</option>
                <option value="hyphen">하이픈 형식</option>
              </select>
            </label>
          </div>
          <div className="template-scroll">
            <table>
              <caption>택배사 열별로 넣을 주문 항목을 선택하세요.</caption>
              <thead>
                <tr>
                  <th>열 번호</th>
                  <th>택배사 열 제목</th>
                  <th>넣을 주문 항목</th>
                  <th>확인</th>
                </tr>
              </thead>
              <tbody>
                {draft.columns.map((c, i) => (
                  <tr key={c.column}>
                    <td>{c.column}</td>
                    <th scope="row">{c.header || "(빈 제목)"}</th>
                    <td>
                      <select
                        aria-label={`${c.column}열 ${c.header} 연결`}
                        value={c.field}
                        disabled={locked}
                        onChange={(e) =>
                          updateColumn(i, {
                            field: e.target.value as ColumnBinding["field"],
                          })
                        }
                      >
                        {Object.entries(FIELDS).map(([field, label]) => (
                          <option key={field} value={field}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {c.field === "constant" && (
                        <input
                          aria-label={`${c.column}열 고정값`}
                          value={c.constant}
                          maxLength={500}
                          disabled={locked}
                          onChange={(e) =>
                            updateColumn(i, { constant: e.target.value })
                          }
                        />
                      )}
                    </td>
                    <td>
                      {c.automatic
                        ? "자동 연결"
                        : c.field === "blank"
                          ? "빈칸 · 확인 필요"
                          : "직접 설정"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {connectionIssues(draft).length > 0 && (
            <p className="text-warning">{connectionIssues(draft).join(" ")}</p>
          )}
          <label className="template-check">
            <input
              type="checkbox"
              checked={persist}
              disabled={locked}
              onChange={(e) => setPersist(e.target.checked)}
            />
            이 설정을 현재 브라우저에 저장
          </label>
          <label className="template-check">
            <input
              type="checkbox"
              checked={reviewed}
              disabled={locked}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            제목·양식 이름·고정값에 고객 개인정보가 없고, 연결 항목과 빈칸을
            확인했습니다.
          </label>
          {changed && (
            <div role="alert" className="template-confirm">
              기존에 등록한 양식과 컬럼 구성이 다릅니다. 새 양식으로 다시
              설정하시겠습니까? 기존 설정을 바꾸려면 아래 확인 버튼을 누르세요.
            </div>
          )}
          <div className="template-toolbar">
            <Button
              disabled={
                locked || !reviewed || connectionIssues(draft).length > 0
              }
              onClick={() => void apply()}
            >
              {changed ? "새 양식으로 변경 확인" : "확인한 양식 적용"}
            </Button>
            <Button variant="outline" disabled={locked} onClick={resetEditor}>
              변경 취소
            </Button>
            <Button
              variant="ghost"
              disabled={locked}
              onClick={() => {
                setDraft({
                  ...draft,
                  columns: draft.columns.map((c) => ({
                    ...c,
                    field: "blank",
                    constant: "",
                    automatic: false,
                  })),
                });
                setReviewed(false);
              }}
            >
              항목 연결 초기화
            </Button>
          </div>
        </section>
      )}
      {preview && (
        <section className="template-preview" data-nosnippet>
          <h3>변환 결과 미리보기 {draft && "· 아직 적용 전"}</h3>
          <p>
            {preview.sheetName} · 제목 {preview.headerRow}행 · 주문{" "}
            {preview.dataStart}행부터 · 처음 {Math.min(orders.length, 5)}건 표시
          </p>
          {!orders.length ? (
            <p>주문 파일을 선택하면 실제 주문 값이 표시됩니다.</p>
          ) : (
            <div className="template-scroll">
              <table>
                <caption>택배사 출력 열 순서 그대로</caption>
                <thead>
                  <tr>
                    {preview.columns.map((c) => (
                      <th key={c.column}>{c.header || `${c.column}열`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id}>
                      {preview.columns.map((c) => (
                        <td key={c.column}>
                          {String(
                            outputValue(c, o, sender, preview.phoneFormat),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
