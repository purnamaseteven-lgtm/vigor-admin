/* ═══════════════════════════════════════════════════════════════
   PAYMENT GATEWAY ROUTES
   - Unopay (VA BCA/BNI/BRI + QRIS + Gopay/OVO/Dana)
   - Coin2Pay (BTC/ETH/USDT/BNB/LTC)
   - Sawala (alternative payment)
   ═══════════════════════════════════════════════════════════════ */
import { Router } from 'express';
import { createHmac } from 'crypto';
import { supabaseAdmin } from '../middleware/auth.js';
import fetch from 'node-fetch';

const router = Router();

// ══════════════════════════════════════════════════════════════════
//  UNOPAY — Webhook receiver
//  Callback IP: whitelist Unopay server IPs in production
//  POST /api/webhooks/unopay
// ══════════════════════════════════════════════════════════════════
router.post('/unopay', async (req, res) => {
    try {
        const raw  = req.body;
        const body = typeof raw === 'string' ? JSON.parse(raw) : raw;

        // Verify signature
        const sig      = req.headers['x-unopay-signature'];
        const expected = createHmac('sha256', process.env.UNOPAY_SECRET || '')
            .update(typeof raw === 'string' ? raw : JSON.stringify(raw))
            .digest('hex');

        if (process.env.NODE_ENV === 'production' && sig !== expected) {
            console.warn('[Unopay] Invalid signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const { reference_id, status, amount, payment_method, customer_id } = body;

        if (status === 'PAID' || status === 'SUCCESS') {
            // Find the deposit record by payment reference
            const { data: dep } = await supabaseAdmin
                .from('deposits')
                .select('id, member, amount, company')
                .eq('payment_ref', reference_id)
                .eq('status', 'Pending')
                .single();

            if (dep) {
                const now = new Date().toLocaleString('id-ID');
                // Approve deposit
                await supabaseAdmin.from('deposits').update({
                    status: 'Approved', processed_by: 'unopay_auto', date: now,
                }).eq('id', dep.id);

                // Credit member balance
                const { data: member } = await supabaseAdmin
                    .from('members').select('id, balance').eq('username', dep.member).single();
                if (member) {
                    await supabaseAdmin.from('members')
                        .update({ balance: member.balance + dep.amount }).eq('id', member.id);
                }

                // Log it
                await supabaseAdmin.from('admin_logs').insert({
                    actor: 'unopay_auto', action: 'Auto Approve Deposit',
                    target: dep.id, description: `Unopay callback — ${payment_method} — Rp ${dep.amount}`,
                    company: dep.company,
                });

                console.log(`[Unopay] Deposit approved: ${dep.id} — Rp ${dep.amount}`);
            }
        }

        res.json({ status: 'received' });
    } catch (e) {
        console.error('[Unopay webhook]', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════════════════════════
//  COIN2PAY — Webhook receiver
//  POST /api/webhooks/coin2pay
// ══════════════════════════════════════════════════════════════════
router.post('/coin2pay', async (req, res) => {
    try {
        const raw  = req.body;
        const body = typeof raw === 'string' ? JSON.parse(raw) : raw;

        const { order_id, status, amount_idr, crypto_type, tx_hash } = body;

        // Verify hash
        const sig      = req.headers['x-c2p-signature'];
        const expected = createHmac('sha256', process.env.COIN2PAY_API_KEY || '')
            .update(order_id + status + (process.env.COIN2PAY_API_KEY || ''))
            .digest('hex');

        if (process.env.NODE_ENV === 'production' && sig !== expected) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        if (status === 'CONFIRMED') {
            const { data: dep } = await supabaseAdmin
                .from('deposits')
                .select('id, member, amount, company')
                .eq('payment_ref', order_id)
                .eq('status', 'Pending')
                .single();

            if (dep) {
                const now = new Date().toLocaleString('id-ID');
                await supabaseAdmin.from('deposits').update({
                    status: 'Approved', processed_by: 'coin2pay_auto',
                    date: now, payment_ref: tx_hash || order_id,
                }).eq('id', dep.id);

                const { data: member } = await supabaseAdmin
                    .from('members').select('id, balance').eq('username', dep.member).single();
                if (member) {
                    await supabaseAdmin.from('members')
                        .update({ balance: member.balance + dep.amount }).eq('id', member.id);
                }

                await supabaseAdmin.from('admin_logs').insert({
                    actor: 'coin2pay_auto', action: 'Auto Approve Deposit',
                    target: dep.id,
                    description: `Coin2Pay callback — ${crypto_type} — Rp ${amount_idr || dep.amount}`,
                    company: dep.company,
                });
            }
        }

        res.json({ status: 'received' });
    } catch (e) {
        console.error('[Coin2Pay webhook]', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ══════════════════════════════════════════════════════════════════
//  SAWALA — Webhook receiver
//  Callback IP: 103.21.44.0
//  POST /api/webhooks/sawala
// ══════════════════════════════════════════════════════════════════
router.post('/sawala', async (req, res) => {
    try {
        // Validate Sawala callback IP
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
        const sawalaIp = process.env.SAWALA_CALLBACK_IP || '103.21.44.0';
        if (process.env.NODE_ENV === 'production' && clientIp !== sawalaIp) {
            return res.status(403).json({ error: 'IP not allowed' });
        }

        const raw  = req.body;
        const body = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const { transaction_id, status, amount, member_id } = body;

        if (status === 'success' || status === 'SUCCESS') {
            const { data: dep } = await supabaseAdmin
                .from('deposits')
                .select('id, member, amount, company')
                .eq('payment_ref', transaction_id)
                .eq('status', 'Pending')
                .single();

            if (dep) {
                const now = new Date().toLocaleString('id-ID');
                await supabaseAdmin.from('deposits').update({
                    status: 'Approved', processed_by: 'sawala_auto', date: now,
                }).eq('id', dep.id);

                const { data: member } = await supabaseAdmin
                    .from('members').select('id, balance').eq('username', dep.member).single();
                if (member) {
                    await supabaseAdmin.from('members')
                        .update({ balance: member.balance + dep.amount }).eq('id', member.id);
                }

                await supabaseAdmin.from('admin_logs').insert({
                    actor: 'sawala_auto', action: 'Auto Approve Deposit',
                    target: dep.id, description: `Sawala callback — Rp ${amount || dep.amount}`,
                    company: dep.company,
                });
            }
        }

        res.json({ status: 'ok' });
    } catch (e) {
        console.error('[Sawala webhook]', e.message);
        res.status(500).json({ error: e.message });
    }
});

export default router;
