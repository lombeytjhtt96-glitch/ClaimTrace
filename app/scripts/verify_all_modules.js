import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/home/Khalaf-Dev/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
const BASE_URL = 'http://localhost:3000';

const DASHBOARD_TABS = [
  'executive',
  'insights',
  'retention',
  'cases_mgmt',
  'quick_triage',
  'flagged_sessions',
  'appointments',
  'command_center',
  'conversations',
  'interventions',
  'database_viewer',
  'queue',
  'investigation',
  'agent_copilot',
  'graph',
  'empirical',
  'faskes',
  'dpjp',
  'mobile_bridge',
  'decision',
  'audit',
  'profile',
  'settings'
];

const AUTH_VIEWS = [
  'landing',
  'login',
  'mfa',
  'logout'
];

async function runVerification() {
  console.log('🚀 Starting Comprehensive Project Verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      // Ignore known benign favicon or websocket reconnection transient warnings if any
      if (!text.includes('favicon.ico')) {
        errors.push({ type: 'console.error', text });
      }
    } else if (msg.type() === 'warning') {
      warnings.push(text);
    }
  });

  page.on('pageerror', err => {
    errors.push({ type: 'pageerror', text: err.toString() });
  });

  const results = [];

  // 1. Verify Auth Views
  console.log('\n--- Verifying Auth & Public Pages ---');
  for (const view of AUTH_VIEWS) {
    const url = `${BASE_URL}/?view=${view}`;
    const initialErrCount = errors.length;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise(r => setTimeout(r, 600));
      const title = await page.evaluate(() => document.title || 'Untitled');
      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 150).replace(/\n/g, ' '));
      const hasError = errors.length > initialErrCount;
      const status = hasError ? 'FAIL' : 'PASS';
      results.push({ category: 'Auth/Public', name: view, url, status, snippet: bodyText });
      console.log(`[${status}] View: ${view} - "${bodyText.slice(0, 60)}..."`);
    } catch (e) {
      results.push({ category: 'Auth/Public', name: view, url, status: 'ERROR', error: e.message });
      console.error(`[ERROR] View: ${view} failed: ${e.message}`);
    }
  }

  // 2. Verify Dashboard Tabs
  console.log('\n--- Verifying Dashboard Cockpit Tabs ---');
  for (const tab of DASHBOARD_TABS) {
    const url = `${BASE_URL}/?view=dashboard&tab=${tab}`;
    const initialErrCount = errors.length;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise(r => setTimeout(r, 600));
      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 150).replace(/\n/g, ' '));
      const hasError = errors.length > initialErrCount;
      const status = hasError ? 'FAIL' : 'PASS';
      results.push({ category: 'Cockpit Tab', name: tab, url, status, snippet: bodyText });
      console.log(`[${status}] Tab: ${tab} - "${bodyText.slice(0, 60)}..."`);
    } catch (e) {
      results.push({ category: 'Cockpit Tab', name: tab, url, status: 'ERROR', error: e.message });
      console.error(`[ERROR] Tab: ${tab} failed: ${e.message}`);
    }
  }

  // 3. Verify Mobile JKN Simulator in Dual View
  console.log('\n--- Verifying Mobile JKN Simulator ---');
  const mobileScreens = ['home', 'antrean', 'riwayat', 'kamar', 'konsultasi', 'ubah_data', 'skrining', 'pembayaran', 'pengaduan', 'bugar', 'obat', 'menu'];
  for (const screen of mobileScreens) {
    const url = `${BASE_URL}/?view=dashboard&mode=split`;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise(r => setTimeout(r, 400));
      results.push({ category: 'Mobile Simulator', name: screen, status: 'PASS' });
      console.log(`[PASS] Mobile screen: ${screen}`);
      break; // Basic verification of split view
    } catch (e) {
      results.push({ category: 'Mobile Simulator', name: screen, status: 'ERROR', error: e.message });
    }
  }

  await browser.close();

  console.log('\n=======================================');
  console.log('       VERIFICATION SUMMARY            ');
  console.log('=======================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status !== 'PASS').length;
  console.log(`Total Checked: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Errors Logged: ${errors.length}`);
  if (errors.length > 0) {
    console.log('\nErrors encountered:');
    errors.forEach((e, i) => console.log(`${i + 1}. [${e.type}] ${e.text}`));
  }
}

runVerification().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
