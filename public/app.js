/**
 * VU AI Faculty Advisor — Premium Frontend Controller v3
 * Dark glassmorphism UI · 15 synthetic profiles · ChatGPT-style chat
 */

'use strict';

/* ══════════ STATE ══════════ */
let currentProfileId = null;
let allProfiles = [];
let filteredProfiles = [];
let isLoading = false;
let currentProgramFilter = '';

/* ══════════ CONSTANTS ══════════ */
const PROGRAM_SHORT = {
  'BTECH_DS':         'B.Tech · Data Science',
  'BTECH_AIML':       'B.Tech · AI/ML',
  'BMS_DB':           'BMS · Digital Business',
  'BMS_DB_RESEARCH':  'BMS · DB Research',
  'BA_PSY':           'BA · Psychology',
  'BA_ECO':           'BA · Economics',
  'BA_PSY_RESEARCH':  'BA · Psych Research',
  'BA_ECO_RESEARCH':  'BA · Eco Research',
  'BDES_CD':          'B.Des · Comm Design',
  'BA_LLB':           'BA, LLB',
  'BMS_LLB':          'BMS, LLB'
};

const STATE_META = {
  'ANSWERABLE': {
    icon: '✓',
    label: 'Answered from university sources'
  },
  'NEEDS_STUDENT_INFORMATION': {
    icon: '◉',
    label: 'More information needed'
  },
  'NEEDS_CLARIFICATION': {
    icon: '?',
    label: 'Please clarify'
  },
  'INSUFFICIENT_INFORMATION': {
    icon: '!',
    label: 'Information unavailable'
  },
  'CONFLICTING_SOURCES': {
    icon: '⚡',
    label: 'Conflicting information'
  },
  'OUT_OF_SCOPE': {
    icon: '○',
    label: 'Outside academic scope'
  }
};

/* ══════════ INIT ══════════ */
document.addEventListener('DOMContentLoaded', async () => {
  setupNav();
  await loadProfiles();
  setupEventListeners();
  setupKeyboardShortcuts();
});

/* ══════════ NAV SCROLL ══════════ */
function setupNav() {
  const nav = document.getElementById('topnav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

function scrollToAdvisor() {
  document.getElementById('advisor').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.getElementById('queryInput')?.focus(), 600);
}
window.scrollToAdvisor = scrollToAdvisor;

/* ══════════ PROFILES ══════════ */
async function loadProfiles() {
  try {
    const res = await fetch('/api/profiles');
    const data = await res.json();
    allProfiles = data.profiles || [];
    filteredProfiles = allProfiles;
    renderProfileList();
    renderDemoProfilesSection();
  } catch (err) {
    console.error('Failed to load profiles:', err);
    updateNavStatus(false);
  }
}

function applyProgramFilter(programCode) {
  currentProgramFilter = programCode;
  filteredProfiles = programCode
    ? allProfiles.filter(p => p.program === programCode)
    : allProfiles;

  if (currentProfileId && !filteredProfiles.find(p => p.id === currentProfileId)) {
    currentProfileId = null;
    document.getElementById('activeProfileCard').classList.add('hidden');
    updateInputContextBar();
  }
  renderProfileList();
}

window.filterByProgram = function(programCode, label) {
  // Set the program filter dropdown
  const sel = document.getElementById('programFilter');
  if (sel) sel.value = programCode;
  applyProgramFilter(programCode);
  // Scroll to advisor
  document.getElementById('profile-section').scrollIntoView({ behavior: 'smooth' });
};

function renderProfileList() {
  const container = document.getElementById('profileGrid');
  if (!container) return;
  container.innerHTML = '';

  // No profile item
  const noItem = buildProfileItem(null, '—', 'No Profile', 'General / Prospective', null);
  container.appendChild(noItem);

  const profiles = filteredProfiles.length > 0 ? filteredProfiles : allProfiles;

  profiles.forEach((p, idx) => {
    const num = String(allProfiles.indexOf(p) + 1).padStart(2, '0');
    const item = buildProfileItem(p.id, num, p.display_name, PROGRAM_SHORT[p.program] || p.program, p);
    container.appendChild(item);
  });

  if (filteredProfiles.length === 0 && currentProgramFilter) {
    const note = document.createElement('p');
    note.style.cssText = 'padding:12px;font-size:0.73rem;color:var(--text-subtle);font-style:italic;text-align:center;';
    note.textContent = 'No students match this filter.';
    container.appendChild(note);
  }
}

function buildProfileItem(id, num, name, prog, profileObj) {
  const el = document.createElement('div');
  el.className = `pi-item ${id === null ? 'pi-item-none' : ''} ${currentProfileId === id ? 'selected' : ''}`;
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('id', `pi-${id === null ? 'none' : id}`);

  let dotClass = 'pi-dot-neutral';
  if (profileObj) {
    if (profileObj.attendance < 75 || !profileObj.feeCleared) dotClass = 'pi-dot-amber';
    else if (profileObj.attendance >= 85) dotClass = 'pi-dot-green';
  }

  el.innerHTML = `
    <div class="pi-num ${id === null ? 'pi-none' : ''}">${escHtml(num)}</div>
    <div class="pi-info">
      <div class="pi-name-v2">${escHtml(name)}</div>
      <div class="pi-prog">${escHtml(prog)}</div>
    </div>
    <div class="pi-status">
      <div class="pi-dot-status ${dotClass}"></div>
    </div>
  `;

  el.addEventListener('click', () => selectProfile(id, profileObj));
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectProfile(id, profileObj); }
  });

  return el;
}

