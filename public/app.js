const state = {
  catalog: [],
  examplePacks: {},
  supportsCustomAnalysis: false,
  supportsImageGeneration: false,
  supportsNaverSearch: false,
  currentTab: "appearance",
  search: "",
  searchResults: [],
  customName: "",
  selections: {
    appearance: [],
    personality: [],
  },
  results: {
    appearance: null,
    personality: null,
  },
  synthesis: null,
  loading: {
    appearance: false,
    personality: false,
    synthesis: false,
    image: false,
    search: false,
  },
  portrait: null,
  toast: "",
};

const accentPairs = [
  ["#4e312b", "#d18b78"],
  ["#7e4a44", "#f0b8ab"],
  ["#3c4656", "#89a9c4"],
  ["#64405e", "#d4a8ce"],
  ["#5c533f", "#d9c28a"],
  ["#2d5a56", "#83c5bb"],
  ["#72413b", "#f3c6bf"],
  ["#46536d", "#a9b9dd"],
];

const app = document.querySelector("#app");

function getCurrentSelection() {
  return state.selections[state.currentTab];
}

function saveState() {
  localStorage.setItem(
    "ideal-type-editorial-state",
    JSON.stringify({
      currentTab: state.currentTab,
      selections: state.selections,
      results: state.results,
      synthesis: state.synthesis,
    })
  );
}

function loadState() {
  try {
    const raw = localStorage.getItem("ideal-type-editorial-state");
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed.currentTab) {
      state.currentTab = parsed.currentTab;
    }
    if (parsed.selections) {
      state.selections = parsed.selections;
    }
    if (parsed.results) {
      state.results = parsed.results;
    }
    if (parsed.synthesis) {
      state.synthesis = parsed.synthesis;
    }
  } catch {
    localStorage.removeItem("ideal-type-editorial-state");
  }
}

function setToast(message) {
  state.toast = message;
  render();
  if (!message) {
    return;
  }
  clearTimeout(setToast.timeoutId);
  setToast.timeoutId = setTimeout(() => {
    state.toast = "";
    render();
  }, 2600);
}

function initialsFromName(name) {
  const chars = [...name.replace(/\s+/g, "")];
  return (chars[0] || "") + (chars[chars.length - 1] || "");
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getPortraitStyle(name) {
  const [from, to] = accentPairs[hashString(name) % accentPairs.length];
  return `--portrait-gradient: linear-gradient(135deg, ${from}, ${to});`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function filteredPeople() {
  const selection = getCurrentSelection();
  return [...state.searchResults].sort(
    (a, b) => Number(selection.includes(b.selectionName || b.name)) - Number(selection.includes(a.selectionName || a.name))
  );
}

function selectionCountText() {
  const count = getCurrentSelection().length;
  return `${count}명 선택됨`;
}

function resetCurrentTab() {
  state.selections[state.currentTab] = [];
  state.results[state.currentTab] = null;
  state.synthesis = null;
  state.portrait = null;
  saveState();
  render();
}

function addNameToCurrentTab(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }
  const current = getCurrentSelection();
  if (current.length >= 10) {
    setToast("최대 10명까지만 넣을 수 있습니다.");
    return;
  }
  if (current.some((value) => value.replace(/\s+/g, "") === trimmed.replace(/\s+/g, ""))) {
    setToast("이미 추가된 이름입니다.");
    return;
  }
  current.push(trimmed);
  state.results[state.currentTab] = null;
  state.synthesis = null;
  state.portrait = null;
  state.customName = "";
  saveState();
  render();
}

function togglePerson(name) {
  const current = getCurrentSelection();
  const index = current.indexOf(name);
  if (index >= 0) {
    current.splice(index, 1);
  } else {
    if (current.length >= 10) {
      setToast("최대 10명까지만 넣을 수 있습니다.");
      return;
    }
    current.push(name);
  }
  state.results[state.currentTab] = null;
  state.synthesis = null;
  state.portrait = null;
  saveState();
  render();
}

async function fetchSearchResults(query) {
  const trimmed = query.trim();
  if (!trimmed) {
    state.searchResults = [];
    state.loading.search = false;
    render();
    return;
  }

  state.loading.search = true;
  render();
  try {
    const response = await fetch(
      `/api/search-people?query=${encodeURIComponent(trimmed)}&category=${encodeURIComponent(state.currentTab)}`
    );
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "검색에 실패했습니다.");
    }
    if (state.search.trim() !== trimmed) {
      return;
    }
    state.searchResults = result.results || [];
  } catch (error) {
    if (state.search.trim() === trimmed) {
      state.searchResults = [];
      setToast(error.message);
    }
  } finally {
    if (state.search.trim() === trimmed) {
      state.loading.search = false;
      render();
    }
  }
}

