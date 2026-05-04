/* ─── SERVER MIDDLEWARE ─── */
import { createClient } from '@supabase/supabase-js';

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
    const clientIp  = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;

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
        const [range, bits] = cidr.split('/');
        const mask = ~(0xffffffff >>> parseInt(bits));
        return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
    } catch { return false; }
}

function ipToInt(ip) {
    return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0;
}
