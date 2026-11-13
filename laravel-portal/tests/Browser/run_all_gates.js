#!/usr/bin/env node
/**
 * ClaimTrace JKN - Playwright DOM Quality Gate Runner
 * Standalone executable runner for all browser quality gates and scenarios.
 *
 * Usage:
 *   node tests/Browser/run_all_gates.js
 *   PORTAL_BASE_URL=http://127.0.0.1:8001 node tests/Browser/run_all_gates.js
 *
 * Produces:
 *   - reports/quality_gate_report.md
 *   - reports/quality_gate_summary.json
 *   - reports/screenshots/*
 *
 * Exit Codes:
 *   0: All quality gates and scenarios passed (100% green)
 *   1: One or more quality gates or scenarios failed
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { BASE_URL, REPORT_DIR, SCREENSHOT_DIR, VIEWPORTS, getPlaywright } = require('./config');

// Load scenario modules
const scenario01 = require('./scenarios/01_login_gates.spec');
const scenario02 = require('./scenarios/02_cockpit_funnel_gates.spec');
const scenario03 = require('./scenarios/03_vedika_queue_gates.spec');
const scenario04 = require('./scenarios/04_dossier_investigation_gates.spec');
const scenario05 = require('./scenarios/05_decision_console_gates.spec');
const scenario06 = require('./scenarios/06_printable_reports_gates.spec');

const SCENARIOS = [
  { id: '01_Login_SSO_Directory', name: 'Scenario 01: Login & SSO NIP Directory', run: scenario01.runScenario },
  { id: '02_Cockpit_Screening_Funnel', name: 'Scenario 02: Cockpit Executive & Screening Funnel', run: scenario02.runScenario },
  { id: '03_Vedika_Queue_Plotting', name: 'Scenario 03: VEDIKA Antrean FPK & Plotting Queue', run: scenario03.runScenario },
  { id: '04_Dossier_Investigation_4Layer', name: 'Scenario 04: Bedah Investigasi & Dossier Digital', run: scenario04.runScenario },
  { id: '05_Decision_Console_Ledger', name: 'Scenario 05: Konsol Putusan 4-Status & BAHV Ledger', run: scenario05.runScenario },
  { id: '06_Official_Printable_Reports', name: 'Scenario 06: Official Printable Reports (BAHV/BA/SP1)', run: scenario06.runScenario }
];

/**
 * Check if the target server is listening before launching browser
 */
function checkServerHealth(url, timeoutMs = 5000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const client = u.protocol === 'https:' ? https : http;
      const req = client.get(url, { timeout: timeoutMs }, (res) => {
        resolve({ alive: true, statusCode: res.statusCode });
      });
      req.on('error', (err) => {
        resolve({ alive: false, error: err.message });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({ alive: false, error: 'Connection timed out' });
      });
    } catch (e) {
      resolve({ alive: false, error: e.message });
    }
  });
}

