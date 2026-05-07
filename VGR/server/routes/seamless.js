/* ═══════════════════════════════════════════════════════════════
   PGSOFT SEAMLESS API — Server-Side Handler
   PGSoft calls these endpoints when players place bets.
   Reference: PGSoft Seamless API v2.4.11

   Endpoints:
   POST /api/seamless/VerifySession
   POST /api/seamless/Cash/Get
   POST /api/seamless/Cash/TransferInOut
   POST /api/seamless/Cash/Adjustment
   POST /api/seamless/Cash/UpdateBetDetail
   ═══════════════════════════════════════════════════════════════ */
import { Router } from 'express';
import md5 from 'md5';
import { supabaseAdmin, pgWhitelistMiddleware } from '../middleware/auth.js';

const router = Router();

// Apply IP whitelist to all seamless routes
router.use(pgWhitelistMiddleware);

// ── Response helpers ─────────────────────────────────────────────
const ok    = (data)    => ({ data, error: null });
const err   = (code, msg) => ({ data: null, error: { code: String(code), message: msg } });
const ts    = ()        => Math.floor(Date.now() / 1000);

// ── MD5 signature validation ─────────────────────────────────────
function validateSignature(params, receivedHash) {
    if (!process.env.PG_SECRET_KEY) return false; // dev mode — skip validation
    // PGSoft: sort all params alphabetically, concat values, append secret, MD5
    const sorted = Object.keys(params).sort().map(k => params[k]).join('');
    const expected = md5(sorted + process.env.PG_SECRET_KEY);
    if (expected !== receivedHash) {
        console.warn('[Seamless] Signature mismatch. Expected:', expected, 'Got:', receivedHash);
        return false;
    }
    return true;
}

function seamlessSignatureMiddleware(req, res, next) {
    const requireSignature = String(process.env.PG_REQUIRE_SIGNATURE || 'true').toLowerCase() !== 'false';
    if (!requireSignature) return next();
    if (!process.env.PG_SECRET_KEY) {
        return res.status(503).json(withReqId(req, err(1200, 'Server signature config missing')));
    }
    const body = req.body || {};
    const receivedHash = body.hash || body.signature || req.headers['x-pg-signature'];
    if (!receivedHash) {
        return res.status(401).json(withReqId(req, err(1204, 'Missing request signature')));
    }
    const { hash, signature, ...payload } = body;
    if (!validateSignature(payload, String(receivedHash))) {
        return res.status(401).json(withReqId(req, err(1204, 'Invalid request signature')));
    }
    next();
}

router.use(seamlessSignatureMiddleware);
// ── Auth check (operator token) ──────────────────────────────────
function validateAuth(body) {
    const { operator_token, secret_key } = body;
    return operator_token === process.env.PG_OPERATOR_TOKEN &&
           secret_key     === process.env.PG_SECRET_KEY;
}

async function upsertSeamlessTransaction(tx) {
    const { error } = await supabaseAdmin
        .from('seamless_transactions')
        .upsert(tx, { onConflict: 'transaction_id', ignoreDuplicates: true });
    return error;
}

// ── Write API log to Supabase ────────────────────────────────────
async function writeApiLog(endpoint, body, response, httpStatus, startTime) {
    const responseTime = Date.now() - startTime + 'ms';
    try {
        await supabaseAdmin.from('seamless_api_logs').insert({
            provider:      'PG_SOFT',
            endpoint,
            method:        'POST',
            http_status:   httpStatus,
            trace_id:      body.trace_id || null,
            response_time: responseTime,
            player:        body.player_name || body.operator_player_session || null,
            status:        httpStatus === 200 && !response.error ? 'OK' : 'Error',
            request_body:  JSON.stringify({ ...body, secret_key: '***' }),
            response_body: JSON.stringify(response),
        });
    } catch (e) { console.error('[ApiLog] write failed:', e.message); }
}

function withReqId(req, payload) {
    return { ...payload, requestId: req.requestId || null };
}

