# 2026-04-08 Matching MVP Upgrade

- scope
  - 네이버 인물 검색 품질 보정
  - Search Results / Selected Names 시각적 분리
  - 분석 결과 하단의 다음 단계 유도 강화
  - 최종 이미지 이후 수동 소개팅 운영용 `Curator Match Pack` 추가

- implementation
  - `server.js`
    - 네이버 검색 후보를 이름 기준으로 더 엄격하게 필터링
    - 네이버 이미지 검색 썸네일을 역할 힌트와 함께 조회
    - `/api/match-pack` 추가
    - 로컬/OpenAI 매칭 카드 생성 로직 추가
  - `public/app.js`
    - 선택 목록을 숫자형 리스트로 재구성
    - 두 카테고리 분석 완료 시 최종 종합 자동 생성
    - 이미지 생성 단계와 매칭 카드 단계 연결
  - `public/styles.css`
    - 선택 목록, 다음 단계 패널, 매칭 카드 UI 스타일 추가

- business framing
  - free
    - 이상형 분석 결과, 최종 한 줄, 이미지 생성
  - operator monetization
    - 생성된 결과와 매칭 카드를 기반으로 오픈카톡 운영, 수동 소개팅 제안, 큐레이터 메모 작성
  - next hypothesis
    - 소개 요청 건당 유료화 또는 월 구독형 큐레이션 전환 가능성 검증

- verification
  - `node --check server.js`
  - `node --check public/app.js`
  - `curl -sS http://127.0.0.1:3010/api/search-people?...`
  - `curl -sS -X POST http://127.0.0.1:3010/api/analyze ...`
  - `curl -sS -X POST http://127.0.0.1:3010/api/match-pack ...`