function removeFromCurrent(name) {
  const current = getCurrentSelection();
  state.selections[state.currentTab] = current.filter((value) => value !== name);
  state.results[state.currentTab] = null;
  state.synthesis = null;
  state.portrait = null;
  saveState();
  render();
}

async function analyzeCurrentTab() {
  const names = getCurrentSelection();
  if (names.length < 3 || names.length > 10) {
    setToast("분석은 3명 이상 10명 이하에서만 가능합니다.");
    return;
  }
  state.loading[state.currentTab] = true;
  render();
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: state.currentTab,
        names,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "분석에 실패했습니다.");
    }
    state.results[state.currentTab] = result;
    state.synthesis = null;
    state.portrait = null;
    saveState();
    render();
  } catch (error) {
    setToast(error.message);
  } finally {
    state.loading[state.currentTab] = false;
    render();
  }
}

async function synthesizeResults() {
  if (!state.results.appearance || !state.results.personality) {
    setToast("외적 결과와 성격 결과를 먼저 둘 다 만들어 주세요.");
    return;
  }
  state.loading.synthesis = true;
  render();
  try {
    const response = await fetch("/api/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appearanceResult: state.results.appearance,
        personalityResult: state.results.personality,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "종합 결과 생성에 실패했습니다.");
    }
    state.synthesis = result;
    state.portrait = null;
    saveState();
    render();
  } catch (error) {
    setToast(error.message);
  } finally {
    state.loading.synthesis = false;
    render();
  }
}

async function generatePortrait() {
  if (!state.synthesis || !state.results.appearance || !state.results.personality) {
    setToast("최종 종합 결과를 먼저 만들어 주세요.");
    return;
  }
  if (!state.supportsImageGeneration) {
    setToast("이미지 생성은 서버에 OPENAI_API_KEY가 연결된 상태에서만 가능합니다.");
    return;
  }
  state.loading.image = true;
  render();
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        synthesisResult: state.synthesis,
        appearanceResult: state.results.appearance,
        personalityResult: state.results.personality,
        selections: state.selections,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "이미지 생성에 실패했습니다.");
    }
    state.portrait = result;
    render();
  } catch (error) {
    setToast(error.message);
  } finally {
    state.loading.image = false;
    render();
  }
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    setToast("복사했습니다.");
  } catch {
    setToast("복사에 실패했습니다.");
  }
}

function renderSelectedChips() {
  const current = getCurrentSelection();
  if (current.length === 0) {
    return `<div class="empty-state">이름을 아직 고르지 않았습니다. 카드에서 고르거나 직접 입력해 보세요.</div>`;
  }
  return `<div class="selected-wrap">
    ${current
      .map(
        (name) => `<div class="selected-chip">
          <span>${escapeHtml(name)}</span>
          <button type="button" data-action="remove" data-name="${escapeHtml(name)}">×</button>
        </div>`
      )
      .join("")}
  </div>`;
}

function renderPeopleCards() {
  const people = filteredPeople();
  if (!state.search.trim()) {
    return `<div class="empty-state">이름을 검색하면 후보가 뜹니다. 미리 사람을 펼쳐두지 않고, 검색했을 때만 보여주도록 바꿨습니다.</div>`;
  }
  if (state.loading.search) {
    return `<div class="empty-state">검색 결과를 불러오는 중입니다.</div>`;
  }
  if (people.length === 0) {
    return `<div class="empty-state">검색 결과가 없습니다. 원하는 사람이 없으면 아래 입력칸에서 직접 추가하면 됩니다.</div>`;
  }
  const current = getCurrentSelection();
  return `<div class="search-results">
    ${people
      .map((person) => {
        const choiceName = person.selectionName || person.name;
        const active = current.includes(choiceName);
        const localPerson = state.catalog.find((item) => item.name === choiceName);
        const tags = localPerson
          ? (state.currentTab === "appearance" ? localPerson.appearanceTags.slice(0, 2) : localPerson.personalityTags.slice(0, 2))
          : [];
        return `<div class="search-row-card ${active ? "active" : ""}">
          <button class="search-row-main" type="button" data-action="toggle" data-name="${escapeHtml(choiceName)}">
            <div class="search-avatar" style="${getPortraitStyle(choiceName)}" data-initials="${escapeHtml(
              initialsFromName(choiceName)
            )}">
              ${person.imageUrl ? `<img src="${escapeHtml(person.imageUrl)}" alt="${escapeHtml(choiceName)}" referrerpolicy="no-referrer" />` : ""}
            </div>
            <div class="search-copy">
              <div class="search-name-line">
                <span class="search-name">${escapeHtml(choiceName)}</span>
                <span class="search-role">${escapeHtml(person.role)}</span>
              </div>
              <div class="search-note">${escapeHtml(person.note)}</div>
              <div class="card-tags">
                ${tags.map((tag) => `<span class="choice-tag">${escapeHtml(tag)}</span>`).join("")}
              </div>
            </div>
          </button>
          <button class="${active ? "secondary-button" : "primary-button"} search-pick-button" type="button" data-action="toggle" data-name="${escapeHtml(choiceName)}">
            ${active ? "선택됨" : "선택"}
          </button>
        </div>`;
      })
      .join("")}
  </div>`;
}

