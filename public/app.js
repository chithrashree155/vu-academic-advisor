/**
 * VU Advisor — Client Application Engine
 * Handles Private Student Authentication, Advisory Queries, UI Rendering, and Source Citations.
 */

'use strict';

let activeStudentProfile = null;
let isSubmitting = false;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });
} else {
  initApp();
}

function initApp() {
  setupNavigation();
  setupQuickAskButtons();
  setupChatForm();
  loadStudentIdList();

  // Auto-scroll to advisor if URL has #advisor
  if (window.location.hash === '#advisor') {
    scrollToAdvisor();
  }
}

// ── NAVIGATION & SCROLL ──
function setupNavigation() {
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }

  // Smooth scroll links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
        if (navLinks) navLinks.classList.remove('mobile-open');
      }
    });
  });
}

function scrollToAdvisor() {
  const el = document.getElementById('advisor');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ── STUDENT AUTHENTICATION / ACCESS SYSTEM ──
async function loadStudentIdList() {
  try {
    const res = await fetch('/api/student/list');
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.students)) {
      const selectEl = document.getElementById('studentIdSelect');
      if (selectEl) {
        selectEl.innerHTML = '<option value="">-- Select Student ID --</option>';
        data.students.forEach(st => {
          const opt = document.createElement('option');
          opt.value = st.id;
          opt.textContent = `${st.id} — ${st.display_name} (${st.programName})`;
          selectEl.appendChild(opt);
        });
      }
    }
  } catch (err) {
    console.error('Failed to load student ID list:', err);
  }
}

function openStudentModal() {
  const modal = document.getElementById('studentModal');
  if (modal) modal.classList.remove('hidden');
}

function closeStudentModal() {
  const modal = document.getElementById('studentModal');
  if (modal) modal.classList.add('hidden');
}

async function handleStudentSignIn(e) {
  e.preventDefault();
  const selectVal = document.getElementById('studentIdSelect')?.value;
  const manualVal = document.getElementById('manualStudentId')?.value?.trim();
  const targetId = manualVal || selectVal;

  if (!targetId) {
    alert('Please select or enter a Student ID (e.g. VU-DEMO-001).');
    return;
  }

  try {
    const res = await fetch('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: targetId })
    });
    const data = await res.json();

    if (data.status === 'success' && data.profile) {
      activeStudentProfile = data.profile;
      updateAuthUI();
      closeStudentModal();
      scrollToAdvisor();
    } else {
      alert(data.message || 'Invalid Student ID. Please try again.');
    }
  } catch (err) {
    console.error('Sign-in error:', err);
    alert('Error connecting to server. Please try again.');
  }
}

function signOutStudent() {
  activeStudentProfile = null;
  updateAuthUI();
  closeProfileDrawer();
}

function updateAuthUI() {
  const loggedOutWrap = document.getElementById('navAuthLoggedOut');
  const loggedInWrap = document.getElementById('navAuthLoggedIn');
  const contextBanner = document.getElementById('studentContextBanner');

  if (activeStudentProfile) {
    if (loggedOutWrap) loggedOutWrap.classList.add('hidden');
    if (loggedInWrap) loggedInWrap.classList.remove('hidden');

    const initials = activeStudentProfile.display_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

    const avatarEl = document.getElementById('navAvatar');
    const nameEl = document.getElementById('navUserName');
    const progEl = document.getElementById('navUserProg');

    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = activeStudentProfile.display_name;
    if (progEl) progEl.textContent = activeStudentProfile.program_type || 'Student';

    if (contextBanner) {
      contextBanner.classList.remove('hidden');
      const scbName = document.getElementById('scbName');
      const scbProg = document.getElementById('scbProg');
      if (scbName) scbName.textContent = activeStudentProfile.display_name;
      if (scbProg) scbProg.textContent = activeStudentProfile.programName;
    }
  } else {
    if (loggedOutWrap) loggedOutWrap.classList.remove('hidden');
    if (loggedInWrap) loggedInWrap.classList.add('hidden');
    if (contextBanner) contextBanner.classList.add('hidden');
  }
}

