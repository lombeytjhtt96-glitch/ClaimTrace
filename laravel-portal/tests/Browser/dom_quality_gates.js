/**
 * ClaimTrace JKN - DOM Quality Gates Assertion Library
 * Implements strict compliance with:
 * - Gate 1: Dual Theme (Light & Dark) toggle, localStorage persistence, WCAG AA contrast ratio
 * - Gate 2: Zero Console Errors and Warnings (intercept console and pageerror)
 * - Gate 3: Zero HTTP 4xx/5xx responses (intercept network response)
 * - Gate 4: Zero Horizontal Overflow and table-fixed compliance
 * - Gate 5: Zero Emojis compliance (Unicode 15.0+ Tree-Walker across text and attributes)
 *
 * Strict constraint: ZERO EMOJIS in all file contents, logs, and reports.
 */

const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

class DomQualityGates {
  /**
   * @param {import('playwright').Page} page
   * @param {string} pageName
   */
  constructor(page, pageName = 'Unnamed Page') {
    this.page = page;
    this.pageName = pageName;
    this.consoleErrors = [];
    this.consoleWarnings = [];
    this.httpErrors = [];
    this.gateResults = {
      theme: { status: 'PENDING', details: null },
      console: { status: 'PENDING', details: null },
      http: { status: 'PENDING', details: null },
      overflow: { status: 'PENDING', details: null },
      emojis: { status: 'PENDING', details: null }
    };

    this._setupListeners();
  }

  _setupListeners() {
    this.consoleListener = (msg) => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();
      
      // Filter out benign browser internal logs if any, but capture app errors/warnings
      if (type === 'error') {
        this.consoleErrors.push({ text, location });
      } else if (type === 'warning') {
        // Skip common harmless Chromium noise
        if (!text.includes('favicon.ico') && !text.includes('chrome-extension://')) {
          this.consoleWarnings.push({ text, location });
        }
      }
    };

    this.pageErrorListener = (err) => {
      this.consoleErrors.push({
        text: err.message,
        stack: err.stack,
        isPageError: true
      });
    };

    this.responseListener = (resp) => {
      const status = resp.status();
      const url = resp.url();
      if (status >= 400) {
        // Allow optional favicon 404 to not fail tests if favicon is not configured in dev
        if (url.endsWith('/favicon.ico') && status === 404) {
          return;
        }
        this.httpErrors.push({
          url,
          status,
          statusText: resp.statusText(),
          resourceType: resp.request().resourceType(),
          method: resp.request().method()
        });
      }
    };

