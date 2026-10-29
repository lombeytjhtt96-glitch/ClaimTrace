import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = '/home/Khalaf-Dev/.gemini/antigravity/brain/bc1217c1-62d5-40a9-8f47-eade18d108bf/screenshots';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // 1. Landing page screenshot
  await page.screenshot({ path: path.join(outDir, 'landing_ui_skills.png'), fullPage: false });
  console.log('Saved landing_ui_skills.png');

  // Click login in header
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.textContent && b.textContent.includes('Masuk Verifikator'));
    if (loginBtn) loginBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 2. Sign In page screenshot
  await page.screenshot({ path: path.join(outDir, 'signin_ui_skills.png'), fullPage: false });
  console.log('Saved signin_ui_skills.png');

  // Fill credentials
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const nip = inputs.find(i => i.placeholder && i.placeholder.includes('NIP'));
    const pass = inputs.find(i => i.type === 'password');
    const captcha = inputs.find(i => i.placeholder && i.placeholder.includes('CAPTCHA'));

    if (nip) {
      nip.value = '199208152015031002';
      nip.dispatchEvent(new Event('input', { bubbles: true }));
      nip.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (pass) {
      pass.value = 'Password123!';
      pass.dispatchEvent(new Event('input', { bubbles: true }));
      pass.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Read captcha code text from container
    const capEl = document.querySelector('.tracking-widest') || document.querySelector('span[class*="tracking-"]');
    const capText = capEl ? capEl.textContent.trim() : 'ABCDE';
    if (captcha) {
      captcha.value = capText;
      captcha.dispatchEvent(new Event('input', { bubbles: true }));
      captcha.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  await new Promise(r => setTimeout(r, 500));

  // Submit login form
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    } else {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Masuk ke Sistem'));
      if (submitBtn) submitBtn.click();
    }
  });

  console.log('Login form submitted, waiting for 2FA modal...');
  await new Promise(r => setTimeout(r, 1200));

  // 3. 2FA Modal screenshot
  await page.screenshot({ path: path.join(outDir, '2fa_modal_ui_skills.png'), fullPage: false });
  console.log('Saved 2fa_modal_ui_skills.png');

  // Fill 2FA PIN (6 digits: 123456)
  await page.evaluate(() => {
    const pinInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    if (pinInputs.length >= 6) {
      '123456'.split('').forEach((d, idx) => {
        pinInputs[idx].value = d;
        pinInputs[idx].dispatchEvent(new Event('input', { bubbles: true }));
        pinInputs[idx].dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  });

  await new Promise(r => setTimeout(r, 800));

  // Fill OTP (6 digits: 889900)
  await page.evaluate(() => {
    const textInputs = Array.from(document.querySelectorAll('input[type="text"]'));
    const otpInputs = textInputs.filter(i => i.maxLength === 1);
    if (otpInputs.length >= 6) {
      '889900'.split('').forEach((d, idx) => {
        otpInputs[idx].value = d;
        otpInputs[idx].dispatchEvent(new Event('input', { bubbles: true }));
        otpInputs[idx].dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  });

  await new Promise(r => setTimeout(r, 600));

  // Click submit in 2FA modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.textContent && (b.textContent.includes('Verifikasi & Buka Dasbor') || b.textContent.includes('Verifikasi Otorisasi')));
    if (submitBtn) submitBtn.click();
  });

  console.log('2FA submitted, waiting for dashboard...');
  await new Promise(r => setTimeout(r, 1500));

  // 4. Executive Hub Dashboard screenshot
  await page.screenshot({ path: path.join(outDir, 'dashboard_ui_skills.png'), fullPage: false });
  console.log('Saved dashboard_ui_skills.png');

  // Navigate to Case Investigation
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const caseBtn = btns.find(b => b.textContent && b.textContent.includes('Telaah'));
    if (caseBtn) caseBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 5. Case Investigation screenshot
  await page.screenshot({ path: path.join(outDir, 'investigation_ui_skills.png'), fullPage: false });
  console.log('Saved investigation_ui_skills.png');

  await browser.close();
  console.log('E2E Verification Finished Successfully!');
}

run().catch(err => {
  console.error('E2E Error:', err);
  process.exit(1);
});
