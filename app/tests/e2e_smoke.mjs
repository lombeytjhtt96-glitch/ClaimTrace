import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(APP_DIR, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const DATA_DIR = path.join(BACKEND_DIR, 'data');

const BACKEND_URL = 'http://127.0.0.1:8000';
const FRONTEND_URL = 'http://127.0.0.1:3000';
const DEVICE_FP = 'CT-WKS-E2E-SMOKE-0001';

const STATE_FILES = [
  'appeals_records.json',
  'submitted_document_bundles.json',
  '.session_security_state.json',
  'audit_ledger_chain.jsonl',
  'claims_state.json',
];

function snapshotDataFiles() {
  const snapshots = new Map();
  for (const name of STATE_FILES) {
    const full = path.join(DATA_DIR, name);
    if (fs.existsSync(full)) {
      snapshots.set(full, fs.readFileSync(full));
    } else {
      snapshots.set(full, null);
    }
  }
  return snapshots;
}

function restoreDataFiles(snapshots) {
  for (const [full, content] of snapshots.entries()) {
    try {
      if (content === null) {
        if (fs.existsSync(full)) fs.unlinkSync(full);
      } else {
        fs.writeFileSync(full, content);
      }
    } catch {
      // Best-effort cleanup
    }
  }
}

function killProcessGroup(child) {
  if (!child || !child.pid) return;
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    try {
      child.kill('SIGKILL');
    } catch {
      // Already exited
    }
  }
}

async function assertPortFree(port, host = '127.0.0.1') {
  await new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', (err) => reject(new Error(`Port ${host}:${port} already in use (${err.code}); refuse running E2E against stale server`)));
    srv.once('listening', () => srv.close(() => resolve()));
    srv.listen(port, host);
  });
}

