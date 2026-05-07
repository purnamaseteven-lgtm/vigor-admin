import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root = process.cwd();
const html = fs.readFileSync(path.join(root, 'app.html'), 'utf8');
const routeRe = /go\('([^']+)'\)/g;
const routes = [...new Set([...html.matchAll(routeRe)].map((m) => m[1]))];

const demoSession = {
  user: { email: 'adminsub40@vigor.internal' },
  access_token: 'mock',
  expires_at: Date.now() + 8 * 60 * 60 * 1000,
};

const server = await createServer({
  root,
  server: { host: '127.0.0.1', port: 4177, strictPort: true },
});
await server.listen();

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const consoleErrors = [];
const pageErrors = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));

await page.addInitScript((session) => {
  sessionStorage.setItem('VGR_DEMO_SESSION', JSON.stringify(session));
}, demoSession);

try {
  await page.goto('http://127.0.0.1:4177/app.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  for (const route of routes) {
    await page.evaluate(async (r) => {
      if (typeof window.go === 'function') {
        await window.go(r);
      }
    }, route);
    await page.waitForTimeout(120);

    const hasRenderError = await page.evaluate(() => {
      const c = document.getElementById('pageContent');
      return !!(c && c.textContent && c.textContent.includes('Page Render Error'));
    });

    assert.equal(hasRenderError, false, `Route "${route}" rendered Page Render Error`);
  }

  assert.equal(pageErrors.length, 0, `Unhandled page errors: ${pageErrors.join(' | ')}`);
  assert.equal(consoleErrors.length, 0, `Console errors: ${consoleErrors.join(' | ')}`);
  console.log(`e2e-pages-smoke.test: OK (${routes.length} routes)`);
} finally {
  await browser.close();
  await server.close();
}
