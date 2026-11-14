const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/Khalaf-Dev/.gemini/antigravity/brain/bc1217c1-62d5-40a9-8f47-eade18d108bf';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to React app on port 3000...');
  await page.goto('http://127.0.0.1:3000?view=dashboard&theme=light&tab=executive', { waitUntil: 'networkidle' });

  // 1. Executive Cockpit
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_react_cockpit_metronic.png') });
  console.log('Captured 02_react_cockpit_metronic.png');

  // 2. Empirical (Peta Anomali 1,69 Juta Klaim)
  await page.goto('http://127.0.0.1:3000?view=dashboard&theme=light&tab=empirical', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_react_empirical_map.png') });
  console.log('Captured 06_react_empirical_map.png');

  // 3. Queue (Pipeline Penyaringan Klaim)
  await page.goto('http://127.0.0.1:3000?view=dashboard&theme=light&tab=queue', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_react_queue_pipeline.png') });
  console.log('Captured 07_react_queue_pipeline.png');

  // 4. Decision (Konsol Putusan & BAKB)
  await page.goto('http://127.0.0.1:3000?view=dashboard&theme=light&tab=decision', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_react_decision_console.png') });
  console.log('Captured 08_react_decision_console.png');

  // 5. Official Reports (Laporan Resmi BAHV)
  await page.goto('http://127.0.0.1:3000?view=dashboard&theme=light&tab=official_reports', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_react_official_reports_bahv.png') });
  console.log('Captured 03_react_official_reports_bahv.png');

  // 6. SP-1 VPK Tab inside official reports
  const sp1Btn = page.locator('button:has-text("SP-1 VPK")');
  if (await sp1Btn.count() > 0) {
    await sp1Btn.first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_react_official_reports_sp1.png') });
    console.log('Captured 04_react_official_reports_sp1.png');
  }

  // 7. Login Page with 4 Personas
  await page.goto('http://127.0.0.1:3000?view=login&theme=light', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_react_login_personas.png') });
  console.log('Captured 01_react_login_personas.png');

  await browser.close();
  console.log('ALL METRONIC ALL-WHITE SCREENSHOTS CAPTURED!');
})();