// ══════════════════════════════════════════════════════════════════
//  POST /VerifySession
//  PGSoft sends this to verify the player's session token
// ══════════════════════════════════════════════════════════════════
router.post('/VerifySession', async (req, res) => {
    const start = Date.now();
    const body  = req.body;

    if (!validateAuth(body)) {
        const resp = err(1204, 'Invalid operator token or secret key');
        await writeApiLog('/VerifySession', body, resp, 401, start);
        return res.status(401).json(withReqId(req, resp));
    }

    const { operator_player_session } = body;
    if (!operator_player_session) {
        const resp = err(1034, 'operator_player_session is required');
        await writeApiLog('/VerifySession', body, resp, 400, start);
        return res.status(400).json(withReqId(req, resp));
    }

    // Look up player by session token (stored in members.id or session table)
    const { data: member, error: dbErr } = await supabaseAdmin
        .from('members')
        .select('username, name, status')
        .eq('id', operator_player_session)
        .single();

    if (dbErr || !member) {
        // Fallback: try username as session
        const { data: m2 } = await supabaseAdmin
            .from('members')
            .select('username, name, status')
            .eq('username', operator_player_session)
            .single();

        if (!m2) {
            const resp = err(1302, 'Invalid player session');
            await writeApiLog('/VerifySession', body, resp, 200, start);
            return res.json(withReqId(req, resp));
        }

        if (m2.status !== 'Active') {
            const resp = err(1303, 'Player account is suspended');
            await writeApiLog('/VerifySession', body, resp, 200, start);
            return res.json(withReqId(req, resp));
        }

        const resp = ok({ player_name: m2.username, nickname: m2.name, currency: 'IDR' });
        await writeApiLog('/VerifySession', body, resp, 200, start);
        return res.json(withReqId(req, resp));
    }

    if (member.status !== 'Active') {
        const resp = err(1303, 'Player account is suspended');
        await writeApiLog('/VerifySession', body, resp, 200, start);
        return res.json(withReqId(req, resp));
    }

    const resp = ok({ player_name: member.username, nickname: member.name, currency: 'IDR' });
    await writeApiLog('/VerifySession', body, resp, 200, start);
    return res.json(withReqId(req, resp));
});

// ══════════════════════════════════════════════════════════════════
//  POST /Cash/Get
//  Returns current balance for the player
// ══════════════════════════════════════════════════════════════════
router.post('/Cash/Get', async (req, res) => {
    const start = Date.now();
    const body  = req.body;

    if (!validateAuth(body)) {
        const resp = err(1204, 'Invalid operator token or secret key');
        return res.status(401).json(withReqId(req, resp));
    }

    const { player_name } = body;
    const { data: member } = await supabaseAdmin
        .from('members').select('balance, status').eq('username', player_name).single();

    if (!member) {
        const resp = err(3004, 'Player does not exist');
        await writeApiLog('/Cash/Get', body, resp, 200, start);
        return res.json(withReqId(req, resp));
    }

    // Convert balance: VIGOR stores in IDR units, PGSoft expects base units (÷1000)
    const pgBalance = member.balance / 1000;
    const resp = ok({ currency_code: 'IDR', balance_amount: pgBalance, updated_time: ts() });
    await writeApiLog('/Cash/Get', body, resp, 200, start);
    return res.json(withReqId(req, resp));
});

