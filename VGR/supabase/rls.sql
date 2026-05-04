-- ═══════════════════════════════════════════════════════════
--  VIGOR Admin — Row Level Security Policies
--  Run AFTER schema.sql
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE admin_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE members             ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE seamless_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seamless_games        ENABLE ROW LEVEL SECURITY;
ALTER TABLE seamless_api_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_bets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings            ENABLE ROW LEVEL SECURITY;

-- ─── Helper: check if user is active admin ────────────────
CREATE OR REPLACE FUNCTION is_active_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE id = auth.uid() AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── admin_profiles ───────────────────────────────────────
CREATE POLICY "Admin can view own profile"
    ON admin_profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Admin can update own profile"
    ON admin_profiles FOR UPDATE
    USING (id = auth.uid());

-- ─── All other tables: authenticated active admins only ───
-- members
CREATE POLICY "Admins read members"   ON members FOR SELECT USING (is_active_admin());
CREATE POLICY "Admins insert members" ON members FOR INSERT WITH CHECK (is_active_admin());
CREATE POLICY "Admins update members" ON members FOR UPDATE USING (is_active_admin());
CREATE POLICY "Admins delete members" ON members FOR DELETE USING (is_active_admin());

-- companies
CREATE POLICY "Admins read companies"   ON companies FOR SELECT USING (is_active_admin());
CREATE POLICY "Admins insert companies" ON companies FOR INSERT WITH CHECK (is_active_admin());
CREATE POLICY "Admins update companies" ON companies FOR UPDATE USING (is_active_admin());
CREATE POLICY "Admins delete companies" ON companies FOR DELETE USING (is_active_admin());

-- banks
CREATE POLICY "Admins read banks"   ON banks FOR SELECT USING (is_active_admin());
CREATE POLICY "Admins insert banks" ON banks FOR INSERT WITH CHECK (is_active_admin());
CREATE POLICY "Admins update banks" ON banks FOR UPDATE USING (is_active_admin());
CREATE POLICY "Admins delete banks" ON banks FOR DELETE USING (is_active_admin());

-- deposits
CREATE POLICY "Admins read deposits"   ON deposits FOR SELECT USING (is_active_admin());
CREATE POLICY "Admins insert deposits" ON deposits FOR INSERT WITH CHECK (is_active_admin());
CREATE POLICY "Admins update deposits" ON deposits FOR UPDATE USING (is_active_admin());

-- withdrawals
CREATE POLICY "Admins read withdrawals"   ON withdrawals FOR SELECT USING (is_active_admin());
CREATE POLICY "Admins insert withdrawals" ON withdrawals FOR INSERT WITH CHECK (is_active_admin());
CREATE POLICY "Admins update withdrawals" ON withdrawals FOR UPDATE USING (is_active_admin());

-- memos
CREATE POLICY "Admins read memos"   ON memos FOR SELECT USING (is_active_admin());
CREATE POLICY "Admins insert memos" ON memos FOR INSERT WITH CHECK (is_active_admin());
CREATE POLICY "Admins update memos" ON memos FOR UPDATE USING (is_active_admin());

-- admin_logs
CREATE POLICY "Admins read logs"   ON admin_logs FOR SELECT USING (is_active_admin());
CREATE POLICY "Admins insert logs" ON admin_logs FOR INSERT WITH CHECK (is_active_admin());

-- announcements, notifications, promotions
CREATE POLICY "Admins full announcements"   ON announcements   FOR ALL USING (is_active_admin());
CREATE POLICY "Admins full notifications"   ON notifications   FOR ALL USING (is_active_admin());
CREATE POLICY "Admins full promotions"      ON promotions      FOR ALL USING (is_active_admin());

-- seamless
CREATE POLICY "Admins read seamless_tx"       ON seamless_transactions FOR SELECT USING (is_active_admin());
CREATE POLICY "Admins insert seamless_tx"     ON seamless_transactions FOR INSERT WITH CHECK (is_active_admin());
CREATE POLICY "Admins read seamless_games"    ON seamless_games        FOR ALL    USING (is_active_admin());
CREATE POLICY "Admins read seamless_api_logs" ON seamless_api_logs     FOR ALL    USING (is_active_admin());

-- bets
CREATE POLICY "Admins full bets"              ON lottery_bets          FOR ALL    USING (is_active_admin());

-- settings
CREATE POLICY "Admins read settings"  ON settings FOR SELECT USING (is_active_admin());
CREATE POLICY "Admins write settings" ON settings FOR ALL    USING (is_active_admin());

-- ─── Auto-create admin_profile on signup ──────────────────
CREATE OR REPLACE FUNCTION handle_new_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_profiles (id, username, name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_admin();
