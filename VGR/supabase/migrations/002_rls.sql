-- ═══════════════════════════════════════════════════════════════
-- VIGOR ADMIN PANEL — ROW LEVEL SECURITY
-- Migration 002: RLS Policies (multi-tenant isolation)
-- Run AFTER 001_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ── Helper function: get current user's role ───────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
    SELECT role FROM admin_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Helper function: get current user's company ────────────────
CREATE OR REPLACE FUNCTION get_my_company()
RETURNS TEXT AS $$
    SELECT company FROM admin_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Enable RLS on all tables ───────────────────────────────────
ALTER TABLE admin_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies               ENABLE ROW LEVEL SECURITY;
ALTER TABLE members                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits                ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE seamless_transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE seamless_games          ENABLE ROW LEVEL SECURITY;
ALTER TABLE seamless_api_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_bets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_results         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonuses                 ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════
-- ADMIN PROFILES
-- ══════════════════════════════════════════════════════════════
-- Everyone can read their own profile
CREATE POLICY "admin_profiles_select_own"  ON admin_profiles FOR SELECT USING (id = auth.uid());
-- SuperAdmin can see all
CREATE POLICY "admin_profiles_select_all"  ON admin_profiles FOR SELECT USING (get_my_role() = 'SuperAdmin');
-- SuperAdmin can insert/update/delete
CREATE POLICY "admin_profiles_insert"      ON admin_profiles FOR INSERT WITH CHECK (get_my_role() = 'SuperAdmin');
CREATE POLICY "admin_profiles_update"      ON admin_profiles FOR UPDATE USING (get_my_role() = 'SuperAdmin' OR id = auth.uid());
CREATE POLICY "admin_profiles_delete"      ON admin_profiles FOR DELETE USING (get_my_role() = 'SuperAdmin');

-- ══════════════════════════════════════════════════════════════
-- COMPANIES
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "companies_superadmin"  ON companies FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "companies_company_own" ON companies FOR SELECT USING (
    get_my_role() IN ('Company','Master') AND username = get_my_company()
);
-- Company can see their whitelabels under them
CREATE POLICY "companies_children"    ON companies FOR SELECT USING (
    get_my_role() = 'Company' AND parent_company = get_my_company()
);

-- ══════════════════════════════════════════════════════════════
-- MEMBERS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "members_superadmin"   ON members FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "members_company_own"  ON members FOR ALL USING (
    get_my_role() IN ('Company','Master','Shop','Agent') AND company = get_my_company()
);

-- ══════════════════════════════════════════════════════════════
-- BANKS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "banks_superadmin"     ON banks FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "banks_global_read"    ON banks FOR SELECT USING (company IS NULL);  -- global banks visible to all
CREATE POLICY "banks_company_own"    ON banks FOR ALL USING (
    get_my_role() IN ('Company','Master') AND company = get_my_company()
);

-- ══════════════════════════════════════════════════════════════
-- DEPOSITS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "deposits_superadmin"  ON deposits FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "deposits_company_own" ON deposits FOR ALL USING (
    get_my_role() IN ('Company','Master','Shop','Agent') AND company = get_my_company()
);

-- ══════════════════════════════════════════════════════════════
-- WITHDRAWALS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "withdrawals_superadmin"  ON withdrawals FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "withdrawals_company_own" ON withdrawals FOR ALL USING (
    get_my_role() IN ('Company','Master','Shop','Agent') AND company = get_my_company()
);

-- ══════════════════════════════════════════════════════════════
-- MEMOS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "memos_superadmin"     ON memos FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "memos_own"            ON memos FOR SELECT USING (
    to_user = (SELECT username FROM admin_profiles WHERE id = auth.uid()) OR
    from_user = (SELECT username FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "memos_insert"         ON memos FOR INSERT WITH CHECK (
    from_user = (SELECT username FROM admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "memos_update_own"     ON memos FOR UPDATE USING (
    to_user = (SELECT username FROM admin_profiles WHERE id = auth.uid()) OR
    from_user = (SELECT username FROM admin_profiles WHERE id = auth.uid())
);

-- ══════════════════════════════════════════════════════════════
-- ADMIN LOGS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "logs_superadmin"      ON admin_logs FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "logs_company_own"     ON admin_logs FOR SELECT USING (
    get_my_role() = 'Company' AND company = get_my_company()
);
CREATE POLICY "logs_insert_all"      ON admin_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════════
-- SEAMLESS TRANSACTIONS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "seamless_superadmin"  ON seamless_transactions FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "seamless_company_own" ON seamless_transactions FOR SELECT USING (
    get_my_role() IN ('Company','Master') AND company = get_my_company()
);
-- Server-side inserts allowed (service_role bypasses RLS)

-- ══════════════════════════════════════════════════════════════
-- SEAMLESS GAMES (public read)
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "seamless_games_read"  ON seamless_games FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "seamless_games_write" ON seamless_games FOR ALL USING (get_my_role() = 'SuperAdmin');

-- ══════════════════════════════════════════════════════════════
-- SEAMLESS API LOGS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "api_logs_superadmin"  ON seamless_api_logs FOR ALL USING (get_my_role() = 'SuperAdmin');

-- ══════════════════════════════════════════════════════════════
-- SETTINGS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "settings_superadmin"      ON settings FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "settings_read_global"     ON settings FOR SELECT USING (company IS NULL);
CREATE POLICY "settings_company_own"     ON settings FOR ALL USING (
    get_my_role() = 'Company' AND company = get_my_company()
);

-- ══════════════════════════════════════════════════════════════
-- PROMOTIONS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "promotions_superadmin"    ON promotions FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "promotions_global_read"   ON promotions FOR SELECT USING (company IS NULL);
CREATE POLICY "promotions_company_own"   ON promotions FOR ALL USING (
    get_my_role() = 'Company' AND company = get_my_company()
);

-- ══════════════════════════════════════════════════════════════
-- ANNOUNCEMENTS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "ann_superadmin"           ON announcements FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "ann_read_active"          ON announcements FOR SELECT USING (is_active = TRUE);
CREATE POLICY "ann_company_manage"       ON announcements FOR ALL USING (
    get_my_role() = 'Company' AND company = get_my_company()
);

-- ══════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "notif_superadmin"         ON notifications FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "notif_own"                ON notifications FOR SELECT USING (
    recipient = 'all' OR
    recipient = (SELECT username FROM admin_profiles WHERE id = auth.uid())
);

-- ══════════════════════════════════════════════════════════════
-- LOTTERY BETS
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "bets_superadmin"          ON lottery_bets FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "bets_company_own"         ON lottery_bets FOR ALL USING (
    get_my_role() IN ('Company','Master','Shop','Agent') AND company = get_my_company()
);

-- ══════════════════════════════════════════════════════════════
-- LOTTERY RESULTS (public read for all authenticated users)
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "results_read"             ON lottery_results FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "results_write_superadmin" ON lottery_results FOR ALL USING (get_my_role() = 'SuperAdmin');

-- ══════════════════════════════════════════════════════════════
-- BONUSES
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "bonuses_superadmin"       ON bonuses FOR ALL USING (get_my_role() = 'SuperAdmin');
CREATE POLICY "bonuses_company_own"      ON bonuses FOR ALL USING (
    get_my_role() IN ('Company','Master') AND company = get_my_company()
);