// ══════════════════════════════════════════════════════════════════
//  POST /Cash/TransferInOut
//  Bet + Payout combined. transfer_amount = win - bet (can be negative)
//  Idempotency: if transaction_id already processed, return cached result
// ══════════════════════════════════════════════════════════════════
router.post('/Cash/TransferInOut', async (req, res) => {
    const start = Date.now();
    const body  = req.body;

    if (!validateAuth(body)) {
        const resp = err(1204, 'Invalid operator token or secret key');
        return res.status(401).json(withReqId(req, resp));
    }

    const {
        player_name, game_id, parent_bet_id, bet_id, transaction_id,
        bet_amount, win_amount, transfer_amount, real_transfer_amount,
        wallet_type = 'C', is_end_round, provider_game_id,
    } = body;
    if (!transaction_id || !player_name) {
        const resp = err(1034, 'transaction_id and player_name are required');
        await writeApiLog('/Cash/TransferInOut', body, resp, 400, start);
        return res.status(400).json(withReqId(req, resp));
    }

    // ── Idempotency check ──────────────────────────────────────
    const { data: existing } = await supabaseAdmin
        .from('seamless_transactions')
        .select('balance_after, real_transfer_amount, create_time')
        .eq('transaction_id', transaction_id)
        .single();

    if (existing) {
        const resp = ok({
            currency_code:        'IDR',
            balance_amount:       existing.balance_after / 1000,
            updated_time:         new Date(existing.create_time).getTime() / 1000,
            real_transfer_amount: existing.real_transfer_amount,
        });
        await writeApiLog('/Cash/TransferInOut', body, resp, 200, start);
        return res.json(withReqId(req, resp));
    }

    // ── Get player ────────────────────────────────────────────
    const { data: member } = await supabaseAdmin
        .from('members').select('id, balance, status, company').eq('username', player_name).single();

    if (!member) {
        const resp = err(3004, 'Player does not exist');
        await writeApiLog('/Cash/TransferInOut', body, resp, 200, start);
        return res.json(withReqId(req, resp));
    }

    const tAmt  = parseFloat(transfer_amount) * 1000;  // convert to IDR units
    const btAmt = parseFloat(bet_amount);
    const wnAmt = parseFloat(win_amount);

    // ── Insufficient balance check (only for real money, not free games) ──
    if (tAmt < 0 && member.balance + (wnAmt * 1000) < (btAmt * 1000) && wallet_type !== 'G') {
        const resp = err(3202, 'Not enough cash balance to bet');
        await writeApiLog('/Cash/TransferInOut', body, resp, 200, start);
        return res.json(withReqId(req, resp));
    }

    const oldBalance = member.balance;
    const newBalance = oldBalance + tAmt;

    // ── Atomic: update balance + insert transaction ────────────
    const { error: balErr } = await supabaseAdmin
        .from('members')
        .update({ balance: newBalance })
        .eq('id', member.id)
        .eq('balance', oldBalance);

    if (balErr) {
        const resp = err(1200, 'Balance update failed');
        await writeApiLog('/Cash/TransferInOut', body, resp, 200, start);
        return res.json(withReqId(req, resp));
    }

    // ── Get game name ─────────────────────────────────────────
    const { data: game } = await supabaseAdmin
        .from('seamless_games').select('name').eq('id', game_id).single();

    // ── Insert transaction record ─────────────────────────────
    const txId = 'PGT' + Date.now() + Math.floor(Math.random() * 1000);
    const txPayload = {
        id:                   txId,
        trace_id:             body.trace_id || null,
        player:               player_name,
        company:              member.company,
        provider:             'PG_SOFT',
        game_id:              String(game_id),
        game_name:            game?.name || 'Unknown Game',
        parent_bet_id:        String(parent_bet_id),
        bet_id:               String(bet_id),
        transaction_id:       String(transaction_id),
        bet_amount:           btAmt,
        win_amount:           wnAmt,
        transfer_amount:      parseFloat(transfer_amount),
        real_transfer_amount: parseFloat(real_transfer_amount || tAmt),
        transaction_type:     'BetPayout',
        wallet_type:          wallet_type,
        currency:             'IDR',
        is_end_round:         is_end_round === '1' || is_end_round === true,
        is_feature:           wallet_type === 'G',
        status:               'Completed',
        balance_after:        newBalance,
        create_time:          new Date().toISOString(),
    };
    const txErr = await upsertSeamlessTransaction(txPayload);
    if (txErr) {
        // Best-effort rollback if tx write fails after balance update.
        await supabaseAdmin.from('members').update({ balance: oldBalance }).eq('id', member.id).eq('balance', newBalance);
        const resp = err(1200, 'Transaction write failed');
        await writeApiLog('/Cash/TransferInOut', body, resp, 200, start);
        return res.json(resp);
    }

    const resp = ok({
        currency_code:        'IDR',
        balance_amount:       newBalance / 1000,
        updated_time:         ts(),
        real_transfer_amount: parseFloat(real_transfer_amount || tAmt),
    });
    await writeApiLog('/Cash/TransferInOut', body, resp, 200, start);
    return res.json(withReqId(req, resp));
});