function selectProfile(profileId, profileObj) {
  currentProfileId = profileId;
  renderProfileList();
  renderDemoProfilesSection();
  renderActiveProfileCard(profileObj);
  updateInputContextBar();
}

function renderActiveProfileCard(p) {
  const card = document.getElementById('activeProfileCard');
  if (!p) { card.classList.add('hidden'); return; }

  card.classList.remove('hidden');
  const num = String(allProfiles.indexOf(p) + 1).padStart(2, '0');
  document.getElementById('apcAvatar').textContent = num;
  document.getElementById('apcName').textContent = p.display_name;
  document.getElementById('apcProgram').textContent = p.programName;

  const attClass = p.attendance >= 75 ? 'good' : 'bad';
  const feeClass = p.feeCleared ? 'good' : 'bad';

  let coursesHtml = '';
  if (p.completedCourses && p.completedCourses.length > 0) {
    const chips = p.completedCourses.map(c =>
      `<span class="apc-chip" title="${escHtml(c.courseName)} · ${escHtml(c.grade)}">${escHtml(c.courseCode)}</span>`
    ).join('');
    coursesHtml = `
      <div class="apc-courses-title">Completed Courses</div>
      <div class="apc-chips">${chips}</div>
    `;
  } else {
    coursesHtml = `<div class="apc-no-courses">No course data in source files for this program.</div>`;
  }

  let currentCoursesHtml = '';
  if (p.currentCourses && p.currentCourses.length > 0) {
    const chips = p.currentCourses.map(c =>
      `<span class="apc-chip current">${escHtml(c)}</span>`
    ).join('');
    currentCoursesHtml = `
      <div class="apc-courses-title" style="margin-top:8px;">Current Courses</div>
      <div class="apc-chips">${chips}</div>
    `;
  }

  document.getElementById('apcDetails').innerHTML = `
    <div class="apc-row">
      <span class="apc-label">ID</span>
      <span class="apc-val" style="font-family:monospace;font-size:0.68rem;">${escHtml(p.id)}</span>
    </div>
    <div class="apc-row">
      <span class="apc-label">Batch</span>
      <span class="apc-val">${escHtml(String(p.batch))} · Sem ${p.semester}</span>
    </div>
    <div class="apc-row">
      <span class="apc-label">CGPA</span>
      <span class="apc-val">${p.cgpa}</span>
    </div>
    <div class="apc-row">
      <span class="apc-label">Attendance</span>
      <span class="apc-val ${attClass}">${p.attendance}%</span>
    </div>
    <div class="apc-row">
      <span class="apc-label">Fees</span>
      <span class="apc-val ${feeClass}">${p.feeCleared ? 'Cleared ✓' : 'Pending ⚠'}</span>
    </div>
    ${coursesHtml}
    ${currentCoursesHtml}
  `;
}

function updateInputContextBar() {
  const bar = document.getElementById('inputContextBar');
  if (!bar) return;

  if (currentProfileId && allProfiles.find(p => p.id === currentProfileId)) {
    const p = allProfiles.find(x => x.id === currentProfileId);
    bar.innerHTML = `
      <div class="ctx-pill">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ${escHtml(p.display_name)} · ${escHtml(PROGRAM_SHORT[p.program] || p.program)} · Sem ${p.semester}
      </div>
    `;
  } else {
    bar.innerHTML = '';
  }
}

