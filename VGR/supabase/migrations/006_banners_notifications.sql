-- ══════════════════════════════════════════════════════════════════
-- Migration 006: Popup Banners, System Notifications, Rolling Adjustments
-- ══════════════════════════════════════════════════════════════════

-- ── Popup Banners ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS popup_banners (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    message     TEXT,
    image_url   TEXT,
    btn_label   TEXT,
    btn_link    TEXT,
    trigger     TEXT NOT NULL DEFAULT 'On Login',     -- On Login | After Deposit | Timed | On Exit
    target      TEXT NOT NULL DEFAULT 'All',          -- All | New Members | VIP | by Company
    company     TEXT DEFAULT 'All',
    priority    INT DEFAULT 1,                         -- 1–10, higher = shown first
    active      BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── System Notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    message     TEXT,
    type        TEXT NOT NULL DEFAULT 'info',          -- info | success | warning | danger
    target_role TEXT DEFAULT 'All',                    -- All | SuperAdmin | Master | Company
    is_read     BOOLEAN DEFAULT FALSE,
    created_by  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Rolling Adjustments (replaces settings pollution) ─────────────
-- Stores per-member manual rolling multiplier overrides
CREATE TABLE IF NOT EXISTS rolling_adjustments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    TEXT NOT NULL UNIQUE,
    adjustment  NUMERIC(6,2) NOT NULL DEFAULT 0,       -- % adjustment: -100 to +100
    updated_by  TEXT,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Add missing columns to settings ───────────────────────────────
-- Ensure new setting keys can be stored
INSERT INTO settings (key, value, label, type, company)
VALUES
    ('vip_calc_method',   'turnover', 'VIP Calculation Method', 'select', NULL),
    ('vip_crm_sync',      'true',     'Sync VIP with CRM Segments', 'boolean', NULL),
    ('rolling_multiplier','5',        'Default Rolling Multiplier', 'number', NULL),
    ('notif_sound',       'true',     'Finance Sound Notifications', 'boolean', NULL)
ON CONFLICT (key) DO NOTHING;

-- ── RLS Policies ──────────────────────────────────────────────────
ALTER TABLE popup_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rolling_adjustments ENABLE ROW LEVEL SECURITY;

-- SuperAdmin: full access
CREATE POLICY "SuperAdmin full access - popup_banners"
    ON popup_banners FOR ALL
    USING (auth.jwt() ->> 'role' = 'SuperAdmin');

CREATE POLICY "SuperAdmin full access - system_notifications"
    ON system_notifications FOR ALL
    USING (auth.jwt() ->> 'role' = 'SuperAdmin');

CREATE POLICY "SuperAdmin full access - rolling_adjustments"
    ON rolling_adjustments FOR ALL
    USING (auth.jwt() ->> 'role' = 'SuperAdmin');

-- Master: read + write system_notifications; read popup_banners
CREATE POLICY "Master read - popup_banners"
    ON popup_banners FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('SuperAdmin', 'Master', 'Company'));

CREATE POLICY "Master read/write - system_notifications"
    ON system_notifications FOR ALL
    USING (auth.jwt() ->> 'role' IN ('SuperAdmin', 'Master'));

-- Company: read own banners + notifications; write rolling adjustments for their members
CREATE POLICY "Company read - system_notifications"
    ON system_notifications FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'Company' AND
        (target_role = 'All' OR target_role = 'Company')
    );

CREATE POLICY "Company manage - rolling_adjustments"
    ON rolling_adjustments FOR ALL
    USING (auth.jwt() ->> 'role' IN ('SuperAdmin', 'Master', 'Company'));

-- ── Indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_popup_banners_active    ON popup_banners (active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_popup_banners_company   ON popup_banners (company);
CREATE INDEX IF NOT EXISTS idx_sysnotif_role           ON system_notifications (target_role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sysnotif_unread         ON system_notifications (is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_rolling_adj_username    ON rolling_adjustments (username);

-- ── Realtime ─────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE system_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE popup_banners;
