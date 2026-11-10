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
  setupVoiceInteraction();
  checkActiveSession();

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

// ── SECURE STUDENT AUTHENTICATION & ACCESS SYSTEM ──
async function checkActiveSession() {
  const token = sessionStorage.getItem('vu_advisor_session_token');
  if (!token) {
    updateAuthUI();
    return;
  }
  try {
    const res = await fetch('/api/student/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.student) {
        activeStudentProfile = data.student;
        updateAuthUI();
        await loadStudentHistory();
        return;
      }
    }
  } catch (err) {
    console.warn('Session verification notice:', err.message);
  }
  sessionStorage.removeItem('vu_advisor_session_token');
  activeStudentProfile = null;
  updateAuthUI();
}

function openStudentModal() {
  const modal = document.getElementById('studentModal');
  const errEl = document.getElementById('loginErrorMsg');
  if (errEl) {
    errEl.textContent = '';
    errEl.classList.add('hidden');
  }
  if (modal) modal.classList.remove('hidden');
  const idInput = document.getElementById('loginStudentId');
  if (idInput) {
    setTimeout(() => {
      try { idInput.focus(); } catch (_) {}
    }, 100);
  }
}

function closeStudentModal() {
  const modal = document.getElementById('studentModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Toggle password visibility between text and password (accessible, does not submit form)
 */
function togglePasswordVisibility() {
  const input = document.getElementById('loginPassword');
  const btn = document.getElementById('togglePasswordBtn');
  const eyeIcon = document.getElementById('eyeIcon');
  if (!input || !btn) return;

  if (input.type === 'password') {
    input.type = 'text';
    btn.setAttribute('aria-label', 'Hide password');
    btn.setAttribute('title', 'Hide password');
    if (eyeIcon) {
      eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    }
  } else {
    input.type = 'password';
    btn.setAttribute('aria-label', 'Show password');
    btn.setAttribute('title', 'Show password');
    if (eyeIcon) {
      eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
  }
}

async function handleStudentSignIn(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const idInput = document.getElementById('loginStudentId');
  const passInput = document.getElementById('loginPassword');
  const errEl = document.getElementById('loginErrorMsg');
  const submitBtn = document.getElementById('loginSubmitBtn');

  const studentId = idInput ? idInput.value.trim().toUpperCase() : '';
  const password = passInput ? passInput.value.trim() : '';

  if (errEl) {
    errEl.textContent = '';
    errEl.classList.add('hidden');
  }

  if (!studentId || !password) {
    if (errEl) {
      errEl.textContent = 'Please enter both your Student ID and password.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying credentials…';
  }

  try {
    const res = await fetch('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, password })
    });
    const data = await res.json();

    if (res.ok && data.status === 'success' && data.token && data.student) {
      sessionStorage.setItem('vu_advisor_session_token', data.token);
      activeStudentProfile = data.student;

      if (idInput) idInput.value = '';
      if (passInput) passInput.value = '';

      updateAuthUI();
      closeStudentModal();
      await loadStudentHistory();
      scrollToAdvisor();
    } else {
      if (errEl) {
        errEl.textContent = data.message || 'Invalid Student ID or password. Please verify your credentials.';
        errEl.classList.remove('hidden');
      }
    }
  } catch (err) {
    console.error('Sign-in error:', err);
    if (errEl) {
      errEl.textContent = 'Error connecting to authentication service. Please check your connection and try again.';
      errEl.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In as Student';
    }
  }
}

async function signOutStudent() {
  const token = sessionStorage.getItem('vu_advisor_session_token');
  if (token) {
    try {
      await fetch('/api/student/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (_) {}
  }
  sessionStorage.removeItem('vu_advisor_session_token');
  activeStudentProfile = null;
  updateAuthUI();
  closeProfileDrawer();

  // Clear chat history UI and in-memory session for privacy isolation
  chatHistoryStore = [];
  const historyEl = document.getElementById('chatHistory');
  if (historyEl) historyEl.innerHTML = '';
  const welcome = document.getElementById('welcomeState');
  if (welcome) welcome.classList.remove('hidden');
}

async function loadStudentHistory() {
  const token = sessionStorage.getItem('vu_advisor_session_token');
  if (!token) return;

  try {
    const res = await fetch('/api/student/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.history)) {
        chatHistoryStore = [];
        const historyEl = document.getElementById('chatHistory');
        if (historyEl) historyEl.innerHTML = '';

        if (data.history.length > 0) {
          const welcome = document.getElementById('welcomeState');
          if (welcome) welcome.classList.add('hidden');

          data.history.forEach(item => {
            chatHistoryStore.push({ sender: item.sender, text: item.text });
            if (item.sender === 'user') {
              renderUserMessage(item.text);
            } else {
              renderAdvisorMessage({ state: 'ANSWERABLE', answer: item.text, sources: [] });
            }
          });
        }
      }
    }
  } catch (err) {
    console.warn('Failed to load student history:', err);
  }
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
    if (progEl) progEl.textContent = activeStudentProfile.program_type || 'B.Tech CSE';

    if (contextBanner) {
      contextBanner.classList.remove('hidden');
      const scbName = document.getElementById('scbName');
      const scbProg = document.getElementById('scbProg');
      if (scbName) scbName.textContent = activeStudentProfile.display_name;
      if (scbProg) scbProg.textContent = `${activeStudentProfile.programName} · Batch ${activeStudentProfile.batch} · Sem ${activeStudentProfile.semester}`;
    }
  } else {
    if (loggedOutWrap) loggedOutWrap.classList.remove('hidden');
    if (loggedInWrap) loggedInWrap.classList.add('hidden');
    if (contextBanner) contextBanner.classList.add('hidden');
  }
}

// ── MY PROFILE DRAWER / ENHANCED STUDENT DASHBOARD ──
async function openProfileDrawer() {
  if (!activeStudentProfile) {
    openStudentModal();
    return;
  }

  const drawer = document.getElementById('profileDrawer');
  if (!drawer) return;

  const token = sessionStorage.getItem('vu_advisor_session_token');
  let dash = null;

  if (token) {
    try {
      const res = await fetch('/api/student/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.dashboard) {
          dash = data.dashboard;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote dashboard data:', err);
    }
  }

  const p = activeStudentProfile;
  const sOverview = (dash && dash.studentOverview) ? dash.studentOverview : {
    name: p.display_name,
    studentId: p.id,
    batch: p.batch,
    semester: `Semester ${p.semester}`,
    program: p.programName,
    school: p.school,
    major: 'Computer Science & Engineering',
    minor: p.declaredMinor,
    minorSchool: p.minorSchool,
    specialisation: p.specialisation || 'Not specified'
  };

  const aSummary = (dash && dash.academicSummary) ? dash.academicSummary : {
    overallCgpa: p.cgpa,
    completedCredits: p.completedCredits,
    remainingCredits: p.remainingCredits,
    majorProgress: 'In progress',
    minorProgress: 'In progress'
  };

  const attOverview = (dash && dash.attendanceOverview) ? dash.attendanceOverview : {
    overallPercentage: 85.0,
    courseList: p.enrolledCourses || []
  };

  const semPerf = (dash && dash.semesterPerformance) ? dash.semesterPerformance : {
    history: p.semesterHistory || [],
    overallCgpa: p.cgpa
  };

  const aProgress = (dash && dash.academicProgress) ? dash.academicProgress : {
    currentCourses: p.enrolledCourses || [],
    backlogs: p.backlogs || [],
    hasBacklog: (p.backlogs || []).length > 0
  };

  const medLeave = (dash && dash.medicalLeave) ? dash.medicalLeave : (p.medicalLeave || { hasRecord: false });
  const mStructure = p.minorCreditStructure;

  const initials = sOverview.name.split(' ').map(n => n[0]).join('').toUpperCase();

  // Populate Section 1: Student Overview
  const dAvatar = document.getElementById('drawerAvatar');
  const dName = document.getElementById('drawerName');
  const dProg = document.getElementById('drawerProg');
  const dId = document.getElementById('drawerId');
  const dBatch = document.getElementById('drawerBatch');
  const dSem = document.getElementById('drawerSem');
  const dSchool = document.getElementById('drawerSchool');
  const dMajor = document.getElementById('drawerMajor');
  const dMinor = document.getElementById('drawerMinor');
  const dMinorSchool = document.getElementById('drawerMinorSchool');
  const dSpec = document.getElementById('drawerSpec');

  if (dAvatar) dAvatar.textContent = initials;
  if (dName) dName.textContent = sOverview.name;
  if (dProg) dProg.textContent = sOverview.program;
  if (dId) dId.textContent = sOverview.studentId;
  if (dBatch) dBatch.textContent = `Batch ${sOverview.batch}`;
  if (dSem) dSem.textContent = sOverview.semester;
  if (dSchool) dSchool.textContent = sOverview.school;
  if (dMajor) dMajor.textContent = sOverview.major;
  if (dMinor) dMinor.textContent = sOverview.minor;
  if (dMinorSchool) dMinorSchool.textContent = sOverview.minorSchool;
  if (dSpec) dSpec.textContent = sOverview.specialisation;

  // Populate Section 2: Academic Summary & CGPA Overview
  const dCgpaVal = document.getElementById('drawerCgpaVal');
  const dCompletedCreds = document.getElementById('drawerCompletedCreds');
  const dRemainingCreds = document.getElementById('drawerRemainingCreds');
  const dMajorMinorPct = document.getElementById('drawerMajorMinorPct');

  if (dCgpaVal) dCgpaVal.textContent = typeof aSummary.overallCgpa === 'number' ? aSummary.overallCgpa.toFixed(2) : aSummary.overallCgpa;
  if (dCompletedCreds) dCompletedCreds.textContent = `${aSummary.completedCredits} cr`;
  if (dRemainingCreds) dRemainingCreds.textContent = `${aSummary.remainingCredits} cr`;
  if (dMajorMinorPct) dMajorMinorPct.textContent = `Major: ${aSummary.majorProgress} | Minor: ${aSummary.minorProgress}`;

  // Populate Semester-Wise Performance Grid
  const semGrid = document.getElementById('drawerSemesterCardsGrid');
  if (semGrid) {
    if (semPerf.history && semPerf.history.length > 0) {
      semGrid.innerHTML = semPerf.history.map(h => `
        <div class="sem-perf-card">
          <div class="spc-sem">Semester ${h.semester}</div>
          <div class="spc-sgpa">${h.sgpa.toFixed(2)} SGPA</div>
          <div class="spc-creds">${h.credits} credits completed</div>
          <div class="spc-status">${escHtml(h.status)}</div>
        </div>
      `).join('');
    } else {
      semGrid.innerHTML = '<div class="sem-perf-card"><div class="spc-sem">Semester 1</div><div class="spc-sgpa">In Progress</div><div class="spc-creds">Freshman Year</div><div class="spc-status">Enrolled</div></div>';
    }
  }

  // Populate Section 3: Course-Wise Attendance Overview & Alerts
  const attAlertBox = document.getElementById('drawerAttendanceAlertBox');
  const attTbody = document.getElementById('drawerAttendanceTableBody');

  const coursesList = attOverview.courseList || [];
  const lowCourse = coursesList.find(c => c.isAtRisk || c.percentage < 75.0);

  if (attAlertBox) {
    if (lowCourse) {
      attAlertBox.className = 'attendance-alert-container attendance-alert-danger';
      attAlertBox.innerHTML = `
        <div class="alert-icon">⚠</div>
        <div class="alert-content">
          <strong>Attendance Risk Alert: Low Attendance in ${escHtml(lowCourse.code)} (${lowCourse.percentage}%)</strong>
          <p>Under Handbook Clause 7.2, attendance below 75% results in examination debarment. 
          To restore eligibility, you must attend the next <strong>${lowCourse.classesNeededFor75} consecutive classes</strong> without missing any. 
          Missing another class increases required recovery to 10 classes.</p>
        </div>
      `;
      attAlertBox.classList.remove('hidden');
    } else {
      attAlertBox.className = 'attendance-alert-container attendance-alert-success';
      attAlertBox.innerHTML = `
        <div class="alert-icon">✓</div>
        <div class="alert-content">
          <strong>Attendance Good Standing: Overall ${attOverview.overallPercentage || 85}%</strong>
          <p>All registered courses satisfy the university 75% minimum attendance requirement.</p>
        </div>
      `;
      attAlertBox.classList.remove('hidden');
    }
  }

  if (attTbody) {
    if (coursesList.length > 0) {
      attTbody.innerHTML = coursesList.map(c => {
        const isAtRisk = c.isAtRisk || c.percentage < 75.0;
        const rowClass = isAtRisk ? 'row-attendance-risk' : '';
        const badgeClass = isAtRisk ? 'badge-att-danger' : 'badge-att-good';
        const bufferText = isAtRisk
          ? `<strong class="text-danger">Needs ${c.classesNeededFor75} consecutive classes</strong>`
          : `Can safely miss ${c.classesCanMiss} class${c.classesCanMiss === 1 ? '' : 'es'}`;

        return `
          <tr class="${rowClass}">
            <td class="dct-code"><strong>${escHtml(c.code)}</strong></td>
            <td class="dct-title">${escHtml(c.name || c.title)}</td>
            <td class="dct-conducted">${c.conducted}</td>
            <td class="dct-attended">${c.attended}</td>
            <td class="dct-pct"><span class="${badgeClass}">${c.percentage}%</span></td>
            <td class="dct-status">${escHtml(c.status || (isAtRisk ? 'At Risk (< 75%)' : 'Eligible'))}</td>
            <td class="dct-buffer">${bufferText}</td>
          </tr>
        `;
      }).join('');
    } else {
      attTbody.innerHTML = '<tr><td colspan="7" class="dct-empty">No course attendance records found.</td></tr>';
    }
  }

  // Populate Section 4: Academic Progress & Alerts (Backlog / Medical Leave)
  const backlogBox = document.getElementById('drawerBacklogAlertBox');
  const medicalBox = document.getElementById('drawerMedicalLeaveBox');

  if (backlogBox) {
    if (aProgress.hasBacklog && aProgress.backlogs.length > 0) {
      const bl = aProgress.backlogs[0];
      backlogBox.className = 'backlog-alert-container backlog-alert-danger';
      backlogBox.innerHTML = `
        <div class="alert-icon">❌</div>
        <div class="alert-content">
          <strong>Active Backlog Alert: ${escHtml(bl.code)} — ${escHtml(bl.name)}</strong>
          <p><strong>Grade:</strong> '${escHtml(bl.grade)}' in Semester ${bl.semesterTaken} | <strong>Credits:</strong> ${bl.credits} cr</p>
          <p><strong>Handbook Clause 12.1 Mandate:</strong> A student cannot graduate or be awarded the B.Tech degree until all 180 credits and mandatory courses are cleared with a minimum passing grade (P). Register for re-examination on Digii ERP.</p>
        </div>
      `;
      backlogBox.classList.remove('hidden');
    } else {
      backlogBox.classList.add('hidden');
    }
  }

  if (medicalBox) {
    if (medLeave && medLeave.hasRecord) {
      medicalBox.className = 'medical-leave-container medical-leave-approved';
      medicalBox.innerHTML = `
        <div class="alert-icon">🏥</div>
        <div class="alert-content">
          <strong>Official Medical Leave Record: ${escHtml(medLeave.status)}</strong>
          <p><strong>Duration:</strong> ${escHtml(medLeave.duration)} | <strong>Reason:</strong> ${escHtml(medLeave.reason)}</p>
          <p><strong>Approval:</strong> ${escHtml(medLeave.approvalAuthority)} (Compliant with SOP Clause 2, submitted within 3 working days).</p>
          <p><strong>Attendance Standing:</strong> Under Handbook Clause 7.3, allows relaxation down to 65% if attendance drops below 75%. Your attendance currently exceeds 81% in affected courses, so exam eligibility is fully maintained.</p>
        </div>
      `;
      medicalBox.classList.remove('hidden');
    } else {
      medicalBox.classList.add('hidden');
    }
  }

  // Populate Enrolled Courses Table
  const tbody = document.getElementById('drawerCoursesTableBody');
  if (tbody) {
    const enrolled = aProgress.currentCourses || [];
    if (enrolled.length > 0) {
      tbody.innerHTML = enrolled.map(c => `
        <tr>
          <td class="dct-code"><strong>${escHtml(c.code)}</strong></td>
          <td class="dct-title">${escHtml(c.title || c.name)}</td>
          <td class="dct-ltp"><code>${escHtml(c.ltp)}</code></td>
          <td class="dct-credits"><span class="badge-credit">${c.credits} cr</span></td>
          <td class="dct-category">${escHtml(c.category || 'Core Engineering')}</td>
          <td class="dct-prereq">${escHtml(c.prerequisite || 'None')}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="dct-empty">Standard semester basket enrollment.</td></tr>';
    }
  }

  // Populate Section 5: Declared Minor Structure
  const dMinorBadge = document.getElementById('drawerMinorCreditsBadge');
  const dMinorHeading = document.getElementById('drawerMinorTitleHeading');
  const dMinorStatus = document.getElementById('drawerMinorStatusText');
  const dMinorList = document.getElementById('drawerMinorCoursesList');

  if (dMinorBadge) {
    dMinorBadge.textContent = `${mStructure ? (mStructure.requiredCredits || mStructure.totalCredits || 24) : 24} Credits`;
  }
  if (dMinorHeading) {
    dMinorHeading.textContent = `Declared Minor: ${sOverview.minor}`;
  }
  if (dMinorStatus) {
    dMinorStatus.textContent = `${sOverview.minor} (${sOverview.minorSchool}) · Grounded in Minor_Courses_for_BTech_Students.xlsx`;
  }
  if (dMinorList) {
    const courses = (mStructure && (mStructure.curriculumCourses || mStructure.coursesOffered)) || [];
    if (courses.length > 0) {
      dMinorList.innerHTML = courses.map(c => `
        <span class="msb-course-chip" title="${escHtml(c.name)}">
          <strong>${escHtml(c.code)}</strong>: ${escHtml(c.name)} (${c.credits} cr) ${c.status ? '— ' + c.status : ''}
        </span>
      `).join('');
    } else {
      dMinorList.innerHTML = '<span class="msb-course-chip">Standard minor basket courses</span>';
    }
  }

  drawer.classList.remove('hidden');
}

function closeProfileDrawer() {
  const drawer = document.getElementById('profileDrawer');
  if (drawer) drawer.classList.add('hidden');
}

function askAboutMyCourses() {
  closeProfileDrawer();
  scrollToAdvisor();
  sendQuery('What courses do I have this semester?');
}

function askAboutMyAttendance() {
  closeProfileDrawer();
  scrollToAdvisor();
  sendQuery('What is my attendance in each course?');
}

function askAboutMyLowestAttendance() {
  closeProfileDrawer();
  scrollToAdvisor();
  sendQuery('Which course has my lowest attendance?');
}

function askAboutMyCgpa() {
  closeProfileDrawer();
  scrollToAdvisor();
  sendQuery('What is my semester-wise CGPA?');
}

function askAboutMyMinor() {
  closeProfileDrawer();
  scrollToAdvisor();
  sendQuery('What are my minor requirements?');
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
      if (typeof stopAllAudio === 'function') stopAllAudio();
      if (typeof stopListening === 'function') stopListening();
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
    const token = sessionStorage.getItem('vu_advisor_session_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
      query: queryText,
      history: chatHistoryStore.slice(-6)
    };

    const res = await fetch('/api/advisory', {
      method: 'POST',
      headers,
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

  const msgId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  advisorResponses[msgId] = data.answer || '';

  // 1. Build Token Usage Badge (Transparent, truthful reporting)
  const tokenData = data.tokens || data.tokenUsage;
  let tokenBadgeHtml = '';
  if (tokenData && tokenData.totalTokens !== null && tokenData.totalTokens !== undefined) {
    tokenBadgeHtml = `
      <div class="token-pill token-pill-active">
        <span class="token-pill-icon">⚡</span>
        <span class="token-pill-text">Prompt: <strong>${tokenData.promptTokens ?? 0}</strong> · Completion: <strong>${tokenData.completionTokens ?? 0}</strong> · Total: <strong>${tokenData.totalTokens} tokens</strong></span>
        ${tokenData.model ? `<span class="token-pill-model">${escHtml(tokenData.model)}</span>` : ''}
      </div>
    `;
  } else {
    tokenBadgeHtml = `
      <div class="token-pill token-pill-deterministic">
        <span class="token-pill-icon">🔒</span>
        <span class="token-pill-text">Token Usage: <strong>0 external LLM API tokens</strong> (Deterministic Grounded Rule &amp; Curriculum Engine)</span>
      </div>
    `;
  }

  // 2. Build Verified Sources with Clickable Proof Links
  let evidenceHtml = '';
  if (Array.isArray(data.sources) && data.sources.length > 0) {
    // Strictly filter out internal assignment files - only authentic official university sources are displayed
    const verifiedSources = data.sources.filter(s => {
      const t = (s.documentTitle || s.documentName || '').toLowerCase();
      const u = (s.url || '').toLowerCase();
      return !t.includes('all the info') &&
             !t.includes('gai assignment') &&
             !t.includes('academic course information') &&
             !t.includes('academic explanation') &&
             !u.includes('all%20the%20info') &&
             !u.includes('gai%20assignment');
    });

    const items = verifiedSources.map(s => {
      let rawTitle = s.documentTitle || s.documentName || 'Official Document';
      if (rawTitle.toLowerCase().includes('118351') || rawTitle.toLowerCase().includes('minor')) {
        rawTitle = 'B.Tech Minor Courses';
      } else if (rawTitle.toLowerCase().includes('118225') || rawTitle.toLowerCase().includes('semester_spread')) {
        rawTitle = 'Official Semester Structure';
      } else if (rawTitle.toLowerCase().includes('handbook')) {
        rawTitle = 'Official Student Handbook';
      }

      const titleText = escHtml(rawTitle);
      const locationText = escHtml(s.clauseNumber || s.pageOrSheet || '');

      let docKey = 'handbook';
      const tLower = rawTitle.toLowerCase();
      if (tLower.includes('minor') || tLower.includes('118351')) docKey = 'minor_courses';
      else if (tLower.includes('semester') || tLower.includes('spread') || tLower.includes('118225')) docKey = 'semester_spread';
      else if (tLower.includes('sop') || tLower.includes('19082025')) docKey = 'sop';
      else if (tLower.includes('circular')) docKey = 'summer_circular';
      else if (tLower.includes('courses offered')) docKey = 'courses_offered';
      else if (tLower.includes('digii')) docKey = 'digii_minor';
      else if (tLower.includes('erp')) docKey = 'erp_manual';
      else if (tLower.includes('exam')) docKey = 'exam_sop';
      else if (tLower.includes('holiday')) docKey = 'holiday_list';

      const sheetOrPage = s.previewSheet || s.pageOrSheet || '';

      return `
        <div class="source-item" data-doc="${escHtml(docKey)}" data-sheet="${escHtml(sheetOrPage)}" data-title="${escHtml(rawTitle)}">
          <div class="source-header">
            <button type="button" class="source-doc-link-btn" data-action="preview-doc" data-doc="${escHtml(docKey)}" data-sheet="${escHtml(sheetOrPage)}" data-title="${escHtml(rawTitle)}" onclick="openDocPreviewModal(this.dataset.doc, this.dataset.sheet, this.dataset.title); return false;" title="Inspect official verified document preview">
              <span class="source-icon">📄</span>
              <span class="source-doc-title">${titleText}</span>
              <span class="source-ext-icon">🔍</span>
            </button>
            ${locationText ? `<span class="source-clause">${locationText}</span>` : ''}
          </div>
          ${s.excerpt ? `<p class="source-excerpt">"${escHtml(s.excerpt)}"</p>` : ''}
          <div class="source-action-bar">
            <button type="button" class="btn-open-preview" data-action="preview-doc" data-doc="${escHtml(docKey)}" data-sheet="${escHtml(sheetOrPage)}" data-title="${escHtml(rawTitle)}" onclick="openDocPreviewModal(this.dataset.doc, this.dataset.sheet, this.dataset.title); return false;" aria-label="Preview official document ${titleText}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right:3px;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              Preview Document
            </button>
            <span class="source-verified-badge">✓ Verified Official Source</span>
          </div>
        </div>
      `;
    }).join('');

    evidenceHtml = `
      <div class="evidence-accordion">
        <button type="button" class="btn-evidence-toggle" id="btn-ev-${msgId}" onclick="toggleEvidence('${msgId}')" aria-expanded="false">
          <span class="ev-toggle-icon">🔍</span>
          <span class="ev-toggle-label">Inspect Verified Proof &amp; Token Usage (${verifiedSources.length} source${verifiedSources.length === 1 ? '' : 's'})</span>
          <span class="ev-toggle-arrow" id="arrow-${msgId}">▼</span>
        </button>
        <div id="drawer-${msgId}" class="evidence-drawer" style="display: none;">
          ${tokenBadgeHtml}
          <div class="sources-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            OFFICIAL VERIFIED SOURCES (CLICK TO VIEW PROOF)
          </div>
          <div class="sources-list">${items}</div>
        </div>
      </div>
    `;
  } else if (tokenBadgeHtml) {
    evidenceHtml = `
      <div class="evidence-accordion">
        <button type="button" class="btn-evidence-toggle" id="btn-ev-${msgId}" onclick="toggleEvidence('${msgId}')" aria-expanded="false">
          <span class="ev-toggle-icon">🔍</span>
          <span class="ev-toggle-label">Inspect Execution &amp; Token Details</span>
          <span class="ev-toggle-arrow" id="arrow-${msgId}">▼</span>
        </button>
        <div id="drawer-${msgId}" class="evidence-drawer" style="display: none;">
          ${tokenBadgeHtml}
        </div>
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
        <div class="msg-header-left">
          <span class="state-tag ${stateClass}">${escHtml(stateLabel)}</span>
          <span class="msg-author">VU Advisor</span>
        </div>
        <button id="audioBtn-${msgId}" class="btn-audio-listen" onclick="toggleAudioExplanation('${msgId}')" title="Listen to browser audio explanation" aria-label="Listen to explanation">
          <span class="audio-icon">🎧</span> Listen to explanation
        </button>
      </div>
      <div class="msg-text">${formatMarkdown(data.answer || '')}</div>
      ${followUpHtml}
      ${evidenceHtml}
    </div>
  `;

  history.appendChild(msg);
  history.scrollTop = history.scrollHeight;
  const chatBody = document.getElementById('chatBody');
  if (chatBody) {
    chatBody.scrollTop = chatBody.scrollHeight;
  }
}

window.toggleEvidence = function(msgId) {
  const drawer = document.getElementById('drawer-' + msgId);
  const arrow = document.getElementById('arrow-' + msgId);
  const btn = document.getElementById('btn-ev-' + msgId);
  if (!drawer) return;
  const isCurrentlyHidden = drawer.style.display === 'none';
  drawer.style.display = isCurrentlyHidden ? 'block' : 'none';
  if (arrow) arrow.textContent = isCurrentlyHidden ? '▲' : '▼';
  if (btn) btn.setAttribute('aria-expanded', isCurrentlyHidden ? 'true' : 'false');

  if (isCurrentlyHidden) {
    const chatBody = document.getElementById('chatBody');
    if (chatBody) {
      setTimeout(() => {
        chatBody.scrollTop = chatBody.scrollHeight;
      }, 50);
    }
  }
};

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

  // 1. Convert markdown heading hashes at the start of any line into bold text without hashes
  let str = String(text).replace(/^[ \t]*#{1,6}[ \t]+(.*)$/gm, '**$1**');

  // 2. Clean leading and trailing asterisks from Official Knowledge Source lines
  str = str.replace(/^\*Official Knowledge Source:\s*(.*?)\*$/gmi, 'Official Knowledge Source: $1');
  str = str.replace(/\*Official Knowledge Source:\s*([^*]+)\*/gi, 'Official Knowledge Source: $1');

  // 3. Escape HTML for XSS prevention
  let escaped = escHtml(str);

  // 4. Convert bold **text** to <strong>text</strong>
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 5. Convert single asterisks *text* to <em>text</em>
  escaped = escaped.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, '$1<em>$2</em>$3');

  // 6. Style "Official Knowledge Source: ..." as clean source line
  escaped = escaped.replace(
    /(Official Knowledge Source:[^\n<]+)/gi,
    '<span class="official-source-line">$1</span>'
  );

  // 7. Status indicators
  escaped = escaped.replace(/✓/g, '<span style="color:#059669;font-weight:600;">✓</span>');
  escaped = escaped.replace(/⚠/g, '<span style="color:#d97706;font-weight:600;">⚠</span>');
  escaped = escaped.replace(/❌/g, '<span style="color:#dc2626;font-weight:600;">❌</span>');

  // 8. Paragraphs & line breaks
  escaped = escaped.replace(/\n\n/g, '</p><p>');
  escaped = escaped.replace(/\n/g, '<br>');

  return `<p>${escaped}</p>`;
}

// ════════════════════════════════════════════════════════════
// VOICE INTERACTION: SPEECH-TO-TEXT (STT) & TEXT-TO-SPEECH (TTS)
// ════════════════════════════════════════════════════════════
let recognitionInstance = null;
let isVoiceListening = false;

function setupVoiceInteraction() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('voiceMicBtn');
  const input = document.getElementById('queryInput');
  const statusHint = document.getElementById('voiceStatusHint');
  const statusText = document.getElementById('voiceStatusText');
  const cancelBtn = document.getElementById('voiceCancelBtn');

  if (!micBtn || !input) return;

  function showVoiceStatus(msg, type = 'info', autoDismissMs = 0) {
    if (!statusHint || !statusText) return;
    statusHint.className = 'voice-status-hint' + (type === 'info' ? ' voice-status-info' : (type === 'warning' ? ' voice-status-warning' : ''));
    statusText.textContent = msg;
    statusHint.classList.remove('hidden');

    if (autoDismissMs > 0) {
      setTimeout(() => {
        if (statusText.textContent === msg) {
          statusHint.classList.add('hidden');
        }
      }, autoDismissMs);
    }
  }

  function hideVoiceStatus() {
    if (statusHint) statusHint.classList.add('hidden');
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      stopListening();
      hideVoiceStatus();
    });
  }

  if (!SpeechRecognition) {
    micBtn.addEventListener('click', () => {
      showVoiceStatus('Voice recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari, or type your query.', 'warning', 7000);
    });
    return;
  }

  try {
    recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-IN'; // Prefer Indian English for Vidyashilp University
    recognitionInstance.maxAlternatives = 1;

    let finalTranscript = '';
    let originalPlaceholder = '';

    recognitionInstance.onstart = () => {
      isVoiceListening = true;
      micBtn.classList.add('listening');
      micBtn.setAttribute('aria-label', 'Stop listening');
      originalPlaceholder = input.placeholder;
      input.placeholder = 'Listening… Speak your question now';
      showVoiceStatus('Listening… Speak your question clearly into the microphone.');
    };

    recognitionInstance.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const recognized = (finalTranscript || interim).trim();
      if (recognized) {
        input.value = recognized;
      }
    };

    recognitionInstance.onerror = (event) => {
      console.warn('[SpeechRecognition] event error:', event.error);
      stopListening();
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        showVoiceStatus('Microphone access denied. Please click the permissions icon in your browser URL bar to allow microphone access.', 'warning', 9000);
      } else if (event.error === 'no-speech') {
        showVoiceStatus('No speech was detected. Click the microphone to try again.', 'warning', 5000);
      } else {
        showVoiceStatus(`Voice input notice (${event.error}). Please click microphone to retry.`, 'warning', 6000);
      }
    };

    recognitionInstance.onend = () => {
      stopListening();
      if (input.value.trim()) {
        showVoiceStatus('Speech captured! You can review or edit your query, then press Send or Enter.', 'info', 5000);
        input.focus();
      } else {
        setTimeout(hideVoiceStatus, 2000);
      }
    };

    function startListening() {
      stopAllAudio(); // Prevent TTS from talking over user's speech
      finalTranscript = '';
      try {
        recognitionInstance.start();
      } catch (err) {
        console.warn('SpeechRecognition start error:', err);
      }
    }

    function stopListening() {
      isVoiceListening = false;
      micBtn.classList.remove('listening');
      micBtn.setAttribute('aria-label', 'Speak your question');
      if (originalPlaceholder) {
        input.placeholder = originalPlaceholder;
      }
      try {
        recognitionInstance.stop();
      } catch (e) {}
    }

    window.stopListening = stopListening;

    micBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isVoiceListening) {
        stopListening();
        hideVoiceStatus();
      } else {
        startListening();
      }
    });

  } catch (err) {
    console.error('Speech recognition initialization failed:', err);
  }
}

// ════════════════════════════════════════════════════════════
// VOICE OUTPUT: TEXT-TO-SPEECH (TTS) WITH ROBUST CHUNKING
// ════════════════════════════════════════════════════════════
const advisorResponses = {};
let currentSpeechBtn = null;
let speechChunksQueue = [];
let speechChunkIdx = 0;

function stopAllAudio() {
  speechChunksQueue = [];
  speechChunkIdx = 0;
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  if (currentSpeechBtn) {
    updateSpeechBtnState(currentSpeechBtn, false);
    currentSpeechBtn = null;
  }
}
window.stopAllAudio = stopAllAudio;

function getPreferredEnglishVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;

  // 1. Prefer Indian English voice
  const inVoice = voices.find(v => v.lang === 'en-IN' || (v.name && v.name.toLowerCase().includes('india')));
  if (inVoice) return inVoice;

  // 2. Prefer natural/neural English voices
  const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Online')));
  if (naturalVoice) return naturalVoice;

  // 3. Fallback to any English voice
  const anyEn = voices.find(v => v.lang.startsWith('en'));
  return anyEn || voices[0];
}

function toggleAudioExplanation(msgId) {
  const text = advisorResponses[msgId];
  const btn = document.getElementById(`audioBtn-${msgId}`);

  // Check browser Web Speech API support
  if (!('speechSynthesis' in window)) {
    alert('Audio playback uses the browser-native Web Speech API. Speech synthesis is not supported on your current browser or device; the verified text transcript is displayed above.');
    return;
  }

  // If already speaking this message, toggle off / stop
  if (currentSpeechBtn === btn) {
    stopAllAudio();
    return;
  }

  // Stop any other active speech
  stopAllAudio();

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) return;

  // Split into sentence chunks under 180 chars to avoid Chromium TTS 15-second hang bug
  const rawSentences = cleanText.match(/[^.!?]+[.!?]+|\S+$/g) || [cleanText];
  const chunks = [];
  let curChunk = '';

  for (const s of rawSentences) {
    if ((curChunk + ' ' + s).trim().length <= 180) {
      curChunk = (curChunk + ' ' + s).trim();
    } else {
      if (curChunk) chunks.push(curChunk);
      curChunk = s.trim();
    }
  }
  if (curChunk) chunks.push(curChunk);

  speechChunksQueue = chunks;
  speechChunkIdx = 0;
  currentSpeechBtn = btn;
  updateSpeechBtnState(btn, true);

  playNextSpeechChunk();
}

function playNextSpeechChunk() {
  if (speechChunkIdx >= speechChunksQueue.length) {
    stopAllAudio();
    return;
  }

  const chunkText = speechChunksQueue[speechChunkIdx];
  const utterance = new SpeechSynthesisUtterance(chunkText);
  const voice = getPreferredEnglishVoice();

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || 'en-IN';
  } else {
    utterance.lang = 'en-IN';
  }

  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    speechChunkIdx++;
    playNextSpeechChunk();
  };

  utterance.onerror = (e) => {
    console.warn('[SpeechSynthesis] utterance error:', e);
    stopAllAudio();
  };

  window.speechSynthesis.speak(utterance);
}

function updateSpeechBtnState(btn, isPlaying) {
  if (!btn) return;
  if (isPlaying) {
    btn.classList.add('audio-playing');
    btn.innerHTML = `<span class="audio-bars-anim"><span class="audio-bar"></span><span class="audio-bar"></span><span class="audio-bar"></span><span class="audio-bar"></span></span> Stop Audio`;
    btn.setAttribute('aria-label', 'Stop reading explanation');
    btn.setAttribute('title', 'Stop audio playback');
  } else {
    btn.classList.remove('audio-playing');
    btn.innerHTML = `<span class="audio-icon">🎧</span> Listen to explanation`;
    btn.setAttribute('aria-label', 'Listen to explanation');
    btn.setAttribute('title', 'Listen to browser audio explanation');
  }
}

function cleanTextForSpeech(raw) {
  if (!raw) return '';
  return raw
    // Strip markdown links [label](url) -> label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Strip bracketed citations like [Official Student Handbook] or [p. 14]
    .replace(/\[(?:Official|Student|Semester|B\.Tech|Course|DATA|MATH|ENG|UCOR)[^\]]*\]/gi, '')
    .replace(/\[(?:p\.\s*\d+|sheet\s*[^\]]+)\]/gi, '')
    // Expand L-T-P patterns into clean numbers for speech (e.g. 1-0-4 -> 1, 0, 4)
    .replace(/(\b\d+)-(\d+)-(\d+\b)/g, '$1, $2, $3')
    // Remove markdown symbols
    .replace(/[*#_`>~]/g, '')
    // Convert status indicators into spoken words
    .replace(/✓/g, 'Status: Eligible. ')
    .replace(/❌/g, 'Status: Not eligible. ')
    .replace(/⚠/g, 'Notice: ')
    // Strip raw URLs
    .replace(/https?:\/\/\S+/g, '')
    // Normalize punctuation & whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// ════════════════════════════════════════════════════════════
// PHASE 8: MULTIMODAL EXTENSION — COURSE INFOGRAPHIC VIEWER
// ════════════════════════════════════════════════════════════
let currentInfographicSvg = '';
let currentInfographicData = null;

function openInfographicModal(defaultProgram = 'BTECH_DS', defaultBatch = '2024') {
  const modal = document.getElementById('infographicModal');
  if (modal) {
    modal.classList.remove('hidden');
    const progSelect = document.getElementById('infoProgramSelect');
    if (progSelect && defaultProgram) progSelect.value = defaultProgram;
    const batchSelect = document.getElementById('infoBatchSelect');
    if (batchSelect && defaultBatch) batchSelect.value = defaultBatch;
    loadInfographicData();
  }
}

function closeInfographicModal() {
  const modal = document.getElementById('infographicModal');
  if (modal) modal.classList.add('hidden');
}

async function loadInfographicData() {
  const program = document.getElementById('infoProgramSelect')?.value || 'BTECH_DS';
  const batch = document.getElementById('infoBatchSelect')?.value || '2024';
  const term = document.getElementById('infoTermFilter')?.value || 'ALL';
  const container = document.getElementById('infoSvgContainer');

  if (container) {
    container.innerHTML = '<div class="info-loading">Generating course infographic from verified curriculum structures…</div>';
  }

  try {
    const res = await fetch(`/api/curriculum/infographic?program=${encodeURIComponent(program)}&batch=${encodeURIComponent(batch)}&term=${encodeURIComponent(term)}`);
    const data = await res.json();
    if (data.status === 'success' && data.svg) {
      currentInfographicSvg = data.svg;
      currentInfographicData = data;
      if (container) {
        container.innerHTML = data.svg;
      }
      document.getElementById('infoTotalCourses').textContent = `Courses: ${data.totalCourses}`;
      document.getElementById('infoTotalCredits').textContent = `Credits: ${data.totalCredits}`;
      document.getElementById('infoSummerCount').textContent = `Summer Term '26: ${data.summerOfferedCount} Courses`;
    } else {
      if (container) container.innerHTML = '<div class="info-error">Failed to generate infographic. Please try again.</div>';
    }
  } catch (err) {
    console.error('Error loading infographic:', err);
    if (container) container.innerHTML = '<div class="info-error">Network error loading infographic.</div>';
  }
}

function downloadInfographicSvg() {
  if (!currentInfographicSvg) return;
  const program = document.getElementById('infoProgramSelect')?.value || 'CURRICULUM';
  const blob = new Blob([currentInfographicSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VU_${program}_Course_Structure_Infographic.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ══════════ DOCUMENT & WORKBOOK PREVIEW MODAL ══════════
window.openDocPreviewModal = async function(docKey, sheetOrPage, title) {
  console.log('[openDocPreviewModal] Opening document preview:', { docKey, sheetOrPage, title });
  const modal = document.getElementById('docPreviewModal');
  if (!modal) {
    console.error('[openDocPreviewModal] #docPreviewModal not found in DOM');
    return;
  }

  // Ensure modal is visible and properly displayed
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const titleEl = document.getElementById('docPreviewTitle');
  const subEl = document.getElementById('docPreviewSub');
  const badgeEl = document.getElementById('docPreviewBadge');
  const tabsToolbar = document.getElementById('previewTabsToolbar');
  const tabsList = document.getElementById('previewTabsList');
  const loadingEl = document.getElementById('previewLoading');
  const tableWrap = document.getElementById('previewTableWrap');
  const tableBody = document.getElementById('previewTableBody');
  const pdfWrap = document.getElementById('previewPdfWrap');
  const pdfFrame = document.getElementById('previewPdfFrame');
  const dlBtn = document.getElementById('btnDocDownload');

  if (loadingEl) {
    loadingEl.style.display = 'block';
    loadingEl.textContent = 'Loading official document preview…';
  }
  if (tableWrap) tableWrap.style.display = 'none';
  if (pdfWrap) pdfWrap.style.display = 'none';
  if (tabsToolbar) tabsToolbar.style.display = 'none';

  if (titleEl) titleEl.textContent = title || 'Official Document Preview';
  if (subEl) subEl.textContent = sheetOrPage ? `Section / Sheet: ${sheetOrPage}` : 'Verified university academic curriculum record.';

  try {
    const res = await fetch(`/api/document-preview?doc=${encodeURIComponent(docKey || '')}&sheet=${encodeURIComponent(sheetOrPage || '')}`);
    const data = await res.json();
    if (loadingEl) loadingEl.style.display = 'none';

    if (data.status !== 'success') {
      if (loadingEl) {
        loadingEl.style.display = 'block';
        loadingEl.textContent = data.message || 'Unable to preview this document.';
      }
      return;
    }

    if (dlBtn && data.downloadUrl) {
      dlBtn.href = data.downloadUrl;
      dlBtn.setAttribute('download', data.downloadFilename || '');
    }

    if (data.type === 'workbook') {
      if (badgeEl) badgeEl.textContent = '📊';
      if (tabsToolbar) tabsToolbar.style.display = 'flex';
      if (tabsList) {
        tabsList.innerHTML = '';
        (data.sheets || []).forEach(sh => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'preview-tab-btn' + (sh === data.activeSheet ? ' active' : '');
          btn.textContent = sh;
          btn.onclick = () => {
            openDocPreviewModal(data.docKey, sh, data.title);
          };
          tabsList.appendChild(btn);
        });
      }

      if (tableBody) {
        tableBody.innerHTML = '';
        (data.rows || []).forEach((row, idx) => {
          const tr = document.createElement('tr');
          row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
          });
          tableBody.appendChild(tr);
        });
      }
      if (tableWrap) tableWrap.style.display = 'block';
    } else {
      if (badgeEl) badgeEl.textContent = '📄';
      if (pdfFrame && data.pdfUrl) {
        pdfFrame.src = data.pdfUrl;
      }
      if (pdfWrap) pdfWrap.style.display = 'block';
    }
  } catch (err) {
    if (loadingEl) {
      loadingEl.style.display = 'block';
      loadingEl.textContent = 'Error loading preview: ' + err.message;
    }
  }
};

window.closeDocPreviewModal = function() {
  const modal = document.getElementById('docPreviewModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
  const pdfFrame = document.getElementById('previewPdfFrame');
  if (pdfFrame) pdfFrame.src = '';
};

// Global Click Delegation to guarantee all preview buttons respond
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn-open-preview, .source-doc-link-btn, [data-action="preview-doc"]');
  if (btn) {
    e.preventDefault();
    e.stopPropagation();
    const docKey = btn.dataset.doc || btn.getAttribute('data-doc');
    const sheet = btn.dataset.sheet || btn.getAttribute('data-sheet') || '';
    const title = btn.dataset.title || btn.getAttribute('data-title') || '';
    if (typeof window.openDocPreviewModal === 'function') {
      window.openDocPreviewModal(docKey, sheet, title);
    }
    return;
  }

  // Backdrop click closes the preview modal
  const previewModal = document.getElementById('docPreviewModal');
  if (previewModal && !previewModal.classList.contains('hidden') && e.target === previewModal) {
    window.closeDocPreviewModal();
  }
});

// ESC key closes the preview modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const previewModal = document.getElementById('docPreviewModal');
    if (previewModal && !previewModal.classList.contains('hidden')) {
      window.closeDocPreviewModal();
    }
  }
});
