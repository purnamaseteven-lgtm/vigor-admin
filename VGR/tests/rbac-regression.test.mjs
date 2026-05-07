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
  const adminFile = 'server/routes/admin.js';
  const cloudflareFile = 'server/routes/cloudflare.js';
  const sessionFile = 'server/middleware/session.js';
  const serverFile = 'server/index.js';

  // Shared server-side session + role middleware exists.
  mustInclude(sessionFile, 'export async function requireActiveAdmin', 'Shared active-admin middleware');
  mustInclude(sessionFile, 'export function requireRole(...roles)', 'Shared role middleware');

  // Sensitive admin routes require SuperAdmin.
  mustInclude(adminFile, "const requireSuperAdmin = requireRole('SuperAdmin')", 'Admin route superadmin requirement');

  // Cloudflare routes are protected (previously open).
  mustInclude(cloudflareFile, "const requireSuperAdmin = requireRole('SuperAdmin')", 'Cloudflare superadmin guard setup');
  mustInclude(cloudflareFile, "router.post('/add-domain', requireSuperAdmin", 'Cloudflare add-domain RBAC');
  mustInclude(cloudflareFile, "router.post('/remove-domain', requireSuperAdmin", 'Cloudflare remove-domain RBAC');
  mustInclude(cloudflareFile, "router.post('/update-redirect', requireSuperAdmin", 'Cloudflare redirect RBAC');
  mustInclude(cloudflareFile, "router.get('/domains', requireSuperAdmin", 'Cloudflare domains auth');
  mustInclude(cloudflareFile, "router.get('/check-propagation/:zoneId', requireSuperAdmin", 'Cloudflare propagation auth');

  // Request correlation and logging baseline.
  mustInclude(serverFile, "res.setHeader('x-request-id', requestId)", 'Request ID response header');
  mustInclude(serverFile, "event: 'http_request'", 'Structured request logs');

  console.log('rbac-regression.test: OK');
}

run();