// ── MY PROFILE DRAWER ──
function openProfileDrawer() {
  if (!activeStudentProfile) {
    openStudentModal();
    return;
  }

  const drawer = document.getElementById('profileDrawer');
  if (!drawer) return;

  const p = activeStudentProfile;
  const initials = p.display_name.split(' ').map(n => n[0]).join('').toUpperCase();

  const dAvatar = document.getElementById('drawerAvatar');
  const dName = document.getElementById('drawerName');
  const dProg = document.getElementById('drawerProg');
  const dId = document.getElementById('drawerId');
  const dSem = document.getElementById('drawerSem');
  const dCgpa = document.getElementById('drawerCgpa');
  const dAtt = document.getElementById('drawerAtt');
  const dFeeBadge = document.getElementById('drawerFeeBadge');

  if (dAvatar) dAvatar.textContent = initials;
  if (dName) dName.textContent = p.display_name;
  if (dProg) dProg.textContent = p.programName;
  if (dId) dId.textContent = p.id;
  if (dSem) dSem.textContent = `Semester ${p.semester}`;
  if (dCgpa) dCgpa.textContent = p.cgpa ? p.cgpa.toFixed(2) : 'N/A';
  if (dAtt) dAtt.textContent = `${p.attendance}%`;

  if (dFeeBadge) {
    if (p.feeCleared) {
      dFeeBadge.className = 'status-pill status-good';
      dFeeBadge.textContent = '✓ Fees Cleared';
    } else {
      dFeeBadge.className = 'status-pill status-bad';
      dFeeBadge.textContent = '⚠ Fees Pending';
    }
  }

  // Completed Courses
  const completedWrap = document.getElementById('drawerCompletedCourses');
  if (completedWrap) {
    if (p.completedCourses && p.completedCourses.length > 0) {
      completedWrap.innerHTML = p.completedCourses.map(c => `
        <div class="dc-row">
          <span class="dc-code">${escHtml(c.courseCode)}</span>
          <span class="dc-name">${escHtml(c.courseName)}</span>
          <span class="dc-grade">Grade: ${escHtml(c.grade)} (${c.credits} cr)</span>
        </div>
      `).join('');
    } else {
      completedWrap.innerHTML = '<p class="dc-empty">No completed courses recorded.</p>';
    }
  }

  // Current Courses
  const currentWrap = document.getElementById('drawerCurrentCourses');
  if (currentWrap) {
    if (p.currentCourses && p.currentCourses.length > 0) {
      currentWrap.innerHTML = p.currentCourses.map(c => `<span class="dc-chip">${escHtml(c)}</span>`).join('');
    } else {
      currentWrap.innerHTML = '<p class="dc-empty">Enrolled in standard semester basket.</p>';
    }
  }

  drawer.classList.remove('hidden');
}

function closeProfileDrawer() {
  const drawer = document.getElementById('profileDrawer');
  if (drawer) drawer.classList.add('hidden');
}

function askAboutMyEligibility() {
  closeProfileDrawer();
  scrollToAdvisor();
  sendQuery('Can I take DATA302?');
}

// ── QUICK ASK BUTTONS ──
function setupQuickAskButtons() {
  document.querySelectorAll('.ql-btn, .qa-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      if (q) {
        scrollToAdvisor();
        sendQuery(q);
      }
    });
  });
}

// ── CHAT FORM & ADVISORY ENGINE CONNECTION ──
function setLoading(loading) {
  isSubmitting = loading;
  const submitBtn = document.getElementById('submitBtn');
  const btnIcon = document.getElementById('btnIcon');
  const spinner = document.getElementById('spinner');
  const input = document.getElementById('queryInput');
  const thinking = document.getElementById('thinkingWrap');

  if (submitBtn) {
    submitBtn.disabled = loading;
    if (loading) {
      submitBtn.setAttribute('aria-busy', 'true');
    } else {
      submitBtn.removeAttribute('aria-busy');
    }
  }

  if (input) {
    input.disabled = loading;
  }

  if (btnIcon) {
    if (loading) btnIcon.classList.add('hidden');
    else btnIcon.classList.remove('hidden');
  }

  if (spinner) {
    if (loading) spinner.classList.remove('hidden');
    else spinner.classList.add('hidden');
  }

  if (thinking) {
    if (loading) thinking.classList.remove('hidden');
    else thinking.classList.add('hidden');
  }

  if (!loading && input) {
    setTimeout(() => {
      try { input.focus(); } catch (_) {}
    }, 50);
  }
}

function setupChatForm() {
  const form = document.getElementById('advisorForm');
  const input = document.getElementById('queryInput');
  const submitBtn = document.getElementById('submitBtn');

  const doSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSubmitting) return;
    const text = input ? input.value.trim() : '';
    if (text) {
      input.value = '';
      sendQuery(text);
    }
  };

  if (form) {
    form.addEventListener('submit', doSubmit);
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', doSubmit);
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        doSubmit(e);
      }
    });
  }
}

