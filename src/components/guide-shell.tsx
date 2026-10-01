import Link from "next/link";
import { AdSlot } from "./ad-slot";
import { Package, ArrowLeft } from "lucide-react";
export function GuideShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#guide-content">
        본문으로 바로가기
      </a>
      <header className="site-header guide-header">
        <div className="header-inner">
          <Link href="/" className="brand">
            <span className="brand-icon">
              <Package size={21} />
            </span>
            <span>
              NS <strong>Shipping</strong>
            </span>
          </Link>
          <nav aria-label="안내 메뉴">
            <Link href="/tools">지원 마켓·택배사</Link>
            <Link href="/guides">사용 방법</Link>
            <Link href="/privacy">개인정보 보호</Link>
          </nav>
          <Link href="/#upload" className="guide-tool-link">
            <ArrowLeft size={16} /> 엑셀 변환
          </Link>
        </div>
      </header>
      <main id="guide-content" className="guide-main">
        {children}
        <AdSlot position="bottom" />
      </main>
      <footer className="guide-footer">
        <span>NS Shipping · 무료 주문 엑셀 변환</span>
        <Link href="/guides">사용 방법</Link>
        <Link href="/help">자주 묻는 질문</Link>
        <Link href="/about">서비스 소개</Link>
        <Link href="/privacy">개인정보 보호</Link>
        <Link href="/terms">이용 안내</Link>
        <Link href="/contact">문의</Link>
      </footer>
    </>
  );
}