/* Demo profiles section (the big card grid) */
function renderDemoProfilesSection() {
  const grid = document.getElementById('demoProfilesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  allProfiles.forEach((p) => {
    const num = String(allProfiles.indexOf(p) + 1).padStart(2, '0');
    const card = document.createElement('div');
    card.className = `dp-card ${currentProfileId === p.id ? 'dp-selected' : ''}`;
    card.setAttribute('id', `dp-${p.id}`);

    card.innerHTML = `
      <div class="dp-header">
        <div class="dp-avatar">${num}</div>
        <div>
          <div class="dp-name">${escHtml(p.display_name)}</div>
          <div class="dp-prog">${escHtml(PROGRAM_SHORT[p.program] || p.program)}</div>
        </div>
      </div>
      <div class="dp-tags">
        <span class="dp-tag dp-tag-sem">Sem ${p.semester}</span>
        <span class="dp-tag">Batch ${escHtml(String(p.batch))}</span>
        <span class="dp-tag dp-tag-synth">⚗ Synthetic</span>
        ${p.attendance < 75 ? '<span class="dp-tag" style="background:rgba(245,158,11,0.15);color:#fbbf24;border-color:rgba(245,158,11,0.25);">⚠ Att</span>' : ''}
        ${!p.feeCleared ? '<span class="dp-tag" style="background:rgba(239,68,68,0.1);color:#f87171;border-color:rgba(239,68,68,0.2);">Fees Pending</span>' : ''}
      </div>
      <button class="dp-select-btn" id="dp-btn-${p.id}">
        ${currentProfileId === p.id ? '✓ Selected' : 'Select Profile'}
      </button>
    `;

    card.addEventListener('click', () => {
      selectProfile(p.id, p);
      document.getElementById('advisor').scrollIntoView({ behavior: 'smooth' });
    });

    grid.appendChild(card);
  });
}

/* ══════════ EVENT LISTENERS ══════════ */
function setupEventListeners() {
  const form = document.getElementById('advisorForm');
  const programFilter = document.getElementById('programFilter');

  // Program filter
  if (programFilter) {
    programFilter.addEventListener('change', () => {
      applyProgramFilter(programFilter.value);
    });
  }

  // Close active profile
  const apcClose = document.getElementById('apcClose');
  if (apcClose) {
    apcClose.addEventListener('click', () => {
      selectProfile(null, null);
    });
  }

  // Quick action cards (hero area)
  document.querySelectorAll('.qa-card[data-query]').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      if (q) {
        document.getElementById('advisor').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => submitQuery(q), 400);
      }
    });
  });

  // Quick list buttons (right panel)
  document.querySelectorAll('.ql-btn[data-query]').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      if (q) submitQuery(q);
    });
  });

  // Form submit
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const q = document.getElementById('queryInput')?.value.trim();
      if (q && !isLoading) submitQuery(q);
    });
  }
}

function setupKeyboardShortcuts() {
  const input = document.getElementById('queryInput');
  if (!input) return;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const q = input.value.trim();
      if (q && !isLoading) submitQuery(q);
    }
  });
}

