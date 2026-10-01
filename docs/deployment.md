# NS Shipping 배포

- Site ID: appgprj_6abc9a35ea1081918215ea3eb288175c
- 기본 주소: https://nshome-shipping.a52372852.chatgpt.site
- 도메인: nshome.life
- 소스 커밋: 25f9d2c6955d0fa8777a71b8ab2d22408cca48a5
- 2026-10-01 버전 2 배포 성공: 개인정보 안내, 사용 방법 4개, 검색 기본 설정 추가. 롯데택배 변환 및 출력 양식 유지.
- 배포용 체크아웃: /tmp/nshome-site-deploy (임시 경로; 원본 앱 소스는 작업공간에 유지)
- 배포는 Next.js output: export로 생성한 out 디렉터리 사용. 원본의 로컬 실행 설정은 유지.
- 주문 Excel, samples, outputs는 원격 소스와 배포 파일에 포함하지 않음.
- 기존 Site ID를 재사용하고 원격 소스를 복원한 후 수정/배포할 것.
- 접근 설정은 공개(public). 사용자 요청에 따라 2026-09-30 로그인 없이 누구나 접속하도록 변경.

## 도메인 설정

호스팅케이알 DNS에 A 레코드 @ → 162.159.143.30 및 172.66.3.26, 사이트 인증 TXT 기록 2개 등록 완료.
도메인 ID: appgdom_6abc9af8eb58819199091261a495c265
2026-09-30 DNS 조회 및 HTTPS 인증서 active 확인.
