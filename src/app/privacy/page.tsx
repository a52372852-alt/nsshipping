import { pageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { GuideShell } from "@/components/guide-shell";
export const metadata = pageMetadata(
  "개인정보 보호와 주문 파일 처리 방식",
  "브라우저 내부 엑셀 처리, 주문 데이터 초기화, 발송인·비밀번호 저장과 공용 PC 이용 안내를 확인하세요.",
  "/privacy",
);
export default function PrivacyPage() {
  return (
    <GuideShell>
      <article className="guide-container guide-article">
        <header className="guide-intro">
          <span className="small-label">개인정보 보호</span>
          <h1>
            내 주문 파일은
            <br />내 브라우저에서 처리합니다.
          </h1>
          <p>
            엑셀을 읽고 선택한 택배사 양식으로 변환하는 과정에서 주문 파일과
            주문 데이터를 서비스 서버로 전송하거나 저장하지 않습니다.
          </p>
        </header>
        <div className="guide-callout">
          <ShieldCheck size={26} />
          <div>
            <h2>각 사용자의 작업은 각자의 브라우저에서.</h2>
            <p>
              여러 사람이 동시에 접속해도 주문 목록을 서로 공유하는 기능은
              없습니다. 원본 파일은 덮어쓰지 않으며, 변환 결과는 내 기기에 새
              파일로 내려받습니다.
            </p>
          </div>
        </div>
        <section className="guide-section">
          <h2>주문 데이터와 설정은 다르게 보관됩니다.</h2>
          <div
            className="guide-table-wrap"
            role="region"
            aria-label="항목별 처리와 보관"
            tabIndex={0}
          >
            <table>
              <caption>현재 서비스의 데이터 처리 방식</caption>
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col">처리·보관 방식</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">원본 엑셀</th>
                  <td>
                    선택한 파일을 브라우저가 읽습니다. 서버에 업로드하거나
                    원본을 수정하지 않습니다.
                  </td>
                </tr>
                <tr>
                  <th scope="row">주문 목록·수정 내용</th>
                  <td>
                    현재 변환 화면의 메모리에서 처리합니다. 새 작업, 새로고침,
                    해당 페이지를 떠나거나 탭을 닫으면 작업 내용이 사라질 수
                    있습니다.
                  </td>
                </tr>
                <tr>
                  <th scope="row">발송인·상품명 규칙</th>
                  <td>
                    설정 저장 시 해당 브라우저의 사이트 저장소에 보관됩니다.
                    발송인의 전화번호·주소가 포함될 수 있습니다.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Excel 비밀번호</th>
                  <td>
                    암호 해제는 브라우저 안에서 수행합니다. 저장한 비밀번호는
                    다음 사용을 위해 해당 브라우저에 보관됩니다.
                  </td>
                </tr>
                <tr>
                  <th scope="row">화면·프로그램 파일</th>
                  <td>
                    빠른 새로고침을 위해 공개 화면과 프로그램 파일을 브라우저에
                    보관합니다. 이 캐시에는 업로드한 주문 엑셀이나 고객정보가
                    포함되지 않으며, 서비스 업데이트에 맞춰 갱신됩니다.
                  </td>
                </tr>
                <tr>
                  <th scope="row">다운로드한 파일</th>
                  <td>
                    기기의 다운로드 위치에 남습니다. 새 작업이나 사이트 데이터
                    삭제로 지워지지 않습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section className="guide-section">
          <h2>공용 컴퓨터에서는 이렇게 마무리하세요.</h2>
          <ol className="guide-steps">
            <li>
              필요한 결과를 다운로드하고 파일 내용과 저장 위치를 확인합니다.
            </li>
            <li>
              변환 화면의 ‘새 작업’에서 ‘새 작업 시작’을 눌러 주문과 수정 내용을
              초기화하거나 작업 탭을 닫습니다.
            </li>
            <li>
              저장된 설정까지 지우려면 브라우저 설정에서 nshome.life의 사이트
              데이터를 삭제합니다. ‘새 작업’이나 새로고침만으로는 발송인·상품명
              규칙·비밀번호가 삭제되지 않습니다.
            </li>
            <li>
              기기에 남은 원본과 다운로드 파일도 직접 정리합니다. 공동 사용자는
              별도의 브라우저 프로필을 사용하는 것이 좋습니다.
            </li>
          </ol>
          <p>
            같은 브라우저 프로필을 쓰는 사람은 저장된 설정에 접근할 수 있습니다.
            브라우저 저장소는 별도의 암호 보관함이 아닙니다. 설정은 다른
            컴퓨터나 브라우저에 서비스 계정으로 동기화되지 않습니다.
          </p>
        </section>
        <section className="guide-section">
          <h2>사이트 접속에는 인터넷 연결이 필요합니다.</h2>
          <p>
            화면과 변환에 필요한 프로그램을 불러오는 요청은 발생합니다. 호스팅
            제공자가 IP 주소 등 일반 접속 정보를 처리할 수 있습니다. 이는 앱이
            주문 엑셀과 그 내용을 서버로 전송하는 동작과 구분됩니다.
          </p>
        </section>
        <section className="guide-section">
          <h2>광고와 방문 통계</h2>
          <p>현재 광고 및 외부 방문 분석 도구를 사용하지 않습니다.</p>
        </section>
        <section className="guide-section">
          <h2>등록한 택배사 양식은 어떻게 보관하나요?</h2>
          <p>
            저장을 선택하면 제목 행·시트 이름·서식·항목 연결·직접 입력한
            고정값을 이 브라우저의 저장소에 보관합니다. 원본 파일과 기존 주문
            행은 저장하지 않습니다. 제목 행 이외 셀 값·수식·메모·이미지는
            제거됩니다. 제목·양식 이름·고정값에 고객 개인정보를 넣지 마세요.
            등록 양식 삭제 또는 사이트 데이터 삭제로 보관된 양식을 지울 수
            있습니다.
          </p>
        </section>
        <section className="guide-section">
          <h2>개인정보 관련 문의</h2>
          <p>
            문의 주소는{" "}
            <a href="mailto:marine485@gmail.com">marine485@gmail.com</a>입니다.
            이메일로 자발적으로 보내는 문의는 브라우저 내부 엑셀 처리와 별개로
            메일 서비스를 통해 전달됩니다. 원본 주문 파일과 고객 개인정보는
            첨부하지 마세요.
          </p>
          <Link href="/contact">문의 방법 자세히 보기 →</Link>
        </section>
        <div className="guide-cta">
          <Link href="/#upload" className="button button-primary">
            무료로 엑셀 변환하기
          </Link>
          <Link className="guide-inline-link" href="/guides">
            사용 방법 보기 →
          </Link>
        </div>
      </article>
    </GuideShell>
  );
}