/* ══════════ QUERY SUBMISSION ══════════ */
async function submitQuery(query) {
  if (isLoading) return;
  isLoading = true;

  const queryInput  = document.getElementById('queryInput');
  const submitBtn   = document.getElementById('submitBtn');
  const spinner     = document.getElementById('spinner');
  const btnIcon     = document.getElementById('btnIcon');

  // Hide welcome, show history
  const welcomeEl = document.getElementById('welcomeState');
  if (welcomeEl) welcomeEl.style.display = 'none';

  queryInput.value = '';
  queryInput.disabled = true;
  submitBtn.disabled = true;
  if (spinner) { spinner.classList.remove('hidden'); }
  if (btnIcon)  { btnIcon.classList.add('hidden'); }

  appendUserBubble(query);
  showThinking(true);

  try {
    const res = await fetch('/api/advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, profileId: currentProfileId })
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();
    showThinking(false);
    appendAdvisorResponse(data);
  } catch (err) {
    console.error('Advisory error:', err);
    showThinking(false);
    appendError(err.message || 'Failed to connect to the advisory server.');
  } finally {
    isLoading = false;
    queryInput.disabled = false;
    queryInput.focus();
    submitBtn.disabled = false;
    if (spinner) spinner.classList.add('hidden');
    if (btnIcon)  btnIcon.classList.remove('hidden');
  }
}

/* ══════════ CHAT RENDERING ══════════ */
function appendUserBubble(query) {
  const chatHistory = document.getElementById('chatHistory');
  const turn = document.createElement('div');
  turn.className = 'chat-turn';

  const profile = currentProfileId ? allProfiles.find(p => p.id === currentProfileId) : null;
  const ctxTag = profile
    ? `<span class="user-ctx-tag">${escHtml(profile.display_name)} · ${escHtml(PROGRAM_SHORT[profile.program] || profile.program)}</span>`
    : '';

  turn.innerHTML = `
    <div class="user-msg-wrap">
      <div class="user-bubble-col">
        ${ctxTag}
        <div class="user-bubble">${escHtml(query)}</div>
      </div>
    </div>
  `;
  chatHistory.appendChild(turn);
  scrollToBottom();
  return turn;
}

function appendAdvisorResponse(data) {
  const chatHistory = document.getElementById('chatHistory');
  const lastTurn = chatHistory.querySelector('.chat-turn:last-child');

  const stateClass = data.state || 'ANSWERABLE';
  const sm = STATE_META[stateClass] || { icon: '·', label: stateClass.replace(/_/g, ' ') };
  const latency = data.latencyMs ? `${(data.latencyMs / 1000).toFixed(1)}s` : '';

  const formattedAnswer = formatAnswer(data.answer || 'No response returned.');

  // Rule block
  let ruleHtml = '';
  if (data.ruleResults) {
    ruleHtml = `
      <div class="rule-block">
        <div class="rule-block-title"><span>⚡</span> Rules Engine Output</div>
        <div class="rule-block-body">${escHtml(JSON.stringify(data.ruleResults, null, 2))}</div>
      </div>
    `;
  }

  // Sources
  let sourcesHtml = '';
  if (data.sources && data.sources.length > 0) {
    const cards = data.sources.map(s => {
      const isWeb = s.documentTitle && (s.documentTitle.includes('Website') || s.documentTitle.includes('website'));
      return `
        <div class="src-card ${isWeb ? 'src-web' : ''}">
          <div class="src-row">
            <div class="src-name">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              ${escHtml(s.documentTitle)}
            </div>
            <span class="src-tier ${isWeb ? 'src-tier-web' : ''}">${isWeb ? 'Web' : `Tier ${s.hierarchyLevel}`}</span>
          </div>
          ${s.pageOrSheet && s.pageOrSheet !== 'N/A' ? `<div class="src-ref">${escHtml(s.pageOrSheet)}${s.clauseNumber && s.clauseNumber !== 'N/A' ? ' · ' + escHtml(s.clauseNumber) : ''}</div>` : ''}
          ${s.excerpt ? `<div class="src-excerpt">"${escHtml(s.excerpt.slice(0, 200))}${s.excerpt.length > 200 ? '…' : ''}"</div>` : ''}
        </div>
      `;
    }).join('');

    sourcesHtml = `
      <div class="sources-block">
        <div class="sources-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Sources (${data.sources.length})
        </div>
        <div class="source-cards">${cards}</div>
      </div>
    `;
  }

  const html = `
    <div class="advisor-card">
      <div class="ac-header">
        <div class="ac-meta">
          <div class="ac-avatar-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span class="ac-name">VU Faculty Advisor</span>
        </div>
        <div class="ac-state-row">
          <span class="state-pill state-${stateClass}">${escHtml(sm.icon)} ${escHtml(sm.label)}</span>
          ${latency ? `<span class="latency-tag">${latency}</span>` : ''}
        </div>
      </div>
      <div class="ac-body">
        <div class="answer-text-v2">${formattedAnswer}</div>
        ${ruleHtml}
      </div>
      ${sourcesHtml}
    </div>
  `;

  if (lastTurn) {
    lastTurn.insertAdjacentHTML('beforeend', html);
  } else {
    const t = document.createElement('div');
    t.className = 'chat-turn';
    t.innerHTML = html;
    document.getElementById('chatHistory').appendChild(t);
  }

  scrollToBottom();
}

function formatAnswer(text) {
  // Escape first, then convert newlines and bold markers
  let s = escHtml(text);
  // newlines → <br>
  s = s.replace(/\n/g, '<br>');
  // bullet points already have • — keep them, just ensure br before
  return s;
}

function appendError(message) {
  const chatHistory = document.getElementById('chatHistory');
  const lastTurn = chatHistory.querySelector('.chat-turn:last-child');
  const html = `
    <div class="error-msg">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      <p><strong>Error:</strong> ${escHtml(message)}</p>
    </div>
  `;
  if (lastTurn) lastTurn.insertAdjacentHTML('beforeend', html);
  scrollToBottom();
}

/* ══════════ UI HELPERS ══════════ */
function showThinking(show) {
  const el = document.getElementById('thinkingWrap');
  if (!el) return;
  if (show) { el.classList.remove('hidden'); scrollToBottom(); }
  else { el.classList.add('hidden'); }
}

function scrollToBottom() {
  const chatBody = document.getElementById('chatBody');
  if (!chatBody) return;
  setTimeout(() => {
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
  }, 50);
}

function updateNavStatus(online = true) {
  const dot  = document.querySelector('.nav-status-dot');
  const text = document.querySelector('.nav-status-text');
  if (!dot || !text) return;
  if (!online) {
    dot.style.background = 'var(--red-500)';
    dot.style.boxShadow  = '0 0 8px rgba(239,68,68,0.7)';
    text.textContent = 'Error';
  }
}

/* ══════════ SECURITY ══════════ */
function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
