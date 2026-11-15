const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.resolve(__dirname, 'artifacts');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to React app on port 3000...');
  
  // 1. Executive Cockpit
  await page.goto('http://127.0.0.1:3000/?view=dashboard&theme=light&tab=executive', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_react_cockpit_metronic.png') });
  console.log('Captured 02_react_cockpit_metronic.png');

  // 2. Empirical (Peta Anomali 1,69 Juta Klaim)
  await page.goto('http://127.0.0.1:3000/?view=dashboard&theme=light&tab=empirical', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_react_empirical_map.png') });
  console.log('Captured 06_react_empirical_map.png');

  // 3. Queue (Pipeline Penyaringan Klaim)
  await page.goto('http://127.0.0.1:3000/?view=dashboard&theme=light&tab=queue', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_react_queue_pipeline.png') });
  console.log('Captured 07_react_queue_pipeline.png');

  // 4. Decision (Konsol Putusan & BAKB dengan Verifikasi Lanjutan & Koreksi Manusia)
  await page.goto('http://127.0.0.1:3000/?view=dashboard&theme=light&tab=decision', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_react_decision_console.png') });
  console.log('Captured 08_react_decision_console.png');

  // 4b. Document Checker (Pengecekan Dokumen & Berkas Rekam Medis RS)
  await page.goto('http://127.0.0.1:3000/?view=dashboard&theme=light&tab=document_checker', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_react_document_checker.png') });
  console.log('Captured 10_react_document_checker.png');

  // 4c. Fraud Risk Ranking (Papan Peringkat Risiko Kecurangan Faskes Nasional)
  await page.goto('http://127.0.0.1:3000/?view=dashboard&theme=light&tab=fraud_ranking', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '11_react_fraud_ranking.png') });
  console.log('Captured 11_react_fraud_ranking.png');

  // 5. Official Reports (Laporan Resmi BAHV)
  await page.goto('http://127.0.0.1:3000/?view=dashboard&theme=light&tab=official_reports', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_react_official_reports_bahv.png') });
  console.log('Captured 03_react_official_reports_bahv.png');

  // 6. SP-1 VPK Tab inside official reports
  const sp1Btn = page.locator('button:has-text("SP-1 VPK")');
  if (await sp1Btn.count() > 0) {
    await sp1Btn.first().click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_react_official_reports_sp1.png') });
    console.log('Captured 04_react_official_reports_sp1.png');
  }

  // 7. Login Page with 4 Personas
  await page.goto('http://127.0.0.1:3000/?view=login&theme=light', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_react_login_personas.png') });
  console.log('Captured 01_react_login_personas.png');

  await browser.close();
  console.log('ALL METRONIC ALL-WHITE BOLD SCREENSHOTS CAPTURED!');
})();
