/**
 * ClaimTrace JKN - Browser Test Configuration
 * Centralized settings for Playwright E2E and Quality Gate execution.
 * Enforces Zero Emojis and deterministic execution.
 */

const path = require('path');

const BASE_URL = process.env.PORTAL_BASE_URL || 'http://127.0.0.1:8001';
const REPORT_DIR = path.resolve(__dirname, 'reports');
const SCREENSHOT_DIR = path.resolve(REPORT_DIR, 'screenshots');

const PERSONAS = {
  VERIFIKATOR: {
    nip: '198704202011012001',
    name: 'dr. Sarah Sp.A',
    role: 'VERIFIKATOR_MEDIS',
    password: process.env.VERIFIKATOR_PASSWORD || 'bpjs1234'
  },
  FRAUD_ANALYST: {
    nip: '199008152014021003',
    name: 'Ahmad Fauzi S.Kom',
    role: 'ANALIS_FRAUD',
    password: process.env.FRAUD_ANALYST_PASSWORD || 'bpjs1234'
  },
  POLICY_ADMIN: {
    nip: '198203102008121001',
    name: 'Budi Prasetyo S.E',
    role: 'ADMINISTRATOR',
    password: process.env.POLICY_ADMIN_PASSWORD || 'bpjs1234'
  },
  AUDITOR: {
    nip: '199512012019032005',
    name: 'Dewi Lestari S.Tr.Kes',
    role: 'AUDITOR',
    password: process.env.AUDITOR_PASSWORD || 'bpjs1234'
  }
};

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 800 },
  tablet: { width: 1024, height: 768 }
};

/**
 * Robust Playwright loader that checks local project, gstack, or app node_modules.
 */
function getPlaywright() {
  const candidatePaths = [
    'playwright',
    '/home/Khalaf-Dev/gstack/node_modules/playwright',
    '/home/Khalaf-Dev/.gemini/antigravity/scratch/claimtrace-jkn/app/node_modules/playwright',
    path.resolve(__dirname, '../../node_modules/playwright')
  ];

  for (const candidate of candidatePaths) {
    try {
      const pw = require(candidate);
      if (pw && pw.chromium) {
        return pw;
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  throw new Error('Playwright library could not be loaded from any known location.');
}

module.exports = {
  BASE_URL,
  REPORT_DIR,
  SCREENSHOT_DIR,
  PERSONAS,
  VIEWPORTS,
  getPlaywright
};