async function waitForHttpReady(url, proc, name, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (proc && proc.exitCode !== null) {
      throw new Error(`${name} exited prematurely with code ${proc.exitCode}`);
    }
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      // Wait for port bind
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function mintTestVerifierSession() {
  const pyCode = [
    'import json, sys',
    'sys.path.insert(0, ".")',
    'from app.security.token_manager import create_access_token',
    'profile = {',
    '    "nip": "198501012010011001",',
    '    "username": "hendra.wijaya",',
    '    "email": "hendra.wijaya@bpjs-kesehatan.go.id",',
    '    "name": "Hendra Wijaya, S.Si, M.M",',
    '    "role": "ADMIN",',
    '    "unit": "Kantor Pusat BPJS Kesehatan",',
    '    "isMfaVerified": True,',
    '}',
    `token = create_access_token(profile, device_fingerprint="${DEVICE_FP}")`,
    'print(json.dumps({"token": token, "user": {**profile, "roleTitle": "Administrator Sistem Utama", "avatar": "HW", "allowedRoles": ["ADMIN", "VERIFICATOR_MEDIS", "FRAUD_INVESTIGATOR"]}}))',
  ].join('\n');

  const out = execFileSync('python3', ['-c', pyCode], {
    cwd: BACKEND_DIR,
    encoding: 'utf-8',
  }).trim();
  const lastLine = out.split('\n').pop();
  return JSON.parse(lastLine);
}

async function assertNoDarkThemeToggle(page, label) {
  const darkToggles = await page.locator(
    'button[aria-label*="gelap" i], button[aria-label*="dark" i], button[title*="gelap" i], button[title*="dark" i], button[aria-label*="tema" i], button[title*="tema" i]'
  ).count();
  if (darkToggles !== 0) {
    throw new Error(`[${label}] Expected zero dark-theme toggle buttons on Auth page, found ${darkToggles}`);
  }
  const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (hasDarkClass) {
    throw new Error(`[${label}] Expected light-first Auth theme without .dark on <html>`);
  }
}

async function assertNoHorizontalOverflow(page, label) {
  const dims = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  if (dims.scrollWidth > dims.innerWidth + 2) {
    throw new Error(`[${label}] Horizontal overflow detected: scrollWidth=${dims.scrollWidth} > innerWidth=${dims.innerWidth}`);
  }
}

async function run() {
  const distIndex = path.join(APP_DIR, 'dist', 'index.html');
  if (!fs.existsSync(distIndex)) {
    throw new Error('dist/index.html missing; run npm run build first');
  }

  const snapshots = snapshotDataFiles();
  let backendProc = null;
  let frontendProc = null;
  let browser = null;
  let cleanedUp = false;

  const cleanupSync = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    killProcessGroup(frontendProc);
    killProcessGroup(backendProc);
    restoreDataFiles(snapshots);
  };

  process.once('SIGINT', () => {
    cleanupSync();
    process.exit(130);
  });
  process.once('SIGTERM', () => {
    cleanupSync();
    process.exit(143);
  });
  process.once('exit', cleanupSync);

  try {
    await assertPortFree(8000);
    await assertPortFree(3000);
    const sessionData = mintTestVerifierSession();

    backendProc = spawn(
      'python3',
      ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--log-level', 'warning'],
      { cwd: BACKEND_DIR, detached: true, stdio: 'pipe' }
    );
    frontendProc = spawn(
      'npx',
      ['vite', 'preview', '--host', '127.0.0.1', '--port', '3000', '--strictPort'],
      { cwd: APP_DIR, detached: true, stdio: 'pipe' }
    );

    await waitForHttpReady(`${BACKEND_URL}/api/v1/health`, backendProc, 'uvicorn');
    await waitForHttpReady(`${FRONTEND_URL}/`, frontendProc, 'vite preview');

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    // 1. Unauthenticated Auth Views: SignIn + Lupa Password light lock & responsiveness
    const authCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const authPage = await authCtx.newPage();
    await authPage.goto(`${FRONTEND_URL}/?view=login`, { waitUntil: 'networkidle' });
    await authPage.locator('#login-password').waitFor({ state: 'visible', timeout: 10000 });
    await authPage.getByText('Masukkan Username, Email, NIP, dan Password Anda untuk mengakses portal.').waitFor({ state: 'visible', timeout: 5000 });
    assert((await authPage.locator('header').count()) === 0, 'SignIn page must not render top navbar header');
    const logoImg = authPage.locator('img[alt="Logo ClaimTrace"]');
    await logoImg.waitFor({ state: 'visible', timeout: 5000 });
    const logoBox = await logoImg.boundingBox();
    const headingBox = await authPage.getByRole('heading', { name: 'Masuk ClaimTrace' }).boundingBox();
    assert(logoBox && headingBox && (logoBox.y + logoBox.height) <= headingBox.y + 2, 'Logo ClaimTrace must appear above Masuk ClaimTrace heading');
    await assertNoDarkThemeToggle(authPage, 'SignIn Desktop');
    await assertNoHorizontalOverflow(authPage, 'SignIn Desktop');

    // Verify show/hide password eye button stays vertically centered while pressed (:active) and toggled
    const pwdInput = authPage.locator('#login-password');
    const toggleBtn = authPage.getByRole('button', { name: 'Lihat password' });
    const pwdBox = await pwdInput.boundingBox();
    const btnBefore = await toggleBtn.boundingBox();
    assert(pwdBox && btnBefore, 'Expected bounding boxes for #login-password and eye toggle button');
    const inputCenterY = pwdBox.y + pwdBox.height / 2;
    const btnBeforeCenterY = btnBefore.y + btnBefore.height / 2;
    assert(
      Math.abs(btnBeforeCenterY - inputCenterY) <= 2.5,
      `Eye toggle button not centered before click: delta=${(btnBeforeCenterY - inputCenterY).toFixed(2)}px`,
    );
    await authPage.mouse.move(btnBefore.x + btnBefore.width / 2, btnBefore.y + btnBefore.height / 2);
    await authPage.mouse.down();
    const btnActive = await toggleBtn.boundingBox();
    assert(btnActive, 'Expected active eye toggle bounding box');
    const btnActiveCenterY = btnActive.y + btnActive.height / 2;
    assert(
      Math.abs(btnActiveCenterY - btnBeforeCenterY) <= 1.5,
      `Eye toggle button jumped vertically during :active press: delta=${(btnActiveCenterY - btnBeforeCenterY).toFixed(2)}px`,
    );
    await authPage.mouse.up();
    await authPage.getByRole('button', { name: 'Sembunyikan password' }).waitFor({ state: 'visible', timeout: 3000 });
    assert((await pwdInput.getAttribute('type')) === 'text', 'Expected #login-password type to toggle to text');
    const btnAfter = await authPage.getByRole('button', { name: 'Sembunyikan password' }).boundingBox();
    assert(btnAfter && Math.abs((btnAfter.y + btnAfter.height / 2) - inputCenterY) <= 2.5, 'Eye toggle drifted after toggle');

    await authPage.getByRole('button', { name: /Lupa Password\?/i }).click();
    await authPage.locator('#forgot-username').waitFor({ state: 'visible', timeout: 8000 });
    await authPage.getByText('Masukkan Username, Email, dan NIP akun terdaftar untuk menerima tautan ubah password.').waitFor({ state: 'visible', timeout: 5000 });
    await assertNoDarkThemeToggle(authPage, 'Forgot Password Desktop');
    await assertNoHorizontalOverflow(authPage, 'Forgot Password Desktop');

    await authPage.setViewportSize({ width: 390, height: 844 });
    await assertNoDarkThemeToggle(authPage, 'Forgot Password Mobile');
    await assertNoHorizontalOverflow(authPage, 'Forgot Password Mobile');
    await authCtx.close();
    console.log('[PASS] Auth SignIn & Lupa Password Light-First lock + responsive checks');

    // 1b. Stale dynamic-import chunk recovery (lazyWithRetry auto-reloads once on 404 chunk)
    const chunkCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await chunkCtx.addInitScript(({ token, user, dfp }) => {
      localStorage.setItem('claimtrace_device_fp', dfp);
      localStorage.setItem('bpjs_auth_token', token);
      localStorage.setItem('bpjs_user_role', user.role);
      localStorage.setItem('bpjs_user_nip', user.nip);
      localStorage.setItem('claimtrace_user', JSON.stringify(user));
      localStorage.removeItem('claimtrace_session_revoked_at');
    }, { token: sessionData.token, user: sessionData.user, dfp: DEVICE_FP });
    const chunkPage = await chunkCtx.newPage();
    let execChunkHits = 0;
    await chunkPage.route('**/assets/ExecutiveHub-*.js', async (route) => {
      execChunkHits += 1;
      if (execChunkHits === 1) {
        await route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not Found' });
        return;
      }
      await route.continue();
    });
    await chunkPage.goto(`${FRONTEND_URL}/?view=dashboard&tab=executive`, { waitUntil: 'domcontentloaded' });
    await chunkPage.getByText('Total Klaim FKRTL').waitFor({ state: 'visible', timeout: 15000 });
    assert(execChunkHits >= 2, `Expected stale ExecutiveHub chunk to auto-reload, saw hits=${execChunkHits}`);
    assert((await chunkPage.getByText(/Kendala Tampilan/i).count()) === 0, 'Unexpected ErrorBoundary after chunk recovery');
    await chunkCtx.close();
    console.log('[PASS] Lazy dynamic-import stale chunk auto-recovery verified');

    // 2. Authenticated Dashboard + Live 5-Pillar Workflows
    const appCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await appCtx.addInitScript(({ token, user, dfp }) => {
      localStorage.setItem('claimtrace_device_fp', dfp);
      localStorage.setItem('bpjs_auth_token', token);
      localStorage.setItem('bpjs_user_role', user.role);
      localStorage.setItem('bpjs_user_nip', user.nip);
      localStorage.setItem('claimtrace_user', JSON.stringify(user));
      localStorage.removeItem('claimtrace_session_revoked_at');
    }, { token: sessionData.token, user: sessionData.user, dfp: DEVICE_FP });

    const page = await appCtx.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    const httpFailures = [];
    const tokenUrlLeaks = [];

    page.on('pageerror', (err) => {
      pageErrors.push(String(err?.message || err));
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('request', (req) => {
      const reqUrl = req.url();
      if (/[?&]token=/.test(reqUrl)) {
        tokenUrlLeaks.push(reqUrl);
      }
      if (reqUrl.includes('generativelanguage.googleapis.com') || reqUrl.includes('/api/v1/gemini/generate')) {
        tokenUrlLeaks.push(`EXTERNAL_VENDOR_ENDPOINT:${reqUrl}`);
      }
    });
    page.on('response', (res) => {
      const url = res.url();
      if ((url.includes('/api/') || url.includes('/fhir')) && res.status() >= 400) {
        httpFailures.push(`${res.status()} ${res.request().method()} ${url}`);
      }
    });

    await page.goto(`${FRONTEND_URL}/?view=dashboard&tab=executive`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Dashboard Ringkasan/i }).waitFor({ state: 'visible', timeout: 15000 });
    await assertNoHorizontalOverflow(page, 'Dashboard Executive Desktop');

    // Mobile viewport check (360x780 + 390x844)
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    await assertNoHorizontalOverflow(page, 'Dashboard Executive Mobile 360');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(200);
    console.log('[PASS] Executive Dashboard boot + desktop/mobile zero horizontal overflow');

    // Helper: Ctrl+K Command Palette Navigation
    const navigateViaCommandPalette = async (queryText, buttonPattern) => {
      await page.keyboard.press('Control+k');
      const dialog = page.getByRole('dialog', { name: /Navigasi Cepat Portal Verifikator/i });
      await dialog.waitFor({ state: 'visible', timeout: 8000 });
      const searchInput = dialog.locator('input').first();
      await searchInput.fill(queryText);
      await dialog.getByRole('button', { name: buttonPattern }).first().click();
      await dialog.waitFor({ state: 'hidden', timeout: 5000 });
    };

    // Verify Ctrl+K Command Palette opens & dismisses with Escape
    await page.keyboard.press('Control+k');
    const escPalette = page.getByRole('dialog', { name: /Navigasi Cepat Portal Verifikator/i });
    await escPalette.waitFor({ state: 'visible', timeout: 8000 });
    await page.keyboard.press('Escape');
    await escPalette.waitFor({ state: 'hidden', timeout: 5000 });

    // Ctrl+K -> Telaah Kasus (Investigasi) + Audit Klinis + Jump ke Cek 7 Dokumen RS
    await navigateViaCommandPalette('Investigasi', /Telaah Kasus/i);
    await page.getByText(/Audit Klinis & Kaidah Koding INA-CBG/i).waitFor({ state: 'visible', timeout: 10000 });
    await page.getByText('Audit Klinis Tersinkron').first().waitFor({ state: 'visible', timeout: 10000 });
    await page.getByRole('button', { name: /Cek 7 Dokumen RS/i }).click();
    await page.getByText('Pengecekan Dokumen Klaim & Berkas Rekam Medis RS').waitFor({ state: 'visible', timeout: 10000 });
    console.log('[PASS] Ctrl+K navigation + CaseInvestigation clinical audit + 7 Dokumen jump');

    // Pillar 1 UI: Peringkat Risiko Faskes -> WarehouseCohortPanel
    const [clusterRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/v1/analytics/fraud-ranking/warehouse-clusters') && res.request().method() === 'GET'
      ),
      page.getByRole('button', { name: /Peringkat Risiko Faskes/i }).click(),
    ]);
    if (clusterRes.status() !== 200) {
      throw new Error(`Warehouse cluster API failed with status ${clusterRes.status()}`);
    }
    await page.getByText('Agregasi Gudang Data BPJS FKRTL Live').waitFor({ state: 'visible', timeout: 10000 });
    await page.getByText(/Baris \(/).waitFor({ state: 'visible', timeout: 10000 });

    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('force_refresh=true') && res.status() === 200
      ),
      page.getByRole('button', { name: /Hitung ulang agregasi gudang data|Hitung Ulang SQL/i }).click(),
    ]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page, 'FraudRanking Mobile');
    await page.setViewportSize({ width: 1440, height: 900 });
    console.log('[PASS] Pillar 1 Live SQL Warehouse Cohort Panel + Mobile Overflow Check');

    // Pillar 2 UI: Cek Dokumen RS -> ICD-10 Kamus + RealBundleMorbidityPanel (Rule MB1-MB5 & Submit Real Bundle)
    await page.getByRole('button', { name: /Cek Dokumen RS/i }).click();
    await page.getByRole('button', { name: /Uji Rule MB1-MB5 & Fornas/i }).waitFor({ state: 'visible', timeout: 10000 });

    const icdInput = page.getByLabel(/Cari kode atau nama penyakit ICD-10/i);
    await icdInput.fill('Sepsis');
    const [icdRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/v1/terminology/icd10/search') && res.request().method() === 'GET'
      ),
      page.getByRole('button', { name: /Cek Kode/i }).click(),
    ]);
    if (icdRes.status() !== 200) {
      throw new Error(`ICD-10 search API failed with status ${icdRes.status()}`);
    }
    await page.waitForTimeout(300);

    const mbBtn = page.getByRole('button', { name: /Uji Rule MB1-MB5 & Fornas/i });
    await mbBtn.scrollIntoViewIfNeeded();
    let mbReqSent = false;
    const onMbReq = (req) => {
      if (req.url().includes('/api/v1/clinical/morbidity-audit') && req.method() === 'POST') {
        mbReqSent = true;
      }
    };
    page.on('request', onMbReq);
    let mbRes;
    try {
      [mbRes] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes('/api/v1/clinical/morbidity-audit') && res.request().method() === 'POST'
        ),
        mbBtn.click(),
      ]);
    } catch (err) {
      throw new Error(`Morbidity audit failed (requestDispatched=${mbReqSent}): ${err.message}`);
    } finally {
      page.off('request', onMbReq);
    }
    if (mbRes.status() !== 200) {
      throw new Error(`Morbidity audit API failed with status ${mbRes.status()}`);
    }
    await page.getByText('Hasil Rule MB1-MB5 & Fornas').waitFor({ state: 'visible', timeout: 10000 });
    await page.getByText(/MB1/).first().waitFor({ state: 'visible', timeout: 10000 });

    const [submitBundleRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/v1/documents/audit/submit') && res.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /Ajukan & Audit Bundel Riil/i }).click(),
    ]);
    if (submitBundleRes.status() !== 200) {
      throw new Error(`Real bundle submit API failed with status ${submitBundleRes.status()}`);
    }
    const submitJson = await submitBundleRes.json();
    await page.getByText(`Bundel Dokumen Riil Tersimpan (${submitJson.claim_id})`).waitFor({ state: 'visible', timeout: 10000 });
    await page.getByText(/submitted_real/).waitFor({ state: 'visible', timeout: 10000 });

    const delRes = await fetch(
      `${BACKEND_URL}/api/v1/documents/audit/submitted/${encodeURIComponent(submitJson.claim_id)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionData.token}`,
          'X-BPJS-Token': sessionData.token,
          'X-Device-Fingerprint': DEVICE_FP,
        },
      }
    );
    if (delRes.status !== 200) {
      throw new Error(`Expected cleanup DELETE submitted bundle 200, got ${delRes.status}`);
    }
    console.log('[PASS] Pillar 2 ICD-10 Kamus + MB1-MB5 + Fornas + Real Document Bundle Submit & Cleanup');

    // Pembuktian Empiris -> Audit Benford & Gini Tab
    await navigateViaCommandPalette('Benford', /Forensik Empiris & Benford/i);
    const [benfordRes, giniRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/analytics/benford-audit') && res.request().method() === 'GET'),
      page.waitForResponse((res) => res.url().includes('/api/v1/analytics/gini-concentration') && res.request().method() === 'GET'),
      page.getByRole('button', { name: /Audit Benford & Gini/i }).click(),
    ]);
    if (benfordRes.status() !== 200 || giniRes.status() !== 200) {
      throw new Error(`Forensic statistics API failed (benford=${benfordRes.status()}, gini=${giniRes.status()})`);
    }
    await page.getByText(/Distribusi Digit Pertama: Aktual vs Hukum Benford/i).waitFor({ state: 'visible', timeout: 10000 });
    await page.getByText(/Kurva Lorenz Konsentrasi Biaya Klaim Antar-Faskes/i).waitFor({ state: 'visible', timeout: 10000 });
    console.log('[PASS] EmpiricalForensics Benford & Gini Statistical Audit');

    // Pillar 3 UI: Konsol Putusan -> SLA Badge, SanggahanAppealsPanel, & HL7 FHIR R4 Claim/$submit
    const [appealsGetRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().endsWith('/api/v1/appeals') && res.request().method() === 'GET'
      ),
      page.getByRole('button', { name: /Konsol Putusan/i }).click(),
    ]);
    if (appealsGetRes.status() !== 200) {
      throw new Error(`GET /api/v1/appeals failed with status ${appealsGetRes.status()}`);
    }
    await page.getByText(/SLA Perpres 82\/2018/i).first().waitFor({ state: 'visible', timeout: 10000 });
    await page.getByText('APL-2026-001').first().waitFor({ state: 'visible', timeout: 10000 });

    const [fhirSubmitRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/fhir/Claim/$submit') && res.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /Validasi & Kirim FHIR Claim\/\$submit/i }).click(),
    ]);
    if (fhirSubmitRes.status() !== 200 && fhirSubmitRes.status() !== 201) {
      throw new Error(`POST /fhir/Claim/$submit failed with status ${fhirSubmitRes.status()}`);
    }
    await page.getByText(/ClaimResponse/i).first().waitFor({ state: 'visible', timeout: 10000 });

    const [submitAppealRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/v1/appeals/submit') && res.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /Ajukan Sanggahan BAKB/i }).click(),
    ]);
    if (submitAppealRes.status() !== 200) {
      throw new Error(`POST /api/v1/appeals/submit failed with status ${submitAppealRes.status()}`);
    }
    const appealJson = await submitAppealRes.json();
    const newAppealId = appealJson?.appeal?.appeal_id;
    if (!newAppealId) {
      throw new Error('Missing appeal_id from POST /api/v1/appeals/submit response');
    }
    await page.getByText(newAppealId).first().waitFor({ state: 'visible', timeout: 10000 });
    console.log(`[PASS] Pillar 3 SLA + HL7 FHIR Claim/$submit + Sanggahan BAKB Appeals (${newAppealId})`);

    // Laporan Resmi -> Dynamic signer + Pratinjau VEDIKA Server + CSV
    await navigateViaCommandPalette('BAHV', /Laporan Resmi \(BAHV\)/i);
    await page.getByText(/Hendra Wijaya, S\.Si, M\.M/i).first().waitFor({ state: 'visible', timeout: 10000 });
    await page.getByRole('button', { name: /Unduh CSV/i }).waitFor({ state: 'visible', timeout: 8000 });
    const popupPromise = page.waitForEvent('popup', { timeout: 4000 }).catch(() => null);
    const [vedikaRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/vedika/') && res.request().method() === 'GET'),
      page.getByRole('button', { name: /Pratinjau VEDIKA Server/i }).click(),
    ]);
    if (vedikaRes.status() !== 200) {
      throw new Error(`GET /api/v1/vedika failed with status ${vedikaRes.status()}`);
    }
    const popupPage = await popupPromise;
    if (popupPage) await popupPage.close().catch(() => {});
    console.log('[PASS] OfficialReportsView dynamic signer + VEDIKA printable + CSV');

    // Profil Verifikator -> Active Sessions + Zero Hardcoded PIN 123123
    const sessionsPromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/sessions') && res.request().method() === 'GET',
      { timeout: 10000 }
    );
    await navigateViaCommandPalette('Keamanan Sesi', /Profil & Keamanan Sesi/i);
    const sessionsRes = await sessionsPromise;
    if (sessionsRes.status() !== 200) {
      throw new Error(`GET /api/v1/auth/sessions failed with status ${sessionsRes.status()}`);
    }
    await page.getByText(/Sesi Aktif & Keamanan Perangkat Workstation/i).waitFor({ state: 'visible', timeout: 10000 });
    const profileHtml = await page.content();
    if (profileHtml.includes('123123')) {
      throw new Error('Hardcoded 123123 PIN string detected in AdminProfileView DOM');
    }
    console.log('[PASS] AdminProfileView live active sessions & security hygiene');

    // Theme Switch (Light <-> Dark) & Final Mobile Overflow Check
    const themeToggleBtn = page.getByRole('button', { name: /Ganti Mode Tema Dasbor/i });
    await themeToggleBtn.click();
    await page.waitForTimeout(200);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page, 'Dashboard Dark Mode Mobile');
    await themeToggleBtn.click();
    await page.waitForTimeout(200);
    await assertNoHorizontalOverflow(page, 'Dashboard Light Mode Mobile');
    await page.setViewportSize({ width: 1440, height: 900 });
    console.log('[PASS] Dark <-> Light Theme Toggle + Mobile Zero Horizontal Overflow');

    const assertCleanTabView = async (label) => {
      await page.getByText('Memuat modul analitik...').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(250);
      const boundaryCount = await page.getByText(/Kendala Tampilan pada /i).count();
      if (boundaryCount > 0) {
        throw new Error(`[${label}] TabErrorBoundary fallback rendered`);
      }
      await assertNoHorizontalOverflow(page, label);
      const formAudit = await page.evaluate(() => {
        const issues = [];
        for (const el of document.querySelectorAll('input, select, textarea')) {
          if (el.type === 'hidden' || el.id?.startsWith('g-recaptcha-response')) continue;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || el.offsetParent === null) continue;
          const ariaLabel = (el.getAttribute('aria-label') || '').trim();
          const ariaLabelledBy = (el.getAttribute('aria-labelledby') || '').trim();
          const hasLabelFor = Boolean(el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`));
          const inLabel = Boolean(el.closest('label'));
          if (ariaLabel === 'Bidang input data') {
            issues.push(`generic-aria:${el.tagName}#${el.id || ''}`);
          } else if (!ariaLabel && !ariaLabelledBy && !hasLabelFor && !inLabel) {
            issues.push(`unlabeled:${el.tagName}#${el.id || ''}.${el.className || ''}`);
          }
        }
        return issues;
      });
      if (formAudit.length > 0) {
        throw new Error(`[${label}] Accessible label issues: ${formAudit.join(', ')}`);
      }
      const vendorAndBtnAudit = await page.evaluate(() => {
        const text = document.body.innerText || '';
        const leaks = [];
        if (/\bduckdb\b/i.test(text)) leaks.push('DuckDB');
        if (/\bgemini\b/i.test(text)) leaks.push('Gemini');
        const unlabeledBtns = [];
        for (const b of document.querySelectorAll('button')) {
          if (b.offsetParent === null) continue;
          const t = (b.innerText || '').trim();
          const a = (b.getAttribute('aria-label') || b.getAttribute('title') || '').trim();
          if (!t && !a) unlabeledBtns.push((b.className || 'btn').toString().slice(0, 40));
        }
        return { leaks, unlabeledBtns };
      });
      if (vendorAndBtnAudit.leaks.length > 0) {
        throw new Error(`[${label}] Vendor terminology leak in visible UI: ${vendorAndBtnAudit.leaks.join(', ')}`);
      }
      if (vendorAndBtnAudit.unlabeledBtns.length > 0) {
        throw new Error(`[${label}] Unlabeled icon buttons: ${vendorAndBtnAudit.unlabeledBtns.join(', ')}`);
      }
    };

    const fullTabSweep = [
      ['Antrean Klaim', /Antrean Klaim/i],
      ['Surveilans Faskes', /Surveilans Faskes \(FRI\)/i],
      ['Intelijen DPJP', /Intelijen DPJP & SIP/i],
      ['Gudang Data', /Gudang Data & SQL/i],
      ['Jejak Audit', /Jejak Audit Sistem/i],
      ['Kopilot Agen', /Kopilot Agen Audit/i],
      ['Standar & Tata Kelola', /Standar & Tata Kelola BEA/i],
      ['Pengaturan', /Pengaturan/i],
      ['Pusat Komando', /Pusat Komando Cabang/i],
      ['Manajemen Berkas', /Manajemen Berkas/i],
      ['Triase Cepat', /Triase Cepat/i],
      ['Berkas Ditandai', /Berkas Ditandai/i],
      ['Telemetri Mobile', /Telemetri Mobile JKN/i],
      ['Jadwal Klarifikasi', /Jadwal Klarifikasi RS/i],
      ['Konfirmasi Peserta', /Konfirmasi Peserta/i],
      ['Intervensi', /Intervensi & Tindak Lanjut/i],
      ['Analitik Tren', /Analitik Tren Klaim/i],
      ['Kepatuhan & Retensi', /Kepatuhan & Retensi RS/i],
      ['Asisten Klinis', /Asisten Klinis JKN/i],
    ];

    for (const [qText, btnRegex] of fullTabSweep) {
      await navigateViaCommandPalette(qText, btnRegex);
      await assertCleanTabView(`Tab:${qText}`);
      if (qText === 'Manajemen Berkas') {
        const actionBtn = page.locator('button[aria-label^="Opsi aksi berkas"]').first();
        if (await actionBtn.count()) {
          await actionBtn.click();
          await page.getByRole('button', { name: /Lihat Rincian/i }).click();
          const caseDialog = page.locator('[role="dialog"][aria-modal="true"]').first();
          await caseDialog.waitFor({ state: 'visible', timeout: 8000 });
          await page.keyboard.press('Escape');
          await caseDialog.waitFor({ state: 'hidden', timeout: 5000 });
        }
      }
      if (qText === 'Analitik Tren') {
        await page.locator('#query-select').selectOption('case_distribution');
        await page.getByText(/K-ANONYMITY PESERTA/i).first().waitFor({ state: 'visible', timeout: 8000 });
        await page.getByText(/DIFFERENTIAL PRIVACY/i).first().waitFor({ state: 'visible', timeout: 8000 });
        await page.getByText(/VALIDASI PERSETUJUAN & TOKENISASI/i).first().waitFor({ state: 'visible', timeout: 8000 });
      }
    }
    console.log(`[PASS] Full ${fullTabSweep.length}-tab sweep (zero crashes, zero unlabeled fields, desktop clean)`);

    // Mobile 360x780 sweep across dense modules in Light and Dark mode
    const mobileDenseTabs = [
      ['Gudang Data', /Gudang Data & SQL/i],
      ['BAHV', /Laporan Resmi \(BAHV\)/i],
      ['Pengaturan', /Pengaturan/i],
      ['Manajemen Berkas', /Manajemen Berkas/i],
      ['Telemetri Mobile', /Telemetri Mobile JKN/i],
    ];
    await page.setViewportSize({ width: 360, height: 780 });
    for (const [qText, btnRegex] of mobileDenseTabs) {
      await navigateViaCommandPalette(qText, btnRegex);
      await assertCleanTabView(`Mobile360Light:${qText}`);
    }
    await themeToggleBtn.click();
    await page.waitForTimeout(200);
    for (const [qText, btnRegex] of mobileDenseTabs) {
      await navigateViaCommandPalette(qText, btnRegex);
      await assertCleanTabView(`Mobile360Dark:${qText}`);
    }
    await themeToggleBtn.click();
    await page.setViewportSize({ width: 1440, height: 900 });
    console.log('[PASS] Mobile 360x780 Light & Dark dense-tab overflow & label audit');

    if (pageErrors.length > 0) {
      throw new Error(`Page errors observed: ${pageErrors.join(' | ')}`);
    }
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors observed: ${consoleErrors.join(' | ')}`);
    }
    if (httpFailures.length > 0) {
      throw new Error(`HTTP >= 400 errors observed: ${httpFailures.join(' | ')}`);
    }
    if (tokenUrlLeaks.length > 0) {
      throw new Error(`Token query-param leak observed: ${tokenUrlLeaks.join(' | ')}`);
    }

    await appCtx.close();
    console.log('[ALL PASS] ClaimTrace Playwright E2E smoke suite succeeded with zero console/page/HTTP/token-leak/label errors.');
  } finally {
    if (browser) await browser.close().catch(() => {});
    cleanupSync();
  }
}

run().catch((err) => {
  console.error('[E2E SMOKE FAILED]', err);
  process.exit(1);
});
