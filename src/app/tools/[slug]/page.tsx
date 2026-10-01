import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideShell } from "@/components/guide-shell";
import { StructuredData } from "@/components/structured-data";
import { AdSlot } from "@/components/ad-slot";
import { conversionTools } from "@/content/tools";
import { pageMetadata, breadcrumbs } from "@/lib/seo/metadata";
export const dynamicParams = false;
export function generateStaticParams() {
  return conversionTools.map(({ slug }) => ({ slug }));
}
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const tool = conversionTools.find((t) => t.slug === slug);
  if (!tool) notFound();
  return pageMetadata(tool.title, tool.description, `/tools/${slug}`);
}
export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = conversionTools.find((t) => t.slug === slug);
  if (!tool) notFound();
  return (
    <GuideShell>
      <article className="guide-container guide-article">
        <StructuredData
          data={breadcrumbs([
            { name: "무료 엑셀 변환", path: "/" },
            { name: tool.title, path: `/tools/${slug}` },
          ])}
        />
        <nav className="guide-breadcrumb" aria-label="현재 위치">
          <Link href="/">무료 엑셀 변환</Link>
          <span>/</span>
          <span>{tool.market} → 롯데택배</span>
        </nav>
        <header className="guide-intro">
          <span className="small-label">{tool.market} → 롯데택배</span>
          <h1>{tool.title}</h1>
          <p>{tool.answer}</p>
          <p className="editorial-date">
            내용 확인: 2026년 10월 2일 · NS Shipping
          </p>
        </header>
        <div className="guide-cta">
          <Link className="button button-primary" href="/#upload">
            {tool.market} 주문 엑셀 변환 시작
          </Link>
          <p>회원가입 없이 무료 · .xlsx 지원 · 파일당 최대 20MB</p>
        </div>
        <section className="guide-section">
          <h2>어떤 파일을 준비하나요?</h2>
          <p>{tool.prepare}</p>
          <p>
            모든 엑셀 변환은 사용자의 브라우저에서 처리됩니다. 주문정보 및
            개인정보는 서버에 업로드되거나 저장되지 않습니다.
          </p>
        </section>
        <section className="guide-section">
          <h2>변환은 어떻게 진행하나요?</h2>
          <ol className="guide-steps">
            <li>
              변환 화면에서 원본 주문 엑셀을 선택합니다. 마켓은 파일의 헤더로
              자동 인식합니다.
            </li>
            <li>
              파일별 주문 건수와 받는사람·전화번호·주소를 확인합니다. 오류가
              있으면 주문 수정 화면에서 고칩니다.
            </li>
            <li>
              발송인 이름과 전화번호를 설정하고 출력에 포함할 주문을 확인합니다.
            </li>
            <li>
              롯데택배 엑셀을 다운로드해 검토한 뒤 택배사 운영 프로그램에서
              등록합니다.
            </li>
          </ol>
        </section>
        <section className="guide-section">
          <h2>{tool.market} 항목은 어디에 들어가나요?</h2>
          <div
            className="guide-table-wrap"
            role="region"
            aria-label={`${tool.market} 출력 항목`}
            tabIndex={0}
          >
            <table>
              <caption>현재 지원 양식의 주요 항목 연결</caption>
              <thead>
                <tr>
                  <th scope="col">{tool.market} 원본</th>
                  <th scope="col">롯데택배 출력</th>
                </tr>
              </thead>
              <tbody>
                {tool.fields.map(([source, target]) => (
                  <tr key={source}>
                    <th scope="row">{source}</th>
                    <td>{target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>{tool.example}</p>
        </section>
        <AdSlot position="middle" />
        <section className="guide-section">
          <h2>다운로드 전에 확인할 점</h2>
          {tool.checks.map((check) => (
            <p key={check}>{check}</p>
          ))}
          <p>
            수취인 이름·전화번호·주소·상품명 등 필수 항목 오류가 있는 주문은
            수정 후 출력합니다. 택배사 프로그램에서 최종 접수되는지는 해당
            프로그램에서 확인해야 합니다.
          </p>
        </section>
        <aside className="guide-note">
          <strong>현재 내장 출력은 롯데택배입니다.</strong>
          <p>
            다른 택배사의 양식을 임의로 제공하지 않습니다. 송장번호 발급이나
            집하 접수 기능은 포함되지 않습니다.
          </p>
        </aside>
        <nav className="guide-related" aria-label="관련 안내">
          <h2>작업 중 궁금한 점이 있나요?</h2>
          <Link href={tool.guide}>{tool.market} 관련 상세 안내 →</Link>
          <Link href="/help">자주 묻는 질문 →</Link>
          <Link href="/privacy">개인정보 처리 방식 →</Link>
          {conversionTools
            .filter((t) => t.slug !== slug)
            .map((t) => (
              <Link key={t.slug} href={`/tools/${t.slug}`}>
                {t.title} →
              </Link>
            ))}
        </nav>
      </article>
    </GuideShell>
  );
}
