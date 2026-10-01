import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://nshome.life"),
  title: {
    default: "쿠팡·스마트스토어·토스 주문 엑셀 롯데택배 변환 | NS Shipping",
    template: "%s | NS Shipping",
  },
  description:
    "쿠팡, 스마트스토어, 토스쇼핑 주문을 브라우저에서 안전하게 롯데택배 송장 양식으로 변환합니다.",
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
