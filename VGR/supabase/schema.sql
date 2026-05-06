-- ═══════════════════════════════════════════════════════════
--  VIGOR Admin — Supabase Schema
--  Run this in Supabase SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════

-- ─── Extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Admin Profiles (linked to Supabase Auth) ─────────────
CREATE TABLE IF NOT EXISTS admin_profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username    TEXT UNIQUE NOT NULL,
    name        TEXT,
    role        TEXT DEFAULT 'Admin',     -- Admin | Finance | CS | SuperAdmin
    company     TEXT DEFAULT 'SUBSTAG',
    avatar      TEXT,
    language    TEXT DEFAULT 'English',
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Members ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
    id              TEXT PRIMARY KEY,
    username        TEXT UNIQUE NOT NULL,
    name            TEXT,
    company         TEXT,
    phone           TEXT,
    bank            TEXT,
    bank_account    TEXT,
    balance         BIGINT DEFAULT 0,
    status          TEXT DEFAULT 'Active',    -- Active|Inactive|Suspended|Blocked
    tier            TEXT DEFAULT 'Bronze',    -- Bronze|Silver|Gold|Platinum|Diamond
    referral        TEXT,
    joined          TEXT,
    last_login      TEXT,
    ip              TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Companies ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    name        TEXT,
    email       TEXT,
    phone       TEXT,
    credit      BIGINT DEFAULT 0,
    members     INTEGER DEFAULT 0,
    status      TEXT DEFAULT 'Active',
    type        TEXT DEFAULT 'Company',   -- Company|Whitelabel|Master
    joined      TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Banks ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banks (
    id              TEXT PRIMARY KEY,
    bank            TEXT NOT NULL,
    account_name    TEXT,
    account_number  TEXT,
    type            TEXT DEFAULT 'Both',  -- Deposit|Withdrawal|Both
    min_deposit     BIGINT DEFAULT 10000,
    max_deposit     BIGINT DEFAULT 100000000,
    status          TEXT DEFAULT 'Active',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Deposits ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deposits (
    id              TEXT PRIMARY KEY,
    member          TEXT NOT NULL,
    company         TEXT,
    bank            TEXT,
    amount          BIGINT NOT NULL,
    status          TEXT DEFAULT 'Pending',   -- Pending|Approved|Rejected
    date            TEXT,
    processed_by    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Withdrawals ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawals (
    id              TEXT PRIMARY KEY,
    member          TEXT NOT NULL,
    company         TEXT,
    bank            TEXT,
    account_number  TEXT,
    amount          BIGINT NOT NULL,
    status          TEXT DEFAULT 'Pending',
    date            TEXT,
    processed_by    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Memos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memos (
    id          TEXT PRIMARY KEY,
    type        TEXT DEFAULT 'inbox',    -- inbox|sent|trash
    from_user   TEXT,
    to_user     TEXT,
    subject     TEXT,
    body        TEXT,
    category    TEXT DEFAULT 'General',
    is_read     BOOLEAN DEFAULT FALSE,
    date        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Admin Logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
    id          TEXT PRIMARY KEY DEFAULT 'L' || extract(epoch from now())::text,
    date        TEXT,
    actor       TEXT,
    ip          TEXT,
    action      TEXT,
    target      TEXT,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Announcements ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
    id          TEXT PRIMARY KEY,
    title       TEXT,
    content     TEXT,
    type        TEXT DEFAULT 'Info',     -- Info|Warning|Success|Danger
    target      TEXT DEFAULT 'All Members',
    status      TEXT DEFAULT 'Active',
    created     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id          TEXT PRIMARY KEY,
    title       TEXT,
    content     TEXT,
    target      TEXT DEFAULT 'All',
    date        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Promotions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotions (
    id          TEXT PRIMARY KEY,
    cat         TEXT,
    title       TEXT,
    created     TEXT,
    display     TEXT,
    status      TEXT DEFAULT 'Active',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seamless Transactions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS seamless_transactions (
    id                  TEXT PRIMARY KEY,
    trace_id            TEXT UNIQUE,
    player              TEXT,
    company             TEXT,
    provider            TEXT DEFAULT 'PG_SOFT',
    game_id             INTEGER,
    game_name           TEXT,
    parent_bet_id       TEXT,
    bet_id              TEXT,
    bet_amount          BIGINT DEFAULT 0,
    win_amount          BIGINT DEFAULT 0,
    transfer_amount     BIGINT DEFAULT 0,
    real_transfer_amount BIGINT DEFAULT 0,
    transaction_type    TEXT,    -- BetPayout|BonusToCash|FreeGameToCash
    wallet_type         TEXT,    -- C|B|G
    currency            TEXT DEFAULT 'IDR',
    is_end_round        BOOLEAN DEFAULT FALSE,
    is_feature          BOOLEAN DEFAULT FALSE,
    status              TEXT DEFAULT 'Completed',
    balance_after       BIGINT DEFAULT 0,
    create_time         TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seamless Games ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seamless_games (
    id          INTEGER PRIMARY KEY,
    provider    TEXT DEFAULT 'PG_SOFT',
    name        TEXT,
    type        TEXT DEFAULT 'Slot',
    status      TEXT DEFAULT 'Active',
    rtp         DECIMAL(5,2),
    max_win     INTEGER,
    bet_sizes   TEXT DEFAULT '0.20 - 100.00',
    popularity  INTEGER DEFAULT 80,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seamless API Logs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS seamless_api_logs (
    id              TEXT PRIMARY KEY,
    provider        TEXT DEFAULT 'PG_SOFT',
    endpoint        TEXT,
    method          TEXT DEFAULT 'POST',
    http_status     INTEGER DEFAULT 200,
    trace_id        TEXT,
    response_time   TEXT,
    player          TEXT,
    status          TEXT,
    request_body    TEXT,
    response_body   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Settings (key-value store) ───────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       JSONB,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes for performance ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_members_company ON members(company);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_member ON deposits(member);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_member ON withdrawals(member);
CREATE INDEX IF NOT EXISTS idx_seamless_tx_player ON seamless_transactions(player);
CREATE INDEX IF NOT EXISTS idx_seamless_tx_company ON seamless_transactions(company);
CREATE INDEX IF NOT EXISTS idx_seamless_tx_create_time ON seamless_transactions(create_time DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_actor ON admin_logs(actor);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

-- ─── Updated_at auto-trigger ──────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_members_updated BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_deposits_updated BEFORE UPDATE ON deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_withdrawals_updated BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Default Settings ─────────────────────────────────────
INSERT INTO settings (key, value) VALUES
    ('commission',      '80'),
    ('referral',        '2'),
    ('referral_slot',   '0.5'),
    ('min_deposit',     '25000'),
    ('max_deposit',     '50000000'),
    ('max_withdraw',    '25000000'),
    ('maintenance_mode','false')
ON CONFLICT (key) DO NOTHING;

-- ─── Lottery Bets ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS lottery_bets (
    id              TEXT PRIMARY KEY,
    member          TEXT NOT NULL,
    pool            TEXT DEFAULT 'SINGAPORE',
    game            TEXT DEFAULT '4D',
    guess           TEXT,
    bet_amount      BIGINT DEFAULT 0,
    paid_amount     BIGINT DEFAULT 0,
    win_amount      BIGINT DEFAULT 0,
    status          TEXT DEFAULT 'Pending',   -- Pending|Win|Lose|Transferred
    date            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lottery_bets_member ON lottery_bets(member);
CREATE INDEX IF NOT EXISTS idx_lottery_bets_pool ON lottery_bets(pool);

-- --- Roles & Permissions Matrix (Task 1) --------------------------
CREATE TABLE IF NOT EXISTS admin_roles (
    role_name   TEXT PRIMARY KEY,
    permissions JSONB NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Default Roles
INSERT INTO admin_roles (role_name, permissions) VALUES
    ('SuperAdmin', '{"all": true}'),
    ('Admin',      '{"dashboard": true, "members": true, "finance": true, "reports": true}'),
    ('Finance',    '{"dashboard": true, "finance": true}'),
    ('CS',         '{"dashboard": true, "members": true, "memo": true}')
ON CONFLICT (role_name) DO NOTHING;

-- --- Log Retention Policy (Task 3) --------------------------
-- Automatically clean logs older than 90 days
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void AS 
BEGIN
    DELETE FROM admin_logs WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM seamless_api_logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
 LANGUAGE plpgsql;
