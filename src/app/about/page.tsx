import Link from "next/link";
import { GuideShell } from "@/components/guide-shell";
import { pageMetadata } from "@/lib/seo/metadata";
export const metadata = pageMetadata(
  "서비스 소개와 지원 범위",
  "NS Shipping은 온라인 판매자의 주문 엑셀을 브라우저에서 롯데택배 또는 직접 등록한 택배사 양식으로 정리하는 무료 도구입니다. 운영 방향과 지원 범위를 안내합니다.",
  "/about",
);
export default function AboutPage() {
  return (
    <GuideShell>
      <article className="guide-container guide-article">
        <header className="guide-intro">
          <span className="small-label">서비스 소개</span>
          <h1>
            반복되는 주문 정리를
            <br />
            조금 더 간단하게.
          </h1>
          <p>
            NS Shipping은 온라인 판매자가 마켓별 주문 파일을 롯데택배 또는 직접
            등록한 택배사 엑셀로 정리할 수 있도록 만든 무료 웹 도구입니다.
          </p>
        </header>
        <section className="guide-section">
          <h2>무엇을 도와주나요?</h2>
          <p>
            쿠팡·스마트스토어·토스쇼핑의 지원 주문 양식을 읽고,
            수취인·주소·상품·수량을 공통 주문 표에서 확인할 수 있게 합니다.
            사용자가 검토한 주문은 선택한 택배사 양식으로 내려받습니다.
          </p>
          <p>
            마켓과 택배사 사이에 반복해서 복사하는 일을 줄이려는 도구이며, 각
            회사의 공식 서비스나 제휴 서비스로 표시하지 않습니다. 상표와
            서비스명은 지원 대상 설명을 위해 사용합니다.
          </p>
        </section>
        <section className="guide-section">
          <h2>파일은 사용자의 기기에서 처리합니다.</h2>
          <p>
            회원가입이나 결제 없이 이용할 수 있습니다. 주문 파일을 서비스 서버에
            올리지 않고 사용자의 브라우저에서 읽고 변환합니다. 주문 내역은 다른
            사용자와 공유되지 않습니다.
          </p>
          <Link href="/privacy" className="guide-inline-link">
            설정 보관과 개인정보 안내 →
          </Link>
        </section>
        <section className="guide-section">
          <h2>현재 지원하는 범위</h2>
          <p>
            입력은 쿠팡·스마트스토어·토스쇼핑의 인식 가능한 .xlsx 주문 파일,
            출력은 기존 롯데택배 양식과 사용자가 등록한 택배사 양식입니다.
            CJ·한진·로젠·우체국·기타 택배사는 본인의 실제 양식을 등록해
            변환합니다. 송장번호 발급·택배사 로그인·집하 접수는 제공하지
            않습니다.
          </p>
          <p>
            마켓의 엑셀 양식이 바뀌면 파일이 인식되지 않거나 항목이 누락될 수
            있습니다. 원본과 다운로드 결과를 비교하고, 최종 등록은 계약한 택배사
            프로그램에서 확인하세요.
          </p>
        </section>
        <section className="guide-section">
          <h2>콘텐츠와 운영 방향</h2>
          <p>
            안내 문서는 현재 앱의 변환 동작과 확인한 원본 헤더를 기준으로
            작성합니다. 예시는 설명용 가상 값이며 실제 구매자의 주문 정보를
            공개하지 않습니다.
          </p>
          <p>
            변환 기능은 무료입니다. 지원 범위와 파일 처리 방식은 이 안내와 사용
            방법에서 확인할 수 있습니다.
          </p>
        </section>
        <section className="guide-section">
          <h2>이용 중 문제가 있다면</h2>
          <p>
            먼저 자주 묻는 질문과 오류 안내에서 지원 형식, 비밀번호, 필수 항목을
            확인하세요. 서비스 문의는 marine485@gmail.com으로 보내실 수
            있습니다. 고객 이름·주소·전화번호가 담긴 원본 주문 파일을 공개
            게시판에 올리지 마세요.
          </p>
          <Link href="/contact" className="guide-inline-link">
            문의 방법 보기 →
          </Link>
          <br />
          <Link href="/help" className="guide-inline-link">
            자주 묻는 질문 →
          </Link>
          <br />
          <Link
            href="/guides/errors-and-duplicates"
            className="guide-inline-link"
          >
            오류와 중복 확인 방법 →
          </Link>
        </section>
      </article>
    </GuideShell>
  );
}
