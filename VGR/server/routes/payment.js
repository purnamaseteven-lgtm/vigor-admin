import { Router } from 'express';
import { createHmac } from 'crypto';
import { supabaseAdmin } from '../middleware/auth.js';

const router = Router();
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function requireAdminSession(req, res, next) {
    try {
        const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
        if (!token) return res.status(401).json({ error: 'Unauthorized: missing bearer token' });
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                apikey: SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${token}`,
            },
        });
        const user = await userRes.json().catch(() => ({}));
        if (!userRes.ok || !user?.id) return res.status(401).json({ error: 'Unauthorized: invalid session' });

        const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_profiles?id=eq.${encodeURIComponent(user.id)}&select=id,status`, {
            headers: {
                apikey: SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
        });
        const profiles = await profileRes.json().catch(() => []);
        if (!profileRes.ok || profiles[0]?.status !== 'Active') {
            return res.status(403).json({ error: 'Forbidden: active admin profile required' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

function parseWebhookBody(raw) {
    if (Buffer.isBuffer(raw)) return JSON.parse(raw.toString('utf8'));
    if (typeof raw === 'string') return JSON.parse(raw);
    return raw || {};
}

function rawBodyString(raw) {
    if (Buffer.isBuffer(raw)) return raw.toString('utf8');
    if (typeof raw === 'string') return raw;
    return JSON.stringify(raw || {});
}

async function approveDepositByPaymentRef(paymentRef, processedBy, replacementRef = null) {
    const { data: dep, error } = await supabaseAdmin
        .from('deposits')
        .select('id, amount')
        .eq('payment_ref', paymentRef)
        .eq('status', 'Pending')
        .single();

    if (error || !dep) return { approved: false, reason: 'not_found_or_processed' };

    const { data, error: rpcError } = await supabaseAdmin.rpc('approve_deposit', {
        p_deposit_id: dep.id,
        p_processed_by: processedBy,
    });

    if (rpcError || data?.ok === false) {
        return { approved: false, reason: rpcError?.message || data?.message || data?.code || 'rpc_failed' };
    }

    if (replacementRef && replacementRef !== paymentRef) {
        await supabaseAdmin.from('deposits').update({ payment_ref: replacementRef }).eq('id', dep.id);
    }

    return { approved: true, depositId: dep.id, amount: dep.amount };
}

function requireConfig(res, pairs) {
    const missing = pairs.filter(([key, value]) => !value).map(([key]) => key);
    if (missing.length) {
        res.status(503).json({ error: `Payment provider not configured: ${missing.join(', ')}` });
        return false;
    }
    return true;
}

async function providerPost(url, apiKey, body, extraHeaders = {}) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            ...extraHeaders,
        },
        body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
}

router.post('/unopay/create', requireAdminSession, async (req, res) => {
    const apiUrl = process.env.UNOPAY_API_URL;
    const apiKey = process.env.UNOPAY_API_KEY;
    if (!requireConfig(res, [['UNOPAY_API_URL', apiUrl], ['UNOPAY_API_KEY', apiKey]])) return;

    try {
        const { response, data } = await providerPost(`${apiUrl.replace(/\/$/, '')}/payments`, apiKey, req.body);
        res.status(response.status).json(data);
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
});

router.post('/unopay/status', requireAdminSession, async (req, res) => {
    const apiUrl = process.env.UNOPAY_API_URL;
    const apiKey = process.env.UNOPAY_API_KEY;
    if (!requireConfig(res, [['UNOPAY_API_URL', apiUrl], ['UNOPAY_API_KEY', apiKey]])) return;

    try {
        const { response, data } = await providerPost(`${apiUrl.replace(/\/$/, '')}/payments/status`, apiKey, req.body);
        res.status(response.status).json(data);
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
});

router.post('/coin2pay/create', requireAdminSession, async (req, res) => {
    const apiUrl = process.env.COIN2PAY_API_URL;
    const apiKey = process.env.COIN2PAY_API_KEY;
    if (!requireConfig(res, [['COIN2PAY_API_URL', apiUrl], ['COIN2PAY_API_KEY', apiKey]])) return;

    try {
        const { response, data } = await providerPost(`${apiUrl.replace(/\/$/, '')}/orders`, apiKey, req.body, { 'x-api-key': apiKey });
        res.status(response.status).json(data);
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
});

router.post('/coin2pay/status', requireAdminSession, async (req, res) => {
    const apiUrl = process.env.COIN2PAY_API_URL;
    const apiKey = process.env.COIN2PAY_API_KEY;
    if (!requireConfig(res, [['COIN2PAY_API_URL', apiUrl], ['COIN2PAY_API_KEY', apiKey]])) return;

    try {
        const { response, data } = await providerPost(`${apiUrl.replace(/\/$/, '')}/orders/status`, apiKey, req.body, { 'x-api-key': apiKey });
        res.status(response.status).json(data);
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
});

router.post('/sawala/create', requireAdminSession, async (req, res) => {
    const apiUrl = process.env.SAWALA_API_URL;
    const token = process.env.SAWALA_TOKEN;
    if (!requireConfig(res, [['SAWALA_API_URL', apiUrl], ['SAWALA_TOKEN', token]])) return;

    try {
        const { response, data } = await providerPost(`${apiUrl.replace(/\/$/, '')}/transactions`, token, req.body);
        res.status(response.status).json(data);
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
});

router.post('/unopay', async (req, res) => {
    try {
        const raw = req.body;
        const body = parseWebhookBody(raw);
        const sig = req.headers['x-unopay-signature'];
        const expected = createHmac('sha256', process.env.UNOPAY_SECRET || '')
            .update(rawBodyString(raw))
            .digest('hex');

        if (process.env.NODE_ENV === 'production' && sig !== expected) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const { reference_id, status } = body;
        if ((status === 'PAID' || status === 'SUCCESS') && reference_id) {
            await approveDepositByPaymentRef(reference_id, 'unopay_auto');
        }

        res.json({ status: 'received' });
    } catch (e) {
        console.error('[Unopay webhook]', e.message);
        res.status(500).json({ error: e.message });
    }
});

router.post('/coin2pay', async (req, res) => {
    try {
        const body = parseWebhookBody(req.body);
        const { order_id, status, tx_hash } = body;
        const sig = req.headers['x-c2p-signature'];
        const expected = createHmac('sha256', process.env.COIN2PAY_API_KEY || '')
            .update(order_id + status + (process.env.COIN2PAY_API_KEY || ''))
            .digest('hex');

        if (process.env.NODE_ENV === 'production' && sig !== expected) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        if (status === 'CONFIRMED' && order_id) {
            await approveDepositByPaymentRef(order_id, 'coin2pay_auto', tx_hash || order_id);
        }

        res.json({ status: 'received' });
    } catch (e) {
        console.error('[Coin2Pay webhook]', e.message);
        res.status(500).json({ error: e.message });
    }
});

router.post('/sawala', async (req, res) => {
    try {
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
        const sawalaIp = process.env.SAWALA_CALLBACK_IP || '103.21.44.0';
        if (process.env.NODE_ENV === 'production' && clientIp !== sawalaIp) {
            return res.status(403).json({ error: 'IP not allowed' });
        }

        const body = parseWebhookBody(req.body);
        const { transaction_id, status } = body;
        if ((status === 'success' || status === 'SUCCESS') && transaction_id) {
            await approveDepositByPaymentRef(transaction_id, 'sawala_auto');
        }

        res.json({ status: 'ok' });
    } catch (e) {
        console.error('[Sawala webhook]', e.message);
        res.status(500).json({ error: e.message });
    }
});

export default router;
