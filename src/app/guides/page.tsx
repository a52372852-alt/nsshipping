import { pageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { guides } from "@/content/guides";
import { GuideShell } from "@/components/guide-shell";
export const metadata = pageMetadata(
  "주문 엑셀 변환 사용 방법",
  "스마트스토어·쿠팡 주문 엑셀 변환, 암호 파일 열기, 오류·중복 확인 방법을 안내합니다. 무료로 롯데택배 양식으로 변환하세요.",
  "/guides",
);
export default function GuidesPage() {
  return (
    <GuideShell>
      <div className="guide-container">
        <header className="guide-intro">
          <span className="small-label">사용 방법</span>
          <h1>
            처음부터 다운로드까지,
            <br />
            필요한 단계만 찾아보세요.
          </h1>
          <p>
            마켓별 주문 파일과 오류 처리 방법을 안내합니다.
            <br />
            앱의 실제 변환 방식에 맞춰 정리했습니다.
          </p>
        </header>
        <div className="guide-grid">
          {guides.map((guide, index) => (
            <Link
              href={`/guides/${guide.slug}`}
              className="guide-card"
              key={guide.slug}
            >
              <span className="guide-card-top">
                <span>{guide.label}</span>
                <span>0{index + 1}</span>
              </span>
              <h2>{guide.title}</h2>
              <p>{guide.description}</p>
              <span className="guide-card-bottom">
                안내 읽기 <ArrowUpRight size={18} />
              </span>
            </Link>
          ))}
        </div>
        <aside className="guide-callout">
          <ShieldCheck size={24} />
          <div>
            <h2>주문 파일은 내 브라우저에서 처리됩니다.</h2>
            <p>
              파일과 주문 데이터를 서버로 전송하거나 저장하지 않습니다. 저장되는
              설정과 공용 PC 이용 방법도 확인하세요.
            </p>
            <Link href="/privacy">개인정보 처리 방식 자세히 보기 →</Link>
          </div>
        </aside>
        <div className="guide-cta">
          <h2>준비되셨나요?</h2>
          <p>가입이나 설치 없이 주문 파일을 변환할 수 있습니다.</p>
          <Link className="button button-primary" href="/#upload">
            무료로 엑셀 변환하기
          </Link>
        </div>
      </div>
    </GuideShell>
  );
}