async function main() {
  const startTime = Date.now();
  console.log('================================================================');
  console.log(' ClaimTrace JKN - Playwright DOM Quality Gate Runner');
  console.log(' Target Application Host: ' + BASE_URL);
  console.log(' Quality Gates Enforced:');
  console.log('   [Gate 1] Dual Theme (Light & Dark) Toggle, Persistence, WCAG AA');
  console.log('   [Gate 2] Zero Console Errors & Warnings');
  console.log('   [Gate 3] Zero HTTP 4xx/5xx Responses');
  console.log('   [Gate 4] Zero Horizontal Overflow & table-fixed Enforcement');
  console.log('   [Gate 5] Zero Emojis Compliance (Unicode 15.0+ Tree-Walker)');
  console.log('================================================================\n');

  // Ensure reports directories exist
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // Pre-flight server check
  console.log(`[Preflight] Checking connection to ${BASE_URL}...`);
  const health = await checkServerHealth(BASE_URL);
  if (!health.alive) {
    console.error(`[Preflight ERROR] Could not connect to target host at ${BASE_URL}.`);
    console.error(`Reason: ${health.error}`);
    console.error('Make sure the Laravel portal is running (e.g., php artisan serve --port=8001).');
    
    // Write failure report
    const failureSummary = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      status: 'FAILED_PREFLIGHT',
      error: `Server at ${BASE_URL} is unreachable: ${health.error}`,
      totalScenarios: SCENARIOS.length,
      passed: 0,
      failed: SCENARIOS.length,
      durationMs: Date.now() - startTime,
      scenarios: []
    };
    writeReports(failureSummary);
    process.exit(1);
  }
  console.log(`[Preflight] Server responded with HTTP ${health.statusCode}. Ready.\n`);

  // Launch Playwright Headless Chromium
  const pw = getPlaywright();
  console.log('[Playwright] Launching Chromium headless browser...');
  const browser = await pw.chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote'
    ]
  });

  const context = await browser.newContext({
    viewport: VIEWPORTS.desktop,
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) ClaimTrace-JKN-E2E-Auditor/1.0'
  });

  const reportData = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalScenarios: SCENARIOS.length,
    passed: 0,
    failed: 0,
    durationMs: 0,
    scenarios: []
  };

  // Run each scenario sequentially in its own isolated Page
  for (const item of SCENARIOS) {
    console.log(`>>> Starting: ${item.name}`);
    const scenarioRecord = {
      id: item.id,
      name: item.name,
      status: 'RUNNING',
      errors: [],
      gateResults: null,
      durationMs: 0
    };

    const sStart = Date.now();
    const page = await context.newPage();
    try {
      const result = await item.run(page, { browser, context });
      scenarioRecord.status = 'PASSED';
      scenarioRecord.gateResults = result ? (result.gateResults || {}) : {};
      reportData.passed++;
      console.log(`<<< [PASS] ${item.name} (${Date.now() - sStart} ms)\n`);
    } catch (err) {
      scenarioRecord.status = 'FAILED';
      scenarioRecord.errors.push(err.message);
      if (err.stack) {
        scenarioRecord.stack = err.stack;
      }
      reportData.failed++;
      console.error(`<<< [FAIL] ${item.name}: ${err.message}\n`);
    } finally {
      await page.close().catch(() => {});
    }

    scenarioRecord.durationMs = Date.now() - sStart;
    reportData.scenarios.push(scenarioRecord);
  }

  // Cleanup browser
  await browser.close();

  reportData.durationMs = Date.now() - startTime;

  // Generate Reports
  writeReports(reportData);

  console.log('================================================================');
  console.log(` Summary: ${reportData.passed}/${reportData.totalScenarios} Scenarios Passed (${Math.round((reportData.passed / reportData.totalScenarios) * 100)}%)`);
  console.log(` Total Duration: ${reportData.durationMs} ms`);
  console.log(` Report (Markdown): ${path.join(REPORT_DIR, 'quality_gate_report.md')}`);
  console.log(` Report (JSON):     ${path.join(REPORT_DIR, 'quality_gate_summary.json')}`);
  console.log('================================================================');

  if (reportData.failed > 0) {
    console.error(`FAILED: ${reportData.failed} scenario(s) encountered quality gate violations.`);
    process.exit(1);
  } else {
    console.log('SUCCESS: All 5 Quality Gates passed cleanly across all scenarios with ZERO EMOJIS.');
    process.exit(0);
  }
}

/**
 * Write Markdown and JSON summary reports to disk
 */
function writeReports(data) {
  const jsonPath = path.join(REPORT_DIR, 'quality_gate_summary.json');
  const mdPath = path.join(REPORT_DIR, 'quality_gate_report.md');

  // 1. JSON Report
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');

  // 2. Markdown Report
  const isAllPassed = data.failed === 0 && data.passed > 0;
  const statusLabel = isAllPassed ? 'ALL QUALITY GATES PASSED (100%)' : 'QUALITY GATE FAILURES DETECTED';

  const rows = (data.scenarios || []).map(s => {
    const errorText = s.errors && s.errors.length > 0 ? s.errors.join('; ') : 'All gates green';
    return `| ${s.name} | ${s.status} | ${s.durationMs}ms | ${errorText} |`;
  }).join('\n');

  const mdContent = `# ClaimTrace JKN - DOM Quality Gate Audit Report

- Timestamp: ${data.timestamp}
- Target Application: ${data.baseUrl}
- Overall Status: ${statusLabel}
- Passed: ${data.passed} / ${data.totalScenarios}
- Execution Time: ${data.durationMs} ms

## Scenarios Audit Table

| Scenario | Status | Duration | Notes / Findings |
|---|:---:|:---:|---|
${rows || '| None | N/A | N/A | No scenarios executed |'}

## 5 Quality Gates Verification Matrix

1. Gate 1: Dual Theme (Light & Dark)
   - Status: Active verification of light canvas vs dark canvas, localStorage persistence across page reloads, and WCAG AA contrast ratio compliance (>= 4.5:1 normal text, >= 3.0:1 large text).
2. Gate 2: Zero Console Errors & Warnings
   - Status: Intercepting page.on('console') and page.on('pageerror'). Zero unhandled exceptions or developer warnings allowed.
3. Gate 3: Zero HTTP 4xx/5xx Responses
   - Status: Intercepting page.on('response'). All assets, Vite bundles, and route transitions must return HTTP 2xx/3xx.
4. Gate 4: Zero Horizontal Overflow & table-fixed Enforcement
   - Status: Validating scrollWidth <= clientWidth (+ 1px subpixel tolerance). Ensuring all tabular queues implement table-fixed or responsive scroll wrapper.
5. Gate 5: Zero Emojis Compliance
   - Status: Unicode 15.0+ Extended Pictographic Tree-Walker audit across all DOM text nodes, attribute values, and document.title with zero tolerance.

## Visual Artifacts
Full-page screenshots in Light and Dark themes are preserved in \`tests/Browser/reports/screenshots/\`.
`;

  fs.writeFileSync(mdPath, mdContent, 'utf-8');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error during quality gate execution:', err);
    process.exit(1);
  });
}

module.exports = { main, SCENARIOS };
