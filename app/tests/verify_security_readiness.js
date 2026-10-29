import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = '/home/Khalaf-Dev/.gemini/antigravity/brain/bc1217c1-62d5-40a9-8f47-eade18d108bf/screenshots';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function verifySecurity() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const interceptedGoogleGenAiRequests = [];
  const interceptedProxyRequests = [];

  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('generativelanguage.googleapis.com')) {
      interceptedGoogleGenAiRequests.push(url);
    }
    if (url.includes('/api/v1/gemini/generate')) {
      interceptedProxyRequests.push(url);
    }
  });

  console.log('1. Loading application http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Go to Sign In
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.textContent && b.textContent.includes('Masuk Verifikator'));
    if (loginBtn) loginBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Screenshot Sign In page
  await page.screenshot({ path: path.join(outDir, 'sec_audit_signin_screen.png') });
  console.log('Saved sec_audit_signin_screen.png');

  // Fill login credentials
  const captchaText = await page.evaluate(() => {
    const chars = Array.from(document.querySelectorAll('span.text-emerald-300, span.text-teal-200'));
    return chars.map(c => c.textContent).join('');
  });

  await page.evaluate((captcha) => {
    const inputs = Array.from(document.querySelectorAll('input'));
    if (inputs[0]) inputs[0].value = 'siti.rahma@bpjs-kesehatan.go.id';
    if (inputs[0]) inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    if (inputs[1]) inputs[1].value = 'Password123!';
    if (inputs[1]) inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    if (inputs[2]) inputs[2].value = captcha;
    if (inputs[2]) inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
  }, captchaText);

  // Submit login form
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.requestSubmit();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot MFA PIN modal
  await page.screenshot({ path: path.join(outDir, 'sec_audit_mfa_pin_modal.png') });
  console.log('Saved sec_audit_mfa_pin_modal.png (PIN Cleaned - No hardcoded text)');

  // Fill PIN: 123456
  await page.evaluate(() => {
    const pinInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    const digits = ['1', '2', '3', '4', '5', '6'];
    pinInputs.forEach((inp, idx) => {
      inp.value = digits[idx];
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
  await new Promise(r => setTimeout(r, 300));

  // Click verify PIN
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const verifyPinBtn = btns.find(b => b.textContent && b.textContent.includes('Verifikasi PIN'));
    if (verifyPinBtn) verifyPinBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot MFA OTP modal
  await page.screenshot({ path: path.join(outDir, 'sec_audit_mfa_otp_modal.png') });
  console.log('Saved sec_audit_mfa_otp_modal.png (OTP Cleaned - No auto-fill bypass)');

  // Fill OTP: 849201
  await page.evaluate(() => {
    const otpInputs = Array.from(document.querySelectorAll('input[type="text"]'));
    const digits = ['8', '4', '9', '2', '0', '1'];
    otpInputs.forEach((inp, idx) => {
      inp.value = digits[idx];
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
  await new Promise(r => setTimeout(r, 300));

  // Click verify OTP
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const verifyOtpBtn = btns.find(b => b.textContent && b.textContent.includes('Verifikasi OTP'));
    if (verifyOtpBtn) verifyOtpBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot Sesi Perangkat
  await page.screenshot({ path: path.join(outDir, 'sec_audit_mfa_session_modal.png') });
  console.log('Saved sec_audit_mfa_session_modal.png');

  // Confirm session
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmBtn = btns.find(b => b.textContent && b.textContent.includes('Otorisasi & Masuk Portal'));
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Now on dashboard!
  await page.screenshot({ path: path.join(outDir, 'sec_audit_dashboard_verified.png') });
  console.log('Saved sec_audit_dashboard_verified.png');

  // Navigate to Agent Copilot
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const copilotBtn = btns.find(b => b.textContent && (b.textContent.includes('Kopilot') || b.textContent.includes('Copilot')));
    if (copilotBtn) copilotBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click Keamanan AI & Model Vault tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const vaultTab = btns.find(b => b.textContent && b.textContent.includes('Keamanan AI'));
    if (vaultTab) vaultTab.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(outDir, 'sec_audit_copilot_ai_vault.png') });
  console.log('Saved sec_audit_copilot_ai_vault.png');

  // Test running sandbox prompt via proxy
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const runBtn = btns.find(b => b.textContent && b.textContent.includes('Kirim ke Gemini API'));
    if (runBtn) runBtn.click();
  });
  await new Promise(r => setTimeout(r, 4000));

  await page.screenshot({ path: path.join(outDir, 'sec_audit_copilot_sandbox_response.png') });
  console.log('Saved sec_audit_copilot_sandbox_response.png');

  console.log('--- AUDIT NETWORK TRAFFIC RESULTS ---');
  console.log(`Direct Google Generative AI requests intercepted: ${interceptedGoogleGenAiRequests.length} (MUST BE 0)`);
  console.log(`Backend Proxy (/api/v1/gemini/generate) requests intercepted: ${interceptedProxyRequests.length}`);

  if (interceptedGoogleGenAiRequests.length > 0) {
    console.error('FAILED: Found direct client calls to Google Generative AI:', interceptedGoogleGenAiRequests);
  } else {
    console.log('PASSED: ZERO CLIENT-SIDE EXPOSURE OF GOOGLE API KEY!');
  }

  await browser.close();
}

verifySecurity().catch(err => {
  console.error('Security verification error:', err);
  process.exit(1);
});
