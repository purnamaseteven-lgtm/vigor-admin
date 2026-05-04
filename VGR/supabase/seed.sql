-- ═══════════════════════════════════════════════════════════
--  VIGOR Admin — Seed Data
--  Run AFTER schema.sql dan rls.sql
--  NOTE: Buat admin user dulu di Supabase Auth sebelum run ini
-- ═══════════════════════════════════════════════════════════

-- ─── PGSoft Games ─────────────────────────────────────────
INSERT INTO pgsoft_games (id, name, type, status, rtp, max_win, bet_sizes, popularity) VALUES
(1,  'Honey Trap of Diao Chan', 'Slot', 'Active', 96.95, 25000, '0.20 - 100.00', 88),
(2,  'Hood vs Wolf',            'Slot', 'Active', 96.47, 30000, '0.20 - 100.00', 82),
(3,  'Hotpot',                  'Slot', 'Active', 96.76, 20000, '0.20 - 100.00', 75),
(18, 'Dragon Hatch',            'Slot', 'Active', 96.74, 35000, '0.20 - 100.00', 91),
(35, 'Mahjong Ways',            'Slot', 'Active', 96.93, 50000, '0.20 - 100.00', 98),
(36, 'Fortune Tiger',           'Slot', 'Active', 96.81, 40000, '0.20 - 100.00', 97),
(37, 'Fortune Rabbit',          'Slot', 'Active', 97.03, 40000, '0.20 - 100.00', 94),
(38, 'Fortune Ox',              'Slot', 'Active', 96.79, 40000, '0.20 - 100.00', 89),
(39, 'Ganesha Gold',            'Slot', 'Active', 98.00, 45000, '0.20 - 100.00', 93),
(40, 'Double Fortune',          'Slot', 'Active', 96.97, 30000, '0.20 - 100.00', 85),
(42, 'Wild Bandito',            'Slot', 'Active', 96.72, 35000, '0.20 - 100.00', 90),
(54, 'Mahjong Ways 2',          'Slot', 'Active', 96.95, 50000, '0.20 - 100.00', 96),
(59, 'Treasures of Aztec',      'Slot', 'Active', 96.71, 40000, '0.20 - 100.00', 88),
(65, 'Buffalo Win',             'Slot', 'Active', 96.84, 45000, '0.20 - 100.00', 87),
(68, 'Baccarat Deluxe',         'Card', 'Active', 98.60, 10000, '1.00 - 1000.00', 80),
(69, 'Lucky Neko',              'Slot', 'Active', 96.74, 40000, '0.20 - 100.00', 92)
ON CONFLICT (id) DO NOTHING;

-- ─── Companies ────────────────────────────────────────────
INSERT INTO companies (id, username, name, email, phone, credit, members, status, type, joined) VALUES
('C100', 'vigor88',     'VIGOR88 Group',      'vigor88@gaming.io',     '02112345601', 500000000, 350, 'Active', 'Company',    '2023-12-07'),
('C101', 's88pw',       'S88PW Group',        's88pw@gaming.io',       '02112345602', 300000000, 200, 'Active', 'Company',    '2023-12-07'),
('C102', 's88pb',       'S88PB Group',        's88pb@gaming.io',       '02112345603', 200000000, 150, 'Active', 'Whitelabel', '2023-12-07'),
('C103', 'cas88',       'CAS88 Group',        'cas88@gaming.io',       '02112345604', 150000000, 100, 'Active', 'Whitelabel', '2024-01-15'),
('C104', 'tiger88',     'TIGER88 Group',      'tiger88@gaming.io',     '02112345605', 100000000,  80, 'Active', 'Company',    '2024-02-01'),
('C105', 'whitelabel1', 'WHITELABEL1 Group',  'whitelabel1@gaming.io', '02112345606',  50000000,  40, 'Active', 'Whitelabel', '2024-03-10')
ON CONFLICT (id) DO NOTHING;

