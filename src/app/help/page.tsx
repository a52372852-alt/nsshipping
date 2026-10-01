import Link from "next/link";
import { GuideShell } from "@/components/guide-shell";
import { StructuredData } from "@/components/structured-data";
import { faqs } from "@/content/faq";
import { pageMetadata } from "@/lib/seo/metadata";
export const metadata = pageMetadata(
  "택배 엑셀 변환 자주 묻는 질문",
  "무료 이용, 지원 택배사, 개인정보, 암호 엑셀, 상품명과 옵션, 다운로드 건수 등 NS Shipping 이용 질문에 답합니다.",
  "/help",
);
export default function HelpPage() {
  return (
    <GuideShell>
      <article className="guide-container guide-article">
        <StructuredData
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(({ question, answer }) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: { "@type": "Answer", text: answer },
            })),
          }}
        />
        <header className="guide-intro">
          <span className="small-label">자주 묻는 질문</span>
          <h1>
            주문 엑셀 변환,
            <br />
            궁금한 점을 확인하세요.
          </h1>
          <p>실제 지원 기능과 파일 처리 방식을 기준으로 답변합니다.</p>
          <p className="editorial-date">
            내용 확인: 2026년 10월 2일 · NS Shipping
          </p>
        </header>
        {faqs.map(({ question, answer }, i) => (
          <section
            className="guide-section"
            id={`question-${i + 1}`}
            key={question}
          >
            <h2>{question}</h2>
            <p>{answer}</p>
          </section>
        ))}
        <div className="guide-cta">
          <Link className="button button-primary" href="/#upload">
            무료로 엑셀 변환하기
          </Link>
          <Link className="guide-inline-link" href="/guides">
            단계별 사용 방법 →
          </Link>
        </div>
      </article>
    </GuideShell>
  );
}
