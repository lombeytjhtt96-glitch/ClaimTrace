/**
 * ClaimTrace JKN - Browser Authentication Helper
 * Handles SSO NIP login across test scenarios.
 */

const assert = require('node:assert/strict');
const { BASE_URL, PERSONAS } = require('./config');

/**
 * Ensures the given page is authenticated as a designated persona.
 * @param {import('playwright').Page} page
 * @param {string} personaKey Key in PERSONAS (default: 'VERIFIKATOR')
 */
async function ensureAuthenticated(page, personaKey = 'VERIFIKATOR') {
  const persona = PERSONAS[personaKey] || PERSONAS.VERIFIKATOR;

  // Check if already authenticated by testing /cockpit
  await page.goto(`${BASE_URL}/cockpit`, { waitUntil: 'networkidle', timeout: 30000 });
  const currentUrl = page.url();

  if (!currentUrl.includes('/login')) {
    // Already authenticated
    return;
  }

  console.log(`[AuthHelper] Authenticating as ${persona.role} (${persona.nip})...`);

  // Try quick persona switcher buttons if available
  const quickPersonaBtn = await page.$(`button[data-nip="${persona.nip}"], [data-persona="${persona.role}"]`);
  if (quickPersonaBtn && await quickPersonaBtn.isVisible()) {
    await quickPersonaBtn.click();
    await page.waitForTimeout(300);
  } else {
    // Fill credentials manually
    const idInput = await page.$('input[name="identifier"], input[name="nip"], input[id="identifier"], input[type="text"]');
    assert.ok(idInput, 'Identifier input not found on /login');
    await idInput.fill(persona.nip);

    const pwdInput = await page.$('input[name="password"], input[type="password"]');
    assert.ok(pwdInput, 'Password input not found on /login');
    await pwdInput.fill(persona.password || 'bpjs1234');

    const captchaInput = await page.$('input[name="captcha_input"], input[name="captcha"]');
    if (captchaInput && await captchaInput.isVisible()) {
      await captchaInput.fill('A');
    }
  }

  // Submit form
  const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
  assert.ok(submitBtn, 'Submit button not found on /login');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
    submitBtn.click()
  ]);

  await page.waitForTimeout(500);
}

module.exports = { ensureAuthenticated };