// ══════════════════════════════════════════════════════════════════
//  POST /Cash/Adjustment
//  Manual balance adjustment (cancelled bets, corrections)
// ══════════════════════════════════════════════════════════════════
router.post('/Cash/Adjustment', async (req, res) => {
    const start = Date.now();
    const body  = req.body;

    if (!validateAuth(body)) return res.status(401).json(withReqId(req, err(1204, 'Invalid auth')));

    const { player_name, transfer_amount, real_transfer_amount, adjustment_transaction_id, transaction_type } = body;
    if (!adjustment_transaction_id || !player_name) {
        const resp = err(1034, 'adjustment_transaction_id and player_name are required');
        await writeApiLog('/Cash/Adjustment', body, resp, 400, start);
        return res.status(400).json(withReqId(req, resp));
    }

    // Idempotency
    const { data: existing } = await supabaseAdmin
        .from('seamless_transactions')
        .select('balance_after, real_transfer_amount, create_time')
        .eq('transaction_id', adjustment_transaction_id).single();

    if (existing) {
        const tAmtEx = parseFloat(transfer_amount) * 1000;
        return res.json(withReqId(req, ok({
            adjust_amount:        Math.abs(parseFloat(transfer_amount)),
            balance_before:       (existing.balance_after - tAmtEx) / 1000,
            balance_after:        existing.balance_after / 1000,
            updated_time:         new Date(existing.create_time).getTime() / 1000,
            real_transfer_amount: existing.real_transfer_amount,
        })));
    }

    const { data: member } = await supabaseAdmin
        .from('members').select('id, balance, company').eq('username', player_name).single();

    if (!member) return res.json(withReqId(req, err(3004, 'Player does not exist')));

    const tAmt = parseFloat(transfer_amount) * 1000;
    if (tAmt < 0 && member.balance + tAmt < 0) {
        const resp = err(3202, 'Not enough cash balance');
        await writeApiLog('/Cash/Adjustment', body, resp, 200, start);
        return res.json(withReqId(req, resp));
    }

    const balBefore  = member.balance;
    const newBalance = balBefore + tAmt;

    const { error: updateErr } = await supabaseAdmin
        .from('members')
        .update({ balance: newBalance })
        .eq('id', member.id)
        .eq('balance', balBefore);
    if (updateErr) {
        const resp = err(1200, 'Balance update failed');
        await writeApiLog('/Cash/Adjustment', body, resp, 200, start);
        return res.json(withReqId(req, resp));
    }

    const txErr = await upsertSeamlessTransaction({
        id:                   'PGA' + Date.now(),
        player:               player_name,
        company:              member.company,
        provider:             'PG_SOFT',
        game_id:              '-',
        game_name:            'Adjustment',
        transaction_id:       String(adjustment_transaction_id),
        bet_amount:           0,
        win_amount:           0,
        transfer_amount:      parseFloat(transfer_amount),
        real_transfer_amount: parseFloat(real_transfer_amount || tAmt),
        transaction_type:     'Adjustment ' + (transaction_type || ''),
        wallet_type:          'C',
        currency:             'IDR',
        is_end_round:         true,
        status:               'Completed',
        balance_after:        newBalance,
        create_time:          new Date().toISOString(),
    });
    if (txErr) {
        await supabaseAdmin.from('members').update({ balance: balBefore }).eq('id', member.id).eq('balance', newBalance);
        const resp = err(1200, 'Transaction write failed');
        await writeApiLog('/Cash/Adjustment', body, resp, 200, start);
        return res.json(withReqId(req, resp));
    }

    const resp = ok({
        adjust_amount:        Math.abs(parseFloat(transfer_amount)),
        balance_before:       balBefore / 1000,
        balance_after:        newBalance / 1000,
        updated_time:         ts(),
        real_transfer_amount: parseFloat(real_transfer_amount || tAmt),
    });
    await writeApiLog('/Cash/Adjustment', body, resp, 200, start);
    return res.json(withReqId(req, resp));
});

// ══════════════════════════════════════════════════════════════════
//  POST /Cash/UpdateBetDetail
//  Called when a round ends — just log it, no balance change
// ══════════════════════════════════════════════════════════════════
router.post('/Cash/UpdateBetDetail', async (req, res) => {
    const start = Date.now();
    const body  = req.body;
    if (!validateAuth(body)) return res.status(401).json(withReqId(req, err(1204, 'Invalid auth')));
    const resp = ok({ is_success: true });
    await writeApiLog('/Cash/UpdateBetDetail', body, resp, 200, start);
    return res.json(withReqId(req, resp));
});

export default router;