-- ─── Banks ────────────────────────────────────────────────
INSERT INTO banks (id, bank, account_name, account_number, type, min_deposit, max_deposit, status) VALUES
('B200', 'BCA',     'VIGOR BCA',     '1234567890', 'Both', 10000, 100000000, 'Active'),
('B201', 'BNI',     'VIGOR BNI',     '2345678901', 'Both', 10000, 100000000, 'Active'),
('B202', 'BRI',     'VIGOR BRI',     '3456789012', 'Both', 10000, 100000000, 'Active'),
('B203', 'MANDIRI', 'VIGOR MANDIRI', '4567890123', 'Both', 10000, 100000000, 'Active'),
('B204', 'DANAMON', 'VIGOR DANAMON', '5678901234', 'Deposit', 25000, 50000000, 'Active'),
('B205', 'CIMB',    'VIGOR CIMB',    '6789012345', 'Withdrawal', 50000, 100000000, 'Active')
ON CONFLICT (id) DO NOTHING;

-- ─── Members ──────────────────────────────────────────────
INSERT INTO members (id, username, name, company, phone, bank, bank_account, balance, status, tier, joined, last_login, ip) VALUES
('M1000', 'alex99',      'Santoso Wijaya',   'vigor88',  '081234567890', 'BCA',     '1001234567', 2500000,  'Active', 'Gold',     '15/3/2024',  '27/04/2026', '192.168.1.10'),
('M1001', 'lucy_star',   'Rahayu Pratama',   's88pw',    '081234567891', 'BNI',     '1001234568', 1750000,  'Active', 'Silver',   '20/3/2024',  '27/04/2026', '192.168.1.11'),
('M1002', 'budi_gacor',  'Budi Kusuma',      'vigor88',  '081234567892', 'BRI',     '1001234569', 5000000,  'Active', 'Platinum', '1/4/2024',   '26/04/2026', '192.168.1.12'),
('M1003', 'dave_king',   'Nugroho Halim',    'cas88',    '081234567893', 'MANDIRI', '1001234570', 850000,   'Active', 'Bronze',   '10/4/2024',  '25/04/2026', '192.168.1.13'),
('M1004', 'mega_win',    'Setiawan Irawan',  's88pb',    '081234567894', 'BCA',     '1001234571', 12500000, 'Active', 'Diamond',  '5/1/2024',   '27/04/2026', '192.168.1.14'),
('M1005', 'susi88',      'Sari Lestari',     'tiger88',  '081234567895', 'BNI',     '1001234572', 3200000,  'Active', 'Gold',     '18/2/2024',  '26/04/2026', '192.168.1.15'),
('M1006', 'Gunawan_W',   'Gunawan Wijaya',   'vigor88',  '081234567896', 'BCA',     '1001234573', 680000,   'Active', 'Silver',   '22/3/2024',  '25/04/2026', '192.168.1.16'),
('M1007', 'Rahayu_Sari', 'Rahayu Sari',      's88pw',    '081234567897', 'MANDIRI', '1001234574', 920000,   'Active', 'Bronze',   '7/4/2024',   '24/04/2026', '192.168.1.17'),
('M1008', 'Pratama_J',   'Pratama Jaya',     'cas88',    '081234567898', 'BRI',     '1001234575', 4100000,  'Active', 'Gold',     '12/1/2024',  '27/04/2026', '192.168.1.18'),
('M1009', 'Wijaya_K',    'Wijaya Kartika',   'vigor88',  '081234567899', 'BCA',     '1001234576', 250000,   'Inactive','Bronze',  '30/3/2024',  '01/04/2026', '192.168.1.19')
ON CONFLICT (id) DO NOTHING;

-- ─── Deposits ─────────────────────────────────────────────
INSERT INTO deposits (id, member, company, bank, amount, status, date, processed_by) VALUES
('DEP5000', 'alex99',      'vigor88', 'BCA',     500000,  'Pending',  '27/04/2026 09:15', ''),
('DEP5001', 'lucy_star',   's88pw',   'BNI',     250000,  'Pending',  '27/04/2026 09:32', ''),
('DEP5002', 'budi_gacor',  'vigor88', 'BCA',     1000000, 'Approved', '27/04/2026 08:00', 'adminsub40'),
('DEP5003', 'mega_win',    's88pb',   'MANDIRI', 2000000, 'Approved', '26/04/2026 14:20', 'adminsub40'),
('DEP5004', 'dave_king',   'cas88',   'BRI',     100000,  'Rejected', '26/04/2026 11:05', 'adminsub40'),
('DEP5005', 'susi88',      'tiger88', 'BNI',     750000,  'Approved', '26/04/2026 15:45', 'adminsub40'),
('DEP5006', 'Gunawan_W',   'vigor88', 'BCA',     300000,  'Pending',  '27/04/2026 10:01', ''),
('DEP5007', 'Pratama_J',   'cas88',   'BRI',     500000,  'Approved', '25/04/2026 09:30', 'adminsub40')
ON CONFLICT (id) DO NOTHING;

