import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import "./globals.css";
import { FastReload } from "@/components/fast-reload";
const releaseVersion = readFileSync(join(process.cwd(), "VERSION"), "utf8").trim();
const releaseDate = readFileSync(join(process.cwd(), "RELEASE_DATE"), "utf8").trim();

export const metadata: Metadata = {
  metadataBase: new URL("https://nshome.life"),
  title: {
    default: "무료 택배 엑셀 변환 | NS Shipping",
    template: "%s | NS Shipping",
  },
  description:
    "쿠팡·스마트스토어·토스 주문을 롯데택배 또는 직접 등록한 택배사 엑셀로 무료 변환합니다. 파일은 브라우저에서 처리합니다.",
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <div className="site-version" aria-label="사이트 버전">
          v{releaseVersion} · {releaseDate.replaceAll("-", ".")}
        </div>
        <FastReload />
      </body>
    </html>
  );
}
