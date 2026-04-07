const state = {
  catalog: [],
  examplePacks: {},
  supportsCustomAnalysis: false,
  supportsImageGeneration: false,
  supportsNaverSearch: false,
  currentTab: "appearance",
  search: "",
  searchResults: [],
  selections: {
    appearance: [],
    personality: [],
  },
  selectionMeta: {
    appearance: {},
    personality: {},
  },
  results: {
    appearance: null,
    personality: null,
  },
  synthesis: null,
  matchPack: null,
  loading: {
    appearance: false,
    personality: false,
    synthesis: false,
    image: false,
    matchPack: false,
    search: false,
  },
  portrait: null,
  toast: "",
  keepSearchFocus: false,
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
      selectionMeta: state.selectionMeta,
      results: state.results,
      synthesis: state.synthesis,
      matchPack: state.matchPack,
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
    if (parsed.selectionMeta) {
      state.selectionMeta = parsed.selectionMeta;
    }
    if (parsed.results) {
      state.results = parsed.results;
    }
    if (parsed.synthesis) {
      state.synthesis = parsed.synthesis;
    }
    if (parsed.matchPack) {
      state.matchPack = parsed.matchPack;
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
  state.selectionMeta[state.currentTab] = {};
  state.results[state.currentTab] = null;
  state.synthesis = null;
  state.matchPack = null;
  state.portrait = null;
  saveState();
  render();
}

function setSelectionMeta(tab, name, meta) {
  if (!name) {
    return;
  }
  state.selectionMeta[tab][name] = meta;
}

function clearSelectionMeta(tab, name) {
  if (!name) {
    return;
  }
  delete state.selectionMeta[tab][name];
}

function addNameToCurrentTab(name, meta = null) {
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
  if (meta) {
    setSelectionMeta(state.currentTab, trimmed, meta);
  }
  state.results[state.currentTab] = null;
  state.synthesis = null;
  state.matchPack = null;
  state.portrait = null;
  saveState();
  render();
}

function togglePerson(name, meta = null) {
  const current = getCurrentSelection();
  const index = current.indexOf(name);
  if (index >= 0) {
    current.splice(index, 1);
    clearSelectionMeta(state.currentTab, name);
  } else {
    if (current.length >= 10) {
      setToast("최대 10명까지만 넣을 수 있습니다.");
      return;
    }
    current.push(name);
    if (meta) {
      setSelectionMeta(state.currentTab, name, meta);
    }
  }
  state.results[state.currentTab] = null;
  state.synthesis = null;
  state.matchPack = null;
  state.portrait = null;
  saveState();
  render();
}

async function fetchSearchResults(query) {
  const trimmed = query.trim();
  if (!shouldTriggerSearch(trimmed)) {
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
  clearSelectionMeta(state.currentTab, name);
  state.results[state.currentTab] = null;
  state.synthesis = null;
  state.matchPack = null;
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
        selectionMeta: names.map((name) => ({
          name,
          ...(state.selectionMeta[state.currentTab][name] || {}),
        })),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "분석에 실패했습니다.");
    }
    state.results[state.currentTab] = result;
    state.synthesis = null;
    state.matchPack = null;
    state.portrait = null;
    saveState();
    render();
    if (state.results.appearance && state.results.personality) {
      await synthesizeResults();
    }
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
    state.matchPack = null;
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
    state.matchPack = null;
    saveState();
    render();
  } catch (error) {
    setToast(error.message);
  } finally {
    state.loading.image = false;
    render();
  }
}

async function generateMatchPack() {
  if (!state.synthesis || !state.results.appearance || !state.results.personality) {
    setToast("매칭 카드 생성을 위해 먼저 최종 종합 결과를 만들어 주세요.");
    return;
  }
  state.loading.matchPack = true;
  render();
  try {
    const response = await fetch("/api/match-pack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        synthesisResult: state.synthesis,
        appearanceResult: state.results.appearance,
        personalityResult: state.results.personality,
        portraitResult: state.portrait,
        selections: state.selections,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "매칭 카드 생성에 실패했습니다.");
    }
    state.matchPack = result;
    saveState();
    render();
  } catch (error) {
    setToast(error.message);
  } finally {
    state.loading.matchPack = false;
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
    return `<div class="empty-state">선택한 인물이 여기에 쌓입니다.</div>`;
  }
  return `<div class="selected-list">
    ${current
      .map(
        (name, index) => `<div class="selected-list-item">
          <div class="selected-index">${index + 1}</div>
          <div class="selected-meta">
            <div class="selected-name">${escapeHtml(name)}</div>
          </div>
          <button type="button" class="selected-remove" data-action="remove" data-name="${escapeHtml(name)}">삭제</button>
        </div>`
      )
      .join("")}
  </div>`;
}

