/* ─── SERVER MIDDLEWARE ─── */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

loadEnv();
loadEnv({ path: '../.env.server', override: false });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the backend server');
}

// Supabase admin client (service_role bypasses RLS — server ops only!)
export const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * IP whitelist middleware — for PGSoft seamless endpoint
 */
export function pgWhitelistMiddleware(req, res, next) {
    const whitelist = (process.env.PG_WHITELISTED_IPS || '').split(',').map(ip => ip.trim());
    const clientIp  = normalizeIp(req.ip || req.socket.remoteAddress || '');

    if (!whitelist.length || whitelist.includes('*')) return next(); // dev mode

    const allowed = whitelist.some(range => {
        if (range.includes('/')) return ipInCIDR(clientIp, range);
        return clientIp === range;
    });

    if (!allowed) {
        console.warn(`[Seamless] Blocked IP: ${clientIp}`);
        return res.status(403).json({ error: 'IP not whitelisted', ip: clientIp });
    }
    next();
}

function ipInCIDR(ip, cidr) {
    try {
        const normalizedIp = normalizeIp(ip);
        const [range, bits] = cidr.split('/');
        const normalizedRange = normalizeIp(range);
        if (!normalizedIp || !normalizedRange) return false;
        if (normalizedIp.includes(':') || normalizedRange.includes(':')) return false; // IPv6 CIDR unsupported in this helper
        const mask = ~(0xffffffff >>> parseInt(bits, 10));
        return (ipToInt(normalizedIp) & mask) === (ipToInt(normalizedRange) & mask);
    } catch { return false; }
}

function normalizeIp(ip) {
    const raw = String(ip || '').trim();
    if (!raw) return '';
    if (raw === '::1') return '127.0.0.1';
    if (raw.startsWith('::ffff:')) return raw.slice(7);
    return raw;
}

function ipToInt(ip) {
    return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}