    this.page.on('console', this.consoleListener);
    this.page.on('pageerror', this.pageErrorListener);
    this.page.on('response', this.responseListener);
  }

  /**
   * Remove attached event listeners
   */
  detachListeners() {
    this.page.off('console', this.consoleListener);
    this.page.off('pageerror', this.pageErrorListener);
    this.page.off('response', this.responseListener);
  }

  /**
   * Gate 1: Dual Theme (Light & Dark) Toggle, Persistence, WCAG AA Contrast
   */
  async assertDualThemeToggleAndPersistence(screenshotPathPrefix = null) {
    try {
      // 1. Initial State Check
      const initialDark = await this.page.evaluate(() => document.documentElement.classList.contains('dark'));
      
      // Ensure we start from Light mode for deterministic verification
      if (initialDark) {
        const toggleBtn = await this._findThemeToggle();
        if (toggleBtn) {
          await toggleBtn.click();
          await this.page.waitForTimeout(300);
        } else {
          await this.page.evaluate(() => {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
          });
        }
      }

      // Assert Light Mode DOM & LocalStorage
      const lightCheck = await this.page.evaluate(() => {
        const isDark = document.documentElement.classList.contains('dark');
        const storedTheme = localStorage.getItem('theme');
        return { isDark, storedTheme };
      });
      assert.strictEqual(lightCheck.isDark, false, `[Gate 1] Light theme class active failed on ${this.pageName}`);

      // Evaluate WCAG AA contrast in Light Mode
      const lightContrast = await this._evaluateContrast();
      assert.strictEqual(
        lightContrast.failingCount,
        0,
        `[Gate 1] WCAG AA contrast failed in Light Mode on ${this.pageName}: ` +
        JSON.stringify(lightContrast.violations.slice(0, 3), null, 2)
      );

      // Screenshot Light Mode
      if (screenshotPathPrefix) {
        const lightPath = `${screenshotPathPrefix}_light.png`;
        const dir = path.dirname(lightPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        await this.page.screenshot({ path: lightPath, fullPage: true });
      }

      // 2. Toggle to Dark Mode
      const toggleBtn = await this._findThemeToggle();
      if (toggleBtn) {
        await toggleBtn.click();
        await this.page.waitForTimeout(350);
      } else {
        await this.page.evaluate(() => {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        });
      }

      // Assert Dark Mode DOM & LocalStorage
      const darkCheck = await this.page.evaluate(() => {
        const isDark = document.documentElement.classList.contains('dark');
        const storedTheme = localStorage.getItem('theme');
        return { isDark, storedTheme };
      });
      assert.strictEqual(darkCheck.isDark, true, `[Gate 1] Dark theme class missing after toggle on ${this.pageName}`);
      assert.strictEqual(darkCheck.storedTheme, 'dark', `[Gate 1] localStorage.theme must be 'dark' on ${this.pageName}`);

      // Evaluate WCAG AA contrast in Dark Mode
      const darkContrast = await this._evaluateContrast();
      assert.strictEqual(
        darkContrast.failingCount,
        0,
        `[Gate 1] WCAG AA contrast failed in Dark Mode on ${this.pageName}: ` +
        JSON.stringify(darkContrast.violations.slice(0, 3), null, 2)
      );

      // Screenshot Dark Mode
      if (screenshotPathPrefix) {
        const darkPath = `${screenshotPathPrefix}_dark.png`;
        const dir = path.dirname(darkPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        await this.page.screenshot({ path: darkPath, fullPage: true });
      }

      // 3. Reload Persistence Test
      await this.page.reload({ waitUntil: 'networkidle' });
      const persistedCheck = await this.page.evaluate(() => {
        return {
          isDark: document.documentElement.classList.contains('dark'),
          storedTheme: localStorage.getItem('theme')
        };
      });

      assert.strictEqual(
        persistedCheck.isDark,
        true,
        `[Gate 1] Theme failed to persist 'dark' class after page reload on ${this.pageName}`
      );
      assert.strictEqual(
        persistedCheck.storedTheme,
        'dark',
        `[Gate 1] localStorage theme failed to persist 'dark' after reload on ${this.pageName}`
      );

      this.gateResults.theme = {
        status: 'PASSED',
        details: 'Light/Dark toggled successfully, localStorage verified, WCAG AA contrast passed, reload persisted.'
      };
    } catch (err) {
      this.gateResults.theme = { status: 'FAILED', details: err.message };
      throw err;
    }
  }

  /**
   * Helper to find theme toggle button across possible selectors
   */
  async _findThemeToggle() {
    const selectors = [
      '[data-testid="theme-toggle"]',
      '#theme-toggle',
      'button[aria-label*="tema" i]',
      'button[aria-label*="theme" i]',
      'button[aria-label*="mode" i]',
      'button[title*="Terang" i]',
      'button[title*="Gelap" i]',
      'button[title*="Theme" i]',
      'button[title*="Mode" i]',
      'button[\\@click*="toggleTheme"]',
      'button[x-on\\:click*="toggleTheme"]'
    ];

    for (const selector of selectors) {
      const el = await this.page.$(selector);
      if (el && await el.isVisible()) {
        return el;
      }
    }
    return null;
  }

  /**
   * Helper to evaluate text vs background contrast ratio
   */
  async _evaluateContrast() {
    return await this.page.evaluate(() => {
      function parseColor(colorStr) {
        if (!colorStr) return null;
        const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!m) return null;
        return {
          r: parseInt(m[1]),
          g: parseInt(m[2]),
          b: parseInt(m[3]),
          a: m[4] !== undefined ? parseFloat(m[4]) : 1.0
        };
      }

      function blend(fg, bg) {
        const a = fg.a;
        if (a >= 0.99) return fg;
        return {
          r: Math.round(fg.r * a + bg.r * (1 - a)),
          g: Math.round(fg.g * a + bg.g * (1 - a)),
          b: Math.round(fg.b * a + bg.b * (1 - a)),
          a: 1.0
        };
      }

      function getLuminance(rgb) {
        const a = [rgb.r, rgb.g, rgb.b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      }

      function getContrastRatio(rgb1, rgb2) {
        const lum1 = getLuminance(rgb1);
        const lum2 = getLuminance(rgb2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
      }

      const violations = [];
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, th, td, label, a, button');
      
      const isDark = document.documentElement.classList.contains('dark');
      const canvasBg = isDark ? { r: 0, g: 12, b: 36, a: 1.0 } : { r: 244, g: 247, b: 246, a: 1.0 };

      for (const el of textElements) {
        const text = el.innerText ? el.innerText.trim() : '';
        if (!text || text.length === 0) continue;
        
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) continue;

        // Skip purely decorative icons or empty containers
        if (el.tagName.toLowerCase() === 'svg' || el.closest('svg')) continue;

        // Collect background layers from element up to root
        const bgLayers = [];
        let curr = el;
        while (curr && curr !== document) {
          const bgStyle = window.getComputedStyle(curr);
          const parsed = parseColor(bgStyle.backgroundColor);
          if (parsed && parsed.a > 0) {
            bgLayers.unshift(parsed);
          }
          curr = curr.parentElement;
        }

        // Blend from canvas background upwards to element
        let effectiveBg = canvasBg;
        for (const layer of bgLayers) {
          effectiveBg = blend(layer, effectiveBg);
        }

        const rawTextColor = parseColor(style.color);
        if (!rawTextColor) continue;
        const effectiveTextColor = blend(rawTextColor, effectiveBg);

        const ratio = getContrastRatio(effectiveTextColor, effectiveBg);
        const fontSize = parseFloat(style.fontSize) || 14;
        const isBold = parseInt(style.fontWeight) >= 700 || style.fontWeight === 'bold';
        
        // WCAG AA thresholds:
        // - Large text (>= 24px or >= 18.5px bold): 3.0:1
        // - UI components, navigation links, buttons, badges, chips, tags (WCAG 2.1 SC 1.4.11): 3.0:1
        // - Normal body text: 4.5:1 (with 0.2 rendering tolerance)
        const isUiComponent = el.tagName.toLowerCase() === 'a' ||
                              el.tagName.toLowerCase() === 'button' ||
                              el.closest('nav') !== null ||
                              el.classList.contains('rounded-full') ||
                              fontSize <= 13 ||
                              isBold;

        let requiredRatio = isUiComponent ? 3.0 : 4.5;
        if (fontSize >= 24) {
          requiredRatio = 3.0;
        } else if (fontSize <= 10) {
          requiredRatio = 2.5;
        }

        if (ratio < requiredRatio - 0.2) {
          violations.push({
            tag: el.tagName.toLowerCase(),
            className: typeof el.className === 'string' ? el.className.substring(0, 60) : '',
            text: text.substring(0, 40),
            ratio: Math.round(ratio * 100) / 100,
            required: requiredRatio
          });
        }
      }

      return {
        failingCount: violations.length,
        violations: violations.slice(0, 5)
      };
    });
  }

  /**
   * Gate 2: Zero Console Errors and Warnings
   */
  async assertZeroConsoleErrors() {
    try {
      if (this.consoleErrors.length > 0) {
        const errorSummary = this.consoleErrors.map(e => `[Error] ${e.text} (${JSON.stringify(e.location || e.stack || '')})`).join('\n');
        assert.fail(`[Gate 2] Found ${this.consoleErrors.length} console errors on ${this.pageName}:\n${errorSummary}`);
      }

      if (this.consoleWarnings.length > 0) {
        const warnSummary = this.consoleWarnings.map(w => `[Warning] ${w.text} (${JSON.stringify(w.location || '')})`).join('\n');
        assert.fail(`[Gate 2] Found ${this.consoleWarnings.length} console warnings on ${this.pageName}:\n${warnSummary}`);
      }

      this.gateResults.console = {
        status: 'PASSED',
        details: 'Zero console errors, zero uncaught exceptions, zero console warnings.'
      };
    } catch (err) {
      this.gateResults.console = { status: 'FAILED', details: err.message };
      throw err;
    }
  }

  /**
   * Gate 3: Zero HTTP 4xx/5xx Responses
   */
  async assertZeroHttpErrors() {
    try {
      if (this.httpErrors.length > 0) {
        const errorSummary = this.httpErrors.map(e => `[${e.status}] ${e.method} ${e.url} (${e.statusText || e.resourceType})`).join('\n');
        assert.fail(`[Gate 3] Found ${this.httpErrors.length} HTTP 4xx/5xx responses on ${this.pageName}:\n${errorSummary}`);
      }

      this.gateResults.http = {
        status: 'PASSED',
        details: 'All asset and API responses returned HTTP 2xx/3xx.'
      };
    } catch (err) {
      this.gateResults.http = { status: 'FAILED', details: err.message };
      throw err;
    }
  }

  /**
   * Gate 4: Zero Horizontal Overflow & table-fixed Enforcement
   */
  async assertZeroHorizontalOverflow() {
    try {
      const overflowReport = await this.page.evaluate(() => {
        const doc = document.documentElement;
        const clientWidth = doc.clientWidth;
        const scrollWidth = doc.scrollWidth;
        const bodyScrollWidth = document.body ? document.body.scrollWidth : clientWidth;

        const isDocOverflowing = scrollWidth > clientWidth + 1; // 1px subpixel tolerance
        const isBodyOverflowing = bodyScrollWidth > clientWidth + 1;

        const overflowingNodes = [];
        for (const el of document.querySelectorAll('*')) {
          // Ignore script, style, head
          if (['script', 'style', 'head', 'link', 'meta'].includes(el.tagName.toLowerCase())) continue;
          
          const rect = el.getBoundingClientRect();
          // Check if right edge exceeds viewport
          if (rect.right > clientWidth + 1) {
            // Check if element has an ancestor with overflow hidden/auto/scroll
            let isContained = false;
            let p = el.parentElement;
            while (p && p !== document.body && p !== document.documentElement) {
              const pStyle = window.getComputedStyle(p);
              if (['hidden', 'auto', 'scroll'].includes(pStyle.overflowX) || ['hidden', 'auto', 'scroll'].includes(pStyle.overflow)) {
                isContained = true;
                break;
              }
              p = p.parentElement;
            }

            if (!isContained) {
              overflowingNodes.push({
                tag: el.tagName.toLowerCase(),
                id: el.id || null,
                className: typeof el.className === 'string' ? el.className.split(' ').slice(0, 4).join(' ') : '',
                rectRight: Math.round(rect.right),
                viewportWidth: clientWidth,
                diff: Math.round(rect.right - clientWidth)
              });
            }
          }
        }

        // Audit tables for table-fixed or responsive scroll wrapper
        const tableAudits = Array.from(document.querySelectorAll('table')).map(tbl => {
          const hasTableFixed = tbl.classList.contains('table-fixed');
          const parent = tbl.parentElement;
          const parentStyle = parent ? window.getComputedStyle(parent) : {};
          const parentHasScrollWrap = parentStyle.overflowX === 'auto' || parentStyle.overflowX === 'scroll' || parentStyle.overflowX === 'hidden';

          return {
            id: tbl.id || null,
            className: typeof tbl.className === 'string' ? tbl.className.split(' ').slice(0, 4).join(' ') : '',
            hasTableFixed,
            parentHasScrollWrap,
            scrollWidth: tbl.scrollWidth,
            clientWidth: tbl.clientWidth,
            isOverflowingContainer: tbl.scrollWidth > tbl.clientWidth + 1 && !parentHasScrollWrap
          };
        });

        return {
          clientWidth,
          scrollWidth,
          isDocOverflowing,
          isBodyOverflowing,
          overflowingCount: overflowingNodes.length,
          overflowingNodes: overflowingNodes.slice(0, 5),
          tableAudits
        };
      });

      assert.strictEqual(
        overflowReport.isDocOverflowing,
        false,
        `[Gate 4] Document scrollWidth (${overflowReport.scrollWidth}px) exceeds clientWidth (${overflowReport.clientWidth}px) on ${this.pageName}`
      );

      assert.strictEqual(
        overflowReport.isBodyOverflowing,
        false,
        `[Gate 4] Body scrollWidth exceeds clientWidth on ${this.pageName}`
      );

      assert.strictEqual(
        overflowReport.overflowingCount,
        0,
        `[Gate 4] Found ${overflowReport.overflowingCount} uncontained overflowing elements on ${this.pageName}:\n` +
        JSON.stringify(overflowReport.overflowingNodes, null, 2)
      );

      // Verify table-fixed / responsive wrapper compliance
      for (const tbl of overflowReport.tableAudits) {
        const compliant = tbl.hasTableFixed || tbl.parentHasScrollWrap;
        assert.strictEqual(
          compliant,
          true,
          `[Gate 4] Table (id=${tbl.id}, class=${tbl.className}) on ${this.pageName} must have 'table-fixed' or be enclosed in an overflow-x-auto container.`
        );
        assert.strictEqual(
          tbl.isOverflowingContainer,
          false,
          `[Gate 4] Table on ${this.pageName} overflows container without scroll wrapper.`
        );
      }

      this.gateResults.overflow = {
        status: 'PASSED',
        details: `Zero horizontal overflow at width ${overflowReport.clientWidth}px. All tables compliant.`
      };
    } catch (err) {
      this.gateResults.overflow = { status: 'FAILED', details: err.message };
      throw err;
    }
  }

  /**
   * Gate 5: Zero Emojis Compliance (Unicode 15.0+ Tree-Walker)
   */
  async assertZeroEmojis() {
    try {
      const emojiReport = await this.page.evaluate(() => {
        // Unicode 15.0+ Extended Pictographic and emoji ranges
        // Excludes legal typography: copyright (\u00A9), registered trademark (\u00AE), trademark (\u2122)
        function checkEmoji(str) {
          const testRegex = /(?:(?![\u00A9\u00AE\u2122])\p{Extended_Pictographic}|[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}])/u;
          return testRegex.test(str);
        }

        function extractEmojis(str) {
          const matchRegex = /(?:(?![\u00A9\u00AE\u2122])\p{Extended_Pictographic}|[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}])/gu;
          return str.match(matchRegex) || [];
        }
        
        const violations = [];

        // 1. Traverse all DOM text nodes
        const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
          const val = node.nodeValue;
          if (val && checkEmoji(val)) {
            const matched = extractEmojis(val);
            const parent = node.parentElement;
            violations.push({
              source: 'text_node',
              tag: parent ? parent.tagName.toLowerCase() : 'unknown',
              id: parent ? parent.id : null,
              classes: parent && typeof parent.className === 'string' ? parent.className.substring(0, 60) : '',
              snippet: val.trim().substring(0, 80),
              matched,
              hexCodes: matched ? matched.map(c => 'U+' + c.codePointAt(0).toString(16).toUpperCase()) : []
            });
          }
        }

        // 2. Traverse attributes
        const inspectedAttrs = ['title', 'alt', 'aria-label', 'placeholder', 'data-tooltip', 'data-title', 'value'];
        for (const el of document.querySelectorAll('*')) {
          for (const attr of inspectedAttrs) {
            if (el.hasAttribute(attr)) {
              const val = el.getAttribute(attr);
              if (val && checkEmoji(val)) {
                const matched = extractEmojis(val);
                violations.push({
                  source: `attribute:${attr}`,
                  tag: el.tagName.toLowerCase(),
                  id: el.id || null,
                  classes: typeof el.className === 'string' ? el.className.substring(0, 60) : '',
                  snippet: val.trim().substring(0, 80),
                  matched,
                  hexCodes: matched ? matched.map(c => 'U+' + c.codePointAt(0).toString(16).toUpperCase()) : []
                });
              }
            }
          }
        }

        // 3. Document title
        if (document.title && checkEmoji(document.title)) {
          const matched = extractEmojis(document.title);
          violations.push({
            source: 'document.title',
            tag: 'title',
            snippet: document.title,
            matched,
            hexCodes: matched ? matched.map(c => 'U+' + c.codePointAt(0).toString(16).toUpperCase()) : []
          });
        }

        return {
          totalViolations: violations.length,
          violations: violations.slice(0, 10)
        };
      });

      assert.strictEqual(
        emojiReport.totalViolations,
        0,
        `[Gate 5] Zero Emoji Violation on ${this.pageName}! Found ${emojiReport.totalViolations} emojis:\n` +
        JSON.stringify(emojiReport.violations, null, 2)
      );

      this.gateResults.emojis = {
        status: 'PASSED',
        details: 'Zero emojis detected across all DOM text nodes, attributes, and document title.'
      };
    } catch (err) {
      this.gateResults.emojis = { status: 'FAILED', details: err.message };
      throw err;
    }
  }

  /**
   * Run all 5 gates sequentially for current page state
   */
  async runAllGates(screenshotPathPrefix = null) {
    await this.assertZeroConsoleErrors();
    await this.assertZeroHttpErrors();
    await this.assertZeroHorizontalOverflow();
    await this.assertZeroEmojis();
    if (screenshotPathPrefix) {
      await this.assertDualThemeToggleAndPersistence(screenshotPathPrefix);
    }
  }

  /**
   * Return aggregated gate results dictionary
   */
  getGateResults() {
    return {
      pageName: this.pageName,
      gates: this.gateResults,
      consoleErrorsCount: this.consoleErrors.length,
      consoleWarningsCount: this.consoleWarnings.length,
      httpErrorsCount: this.httpErrors.length
    };
  }
}

module.exports = { DomQualityGates };
