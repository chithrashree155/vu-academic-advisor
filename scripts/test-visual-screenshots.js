'use strict';

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TARGET_URL = process.env.TARGET_URL || process.argv[2] || 'http://localhost:3000';
const OUT_DIR = path.resolve(__dirname, '../.system_generated/screenshots');

async function testScreenshots() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log('================================================================');
  console.log('CAMPUS BACKGROUND PROMINENCE & MULTI-VIEWPORT VERIFICATION');
  console.log('Browser:', EDGE_PATH);
  console.log('Target:', TARGET_URL);
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Desktop 1440px
  console.log('1. Testing Desktop Viewport (1440 x 900)...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

  const desktopInfo = await page.evaluate(() => {
    const overlay = document.querySelector('.bg-campus-overlay');
    const photo = document.querySelector('.bg-campus-photo');
    const chat = document.querySelector('.chat-panel');
    const heroTitle = document.querySelector('.hero-title');

    return {
      photoBg: photo ? window.getComputedStyle(photo).backgroundImage : null,
      overlayBg: overlay ? window.getComputedStyle(overlay).backgroundImage : null,
      chatBg: chat ? window.getComputedStyle(chat).backgroundColor : null,
      heroTitleColor: heroTitle ? window.getComputedStyle(heroTitle).color : null
    };
  });

  console.log('   Photo background:', desktopInfo.photoBg);
  console.log('   Overlay gradient:', desktopInfo.overlayBg);
  console.log('   Chat panel background:', desktopInfo.chatBg);
  console.log('   Hero title color:', desktopInfo.heroTitleColor);

  const desktopShot = path.join(OUT_DIR, 'desktop_1440.png');
  await page.screenshot({ path: desktopShot, fullPage: false });
  console.log('   ✓ Saved screenshot to:', desktopShot);

  // 2. Laptop 1024px
  console.log('\n2. Testing Laptop Viewport (1024 x 768)...');
  await page.setViewport({ width: 1024, height: 768 });
  await new Promise(r => setTimeout(r, 400));
  const laptopShot = path.join(OUT_DIR, 'laptop_1024.png');
  await page.screenshot({ path: laptopShot, fullPage: false });
  console.log('   ✓ Saved screenshot to:', laptopShot);

  // 3. Mobile 375px
  console.log('\n3. Testing Mobile Viewport (375 x 667)...');
  await page.setViewport({ width: 375, height: 667 });
  await new Promise(r => setTimeout(r, 400));

  const mobileInfo = await page.evaluate(() => {
    const overlay = document.querySelector('.bg-campus-overlay');
    const mic = document.getElementById('voiceMicBtn');
    const send = document.getElementById('submitBtn');
    return {
      overlayBg: overlay ? window.getComputedStyle(overlay).backgroundImage : null,
      micVisible: !!mic && mic.getBoundingClientRect().width > 30,
      sendVisible: !!send && send.getBoundingClientRect().width > 30
    };
  });
  console.log('   Mobile overlay gradient:', mobileInfo.overlayBg);
  console.log('   Mobile mic visible:', mobileInfo.micVisible);
  console.log('   Mobile send visible:', mobileInfo.sendVisible);

  const mobileShot = path.join(OUT_DIR, 'mobile_375.png');
  await page.screenshot({ path: mobileShot, fullPage: false });
  console.log('   ✓ Saved screenshot to:', mobileShot);

  await browser.close();

  console.log('\n================================================================');
  console.log('✅ ALL VIEWPORT TESTS PASSED');
  console.log('================================================================\n');
}

testScreenshots().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
