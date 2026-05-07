import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.PG_OPERATOR_TOKEN = process.env.PG_OPERATOR_TOKEN || 'test_pg_operator_token';
process.env.PG_SECRET_KEY = process.env.PG_SECRET_KEY || 'test_pg_secret';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:5173';

const { startServer } = await import('../server/index.js');

async function postJson(baseUrl, path, payload, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function run() {
  const server = startServer(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    let out = await postJson(baseUrl, '/api/webhooks/unopay', { reference_id: 'REF-1' });
    assert.equal(out.response.status, 400);
    assert.match(String(out.data.error || ''), /status/i);

    out = await postJson(baseUrl, '/api/webhooks/coin2pay', { order_id: 'ORD-1' });
    assert.equal(out.response.status, 400);
    assert.match(String(out.data.error || ''), /status/i);

    out = await postJson(baseUrl, '/api/webhooks/sawala', { transaction_id: 'TX-1' });
    assert.equal(out.response.status, 400);
    assert.match(String(out.data.error || ''), /status/i);

    console.log('payment-webhook-routes.test: OK');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
