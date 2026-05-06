import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

function mustInclude(file, snippet, label) {
  const src = read(file);
  assert.ok(src.includes(snippet), `${label} missing in ${file}`);
}

function run() {
  mustInclude('js/main.js', 'setPageResolver', 'Router lazy resolver wiring');
  mustInclude('js/core/router.js', 'export async function go', 'Async route loader');
  mustInclude('js/core/db.js', 'window.db = {', 'DB API export');
  mustInclude('js/core/auth.js', 'export async function requireAuth()', 'Auth guard');

  mustInclude('js/api/payment.js', '/api/payments/unopay/create', 'Unopay backend route');
  mustInclude('js/api/payment.js', '/api/payments/coin2pay/create', 'Coin2Pay backend route');
  mustInclude('js/api/payment.js', '/api/payments/sawala/create', 'Sawala backend route');

  mustInclude('server/index.js', "app.use('/api/webhooks', paymentRouter)", 'Webhook route mount');
  mustInclude('server/index.js', "app.use('/api/seamless', seamlessRouter)", 'Seamless route mount');
  mustInclude('server/routes/seamless.js', "router.post('/Cash/TransferInOut'", 'Seamless transfer endpoint');
  mustInclude('server/routes/payment.js', "router.post('/unopay'", 'Unopay webhook endpoint');
  mustInclude('server/routes/payment.js', "router.post('/coin2pay'", 'Coin2Pay webhook endpoint');
  mustInclude('server/routes/payment.js', "router.post('/sawala'", 'Sawala webhook endpoint');

  mustInclude('docs/FEATURE_READINESS_AUDIT.md', 'Feature Matrix', 'Feature audit doc');
  mustInclude('docs/FEATURE_SMOKE_CHECKLIST.md', 'Feature Smoke Checklist', 'Smoke checklist doc');

  console.log('feature-wiring.test: OK');
}

run();
