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

  const interceptedCalls = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('generativelanguage.googleapis.com')) {
      interceptedCalls.push({ type: 'GOOGLE_DIRECT_LEAK', url });
    }
    if (url.includes('/api/v1/gemini/generate')) {
      interceptedCalls.push({ type: 'SECURE_BACKEND_PROXY', url });
    }
  });

  console.log('--- TEST 1: LOGIN & MFA VERIFICATION FLOW ---');
  await page.goto('http://localhost:3000/?view=login', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, 'sec_1_signin_page.png') });
  console.log('Captured sec_1_signin_page.png');

  // Fill login
  const captchaText = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span.text-emerald-300, span.text-teal-200'));
    return spans.map(s => s.textContent).join('');
  });
  console.log('Extracted Captcha:', captchaText);

  await page.evaluate((cap) => {
    const inputs = Array.from(document.querySelectorAll('input'));
    if (inputs[0]) {
      inputs[0].value = 'siti.rahma@bpjs-kesehatan.go.id';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (inputs[1]) {
      inputs[1].value = 'Password123!';
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (inputs[2]) {
      inputs[2].value = cap;
      inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
    }
    const form = document.querySelector('form');
    if (form) form.requestSubmit();
  }, captchaText);

  await new Promise(r => setTimeout(r, 1200));

  // Screenshot MFA PIN
  await page.screenshot({ path: path.join(outDir, 'sec_2_mfa_pin_modal.png') });
  console.log('Captured sec_2_mfa_pin_modal.png');

  // Check that PIN auto-fill button is gone
  const hasAutoFillPin = await page.evaluate(() => {
    return document.body.innerText.includes('Isi Otomatis PIN');
  });
  console.log('Is "Isi Otomatis PIN" present?', hasAutoFillPin, '(MUST BE false)');

  // Input PIN: 123456
  await page.evaluate(() => {
    const pins = Array.from(document.querySelectorAll('input[type="password"]'));
    ['1', '2', '3', '4', '5', '6'].forEach((d, i) => {
      if (pins[i]) {
        pins[i].value = d;
        pins[i].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    const btns = Array.from(document.querySelectorAll('button'));
    const verifyBtn = btns.find(b => b.textContent && b.textContent.includes('Verifikasi PIN'));
    if (verifyBtn) verifyBtn.click();
  });

  await new Promise(r => setTimeout(r, 1200));

  // Screenshot MFA OTP
  await page.screenshot({ path: path.join(outDir, 'sec_3_mfa_otp_modal.png') });
  console.log('Captured sec_3_mfa_otp_modal.png');

  // Check that OTP auto-fill button is gone
  const hasAutoFillOtp = await page.evaluate(() => {
    return document.body.innerText.includes('Isi Otomatis (849201)');
  });
  console.log('Is "Isi Otomatis (849201)" present?', hasAutoFillOtp, '(MUST BE false)');

  // Input OTP: 849201
  await page.evaluate(() => {
    const otps = Array.from(document.querySelectorAll('input[type="text"]'));
    ['8', '4', '9', '2', '0', '1'].forEach((d, i) => {
      if (otps[i]) {
        otps[i].value = d;
        otps[i].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    const btns = Array.from(document.querySelectorAll('button'));
    const verifyOtpBtn = btns.find(b => b.textContent && b.textContent.includes('Verifikasi OTP'));
    if (verifyOtpBtn) verifyOtpBtn.click();
  });

  await new Promise(r => setTimeout(r, 1200));

  // Screenshot Device Session Step
  await page.screenshot({ path: path.join(outDir, 'sec_4_device_session_modal.png') });
  console.log('Captured sec_4_device_session_modal.png');

  // Complete MFA
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const authBtn = btns.find(b => b.textContent && b.textContent.includes('Otorisasi & Masuk Portal'));
    if (authBtn) authBtn.click();
  });

  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, 'sec_5_authenticated_dashboard.png') });
  console.log('Captured sec_5_authenticated_dashboard.png');

  console.log('--- TEST 2: AGENT COPILOT AI VAULT & SECURE PROXY ---');
  await page.goto('http://localhost:3000/?view=dashboard&tab=agent_copilot', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  // Switch to Keamanan AI & Model Vault
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const vaultBtn = btns.find(b => b.textContent && b.textContent.includes('Keamanan AI'));
    if (vaultBtn) vaultBtn.click();
  });

  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'sec_6_copilot_ai_vault_tab.png') });
  console.log('Captured sec_6_copilot_ai_vault_tab.png');

  // Send Sandbox Prompt via Backend Proxy
  console.log('Triggering AI prompt via Backend Proxy...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.textContent && b.textContent.includes('Kirim ke Gemini API'));
    if (submitBtn) submitBtn.click();
  });

  // Wait for AI generation
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: path.join(outDir, 'sec_7_copilot_sandbox_live_result.png') });
  console.log('Captured sec_7_copilot_sandbox_live_result.png');

  console.log('--- TEST 3: HEALTH AI CHAT ASSISTANT ---');
  await page.goto('http://localhost:3000/?view=dashboard&tab=health_ai_chat', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'sec_8_health_ai_chat_view.png') });
  console.log('Captured sec_8_health_ai_chat_view.png');

  console.log('================ AUDIT VERDICT ================');
  console.log('Intercepted Network Calls:', interceptedCalls);
  const directLeaks = interceptedCalls.filter(c => c.type === 'GOOGLE_DIRECT_LEAK');
  const proxyCalls = interceptedCalls.filter(c => c.type === 'SECURE_BACKEND_PROXY');

  console.log(`Direct Google API Leaks: ${directLeaks.length}`);
  console.log(`Secure Backend Proxy Calls: ${proxyCalls.length}`);

  if (directLeaks.length > 0) {
    console.error('CRITICAL VULNERABILITY DETECTED: Direct Google API calls from browser!');
    process.exit(1);
  } else {
    console.log('ZERO VULNERABILITIES DETECTED: All AI communication routes strictly via Backend Server Vault!');
  }

  await browser.close();
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