function renderReplies(result, isSynthesis = false) {
  const cards = [
    {
      label: "자연스럽게 말하면",
      helper: "가장 자주 꺼내 쓰기 좋은 기본 문장",
      value: result.natural_reply,
      featured: true,
    },
    {
      label: "한 줄 요약",
      helper: "짧게 바로 답할 때",
      value: result.short_reply,
    },
    {
      label: "조금 더 설명하면",
      helper: isSynthesis ? "취향의 결을 한 번 더 풀어서" : "이 취향이 왜 보이는지까지",
      value: result.deep_reply,
    },
  ];
  return `<div class="reply-grid">
    ${cards
      .map(
        (card) => `<div class="reply-card ${card.featured ? "featured" : ""}">
          <h4>${card.label}</h4>
          <div class="reply-helper">${card.helper}</div>
          <p>${escapeHtml(card.value)}</p>
          <button type="button" data-action="copy" data-copy="${escapeHtml(card.value)}">문장 복사</button>
        </div>`
      )
      .join("")}
  </div>`;
}

function renderResultCard(result, title) {
  if (!result) {
    return "";
  }
  return `<section class="result-card">
    <div class="result-head">
      <div>
        <div class="result-eyebrow">${escapeHtml(title)}</div>
        <h2 class="result-title">${escapeHtml(result.title)}</h2>
      </div>
      <div class="source-badge">${result.source === "openai" ? "AI analysis" : "curated demo"}</div>
    </div>
    <p class="headline">${escapeHtml(result.headline)}</p>
    <p class="summary">${escapeHtml(result.summary)}</p>
    <div class="keyword-row">
      ${(result.keywords || []).map((keyword) => `<span class="keyword">${escapeHtml(keyword)}</span>`).join("")}
    </div>
    <div class="breakdowns">
      ${(result.breakdown || [])
        .map(
          (item) => `<div class="breakdown">
            <div class="breakdown-label">${escapeHtml(item.label)}</div>
            <div class="breakdown-copy">${escapeHtml(item.text)}</div>
          </div>`
        )
        .join("")}
    </div>
    ${renderReplies(result)}
    <div class="confidence-note">${escapeHtml(result.confidence_note || "")}</div>
  </section>`;
}

