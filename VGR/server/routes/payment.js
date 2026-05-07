import { Router } from 'express';
import { supabaseAdmin } from '../middleware/auth.js';
import { requireActiveAdmin, requireRole } from '../middleware/session.js';
import {
    parseWebhookBody,
    validateRequiredFields,
    validateUnopaySignature,
    validateCoin2PaySignature,
    validateSawalaIp,
} from '../lib/webhook-validation.js';

const router = Router();
const requirePaymentOps = requireRole('SuperAdmin', 'Whitelabel');

function normalizeIp(ip) {
    const raw = String(ip || '').trim();
    if (!raw) return '';
    if (raw === '::1') return '127.0.0.1';
    if (raw.startsWith('::ffff:')) return raw.slice(7);
    return raw;
}

function reqMeta(req) {
    return {
        requestId: req.requestId || null,
        route: req.originalUrl || req.path,
        method: req.method,
    };
}

function badRequest(res, req, message) {
    return res.status(400).json({ error: message, requestId: req.requestId || null });
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

router.post('/unopay/create', requirePaymentOps, async (req, res) => {
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

router.post('/unopay/status', requirePaymentOps, async (req, res) => {
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

router.post('/coin2pay/create', requirePaymentOps, async (req, res) => {
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

router.post('/coin2pay/status', requirePaymentOps, async (req, res) => {
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

router.post('/sawala/create', requirePaymentOps, async (req, res) => {
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
        const prod = process.env.NODE_ENV === 'production';
        if (!validateUnopaySignature(raw, sig, process.env.UNOPAY_SECRET || '', prod)) {
            console.warn(JSON.stringify({ level: 'warn', event: 'unopay_invalid_signature', ...reqMeta(req) }));
            return res.status(401).json({ error: 'Invalid signature', requestId: req.requestId || null });
        }

        const { reference_id, status } = body;
        const required = validateRequiredFields(body, ['reference_id', 'status']);
        if (!required.ok) {
            return badRequest(res, req, `${required.missing.join(', ')} are required`);
        }
        if ((status === 'PAID' || status === 'SUCCESS') && reference_id) {
            await approveDepositByPaymentRef(reference_id, 'unopay_auto');
        }

        res.json({ status: 'received', requestId: req.requestId || null });
    } catch (e) {
        console.error(JSON.stringify({ level: 'error', event: 'unopay_webhook_error', message: e.message, ...reqMeta(req) }));
        res.status(500).json({ error: e.message, requestId: req.requestId || null });
    }
});

router.post('/coin2pay', async (req, res) => {
    try {
        const body = parseWebhookBody(req.body);
        const { order_id, status, tx_hash } = body;
        const required = validateRequiredFields(body, ['order_id', 'status']);
        if (!required.ok) {
            return badRequest(res, req, `${required.missing.join(', ')} are required`);
        }
        const sig = req.headers['x-c2p-signature'];
        const prod = process.env.NODE_ENV === 'production';
        if (!validateCoin2PaySignature(order_id, status, sig, process.env.COIN2PAY_API_KEY || '', prod)) {
            console.warn(JSON.stringify({ level: 'warn', event: 'coin2pay_invalid_signature', ...reqMeta(req) }));
            return res.status(401).json({ error: 'Invalid signature', requestId: req.requestId || null });
        }

        if (status === 'CONFIRMED' && order_id) {
            await approveDepositByPaymentRef(order_id, 'coin2pay_auto', tx_hash || order_id);
        }

        res.json({ status: 'received', requestId: req.requestId || null });
    } catch (e) {
        console.error(JSON.stringify({ level: 'error', event: 'coin2pay_webhook_error', message: e.message, ...reqMeta(req) }));
        res.status(500).json({ error: e.message, requestId: req.requestId || null });
    }
});

router.post('/sawala', async (req, res) => {
    try {
        const clientIp = normalizeIp(req.ip || req.socket.remoteAddress);
        const sawalaIp = process.env.SAWALA_CALLBACK_IP || '103.21.44.0';
        const prod = process.env.NODE_ENV === 'production';
        if (!validateSawalaIp(clientIp, sawalaIp, prod)) {
            console.warn(JSON.stringify({ level: 'warn', event: 'sawala_invalid_ip', clientIp, expectedIp: sawalaIp, ...reqMeta(req) }));
            return res.status(403).json({ error: 'IP not allowed', requestId: req.requestId || null });
        }

        const body = parseWebhookBody(req.body);
        const { transaction_id, status } = body;
        const required = validateRequiredFields(body, ['transaction_id', 'status']);
        if (!required.ok) {
            return badRequest(res, req, `${required.missing.join(', ')} are required`);
        }
        if ((status === 'success' || status === 'SUCCESS') && transaction_id) {
            await approveDepositByPaymentRef(transaction_id, 'sawala_auto');
        }

        res.json({ status: 'ok', requestId: req.requestId || null });
    } catch (e) {
        console.error(JSON.stringify({ level: 'error', event: 'sawala_webhook_error', message: e.message, ...reqMeta(req) }));
        res.status(500).json({ error: e.message, requestId: req.requestId || null });
    }
});

export default router;
