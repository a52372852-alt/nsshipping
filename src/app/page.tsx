import ShippingApp from "@/components/shipping-app";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, SITE_URL } from "@/lib/seo/metadata";
export const metadata = pageMetadata(
  "무료 택배 엑셀 변환 | 롯데·CJ·한진·로젠·우체국",
  "쿠팡·스마트스토어·토스 주문을 롯데택배 또는 직접 등록한 CJ·한진·로젠·우체국 양식으로 무료 변환하세요. 회원가입 없이 브라우저에서 처리하며 주문 파일을 서버에 전송하지 않습니다.",
  "/",
);
export default function Page() {
  return (
    <>
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: "NS Shipping",
            alternateName: "NS Shipping Converter",
            url: SITE_URL,
            inLanguage: "ko-KR",
          },
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": `${SITE_URL}/#converter`,
            name: "NS Shipping 주문 엑셀 변환",
            url: SITE_URL,
            applicationCategory: "BusinessApplication",
            operatingSystem: "웹 브라우저",
            browserRequirements: "JavaScript 사용",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
            description:
              "쿠팡·스마트스토어·토스쇼핑 주문 엑셀을 브라우저에서 롯데택배 또는 직접 등록한 택배사 양식으로 변환합니다.",
            featureList: [
              "회원가입 없이 무료 변환",
              "브라우저 내부 파일 처리",
              "롯데택배 엑셀 다운로드",
              "사용자 택배사 양식 등록·항목 연결·다운로드",
            ],
            inLanguage: "ko-KR",
          },
        ]}
      />
      <ShippingApp />
    </>
  );
}
