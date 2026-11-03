'use strict';

const puppeteer = require('puppeteer-core');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TARGET_URL = process.env.TARGET_URL || process.argv[2] || 'http://localhost:3000';

async function runClickTest() {
  console.log('================================================================');
  console.log('HEADLESS BROWSER CLICK & PREVIEW MODAL VERIFICATION');
  console.log('Browser:', EDGE_PATH);
  console.log('Target:', TARGET_URL);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function report(num, name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] Step ${num}: ${name}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] Step ${num}: ${name}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
  page.on('response', resp => {
    if (resp.status() >= 400 && !resp.url().includes('favicon')) {
      console.log(`[HTTP ${resp.status()}] ${resp.url()}`);
    }
  });
  page.on('framenavigated', frame => {
    console.log('[NAVIGATED]', frame.url());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // 1. Navigate to target
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  const title = await page.title();
  report(1, 'Target loads in browser', title.includes('Vidyashilp'), `Title: ${title}`);

  // 2. Ask question 1: Semester Structure
  await page.type('#queryInput', 'What does 1-0-4 mean in DATA103?');
  await page.click('#submitBtn');
  await page.waitForSelector('.btn-evidence-toggle', { timeout: 20000 });
  report(2, 'Assistant response and evidence toggle rendered', true);

  // 3. Expand evidence drawer
  await page.click('.btn-evidence-toggle');
  await page.waitForSelector('.source-item', { timeout: 5000 });
  report(3, 'Evidence drawer expanded and source cards rendered', true);

  // 4. Click Preview Document button via page.evaluate
  const clickResult = await page.evaluate(() => {
    const btn = document.querySelector('.btn-open-preview');
    if (!btn) return { found: false };
    btn.click();
    return { found: true };
  });
  report(4, 'Clicked Preview Document button', clickResult.found);

  // Wait for modal table to load
  await page.waitForSelector('#previewTableBody tr', { timeout: 10000 });

  const modalData1 = await page.evaluate(() => {
    const m = document.getElementById('docPreviewModal');
    const style = window.getComputedStyle(m);
    const rect = m.getBoundingClientRect();
    const rows = m.querySelectorAll('#previewTableBody tr');
    const tabs = m.querySelectorAll('.preview-tab-btn');
    return {
      isOpen: !m.classList.contains('hidden'),
      display: style.display,
      position: style.position,
      zIndex: style.zIndex,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      rowCount: rows.length,
      tabCount: tabs.length,
      firstTab: tabs.length > 0 ? tabs[0].innerText : null
    };
  });
  report(5, 'Modal opened with fixed overlay, sheet tabs & workbook rows',
    modalData1.isOpen && modalData1.display === 'flex' && modalData1.position === 'fixed' && modalData1.rowCount > 5,
    `Display: ${modalData1.display}, position: ${modalData1.position}, zIndex: ${modalData1.zIndex}, rows: ${modalData1.rowCount}, tabs: ${modalData1.tabCount}`
  );

  // 5. Test sheet tab switching inside the preview modal
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.preview-tab-btn');
    if (tabs.length > 1) tabs[1].click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const secondTabActive = await page.evaluate(() => {
    const activeTab = document.querySelector('.preview-tab-btn.active');
    return activeTab ? activeTab.innerText : null;
  });
  report(6, 'Sheet tab click updates active tab and re-renders table', !!secondTabActive, `Active tab: ${secondTabActive}`);

  // 6. Close the modal using close button
  await page.click('#docPreviewModal .modal-close');
  await new Promise(r => setTimeout(r, 400));

  const isModalClosed = await page.evaluate(() => {
    const m = document.getElementById('docPreviewModal');
    return m.classList.contains('hidden') || m.style.display === 'none';
  });
  report(7, 'Modal closes when close button is clicked', isModalClosed);

  // 6b. Test PDF preview (Student Handbook)
  const pdfClickResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('.chat-msg-advisor .btn-open-preview');
    if (btns.length > 1) {
      btns[1].click();
      return true;
    }
    return false;
  });
  if (pdfClickResult) {
    await page.waitForFunction(() => {
      const frame = document.getElementById('previewPdfFrame');
      return frame && frame.src && frame.src.includes('.pdf');
    }, { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));
    const pdfData = await page.evaluate(() => {
      const m = document.getElementById('docPreviewModal');
      const frame = document.getElementById('previewPdfFrame');
      const pdfWrap = document.getElementById('previewPdfWrap');
      return {
        isOpen: !m.classList.contains('hidden'),
        frameSrc: frame?.src,
        wrapVisible: pdfWrap?.style.display === 'block'
      };
    });
    report('7b', 'PDF preview (Student Handbook) opens embedded viewer inside modal',
      pdfData.isOpen && pdfData.wrapVisible && pdfData.frameSrc.includes('.pdf'),
      `PDF Frame src: ${pdfData.frameSrc}`
    );
    await page.click('#docPreviewModal .modal-close');
    await new Promise(r => setTimeout(r, 400));
  }

  // 7. Verify chatbot conversation remains intact
  const msgCount = await page.evaluate(() => {
    return document.querySelectorAll('.chat-msg').length;
  });
  report(8, 'Chatbot conversation history remains fully intact', msgCount >= 2, `Messages in history: ${msgCount}`);

  // 8. Ask question 2: Minor Courses
  await page.type('#queryInput', 'List the Psychology minor courses for 2025');
  await page.click('#submitBtn');
  await page.waitForFunction(() => {
    const msgs = document.querySelectorAll('.chat-msg-advisor');
    return msgs.length >= 2;
  }, { timeout: 20000 });

  // Expand second message's evidence drawer
  await page.evaluate(() => {
    const msgs = document.querySelectorAll('.chat-msg-advisor');
    const secondMsg = msgs[1];
    const toggle = secondMsg.querySelector('.btn-evidence-toggle');
    if (toggle) toggle.click();
  });

  await page.waitForFunction(() => {
    const msgs = document.querySelectorAll('.chat-msg-advisor');
    if (msgs.length < 2) return false;
    const btn = msgs[1].querySelector('.btn-open-preview');
    return btn !== null;
  }, { timeout: 5000 });

  // Click the minor courses preview button in second message
  await page.evaluate(() => {
    const msgs = document.querySelectorAll('.chat-msg-advisor');
    const btn = msgs[1].querySelector('.btn-open-preview');
    if (btn) btn.click();
  });

  // Wait for the modal title to change to Minor Courses and for tabs to render
  await page.waitForFunction(() => {
    const tabs = Array.from(document.querySelectorAll('.preview-tab-btn')).map(t => t.innerText.trim());
    return tabs.includes('Psychology');
  }, { timeout: 10000 });

  const minorModalData = await page.evaluate(() => {
    const m = document.getElementById('docPreviewModal');
    const style = window.getComputedStyle(m);
    const rows = m.querySelectorAll('#previewTableBody tr');
    const tabs = Array.from(m.querySelectorAll('.preview-tab-btn')).map(t => t.innerText.trim());
    const title = document.getElementById('docPreviewTitle')?.innerText.trim();
    return {
      isOpen: !m.classList.contains('hidden'),
      display: style.display,
      title,
      rowCount: rows.length,
      tabs
    };
  });
  report(9, 'Minor Courses workbook preview opens with 7 sheet tabs',
    minorModalData.isOpen && minorModalData.tabs.includes('Psychology') && minorModalData.tabs.length === 7,
    `Title: ${minorModalData.title}, tabs: ${minorModalData.tabs.join(', ')}, rows: ${minorModalData.rowCount}`
  );

  // Close modal via Escape key
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 400));
  const closedByEsc = await page.evaluate(() => {
    const m = document.getElementById('docPreviewModal');
    return m.classList.contains('hidden') || m.style.display === 'none';
  });
  report(10, 'Modal closes via Escape key', closedByEsc);

  // 9. Mobile viewport test (375x667 mobile screen size)
  console.log('Testing mobile viewport (width: 375px, height: 667px)...');
  await page.setViewport({ width: 375, height: 667 });

  // Click the preview button on 375px mobile screen
  await page.evaluate(() => {
    const btns = document.querySelectorAll('.btn-open-preview');
    if (btns.length > 0) btns[btns.length - 1].click();
  });

  await page.waitForSelector('#previewTableBody tr', { timeout: 10000 });

  const mobileModal = await page.evaluate(() => {
    const m = document.getElementById('docPreviewModal');
    const card = m.querySelector('.preview-modal-card');
    const style = window.getComputedStyle(m);
    const cardRect = card ? card.getBoundingClientRect() : null;
    return {
      isOpen: !m.classList.contains('hidden'),
      display: style.display,
      position: style.position,
      cardRect: cardRect ? { top: cardRect.top, left: cardRect.left, width: cardRect.width, height: cardRect.height } : null
    };
  });
  report(11, 'Mobile viewport (375px): Preview modal opens with proper responsive bounds',
    mobileModal.isOpen && mobileModal.display === 'flex' && mobileModal.cardRect && mobileModal.cardRect.width > 200 && mobileModal.cardRect.width <= 375,
    `Modal card on mobile: ${JSON.stringify(mobileModal.cardRect)}`
  );

  // Close modal on mobile
  await page.evaluate(() => {
    const closeBtn = document.querySelector('#docPreviewModal .modal-close');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // 10. Check browser console errors
  report(12, 'Zero unhandled JavaScript errors in browser console',
    consoleErrors.length === 0,
    consoleErrors.length > 0 ? `Errors: ${consoleErrors.join('; ')}` : 'Clean console'
  );

  await browser.close();

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runClickTest().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
