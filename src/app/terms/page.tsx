import Link from "next/link";
import { GuideShell } from "@/components/guide-shell";
import { pageMetadata } from "@/lib/seo/metadata";
export const metadata = pageMetadata(
  "서비스 이용 안내",
  "NS Shipping의 무료 이용 범위, 지원 파일, 다운로드 결과 확인과 작업 데이터 보관을 안내합니다.",
  "/terms",
);
export default function TermsPage() {
  return (
    <GuideShell>
      <article className="guide-container guide-article">
        <header className="guide-intro">
          <span className="small-label">이용 안내</span>
          <h1>변환 전에 확인하세요.</h1>
          <p>
            현재 서비스의 지원 범위와 작업 시 확인할 내용을 안내합니다. 내용
            확인: 2026년 10월 2일.
          </p>
        </header>
        <section className="guide-section">
          <h2>무료 이용과 지원 형식</h2>
          <p>
            회원가입과 결제 없이 지원 마켓의 .xlsx 주문 파일을 롯데택배 또는
            직접 등록한 택배사 엑셀로 변환할 수 있습니다. 파일당 20MB 제한이
            있으며 기기 성능과 파일 구조에 따라 처리가 어려울 수 있습니다.
          </p>
        </section>
        <section className="guide-section">
          <h2>사용 권한이 있는 주문 파일을 선택하세요.</h2>
          <p>
            본인이 배송 업무를 위해 처리할 수 있는 파일만 사용하세요. 원본을
            별도로 보관하고 실제 출고 대상인지 확인한 뒤 작업합니다.
          </p>
        </section>
        <section className="guide-section">
          <h2>다운로드가 발송 접수를 뜻하지는 않습니다.</h2>
          <p>
            서비스는 택배사 계정에 접속하거나 송장번호를 발급하지 않습니다.
            다운로드한 엑셀의 주문 건수, 수취인, 전화번호, 주소, 상품명, 옵션,
            수량을 검토하고 택배사 프로그램에서 최종 등록 결과를 확인하세요.
          </p>
        </section>
        <section className="guide-section">
          <h2>작업은 자동으로 복구되지 않습니다.</h2>
          <p>
            현재 주문 목록과 수정 내용은 브라우저 메모리에 있습니다. 새로고침,
            새 작업 또는 탭 종료 전에 필요한 결과를 내려받으세요.
            발송인·규칙·비밀번호 설정과 내려받은 파일은 별도로 남을 수 있습니다.
          </p>
        </section>
        <section className="guide-section">
          <h2>양식 변경과 안내</h2>
          <p>
            마켓이나 택배사 양식이 변경되면 현재 지원 범위와 다를 수 있습니다.
            화면의 오류를 확인하고 원본 헤더를 임의로 바꾸지 마세요. 기능 변경
            시 관련 사용 안내를 갱신합니다.
          </p>
          <Link href="/privacy" className="guide-inline-link">
            개인정보 보호 안내 →
          </Link>
        </section>
      </article>
    </GuideShell>
  );
}
