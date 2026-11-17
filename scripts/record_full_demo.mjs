import { chromium } from '../app/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BACKEND_DIR = '/home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/backend';
const ARTIFACT_DIR = '/home/Khalaf-Dev/.gemini/antigravity/brain/7f0e98c8-5cdd-40aa-a190-85dce8047cde';
const RECORDINGS_DIR = path.join(ARTIFACT_DIR, 'recordings');
const SUBMISSIONS_VIDEO_DIR = '/home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/submissions/healthkathon/demo_video';

// Mint authenticated session token
const pyCode = [
  'import json, sys',
  'sys.path.insert(0, ".")',
  'from app.security.token_manager import create_access_token',
  'profile = {',
  '    "nip": "198704202011012001",',
  '    "username": "siti.rahma",',
  '    "email": "siti.rahma@bpjs-kesehatan.go.id",',
  '    "name": "dr. Siti Rahma, Sp.A",',
  '    "role": "ADMIN",',
  '    "unit": "Kantor Pusat BPJS Kesehatan",',
  '    "isMfaVerified": True,',
  '}',
  'token = create_access_token(profile, device_fingerprint="CT-WKS-DEMO-RECORD-001")',
  'print(json.dumps({"token": token, "user": {**profile, "roleTitle": "Verifikator Medis Utama", "avatar": "SR", "allowedRoles": ["ADMIN", "VERIFICATOR_MEDIS", "FRAUD_INVESTIGATOR"]}}))',
].join('\n');

const sessionData = JSON.parse(execFileSync('python3', ['-c', pyCode], { cwd: BACKEND_DIR, encoding: 'utf-8' }).trim().split('\n').pop());

async function smoothScroll(page, targetY, durationMs = 2500) {
  const startY = await page.evaluate(() => window.scrollY);
  const distance = targetY - startY;
  const steps = Math.max(15, Math.floor(durationMs / 30));
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    // easeInOutCubic
    const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    const currentY = startY + distance * ease;
    await page.evaluate((y) => window.scrollTo(0, y), currentY);
    await page.waitForTimeout(30);
  }
}

async function moveMouseSmooth(page, startX, startY, endX, endY, durationMs = 1000) {
  const steps = Math.max(10, Math.floor(durationMs / 30));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const x = startX + (endX - startX) * ease;
    const y = startY + (endY - startY) * ease;
    await page.mouse.move(x, y);
    await page.waitForTimeout(30);
  }
}

