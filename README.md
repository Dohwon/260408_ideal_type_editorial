# Ideal Type Editorial

3명에서 10명의 이름만 고르면 외적 공통점과 성격 공통점을 에디토리얼 톤으로 정리하고, 최종 이상형 이미지와 수동 소개팅 운영용 매칭 카드까지 만드는 웹 앱이다.

## 핵심 기능

- 외적 이상형 / 성격 이상형을 별도 탭으로 분리
- 네이버 검색 기반 인물 후보 검색과 썸네일 프리뷰
- 검색 결과와 선택 목록을 분리한 단계형 Selection Studio
- 외모, 피지컬 무드, 대중적 인상 기준의 공통점 분석
- 외적 결과 + 성격 결과를 자동 종합한 최종 이상형 문장 생성
- 분석 결과를 바탕으로 한 실사형 이상형 이미지 생성
- 오픈카톡/수동 소개팅 운영용 `Curator Match Pack` 생성

## 실행

```bash
npm start
```

기본 포트는 `3000`이고, Railway에서는 `PORT` 환경변수를 자동 사용한다.

## 환경변수

- `OPENAI_API_KEY`
  - 있으면 OpenAI Responses API로 임의 인물 이름까지 분석
  - 없으면 추천 카드 조합에 한해 로컬 데모 분석 동작
  - 최종 종합 단계의 사실적 포트레이트 생성도 이 키가 필요
- `OPENAI_MODEL`
  - 기본값: `gpt-4o-mini`
- `OPENAI_IMAGE_MODEL`
  - 기본값: `gpt-image-1.5`
- `NAVER_SEARCH_CLIENT_ID`
- `NAVER_SEARCH_CLIENT_SECRET`
  - 둘 다 있으면 검색창에서 네이버 이미지 검색 썸네일 프리뷰 사용
  - 없으면 로컬 후보 검색만 동작

## OpenAI 구현 메모

- 공식 Responses API 사용
- Structured Outputs: `text.format = { "type": "json_schema", ... }`
- 서버 `fetch` 기반 구현이라 별도 SDK 의존성 없음
- 최종 포트레이트는 `/v1/images/generations`로 생성
- 기본 설정: `gpt-image-1.5`, `1024x1536`, `quality=high`, `png`
- 인물 검색 프리뷰는 네이버 이미지 검색 API를 사용

## MVP 수익화 가설

- 무료: 이상형 분석 + 최종 문장 + 이미지 생성
- 운영형 유료화: `Curator Match Pack`을 기반으로 수동 소개팅 연결 또는 오픈카톡 큐레이션
- 확장형 유료화: 개인 맞춤 소개 요청, 프리미엄 큐레이션, 후기 기반 신뢰 점수 운영

## 배포

Railway 한 서비스로 바로 배포 가능하다.

- Start command: `npm start`
- Health check: `/health`
- Optional Variables:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
