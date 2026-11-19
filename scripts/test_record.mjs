import { chromium } from '../app/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BACKEND_DIR = '/home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/backend';
const RECORDINGS_DIR = '/home/Khalaf-Dev/.gemini/antigravity/brain/7f0e98c8-5cdd-40aa-a190-85dce8047cde/recordings';

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

async function smoothScroll(page, targetY, durationMs = 2000) {
  const startY = await page.evaluate(() => window.scrollY);
  const distance = targetY - startY;
  const steps = Math.max(10, Math.floor(durationMs / 40));
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    // easeInOutQuad
    const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
    const currentY = startY + distance * ease;
    await page.evaluate((y) => window.scrollTo(0, y), currentY);
    await page.waitForTimeout(40);
  }
}

async function mouseWiggle(page, startX, startY, endX, endY, steps = 15) {
  await page.mouse.move(startX, startY);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;
    await page.mouse.move(x, y);
    await page.waitForTimeout(30);
  }
}

async function runTest() {
  console.log('Launching browser with video recording...');
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('claimtrace_device_fp', 'CT-WKS-DEMO-RECORD-001');
    localStorage.setItem('bpjs_auth_token', token);
    localStorage.setItem('bpjs_user_role', user.role);
    localStorage.setItem('bpjs_user_nip', user.nip);
    localStorage.setItem('claimtrace_user', JSON.stringify(user));
    localStorage.removeItem('claimtrace_session_revoked_at');
  }, sessionData);

  const page = await context.newPage();

  console.log('Testing 10-second capture...');
  await page.goto('http://127.0.0.1:3000/?tab=executive', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await smoothScroll(page, 400, 1500);
  await page.waitForTimeout(2000);
  await smoothScroll(page, 0, 1000);
  await page.waitForTimeout(1000);

  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  const videoPath = await video.path();
  console.log('Test video recorded at:', videoPath);
}

runTest().catch(console.error);
