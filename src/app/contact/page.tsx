import Link from "next/link";
import { GuideShell } from "@/components/guide-shell";
import { pageMetadata } from "@/lib/seo/metadata";
export const metadata = pageMetadata(
  "서비스 문의",
  "NS Shipping 이용 오류와 개선 의견을 이메일로 보내주세요. 고객 개인정보를 제외하고 발생 상황을 알려주세요.",
  "/contact",
);
export default function ContactPage() {
  return (
    <GuideShell>
      <article className="guide-container guide-article">
        <header className="guide-intro">
          <span className="small-label">서비스 문의</span>
          <h1>
            문제와 개선 의견을
            <br />
            알려주세요.
          </h1>
          <p>
            이용 중 발생한 오류나 지원 기능에 관한 의견은 아래 이메일로
            보내주세요.
          </p>
        </header>
        <section className="guide-section">
          <h2>문의 이메일</h2>
          <p>
            <a className="guide-inline-link" href="mailto:marine485@gmail.com">
              marine485@gmail.com
            </a>
          </p>
          <p>
            메일은 사용 중인 메일 앱에서 직접 전송됩니다. 이 사이트에 문의
            내용을 저장하는 기능은 없습니다.
          </p>
        </section>
        <section className="guide-section">
          <h2>이 내용을 함께 알려주세요.</h2>
          <ul className="guide-steps">
            <li>사용 중인 마켓과 파일 형식, 브라우저 종류</li>
            <li>어느 단계에서 어떤 오류가 발생했는지</li>
            <li>고객 정보와 파일명을 가린 오류 메시지 또는 화면</li>
            <li>예상한 결과와 실제 결과의 차이</li>
          </ul>
        </section>
        <aside className="guide-note">
          <strong>개인정보가 담긴 원본 주문 파일은 보내지 마세요.</strong>
          <p>
            수취인 이름·전화번호·주소·주문번호·엑셀 비밀번호를 메일에 포함하지
            마세요. 문의 이메일로 직접 보내는 정보는 선택한 메일 서비스를 통해
            전달되며, 브라우저 내부 엑셀 변환과는 별개의 처리입니다.
          </p>
        </aside>
        <div className="guide-cta">
          <Link className="button button-primary" href="/help">
            자주 묻는 질문 먼저 보기
          </Link>
        </div>
      </article>
    </GuideShell>
  );
}
