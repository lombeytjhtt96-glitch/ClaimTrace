import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = '/home/Khalaf-Dev/.gemini/antigravity/brain/bc1217c1-62d5-40a9-8f47-eade18d108bf/screenshots';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function verifyAllFrameworks() {
  console.log('🚀 Starting Comprehensive 6-Framework Cyber & Anti-Fraud Verification...');
  
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  // 1. Check Landing Page with 6-Framework Banner
  console.log('1. Navigating to Landing Page...');
  await page.goto('http://localhost:3000?view=landing', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'fw_01_landing_banner.png'), fullPage: false });
  console.log('✅ Captured fw_01_landing_banner.png');

  // 2. Open Institutional Legal Modal Tab 5 (Frameworks)
  console.log('2. Opening Institutional Legal Modal Tab 5 (Frameworks)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a, span'));
    const modalTrigger = btns.find(b => b.textContent && (b.textContent.includes('Standar Siber (6 Kerangka)') || b.textContent.includes('MITRE F3 · ATT&CK')));
    if (modalTrigger) {
      const clickEl = modalTrigger.closest('button') || modalTrigger;
      clickEl.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'fw_02_frameworks_modal.png'), fullPage: false });
  console.log('✅ Captured fw_02_frameworks_modal.png');

  // Close modal
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const closeBtn = closeBtns.find(b => b.textContent && b.textContent.includes('Tutup Dokumentasi'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 3. Navigate directly to Dashboard
  console.log('3. Navigating to Executive Hub Dashboard...');
  await page.evaluate(() => {
    localStorage.setItem('claimtrace_token', 'bpjs-token-199208152015031002-1792898228');
    localStorage.setItem('claimtrace_user', JSON.stringify({
      nip: '199208152015031002',
      email: 'admin.fraud@bpjs-kesehatan.go.id',
      name: 'Budi Santoso, S.Kom, M.TI',
      role: 'Analis Forensik Digital Anti-Fraud',
      roleTitle: 'Auditor Investigasi Klaim',
      unit: 'Kedeputian Bidang Pengawasan dan Pemeriksaan',
      avatar: 'BS',
      isMfaVerified: true,
      allowedRoles: ['FRAUD_INVESTIGATOR', 'ANALYST', 'SUPER_ADMIN']
    }));
  });

  await page.goto('http://localhost:3000?view=dashboard&tab=executive', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'fw_03_executive_hub_posture.png'), fullPage: false });
  console.log('✅ Captured fw_03_executive_hub_posture.png');

  // 4. Navigate to Matriks 3 Lapis Bukti (Case Investigation)
  console.log('4. Navigating to Matriks 3 Lapis Bukti...');
  await page.goto('http://localhost:3000?view=dashboard&tab=investigation', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'fw_04_matriks_3_lapis_frameworks.png'), fullPage: false });
  console.log('✅ Captured fw_04_matriks_3_lapis_frameworks.png');

  // 5. Navigate to Intelijen Beban DPJP & Geovelocity
  console.log('5. Navigating to Intelijen Beban DPJP...');
  await page.goto('http://localhost:3000?view=dashboard&tab=dpjp', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'fw_05_dpjp_geovelocity.png'), fullPage: false });
  console.log('✅ Captured fw_05_dpjp_geovelocity.png');

  // 6. Navigate to Audit Ledger Kriptografis SHA-256
  console.log('6. Navigating to Audit Ledger Kriptografis SHA-256...');
  await page.goto('http://localhost:3000?view=dashboard&tab=audit', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'fw_06_audit_ledger_d3fend.png'), fullPage: false });
  console.log('✅ Captured fw_06_audit_ledger_d3fend.png');

  // 7. Navigate to Pengaturan Sistem (Admin Settings View)
  console.log('7. Navigating to Pengaturan Sistem...');
  await page.goto('http://localhost:3000?view=dashboard&tab=settings', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'fw_07_settings_framework_toggles.png'), fullPage: false });
  console.log('✅ Captured fw_07_settings_framework_toggles.png');

  // 8. Navigate to Telemetri Mobile JKN
  console.log('8. Navigating to Telemetri Mobile JKN...');
  await page.goto('http://localhost:3000?view=dashboard&tab=mobile_bridge', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'fw_08_mobile_telemetry_d3mfa.png'), fullPage: false });
  console.log('✅ Captured fw_08_mobile_telemetry_d3mfa.png');

  // 9. Navigate to Konsol Keputusan & BAKB
  console.log('9. Navigating to Konsol Keputusan & BAKB...');
  await page.goto('http://localhost:3000?view=dashboard&tab=decision', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'fw_09_decision_console_bakb.png'), fullPage: false });
  console.log('✅ Captured fw_09_decision_console_bakb.png');

  await browser.close();
  console.log('🎉 Verification completed! All 9 screenshots generated successfully.');
}

verifyAllFrameworks().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
