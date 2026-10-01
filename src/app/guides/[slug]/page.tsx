import type { Metadata } from "next";
import { pageMetadata, breadcrumbs, SITE_URL } from "@/lib/seo/metadata";
import { StructuredData } from "@/components/structured-data";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guides } from "@/content/guides";
import { GuideShell } from "@/components/guide-shell";
export const dynamicParams = false;
export function generateStaticParams() {
  return guides.map(({ slug }) => ({ slug }));
}
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides.find((item) => item.slug === slug);
  if (!guide) notFound();
  return pageMetadata(guide.title, guide.description, `/guides/${guide.slug}`);
}
export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = guides.find((item) => item.slug === slug);
  if (!guide) notFound();
  return (
    <GuideShell>
      <article className="guide-container guide-article">
        <StructuredData
          data={[
            breadcrumbs([
              { name: "무료 엑셀 변환", path: "/" },
              { name: "사용 방법", path: "/guides" },
              { name: guide.title, path: `/guides/${slug}` },
            ]),
            {
              "@context": "https://schema.org",
              "@type": "Article",
              headline: guide.title,
              description: guide.description,
              mainEntityOfPage: `${SITE_URL}/guides/${slug}`,
              author: {
                "@type": "Organization",
                name: "NS Shipping",
                url: `${SITE_URL}/about`,
              },
              inLanguage: "ko-KR",
            },
          ]}
        />
        <nav className="guide-breadcrumb" aria-label="현재 위치">
          <Link href="/guides">사용 방법</Link>
          <span aria-hidden="true">/</span>
          <span>{guide.label}</span>
        </nav>
        <header className="guide-intro">
          <span className="small-label">{guide.label}</span>
          <h1>{guide.title}</h1>
          <p>{guide.intro}</p>
          <p className="editorial-date">
            작성·검토: NS Shipping · 현재 변환 동작 기준
          </p>
        </header>
        <nav className="guide-toc" aria-label="이 글의 목차">
          <h2>이 글에서 확인할 내용</h2>
          <ol>
            {guide.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>
                  {section.title.replace(/^\d+\. /, "")}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        {guide.sections.map((section) => (
          <section className="guide-section" id={section.id} key={section.id}>
            <h2>{section.title}</h2>
            {section.table && (
              <div
                className="guide-table-wrap"
                role="region"
                aria-label={section.table.caption}
                tabIndex={0}
              >
                <table>
                  <caption>{section.table.caption}</caption>
                  <thead>
                    <tr>
                      {section.table.headings.map((heading) => (
                        <th key={heading} scope="col">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell, i) =>
                          i === 0 ? (
                            <th scope="row" key={i}>
                              {cell}
                            </th>
                          ) : (
                            <td key={i}>{cell}</td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.steps && (
              <ol className="guide-steps">
                {section.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
          </section>
        ))}
        <aside className="guide-note">
          <strong>주문 파일은 브라우저 안에서 처리됩니다.</strong>
          <p>
            주문 데이터를 서버로 보내지 않습니다. 발송인·상품명 규칙·비밀번호
            설정은 현재 브라우저에 저장될 수 있습니다.{" "}
            <Link href="/privacy">개인정보 처리 방식 보기</Link>
          </p>
        </aside>
        <div className="guide-cta">
          <h2>이제 주문 파일을 변환해 보세요.</h2>
          <p>다른 탭에서 작업 중이라면 원래 변환 탭으로 돌아가세요.</p>
          <Link href="/#upload" className="button button-primary">
            엑셀 변환 화면 열기
          </Link>
        </div>
        <nav className="guide-related" aria-label="다른 사용 가이드">
          <h2>함께 읽으면 좋은 안내</h2>
          {guides
            .filter((item) => item.slug !== slug)
            .map((item) => (
              <Link key={item.slug} href={`/guides/${item.slug}`}>
                {item.title}
                <span aria-hidden="true"> →</span>
              </Link>
            ))}
        </nav>
      </article>
    </GuideShell>
  );
}
