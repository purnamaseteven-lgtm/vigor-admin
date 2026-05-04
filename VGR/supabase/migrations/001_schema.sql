-- ═══════════════════════════════════════════════════════════════
-- VIGOR ADMIN PANEL — DATABASE SCHEMA
-- Migration 001: Full Schema
-- Run this first in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Enable extensions ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Drop tables if re-running (safe order) ─────────────────────
DROP TABLE IF EXISTS lottery_results CASCADE;
DROP TABLE IF EXISTS lottery_bets CASCADE;
DROP TABLE IF EXISTS bonuses CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS seamless_api_logs CASCADE;
DROP TABLE IF EXISTS seamless_games CASCADE;
DROP TABLE IF EXISTS seamless_transactions CASCADE;
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS memos CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;
DROP TABLE IF EXISTS banks CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS admin_profiles CASCADE;

-- ══════════════════════════════════════════════════════════════
-- 1. ADMIN PROFILES (links to auth.users)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE admin_profiles (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username     TEXT UNIQUE NOT NULL,
    name         TEXT,
    role         TEXT NOT NULL DEFAULT 'Agent'
                   CHECK (role IN ('SuperAdmin','Company','Master','Shop','Agent')),
    company      TEXT,
    shop         TEXT,
    status       TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive','Suspended')),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 2. COMPANIES (Whitelabel / Company / Master hierarchy)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE companies (
    id              TEXT PRIMARY KEY DEFAULT ('C' || floor(random()*900000+100000)::TEXT),
    username        TEXT UNIQUE NOT NULL,
    name            TEXT,
    email           TEXT,
    phone           TEXT,
    credit          BIGINT DEFAULT 0,
    members         INTEGER DEFAULT 0,
    status          TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive','Suspended')),
    type            TEXT DEFAULT 'Company' CHECK (type IN ('Whitelabel','Company','Master')),
    parent_company  TEXT,
    togel_markets   JSONB DEFAULT '[]'::jsonb,
    joined          TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 3. MEMBERS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE members (
    id           TEXT PRIMARY KEY,
    username     TEXT UNIQUE NOT NULL,
    name         TEXT,
    company      TEXT REFERENCES companies(username) ON DELETE SET NULL,
    phone        TEXT,
    bank         TEXT,
    bank_account TEXT,
    balance      BIGINT DEFAULT 0,
    status       TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive','Suspended','Blocked')),
    tier         TEXT DEFAULT 'Bronze' CHECK (tier IN ('Bronze','Silver','Gold','Platinum','Diamond')),
    referral     TEXT,
    joined       TEXT,
    last_login   TEXT,
    ip           TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 4. BANKS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE banks (
    id             TEXT PRIMARY KEY DEFAULT ('B' || floor(random()*900000+100000)::TEXT),
    bank           TEXT NOT NULL,
    account_name   TEXT,
    account_number TEXT,
    type           TEXT DEFAULT 'Both' CHECK (type IN ('Deposit','Withdrawal','Both')),
    min_deposit    BIGINT DEFAULT 10000,
    max_deposit    BIGINT DEFAULT 100000000,
    status         TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
    company        TEXT,  -- NULL = global/superadmin bank
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 5. DEPOSITS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE deposits (
    id             TEXT PRIMARY KEY,
    member         TEXT NOT NULL,
    company        TEXT,
    bank           TEXT,
    amount         BIGINT NOT NULL,
    status         TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
    date           TEXT,
    processed_by   TEXT,
    payment_method TEXT,   -- manual / unopay / coin2pay / sawala
    payment_ref    TEXT,   -- external payment reference
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 6. WITHDRAWALS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE withdrawals (
    id             TEXT PRIMARY KEY,
    member         TEXT NOT NULL,
    company        TEXT,
    bank           TEXT,
    account_number TEXT,
    amount         BIGINT NOT NULL,
    status         TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
    date           TEXT,
    processed_by   TEXT,
    payment_ref    TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 7. MEMOS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE memos (
    id          TEXT PRIMARY KEY DEFAULT ('M' || floor(random()*900000000+100000000)::TEXT),
    type        TEXT DEFAULT 'inbox' CHECK (type IN ('inbox','sent','trash')),
    from_user   TEXT,
    to_user     TEXT,
    subject     TEXT,
    body        TEXT,
    category    TEXT DEFAULT 'General',
    is_read     BOOLEAN DEFAULT FALSE,
    date        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 8. ADMIN LOGS (audit trail)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE admin_logs (
    id          TEXT PRIMARY KEY DEFAULT ('L' || floor(random()*900000000+100000000)::TEXT),
    date        TEXT,
    actor       TEXT,
    ip          TEXT,
    action      TEXT,
    target      TEXT,
    description TEXT,
    company     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 9. SEAMLESS TRANSACTIONS (PGSoft)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE seamless_transactions (
    id                   TEXT PRIMARY KEY,
    trace_id             TEXT,
    player               TEXT,
    company              TEXT,
    provider             TEXT DEFAULT 'PG_SOFT',
    game_id              TEXT,
    game_name            TEXT,
    parent_bet_id        TEXT,
    bet_id               TEXT,
    transaction_id       TEXT UNIQUE,  -- idempotency key
    bet_amount           DECIMAL(20,2) DEFAULT 0,
    win_amount           DECIMAL(20,2) DEFAULT 0,
    transfer_amount      DECIMAL(20,2) DEFAULT 0,
    real_transfer_amount DECIMAL(20,2) DEFAULT 0,
    transaction_type     TEXT,
    wallet_type          TEXT DEFAULT 'C',
    currency             TEXT DEFAULT 'IDR',
    is_end_round         BOOLEAN DEFAULT FALSE,
    is_feature           BOOLEAN DEFAULT FALSE,
    status               TEXT DEFAULT 'Completed',
    balance_after        DECIMAL(20,2) DEFAULT 0,
    create_time          TIMESTAMPTZ DEFAULT NOW(),
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seamless_tx_player    ON seamless_transactions(player);
CREATE INDEX idx_seamless_tx_company   ON seamless_transactions(company);
CREATE INDEX idx_seamless_tx_create_time ON seamless_transactions(create_time DESC);
CREATE UNIQUE INDEX idx_seamless_tx_idempotency ON seamless_transactions(transaction_id) WHERE transaction_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════
-- 10. SEAMLESS GAMES CATALOG
-- ══════════════════════════════════════════════════════════════
CREATE TABLE seamless_games (
    id          SERIAL PRIMARY KEY,
    provider    TEXT,
    name        TEXT,
    type        TEXT DEFAULT 'Slot',
    status      TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive','Maintenance')),
    rtp         DECIMAL(5,2),
    max_win     INTEGER,
    bet_sizes   TEXT,
    popularity  INTEGER DEFAULT 80,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 11. SEAMLESS API LOGS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE seamless_api_logs (
    id            TEXT PRIMARY KEY DEFAULT ('PGLOG' || floor(random()*9000000000+1000000000)::TEXT),
    provider      TEXT,
    endpoint      TEXT,
    method        TEXT DEFAULT 'POST',
    http_status   INTEGER,
    trace_id      TEXT,
    response_time TEXT,
    player        TEXT,
    status        TEXT,
    request_body  TEXT,
    response_body TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 12. SETTINGS (global key-value store)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE settings (
    key        TEXT PRIMARY KEY,
    value      TEXT,
    company    TEXT,  -- NULL = global, otherwise per-company
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 13. PROMOTIONS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE promotions (
    id                   TEXT PRIMARY KEY DEFAULT ('PROMO' || floor(random()*900000+100000)::TEXT),
    title                TEXT NOT NULL,
    description          TEXT,
    type                 TEXT,   -- Deposit Bonus / Cashback / Referral / etc
    value                DECIMAL(10,2),
    min_deposit          BIGINT DEFAULT 0,
    max_bonus            BIGINT DEFAULT 0,
    turnover_multiplier  INTEGER DEFAULT 1,
    status               TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive','Scheduled')),
    start_date           TEXT,
    end_date             TEXT,
    company              TEXT,
    image_url            TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 14. ANNOUNCEMENTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE announcements (
    id         TEXT PRIMARY KEY DEFAULT ('ANN' || floor(random()*900000+100000)::TEXT),
    title      TEXT NOT NULL,
    content    TEXT,
    type       TEXT DEFAULT 'info' CHECK (type IN ('info','warning','success','danger')),
    priority   INTEGER DEFAULT 0,
    is_active  BOOLEAN DEFAULT TRUE,
    company    TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 15. NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE notifications (
    id         TEXT PRIMARY KEY DEFAULT ('NOTIF' || floor(random()*900000+100000)::TEXT),
    title      TEXT,
    message    TEXT,
    type       TEXT DEFAULT 'info',
    is_read    BOOLEAN DEFAULT FALSE,
    recipient  TEXT,   -- username or 'all'
    company    TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- 16. LOTTERY BETS (Togel)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE lottery_bets (
    id          TEXT PRIMARY KEY,
    member      TEXT NOT NULL,
    company     TEXT,
    pool        TEXT NOT NULL,
    game        TEXT NOT NULL,  -- 4D/3D/2D/Colok Bebas/etc
    guess       TEXT NOT NULL,
    bet_amount  BIGINT NOT NULL,
    paid_amount BIGINT DEFAULT 0,
    win_amount  BIGINT DEFAULT 0,
    discount    DECIMAL(5,2) DEFAULT 0,
    status      TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Won','Lost','Cancelled')),
    draw_date   TEXT,
    date        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lottery_bets_member  ON lottery_bets(member);
CREATE INDEX idx_lottery_bets_company ON lottery_bets(company);
CREATE INDEX idx_lottery_bets_pool    ON lottery_bets(pool);

-- ══════════════════════════════════════════════════════════════
-- 17. LOTTERY RESULTS (Draw outcomes)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE lottery_results (
    id          TEXT PRIMARY KEY DEFAULT ('RES' || floor(random()*900000000+100000000)::TEXT),
    pool        TEXT NOT NULL,
    draw_date   TEXT NOT NULL,
    result_1st  TEXT,
    result_2nd  TEXT,
    result_3rd  TEXT,
    consolation JSONB DEFAULT '[]'::jsonb,
    starter     JSONB DEFAULT '[]'::jsonb,
    is_settled  BOOLEAN DEFAULT FALSE,
    settled_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pool, draw_date)
);

-- ══════════════════════════════════════════════════════════════
-- 18. BONUSES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE bonuses (
    id                   TEXT PRIMARY KEY DEFAULT ('BNS' || floor(random()*900000000+100000000)::TEXT),
    member               TEXT NOT NULL,
    company              TEXT,
    type                 TEXT,   -- Deposit Bonus/Cashback/Referral/Freebet/Welcome/Weekly/Special Event
    deposit_amount       BIGINT DEFAULT 0,
    bonus_amount         BIGINT DEFAULT 0,
    turnover_required    BIGINT DEFAULT 0,
    turnover_achieved    BIGINT DEFAULT 0,
    status               TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Claimed','Expired','Cancelled')),
    promotion_id         TEXT,
    claimed_at           TEXT,
    expires_at           TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER (auto-update timestamp)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['admin_profiles','companies','members','banks','deposits','withdrawals','promotions','announcements','bonuses']
    LOOP
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END;
$$;
