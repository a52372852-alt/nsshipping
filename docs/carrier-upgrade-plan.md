# 사용자 택배사 양식 변환 — 2026-10-02

## 분석
현재 마켓별 parser → NormalizedOrder → exportLotte 구조가 이미 있다. ExcelJS를 쓰며 파일/주문은 메모리, 설정은 브라우저 저장소, 배포는 정적 Sites다. 22db34b와 비교한 기존 Excel 코드와 모델은 동일하다. 기존 롯데 exporter/18개 헤더/서식/상품명 규칙은 변경하지 않는다.

## 구현
- 기존 변경: shipping-app에 택배사 선택 및 사용자 양식 출력 분기, conversion-actions 표시 문구/준비 조건, 안내 콘텐츠
- 신규: templates/types, matching, workbook, storage, 사용자 양식 설정/미리보기 컴포넌트
- 흐름: 주문 파일 → 기존 parser/공통 모델 → 롯데 exporter 그대로 또는 사용자 양식 exporter → 다운로드
- 롯데는 기본 선택이며 최초 설정 추가 없음.
- 다른 택배사는 사용자 실제 .xlsx를 읽어 시트/제목 행/데이터 시작 행을 선택. 열 위치 기반 연결로 중복 제목도 보존. 확인되지 않은 열은 자동 연결하지 않음.
- 이름을 붙여 택배사별 복수 설정을 IndexedDB에 저장. 주문 데이터/원본 파일은 저장하지 않고 정제한 양식과 연결만 저장.
- 개인정보 제거: 시트 이름/열 너비/행 높이/서식/안전한 병합/선택한 제목 행 유지. 기타 셀 값·수식·주석·이미지·숨은 메타데이터는 저장/출력하지 않음. 원본은 수정하지 않음. 지원 제한은 등록 시 안내.
- 등록 양식 구조 변경 시 명시적으로 확인한 후 새 연결 적용. 기존 양식은 취소로 유지.

## 순서
엔진/저장 → 등록 및 항목 연결 UI → 출력 분기/미리보기 → 안내 갱신 → 합성 양식 단위·브라우저 검사 및 기존 롯데 회귀 비교 → 정적 배포/GitHub 저장.

Implementation note: optional addressBase/addressDetail fields were added to the common model for split-address user templates. Existing Lotte full-address/export behavior remains unchanged. All 38 unit/integration checks and 10 browser scenarios passed.
