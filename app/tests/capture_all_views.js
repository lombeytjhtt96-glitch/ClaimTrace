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

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Direct login state injection or regular login
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.textContent && b.textContent.includes('Masuk Verifikator'));
    if (loginBtn) loginBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const nip = inputs.find(i => i.placeholder && i.placeholder.includes('NIP'));
    const pass = inputs.find(i => i.type === 'password');
    const captcha = inputs.find(i => i.placeholder && i.placeholder.includes('CAPTCHA'));
    if (nip) {
      nip.value = '199208152015031002';
      nip.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (pass) {
      pass.value = 'Password123!';
      pass.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const capEl = document.querySelector('.tracking-widest') || document.querySelector('span[class*="tracking-"]');
    const capText = capEl ? capEl.textContent.trim() : 'ABCDE';
    if (captcha) {
      captcha.value = capText;
      captcha.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const form = document.querySelector('form');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });

  await new Promise(r => setTimeout(r, 1000));

  // Fill 2FA PIN & OTP
  await page.evaluate(() => {
    const pinInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    if (pinInputs.length >= 6) {
      '123456'.split('').forEach((d, idx) => {
        pinInputs[idx].value = d;
        pinInputs[idx].dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
    const textInputs = Array.from(document.querySelectorAll('input[type="text"]'));
    const otpInputs = textInputs.filter(i => i.maxLength === 1);
    if (otpInputs.length >= 6) {
      '889900'.split('').forEach((d, idx) => {
        otpInputs[idx].value = d;
        otpInputs[idx].dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.textContent && (b.textContent.includes('Verifikasi & Buka Dasbor') || b.textContent.includes('Verifikasi Otorisasi')));
    if (submitBtn) submitBtn.click();
  });

  await new Promise(r => setTimeout(r, 1200));

  async function clickNav(text) {
    await page.evaluate((navText) => {
      const items = Array.from(document.querySelectorAll('button, a, span'));
      const target = items.find(el => el.textContent && el.textContent.trim().includes(navText));
      if (target) {
        const btn = target.closest('button') || target;
        btn.click();
      }
    }, text);
    await new Promise(r => setTimeout(r, 800));
  }

  // 1. Matriks 3 Lapis Bukti
  console.log('Opening Matriks 3 Lapis Bukti...');
  await clickNav('Matriks 3 Lapis Bukti');
  await page.screenshot({ path: path.join(outDir, 'view_matriks_3_lapis.png'), fullPage: false });

  // 2. AI Agent Forensik ReAct
  console.log('Opening AI Agent Forensik ReAct...');
  await clickNav('AI Agent Forensik ReAct');
  await page.screenshot({ path: path.join(outDir, 'view_react_copilot.png'), fullPage: false });

  // 3. Konsol Eksekusi & BAKB
  console.log('Opening Konsol Eksekusi & BAKB...');
  await clickNav('Konsol Eksekusi & BAKB');
  await page.screenshot({ path: path.join(outDir, 'view_decision_console.png'), fullPage: false });

  // 4. Surveilans Faskes (FRI)
  console.log('Opening Surveilans Faskes (FRI)...');
  await clickNav('Surveilans Faskes (FRI)');
  await page.screenshot({ path: path.join(outDir, 'view_faskes_surveillance.png'), fullPage: false });

  // 5. Forensik Data Empiris
  console.log('Opening Forensik Data Empiris...');
  await clickNav('Forensik Data Empiris');
  await page.screenshot({ path: path.join(outDir, 'view_empirical_forensics.png'), fullPage: false });

  // 6. Dual View (Simulator Mobile JKN + Cockpit)
  console.log('Opening Dual View...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const dualBtn = btns.find(b => b.textContent && b.textContent.includes('Dual View'));
    if (dualBtn) dualBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'view_dual_cockpit_mobile.png'), fullPage: false });

  await browser.close();
  console.log('All views captured successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
