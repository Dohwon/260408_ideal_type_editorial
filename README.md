# Ideal Type Editorial

3명에서 10명의 이름만 고르면 외적 공통점과 성격 공통점을 에디토리얼 톤으로 정리해 주는 웹 앱이다.

## 핵심 기능

- 외적 이상형 / 성격 이상형을 별도 탭으로 분리
- 추천 인물 카드 기반 즉시 체험
- `OPENAI_API_KEY`가 있으면 임의 인물 이름도 분석
- 각 결과를 `짧게`, `자연스럽게`, `조금 더 풀어서` 3가지 문장으로 복사 가능
- 외적 결과 + 성격 결과를 합친 최종 종합 결과 생성

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
  - 기본값: `gpt-5-mini`
- `OPENAI_IMAGE_MODEL`
  - 기본값: `gpt-image-1.5`

## OpenAI 구현 메모

- 공식 Responses API 사용
- JSON mode: `text.format = { "type": "json_object" }`
- 서버 `fetch` 기반 구현이라 별도 SDK 의존성 없음
- 최종 포트레이트는 `/v1/images/generations`로 생성
- 기본 설정: `gpt-image-1.5`, `1024x1536`, `quality=high`, `png`

## 배포

Railway 한 서비스로 바로 배포 가능하다.

- Start command: `npm start`
- Health check: `/health`
- Optional Variables:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
