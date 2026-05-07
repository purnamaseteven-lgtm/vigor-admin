import { config as loadEnv } from 'dotenv';

loadEnv();
loadEnv({ path: '../.env.server', override: false });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function normalizeRole(role) {
    return String(role || '').trim().toLowerCase();
}

function resolveTestBypass(req) {
    const enabled = process.env.NODE_ENV === 'test' && String(process.env.AUTH_TEST_BYPASS || '').toLowerCase() === 'true';
    if (!enabled) return null;
    const role = String(req.headers['x-test-role'] || 'SuperAdmin');
    const status = String(req.headers['x-test-status'] || 'Active');
    return {
        user: { id: 'test-user', email: 'test@vigor.internal' },
        profile: {
            id: 'test-user',
            username: 'test_admin',
            role,
            status,
            company: 'test-company',
            shop: null,
        },
    };
}

async function resolveAdminProfileFromToken(token) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return { error: { status: 503, message: 'Supabase not configured on server' } };
    }
    if (!token) {
        return { error: { status: 401, message: 'Unauthorized: missing bearer token' } };
    }

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${token}`,
        },
    });
    const user = await userRes.json().catch(() => ({}));
    if (!userRes.ok || !user?.id) {
        return { error: { status: 401, message: 'Unauthorized: invalid session' } };
    }

    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_profiles?id=eq.${encodeURIComponent(user.id)}&select=id,username,role,status,company,shop`, {
        headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
    });
    const profiles = await profileRes.json().catch(() => []);
    const profile = profiles?.[0];
    if (!profileRes.ok || !profile || profile.status !== 'Active') {
        return { error: { status: 403, message: 'Forbidden: active admin profile required' } };
    }
    return { user, profile };
}

export async function requireActiveAdmin(req, res, next) {
    try {
        const bypass = resolveTestBypass(req);
        if (bypass) {
            req.adminUser = bypass.user;
            req.adminProfile = bypass.profile;
            return next();
        }
        const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
        const resolved = await resolveAdminProfileFromToken(token);
        if (resolved.error) {
            return res.status(resolved.error.status).json({ error: resolved.error.message });
        }
        req.adminUser = resolved.user;
        req.adminProfile = resolved.profile;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export function requireRole(...roles) {
    const required = roles.map(normalizeRole);
    return async (req, res, next) => {
        await requireActiveAdmin(req, res, async () => {
            const currentRole = normalizeRole(req.adminProfile?.role);
            if (!required.includes(currentRole)) {
                return res.status(403).json({ error: 'Forbidden: insufficient role' });
            }
            next();
        });
    };
}
