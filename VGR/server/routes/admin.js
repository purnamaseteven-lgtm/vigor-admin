/* ═══════════════════════════════════════════════════════════════
   VIGOR BACKEND — ADMIN USER MANAGEMENT
   Handles creation of Supabase Auth users (requires service_role key)
   ═══════════════════════════════════════════════════════════════ */
import { Router } from 'express';

const router = Router();

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function requireSuperAdmin(req, res, next) {
    try {
        const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
        if (!token) return res.status(401).json({ error: 'Unauthorized: missing bearer token' });
        if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
            return res.status(503).json({ error: 'Supabase not configured on server' });
        }

        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                apikey: SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${token}`,
            },
        });
        const user = await userRes.json().catch(() => ({}));
        if (!userRes.ok || !user?.id) {
            return res.status(401).json({ error: 'Unauthorized: invalid session' });
        }

        const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_profiles?id=eq.${encodeURIComponent(user.id)}&select=id,username,role,status`, {
            headers: {
                apikey: SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
        });
        const profiles = await profileRes.json().catch(() => []);
        const profile = profiles[0];
        if (!profileRes.ok || !profile || profile.role !== 'SuperAdmin' || profile.status !== 'Active') {
            return res.status(403).json({ error: 'Forbidden: SuperAdmin access required' });
        }

        req.adminProfile = profile;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// ── POST /api/admin/create-user ──────────────────────────────────
// Creates a Supabase Auth user + inserts admin_profile row
router.post('/create-user', requireSuperAdmin, async (req, res) => {
    const { username, name, role, company, shop, status, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'username and password are required' });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return res.status(503).json({ error: 'Supabase not configured on server' });
    }

    const email = `${username.toLowerCase().replace(/[^a-z0-9._-]/g, '_')}@vigor.internal`;

    try {
        // 1. Create Supabase Auth user
        const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'apikey':        SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
                email,
                password,
                email_confirm: true,
                user_metadata: { username, name, role, company },
            }),
        });

        const authData = await authRes.json();
        if (!authRes.ok) {
            console.error('[Admin] Auth user creation failed:', authData);
            return res.status(400).json({ error: authData.message || authData.msg || 'Auth user creation failed' });
        }

        const userId = authData.id;

        // 2. Insert admin_profile (upsert to avoid conflicts on retry)
        const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_profiles`, {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'apikey':        SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Prefer':        'resolution=merge-duplicates,return=minimal',
            },
            body: JSON.stringify({
                id:       userId,
                username: username,
                name:     name || username,
                role:     role || 'Company',
                company:  company || null,
                shop:     shop    || null,
                status:   status  || 'Active',
            }),
        });

        if (!profileRes.ok) {
            const profileErr = await profileRes.json().catch(() => ({}));
            console.error('[Admin] Profile insert failed:', profileErr);
            // Auth user was created but profile failed — return the ID so frontend can handle
            return res.status(207).json({
                id: userId,
                warning: 'Auth user created but profile insert failed: ' + (profileErr.message || 'unknown'),
            });
        }

        console.log(`[Admin] Created admin user: ${username} (${role}) — ${userId}`);
        res.json({ id: userId, username, email, success: true });

    } catch (err) {
        console.error('[Admin] create-user error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/admin/delete-user ──────────────────────────────────
// Deletes Supabase Auth user (hard delete)
router.post('/delete-user', requireSuperAdmin, async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
        const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'apikey':        SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
        });
        if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            return res.status(400).json({ error: err.message || 'Delete failed' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/admin/reset-password ──────────────────────────────
// Resets password for an existing Supabase Auth user
router.post('/reset-password', requireSuperAdmin, async (req, res) => {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ error: 'userId and newPassword required' });
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
        const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type':  'application/json',
                'apikey':        SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({ password: newPassword }),
        });
        const data = await r.json();
        if (!r.ok) return res.status(400).json({ error: data.message || 'Reset failed' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
