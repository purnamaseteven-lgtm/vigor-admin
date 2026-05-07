import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.AUTH_TEST_BYPASS = 'true';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.PG_OPERATOR_TOKEN = process.env.PG_OPERATOR_TOKEN || 'test_pg_operator_token';
process.env.PG_SECRET_KEY = process.env.PG_SECRET_KEY || 'test_pg_secret';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:5173';

const { startServer } = await import('../server/index.js');

async function reqJson(baseUrl, method, path, body, headers = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function run() {
  const server = startServer(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    let out = await reqJson(baseUrl, 'POST', '/api/admin/create-user', { username: 'x', password: 'x' }, { 'x-test-role': 'Agent' });
    assert.equal(out.res.status, 403, 'Agent must not create admin user');

    out = await reqJson(baseUrl, 'GET', '/api/cloudflare/domains', null, { 'x-test-role': 'Whitelabel' });
    assert.equal(out.res.status, 403, 'Whitelabel must not access cloudflare domains');

    out = await reqJson(baseUrl, 'POST', '/api/payments/unopay/create', { amount: 1000 }, { 'x-test-role': 'Agent' });
    assert.equal(out.res.status, 403, 'Agent must not create provider payment');

    out = await reqJson(baseUrl, 'POST', '/api/payments/unopay/create', { amount: 1000 }, { 'x-test-role': 'Whitelabel' });
    assert.notEqual(out.res.status, 403, 'Whitelabel should pass RBAC for payment ops');

    out = await reqJson(baseUrl, 'GET', '/api/cloudflare/domains', null, { 'x-test-role': 'SuperAdmin' });
    assert.notEqual(out.res.status, 403, 'SuperAdmin should pass RBAC for cloudflare');

    console.log('rbac-backend-routes.test: OK');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
