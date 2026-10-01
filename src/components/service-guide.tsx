import {
  FileSpreadsheet,
  ScanLine,
  ArrowDownToLine,
  ShieldCheck,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";
export function ServiceGuide() {
  return (
    <>
      <section id="how-it-works" className="how-section">
        <div className="how-heading">
          <span className="small-label">HOW IT WORKS</span>
          <h2>매일의 발송 업무, 세 단계면 충분해요.</h2>
        </div>
        <div className="how-grid">
          {[
            {
              icon: FileSpreadsheet,
              title: "주문 엑셀 업로드",
              body: "여러 마켓의 주문 파일을 한 번에 올리세요. 양식은 자동으로 인식합니다.",
            },
            {
              icon: ScanLine,
              title: "자동 분석 · 검증",
              body: "누락된 정보와 중복 주문을 확인하고, 상품명과 발송인을 설정하세요.",
            },
            {
              icon: ArrowDownToLine,
              title: "롯데택배 파일 다운로드",
              body: "검증된 주문을 롯데택배 양식으로 받아 송장 등록에 바로 사용하세요.",
            },
          ].map((item, index) => (
            <div className="how-card" key={item.title}>
              <div className="how-icon">
                <item.icon size={22} />
                <span>0{index + 1}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="privacy" className="privacy-card">
        <div className="privacy-icon">
          <ShieldCheck size={27} />
        </div>
        <div>
          <h2>주문정보는 내 브라우저 안에만.</h2>
          <p>
            업로드한 파일은 브라우저에서 처리되며, 주문정보를 서버에 전송하거나
            저장하지 않습니다.
            <br />새 작업을 시작하거나 페이지를 새로고침하면 주문 데이터가
            초기화됩니다.
          </p>
          <Link
            className="guide-inline-link"
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
          >
            설정 저장과 공용 PC 이용 안내 (새 탭) →
          </Link>
        </div>
        <span className="privacy-tag">
          <LockKeyhole size={14} />
          LOCAL PROCESSING
        </span>
      </section>
      <div className="home-guide-link">
        <div>
          <h2>파일 변환이 처음이신가요?</h2>
          <p>
            마켓별 사용법과 암호 파일·오류 해결 방법을 확인하세요. 안내는 새
            탭에서 열립니다.
          </p>
        </div>
        <Link
          className="button button-outline"
          href="/guides"
          target="_blank"
          rel="noopener noreferrer"
          prefetch={false}
        >
          사용 방법 보기 <span className="sr-only">(새 탭)</span> →
        </Link>
      </div>
    </>
  );
}
