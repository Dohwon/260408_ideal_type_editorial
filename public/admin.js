const state = {
  auth: null,
  submissions: [],
  mutualMatches: [],
  loading: false,
  error: "",
};

const app = document.querySelector("#admin-app");

function authHeader() {
  return `Basic ${btoa(`${state.auth.username}:${state.auth.password}`)}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadDashboard() {
  if (!state.auth) {
    return;
  }
  state.loading = true;
  state.error = "";
  render();
  try {
    const response = await fetch("/api/admin/submissions", {
      headers: {
        Authorization: authHeader(),
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "관리자 데이터를 불러오지 못했습니다.");
    }
    state.submissions = result.submissions || [];
    state.mutualMatches = result.mutualMatches || [];
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function saveSubmission(cardElement, submissionId) {
  const adminStatus = cardElement.querySelector("[data-role='admin-status']").value;
  const adminNote = cardElement.querySelector("[data-role='admin-note']").value;
  const manualAppearanceCandidateIds = [...cardElement.querySelectorAll("[data-kind='appearance']:checked")].map(
    (input) => input.value
  );
  const manualPersonalityCandidateIds = [...cardElement.querySelectorAll("[data-kind='personality']:checked")].map(
    (input) => input.value
  );

  const response = await fetch(`/api/admin/submissions/${submissionId}`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      adminStatus,
      adminNote,
      manualAppearanceCandidateIds,
      manualPersonalityCandidateIds,
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "저장에 실패했습니다.");
  }
  await loadDashboard();
}

async function exportMatches() {
  const response = await fetch("/api/admin/export-matches.xls", {
    headers: {
      Authorization: authHeader(),
    },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "엑셀 내보내기에 실패했습니다.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "mutual-matches.xls";
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderCandidateCheckboxes(current, kind) {
  const selectedSet = new Set(current[kind === "appearance" ? "manualAppearanceCandidateIds" : "manualPersonalityCandidateIds"] || []);
  const candidates = state.submissions.filter((item) => item.id !== current.id);
  if (candidates.length === 0) {
    return `<div class="admin-empty">후보가 아직 없습니다.</div>`;
  }
  return `<div class="candidate-list">
    ${candidates
      .map(
        (candidate) => `<label class="candidate-item">
          <input type="checkbox" data-kind="${kind}" value="${escapeHtml(candidate.id)}" ${selectedSet.has(candidate.id) ? "checked" : ""} />
          <span>${escapeHtml(candidate.displayName)} / ${escapeHtml(candidate.appearanceSelfTag || "-")} / ${escapeHtml(candidate.personalitySelfTag || "-")}</span>
        </label>`
      )
      .join("")}
  </div>`;
}

function renderDashboard() {
  return `<div class="shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">Ideal Type Editorial</div>
        <div class="brand-title">Admin Match Manager</div>
      </div>
      <div class="topbar-note">관리자 전용 매칭 운영 화면입니다.</div>
    </header>
    <main class="admin-shell">
      <section class="admin-top">
        <div>
          <div class="section-title">매칭 신청 관리</div>
          <div class="section-caption">동의 여부, 전화번호, 수동 후보 지정, 상호 매칭 엑셀 내보내기를 관리합니다.</div>
        </div>
        <div class="admin-actions">
          <button type="button" class="secondary-button" data-action="refresh-admin">새로고침</button>
          <button type="button" class="primary-button" data-action="export-admin">상호 매칭 엑셀 다운로드</button>
        </div>
      </section>
      ${state.error ? `<div class="toast">${escapeHtml(state.error)}</div>` : ""}
      <section class="admin-grid">
        ${state.submissions
          .map(
            (submission) => `<article class="admin-card" data-submission-id="${escapeHtml(submission.id)}">
              <div class="match-pack-head">
                <div>
                  <h3>${escapeHtml(submission.displayName)}</h3>
                  <div class="section-caption">${escapeHtml(submission.combinedReply || "")}</div>
                </div>
                <div class="source-badge">${submission.consent ? "동의" : "미동의"}</div>
              </div>
              <div class="admin-meta">
                <span class="meta-chip"><strong>PHONE</strong> ${escapeHtml(submission.phone)}</span>
                <span class="meta-chip"><strong>외모</strong> ${escapeHtml(submission.appearanceSelfTag || "-")}</span>
                <span class="meta-chip"><strong>성격</strong> ${escapeHtml(submission.personalitySelfTag || "-")}</span>
              </div>
              <div class="admin-field">
                <label>관리 상태</label>
                <select data-role="admin-status">
                  ${["pending", "reviewed", "openchat_created", "matched"].map((status) => `<option value="${status}" ${submission.adminStatus === status ? "selected" : ""}>${status}</option>`).join("")}
                </select>
              </div>
              <div class="admin-field">
                <label>외모 후보 지정</label>
                ${renderCandidateCheckboxes(submission, "appearance")}
              </div>
              <div class="admin-field">
                <label>성격 후보 지정</label>
                ${renderCandidateCheckboxes(submission, "personality")}
              </div>
              <div class="admin-field">
                <label>관리자 메모</label>
                <textarea rows="4" data-role="admin-note">${escapeHtml(submission.adminNote || "")}</textarea>
              </div>
              <div class="admin-actions">
                <button type="button" class="primary-button" data-action="save-admin" data-id="${escapeHtml(submission.id)}">저장</button>
              </div>
            </article>`
          )
          .join("")}
      </section>
      <section class="admin-section admin-card">
        <div class="match-pack-head">
          <div>
            <h3>상호 매칭 목록</h3>
            <div class="section-caption">서로를 후보로 지정한 신청자끼리만 표시됩니다.</div>
          </div>
        </div>
        ${
          state.mutualMatches.length === 0
            ? `<div class="admin-empty">아직 상호 매칭된 조합이 없습니다.</div>`
            : `<div class="admin-table-wrap">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>이름 A</th>
                      <th>전화번호 A</th>
                      <th>이름 B</th>
                      <th>전화번호 B</th>
                      <th>동의 A</th>
                      <th>동의 B</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${state.mutualMatches
                      .map(
                        (item) => `<tr>
                          <td>${escapeHtml(item.leftName)}</td>
                          <td>${escapeHtml(item.leftPhone)}</td>
                          <td>${escapeHtml(item.rightName)}</td>
                          <td>${escapeHtml(item.rightPhone)}</td>
                          <td>${escapeHtml(item.leftConsent ? "동의" : "미동의")}</td>
                          <td>${escapeHtml(item.rightConsent ? "동의" : "미동의")}</td>
                        </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>`
        }
      </section>
    </main>
  </div>`;
}

function renderLogin() {
  return `<div class="shell">
    <div class="admin-login">
      <div class="brand">
        <div class="brand-mark">Ideal Type Editorial</div>
        <div class="brand-title">Admin Login</div>
      </div>
      <input type="text" data-role="login-username" placeholder="아이디" />
      <input type="password" data-role="login-password" placeholder="비밀번호" />
      <button type="button" class="primary-button" data-action="admin-login">${state.loading ? `<span class="loader"></span>` : "로그인"}</button>
      ${state.error ? `<div class="admin-empty">${escapeHtml(state.error)}</div>` : ""}
    </div>
  </div>`;
}

function render() {
  app.innerHTML = state.auth ? renderDashboard() : renderLogin();
  bindEvents();
}

function bindEvents() {
  app.querySelector("[data-action='admin-login']")?.addEventListener("click", async () => {
    const username = app.querySelector("[data-role='login-username']").value.trim();
    const password = app.querySelector("[data-role='login-password']").value.trim();
    state.auth = { username, password };
    await loadDashboard();
  });

  app.querySelector("[data-action='refresh-admin']")?.addEventListener("click", async () => {
    await loadDashboard();
  });

  app.querySelector("[data-action='export-admin']")?.addEventListener("click", async () => {
    try {
      await exportMatches();
    } catch (error) {
      state.error = error.message;
      render();
    }
  });

  app.querySelectorAll("[data-action='save-admin']").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await saveSubmission(button.closest("[data-submission-id]"), button.dataset.id);
      } catch (error) {
        state.error = error.message;
        render();
      }
    });
  });
}

render();
