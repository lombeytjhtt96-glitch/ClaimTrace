import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/home/Khalaf-Dev/.gemini/antigravity/brain/bc1217c1-62d5-40a9-8f47-eade18d108bf';

async function verifyDotsAndInsights() {
  console.log('[VERIFICATION] Starting Playwright browser inspection for dots, copy, and live insights...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Set auth credentials
  await page.addInitScript(() => {
    localStorage.setItem('claimtrace_token', 'bpjs-token-199208152015031002-1792898228');
    localStorage.setItem('claimtrace_user', JSON.stringify({
      id: 'USR-WASRIK-001',
      name: 'Budi Santoso, S.Kom, M.TI',
      nip: '19920815 201503 1 002',
      role: 'verifikator_wasrik',
      role_label: 'Verifikator Tim Wasrik Pusat',
      branch: 'Kantor Pusat BPJS Kesehatan',
      deputy: 'Kedeputian Bidang Pengawasan dan Pemeriksaan'
    }));
  });

  // 1. Executive Hub: Verify Dot Separators and Clean Donut
  console.log('\n--- Checking Executive Hub: Dots & Donut ---');
  await page.goto('http://localhost:3000?view=dashboard&tab=executive', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check Distribusi Tingkat Keparahan Klaim
  const execContent = await page.content();
  const hasFormattedDotsRendah = execContent.includes('1.503.675');
  const hasFormattedDotsSedang = execContent.includes('153.351');
  const hasFormattedDotsTinggi = execContent.includes('32.613');
  const hasFormattedDotsKritis = execContent.includes('9.580');
  const hasFormattedDotsTopics = execContent.includes('148.890 berkas') && execContent.includes('94.239 berkas') && execContent.includes('42.193 berkas');

  console.log('Formatted Dots Rendah (1.503.675):', hasFormattedDotsRendah ? 'PASSED' : 'FAILED');
  console.log('Formatted Dots Sedang (153.351):', hasFormattedDotsSedang ? 'PASSED' : 'FAILED');
  console.log('Formatted Dots Tinggi (32.613):', hasFormattedDotsTinggi ? 'PASSED' : 'FAILED');
  console.log('Formatted Dots Kritis (9.580):', hasFormattedDotsKritis ? 'PASSED' : 'FAILED');
  console.log('Formatted Dots Topics (148.890, 94.239, 42.193):', hasFormattedDotsTopics ? 'PASSED' : 'FAILED');

  // Check Donut Center text
  const hasTotalKlaim = execContent.includes('TOTAL KLAIM');
  console.log('Donut center text displays TOTAL KLAIM:', hasTotalKlaim ? 'PASSED' : 'FAILED');

  // Capture Screenshot of Distribusi Tingkat Keparahan Klaim card
  const severityCard = await page.locator('text=Distribusi Tingkat Keparahan Klaim').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]').first();
  if (await severityCard.count() > 0) {
    await severityCard.screenshot({ path: path.join(ARTIFACT_DIR, 'distribusi_keparahan_verified_dots.png') });
    console.log('Screenshot saved: distribusi_keparahan_verified_dots.png');
  }

  // Capture Screenshot of Executive Charts (Donut + Tren Siklus)
  const chartsSection = await page.locator('text=Tren Siklus Verifikasi Klaim').locator('xpath=ancestor::section').first();
  if (await chartsSection.count() > 0) {
    await chartsSection.screenshot({ path: path.join(ARTIFACT_DIR, 'executive_charts_verified_clean.png') });
    console.log('Screenshot saved: executive_charts_verified_clean.png');
  }

  // 2. Insights Analytics View: Verify Live DuckDB Engine & Privacy Meters
  console.log('\n--- Checking Insights Analytics: Live DuckDB & Privacy ---');
  await page.goto('http://localhost:3000?view=dashboard&tab=insights', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const insightsContent = await page.content();
  const hasKAnonymity = insightsContent.includes('K-ANONYMITY PESERTA') && insightsContent.includes('k = 12');
  const hasDiffPrivacy = insightsContent.includes('DIFFERENTIAL PRIVACY') && insightsContent.includes('20.0');
  const hasConsent = insightsContent.includes('VALIDASI PERSETUJUAN & TOKENISASI') && insightsContent.includes('500');

  console.log('K-Anonymity live indicator active:', hasKAnonymity ? 'PASSED' : 'FAILED');
  console.log('Differential privacy (ε-δ) budget active:', hasDiffPrivacy ? 'PASSED' : 'FAILED');
  console.log('Consent & tokenization active:', hasConsent ? 'PASSED' : 'FAILED');

  // Trigger query change
  console.log('Selecting query: Distribusi Kasus Klaim per Kategori Diagnosis...');
  await page.selectOption('#query-select', 'case_distribution');
  await page.waitForTimeout(1000);

  const afterQueryContent = await page.content();
  const hasDynamicResult = afterQueryContent.includes('Kueri berhasil dieksekusi oleh Insights Agent') || afterQueryContent.includes('Waktu Eksekusi:');
  console.log('Live DuckDB query execution verified:', hasDynamicResult ? 'PASSED' : 'FAILED');

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'insights_analytics_live_verified.png'), fullPage: false });
  console.log('Screenshot saved: insights_analytics_live_verified.png');

  await browser.close();
  console.log('\n[ALL VERIFICATIONS COMPLETE]');
}

verifyDotsAndInsights().catch(e => {
  console.error('[Verification Failed]:', e);
  process.exit(1);
});