function renderSynthesisCard(result) {
  if (!result) {
    return "";
  }
  return `<section class="result-card">
    <div class="result-head">
      <div>
        <div class="result-eyebrow">Final Editorial</div>
        <h2 class="result-title">${escapeHtml(result.title)}</h2>
      </div>
      <div class="source-badge">${result.source === "openai" ? "AI synthesis" : "local synthesis"}</div>
    </div>
    <p class="headline">${escapeHtml(result.headline)}</p>
    <p class="summary">${escapeHtml(result.summary)}</p>
    <div class="keyword-row">
      ${(result.keywords || []).map((keyword) => `<span class="keyword">${escapeHtml(keyword)}</span>`).join("")}
    </div>
    <div class="lead-reply-card">
      <div class="lead-reply-kicker">대표 문장</div>
      <p>${escapeHtml(result.combined_reply)}</p>
      <button type="button" data-action="copy" data-copy="${escapeHtml(result.combined_reply)}">문장 복사</button>
    </div>
    ${renderReplies(result, true)}
    <div class="confidence-note">${escapeHtml(result.confidence_note || "")}</div>
    <div class="image-actions">
      <button type="button" class="primary-button" data-action="generate-image" ${state.supportsImageGeneration ? "" : "disabled"}>
        ${state.loading.image ? `<span class="loader"></span>` : "이상형 이미지 그리기"}
      </button>
      ${!state.supportsImageGeneration ? `<button type="button" class="ghost-button" disabled>OPENAI_API_KEY 필요</button>` : ""}
    </div>
    ${
      state.portrait
        ? `<div class="image-stage">
            <div class="image-frame">
              <img src="${state.portrait.imageDataUrl}" alt="이상형 분석을 바탕으로 생성된 원본 인물 포트레이트" />
            </div>
            <div class="image-copy">
              <div class="image-note">
                <h4>Rendered Portrait</h4>
                <p>${escapeHtml(state.portrait.note || "")}</p>
              </div>
              <div class="image-note">
                <h4>Prompt Summary</h4>
                <p>${escapeHtml(state.portrait.promptSummary || "")}</p>
              </div>
              <div class="image-note">
                <h4>Model</h4>
                <p>${escapeHtml(state.portrait.model || "")}</p>
              </div>
            </div>
          </div>`
        : ""
    }
  </section>`;
}