function renderPeopleCards() {
  const people = filteredPeople();
  if (!state.search.trim()) {
    return `<div class="empty-state">이름을 검색하면 후보가 뜹니다.</div>`;
  }
  if (state.loading.search) {
    return `<div class="empty-state">검색 결과를 불러오는 중입니다.</div>`;
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
              </div>
              ${person.note ? `<div class="search-note">${escapeHtml(person.note)}</div>` : ""}
              ${tags.length > 0 ? `<div class="card-tags">
                ${tags.map((tag) => `<span class="choice-tag">${escapeHtml(tag)}</span>`).join("")}
              </div>` : ""}
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
      <div class="source-badge">${result.source === "openai" ? "AI analysis" : "local fallback"}</div>
    </div>
    <div class="result-layout">
      <div class="breakdowns vertical">
        ${(result.breakdown || [])
          .map(
            (item) => `<div class="breakdown">
              <div class="breakdown-label">${escapeHtml(item.label)}</div>
              <div class="breakdown-copy">${escapeHtml(item.text)}</div>
            </div>`
          )
          .join("")}
      </div>
      <div class="result-narrative">
        <div class="result-narrative-title">너의 이상형의 느낌은</div>
        <p class="headline">${escapeHtml(result.headline)}</p>
        <p class="summary">${escapeHtml(result.summary)} ${escapeHtml(result.deep_reply || "")}</p>
        <div class="summary-line">
          <div class="summary-line-label">한 줄 요약</div>
          <p>${escapeHtml(result.short_reply)}</p>
        </div>
      </div>
    </div>
    <div class="keyword-row">
      ${(result.keywords || []).map((keyword) => `<span class="keyword">${escapeHtml(keyword)}</span>`).join("")}
    </div>
    <div class="confidence-note">${escapeHtml(result.confidence_note || "")}</div>
  </section>`;
}

function renderNextStepCard() {
  const currentResult = state.results[state.currentTab];
  const otherTab = state.currentTab === "appearance" ? "personality" : "appearance";
  const otherLabel = otherTab === "appearance" ? "외적 이상형 분석" : "성격 이상형 분석";
  if (!currentResult || (state.results.appearance && state.results.personality)) {
    return "";
  }
  return `<section class="panel next-step-panel">
    <div class="next-step-copy">
      <div class="result-narrative-title">Next Step</div>
      <h3>${otherLabel} 이어서 하기</h3>
      <p>지금 결과는 정리됐습니다. 반대 카테고리도 분석하면 최종 종합 결과와 이미지 생성 단계가 바로 열립니다.</p>
    </div>
    <button type="button" class="primary-button" data-action="switch-next" data-tab="${otherTab}">${otherLabel}</button>
  </section>`;
}

function renderMatchPackCard() {
  if (!state.matchPack) {
    return "";
  }
  return `<section class="match-pack-card">
    <div class="match-pack-head">
      <div>
        <div class="result-narrative-title">Curator Match Pack</div>
        <h3>${escapeHtml(state.matchPack.title)}</h3>
      </div>
      <div class="source-badge">${state.matchPack.source === "openai" ? "AI match pack" : "local pack"}</div>
    </div>
    <div class="match-pack-grid">
      <div class="match-pack-block">
        <div class="summary-line-label">한 줄 소개</div>
        <p>${escapeHtml(state.matchPack.intro_line)}</p>
      </div>
      <div class="match-pack-block">
        <div class="summary-line-label">잘 맞는 상대</div>
        <p>${escapeHtml(state.matchPack.who_you_match_well_with)}</p>
      </div>
      <div class="match-pack-block">
        <div class="summary-line-label">큐레이터 메모</div>
        <p>${escapeHtml(state.matchPack.curator_note)}</p>
      </div>
      <div class="match-pack-block">
        <div class="summary-line-label">오픈카톡 소개글</div>
        <p>${escapeHtml(state.matchPack.openchat_post)}</p>
      </div>
    </div>
    <div class="match-pack-actions">
      <button type="button" class="secondary-button" data-action="copy" data-copy="${escapeHtml(state.matchPack.intro_line)}">한 줄 소개 복사</button>
      <button type="button" class="secondary-button" data-action="copy" data-copy="${escapeHtml(state.matchPack.openchat_post)}">오픈카톡 소개글 복사</button>
      <button type="button" class="secondary-button" data-action="copy" data-copy="${escapeHtml(state.matchPack.curator_note)}">큐레이터 메모 복사</button>
    </div>
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
      <div class="source-badge">${result.source === "openai" ? "AI synthesis" : "local fallback"}</div>
    </div>
    <div class="result-layout synthesis-layout">
      <div class="result-narrative">
        <div class="result-narrative-title">너의 이상형의 느낌은</div>
        <p class="headline">${escapeHtml(result.headline)}</p>
        <p class="summary">${escapeHtml(result.summary)} ${escapeHtml(result.deep_reply || "")}</p>
        <div class="summary-line">
          <div class="summary-line-label">한 줄 요약</div>
          <p>${escapeHtml(result.short_reply)}</p>
        </div>
      </div>
      <div class="lead-reply-card">
        <div class="lead-reply-kicker">대표 문장</div>
        <p>${escapeHtml(result.combined_reply)}</p>
        <button type="button" data-action="copy" data-copy="${escapeHtml(result.combined_reply)}">문장 복사</button>
      </div>
    </div>
    <div class="keyword-row">
      ${(result.keywords || []).map((keyword) => `<span class="keyword">${escapeHtml(keyword)}</span>`).join("")}
    </div>
    <div class="confidence-note">${escapeHtml(result.confidence_note || "")}</div>
    <div class="image-step-card">
      <div class="image-step-copy">
        <div class="result-narrative-title">Step 03</div>
        <h3>이미지 생성하기</h3>
        <p>지금까지 분석한 외모 결, 피지컬 무드, 성격 인상을 한 장의 실사형 이상형 이미지로 묶습니다.</p>
      </div>
      <div class="image-actions">
        <button type="button" class="primary-button" data-action="generate-image" ${state.supportsImageGeneration ? "" : "disabled"}>
          ${state.loading.image ? `<span class="loader"></span>` : "이상형 이미지 그리기"}
        </button>
        ${!state.supportsImageGeneration ? `<button type="button" class="ghost-button" disabled>OPENAI_API_KEY 필요</button>` : ""}
      </div>
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
          </div>
          <div class="match-pack-stage">
            <div class="image-step-card compact">
              <div class="image-step-copy">
                <div class="result-narrative-title">Monetization MVP</div>
                <h3>매칭 운영용 카드 만들기</h3>
                <p>생성된 얼굴 이미지와 성격 결을 바탕으로 수동 소개팅, 오픈카톡 모집, 큐레이터 메모에 바로 쓸 수 있는 운영용 문구를 만듭니다.</p>
              </div>
              <div class="image-actions">
                <button type="button" class="primary-button" data-action="generate-match-pack">
                  ${state.loading.matchPack ? `<span class="loader"></span>` : "매칭 카드 만들기"}
                </button>
              </div>
            </div>
            ${renderMatchPackCard()}
          </div>`
        : ""
    }
  </section>`;
}

function render() {
  const currentSelection = getCurrentSelection();
  const currentResult = state.results[state.currentTab];
  const canAnalyze = currentSelection.length >= 3 && currentSelection.length <= 10;
  const bothDone = Boolean(state.results.appearance && state.results.personality);
  const currentDone = Boolean(currentResult);
  const stepTwoReady = canAnalyze;
  const trackLabel = state.currentTab === "appearance" ? "외적 이상형" : "성격 이상형";
  const searchPlaceholder =
    state.currentTab === "appearance" ? "외적 이상형이 떠오르는 인물을 검색하세요" : "성격 이미지가 끌리는 인물을 검색하세요";
  const stepTwoLabel = state.currentTab === "appearance" ? "외적 공통점 분석하기" : "성격 공통점 분석하기";
  const stepThreeLabel = "이미지 생성하기";
  const stageOneState = currentSelection.length > 0 ? "complete" : "current";
  const stageTwoState = currentDone ? "complete" : stepTwoReady ? "current" : "locked";
  const stageThreeState = state.portrait ? "complete" : state.synthesis ? "current" : "locked";

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">Ideal Type Editorial</div>
          <div class="brand-title">이름 몇 개만으로 이상형 설명하기</div>
        </div>
        <div class="topbar-note">
          외적 이상형과 성격 이상형을 고른 뒤,<br />내가 원하는 이상형을 설명하는 글을 만들 수 있습니다.
        </div>
      </header>

      <main class="page">
        <section class="studio-shell">
          <aside class="progress-rail">
            <div class="rail-label">Selection Studio</div>
            <div class="rail-steps">
              <div class="rail-step ${stageOneState}">
                <div class="rail-number">1</div>
                <div class="rail-copy">
                  <strong>이상형 고르기</strong>
                  <span>${selectionCountText()} / 3명~10명</span>
                </div>
              </div>
              <div class="rail-step ${stageTwoState}">
                <div class="rail-number">2</div>
                <div class="rail-copy">
                  <strong>${stepTwoLabel}</strong>
                  <span>${currentDone ? "완료됨" : stepTwoReady ? "이제 실행 가능" : "3명 이상 선택 필요"}</span>
                </div>
              </div>
              <div class="rail-step ${stageThreeState}">
                <div class="rail-number">3</div>
                <div class="rail-copy">
                  <strong>${stepThreeLabel}</strong>
                  <span>${state.portrait ? "생성 완료" : state.synthesis ? "지금 생성 가능" : "종합 결과 후 가능"}</span>
                </div>
              </div>
            </div>
          </aside>

          <div class="panel studio-panel">
            <div class="control-header">
              <div>
                <div class="section-title">Selection Studio</div>
                <div class="section-caption">카테고리를 바꾸면 선택 목록이 따로 저장됩니다. 지금은 <strong>${trackLabel}</strong>을 고르는 중입니다.</div>
              </div>
              <div class="tabs">
                <button type="button" class="tab ${state.currentTab === "appearance" ? "active" : ""}" data-action="tab" data-tab="appearance">외적 이상형</button>
                <button type="button" class="tab ${state.currentTab === "personality" ? "active" : ""}" data-action="tab" data-tab="personality">성격 이상형</button>
              </div>
            </div>

            <div class="search-stack">
              <input class="field" type="text" value="${escapeHtml(state.search)}" placeholder="${searchPlaceholder}" data-role="search" />
              <div class="search-hint">이름을 검색하면 후보가 뜹니다.</div>
            </div>

            <div class="meta-row">
              <span class="meta-chip"><strong>Target</strong> 3명 ~ 10명</span>
              <span class="meta-chip"><strong>Current</strong> ${selectionCountText()}</span>
            </div>

            <div class="selection-stage">
              <div class="selection-stage-head">
                <div>
                  <div class="section-title selection-stage-title">Search Results</div>
                  <div class="section-caption">${searchPlaceholder}</div>
                </div>
              </div>
              ${renderPeopleCards()}
            </div>

            <div class="selection-stage selection-stage-secondary">
              <div class="selection-stage-head">
                <div>
                  <div class="section-title selection-stage-title">Selected Names</div>
                  <div class="section-caption">선택한 인물을 여기서 바로 확인합니다.</div>
                </div>
              </div>
              ${renderSelectedChips()}
            </div>

            <div class="analyze-panel">
              <div class="analyze-copy">
                <strong>${stepTwoReady ? "이제 분석할 수 있습니다." : "먼저 3명 이상 선택해 주세요."}</strong>
                <span>${
                  stepTwoReady
                    ? `${stepTwoLabel} 버튼을 눌러 현재 선택의 공통점을 바로 정리합니다.`
                    : "최소 3명, 최대 10명까지 담은 뒤 다음 단계로 넘어갑니다."
                }</span>
              </div>
              <div class="analyze-actions">
                <button type="button" class="ghost-button" data-action="reset-current">reset</button>
                <button type="button" class="primary-button" data-action="analyze" ${canAnalyze ? "" : "disabled"}>
                  ${state.loading[state.currentTab] ? `<span class="loader"></span>` : stepTwoLabel}
                </button>
              </div>
            </div>

            <div class="studio-results">
              ${renderResultCard(currentResult, stepTwoLabel)}
              ${renderNextStepCard()}
              ${
                bothDone
                  ? `<section class="panel inline-synthesis-panel">
                      <div class="control-header">
                        <div>
                          <div class="section-title">최종 종합</div>
                          <div class="section-caption">두 카테고리가 모두 끝나면 최종 문장을 정리하고 바로 이미지 생성 단계로 이어집니다.</div>
                        </div>
                        ${
                          state.synthesis
                            ? `<span class="meta-chip"><strong>Ready</strong> 이미지 생성 가능</span>`
                            : `<button type="button" class="primary-button" data-action="synthesize">
                                ${state.loading.synthesis ? `<span class="loader"></span>` : "최종 종합 만들기"}
                              </button>`
                        }
                      </div>
                      ${
                        state.synthesis
                          ? renderSynthesisCard(state.synthesis)
                          : `<div class="empty-state">${state.loading.synthesis ? "최종 종합을 만드는 중입니다." : "외적 결과와 성격 결과가 준비됐습니다. 최종 종합을 만든 뒤 바로 이미지 생성하기로 넘어갈 수 있습니다."}</div>`
                      }
                    </section>`
                  : ""
              }
            </div>
          </div>
        </section>
      </main>

      ${state.toast ? `<div class="toast">${escapeHtml(state.toast)}</div>` : ""}
    </div>
  `;

  bindEvents();
  if (state.keepSearchFocus) {
    const searchInput = app.querySelector("[data-role='search']");
    if (searchInput) {
      const caret = searchInput.value.length;
      searchInput.focus();
      searchInput.setSelectionRange(caret, caret);
    }
  }
}

function bindEvents() {
  app.querySelectorAll("[data-action='tab']").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentTab = button.dataset.tab;
      state.search = "";
      state.searchResults = [];
      saveState();
      render();
    });
  });

  app.querySelector("[data-role='search']")?.addEventListener("input", (event) => {
    state.search = event.target.value;
    state.keepSearchFocus = true;
    clearTimeout(bindEvents.searchTimer);
    if (!shouldTriggerSearch(state.search)) {
      state.searchResults = [];
      state.loading.search = false;
      return;
    }
    bindEvents.searchTimer = setTimeout(() => {
      fetchSearchResults(state.search);
    }, 320);
  });

  app.querySelectorAll("[data-action='toggle']").forEach((button) => {
    button.addEventListener("click", () => {
      state.keepSearchFocus = false;
      const choiceName = button.dataset.name;
      const person = state.searchResults.find((item) => (item.selectionName || item.name) === choiceName);
      const meta = person
        ? {
            source: person.source,
            role: person.role,
            note: person.note,
            isPersonCandidate: Boolean(person.isPersonCandidate),
          }
        : null;
      togglePerson(choiceName, meta);
    });
  });

  app.querySelectorAll("[data-action='remove']").forEach((button) => {
    button.addEventListener("click", () => {
      state.keepSearchFocus = false;
      removeFromCurrent(button.dataset.name);
    });
  });

  app.querySelector("[data-action='reset-current']")?.addEventListener("click", () => {
    state.keepSearchFocus = false;
    resetCurrentTab();
  });
  app.querySelector("[data-action='analyze']")?.addEventListener("click", () => {
    state.keepSearchFocus = false;
    analyzeCurrentTab();
  });
  app.querySelector("[data-action='synthesize']")?.addEventListener("click", () => {
    state.keepSearchFocus = false;
    synthesizeResults();
  });
  app.querySelector("[data-action='generate-image']")?.addEventListener("click", () => {
    state.keepSearchFocus = false;
    generatePortrait();
  });
  app.querySelector("[data-action='generate-match-pack']")?.addEventListener("click", () => {
    state.keepSearchFocus = false;
    generateMatchPack();
  });
  app.querySelector("[data-action='switch-next']")?.addEventListener("click", (event) => {
    state.keepSearchFocus = false;
    state.currentTab = event.currentTarget.dataset.tab;
    state.search = "";
    state.searchResults = [];
    saveState();
    render();
  });

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

function shouldTriggerSearch(query) {
  const trimmed = String(query || "").trim();
  if (trimmed.length < 2) {
    return false;
  }
  return !/^[\u1100-\u11ff\u3130-\u318f]+$/.test(trimmed);
}

init();