let chatHistoryStore = [];

async function sendQuery(queryText) {
  if (isSubmitting || !queryText) return;
  setLoading(true);

  // Hide welcome state
  const welcome = document.getElementById('welcomeState');
  if (welcome) welcome.classList.add('hidden');

  // Render User Message
  renderUserMessage(queryText);
  chatHistoryStore.push({ sender: 'user', text: queryText });

  const history = document.getElementById('chatHistory');
  if (history) history.scrollTop = history.scrollHeight;

  try {
    const payload = {
      query: queryText,
      profileId: activeStudentProfile ? activeStudentProfile.id : null,
      history: chatHistoryStore.slice(-6)
    };

    const res = await fetch('/api/advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let data = null;
    try {
      data = await res.json();
    } catch (parseErr) {
      data = null;
    }

    if (res.ok && data && (data.answer || data.state)) {
      chatHistoryStore.push({ sender: 'advisor', text: data.answer });
      renderAdvisorMessage(data);
    } else if (data && data.answer) {
      chatHistoryStore.push({ sender: 'advisor', text: data.answer });
      renderAdvisorMessage(data);
    } else {
      const errorMessage = (data && (data.error || data.message))
        || `The advisory service returned status ${res.status}. Please check your connection or try again.`;
      renderAdvisorMessage({
        state: 'INSUFFICIENT_INFORMATION',
        answer: errorMessage,
        sources: []
      });
    }
  } catch (err) {
    console.error('Advisor query error:', err);
    renderAdvisorMessage({
      state: 'INSUFFICIENT_INFORMATION',
      answer: "Unable to reach the advisory server. Please check your internet connection or try again shortly.",
      sources: []
    });
  } finally {
    setLoading(false);
  }
}

function renderUserMessage(text) {
  const history = document.getElementById('chatHistory');
  if (!history) return;

  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-msg-user';
  msg.innerHTML = `
    <div class="msg-bubble msg-bubble-user">
      <div class="msg-text">${escHtml(text)}</div>
    </div>
  `;
  history.appendChild(msg);
  history.scrollTop = history.scrollHeight;
}

function renderAdvisorMessage(data) {
  const history = document.getElementById('chatHistory');
  if (!history) return;

  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-msg-advisor';

  const stateClass = `state-${data.state || 'ANSWERABLE'}`;
  const stateLabel = (data.state || 'ANSWERABLE').replace(/_/g, ' ');

  let sourcesHtml = '';
  if (Array.isArray(data.sources) && data.sources.length > 0) {
    const items = data.sources.map(s => `
      <div class="source-item">
        <div class="source-header">
          <span class="source-doc">📄 ${escHtml(s.documentTitle)}</span>
          ${s.clauseNumber ? `<span class="source-clause">${escHtml(s.clauseNumber)}</span>` : ''}
        </div>
        ${s.excerpt ? `<p class="source-excerpt">"${escHtml(s.excerpt)}"</p>` : ''}
      </div>
    `).join('');

    sourcesHtml = `
      <div class="sources-box">
        <div class="sources-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          VERIFIED SOURCE EVIDENCE
        </div>
        <div class="sources-list">${items}</div>
      </div>
    `;
  }

  let followUpHtml = '';
  if (data.followUp) {
    followUpHtml = `<div class="followup-box">💡 <strong>Suggested:</strong> ${escHtml(data.followUp)}</div>`;
  }

  msg.innerHTML = `
    <div class="advisor-avatar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
    </div>
    <div class="msg-bubble msg-bubble-advisor">
      <div class="msg-header">
        <span class="state-tag ${stateClass}">${escHtml(stateLabel)}</span>
        <span class="msg-author">VU Advisor</span>
      </div>
      <div class="msg-text">${formatMarkdown(data.answer || '')}</div>
      ${followUpHtml}
      ${sourcesHtml}
    </div>
  `;

  history.appendChild(msg);
  history.scrollTop = history.scrollHeight;
}

function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMarkdown(text) {
  if (!text) return '';
  let formatted = escHtml(text);
  formatted = formatted.replace(/\n\n/g, '</p><p>');
  formatted = formatted.replace(/\n/g, '<br>');
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/✓/g, '<span style="color:#059669;font-weight:600;">✓</span>');
  formatted = formatted.replace(/⚠/g, '<span style="color:#d97706;font-weight:600;">⚠</span>');
  formatted = formatted.replace(/❌/g, '<span style="color:#dc2626;font-weight:600;">❌</span>');
  return `<p>${formatted}</p>`;
}
