const state = {
  catalog: [],
  examplePacks: {},
  supportsCustomAnalysis: false,
  supportsImageGeneration: false,
  currentTab: "appearance",
  search: "",
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
  const keyword = state.search.trim().toLowerCase();
  const selection = getCurrentSelection();
  return state.catalog
    .filter((person) => {
      if (!keyword) {
        return true;
      }
      const pool = [
        person.name,
        person.role,
        person.note,
        ...(state.currentTab === "appearance" ? person.appearanceTags : person.personalityTags),
      ]
        .join(" ")
        .toLowerCase();
      return pool.includes(keyword);
    })
    .sort((a, b) => Number(selection.includes(b.name)) - Number(selection.includes(a.name)));
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
  if (people.length === 0) {
    return `<div class="empty-state">검색 결과가 없습니다. 직접 이름을 추가해서 분석할 수도 있습니다.</div>`;
  }
  const current = getCurrentSelection();
  return `<div class="cards">
    ${people
      .map((person) => {
        const active = current.includes(person.name);
        const tags =
          state.currentTab === "appearance" ? person.appearanceTags.slice(0, 2) : person.personalityTags.slice(0, 2);
        return `<button class="person-card ${active ? "active" : ""}" type="button" data-action="toggle" data-name="${escapeHtml(
          person.name
        )}">
          <div class="portrait" style="${getPortraitStyle(person.name)}" data-initials="${escapeHtml(
            initialsFromName(person.name)
          )}"></div>
          <div class="card-role">${escapeHtml(person.role)}</div>
          <div class="card-name">${escapeHtml(person.name)}</div>
          <div class="card-note">${escapeHtml(person.note)}</div>
          <div class="card-tags">
            ${tags.map((tag) => `<span class="choice-tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </button>`;
      })
      .join("")}
  </div>`;
}

function renderReplies(result, isSynthesis = false) {
  const cards = [
    { label: "짧게", value: isSynthesis ? result.short_reply : result.short_reply },
    { label: "자연스럽게", value: isSynthesis ? result.natural_reply : result.natural_reply },
    { label: "조금 더 풀어서", value: isSynthesis ? result.deep_reply : result.deep_reply },
  ];
  return `<div class="reply-grid">
    ${cards
      .map(
        (card) => `<div class="reply-card">
          <h4>${card.label}</h4>
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
    <div class="reply-grid">
      <div class="reply-card">
        <h4>최종 한 줄</h4>
        <p>${escapeHtml(result.combined_reply)}</p>
        <button type="button" data-action="copy" data-copy="${escapeHtml(result.combined_reply)}">문장 복사</button>
      </div>
      <div class="reply-card">
        <h4>짧게</h4>
        <p>${escapeHtml(result.short_reply)}</p>
        <button type="button" data-action="copy" data-copy="${escapeHtml(result.short_reply)}">문장 복사</button>
      </div>
      <div class="reply-card">
        <h4>자연스럽게</h4>
        <p>${escapeHtml(result.natural_reply)}</p>
        <button type="button" data-action="copy" data-copy="${escapeHtml(result.natural_reply)}">문장 복사</button>
      </div>
    </div>
    <div class="reply-grid">
      <div class="reply-card">
        <h4>조금 더 풀어서</h4>
        <p>${escapeHtml(result.deep_reply)}</p>
        <button type="button" data-action="copy" data-copy="${escapeHtml(result.deep_reply)}">문장 복사</button>
      </div>
    </div>
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
              결과는 "짧게", "자연스럽게", "조금 더 풀어서" 세 버전으로 바로 복사할 수 있게 정리합니다.
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

            <div class="search-row">
              <input class="field" type="text" value="${escapeHtml(state.search)}" placeholder="${state.currentTab === "appearance" ? "외모 취향에 맞는 인물을 검색하세요" : "성격 이미지가 끌리는 인물을 검색하세요"}" data-role="search" />
              <button type="button" class="ghost-button" data-action="fill-example">${escapeHtml(example?.label || "예시 채우기")}</button>
            </div>

            <div class="meta-row">
              <span class="meta-chip"><strong>Target</strong> 3명 ~ 10명</span>
              <span class="meta-chip"><strong>Current</strong> ${selectionCountText()}</span>
              <span class="meta-chip"><strong>${state.supportsCustomAnalysis ? "AI" : "Demo"}</strong> ${state.supportsCustomAnalysis ? "임의 이름 분석 가능" : "추천 카드 조합 즉시 분석"}</span>
            </div>

            <div class="add-row">
              <input type="text" value="${escapeHtml(state.customName)}" placeholder="${state.currentTab === "appearance" ? "예: 김무열" : "예: 하정우"}" data-role="custom-name" />
              <button type="button" class="secondary-button" data-action="add-custom">직접 추가</button>
            </div>

            ${renderPeopleCards()}
          </div>

          <aside class="sidebar-list">
            <div class="mini-card">
              <h3>현재 선택</h3>
              <p>${state.currentTab === "appearance" ? "외적 취향은 얼굴선, 눈빛, 실루엣, 분위기 중심으로 정리됩니다." : "성격 취향은 공개 인터뷰 톤, 대중적 이미지, 사람을 대하는 결 중심으로 정리됩니다."}</p>
              ${renderSelectedChips()}
            </div>
            <div class="mini-card">
              <h3>다음 단계</h3>
              <p>${state.results[otherTab] ? `반대 카테고리 결과도 이미 만들어 두었습니다. 둘 다 있으면 최종 종합까지 이어서 만들 수 있습니다.` : `지금 카테고리 결과를 만든 뒤 반대 카테고리도 분석하면 최종 종합 결과까지 이어집니다.`}</p>
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

      <div class="sticky-bar">
        <div class="sticky-copy">
          <strong>${state.currentTab === "appearance" ? "Appearance" : "Personality"}</strong>
          <span class="sticky-note">${selectionCountText()} · ${canAnalyze ? "분석 가능" : "분석하려면 최소 3명이 필요"}</span>
        </div>
        <div class="sticky-actions">
          <button type="button" class="ghost-button" data-action="reset-current">reset</button>
          <button type="button" class="primary-button" data-action="analyze" ${canAnalyze ? "" : "disabled"}>
            ${state.loading[state.currentTab] ? `<span class="loader"></span>` : "Analyze"}
          </button>
        </div>
      </div>

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
      state.customName = "";
      saveState();
      render();
    });
  });

  app.querySelector("[data-role='search']")?.addEventListener("input", (event) => {
    state.search = event.target.value;
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
    render();
  } catch {
    setToast("카탈로그를 불러오지 못했습니다.");
  }
}

init();
