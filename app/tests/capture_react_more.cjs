const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/Khalaf-Dev/.gemini/antigravity/brain/bc1217c1-62d5-40a9-8f47-eade18d108bf';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 1. Decision Console
  console.log('Capturing Decision Console...');
  await page.goto('http://127.0.0.1:3000?view=dashboard&theme=light&tab=decision', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_react_decision_console.png') });
  console.log('Captured 08_react_decision_console.png');

  // 2. Investigation (Bedah Saring 3 Lapis)
  console.log('Capturing Investigation View...');
  await page.goto('http://127.0.0.1:3000?view=dashboard&theme=light&tab=investigation', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_react_investigation_dossier.png') });
  console.log('Captured 09_react_investigation_dossier.png');

  await browser.close();
  console.log('REMAINING SCREENSHOTS CAPTURED!');
})();