-- ─── Withdrawals ──────────────────────────────────────────
INSERT INTO withdrawals (id, member, company, bank, account_number, amount, status, date, processed_by) VALUES
('WIT8000', 'budi_gacor', 'vigor88', 'BCA',     '1001234569', 1500000, 'Pending',  '27/04/2026 10:15', ''),
('WIT8001', 'mega_win',   's88pb',   'MANDIRI', '1001234570', 3000000, 'Pending',  '27/04/2026 10:28', ''),
('WIT8002', 'alex99',     'vigor88', 'BCA',     '1001234567', 500000,  'Approved', '26/04/2026 16:00', 'adminsub40'),
('WIT8003', 'susi88',     'tiger88', 'BNI',     '1001234572', 750000,  'Approved', '25/04/2026 11:20', 'adminsub40'),
('WIT8004', 'lucy_star',  's88pw',   'BNI',     '1001234568', 250000,  'Rejected', '25/04/2026 09:45', 'adminsub40')
ON CONFLICT (id) DO NOTHING;

-- ─── Memos ────────────────────────────────────────────────
INSERT INTO memos (id, type, from_user, to_user, subject, body, category, is_read, date) VALUES
('MIN0', 'inbox', 'alex99',     'admin', 'Question about deposit',    'Hello admin, my deposit has not been processed yet...', 'Finance', false, '27/04/2026 09:20'),
('MIN1', 'inbox', 'budi_gacor', 'admin', 'Withdrawal delay',          'Hi, my withdrawal is still pending since yesterday...', 'Finance', false, '27/04/2026 08:45'),
('MIN2', 'inbox', 'mega_win',   'admin', 'Bonus not credited',        'I completed the turnover requirement but bonus...', 'General', true,  '26/04/2026 14:30'),
('MIN3', 'inbox', 'system',     'admin', 'Credit limit warning',      'Company vigor88 has reached 80% of credit limit.', 'System',  true,  '26/04/2026 12:00')
ON CONFLICT (id) DO NOTHING;

-- ─── Announcements ────────────────────────────────────────
INSERT INTO announcements (id, title, content, type, target, status, created) VALUES
('A0', 'System Maintenance Notice', 'Scheduled maintenance on Sunday 02:00-04:00 WIB', 'Warning', 'All Members', 'Active', '2026-04-25'),
('A1', 'New Game Launch',           'Fortune Tiger 2 is now available!',                 'Info',    'All Members', 'Active', '2026-04-20')
ON CONFLICT (id) DO NOTHING;

-- ─── Admin Logs ───────────────────────────────────────────
INSERT INTO admin_logs (id, date, actor, ip, action, target, description) VALUES
('L001', '27 Apr 2026, 10:00:00', 'adminsub40', '103.28.12.45',  'login',           'adminsub40',  'Admin logged in successfully'),
('L002', '27 Apr 2026, 10:05:23', 'adminsub40', '103.28.12.45',  'Approve Deposit', 'DEP5002',     'Deposit DEP5002 approved — Rp 1,000,000'),
('L003', '27 Apr 2026, 10:08:11', 'adminsub40', '103.28.12.45',  'Reject Deposit',  'DEP5004',     'Deposit DEP5004 rejected — invalid proof'),
('L004', '26 Apr 2026, 15:45:30', 'adminsub40', '103.28.12.45',  'Approve Deposit', 'DEP5005',     'Deposit DEP5005 approved — Rp 750,000'),
('L005', '26 Apr 2026, 16:00:00', 'adminsub40', '103.28.12.45',  'Approve Withdraw','WIT8002',     'Withdrawal WIT8002 approved — Rp 500,000')
ON CONFLICT (id) DO NOTHING;
