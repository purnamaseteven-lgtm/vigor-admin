-- ─── CRM MODULE TABLES ────────────────────────────────────────────────────────

-- Player Segments: define groups by criteria (VIP, deposit, activity, etc.)
CREATE TABLE IF NOT EXISTS crm_segments (
    id          TEXT PRIMARY KEY DEFAULT 'SEG' || LPAD(FLOOR(RANDOM()*999999)::TEXT, 6, '0'),
    name        TEXT NOT NULL,
    description TEXT,
    criteria    JSONB NOT NULL DEFAULT '{}',   -- { minDeposit, maxDeposit, vipTier, company, minBets, inactive_days, ... }
    company     TEXT,                           -- NULL = global
    status      TEXT NOT NULL DEFAULT 'Active', -- Active | Archived
    member_count INT NOT NULL DEFAULT 0,
    created_by  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Missions / Challenges: tasks players complete for rewards
CREATE TABLE IF NOT EXISTS crm_missions (
    id              TEXT PRIMARY KEY DEFAULT 'MSN' || LPAD(FLOOR(RANDOM()*999999)::TEXT, 6, '0'),
    name            TEXT NOT NULL,
    description     TEXT,
    type            TEXT NOT NULL DEFAULT 'Deposit',  -- Deposit | Bet | Login | Referral | Turnover | Custom
    target_value    NUMERIC NOT NULL DEFAULT 0,
    reward_type     TEXT NOT NULL DEFAULT 'Bonus',    -- Bonus | Points | Freebet | Cash
    reward_amount   NUMERIC NOT NULL DEFAULT 0,
    segment_id      TEXT REFERENCES crm_segments(id) ON DELETE SET NULL,
    company         TEXT,
    status          TEXT NOT NULL DEFAULT 'Active',   -- Draft | Active | Paused | Ended
    start_date      DATE,
    end_date        DATE,
    max_participants INT,
    participants    INT NOT NULL DEFAULT 0,
    completions     INT NOT NULL DEFAULT 0,
    created_by      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mission Progress per member
CREATE TABLE IF NOT EXISTS crm_mission_progress (
    id          TEXT PRIMARY KEY DEFAULT 'MP' || LPAD(FLOOR(RANDOM()*999999)::TEXT, 6, '0'),
    mission_id  TEXT NOT NULL REFERENCES crm_missions(id) ON DELETE CASCADE,
    member      TEXT NOT NULL,
    company     TEXT,
    progress    NUMERIC NOT NULL DEFAULT 0,
    completed   BOOLEAN NOT NULL DEFAULT FALSE,
    rewarded    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tournaments: competitive leaderboards with prize pools
CREATE TABLE IF NOT EXISTS crm_tournaments (
    id               TEXT PRIMARY KEY DEFAULT 'TRN' || LPAD(FLOOR(RANDOM()*999999)::TEXT, 6, '0'),
    name             TEXT NOT NULL,
    description      TEXT,
    prize_pool       NUMERIC NOT NULL DEFAULT 0,
    prize_structure  JSONB NOT NULL DEFAULT '[]',  -- [{ rank: 1, amount: 5000000 }, ...]
    game_type        TEXT,                          -- Slot | Casino | Togel | All
    segment_id       TEXT REFERENCES crm_segments(id) ON DELETE SET NULL,
    company          TEXT,
    status           TEXT NOT NULL DEFAULT 'Draft', -- Draft | Active | Ended | Settled
    start_date       TIMESTAMPTZ,
    end_date         TIMESTAMPTZ,
    max_participants INT,
    scoring_metric   TEXT DEFAULT 'Turnover',       -- Turnover | WinAmount | BetCount
    created_by       TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tournament Entries (leaderboard)
CREATE TABLE IF NOT EXISTS crm_tournament_entries (
    id            TEXT PRIMARY KEY DEFAULT 'TE' || LPAD(FLOOR(RANDOM()*999999)::TEXT, 6, '0'),
    tournament_id TEXT NOT NULL REFERENCES crm_tournaments(id) ON DELETE CASCADE,
    member        TEXT NOT NULL,
    company       TEXT,
    score         NUMERIC NOT NULL DEFAULT 0,
    rank          INT,
    prize_amount  NUMERIC NOT NULL DEFAULT 0,
    prize_paid    BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automation Rules: if/then triggers for CRM actions
CREATE TABLE IF NOT EXISTS crm_automation_rules (
    id             TEXT PRIMARY KEY DEFAULT 'AUT' || LPAD(FLOOR(RANDOM()*999999)::TEXT, 6, '0'),
    name           TEXT NOT NULL,
    description    TEXT,
    trigger_event  TEXT NOT NULL,  -- register | deposit | withdrawal | login | inactivity | tier_change | bet_win | bet_lose
    conditions     JSONB NOT NULL DEFAULT '[]',
    -- e.g. [{ field: "amount", op: "gte", value: 100000 }, { field: "company", op: "eq", value: "vigor88" }]
    actions        JSONB NOT NULL DEFAULT '[]',
    -- e.g. [{ type: "send_bonus", amount: 10000 }, { type: "send_memo", template: "welcome" }, { type: "add_points", points: 100 }]
    company        TEXT,
    status         TEXT NOT NULL DEFAULT 'Active',
    fired_count    INT NOT NULL DEFAULT 0,
    last_fired_at  TIMESTAMPTZ,
    created_by     TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Push Notification Campaigns
CREATE TABLE IF NOT EXISTS crm_push_campaigns (
    id           TEXT PRIMARY KEY DEFAULT 'PSH' || LPAD(FLOOR(RANDOM()*999999)::TEXT, 6, '0'),
    title        TEXT NOT NULL,
    message      TEXT NOT NULL,
    image_url    TEXT,
    action_url   TEXT,
    segment_id   TEXT REFERENCES crm_segments(id) ON DELETE SET NULL,
    company      TEXT,
    status       TEXT NOT NULL DEFAULT 'Draft',  -- Draft | Scheduled | Sent | Failed
    scheduled_at TIMESTAMPTZ,
    sent_at      TIMESTAMPTZ,
    sent_count   INT NOT NULL DEFAULT 0,
    open_count   INT NOT NULL DEFAULT 0,
    click_count  INT NOT NULL DEFAULT 0,
    created_by   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loyalty Points ledger per member
CREATE TABLE IF NOT EXISTS crm_loyalty_points (
    id          TEXT PRIMARY KEY DEFAULT 'LP' || LPAD(FLOOR(RANDOM()*999999)::TEXT, 6, '0'),
    member      TEXT NOT NULL,
    company     TEXT,
    points      NUMERIC NOT NULL DEFAULT 0,
    event       TEXT,        -- earn | redeem | expire | adjust
    source      TEXT,        -- deposit | bet | mission | tournament | manual
    source_id   TEXT,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS (Row Level Security) ───────────────────────────────────────────────────
ALTER TABLE crm_segments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_missions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_mission_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tournaments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tournament_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_automation_rules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_push_campaigns    ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_loyalty_points    ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "service_all" ON crm_segments          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_missions          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_mission_progress  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_tournaments       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_tournament_entries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_automation_rules  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_push_campaigns    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_loyalty_points    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── INDEXES ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_crm_segments_company       ON crm_segments(company);
CREATE INDEX IF NOT EXISTS idx_crm_missions_company       ON crm_missions(company);
CREATE INDEX IF NOT EXISTS idx_crm_missions_status        ON crm_missions(status);
CREATE INDEX IF NOT EXISTS idx_crm_mp_mission             ON crm_mission_progress(mission_id);
CREATE INDEX IF NOT EXISTS idx_crm_mp_member              ON crm_mission_progress(member);
CREATE INDEX IF NOT EXISTS idx_crm_tournaments_company    ON crm_tournaments(company);
CREATE INDEX IF NOT EXISTS idx_crm_tournaments_status     ON crm_tournaments(status);
CREATE INDEX IF NOT EXISTS idx_crm_te_tournament          ON crm_tournament_entries(tournament_id);
CREATE INDEX IF NOT EXISTS idx_crm_te_member              ON crm_tournament_entries(member);
CREATE INDEX IF NOT EXISTS idx_crm_automation_status      ON crm_automation_rules(status);
CREATE INDEX IF NOT EXISTS idx_crm_push_status            ON crm_push_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_crm_loyalty_member         ON crm_loyalty_points(member);
