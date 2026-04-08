# 2026-04-08 Admin Match Ops Upgrade

- scope
  - 검색 누락 인물 보강: 유재석, 성동일, 송강호 추가
  - 검색 카드의 이니셜 오버레이 제거
  - 이미지 결과 영역에서 개발자용 문구 축소
  - 사용자용 매칭 신청 카드 추가
  - 관리자 전용 `/admin.html` 운영 화면 추가
  - 상호 매칭 엑셀 다운로드 추가

- implementation
  - `data/celebrities.js`
    - 로컬 검색 보강용 인물 데이터 추가
  - `public/app.js`
    - 사용자 매칭 신청 폼, 자기 외모/성격 분위기 선택, 전화번호/동의 저장 추가
  - `public/admin.html`, `public/admin.js`
    - 관리자 로그인, 신청 목록, 수동 후보 지정, 상태/메모 관리, 엑셀 내보내기 UI 추가
  - `server.js`
    - 신청 저장 API, 관리자 인증 API, 상호 매칭 엑셀 API 추가
  - `.gitignore`
    - 런타임 신청 데이터 파일 제외

- business framing
  - user side
    - 분석 결과를 보고 직접 매칭 신청 카드 제출
  - operator side
    - 관리자 화면에서 동의 여부, 전화번호, 후보 지정, 상호 매칭 조합 관리
  - monetization angle
    - 수동 소개팅 연결, 오픈카톡 큐레이션, 운영자 개입형 프리미엄 매칭 상품으로 이어질 수 있음

- verification
  - `node --check server.js`
  - `node --check public/app.js`
  - `node --check public/admin.js`
  - 로컬 `/api/match-submissions`, `/api/admin/submissions`, `/api/admin/export-matches.xls` 응답 확인
