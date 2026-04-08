export { curatedPeople } from "./celebrity-seed.js";

export const appearanceTagMeta = {
  presence: {
    label: "분위기 있는 얼굴",
    descriptor: "예쁘다기보다 무드와 아우라가 먼저 들어오는 타입",
  },
  defined_features: {
    label: "선 굵은 이목구비",
    descriptor: "얼굴 구조와 이목구비 윤곽이 비교적 또렷한 편",
  },
  deep_eyes: {
    label: "깊은 눈빛",
    descriptor: "눈매에서 밀도와 집중감이 느껴지는 편",
  },
  long_lines: {
    label: "길고 시원한 얼굴선",
    descriptor: "세로 비율이 길고 답답하지 않은 실루엣",
  },
  athletic_frame: {
    label: "길쭉하고 탄탄한 피지컬",
    descriptor: "마르기만 하기보다 균형 잡힌 피지컬에 가까운 편",
  },
  adult_classic: {
    label: "도회적이고 어른스러운 무드",
    descriptor: "정장, 셔츠, 코트처럼 클래식한 룩이 잘 어울리는 인상",
  },
  polished_pretty: {
    label: "정제된 미남/미인상",
    descriptor: "과한 포인트보다 깔끔하게 정리된 조화가 먼저 보이는 타입",
  },
  soft_glow: {
    label: "부드러운 광택감",
    descriptor: "표정선이 부드럽고 피부 톤과 인상이 맑게 읽히는 편",
  },
  chic_edge: {
    label: "시크한 엣지",
    descriptor: "차갑고 세련된 결이 함께 느껴지는 타입",
  },
  clear_clean: {
    label: "맑고 깨끗한 인상",
    descriptor: "전체 인상이 군더더기 없이 정돈돼 보이는 편",
  },
  youthful_bright: {
    label: "청량한 생기",
    descriptor: "가볍지 않은 선에서 산뜻한 에너지가 도는 인상",
  },
  smart_refined: {
    label: "스마트한 정제감",
    descriptor: "지적인 정돈감이 느껴지는 인상",
  },
};

export const personalityTagMeta = {
  humor: {
    label: "유머감각",
    descriptor: "대화의 텐션을 살리면서도 억지스럽지 않은 재치",
  },
  warmth: {
    label: "온기와 다정함",
    descriptor: "사람을 편하게 만드는 기본적인 따뜻함",
  },
  grounded: {
    label: "무게감",
    descriptor: "가볍게 소비되지 않는 중심과 안정감",
  },
  sense: {
    label: "센스",
    descriptor: "말, 취향, 타이밍에서 느껴지는 감각",
  },
  professional: {
    label: "자기 일 잘함",
    descriptor: "일과 결과물 앞에서 집중도와 완성도가 높은 타입",
  },
  comfortable: {
    label: "편안한 사회성",
    descriptor: "주변 사람을 긴장시키지 않는 자연스러운 친화력",
  },
  playful: {
    label: "장난기",
    descriptor: "분위기를 가볍게 풀어내는 유연한 장난기",
  },
  thoughtful: {
    label: "사려 깊음",
    descriptor: "상대의 결을 읽고 배려하는 쪽의 성향",
  },
  taste: {
    label: "취향의 결",
    descriptor: "감각과 취향이 생활 전반에 스며 있는 타입",
  },
  intellect: {
    label: "지적 밀도",
    descriptor: "말과 작업 태도에서 생각의 깊이가 느껴지는 편",
  },
  dry_humor: {
    label: "드라이한 유머",
    descriptor: "크게 들뜨지 않으면서 툭 던지는 식의 재치",
  },
  candor: {
    label: "솔직함",
    descriptor: "꾸미지 않은 진짜 톤이 남아 있는 편",
  },
  calm: {
    label: "차분함",
    descriptor: "템포는 안정적이지만 결코 무기력하지 않은 타입",
  },
};

export const examplePacks = {
  appearance: {
    label: "사용자 예시 채우기",
    names: ["김무열", "김강우", "장기용"],
  },
  personality: {
    label: "사용자 예시 채우기",
    names: ["하정우", "정재형", "정경호", "조정석"],
  },
};
