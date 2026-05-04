/* ═══════════════════════════════════════════════════════════════
   PAYMENT GATEWAY API — Frontend Integration
   Unopay / Coin2Pay / Sawala
   All calls go through the backend server to keep secrets safe.
   ═══════════════════════════════════════════════════════════════ */
import { STATE } from '../core/state.js';

const API_BASE = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:3000';

// ── Generic API call through backend ────────────────────────────
async function callServer(path, payload) {
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return await res.json();
    } catch (e) {
        return { error: e.message };
    }
}

// ══════════════════════════════════════════════════════════════════
//  UNOPAY
// ══════════════════════════════════════════════════════════════════
export const UNOPAY_METHODS = [
    { id: 'va_bca',  label: 'VA BCA',  type: 'va',     icon: 'fa-building-columns' },
    { id: 'va_bni',  label: 'VA BNI',  type: 'va',     icon: 'fa-building-columns' },
    { id: 'va_bri',  label: 'VA BRI',  type: 'va',     icon: 'fa-building-columns' },
    { id: 'qris',    label: 'QRIS',    type: 'qr',     icon: 'fa-qrcode' },
    { id: 'gopay',   label: 'GoPay',   type: 'ewallet',icon: 'fa-wallet' },
    { id: 'ovo',     label: 'OVO',     type: 'ewallet',icon: 'fa-wallet' },
    { id: 'dana',    label: 'DANA',    type: 'ewallet',icon: 'fa-wallet' },
];

/**
 * Create Unopay payment (deposit)
 * Returns: { paymentCode, vaNumber, qrCode, expiredAt } or error
 */
export async function createUnopayDeposit({ member, amount, method, depositId }) {
    const enabled = import.meta.env.VITE_UNOPAY_API_KEY;
    if (!enabled || enabled === 'your_unopay_api_key') {
        // Demo mode — return mock response
        return {
            data: {
                reference_id:  depositId,
                payment_method: method,
                amount,
                va_number:     method.startsWith('va') ? '0882' + Math.floor(Math.random() * 1e10) : null,
                qr_code:       method === 'qris' ? 'data:image/png;base64,MOCK_QR' : null,
                expired_at:    new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
                status:        'PENDING',
            },
        };
    }
    return await callServer('/api/payments/unopay/create', {
        member_id:    member,
        amount,
        method,
        reference_id: depositId,
        description:  `Deposit ${depositId}`,
        callback_url: `${API_BASE}/api/webhooks/unopay`,
    });
}

/**
 * Check Unopay payment status
 */
export async function checkUnopayStatus(referenceId) {
    return await callServer('/api/payments/unopay/status', { reference_id: referenceId });
}

// ══════════════════════════════════════════════════════════════════
//  COIN2PAY
// ══════════════════════════════════════════════════════════════════
export const CRYPTO_LIST = [
    { id: 'BTC',  label: 'Bitcoin',  symbol: 'BTC',  icon: '₿' },
    { id: 'ETH',  label: 'Ethereum', symbol: 'ETH',  icon: 'Ξ' },
    { id: 'USDT', label: 'Tether',   symbol: 'USDT', icon: '₮' },
    { id: 'BNB',  label: 'BNB',      symbol: 'BNB',  icon: 'BNB' },
    { id: 'LTC',  label: 'Litecoin', symbol: 'LTC',  icon: 'Ł' },
];

/**
 * Create Coin2Pay crypto deposit
 */
export async function createCoin2PayDeposit({ member, amountIdr, crypto, depositId }) {
    const enabled = import.meta.env.VITE_COIN2PAY_API_KEY;
    if (!enabled || enabled === 'your_coin2pay_api_key') {
        const rates = { BTC: 950000000, ETH: 45000000, USDT: 15800, BNB: 6000000, LTC: 1200000 };
        const cryptoAmt = (amountIdr / (rates[crypto] || 15800)).toFixed(8);
        return {
            data: {
                order_id:      depositId,
                crypto_type:   crypto,
                crypto_amount: cryptoAmt,
                idr_amount:    amountIdr,
                wallet_address: '1Mock' + crypto + Math.random().toString(36).slice(2, 18).toUpperCase(),
                qr_code:       'data:image/png;base64,MOCK_QR',
                expired_at:    new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                status:        'WAITING',
            },
        };
    }
    return await callServer('/api/payments/coin2pay/create', {
        order_id:     depositId,
        amount_idr:   amountIdr,
        crypto_type:  crypto,
        member_id:    member,
        callback_url: `${API_BASE}/api/webhooks/coin2pay`,
        return_url:   window.location.origin,
    });
}

/**
 * Check Coin2Pay transaction status
 */
export async function checkCoin2PayStatus(orderId) {
    return await callServer('/api/payments/coin2pay/status', { order_id: orderId });
}

// ══════════════════════════════════════════════════════════════════
//  SAWALA
// ══════════════════════════════════════════════════════════════════

/**
 * Create Sawala payment
 */
export async function createSawalaDeposit({ member, amount, depositId }) {
    const enabled = import.meta.env.VITE_SAWALA_TOKEN;
    if (!enabled || enabled === 'your_sawala_token') {
        return {
            data: {
                transaction_id: depositId,
                payment_url:    'https://pay.sawala.id/mock/' + depositId,
                amount,
                status:         'pending',
                expired_at:     new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            },
        };
    }
    return await callServer('/api/payments/sawala/create', {
        transaction_id: depositId,
        amount,
        member_id:      member,
        callback_url:   `${API_BASE}/api/webhooks/sawala`,
        description:    `Deposit ${depositId}`,
    });
}

// ══════════════════════════════════════════════════════════════════
//  UNIFIED CREATE DEPOSIT
//  Call this from the deposit form — auto-routes to correct gateway
// ══════════════════════════════════════════════════════════════════
export async function createPaymentDeposit({ member, amount, method, depositId }) {
    if (method === 'sawala') {
        return createSawalaDeposit({ member, amount, depositId });
    }
    if (CRYPTO_LIST.find(c => c.id === method)) {
        return createCoin2PayDeposit({ member, amountIdr: amount, crypto: method, depositId });
    }
    // Default: Unopay
    return createUnopayDeposit({ member, amount, method, depositId });
}

// Expose for inline onclick usage
window.paymentAPI = {
    createPaymentDeposit, createUnopayDeposit, checkUnopayStatus,
    createCoin2PayDeposit, checkCoin2PayStatus, createSawalaDeposit,
    UNOPAY_METHODS, CRYPTO_LIST,
};
