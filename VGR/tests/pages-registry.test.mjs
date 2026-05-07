import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pagesDir = path.join(root, 'js', 'pages');
const appHtml = fs.readFileSync(path.join(root, 'app.html'), 'utf8');

const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.js'));
const registry = new Map();

for (const file of pageFiles) {
  const src = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  const re = /pages\['([^']+)'\]\s*=/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1];
    if (!registry.has(key)) registry.set(key, []);
    registry.get(key).push(file);
  }
}

const duplicates = [...registry.entries()].filter(([, files]) => files.length > 1);
assert.equal(
  duplicates.length,
  0,
  `Duplicate page keys found: ${duplicates.map(([k, f]) => `${k} -> ${f.join(',')}`).join(' | ')}`
);

const routeRe = /go\('([^']+)'\)/g;
const routes = new Set();
let r;
while ((r = routeRe.exec(appHtml)) !== null) routes.add(r[1]);

const allowedMissing = new Set([
  'login',
]);

const unresolved = [...routes].filter((route) => !registry.has(route) && !allowedMissing.has(route));
assert.equal(
  unresolved.length,
  0,
  `Routes in app.html without page registration: ${unresolved.join(', ')}`
);

console.log('pages-registry.test: OK');