function render() {
  const currentSelection = getCurrentSelection();
  const currentResult = state.results[state.currentTab];
  const canAnalyze = currentSelection.length >= 3 && currentSelection.length <= 10;
  const example = state.examplePacks[state.currentTab];
  const otherTab = state.currentTab === "appearance" ? "personality" : "appearance";
  const bothDone = Boolean(state.results.appearance && state.results.personality);
  const currentDone = Boolean(currentResult);
  const stepTwoReady = currentSelection.length >= 3 && currentSelection.length <= 10;

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">Ideal Type Editorial</div>
          <div class="brand-title">누가 당신의 이상형을 설명하나요?</div>
        </div>
        <div class="topbar-note">
          3명에서 10명까지 고르면 공통된 취향을 에디토리얼 톤으로 정리합니다.
          추천 카드만으로는 키 없이 바로 체험할 수 있고, API 키가 있으면 임의 인물 이름도 분석합니다.
        </div>
      </header>

      <main class="page">
        <section class="hero">
          <div class="hero-card">
            <div class="hero-eyebrow">Step 01 / Curate</div>
            <h1>이름 몇 개만으로 취향을 말하게.</h1>
            <p>
              외적 이상형과 성격 이상형을 따로 고른 뒤, 마지막에 둘을 합쳐 최종 한 줄까지 만들 수 있습니다.
              결과는 먼저 자연스럽게 말하는 기본 문장으로 보여주고, 그 아래에 한 줄 요약과 조금 더 자세한 설명을 함께 정리합니다.
            </p>
          </div>
          <aside class="hero-side">
            <div class="side-title">오늘의 설계 방향</div>
            <div class="stack">
              <div class="stack-item">
                <div class="stack-kicker">Selection Rule</div>
                <div class="stack-copy">각 카테고리별 최소 3명, 최대 10명. 인원이 늘수록 공통점은 선명해지지만 취향 폭은 좁아집니다.</div>
              </div>
              <div class="stack-item">
                <div class="stack-kicker">Demo Mode</div>
                <div class="stack-copy">추천 카드로는 서버 키 없이도 바로 분석됩니다. 사용자 예시 세트도 바로 채워 볼 수 있습니다.</div>
              </div>
              <div class="stack-item">
                <div class="stack-kicker">Final Use</div>
                <div class="stack-copy">사람들이 "너 이상형 뭐야?"라고 물었을 때 바로 말할 수 있는 문장까지 한 번에 만듭니다.</div>
              </div>
            </div>
          </aside>
        </section>

        <section class="control-grid">
          <div class="panel">
            <div class="control-header">
              <div>
                <div class="section-title">Selection Studio</div>
                <div class="section-caption">카테고리를 바꾸면 선택 목록도 따로 저장됩니다. 지금은 <strong>${state.currentTab === "appearance" ? "외적 이상형" : "성격 이상형"}</strong>을 고르는 중입니다.</div>
              </div>
              <div class="tabs">
                <button type="button" class="tab ${state.currentTab === "appearance" ? "active" : ""}" data-action="tab" data-tab="appearance">Appearance</button>
                <button type="button" class="tab ${state.currentTab === "personality" ? "active" : ""}" data-action="tab" data-tab="personality">Personality</button>
              </div>
            </div>

            <div class="step-strip">
              <div class="step-chip active">
                <span class="step-number">1</span>
                <div class="step-copy">
                  <strong>트랙 고르기</strong>
                  <span>${state.currentTab === "appearance" ? "외적 이상형" : "성격 이상형"}</span>
                </div>
              </div>
              <div class="step-chip ${stepTwoReady ? "active" : ""}">
                <span class="step-number">2</span>
                <div class="step-copy">
                  <strong>이름 3~10명 담기</strong>
                  <span>${selectionCountText()}</span>
                </div>
              </div>
              <div class="step-chip ${currentDone ? "active" : ""}">
                <span class="step-number">3</span>
                <div class="step-copy">
                  <strong>분석 실행</strong>
                  <span>${currentDone ? "완료됨" : "아직 실행 전"}</span>
                </div>
              </div>
            </div>

            <div class="search-row">
              <input class="field" type="text" value="${escapeHtml(state.search)}" placeholder="${state.currentTab === "appearance" ? "외모 취향에 맞는 인물을 검색하세요" : "성격 이미지가 끌리는 인물을 검색하세요"}" data-role="search" />
              <button type="button" class="ghost-button" data-action="fill-example">${escapeHtml(example?.label || "예시 채우기")}</button>
            </div>

            <div class="meta-row">
              <span class="meta-chip"><strong>Target</strong> 3명 ~ 10명</span>
              <span class="meta-chip"><strong>Current</strong> ${selectionCountText()}</span>
              <span class="meta-chip"><strong>${state.supportsCustomAnalysis ? "AI" : "Demo"}</strong> ${state.supportsCustomAnalysis ? "임의 이름 분석 가능" : "추천 카드 조합 즉시 분석"}</span>
              <span class="meta-chip"><strong>${state.supportsNaverSearch ? "Naver" : "Local"}</strong> ${state.supportsNaverSearch ? "검색 시 썸네일 프리뷰 사용" : "검색은 로컬 후보 fallback"}</span>
            </div>

            <div class="add-row">
              <input type="text" value="${escapeHtml(state.customName)}" placeholder="${state.currentTab === "appearance" ? "예: 김무열" : "예: 하정우"}" data-role="custom-name" />
              <button type="button" class="secondary-button" data-action="add-custom">직접 추가</button>
            </div>

            ${renderPeopleCards()}

            <div class="selection-stage">
              <div class="selection-stage-head">
                <div>
                  <div class="section-title selection-stage-title">Selected Names</div>
                  <div class="section-caption">선택이 여기 쌓입니다. 이 블록이 다음 단계 시작점입니다.</div>
                </div>
              </div>
              ${renderSelectedChips()}
              <div class="analyze-panel">
                <div class="analyze-copy">
                  <strong>${stepTwoReady ? "다음 단계로 갈 수 있습니다." : "아직 3명이 안 됐습니다."}</strong>
                  <span>${
                    stepTwoReady
                      ? `${state.currentTab === "appearance" ? "외적 공통점" : "성격 공통점"} 분석을 바로 실행하세요. 버튼을 아래에 숨기지 않고 현재 선택 블록 안으로 올렸습니다.`
                      : "최소 3명을 선택하면 바로 분석 버튼이 활성화됩니다."
                  }</span>
                </div>
                <div class="analyze-actions">
                  <button type="button" class="ghost-button" data-action="reset-current">reset</button>
                  <button type="button" class="primary-button" data-action="analyze" ${canAnalyze ? "" : "disabled"}>
                    ${state.loading[state.currentTab] ? `<span class="loader"></span>` : `${state.currentTab === "appearance" ? "외적 공통점 분석" : "성격 공통점 분석"}`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside class="sidebar-list">
            <div class="mini-card">
              <h3>선택 기준</h3>
              <p>${state.currentTab === "appearance" ? "외적 취향은 얼굴선, 눈빛, 실루엣, 분위기 중심으로 정리됩니다." : "성격 취향은 공개 인터뷰 톤, 대중적 이미지, 사람을 대하는 결 중심으로 정리됩니다."}</p>
            </div>
            <div class="mini-card">
              <h3>다음 단계</h3>
              <p>${state.results[otherTab] ? `반대 카테고리 결과도 이미 있습니다. 현재 분석까지 끝나면 바로 최종 종합으로 넘어갈 수 있습니다.` : `지금 카테고리 분석을 끝낸 뒤 반대 카테고리로 넘어가면 최종 종합 결과까지 이어집니다.`}</p>
            </div>
            <div class="mini-card">
              <h3>사진 소스</h3>
              <p>${state.supportsNaverSearch ? "현재는 네이버 이미지 검색 API 결과를 검색 프리뷰로 사용합니다. 선택 이름은 그대로 유지하고, 썸네일만 보조적으로 붙입니다." : "현재 서버에는 외부 이미지 검색 키가 없어 로컬 후보만 보여줍니다. 키를 넣으면 검색 썸네일 프리뷰가 바로 켜집니다."}</p>
            </div>
          </aside>
        </section>

        <section class="results">
          ${renderResultCard(currentResult, state.currentTab === "appearance" ? "Appearance Analysis" : "Personality Analysis")}
          ${
            bothDone
              ? `<section class="panel">
                  <div class="control-header">
                    <div>
                      <div class="section-title">Final Synthesis</div>
                      <div class="section-caption">외적 이상형과 성격 이상형을 합쳐 최종 한 줄을 만듭니다.</div>
                    </div>
                    <button type="button" class="primary-button" data-action="synthesize">
                      ${state.loading.synthesis ? `<span class="loader"></span>` : "최종 종합 만들기"}
                    </button>
                  </div>
                  ${
                    state.synthesis
                      ? renderSynthesisCard(state.synthesis)
                      : `<div class="empty-state">외적 결과와 성격 결과는 준비됐습니다. 위 버튼으로 최종 종합을 생성하세요.</div>`
                  }
                </section>`
              : ""
          }
        </section>
      </main>

      ${state.toast ? `<div class="toast">${escapeHtml(state.toast)}</div>` : ""}
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  app.querySelectorAll("[data-action='tab']").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentTab = button.dataset.tab;
      state.search = "";
      state.searchResults = [];
      state.customName = "";
      saveState();
      render();
    });
  });

  app.querySelector("[data-role='search']")?.addEventListener("input", (event) => {
    state.search = event.target.value;
    clearTimeout(bindEvents.searchTimer);
    bindEvents.searchTimer = setTimeout(() => {
      fetchSearchResults(state.search);
    }, 220);
    render();
  });

  app.querySelector("[data-role='custom-name']")?.addEventListener("input", (event) => {
    state.customName = event.target.value;
  });

  app.querySelector("[data-role='custom-name']")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addNameToCurrentTab(state.customName);
    }
  });

  app.querySelectorAll("[data-action='toggle']").forEach((button) => {
    button.addEventListener("click", () => togglePerson(button.dataset.name));
  });

  app.querySelectorAll("[data-action='remove']").forEach((button) => {
    button.addEventListener("click", () => removeFromCurrent(button.dataset.name));
  });

  app.querySelector("[data-action='fill-example']")?.addEventListener("click", () => {
    const example = state.examplePacks[state.currentTab];
    if (!example) {
      return;
    }
    state.selections[state.currentTab] = [...example.names];
    state.results[state.currentTab] = null;
    state.synthesis = null;
    state.portrait = null;
    saveState();
    render();
  });

  app.querySelector("[data-action='add-custom']")?.addEventListener("click", () => {
    addNameToCurrentTab(state.customName);
  });

  app.querySelector("[data-action='reset-current']")?.addEventListener("click", resetCurrentTab);
  app.querySelector("[data-action='analyze']")?.addEventListener("click", analyzeCurrentTab);
  app.querySelector("[data-action='synthesize']")?.addEventListener("click", synthesizeResults);
  app.querySelector("[data-action='generate-image']")?.addEventListener("click", generatePortrait);

  app.querySelectorAll("[data-action='copy']").forEach((button) => {
    button.addEventListener("click", () => copyText(button.dataset.copy));
  });
}

async function init() {
  loadState();
  render();
  try {
    const response = await fetch("/api/catalog");
    const data = await response.json();
    state.catalog = data.people || [];
    state.examplePacks = data.examplePacks || {};
    state.supportsCustomAnalysis = Boolean(data.supportsCustomAnalysis);
    state.supportsImageGeneration = Boolean(data.supportsImageGeneration);
    state.supportsNaverSearch = Boolean(data.supportsNaverSearch);
    render();
  } catch {
    setToast("카탈로그를 불러오지 못했습니다.");
  }
}

init();
