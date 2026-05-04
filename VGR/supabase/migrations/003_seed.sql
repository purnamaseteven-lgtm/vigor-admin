-- ═══════════════════════════════════════════════════════════════
-- VIGOR ADMIN PANEL — SEED DATA
-- Migration 003: Initial seed
-- Run AFTER 001 and 002
-- ═══════════════════════════════════════════════════════════════

-- ── STEP 1 & 2: SuperAdmin user ───────────────────────────────
-- NOTE: Create SuperAdmin via Supabase Auth Admin API (not raw SQL!)
-- Use this curl command AFTER running this migration:
--
--   curl -X POST https://YOUR_PROJECT.supabase.co/auth/v1/admin/users \
--     -H "apikey: YOUR_SERVICE_ROLE_KEY" \
--     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--     -H "Content-Type: application/json" \
--     -d '{"email":"superadmin@vigor.internal","password":"VigorAdmin2026!","email_confirm":true}'
--
-- Then insert admin_profile with the returned user ID:
--
-- INSERT INTO admin_profiles (id, username, name, role, company, status)
-- VALUES ('<USER_ID_FROM_ABOVE>', 'superadmin', 'VIGOR Super Admin', 'SuperAdmin', 'Global', 'Active');
--
-- ALREADY DONE for project eflrvtqoyrgemvgnfdzj:
-- SuperAdmin user ID: cf46ada9-149e-47aa-a410-ea668e0ec79b

-- Ensure admin_profile exists (idempotent)
INSERT INTO admin_profiles (id, username, name, role, company, status)
VALUES ('cf46ada9-149e-47aa-a410-ea668e0ec79b', 'superadmin', 'VIGOR Super Admin', 'SuperAdmin', 'Global', 'Active')
ON CONFLICT (id) DO NOTHING;

-- ── STEP 3: Global settings ────────────────────────────────────
INSERT INTO settings (key, value, company) VALUES
    ('commission',       '80',         NULL),
    ('referral',         '2',          NULL),
    ('referral_slot',    '0.5',        NULL),
    ('min_deposit',      '25000',      NULL),
    ('max_deposit',      '50000000',   NULL),
    ('max_withdraw',     '25000000',   NULL),
    ('maintenance_mode', 'false',      NULL),
    ('app_name',         'VIGOR',      NULL),
    ('app_version',      '2.0.0',      NULL),
    ('currency',         'IDR',        NULL),
    ('timezone',         'Asia/Jakarta', NULL)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ── STEP 4: PGSoft Seamless games catalog ─────────────────────
INSERT INTO seamless_games (provider, name, type, status, rtp, max_win, bet_sizes, popularity) VALUES
    ('PG_SOFT', 'Honey Trap of Diao Chan', 'Slot', 'Active', 96.71, 50000, '0.20 - 100.00', 85),
    ('PG_SOFT', 'Hood vs Wolf', 'Slot', 'Active', 96.83, 30000, '0.20 - 200.00', 78),
    ('PG_SOFT', 'Hotpot', 'Slot', 'Active', 96.74, 25000, '0.20 - 100.00', 72),
    ('PG_SOFT', 'Medusa II', 'Slot', 'Active', 96.91, 40000, '0.20 - 100.00', 76),
    ('PG_SOFT', 'Fortune Mouse', 'Slot', 'Active', 96.81, 30000, '0.20 - 100.00', 90),
    ('PG_SOFT', 'Dragon Hatch', 'Slot', 'Active', 96.74, 40000, '0.20 - 100.00', 88),
    ('PG_SOFT', 'Mahjong Ways', 'Slot', 'Active', 96.95, 50000, '0.20 - 200.00', 97),
    ('PG_SOFT', 'Fortune Tiger', 'Slot', 'Active', 96.81, 50000, '0.20 - 200.00', 99),
    ('PG_SOFT', 'Fortune Rabbit', 'Slot', 'Active', 96.72, 50000, '0.20 - 200.00', 95),
    ('PG_SOFT', 'Fortune Ox', 'Slot', 'Active', 96.78, 50000, '0.20 - 200.00', 93),
    ('PG_SOFT', 'Ganesha Gold', 'Slot', 'Active', 96.79, 45000, '0.20 - 100.00', 88),
    ('PG_SOFT', 'Double Fortune', 'Slot', 'Active', 96.74, 30000, '0.20 - 100.00', 80),
    ('PG_SOFT', 'Wild Bandito', 'Slot', 'Active', 96.72, 50000, '0.20 - 200.00', 92),
    ('PG_SOFT', 'Candy Burst', 'Slot', 'Active', 96.85, 40000, '0.20 - 100.00', 75),
    ('PG_SOFT', 'Mahjong Ways 2', 'Slot', 'Active', 96.95, 50000, '0.20 - 200.00', 98),
    ('PG_SOFT', 'Wild Bounty Showdown', 'Slot', 'Active', 96.74, 50000, '0.20 - 200.00', 89),
    ('PG_SOFT', 'Treasures of Aztec', 'Slot', 'Active', 96.71, 35000, '0.20 - 100.00', 83),
    ('PG_SOFT', 'The Great Icescape', 'Slot', 'Active', 96.76, 30000, '0.20 - 100.00', 77),
    ('PG_SOFT', 'Cash Mania', 'Slot', 'Active', 96.81, 35000, '0.20 - 100.00', 82),
    ('PG_SOFT', 'Buffalo Win', 'Slot', 'Active', 96.74, 40000, '0.20 - 100.00', 79),
    ('PG_SOFT', 'Baccarat Deluxe', 'Card', 'Active', 98.95, 1000, '1.00 - 10000.00', 85),
    ('PG_SOFT', 'Lucky Neko', 'Slot', 'Active', 96.74, 50000, '0.20 - 200.00', 91),
    ('PG_SOFT', 'Crypto Gold', 'Slot', 'Active', 96.71, 40000, '0.20 - 100.00', 80),
    ('PG_SOFT', 'Supermarket Spree', 'Slot', 'Active', 96.74, 30000, '0.20 - 100.00', 74),
    ('PG_SOFT', 'Heist Stakes', 'Slot', 'Active', 96.71, 40000, '0.20 - 100.00', 76),
    ('PG_SOFT', 'Mafia Mayhem', 'Slot', 'Active', 96.74, 45000, '0.20 - 100.00', 78)
ON CONFLICT DO NOTHING;

-- ── STEP 5: Sample announcement ───────────────────────────────
INSERT INTO announcements (title, content, type, priority, is_active, company) VALUES
    ('System Launch', 'VIGOR Admin Panel v2.0 is now live. Welcome!', 'success', 10, TRUE, NULL)
ON CONFLICT DO NOTHING;

-- ── STEP 6: Verify everything ─────────────────────────────────
SELECT 'admin_profiles' AS tbl, COUNT(*) FROM admin_profiles
UNION ALL SELECT 'seamless_games', COUNT(*) FROM seamless_games
UNION ALL SELECT 'settings', COUNT(*) FROM settings
UNION ALL SELECT 'announcements', COUNT(*) FROM announcements;
