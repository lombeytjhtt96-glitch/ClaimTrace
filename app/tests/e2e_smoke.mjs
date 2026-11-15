import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

async function waitForHttpReady(url, proc, name, timeoutMs = 45000) {
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
    await assertNoDarkThemeToggle(authPage, 'SignIn Desktop');
    await assertNoHorizontalOverflow(authPage, 'SignIn Desktop');

    await authPage.getByRole('button', { name: /Lupa Password\?/i }).click();
    await authPage.locator('#forgot-username').waitFor({ state: 'visible', timeout: 8000 });
    await assertNoDarkThemeToggle(authPage, 'Forgot Password Desktop');
    await assertNoHorizontalOverflow(authPage, 'Forgot Password Desktop');

    await authPage.setViewportSize({ width: 390, height: 844 });
    await assertNoDarkThemeToggle(authPage, 'Forgot Password Mobile');
    await assertNoHorizontalOverflow(authPage, 'Forgot Password Mobile');
    await authCtx.close();
    console.log('[PASS] Auth SignIn & Lupa Password Light-First lock + responsive checks');

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
    const httpFailures = [];

    page.on('pageerror', (err) => {
      pageErrors.push(String(err?.message || err));
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

    // Mobile viewport check
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    await assertNoHorizontalOverflow(page, 'Dashboard Executive Mobile');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(200);
    console.log('[PASS] Executive Dashboard boot + desktop/mobile zero horizontal overflow');

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
    console.log('[PASS] Pillar 1 Live SQL Warehouse Cohort Panel');

    // Pillar 2 UI: Cek Dokumen RS -> RealBundleMorbidityPanel (Rule MB1-MB5 & Submit Real Bundle)
    await page.getByRole('button', { name: /Cek Dokumen RS/i }).click();
    await page.getByRole('button', { name: /Uji Rule MB1-MB5 & Fornas/i }).waitFor({ state: 'visible', timeout: 10000 });

    const [mbRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/v1/clinical/morbidity-audit') && res.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /Uji Rule MB1-MB5 & Fornas/i }).click(),
    ]);
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
    console.log('[PASS] Pillar 2 MB1-MB5 + Fornas + Real Document Bundle Submit & Cleanup');

    // Pillar 3 UI: Konsol Putusan -> SanggahanAppealsPanel
    const [appealsGetRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().endsWith('/api/v1/appeals') && res.request().method() === 'GET'
      ),
      page.getByRole('button', { name: /Konsol Putusan/i }).click(),
    ]);
    if (appealsGetRes.status() !== 200) {
      throw new Error(`GET /api/v1/appeals failed with status ${appealsGetRes.status()}`);
    }
    await page.getByText('APL-2026-001').first().waitFor({ state: 'visible', timeout: 10000 });

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
    console.log(`[PASS] Pillar 3 Sanggahan BAKB Appeals Panel (${newAppealId})`);

    if (pageErrors.length > 0) {
      throw new Error(`Page errors observed: ${pageErrors.join(' | ')}`);
    }
    if (httpFailures.length > 0) {
      throw new Error(`HTTP >= 400 errors observed: ${httpFailures.join(' | ')}`);
    }

    await appCtx.close();
    console.log('[ALL PASS] ClaimTrace Playwright E2E smoke suite succeeded with zero console/page/HTTP errors.');
  } finally {
    if (browser) await browser.close().catch(() => {});
    cleanupSync();
  }
}

run().catch((err) => {
  console.error('[E2E SMOKE FAILED]', err);
  process.exit(1);
});
