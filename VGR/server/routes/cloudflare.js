/* ═══════════════════════════════════════════════════════════════
   CLOUDFLARE API ROUTES
   Domain management: add/remove zones, NS, SSL, redirects
   POST /api/cloudflare/add-domain
   POST /api/cloudflare/remove-domain
   POST /api/cloudflare/update-redirect
   GET  /api/cloudflare/domains
   ═══════════════════════════════════════════════════════════════ */
import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

const CF_TOKEN      = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_BASE       = 'https://api.cloudflare.com/client/v4';

function cfHeaders() {
    return {
        'Authorization': `Bearer ${CF_TOKEN}`,
        'Content-Type':  'application/json',
    };
}

async function cfRequest(method, path, body = null) {
    const opts = { method, headers: cfHeaders() };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(`${CF_BASE}${path}`, opts);
    return res.json();
}

// ── Add domain (create zone) ─────────────────────────────────────
router.post('/add-domain', async (req, res) => {
    if (!CF_TOKEN) return res.json({ error: 'Cloudflare not configured', mock: true, ns: ['mock.ns1.cloudflare.com', 'mock.ns2.cloudflare.com'] });
    try {
        const { domain, company } = req.body;
        if (!domain) return res.status(400).json({ error: 'domain is required' });

        // Create zone
        const zone = await cfRequest('POST', '/zones', {
            name:       domain,
            account:    { id: CF_ACCOUNT_ID },
            jump_start: true,
        });

        if (!zone.success) {
            // Zone might already exist — fetch it
            const existing = await cfRequest('GET', `/zones?name=${domain}`);
            if (existing.result?.[0]) {
                return res.json({ success: true, zone: existing.result[0], ns: existing.result[0].name_servers, exists: true });
            }
            return res.status(400).json({ error: zone.errors?.[0]?.message || 'Failed to create zone' });
        }

        const zoneId  = zone.result.id;
        const ns      = zone.result.name_servers;

        // Set SSL to Full (strict)
        await cfRequest('PATCH', `/zones/${zoneId}/settings/ssl`, { value: 'full' });
        // Enable HTTPS redirect
        await cfRequest('PATCH', `/zones/${zoneId}/settings/always_use_https`, { value: 'on' });
        // Enable min TLS 1.2
        await cfRequest('PATCH', `/zones/${zoneId}/settings/min_tls_version`, { value: '1.2' });

        return res.json({ success: true, zoneId, ns, domain });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// ── Remove domain (delete zone) ──────────────────────────────────
router.post('/remove-domain', async (req, res) => {
    if (!CF_TOKEN) return res.json({ error: 'Cloudflare not configured', mock: true });
    try {
        const { zoneId } = req.body;
        if (!zoneId) return res.status(400).json({ error: 'zoneId is required' });
        const result = await cfRequest('DELETE', `/zones/${zoneId}`);
        return res.json(result);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// ── Add/update redirect rule ─────────────────────────────────────
router.post('/update-redirect', async (req, res) => {
    if (!CF_TOKEN) return res.json({ error: 'Cloudflare not configured', mock: true });
    try {
        const { zoneId, from, to, code = 301 } = req.body;
        const result = await cfRequest('POST', `/zones/${zoneId}/pagerules`, {
            targets: [{ target: 'url', constraint: { operator: 'matches', value: `${from}/*` } }],
            actions: [{ id: 'forwarding_url', value: { url: `${to}/$1`, status_code: Number(code) } }],
            status: 'active',
        });
        return res.json(result);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// ── List domains (zones) ─────────────────────────────────────────
router.get('/domains', async (req, res) => {
    if (!CF_TOKEN) return res.json({ result: [], mock: true });
    try {
        const result = await cfRequest('GET', `/zones?account.id=${CF_ACCOUNT_ID}&per_page=50`);
        return res.json(result);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// ── Check NS propagation ─────────────────────────────────────────
router.get('/check-propagation/:zoneId', async (req, res) => {
    if (!CF_TOKEN) return res.json({ status: 'mock_active' });
    try {
        const result = await cfRequest('GET', `/zones/${req.params.zoneId}`);
        return res.json({ status: result.result?.status, ns: result.result?.name_servers });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

export default router;
