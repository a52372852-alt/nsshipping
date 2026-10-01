# 실제 샘플 (로컬 전용)

제공된 네 파일을 이름만 바꾸어 복사했습니다.

- `coupang.xlsx`: 쿠팡택배양식.xlsx
- `smartstore.xlsx`: 스마트스토어_선택주문발주발송관리_20260929_1418.xlsx
- `toss.xlsx`: 주문배송관리-상품준비중-2026-08-29-2026-09-29.xlsx
- `lotte-template.xlsx`: 롯데택배양식01.xlsx

원본 파일에 개인정보가 포함되어 있으므로 `.gitignore`에서 제외하며 `public/`에 두지 않습니다. 배포 시 샘플과 outputs는 복사하지 않습니다. 원본 샘플의 기존 발송인 전화번호는 앱 기본값으로 사용하지 않습니다.

`expected.json`은 Python 표준 XML 라이브러리로 독립 추출한 비공개 테스트 기대값입니다. 새 환경에서는 위 네 샘플을 이 폴더에 배치하고 `python3 scripts/extract-expected.py`를 실행하세요.

- `smartstore-encrypted.xlsx`: 추가 제공된 전체주문 20260929_2213 파일. 0000으로 열리는 발주발송관리 1건. 원본의 암호를 유지한 로컬 테스트 파일입니다.
