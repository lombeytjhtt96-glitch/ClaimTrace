import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // 1. Click Masuk Verifikator
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.textContent && b.textContent.includes('Masuk Verifikator'));
    if (loginBtn) loginBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 2. Fill login form
  await page.evaluate(() => {
    const setVal = (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const inputs = Array.from(document.querySelectorAll('input'));
    const nip = inputs.find(i => i.placeholder && i.placeholder.includes('NIP'));
    const pass = inputs.find(i => i.type === 'password');
    const captcha = inputs.find(i => i.placeholder && i.placeholder.includes('CAPTCHA'));
    if (nip) setVal(nip, '199208152015031002');
    if (pass) setVal(pass, 'Password123!');
    
    const capEl = document.querySelector('.tracking-widest') || document.querySelector('span[class*="tracking-"]');
    const capText = capEl ? capEl.textContent.trim() : 'ABCDE';
    if (captcha) setVal(captcha, capText);

    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Masuk Sistem'));
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // 3. Fill PIN
  await page.evaluate(() => {
    const setVal = (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const pinInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    if (pinInputs.length > 0) {
      const pin = '654321';
      pinInputs.forEach((inp, idx) => setVal(inp, pin[idx] || '0'));
      const verifyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Verifikasi & Masuk'));
      if (verifyBtn) verifyBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Logged in to Cockpit! Navigating to HealthAI Chat tab...');

  // 4. Click sidebar "Asisten Audit JKN (AI)"
  await page.evaluate(() => {
    const sidebarButtons = Array.from(document.querySelectorAll('button, a'));
    const chatTabBtn = sidebarButtons.find(b => b.textContent && b.textContent.includes('Asisten Audit JKN (AI)'));
    if (chatTabBtn) chatTabBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 5. Send message 1: "aku siapa?"
  console.log('Sending message 1: "aku siapa?"');
  await page.evaluate(() => {
    const setVal = (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const input = document.querySelector('input[placeholder*="Tanyakan analisis klaim"]');
    if (input) {
      setVal(input, 'aku siapa?');
      const form = input.closest('form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  });

  console.log('Waiting for response 1 from Gemini...');
  await new Promise(r => setTimeout(r, 4500));

  // 6. Send message 2: "berapa jumlah pasian"
  console.log('Sending message 2: "berapa jumlah pasian"');
  await page.evaluate(() => {
    const setVal = (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const input = document.querySelector('input[placeholder*="Tanyakan analisis klaim"]');
    if (input) {
      setVal(input, 'berapa jumlah pasian');
      const form = input.closest('form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  });

  console.log('Waiting for response 2 from Gemini...');
  await new Promise(r => setTimeout(r, 4500));

  // 7. Capture screenshot
  const screenshotPath = '/home/Khalaf-Dev/.gemini/antigravity/brain/bc1217c1-62d5-40a9-8f47-eade18d108bf/chat_healthai_verified.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to:', screenshotPath);

  // 8. Extract text of rendered messages
  const extracted = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div[class*="prose"], div[class*="markdown"], p'));
    return items
      .map(el => el.textContent.trim())
      .filter(t => t.includes('Budi Santoso') || t.includes('4.341') || t.includes('Jalur Hijau') || t.includes('Analis Forensik'));
  });
  console.log('Extracted AI Responses count:', extracted.length);
  extracted.forEach((e, idx) => console.log(`[Response ${idx + 1}]:`, e.slice(0, 150), '...'));

  await browser.close();
}

run().catch(console.error);
