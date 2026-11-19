const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  // 1. Executive Hub Dashboard
  await page.goto('http://localhost:3000/?view=dashboard&tab=executive&theme=light', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Scroll to "Tren Siklus Verifikasi Klaim" header
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3'));
    const target = headings.find(h => h.textContent.includes('Tren Siklus Verifikasi Klaim'));
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      window.scrollBy(0, 1100);
    }
  });
  await page.waitForTimeout(800);

  await page.screenshot({
    path: '/home/Khalaf-Dev/.gemini/antigravity/brain/bc1217c1-62d5-40a9-8f47-eade18d108bf/unslopped_charts_exact.png'
  });

  await browser.close();
  console.log('Exact charts screenshot captured.');
})();
