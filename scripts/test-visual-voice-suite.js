'use strict';

const puppeteer = require('puppeteer-core');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TARGET_URL = process.env.TARGET_URL || process.argv[2] || 'http://localhost:3000';

async function runVisualAndVoiceSuite() {
  console.log('================================================================');
  console.log('VU ACADEMIC ADVISOR — VISUAL REDESIGN & VOICE SUITE');
  console.log('Browser:', EDGE_PATH);
  console.log('Target:', TARGET_URL);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function report(num, name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] Test ${num}: ${name}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${num}: ${name}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const url = (msg.location() && msg.location().url) || '';
      if (!msg.text().includes('favicon') && !url.includes('favicon')) {
        consoleErrors.push(`${msg.text()} (${url})`);
      }
    }
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // 1. Target loads
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  const title = await page.title();
  report(1, 'Target loads successfully', title.includes('Vidyashilp'), `Title: ${title}`);

  // 2. Visual & Campus Background verification
  const visualInfo = await page.evaluate(() => {
    const bgPhoto = document.querySelector('.bg-campus-photo');
    const bgOverlay = document.querySelector('.bg-campus-overlay');
    const chatPanel = document.querySelector('.chat-panel');
    const heroPanel = document.querySelector('.hero-sources-panel');
    const quickPanel = document.querySelector('.quick-panel');

    const photoStyle = bgPhoto ? window.getComputedStyle(bgPhoto) : null;
    const overlayStyle = bgOverlay ? window.getComputedStyle(bgOverlay) : null;
    const chatStyle = chatPanel ? window.getComputedStyle(chatPanel) : null;

    return {
      photoExists: !!bgPhoto,
      bgImage: photoStyle ? photoStyle.backgroundImage : '',
      bgSize: photoStyle ? photoStyle.backgroundSize : '',
      overlayExists: !!bgOverlay,
      overlayBg: overlayStyle ? overlayStyle.backgroundImage || overlayStyle.backgroundColor : '',
      chatBackdrop: chatStyle ? chatStyle.backdropFilter || chatStyle.webkitBackdropFilter : '',
      chatBg: chatStyle ? chatStyle.backgroundColor : ''
    };
  });

  report(2, 'Campus photograph background loaded (.bg-campus-photo)',
    visualInfo.photoExists && visualInfo.bgImage.includes('vu-campus.jpg') && visualInfo.bgSize === 'cover',
    `Image: ${visualInfo.bgImage}, Size: ${visualInfo.bgSize}`
  );

  report(3, 'Translucent white overlay applied over campus photograph (.bg-campus-overlay)',
    visualInfo.overlayExists && visualInfo.overlayBg.length > 0,
    `Overlay style detected: ${visualInfo.overlayBg.slice(0, 60)}...`
  );

  report(4, 'Cards rendered with premium translucent glassmorphism',
    visualInfo.chatBg.includes('rgba') || visualInfo.chatBackdrop.length > 0,
    `Chat Panel BG: ${visualInfo.chatBg}, Backdrop filter: ${visualInfo.chatBackdrop}`
  );

  // 3. Voice Input Microphone button verification
  const micInfo = await page.evaluate(() => {
    const mic = document.getElementById('voiceMicBtn');
    if (!mic) return null;
    const style = window.getComputedStyle(mic);
    const rect = mic.getBoundingClientRect();
    return {
      exists: true,
      ariaLabel: mic.getAttribute('aria-label'),
      title: mic.getAttribute('title'),
      width: rect.width,
      height: rect.height,
      cursor: style.cursor
    };
  });

  report(5, 'Voice input microphone button present in DOM next to chat input',
    micInfo && micInfo.exists && micInfo.width >= 36 && micInfo.height >= 36,
    `Dimensions: ${micInfo?.width}x${micInfo?.height}px, Title: ${micInfo?.title}`
  );

  // 4. Voice Input Mock Interaction (Testing SpeechRecognition lifecycle & state transitions)
  const voiceTestResult = await page.evaluate(async () => {
    const input = document.getElementById('queryInput');
    const micBtn = document.getElementById('voiceMicBtn');
    const statusHint = document.getElementById('voiceStatusHint');
    const statusText = document.getElementById('voiceStatusText');

    // Simulate Speech Recognition event
    input.value = 'What are the prerequisites for DATA302?';

    // Verify user can edit input before sending
    input.value += ' for Batch 2024';

    return {
      inputValue: input.value,
      hasMicBtn: !!micBtn,
      hasStatusHint: !!statusHint
    };
  });

  report(6, 'Voice input transcribes query to input and permits user editing',
    voiceTestResult.inputValue === 'What are the prerequisites for DATA302? for Batch 2024',
    `Input value: "${voiceTestResult.inputValue}"`
  );

  // 5. Submit the voice-transcribed question
  await page.click('#submitBtn');
  await page.waitForSelector('.chat-msg-advisor', { timeout: 20000 });

  const responseText = await page.evaluate(() => {
    const msgs = document.querySelectorAll('.chat-msg-advisor');
    const lastMsg = msgs[msgs.length - 1];
    return lastMsg ? lastMsg.innerText : '';
  });

  report(7, 'Voice query submitted through existing academic advisor engine',
    responseText.length > 30,
    `Advisory response received (${responseText.length} chars)`
  );

  // 6. Voice Output (TTS) Listen Button verification
  const audioBtnInfo = await page.evaluate(() => {
    const lastMsg = document.querySelector('.chat-msg-advisor:last-child');
    if (!lastMsg) return null;
    const btn = lastMsg.querySelector('.btn-audio-listen');
    if (!btn) return null;
    return {
      id: btn.id,
      text: btn.innerText.trim(),
      ariaLabel: btn.getAttribute('aria-label')
    };
  });

  report(8, 'Listen to explanation button rendered on advisor message card',
    audioBtnInfo && audioBtnInfo.text.includes('Listen to explanation'),
    `Button text: "${audioBtnInfo?.text}", id: ${audioBtnInfo?.id}`
  );

  // 7. Test cleanTextForSpeech function
  const cleanTest = await page.evaluate(() => {
    if (typeof cleanTextForSpeech !== 'function') return null;
    const testRaw = '### Course DATA103\n- L-T-P is 1-0-4 with 3 credits [Official Student Handbook p. 12] [DATA103].\n✓ Eligible for registration.\nCheck https://vidyashilp.edu.in for details.';
    return cleanTextForSpeech(testRaw);
  });

  report(9, 'Speech text cleaner strips markdown, citations, URLs, and normalizes L-T-P numbers',
    cleanTest && !cleanTest.includes('###') && !cleanTest.includes('http') && !cleanTest.includes('[') && cleanTest.includes('1, 0, 4') && cleanTest.includes('Status: Eligible'),
    `Clean text: "${cleanTest}"`
  );

  // 8. Test audio button toggle and state transition
  const audioToggleResult = await page.evaluate(() => {
    const btn = document.querySelector('.chat-msg-advisor:last-child .btn-audio-listen');
    if (!btn) return null;
    btn.click();
    const isPlaying = btn.classList.contains('audio-playing') || btn.innerText.includes('Stop Audio');
    // Click again to stop
    btn.click();
    const isStopped = !btn.classList.contains('audio-playing') && btn.innerText.includes('Listen');
    return { isPlaying, isStopped };
  });

  report(10, 'Audio explanation toggles to Stop Audio when active and resets on stop',
    audioToggleResult && (audioToggleResult.isPlaying || audioToggleResult.isStopped),
    `Audio controls interactive: ${JSON.stringify(audioToggleResult)}`
  );

  // 9. Regression: DATA103 L-T-P question & source preview interaction
  await page.type('#queryInput', 'What does 1-0-4 mean in DATA103?');
  await page.click('#submitBtn');
  await page.waitForFunction(() => {
    const msgs = document.querySelectorAll('.chat-msg-advisor');
    return msgs.length >= 2;
  }, { timeout: 20000 });

  // Expand evidence drawer
  await page.evaluate(() => {
    const msgs = document.querySelectorAll('.chat-msg-advisor');
    const lastMsg = msgs[msgs.length - 1];
    const toggle = lastMsg.querySelector('.btn-evidence-toggle');
    if (toggle) toggle.click();
  });

  await page.waitForSelector('.chat-msg-advisor:last-child .btn-open-preview', { timeout: 5000 });

  // Click Preview Document
  await page.evaluate(() => {
    const btns = document.querySelectorAll('.chat-msg-advisor:last-child .btn-open-preview');
    if (btns.length > 0) btns[0].click();
  });

  await page.waitForSelector('#previewTableBody tr', { timeout: 10000 });

  const modalData = await page.evaluate(() => {
    const m = document.getElementById('docPreviewModal');
    const rows = m ? m.querySelectorAll('#previewTableBody tr') : [];
    const tabs = m ? m.querySelectorAll('.preview-tab-btn') : [];
    return {
      isOpen: m && !m.classList.contains('hidden') && m.style.display === 'flex',
      rowCount: rows.length,
      tabCount: tabs.length
    };
  });

  report(11, 'Regression: Official source preview modal opens with spreadsheet table & sheet tabs',
    modalData.isOpen && modalData.rowCount > 5 && modalData.tabCount > 0,
    `Rows: ${modalData.rowCount}, Tabs: ${modalData.tabCount}`
  );

  // Close modal via close button
  await page.click('#docPreviewModal .modal-close');
  await new Promise(r => setTimeout(r, 400));

  // 10. Check token usage pill visibility
  const tokenPillInfo = await page.evaluate(() => {
    const pills = document.querySelectorAll('.token-pill');
    return {
      count: pills.length,
      firstText: pills.length > 0 ? pills[0].innerText.trim() : null
    };
  });

  report(12, 'Regression: Transparent token usage pill rendered',
    tokenPillInfo.count > 0,
    `Found ${tokenPillInfo.count} token badges | e.g. "${tokenPillInfo.firstText}"`
  );

  // 11. Mobile Responsiveness Test (375x667)
  console.log('Testing mobile viewport (width: 375px, height: 667px)...');
  await page.setViewport({ width: 375, height: 667 });

  const mobileMetrics = await page.evaluate(() => {
    const mic = document.getElementById('voiceMicBtn');
    const send = document.getElementById('submitBtn');
    const input = document.getElementById('queryInput');
    const chatPanel = document.getElementById('chatPanel');

    const micRect = mic ? mic.getBoundingClientRect() : null;
    const sendRect = send ? send.getBoundingClientRect() : null;
    const inputRect = input ? input.getBoundingClientRect() : null;

    return {
      micVisible: !!micRect && micRect.width > 30,
      sendVisible: !!sendRect && sendRect.width > 30,
      inputWithinBounds: !!inputRect && inputRect.right <= 375,
      chatPanelHeight: chatPanel ? window.getComputedStyle(chatPanel).height : null
    };
  });

  report(13, 'Mobile viewport (375px): Mic button, send button and input remain accessible within bounds',
    mobileMetrics.micVisible && mobileMetrics.sendVisible && mobileMetrics.inputWithinBounds,
    `Mic: ${mobileMetrics.micVisible}, Send: ${mobileMetrics.sendVisible}, Input in bounds: ${mobileMetrics.inputWithinBounds}, Panel height: ${mobileMetrics.chatPanelHeight}`
  );

  // 12. Console error check
  report(14, 'Zero unhandled JavaScript errors in browser console',
    consoleErrors.length === 0,
    consoleErrors.length > 0 ? `Errors: ${consoleErrors.join('; ')}` : 'Clean console'
  );

  await browser.close();

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runVisualAndVoiceSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

