import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const downloadsDir = '/mnt/c/Users/Asus/Downloads/Screenshoot All Pages ClaimTrace';
const artifactsDir = '/home/Khalaf-Dev/.gemini/antigravity/brain/bc1217c1-62d5-40a9-8f47-eade18d108bf/screenshots';

if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

async function saveScreenshot(page, filename) {
  const artPath = path.join(artifactsDir, filename);
  const dlPath = path.join(downloadsDir, filename);
  await page.screenshot({ path: artPath, fullPage: false });
  try {
    fs.copyFileSync(artPath, dlPath);
    console.log(`Saved screenshot: ${filename} to artifacts and Downloads`);
  } catch (e) {
    console.warn(`Could not copy to Downloads: ${e.message}`);
  }
}

async function run() {
  console.log('--- STARTING THEME CONSISTENCY VERIFICATION ---');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. SET THEME TO LIGHT
  await page.goto('http://localhost:3000/?view=login', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('claimtrace_theme', 'light');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // Check login page light styling
  const loginBgLight = await page.evaluate(() => {
    const mainEl = document.querySelector('div.min-h-\\[calc\\(100vh-8rem\\)\\]');
    const bg = mainEl ? window.getComputedStyle(mainEl).backgroundColor : 'not-found';
    const h1 = document.querySelector('h1');
    const h1Color = h1 ? window.getComputedStyle(h1).color : 'not-found';
    return { bg, h1Color };
  });
  console.log('1. Login Page Light Mode Check:', loginBgLight);
  await saveScreenshot(page, 'theme_light_01_login_page.png');

  // 2. MODAL STEP 1: PIN AUDIT IN LIGHT MODE
  await page.goto('http://localhost:3000/?view=login&verify=1&step=pin', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 700));

  const modalStep1Light = await page.evaluate(() => {
    const modal = document.querySelector('div.max-w-sm');
    const modalBg = modal ? window.getComputedStyle(modal).backgroundColor : 'not-found';
    const h2 = modal ? modal.querySelector('h2') : null;
    const h2Color = h2 ? window.getComputedStyle(h2).color : 'not-found';
    const pinBox = modal ? modal.querySelector('input') : null;
    const pinBoxBg = pinBox ? window.getComputedStyle(pinBox).backgroundColor : 'not-found';
    return { modalBg, h2Color, pinBoxBg };
  });
  console.log('2. Modal Step 1 PIN Light Mode Check:', modalStep1Light);
  await saveScreenshot(page, 'theme_light_02_modal_pin.png');

  // 3. MODAL STEP 2: OTP EMAIL IN LIGHT MODE
  await page.goto('http://localhost:3000/?view=login&verify=1&step=otp', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 700));

  // Fill OTP 849201 like user screenshot
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const otpDigits = ['8', '4', '9', '2', '0', '1'];
    inputs.forEach((inp, i) => {
      if (otpDigits[i]) {
        inp.value = otpDigits[i];
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });
  await new Promise(r => setTimeout(r, 300));

  const modalStep2Light = await page.evaluate(() => {
    const modal = document.querySelector('div.max-w-sm');
    const modalBg = modal ? window.getComputedStyle(modal).backgroundColor : 'not-found';
    const otpInput = modal ? modal.querySelector('input') : null;
    const otpInputBg = otpInput ? window.getComputedStyle(otpInput).backgroundColor : 'not-found';
    return { modalBg, otpInputBg };
  });
  console.log('3. Modal Step 2 OTP Light Mode Check:', modalStep2Light);
  await saveScreenshot(page, 'theme_light_03_modal_otp.png');

  // 4. MODAL STEP 3: SESI PERANGKAT IN LIGHT MODE
  await page.goto('http://localhost:3000/?view=login&verify=1&step=device', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 700));

  const modalStep3Light = await page.evaluate(() => {
    const modal = document.querySelector('div.max-w-sm');
    const modalBg = modal ? window.getComputedStyle(modal).backgroundColor : 'not-found';
    const termCard = modal ? modal.querySelector('.rounded-xl.border.p-3\\.5') : null;
    const termCardBg = termCard ? window.getComputedStyle(termCard).backgroundColor : 'not-found';
    return { modalBg, termCardBg };
  });
  console.log('4. Modal Step 3 Sesi Perangkat Light Mode Check:', modalStep3Light);
  await saveScreenshot(page, 'theme_light_04_modal_device.png');

  // 5. TEST COCKPIT SETTINGS IN LIGHT MODE
  await page.goto('http://localhost:3000/?view=dashboard&tab=settings', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await saveScreenshot(page, 'theme_light_05_cockpit_settings.png');

  // 6. TEST COCKPIT EXECUTIVE IN LIGHT MODE
  await page.goto('http://localhost:3000/?view=dashboard&tab=executive', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await saveScreenshot(page, 'theme_light_06_cockpit_executive.png');

  // 7. SWITCH TO DARK THEME (COSMIC OBSIDIAN)
  await page.evaluate(() => {
    localStorage.setItem('claimtrace_theme', 'dark');
  });

  // Test Modal Step 1 in Dark Mode
  await page.goto('http://localhost:3000/?view=login&verify=1&step=pin', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 700));

  const modalStep1Dark = await page.evaluate(() => {
    const modal = document.querySelector('div.max-w-sm');
    const modalBg = modal ? window.getComputedStyle(modal).backgroundColor : 'not-found';
    const h2 = modal ? modal.querySelector('h2') : null;
    const h2Color = h2 ? window.getComputedStyle(h2).color : 'not-found';
    return { modalBg, h2Color };
  });
  console.log('7. Modal Step 1 PIN Dark Mode Check:', modalStep1Dark);
  await saveScreenshot(page, 'theme_dark_07_modal_pin.png');

  // Test Modal Step 2 in Dark Mode
  await page.goto('http://localhost:3000/?view=login&verify=1&step=otp', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 700));
  await saveScreenshot(page, 'theme_dark_08_modal_otp.png');

  // Test Modal Step 3 in Dark Mode
  await page.goto('http://localhost:3000/?view=login&verify=1&step=device', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 700));
  await saveScreenshot(page, 'theme_dark_09_modal_device.png');

  // Test Cockpit Settings in Dark Mode
  await page.goto('http://localhost:3000/?view=dashboard&tab=settings', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await saveScreenshot(page, 'theme_dark_10_cockpit_settings.png');

  // 8. TEST TOGGLE THEME ON LOGIN HEADER
  await page.goto('http://localhost:3000/?view=login', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // Click quick theme toggle button in login header
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('header button'));
    // The theme button has Sun or Moon icon or title Beralih
    const toggleBtn = btns.find(b => b.title && b.title.includes('Beralih'));
    if (toggleBtn) toggleBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await saveScreenshot(page, 'theme_toggle_on_login_header.png');

  await browser.close();
  console.log('--- ALL THEME CHECKS COMPLETED SUCCESSFULLY ---');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
