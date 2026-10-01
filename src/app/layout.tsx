import type { Metadata } from "next";
import "./globals.css";
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
      <body>{children}</body>
    </html>
  );
}
