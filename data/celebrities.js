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

export const curatedPeople = [
  {
    name: "김무열",
    role: "배우",
    note: "강한 분위기와 또렷한 선이 공존하는 인상",
    appearanceTags: ["presence", "defined_features", "deep_eyes", "athletic_frame", "adult_classic"],
    personalityTags: ["grounded", "professional", "calm", "candor", "thoughtful"],
  },
  {
    name: "김강우",
    role: "배우",
    note: "선 굵은 이목구비와 묵직한 무드",
    appearanceTags: ["presence", "defined_features", "deep_eyes", "long_lines", "adult_classic"],
    personalityTags: ["grounded", "calm", "professional", "thoughtful", "sense"],
  },
  {
    name: "장기용",
    role: "배우",
    note: "긴 비율과 모델 같은 시원한 실루엣",
    appearanceTags: ["presence", "long_lines", "athletic_frame", "defined_features", "adult_classic"],
    personalityTags: ["calm", "sense", "professional", "grounded", "thoughtful"],
  },
  {
    name: "하정우",
    role: "배우",
    note: "유쾌함과 무게감이 동시에 읽히는 캐릭터",
    appearanceTags: ["presence", "defined_features", "adult_classic", "deep_eyes", "athletic_frame"],
    personalityTags: ["humor", "grounded", "candor", "professional", "comfortable"],
  },
  {
    name: "정재형",
    role: "가수",
    aliases: ["정재형 가수"],
    note: "감각과 소년성이 섞인 지적인 분위기",
    appearanceTags: ["smart_refined", "clear_clean", "adult_classic", "soft_glow", "presence"],
    personalityTags: ["sense", "taste", "professional", "humor", "warmth"],
  },
  {
    name: "정경호",
    role: "배우",
    note: "밝은 텐션과 편안한 매력이 있는 타입",
    appearanceTags: ["clear_clean", "youthful_bright", "smart_refined", "presence", "long_lines"],
    personalityTags: ["humor", "comfortable", "warmth", "playful", "grounded"],
  },
  {
    name: "조정석",
    role: "배우",
    note: "친근함과 다정함이 강한 퍼포머",
    appearanceTags: ["presence", "clear_clean", "soft_glow", "youthful_bright", "defined_features"],
    personalityTags: ["humor", "warmth", "comfortable", "thoughtful", "professional"],
  },
  {
    name: "박서준",
    role: "배우",
    note: "도회적이고 스포티한 밸런스형 인상",
    appearanceTags: ["presence", "athletic_frame", "defined_features", "adult_classic", "smart_refined"],
    personalityTags: ["comfortable", "calm", "professional", "sense", "warmth"],
  },
  {
    name: "공유",
    role: "배우",
    note: "차분하고 길게 흐르는 분위기의 대표격",
    appearanceTags: ["presence", "long_lines", "athletic_frame", "adult_classic", "soft_glow"],
    personalityTags: ["calm", "grounded", "warmth", "thoughtful", "professional"],
  },
  {
    name: "차은우",
    role: "배우 · 가수",
    note: "정제된 미남상과 맑은 인상이 강한 타입",
    appearanceTags: ["polished_pretty", "clear_clean", "smart_refined", "soft_glow", "youthful_bright"],
    personalityTags: ["calm", "sense", "professional", "comfortable", "thoughtful"],
  },
  {
    name: "한소희",
    role: "배우",
    note: "시크한 엣지와 강한 눈빛이 있는 얼굴",
    appearanceTags: ["chic_edge", "deep_eyes", "defined_features", "presence", "soft_glow"],
    personalityTags: ["grounded", "sense", "candor", "professional", "calm"],
  },
  {
    name: "아이유",
    role: "가수 · 배우",
    aliases: ["이지은"],
    note: "작고 맑은 이미지에 지적인 정돈감이 있는 편",
    appearanceTags: ["clear_clean", "soft_glow", "smart_refined", "youthful_bright", "polished_pretty"],
    personalityTags: ["warmth", "thoughtful", "professional", "taste", "intellect"],
  },
  {
    name: "송혜교",
    role: "배우",
    note: "클래식하고 정제된 아름다움의 대표형",
    appearanceTags: ["polished_pretty", "soft_glow", "adult_classic", "clear_clean", "presence"],
    personalityTags: ["calm", "grounded", "sense", "thoughtful", "professional"],
  },
  {
    name: "제니",
    role: "가수",
    note: "시크한 엣지와 럭셔리한 무드가 강한 타입",
    appearanceTags: ["chic_edge", "defined_features", "presence", "polished_pretty", "smart_refined"],
    personalityTags: ["sense", "taste", "playful", "professional", "grounded"],
  },
  {
    name: "김지원",
    role: "배우",
    note: "맑고 클래식한 인상이 균형감 있게 정리된 편",
    appearanceTags: ["clear_clean", "adult_classic", "soft_glow", "polished_pretty", "smart_refined"],
    personalityTags: ["warmth", "calm", "thoughtful", "sense", "professional"],
  },
  {
    name: "박보영",
    role: "배우",
    note: "친근하고 부드러운 에너지가 앞서는 타입",
    appearanceTags: ["soft_glow", "youthful_bright", "clear_clean", "polished_pretty", "presence"],
    personalityTags: ["warmth", "comfortable", "humor", "thoughtful", "playful"],
  },
  {
    name: "박정민",
    role: "배우",
    note: "밀도감 있는 작업형 캐릭터",
    appearanceTags: ["presence", "smart_refined", "defined_features", "adult_classic", "deep_eyes"],
    personalityTags: ["intellect", "professional", "sense", "grounded", "dry_humor"],
  },
  {
    name: "이동욱",
    role: "배우",
    note: "길고 날렵한 선과 차가운 무드가 강한 편",
    appearanceTags: ["long_lines", "deep_eyes", "chic_edge", "presence", "defined_features"],
    personalityTags: ["humor", "sense", "grounded", "calm", "comfortable"],
  },
  {
    name: "이이경",
    role: "배우",
    note: "밝은 텐션과 생활형 재치가 살아 있는 타입",
    appearanceTags: ["youthful_bright", "presence", "clear_clean", "defined_features", "athletic_frame"],
    personalityTags: ["humor", "comfortable", "playful", "warmth", "candor"],
  },
  {
    name: "송강호",
    role: "배우",
    note: "묵직한 존재감과 밀도 높은 인상이 강한 타입",
    appearanceTags: ["presence", "defined_features", "deep_eyes", "adult_classic", "long_lines"],
    personalityTags: ["grounded", "professional", "calm", "candor", "intellect"],
  },
  {
    name: "성동일",
    role: "배우",
    note: "생활감 있는 친근함과 단단한 무게감이 함께 느껴지는 타입",
    appearanceTags: ["presence", "defined_features", "adult_classic", "deep_eyes", "athletic_frame"],
    personalityTags: ["warmth", "grounded", "humor", "comfortable", "candor"],
  },
  {
    name: "유재석",
    role: "방송인",
    note: "밝고 단정한 인상에 오래 가는 신뢰감이 있는 타입",
    appearanceTags: ["clear_clean", "smart_refined", "youthful_bright", "soft_glow", "presence"],
    personalityTags: ["humor", "comfortable", "warmth", "professional", "sense"],
  },
  {
    name: "딘딘",
    role: "가수 · 방송인",
    aliases: ["임철", "딘딘 가수", "딘딘 방송인"],
    note: "재치 있는 입담과 생활형 친근함이 살아 있는 타입",
    appearanceTags: ["youthful_bright", "clear_clean", "presence", "smart_refined", "soft_glow"],
    personalityTags: ["humor", "playful", "comfortable", "candor", "sense"],
  },
  {
    name: "산들",
    role: "가수",
    aliases: ["이정환", "B1A4 산들", "산들 가수"],
    note: "맑고 부드러운 인상에 편안한 온기가 있는 타입",
    appearanceTags: ["soft_glow", "clear_clean", "youthful_bright", "smart_refined", "presence"],
    personalityTags: ["warmth", "comfortable", "humor", "thoughtful", "professional"],
  },
];

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
