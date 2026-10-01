# 2026-10-02 검색 및 광고 수익화 준비

## 현재 구조와 보존 범위
Next.js/React 정적 배포. ExcelJS와 브라우저 암호 처리 → 마켓별 parser → NormalizedOrder → exportLotte → 로컬 다운로드. 쿠팡·스마트스토어·토스 지원. 회원/DB/주문 전송 API 없음. 기존 src/lib/excel, src/types/order.ts, src/lib/settings.ts 및 출력 18개 헤더·서식을 변경하지 않는다.

## 이번 구현 범위
사용자 요청의 SEO·GEO·AdSense 준비. 첨부 명세의 다른 택배사 등록/매핑 기능은 별도 확장 단계이며 현재 지원으로 광고하지 않는다.

## 변경 및 신설 파일
- 기존: layout/page metadata, guides 및 privacy, sitemap, guide-shell, shipping-app 링크, CSS
- 신설: 공통 metadata/JSON-LD, 마켓별 /tools 소개, /help FAQ, /about 소개·문의, /terms 이용 안내
- 신설: 콘텐츠 페이지 전용 비활성 AdSlot, 광고 활성화 운영 안내, SEO 검증

## 데이터 흐름
공개 콘텐츠 → 정적 HTML/구조화 데이터 → 검색엔진. 주문 데이터 → 기존 브라우저 메모리/변환기 → 다운로드. 두 흐름은 분리한다. 구조화 데이터에는 사용자 데이터가 들어가지 않는다. 광고 스크립트를 변환 화면이나 공통 layout에 넣지 않는다.

## 구현 순서
1. 실제 지원 기능과 매핑 확인
2. 메타데이터·구조화 데이터 공통화
3. 독립적인 마켓별 설명, FAQ, 서비스/이용 안내
4. 기존 가이드와 내비게이션 연결, sitemap
5. 광고 위치 준비(기본 비활성) 및 운영 준비사항 문서
6. 기존 테스트·정적 출력·모바일·구조화 데이터 검사
7. 기존 공개 사이트 배포, GitHub 저장

## 근거
- https://developers.google.com/search/docs/appearance/ai-features
- https://support.google.com/adsense/answer/7299563
- https://support.google.com/adsense/answer/1348695

검색 순위·AI 인용·광고 승인을 보장하지 않는다. AdSense 게시자 ID, 검색 소유권 확인값, 공개 문의처는 사용자가 제공한 값만 사용한다. llms.txt나 키워드 반복 페이지를 필수 최적화인 것처럼 추가하지 않는다.
