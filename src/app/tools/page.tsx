import Link from "next/link";
import { GuideShell } from "@/components/guide-shell";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, breadcrumbs } from "@/lib/seo/metadata";
import { conversionTools } from "@/content/tools";
export const metadata = pageMetadata(
  "지원 마켓·택배사와 엑셀 변환 방법",
  "쿠팡·스마트스토어·토스 주문을 롯데택배 또는 내 CJ·한진·로젠·우체국 양식으로 변환하세요. 필요한 파일, 최초 설정과 지원 범위를 비교합니다.",
  "/tools",
);
export default function ToolsPage() {
  return (
    <GuideShell>
      <article className="guide-container guide-article">
        <StructuredData
          data={breadcrumbs([
            { name: "무료 엑셀 변환", path: "/" },
            { name: "지원 마켓·택배사", path: "/tools" },
          ])}
        />
        <header className="guide-intro">
          <span className="small-label">지원 마켓 · 택배사</span>
          <h1>
            내 주문 파일을
            <br />
            어떤 양식으로 바꿀까요?
          </h1>
          <p>
            쿠팡·스마트스토어·토스쇼핑 주문 .xlsx를 읽어 롯데택배 또는 사용자가
            등록한 택배사 양식으로 바꿉니다. 롯데택배는 바로 사용하고, 다른
            택배사는 실제 사용하는 양식을 처음 한 번 등록합니다.
          </p>
        </header>
        <section className="guide-section">
          <h2>택배사별 준비물과 사용 방식</h2>
          <div
            className="guide-table-wrap"
            role="region"
            aria-label="택배사 지원 비교"
            tabIndex={0}
          >
            <table>
              <caption>현재 지원하는 출력 방식</caption>
              <thead>
                <tr>
                  <th scope="col">출력 대상</th>
                  <th scope="col">준비할 파일</th>
                  <th scope="col">첫 사용 / 다음 사용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">롯데택배</th>
                  <td>마켓 주문 엑셀</td>
                  <td>기존 내장 양식 사용 · 발송인 설정 후 다운로드</td>
                </tr>
                {[
                  "CJ대한통운",
                  "한진택배",
                  "로젠택배",
                  "우체국택배",
                  "기타 / 사용자 지정",
                ].map((carrier) => (
                  <tr key={carrier}>
                    <th scope="row">{carrier}</th>
                    <td>
                      마켓 주문 엑셀 + 본인이 사용하는 빈 택배사 .xlsx 양식
                    </td>
                    <td>최초 등록·항목 연결 → 저장한 양식 선택·재사용</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            등록 방식은 택배사 이름만 바꾸는 것이 아닙니다. 사용자가 선택한
            양식의 시트 이름·열 제목·열 순서에 맞춰 주문 값을 넣습니다. 계약
            환경마다 양식이 다를 수 있어 최신 공식 양식을 앱이 대신 제공하지
            않습니다.
          </p>
        </section>
        <section className="guide-section">
          <h2>예: 쿠팡 주문을 로젠택배 양식으로 바꾸기</h2>
          <ol className="guide-steps">
            <li>위쪽 주문 파일 영역에 쿠팡 주문 엑셀을 선택합니다.</li>
            <li>
              출력 택배사에서 로젠택배를 선택한 뒤, 본인이 사용하는 로젠 양식을
              등록합니다.
            </li>
            <li>
              제목 행과 데이터 시작 행을 확인합니다. ‘수취인 이름 → 받는분’처럼
              열별로 들어갈 내용을 확인하거나 직접 선택합니다.
            </li>
            <li>
              양식에 이름을 붙여 저장하고, 실제 출력 열 순서로 표시되는
              미리보기를 확인합니다.
            </li>
            <li>
              로젠택배 엑셀을 다운로드해 택배사 프로그램에서 등록 결과를
              확인합니다.
            </li>
          </ol>
          <p>
            다음 방문에는 주문 파일을 선택하고 저장한 로젠 양식을 고르면 됩니다.
            한진·CJ·우체국도 같은 절차로 각자의 실제 양식을 등록합니다.
          </p>
          <Link
            className="guide-inline-link"
            href="/guides/custom-carrier-template"
          >
            양식 등록·수정·재사용 자세히 보기 →
          </Link>
        </section>
        <section className="guide-section">
          <h2>마켓별로 확인할 항목이 다릅니다.</h2>
          <p>
            쿠팡은 등록옵션명을 상품명에 사용합니다. 스마트스토어는 상품명과
            옵션정보를 각각 읽습니다. 토스쇼핑은 주문건수를 수량으로 사용합니다.
            같은 상품이라도 원본 열의 의미를 먼저 확인하세요.
          </p>
          <nav className="guide-related" aria-label="마켓별 출력 항목">
            {conversionTools.map((tool) => (
              <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                {tool.market} 원본과 롯데택배 출력 비교 →
              </Link>
            ))}
          </nav>
        </section>
        <section className="guide-section">
          <h2>내 양식이 지원되는지 먼저 확인하세요.</h2>
          <ul className="guide-steps">
            <li>
              주문 파일은 지원 마켓의 .xlsx 원본이며 파일당 최대 20MB입니다.
            </li>
            <li>
              사용자 택배사 양식은 암호·매크로가 없는 .xlsx, 한 주문을 한 행에
              입력하는 구조여야 합니다. 시트당 5,000행·200열 이하를 지원합니다.
            </li>
            <li>
              제목 행이나 데이터 영역에 병합 셀이 있으면 등록할 수 없습니다.
            </li>
            <li>
              양식의 제목 행 외 기존 값·수식·메모·이미지는 제거합니다. 제목 위
              안내문이나 다른 시트의 값도 비워집니다. 반복해서 넣을 운임코드
              등은 고정값으로 설정하세요.
            </li>
            <li>
              전체주소만 제공된 주문을 기본주소와 상세주소로 임의 분리하지
              않습니다.
            </li>
          </ul>
        </section>
        <section className="guide-section">
          <h2>변환과 발송 접수는 구분됩니다.</h2>
          <p>
            다운로드는 주문 파일을 정리하는 단계입니다. 송장번호 발급, 택배사
            로그인, 집하 접수는 이 사이트에서 진행하지 않습니다. 출력 건수와
            수취인·전화번호·주소·상품·수량을 확인한 뒤 계약한 택배사 시스템에
            등록하세요.
          </p>
          <p>
            파일은 브라우저에서 처리하며 주문정보를 서버로 보내지 않습니다.
            저장한 양식은 현재 브라우저에서만 재사용됩니다.
          </p>
        </section>
        <div className="guide-cta">
          <Link className="button button-primary" href="/#upload">
            내 주문 엑셀 변환하기
          </Link>
          <Link className="guide-inline-link" href="/help">
            자주 묻는 질문 →
          </Link>
        </div>
      </article>
    </GuideShell>
  );
}
