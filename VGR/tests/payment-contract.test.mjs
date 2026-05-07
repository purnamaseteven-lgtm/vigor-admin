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
  const paymentFile = 'server/routes/payment.js';
  const seamlessFile = 'server/routes/seamless.js';

  // Provider webhook contracts: signature/IP checks are enforced in production.
  mustInclude(paymentFile, 'validateUnopaySignature', 'Unopay signature contract');
  mustInclude(paymentFile, 'validateCoin2PaySignature', 'Coin2Pay signature contract');
  mustInclude(paymentFile, 'validateSawalaIp', 'Sawala source IP contract');
  mustInclude(paymentFile, "validateRequiredFields(body, ['reference_id', 'status'])", 'Unopay payload validation');
  mustInclude(paymentFile, "validateRequiredFields(body, ['order_id', 'status'])", 'Coin2Pay payload validation');
  mustInclude(paymentFile, "validateRequiredFields(body, ['transaction_id', 'status'])", 'Sawala payload validation');
  mustInclude(paymentFile, 'requestId: req.requestId || null', 'Webhook response requestId propagation');

  // Payment management endpoints require RBAC-guarded payment ops role.
  mustInclude(paymentFile, "const requirePaymentOps = requireRole('SuperAdmin', 'Whitelabel')", 'Payment ops role guard setup');
  mustInclude(paymentFile, "router.post('/unopay/create', requirePaymentOps", 'Unopay create auth guard');
  mustInclude(paymentFile, "router.post('/coin2pay/create', requirePaymentOps", 'Coin2Pay create auth guard');
  mustInclude(paymentFile, "router.post('/sawala/create', requirePaymentOps", 'Sawala create auth guard');

  // Seamless wallet contracts.
  mustInclude(seamlessFile, "router.post('/Cash/TransferInOut'", 'TransferInOut endpoint');
  mustInclude(seamlessFile, ".eq('transaction_id', transaction_id)", 'Transfer idempotency lookup');
  mustInclude(seamlessFile, "upsert(tx, { onConflict: 'transaction_id', ignoreDuplicates: true })", 'Transaction idempotent upsert');
  mustInclude(seamlessFile, ".eq('balance', oldBalance)", 'Optimistic balance update guard');
  mustInclude(seamlessFile, 'withReqId(req, resp)', 'Seamless response requestId propagation');

  console.log('payment-contract.test: OK');
}

run();