async function recordFullDemo() {
  console.log('=== STARTING CLAIMTRACE OFFICIAL DEMO SCREEN RECORDING ===');
  console.log('Target duration: ~3.5 minutes (210 seconds)');
  console.log('Resolution: 1920x1080 (1080p)');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // --------------------------------------------------------------------------
  // SCENE 0: LOGIN & SECURITY GATE (00:00 - 00:25 ~ 25s)
  // --------------------------------------------------------------------------
  console.log('[SCENE 0] Opening Login Gate...');
  await page.goto('http://127.0.0.1:3000/?view=login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Demonstrate inputting credentials
  await moveMouseSmooth(page, 500, 300, 960, 420, 1000);
  const usernameInput = page.locator('#login-username, input[name="username"]').first();
  if (await usernameInput.count() > 0) {
    await usernameInput.click();
    await usernameInput.fill('siti.rahma');
    await page.waitForTimeout(800);
  }

  const emailInput = page.locator('#login-email, input[name="email"]').first();
  if (await emailInput.count() > 0) {
    await emailInput.click();
    await emailInput.fill('siti.rahma@bpjs-kesehatan.go.id');
    await page.waitForTimeout(800);
  }

  const nipInput = page.locator('#login-nip, input[name="nip"]').first();
  if (await nipInput.count() > 0) {
    await nipInput.click();
    await nipInput.fill('198704202011012001');
    await page.waitForTimeout(800);
  }

  const pwdInput = page.locator('#login-password, input[name="password"]').first();
  if (await pwdInput.count() > 0) {
    await pwdInput.click();
    await pwdInput.fill('Password123!');
    await page.waitForTimeout(1000);
  }

  // Highlight security badges
  await moveMouseSmooth(page, 960, 500, 700, 750, 1200);
  await page.waitForTimeout(1500);

  // Authenticate session via localStorage injection for seamless transition
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('claimtrace_device_fp', 'CT-WKS-DEMO-RECORD-001');
    localStorage.setItem('bpjs_auth_token', token);
    localStorage.setItem('bpjs_user_role', user.role);
    localStorage.setItem('bpjs_user_nip', user.nip);
    localStorage.setItem('claimtrace_user', JSON.stringify(user));
    localStorage.removeItem('claimtrace_session_revoked_at');
  }, sessionData);

  console.log('[SCENE 0] Transitioning to Authenticated Cockpit...');
  await page.waitForTimeout(1500);

  // --------------------------------------------------------------------------
  // SCENE 1: EXECUTIVE DASHBOARD (00:25 - 01:15 ~ 50s)
  // --------------------------------------------------------------------------
  console.log('[SCENE 1] Loading Executive Dashboard...');
  await page.goto('http://127.0.0.1:3000/?tab=executive', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  // Hover over the 4 primary KPI cards
  console.log('Hovering over KPI cards (1.699 Jt Klaim, Rp 1,536 T, 2.091 RS, SLA 99,9%)...');
  await moveMouseSmooth(page, 960, 500, 420, 220, 1500);
  await page.waitForTimeout(2500);
  await moveMouseSmooth(page, 420, 220, 680, 220, 1200);
  await page.waitForTimeout(2500);
  await moveMouseSmooth(page, 680, 220, 940, 220, 1200);
  await page.waitForTimeout(2500);
  await moveMouseSmooth(page, 940, 220, 1200, 220, 1200);
  await page.waitForTimeout(2500);

  // Scroll to Charts: Tren Klaim & Donut Proporsi Tingkat Risiko
  console.log('Scrolling to Tren Klaim & Donut Proporsi Risiko...');
  await smoothScroll(page, 420, 2500);
  await page.waitForTimeout(3000);

  // Move mouse over Donut Chart
  await moveMouseSmooth(page, 1200, 220, 1150, 450, 1500);
  await page.waitForTimeout(3000);

  // Scroll further down to Klaim Prioritas & Kapasitas Validasi
  await smoothScroll(page, 850, 2500);
  await page.waitForTimeout(4000);
  await moveMouseSmooth(page, 1150, 450, 500, 750, 1500);
  await page.waitForTimeout(3000);

  // Scroll back to top
  await smoothScroll(page, 0, 2000);
  await page.waitForTimeout(2000);

  // --------------------------------------------------------------------------
  // SCENE 2: TELAAH 4-LAPIS & BIOMETRIK FRISTA & SIP (01:15 - 02:15 ~ 60s)
  // --------------------------------------------------------------------------
  console.log('[SCENE 2] Loading Case Investigation (Audit 4-Lapis)...');
  await page.goto('http://127.0.0.1:3000/?tab=investigation&sub=audit', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  // Show header details: Case CLM-2026-10-085 (RS Khusus Mitra Husada)
  await moveMouseSmooth(page, 200, 200, 450, 180, 1500);
  await page.waitForTimeout(3000);

  // Scroll to Layer 1 & Layer 2
  console.log('Inspecting Lapis 1 (Lonjakan & Upcoding) & Lapis 2 (SATUSEHAT & Geovelocity)...');
  await smoothScroll(page, 380, 2500);
  await page.waitForTimeout(3500);

  // Hover over Impossible Travel / SIP Doctor validation
  await moveMouseSmooth(page, 450, 180, 850, 400, 1500);
  await page.waitForTimeout(3000);

  // Scroll to Layer 3 (Mobile JKN Zero-PHI) & Layer 4 (Biometrik FRISTA & TTE BSrE)
  console.log('Inspecting Lapis 3 (Mobile JKN Telemetry) & Lapis 4 (FRISTA + FairGuard Z49.1)...');
  await smoothScroll(page, 820, 2500);
  await page.waitForTimeout(4000);

  // Hover over FairGuard Z49.1 badge
  await moveMouseSmooth(page, 850, 400, 600, 720, 1500);
  await page.waitForTimeout(3500);

  // Scroll down to Clinical Audit Summary & Recommendations
  await smoothScroll(page, 1250, 2500);
  await page.waitForTimeout(4000);

  // Scroll back to top
  await smoothScroll(page, 0, 2000);
  await page.waitForTimeout(2000);

  // --------------------------------------------------------------------------
  // SCENE 3: CEK DOKUMEN RS (7 BERKAS WAJIB & INVERSI WAKTU) (02:15 - 03:00 ~ 45s)
  // --------------------------------------------------------------------------
  console.log('[SCENE 3] Loading Document Checker (7 Berkas RS & Inversi Waktu)...');
  await page.goto('http://127.0.0.1:3000/?tab=document_checker', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  // Hover over the 7 Mandatory Documents checklist
  console.log('Highlighting 7 Mandatory Documents checklist...');
  await moveMouseSmooth(page, 600, 200, 420, 280, 1500);
  await page.waitForTimeout(3000);

  // Scroll down to Inversi Kronologi Waktu and AI Document Scan
  console.log('Highlighting Anomali Inversi Kronologis Waktu...');
  await smoothScroll(page, 450, 2500);
  await page.waitForTimeout(3500);

  // Highlight Anomali Inversi Waktu warning card
  await moveMouseSmooth(page, 420, 280, 880, 480, 1500);
  await page.waitForTimeout(3500);

  // Scroll to ICD-10 Search & Kaidah Koding MB1-MB5
  await smoothScroll(page, 850, 2500);
  await page.waitForTimeout(3000);
  const icdInput = page.locator('input[placeholder*="ICD"], input[aria-label*="ICD"]').first();
  if (await icdInput.count() > 0) {
    await icdInput.click();
    await icdInput.fill('Sepsis A41.9');
    await page.waitForTimeout(1500);
  }

  // Scroll back to top
  await smoothScroll(page, 0, 2000);
  await page.waitForTimeout(1500);

  // --------------------------------------------------------------------------
  // SCENE 4: LAPORAN RESMI BAHV KOLEKTIF + SEGEL QR SHA-256 (03:00 - 03:35 ~ 35s)
  // --------------------------------------------------------------------------
  console.log('[SCENE 4] Loading Official BAHV Reports with QR Code SHA-256...');
  await page.goto('http://127.0.0.1:3000/?tab=official_reports', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  // Highlight the BAHV Header and Filter Bar
  await moveMouseSmooth(page, 500, 500, 550, 180, 1500);
  await page.waitForTimeout(2500);

  // Scroll down to the official BAHV document preview
  console.log('Inspecting Berita Acara Hasil Verifikasi (BAHV) & QR Seal...');
  await smoothScroll(page, 380, 2500);
  await page.waitForTimeout(3500);

  // Move mouse to the QR Code and SHA-256 Hash Seal
  await moveMouseSmooth(page, 550, 180, 1100, 480, 1500);
  await page.waitForTimeout(3500);

  // Scroll down to Rekapitulasi Klaim & Tanda Tangan Berjenjang
  await smoothScroll(page, 750, 2500);
  await page.waitForTimeout(3500);

  // Return to top for grand finale view
  await smoothScroll(page, 0, 2000);
  await page.waitForTimeout(2500);

  console.log('Finishing video recording...');
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  const rawVideoPath = await video.path();
  console.log('Raw WebM recording saved at:', rawVideoPath);

  // Copy to named destination in Artifact and Submissions directories
  const finalWebmArtifact = path.join(RECORDINGS_DIR, 'ClaimTrace_Official_Demo_Recording_1080p.webm');
  const finalWebmSubmission = path.join(SUBMISSIONS_VIDEO_DIR, 'ClaimTrace_Official_Demo_Recording_1080p.webm');

  fs.copyFileSync(rawVideoPath, finalWebmArtifact);
  fs.copyFileSync(rawVideoPath, finalWebmSubmission);
  console.log('Copied WebM to Artifact:', finalWebmArtifact);
  console.log('Copied WebM to Submissions:', finalWebmSubmission);

  // Convert to high-compatibility MP4 using playwright ffmpeg
  const ffmpegBin = '/home/Khalaf-Dev/.cache/ms-playwright/ffmpeg-1013/ffmpeg-linux';
  const finalMp4Artifact = path.join(RECORDINGS_DIR, 'ClaimTrace_Official_Demo_Recording_1080p.mp4');
  const finalMp4Submission = path.join(SUBMISSIONS_VIDEO_DIR, 'ClaimTrace_Official_Demo_Recording_1080p.mp4');

  if (fs.existsSync(ffmpegBin)) {
    console.log('Converting to MP4 / H.264 or fast remux...');
    try {
      execFileSync(ffmpegBin, [
        '-y',
        '-i', rawVideoPath,
        '-c:v', 'copy',
        finalMp4Artifact
      ], { stdio: 'inherit' });
      fs.copyFileSync(finalMp4Artifact, finalMp4Submission);
      console.log('MP4 conversion completed successfully!');
    } catch (e) {
      console.log('Direct remux skipped or container mismatch, keeping high-def WebM/VP9.');
    }
  }

  console.log('=== OFFICIAL DEMO RECORDING COMPLETED SUCCESSFULLY! ===');
}

recordFullDemo().catch(console.error);
