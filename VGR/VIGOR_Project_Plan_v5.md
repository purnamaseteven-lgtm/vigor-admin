# VIGOR ADMIN PANEL — Project Plan v5.0
**8 Minggu | 5 Mei – 28 Juni 2026 | Go Live Target: 28 Juni 2026**

---

## STATUS AWAL PROJECT

> Hasil audit kode: **UI ~75% selesai** (33+ halaman sudah ada, semua berjalan dari STATE/localStorage mock).
> Fokus kerja = koneksi backend nyata, game API, payment gateway, dan go-live hardening.

---

## MANPOWER & SIZING

### Asumsi
- Development W1–W4 dilakukan di **server lokal** (localhost)
- Infrastructure mulai aktif di **W5 (~50% project)**
- **Tidak ada QA** — testing dilakukan oleh developer sendiri
- **Tidak ada UI/UX** — semua halaman sudah dibangun

### Komposisi Tim

| Kode | Role | Fokus |
|---|---|---|
| **FS** | Full-Stack Developer | Wire UI ke Supabase, form, state, halaman |
| **BE** | Backend Developer | API server, game engine, payment, DB |
| **INF** | Infrastructure Engineer | Server, domain, CI/CD, SSL, monitoring |
| **PO** | Product Owner | Requirement, vendor, koordinasi, UAT |

### Headcount Per Minggu

| Minggu | FS | BE | INF | PO | Jumlah |
|---|---|---|---|---|---|
| W1 | ✅ | ✅ | — | ✅ | **3** |
| W2 | ✅ | ✅ | — | ✅ | **3** |
| W3 | ✅ | ✅ | — | ✅ | **3** |
| W4 | ✅ | ✅ | — | ✅ | **3** |
| W5 | ✅ | ✅ | ✅ | ✅ | **4** ← INF masuk |
| W6 | ✅ | ✅ | ✅ | ✅ | **4** |
| W7 | ✅ | ✅ | ✅ | ✅ | **4** |
| W8 | ✅ | ✅ | ✅ | ✅ | **4** |

```
        W1   W2   W3   W4   W5   W6   W7   W8
FS   ── ████ ████ ████ ████ ████ ████ ████ ████
BE   ── ████ ████ ████ ████ ████ ████ ████ ████
INF  ── ░░░░ ░░░░ ░░░░ ░░░░ ████ ████ ████ ████  ← mulai W5
PO   ── ████ ████ ███░ ███░ ████ ████ ████ ████
```

---

## PHASE OVERVIEW

| Phase | Tema | Minggu | Inti Pekerjaan |
|---|---|---|---|
| **P1** | 🏗️ **Fondasi** | W1 | Environment, Supabase Auth, seluruh data layer |
| **P2** | ⚙️ **Operasional** | W2–W3 | Member, company, finance, bank, admin, CMS, VIP |
| **P3** | 🔌 **PGA Connectivity** | W3–W5 | Semua API eksternal: PGSoft, Togel, Unopay, Coin2Pay, Sawala, Smartico, Cloudflare |
| **P4** | 🌐 **Infrastruktur** | W5–W7 | Server, domain, CI/CD, SSL, monitoring |
| **P5** | 📊 **Pelaporan & Bisnis** | W5–W6 | Report real, commission, bonus, tournament, invoice |
| **P6** | 🔒 **Hardening & Launch** | W7–W8 | Security, performance, UAT, go live |

---

---

# ▌PHASE 1 — FONDASI
### Tema: Semua data hidup dari Supabase, bukan mock
**W1 | 5–11 Mei 2026 | Tim: FS + BE + PO**

---

## Module 1.1 — Environment & Repository

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Supabase Projects | Buat 3 project: `vgr-dev`, `vgr-staging`, `vgr-prod` | Isolasi environment | BE |
| Environment Files | `.env.dev` / `.env.staging` / `.env.prod` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Jangan commit ke Git | BE |
| Database Schema | Jalankan `schema.sql` di `vgr-dev` (semua tabel utama) | PostgreSQL migration | BE |
| RLS Policies | `rls.sql` → policy per tabel per role (anon/authenticated/service) | Security baseline | BE |
| Seed Data | `seed.sql` → data awal: pools, game types, banks, VIP tiers, default settings | Dev/test environment | BE |
| Git Repository | Init repo, branch strategy: `main` / `dev` / `feature/*` / `hotfix/*` | PR template + .gitignore | FS |
| Vendor Sandbox | Daftar & minta sandbox keys: PGSoft, Unopay, Coin2Pay, Sawala | PGSoft butuh 2–4 minggu | PO |
| Kickoff Meeting | Scope lock, timeline confirm, PIC per modul, communication channel | | ALL |
| .env Template | Buat `.env.example` dengan semua keys yang dibutuhkan (no values) | Dokumentasi | BE |

## Module 1.2 — Authentication System

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Sign In | `supabase.auth.signInWithPassword(email, pw)` → ganti demo credentials logic | Update `auth.js` | BE |
| Sign Out | `supabase.auth.signOut()` + clear `STATE` + clear localStorage + redirect login | | BE |
| Session Guard | `requireAuth()` → cek session aktif, redirect ke login jika tidak ada | Update `router.js` | BE |
| Session Refresh | `onAuthStateChange` listener: TOKEN_REFRESHED → silent, SIGNED_OUT → logout UI | | BE |
| Admin Profile Load | Fetch `admin_profiles` WHERE `auth.uid() = id` → populate `STATE.currentAdmin` | | BE |
| Role from DB | `currentAdmin.role` (SuperAdmin/Master/Company/Shop) dibaca dari DB, bukan hardcode | | BE |
| RBAC on Load | `applyRBAC()` dipanggil setelah profile load → sidebar filtered by role | | FS |
| 2FA TOTP Setup | `supabase.mfa.enroll()` → QR code di settings page untuk SuperAdmin | | BE |
| 2FA Challenge | `supabase.mfa.challenge()` → verifikasi TOTP setiap login SuperAdmin | | BE |
| Session Timeout | Auto-logout 30 menit inaktif → event listener `mousemove`, `keypress` reset timer | | FS |
| Login Error UI | Tampilkan error spesifik: "Email tidak ditemukan", "Password salah", "Akun diblokir" | Ganti toast generic | FS |
| Remember Me | Checkbox "Ingat saya" → toggle `persistSession` di Supabase client | | FS |
| Forgot Password | Link kirim reset password via Supabase email | | FS + BE |

## Module 1.3 — Core Data Layer (STATE → Supabase)

> Pattern: render dari STATE cache (instant) → fetch Supabase di background → diff → re-render jika berubah

| Sub-Module | Halaman | Supabase Table | PIC |
|---|---|---|---|
| Fetch Members | `global-member-list` | `members` | FS |
| Fetch Deposits | `deposit-list` | `deposits` | FS |
| Fetch Withdrawals | `withdrawal-list` | `withdrawals` | FS |
| Fetch Companies | `master`, `company-list` | `companies` | FS |
| Fetch Banks | `bank-list` | `banks` | FS |
| Fetch Admins | `admin-management` | `admin_profiles` | FS |
| Fetch Logs | `logs-admin` | `admin_logs` | FS |
| Fetch Memos | `memo` | `memos` | FS |
| Fetch Promotions | `bonus-list` | `promotions` | FS |
| Fetch Bets | `bets-list` | `lottery_bets` + `seamless_transactions` | FS |
| Fetch Results | `results-list` | `lottery_results` | FS |
| Fetch Announcements | `announcement-list` | `announcements` | FS |
| Fetch Settings | Commission, VIP, SEO, site config | `settings` (key-value store) | FS |
| Fetch Notifications | Bell icon | `notifications` | FS |
| `fetchForPage(page)` | Router `go()` trigger fetch sesuai halaman aktif | `db.js` | BE |
| Stale-While-Revalidate | Render STATE → fetch → diff → patch DOM minimal | `router.js` | FS |
| Error State UI | Jika Supabase error → tampilkan retry button di halaman, bukan loading selamanya | | FS |

## Module 1.4 — DB Mutations & Base Layer

| Sub-Module | Fungsi | Operasi | PIC |
|---|---|---|---|
| Member CRUD | `dbAddMember`, `dbUpdateMember`, `dbDeleteMember` (soft) | INSERT / UPDATE / status='Deleted' | BE |
| Deposit Actions | `dbApproveDeposit`, `dbRejectDeposit`, `dbPendingDeposit` | UPDATE + atomic balance | BE |
| Withdrawal Actions | `dbApproveWithdrawal`, `dbRejectWithdrawal` | UPDATE + atomic balance | BE |
| Company CRUD | `dbAddCompany`, `dbUpdateCompany`, `dbToggleCompany` | INSERT / UPDATE | BE |
| Credit Ops | `dbTopUpCredit`, `dbDeductCredit` (company) | UPDATE companies.credit | BE |
| Bank CRUD | `dbAddBank`, `dbUpdateBank`, `dbToggleBank` | INSERT / UPDATE | BE |
| Settings Save | `dbSaveSetting(key, value)` | UPSERT `settings` | BE |
| Audit Log Write | `dbWriteLog(action, target, desc)` | INSERT `admin_logs` (immutable) | BE |
| Realtime Subscribe | `deposits` + `withdrawals` WHERE status=Pending → badge update | Supabase Realtime | BE |
| Realtime Notifications | INSERT `notifications` → bell badge live | Supabase Realtime | BE |

**✅ Gate P1:** Login Supabase bekerja, semua halaman tampil data DB, approve deposit/WD update balance real

---

---

# ▌PHASE 2 — OPERASIONAL
### Tema: Admin bisa menjalankan operasional harian penuh
**W2–W3 | 12–25 Mei 2026 | Tim: FS + BE + PO**

---

## Module 2.1 — Member Management

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Member List | Wire filter (company, bank, status, search, date range) ke Supabase WHERE | Query builder | FS |
| Server-Side Pagination | LIMIT/OFFSET Supabase, bukan fetch-all-then-slice | Performa untuk data besar | FS |
| Add Member | Form → validate → `dbAddMember` → toast + audit log | Username min 3 char, unik | FS |
| Edit Member | Pre-fill dari row Supabase, submit → `dbUpdateMember` | Username disabled | FS |
| Delete Member | Confirm modal → soft delete (`status = Deleted`) | Tidak hard delete | FS |
| Member Detail Modal | Balance real, last login, IP, join date, total deposit, total bet | JOIN dari members + deposits + bets | FS |
| Balance Adjustment | Add/Subtract balance manual → wajib isi alasan → audit log | Sensitive: hanya SuperAdmin | BE + FS |
| Status Management | Active / Inactive / Suspended / Banned dengan confirm + reason + audit log | | FS |
| RBAC Filter | Company role: WHERE company = currentAdmin.company. Shop role: WHERE shop = shop | | FS |
| Member Notes | Admin bisa tambah internal note/komentar per member (tidak terlihat member) | `member_notes` table | FS |
| Reset PIN/Password | Trigger reset password member dari admin panel | `POST /api/members/:id/reset-password` | BE |
| Member Freeze | Temporary block: freeze balance, tidak bisa deposit/WD untuk durasi tertentu | `freeze_until` timestamp | BE |
| Export CSV | Export dengan semua filter aktif, BOM UTF-8 | `exportTableCSV()` | FS |
| Bulk Status Update | Pilih multiple member → set status sekaligus | Checkbox list + bulk action | FS |
| Search by Phone/Email | Search field support search by phone OR email OR username | Multi-field WHERE OR | FS |
| Activity Timeline | Timeline activity terakhir member: login, deposit, bet, WD | Read from multiple tables | FS |

## Module 2.2 — Company & Hierarchy Management

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Company List | Wire ke Supabase, filter: type (Company/Whitelabel/Master), status | | FS |
| Add Company | Form → `dbAddCompany` → INSERT `companies` | Username unik, email valid | FS |
| Edit Company | Update name, email, type, status → `dbUpdateCompany` | | FS |
| Pools Access | Checkbox 12 pool per company → simpan ke `companies.togel_markets` (JSON array) | 12 pool dari GAMES constant | FS |
| Game Provider Access | Checkbox provider per company → simpan ke `companies.allowed_providers` | PG Soft, Pragmatic, dll | FS |
| Credit Top-Up | Form → `dbTopUpCredit` + audit log | Hanya SuperAdmin/Master | BE + FS |
| Credit Deduct | Form deduct + alasan → `dbDeductCredit` + audit log | | BE + FS |
| Credit History | Log semua perubahan credit company → `credit_history` table | Per company timeline | FS |
| Downline Stats | Total member, total deposit today, active today per company | Aggregasi Supabase | BE |
| Member Limit | Setting max member per company → enforce saat add member | `companies.member_limit` | BE |
| Commission Rate | Setting komisi per company (%) simpan ke `settings` | 3 tipe: Company/WL/Master | FS |
| Hierarchy View | Visualisasi: Master → Company → Member (tree atau indented list) | | FS |
| Master Scope | Master hanya bisa lihat/kelola company WHERE parent_id = master.id | RBAC scope | FS |
| Deactivate Company | Nonaktifkan company → semua member jadi Inactive otomatis | Cascade update | BE |

## Module 2.3 — Finance: Deposit Management

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Deposit List | Wire ke `deposits` Supabase, filter: company, bank, method, status, date range | | FS |
| Approve Deposit | `dbApproveDeposit` → atomic: UPDATE status + UPDATE balance | Harus dalam 1 transaksi | BE |
| Reject Deposit | `dbRejectDeposit` → UPDATE status + simpan rejection reason | | BE |
| Manual Deposit | Admin bisa buat deposit manual (cash, transfer offline) → admin approval | `source='manual'` | BE + FS |
| Deposit Proof | Upload bukti transfer (image) per deposit → simpan ke Supabase Storage | | FS |
| Pending Badge | Supabase Realtime: count pending deposits → header badge live | | BE |
| Auto-Notify Bell | Saat deposit baru masuk → INSERT `notifications` → bell update | | BE |
| Deposit Stats Header | Total pending count, total amount pending, total approved hari ini | Aggregasi | FS |
| Bonus Auto-Trigger | Setelah approve first deposit → check promo aktif → auto assign welcome bonus | | BE |
| Export CSV | Export deposit list dengan filter aktif | | FS |
| Daily Limit Check | Validasi: member belum melewati daily deposit limit (jika dikonfigurasi) | | BE |
| Rollover Tracking | Jika deposit ada bonus attached → track rollover requirement | `rollover_tracking` table | BE |

## Module 2.4 — Finance: Withdrawal Management

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Withdrawal List | Wire ke `withdrawals` Supabase, filter: company, bank, status, date range | | FS |
| Approve Withdrawal | `dbApproveWithdrawal` → atomic: UPDATE status + DEDUCT balance | Cek balance cukup dulu | BE |
| Reject Withdrawal | `dbRejectWithdrawal` → balance tidak berubah + reason | | BE |
| Balance Check | Sebelum approve: `IF member.balance < amount → error, jangan approve` | | BE |
| Rollover Check | Cek rollover requirement terpenuhi sebelum boleh WD | Cegah bonus abuse | BE |
| Pending Badge | Realtime badge bersamaan dengan deposit | | BE |
| WD Daily Limit | Validasi: member belum melewati daily WD limit | Configurable per company | BE |
| WD Fee Deduction | Potong biaya admin WD (jika dikonfigurasi) sebelum proses | Configurable | BE |
| Batch Approve | Pilih multiple WD pending → approve sekaligus | Bulk action | FS |
| Auto Reject Timeout | WD pending > X jam tanpa action → auto reject + notif | Cron job | BE |
| Export CSV | | | FS |

## Module 2.5 — Bank Management

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Bank List | Wire ke `banks` Supabase, filter: bank name, type, status | | FS |
| Add Bank | Form → INSERT `banks` | Bank name, account name, number, type (Deposit/WD/Both) | FS |
| Edit Bank | Update data bank → `dbUpdateBank` | | FS |
| Status Toggle | Active/Inactive → inactive bank tidak muncul di form deposit member | | FS |
| Min/Max Deposit | Setting per bank: `min_deposit`, `max_deposit` → enforce saat buat payment | | FS |
| Bank Priority | Urutan bank tampil di deposit form (drag-sort) → `banks.display_order` | | FS |
| Balance Monitoring | Tampilkan total in / total out / net per bank dari `deposits + withdrawals` | Cashflow per bank | FS |
| Bank Schedule | Bank bisa aktif hanya pada jam tertentu (maintenance window) | `active_hours` JSON | BE |

## Module 2.6 — Admin Management

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Admin List | Wire ke `admin_profiles` Supabase, filter: role, company, status | | FS |
| Add Admin | `supabase.auth.admin.createUser` + INSERT `admin_profiles` | Butuh service role key | BE |
| Edit Admin | Update role, company scope, shop assignment | | FS |
| Suspend Admin | `status = Suspended` → block via `supabase.auth.admin.updateUserById` | | BE |
| Delete Admin | Soft delete + revoke session | | BE |
| Admin Detail | Login history, last IP, last active, total actions | Read `admin_logs` | FS |
| Admin Permission Override | Fine-grained permission tambahan di luar role default | `admin_permissions` JSON | BE |
| 2FA Enforcement | SuperAdmin wajib 2FA, role lain opsional | Check `mfa_enrolled` sebelum login | BE |
| IP Restriction | Optionally restrict admin login dari IP tertentu saja | `allowed_ips` array | BE |
| Activity Log per Admin | Filter `admin_logs` by actor untuk lihat history per admin | | FS |
| RBAC Scope | Company admin hanya lihat admin dari company-nya | WHERE company = currentAdmin.company | FS |

## Module 2.7 — Memo & Audit Log

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Memo List | Wire `memo` page ke `memos` Supabase | | FS |
| Add Memo | INSERT `memos` dengan target (all/company/specific admin) | | FS |
| Memo Priority | Level: Info / Warning / Critical → warna berbeda di list | | FS |
| Memo Read Status | Track siapa sudah baca memo → `memo_reads` table | | BE + FS |
| Audit Log List | Wire `logs-admin` ke `admin_logs` Supabase, filter: actor, action, date | | FS |
| Log Search | Search by actor username, action type, target, keyword dalam description | Full-text WHERE ILIKE | FS |
| Log Detail Modal | Tampilkan full detail: request body, IP, user agent, timestamp | | FS |
| Log Export | Export audit log ke CSV dengan filter aktif | | FS |
| Immutable Log | RLS: tidak ada UPDATE/DELETE untuk `admin_logs` semua role | | BE |

## Module 2.8 — Announcement & Notification

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Announcement List | Wire ke `announcements` Supabase | | FS |
| Add Announcement | INSERT: judul, body, target (all/company), aktif dari-sampai | | FS |
| Edit/Delete Announcement | UPDATE/soft-delete `announcements` | | FS |
| Announcement Status | Auto-expire jika tanggal selesai terlampaui → status = Expired | Cron atau client-side check | BE |
| Notification Center | Bell icon → panel list notifications dari `notifications` Supabase | | FS |
| Mark as Read | Click notif → UPDATE `notifications.is_read = true` | | FS |
| Mark All Read | Tombol "baca semua" → batch UPDATE | | FS |
| Realtime Bell | Supabase Realtime: INSERT `notifications` → badge langsung update | | BE |
| Notification Types | deposit_pending, withdrawal_pending, system_alert, member_registered | | BE |

## Module 2.9 — Customization & Site CMS

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Site Config Save | Site name, site URL, support contact, currency, timezone → save `settings` | | FS |
| Maintenance Mode | Toggle maintenance → simpan ke `settings.maintenance_mode` → frontend check | | FS |
| Favicon Upload | Upload favicon → Supabase Storage → save URL ke settings | | FS |
| App Logo Upload | Upload logo → Supabase Storage → save URL ke settings | | FS |
| App List | Manage list apps/games di landing page → `app_list` array di settings | | FS |
| Theme Designer | Color picker 5 variabel (primary, secondary, bg1, bg2, text) → save ke settings | Live preview | FS |
| Theme Presets | 4 preset: Midnight Blue, Emerald Forest, Royal Gold, Cyberpunk → 1-click apply | | FS |
| Font & Radius | Font family selector, border radius setting → save ke settings | | FS |
| Banner Management | CRUD banner carousel → `banners` Supabase (image, title, link, order, active) | | FS |
| Template Selection | Company pilih template dari 30+ opsi (TEMPLATES array) → save ke `companies.template` | | FS |
| Welcome Message | Rich text welcome message per company → save ke settings | | FS |
| Footer Links | Manage footer links (TOS, Privacy, Contact) per site | | FS |

## Module 2.10 — VIP Tier System

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| VIP Config Save | 5 tier: Bronze/Silver/Gold/Platinum/Diamond → save turnover threshold + rebate rate | UPSERT `settings.vip_tiers` | FS |
| VIP Calculation | Cron: hitung total turnover per member → assign tier | Daily batch job | BE |
| Tier Upgrade Logic | Jika turnover ≥ threshold → upgrade tier → INSERT `notifications` | | BE |
| Tier Downgrade | Opsional: downgrade jika tidak aktif > X bulan | Configurable | BE |
| VIP Benefit | Per tier: max WD limit, rebate rate, priority support flag | Dari settings | BE |
| Member VIP Display | Tampilkan tier + progress bar ke threshold berikutnya di member detail | | FS |
| VIP Report | Report: distribusi tier, total turnover per tier | | FS |

## Module 2.11 — SEO & Metadata

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| SEO Settings | Meta title, description, keywords, OG image → save ke `settings` | | FS |
| OG Image Upload | Upload social preview image → Supabase Storage | | FS |
| Robots.txt | Generate/manage robots.txt dari admin panel | Serve dari API server | BE |
| Sitemap | Auto-generate sitemap.xml (public pages) | | BE |

**✅ Gate P2:** Semua operasional harian berjalan (member CRUD, deposit/WD, bank, company, admin, CMS, VIP) dengan data real

---

---

# ▌PHASE 3 — PGA CONNECTIVITY
### Tema: Platform terhubung ke semua layanan eksternal (Payment Gateway & Game API)
**W3–W5 | 19 Mei – 8 Juni 2026 | Tim: FS + BE + PO**

---

## Module 3.1 — PGSoft Seamless API Server

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Express Server Init | Buat `src/server.js` → CORS, JSON body-parser, logging middleware (morgan) | Node.js project | BE |
| Health Endpoint | `GET /health` → return `{ status:'ok', version, timestamp, uptime }` | Untuk uptime monitor | BE |
| Env Config | `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PG_OPERATOR_TOKEN`, `PG_SECRET_KEY`, `PG_SALT` | Service role bypass RLS | BE |
| `/VerifySession` | `POST /api/seamless/VerifySession` → lookup session dari `operator_sessions` → return player + balance | Session lookup | BE |
| `/Cash/Get` | `POST /api/seamless/Cash/Get` → real-time `SELECT balance FROM members WHERE id=?` | | BE |
| `/Cash/TransferInOut` | `POST /api/seamless/Cash/TransferInOut` → BEGIN → UPDATE balance → INSERT `seamless_transactions` → COMMIT | Atomic | BE |
| `/Cash/Adjustment` | `POST /api/seamless/Cash/Adjustment` → koreksi balance + wajib audit log | Reverse/adjustment | BE |
| `/Cash/UpdateBetDetail` | `POST /api/seamless/Cash/UpdateBetDetail` → update metadata bet tanpa ubah balance | | BE |
| Response Format | Semua response: `{ data:{...}, error:null }` atau `{ data:null, error:{code,message} }` | Sesuai PGSoft spec | BE |
| Error Code Map | Semua kode PGSoft v2.4.11: 1204=invalid auth, 1901=insufficient, 1034=not found, 1001=invalid request | | BE |
| Request Logging | Log setiap request masuk (endpoint, params, timestamp, response code, duration) ke `seamless_api_logs` | Max 500 entries | BE |

## Module 3.2 — Seamless Security Layer

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| MD5 Signature Verify | `hash = MD5(sorted_params + secretKey)` per request sebelum proses | Sesuai PGSoft v2.4.11 | BE |
| Salt Validation | Validasi `salt` parameter dari config | | BE |
| Operator Token Check | Validate `operator_token` + `secret_key` di setiap request | | BE |
| Idempotency Table | `seamless_idempotency (round_id, transfer_type)` UNIQUE constraint | | BE |
| Duplicate Rejection | Jika round_id+type sudah ada → return response lama, jangan proses ulang | Kritis untuk cash ops | BE |
| Atomic Balance Update | `BEGIN → SELECT balance FOR UPDATE → check → UPDATE → INSERT → COMMIT` | Row-level lock | BE |
| Balance Guard | Sebelum debit: `IF balance < amount → return error 1901 (Insufficient Balance)` | | BE |
| IP Allowlist | Production: hanya terima dari IP PGSoft yang terdaftar di `settings` | | BE |
| Rate Limiting | 200 req/menit per IP → 429 Too Many Requests | express-rate-limit | BE |
| Timeout Handler | Request timeout 10 detik → return 408, log ke error_logs | | BE |

## Module 3.3 — Seamless Admin Panel

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Config Save | `seamless-config` form → save token, secretKey, salt, endpoints ke `settings` Supabase | | FS |
| Connection Stats | Wire stats: total tx, error rate, avg response ms, last sync → dari `seamless_api_logs` | | FS |
| Transaction List | Wire ke `seamless_transactions` Supabase, filter: company, provider, game, type, date | | FS |
| Transaction Detail Modal | Request body, response body, duration, traceId, player, amount | | FS |
| API Log Viewer | Wire ke `seamless_api_logs` Supabase (500 entri terbaru), sort by timestamp DESC | | FS |
| Error Highlight | Error log merah, filter toggle "errors only" | | FS |
| Error Rate Widget | Hitung % error hari ini vs kemarin → tampil di seamless config page | | FS |
| Test Connection | Tombol → hit `/VerifySession` ke PGSoft staging → tampil raw response + status | | FS |
| Game Catalog Sync | Tombol "Sync Games" → fetch dari PGSoft → upsert ke `seamless_games` | | BE + FS |
| Game Enable/Disable | Per game per company: toggle aktif/nonaktif → `company_games` table | | BE + FS |

## Module 3.4 — Seamless Bug Recovery Tools

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Balance Reconcile | Bandingkan `members.balance` vs SUM(`seamless_transactions`) per member | Deteksi discrepancy | BE + FS |
| Reconcile Report | Tampilkan list member dengan selisih balance + jumlah selisih | | FS |
| Transaction Void | Admin void transaksi → reverse balance + INSERT `admin_logs` | Emergency | BE + FS |
| Manual Balance Fix | Override balance member + alasan wajib → `admin_logs` | Hanya SuperAdmin | BE + FS |
| Drift Alert | Jika balance drift > threshold di setting → warning banner di seamless page | | BE |
| Duplicate TX Finder | Report: cari round_id yang muncul > 1 kali di `seamless_transactions` | | BE |
| Stuck Transaction | Filter tx dengan status Pending > 10 menit → manual resolve | | FS |

## Module 3.5 — Game Management

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Game Catalog | List semua 26 PGSoft games dari `seamless_games` (nama, code, RTP, thumbnail) | | FS |
| Game Search & Filter | Filter by provider, category (slot/live/table), status | | FS |
| Game Enable/Disable | Toggle per game globally (ON/OFF semua company) | | FS |
| Game per Company | Per company: check/uncheck game yang boleh dimainkan | `company_games` junction table | FS |
| Game Launch URL | Generate launch URL: `pgSoft.getLaunchUrl(gameCode, playerId, currency, lang)` | | BE |
| Provider Config | Settings per provider: endpoint, token, secret → simpan ke `settings` | Multiple providers | BE |
| Game Category | Tag game ke category: Slot, Live Casino, Table, Lottery, Arcade | | FS |
| Maintenance Per Game | Set specific game ke maintenance mode dengan pesan custom | | BE + FS |
| Game RTP Config | Tampilkan RTP dari provider + optionally override di platform | | FS |
| New Game Notification | Saat sync menemukan game baru → INSERT `notifications` ke SuperAdmin | | BE |

## Module 3.6 — Lottery / Togel Engine

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Result Input | `openAddResultModal` → form r1-r5 + pool + date → INSERT `lottery_results` | 12 pool: SGP, HKG, SDY, PCSO, Cambodia, Magnum, Damacai, TOTO, 4D Ext/Vigor/Global, 6D Vigor | FS |
| Result Validation | Validasi angka sesuai format pool (4D=4 digit, 6D=6 digit) | | FS |
| Result Publish | Toggle Draft → Published → trigger auto settlement | Status change | FS |
| Auto Settlement Engine | Setelah publish: SELECT `lottery_bets` WHERE pool=X AND date=Y AND status=Pending | Core engine | BE |
| Prize Calculation — 4D | Bet 4 digit tepat × 3000 | Rule dari settings | BE |
| Prize Calculation — 3D | 3 digit belakang tepat × 400 | | BE |
| Prize Calculation — 2D | 2 digit belakang tepat × 70 | | BE |
| Prize Calculation — Colok Bebas | 1 digit ada di posisi manapun × 6 | | BE |
| Prize Calculation — Colok Jitu | 1 digit di posisi spesifik × 35 | | BE |
| Prize Calculation — Colok Macau | 2 digit bebas posisi × 15 | | BE |
| Prize Calculation — Shio | Shio cocok × 11 | 12 shio mapping | BE |
| Prize Calculation — Kembang Kempis | 2D > 50 atau ≤ 50 × multiplier | | BE |
| Prize Calculation — Tengah Tepi | 2D posisi tengah/tepi | | BE |
| Batch Winner Credit | Batch UPDATE balance semua winner + INSERT `admin_logs` per pemenang | Atomic per pool | BE |
| Settlement Summary | INSERT `settlement_reports` setelah settlement selesai | Total bayar, GGR, jumlah winner, per prize type | BE |
| Bets List Wire | Wire `bets-list` ke `lottery_bets` Supabase, filter: pool, game type, member, date, status | | FS |
| Bet Detail Modal | Detail per bet: digit taruhan, jenis taruhan, posisi, odds, hasil | | FS |
| Market Access Check | Validasi pool ada di `company.togel_markets` sebelum izinkan bet | | BE |
| Bet Limit Config | Setting max bet per game type per pool → `settings.bet_limits` | | BE + FS |
| Auto Cut (Tutup Sales) | Otomatis tutup penerimaan bet X menit sebelum result time | Cron job | BE |
| Multi-Period | Support pool yang result 2× sehari (PCSO, Cambodia) | Date + period field | BE |
| Settlement Error Recovery | Jika settlement gagal partial → detect + complete manual | Recovery tool | BE + FS |
| Result History | Archive semua result historis dengan filter per pool per bulan | | FS |

## Module 3.7 — Unopay Payment Gateway

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Credentials Config | `UNOPAY_API_KEY`, `UNOPAY_MERCHANT_ID`, `UNOPAY_WEBHOOK_SECRET` → `.env` + settings panel | | BE |
| Payment Methods Sync | `GET /v3/methods` dari Unopay → simpan methods yang available ke settings | | BE |
| Create VA BCA | `POST /v3/payment/create` → method=VA_BCA → return VA number + expiry | | BE |
| Create VA BNI | VA_BNI | | BE |
| Create VA BRI | VA_BRI | | BE |
| Create QRIS | method=QRIS → return QR code image URL + amount | | BE |
| Create Gopay | method=GOPAY → return deeplink + phone required | | BE |
| Create OVO | method=OVO → return deeplink + phone required | | BE |
| Create Dana | method=DANA → return deeplink | | BE |
| Check Payment Status | `GET /v3/payment/{id}` → polling fallback jika webhook tidak masuk | | BE |
| Webhook Handler | `POST /webhook/unopay` → verify HMAC-SHA256 → UPDATE deposit status | IP whitelist | BE |
| Auto Credit on Success | Webhook success → `dbApproveDeposit` otomatis → member balance naik | | BE |
| Retry Failed | Manual re-check status untuk payment yang stuck > 30 menit | | FS |
| Payment Expiry Handling | Jika VA expired (umumnya 24 jam) → auto-reject deposit | | BE |
| Error Code Display | Map Unopay error codes ke pesan readable di admin | | FS |
| Transaction List Wire | `tools-unopay` page → data real dari `deposits WHERE source='unopay'` | | FS |
| Fee Tracking | Catat `gateway_fee` per transaksi di `deposits` table | | BE |
| Settings Panel | Tampilkan: API version, merchant ID, connection status, last sync, pending count | | FS |

## Module 3.8 — Coin2Pay (Crypto Payment)

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Credentials Config | `COIN2PAY_API_KEY`, `COIN2PAY_SECRET` → `.env` + settings panel | | BE |
| Create BTC Invoice | `POST /api/invoice` → currency=BTC → return address + amount BTC + expiry | | BE |
| Create ETH Invoice | currency=ETH | | BE |
| Create USDT Invoice | currency=USDT (TRC20 / ERC20) | | BE |
| Create BNB Invoice | currency=BNB | | BE |
| Create LTC Invoice | currency=LTC | | BE |
| Rate Conversion | Fetch IDR/crypto rate dari Coin2Pay atau CoinGecko API → convert sebelum credit | | BE |
| Confirmation Tracker | Tampilkan confirmations count (e.g. "2/3 confirmations") per tx | | FS |
| Webhook Handler | Coin2Pay callback → verify signature → UPDATE deposit status | | BE |
| Auto Credit | Setelah confirm → `dbApproveDeposit` + credit IDR equivalent | | BE |
| Crypto Withdrawal | `POST /api/withdrawal` → kirim crypto ke wallet address member | Optional feature | BE |
| Min Confirmation | Setting: berapa konfirmasi chain sebelum credit | Per crypto berbeda | BE |
| Transaction List Wire | `tools-coin2pay` page → data real | | FS |
| Exchange Rate Cache | Cache rate 5 menit, jangan hit CoinGecko per request | | BE |
| Rate Slippage Guard | Jika rate berubah > X% saat settlement → flag untuk manual review | | BE |

## Module 3.9 — Sawala Payment Gateway

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Credentials Config | `SAWALA_TOKEN`, `SAWALA_ENDPOINT` (api.sawala.id/v2), `SAWALA_WEBHOOK_IP` (103.21.44.0) | | BE |
| Create Transaction | `POST /v2/transaction/create` → return payment instruction | | BE |
| Check Status | `GET /v2/transaction/{id}` | | BE |
| Webhook Handler | Terima dari IP `103.21.44.0` → verify token → UPDATE deposit | IP whitelist strict | BE |
| Auto Credit | Webhook success → `dbApproveDeposit` | | BE |
| Last Sync Timestamp | Update `settings.sawala_last_sync` setiap webhook masuk | | BE |
| Transaction List Wire | `tools-sawala` page → data real | | FS |

## Module 3.10 — Payment Routing & Unifikasi

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Method Router | VA/QRIS/ewallet → Unopay; BTC/ETH/USDT/BNB/LTC → Coin2Pay; lainnya → Sawala | Backend routing logic | BE |
| Fallback Logic | Jika Unopay down → fallback ke Sawala untuk IDR methods | Health check per gateway | BE |
| Unified Deposit Record | Semua dari 3 gateway → 1 tabel `deposits`, kolom `source` + `gateway_ref` | | BE |
| Min/Max Enforce | Validasi amount sesuai limit per gateway sebelum buat payment | | BE |
| Fee Calculation | Hitung `gateway_fee` per method → catat di `deposits.gateway_fee` | | BE |
| Gateway Health Widget | Status connect setiap gateway (✅/⚠️/❌) di settings page | Ping health endpoint | FS |
| Payment Timeout Handler | Jika tidak ada webhook dalam X jam → auto-expire deposit | Cron job | BE |
| Webhook Retry | Queue retry jika webhook processing gagal (max 3 kali) | | BE |
| Transaction Reconcile | Match deposit `gateway_ref` dengan record di gateway API untuk deteksi discrepancy | | BE |

## Module 3.11 — Smartico CRM Integration

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Credentials Config | `SMARTICO_API_KEY`, `SMARTICO_BRAND_KEY` → `.env` + settings panel | | BE |
| Player Sync | Sync member baru ke Smartico saat `dbAddMember` berhasil | `POST /api/players` | BE |
| Player Update | Sync perubahan status/tier member ke Smartico | | BE |
| Campaign Fetch | `GET /api/campaigns` → tampilkan di `tools-smartico` page | | BE + FS |
| Campaign List Wire | `tools-smartico` page → data real (name, type, status, players, completion%) | | FS |
| Gamification Events | Kirim events ke Smartico: deposit, bet, WD, login | Fire-and-forget | BE |
| CRM Trigger | Setelah deposit → trigger Smartico event `deposit_success` | | BE |
| Webhook from Smartico | Terima webhook reward dari Smartico → credit bonus ke member | | BE |
| Connection Status | Tampilkan connected status + last sync di settings panel | | FS |

## Module 3.12 — Cloudflare Domain API

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| CF Credentials | `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_ZONE_TEMPLATE_ID` → `.env` API server | Zone:Edit permission | INF + BE |
| Add Domain | `POST /api/domains` → Cloudflare API add site → return NS records untuk dipasang | | BE |
| Remove Domain | `DELETE /api/domains/:id` → remove dari Cloudflare zone + soft-delete DB | | BE |
| DNS Record CRUD | Add/edit/delete DNS record per domain (A, CNAME, TXT) | | BE |
| NS Propagation Check | DNS lookup NS record → status: Propagating / Active / Error | Polling otomatis | BE |
| SSL Status Check | Cloudflare API → SSL mode per domain (Off/Flexible/Full/Strict) | | BE |
| SSL Force HTTPS | Set redirect rule: HTTP → HTTPS via Cloudflare API | | BE |
| Build Template Deploy | Company pilih template → generate build vars → Netlify Deploy Hook / Vercel API | | INF + BE |
| Domain-Company Mapping | Satu company bisa punya multiple domain → `hosts` table | | BE |
| Host List Wire | `tools-host` page → data real dari `hosts` Supabase + Cloudflare status live | | FS |
| Delete Domain Flow | Confirm modal → hapus CF zone + hapus DB + log | | BE + FS |
| Subdomain Auto-Provision | Buat `company-slug.vigorgaming.id` saat company dibuat | | BE |
| Custom Domain Support | Company bisa pakai domain sendiri → add ke CF zone + SSL | | BE |

**✅ Gate P3:** PGSoft VerifySession + TransferInOut live; Deposit VA BCA + QRIS + USDT end-to-end; Togel settlement otomatis; Domain management API berfungsi

---

---

# ▌PHASE 4 — INFRASTRUKTUR
### Tema: Platform siap hidup di internet
**W5–W7 | 2–22 Juni 2026 | Tim: INF + BE + FS + PO (INF aktif penuh)**

---

## Module 4.1 — Server & Hosting Setup

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Domain Register | Beli `admin.vigorgaming.id`, `api.vigorgaming.id`, `vigorgaming.id` | Niagahoster/Domainesia | INF + PO |
| Cloudflare Onboard | Add semua domain ke Cloudflare → update NS di registrar | Universal SSL + DDoS | INF |
| Admin Panel Deploy | `npm run build` → deploy static SPA ke Vercel → bind `admin.vigorgaming.id` | Vite output | INF |
| API Server Deploy | Deploy Express.js ke Railway/Render → bind `api.vigorgaming.id` | Node.js | INF |
| Supabase Production | Create `vgr-prod` → run schema + RLS + seed → pisah dari dev | | INF + BE |
| Environment Variables Prod | Set semua env vars di Vercel + Railway untuk production | Tidak ada hardcode secret | INF |
| SSL Verify | HTTPS aktif semua subdomain, force redirect HTTP → HTTPS | Cloudflare SSL + server | INF |
| CDN Config | Cloudflare cache rules: static assets cached, API tidak cached | | INF |
| DDoS Protection | Cloudflare WAF rules aktif: block common attack patterns | | INF |
| Load Test Baseline | Simulate 100 concurrent users → cek response time < 500ms | Artillery / k6 | BE |

## Module 4.2 — Domain / Host Management Backend

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Domain API Endpoints | `GET/POST/DELETE /api/domains` di Express.js | Proxy ke Cloudflare API | BE |
| DNS API Endpoints | `GET/POST/PUT/DELETE /api/domains/:id/dns` | | BE |
| Status Polling | Background job: cek NS propagation setiap 5 menit → update `hosts.ns_status` | | BE |
| Deploy Webhook | Netlify/Vercel webhook endpoint untuk status deploy template | | INF + BE |
| Multi-Domain Map | Company bisa bind multiple custom domain | | BE |

## Module 4.3 — CI/CD Pipeline

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Build Check | GitHub Actions: setiap PR → `npm run build` → fail PR jika error | | INF |
| Lint Check | `eslint` + `prettier` check di CI | | INF |
| Auto Deploy Admin | Push ke `main` → Vercel auto-deploy admin panel | Vite build | INF |
| Auto Deploy API | Push ke `main` → Railway/Render auto-deploy API server | | INF |
| Branch Protection | `main` branch: require PR + build pass + 1 reviewer sebelum merge | | INF |
| Staging Environment | Deploy ke staging URL setiap push ke `dev` branch | | INF |
| Environment Isolation | `VITE_ENV=production` → disable role simulator bar + demo banner + dev logs | | FS |
| Rollback Plan | Document rollback procedure: revert deploy + restore DB backup | | INF |

## Module 4.4 — Monitoring & Observability

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Sentry Frontend | `@sentry/vite-plugin` → source maps upload → JS error capture production | Error + stack trace | INF |
| Sentry Backend | `@sentry/node` di Express.js → unhandled exception capture | | INF |
| Sentry Alerts | Alert rule: error rate > 5% per 5 menit → email + Slack | | INF |
| Uptime Robot | Monitor: `admin.vigorgaming.id`, `api.vigorgaming.id/health`, Supabase | Alert jika down > 1 menit | INF |
| Database Backup | Supabase Pro: daily backup, point-in-time recovery enabled | | INF |
| Log Aggregation | API server logs → Papertrail/Logtail untuk search debug production | | INF |
| Performance Baseline | Lighthouse audit: target > 80. Core Web Vitals tracking | | FS |
| DB Slow Query Log | Enable Supabase slow query log → optimize queries > 1 detik | | BE |
| Memory/CPU Alert | Railway/Render alert jika RAM > 80% atau CPU > 90% > 5 menit | | INF |

**✅ Gate P4:** Admin panel live di `admin.vigorgaming.id`, API server live, CI/CD otomatis, monitoring aktif

---

---

# ▌PHASE 5 — PELAPORAN & BISNIS
### Tema: Data bisnis nyata untuk pengambilan keputusan
**W5–W6 | 2–15 Juni 2026 | Tim: FS + BE + INF + PO**

---

## Module 5.1 — Dashboard & KPI

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| KPI Widget Wire | 6 widget: Total Deposit, Total WD, Total Member, New Reg, Converted, Active → Supabase aggregasi | SUM/COUNT queries | FS |
| Widget Date Filter | Setiap widget punya filter: Hari Ini / Minggu Ini / Bulan Ini | | FS |
| Widget Drag-Drop Save | Simpan urutan widget ke `settings.saved_widgets` Supabase | | FS |
| Real-time KPI | Supabase Realtime subscription → KPI auto-update tanpa refresh | | BE |
| Company Filter (RBAC) | KPI SuperAdmin = semua. Master = downline-nya. Company = company sendiri | | FS |

## Module 5.2 — Reports & Statistics

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Statistics Page Wire | Wire 5 KPI cards + semua chart ke real Supabase data | | FS |
| Daily Deposit vs WD Chart | Bar chart harian dari aggregasi `deposits` + `withdrawals` per hari | Chart.js | FS |
| GGR Trend Chart | Line chart: GGR (Gross Gaming Revenue) = deposit - WD per hari | | FS |
| New Member Chart | Line chart pendaftaran member per hari/minggu | | FS |
| GGR per Company | SUM(deposits-WD) GROUP BY company + date range filter | | BE + FS |
| GGR per Provider | Aggregate `seamless_transactions` GROUP BY provider | | BE + FS |
| GGR per Game | Aggregate GROUP BY game_id | | BE + FS |
| GGR per Pool | Aggregate `lottery_bets` GROUP BY pool | | BE + FS |
| Win/Loss Report per Member | Net win/loss per member dari `seamless_transactions` + `lottery_bets` | | BE + FS |
| Bank Cashflow Analysis | Total in / total out / net per bank dari `deposits + withdrawals` | | FS |
| Company Performance | Total deposit, WD, member count, GGR, commission per company | | FS |
| Provider Performance | Total bet, GGR, RTP actual per provider | | FS |
| Date Range Filter | startDate/endDate untuk semua report → Supabase WHERE clause | | FS |
| Export CSV All Reports | `exportTableCSV()` untuk setiap report | | FS |
| Report Snapshot | Simpan snapshot report ke `report_snapshots` untuk akses historis | | BE |

## Module 5.3 — Commission Engine

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Commission Config Save | Rate per company type (Company/Whitelabel/Master) → UPSERT `settings` | | FS |
| Commission Formula | `GGR × rate = komisi` per company per periode | | BE |
| Settlement Trigger | Manual trigger atau cron weekly → hitung komisi → INSERT `commissions` | | BE |
| Commission Report Wire | Wire report page ke `commissions` Supabase, filter: company, date range | | FS |
| Commission Detail | Breakdown: GGR per game type, rate applied, total komisi | | FS |
| Commission History | Timeline komisi per company bulanan | | FS |

## Module 5.4 — Bonus & Promotions Engine

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Promo List Wire | Wire `bonus-list` → `promotions` Supabase | | FS |
| Add/Edit Promo | Form: nama, tipe, nilai (flat/%), min deposit, max bonus, durasi, target company | INSERT/UPDATE `promotions` | FS |
| Promo Type: Welcome Bonus | First deposit × rate → auto-trigger saat approve first deposit | | BE |
| Promo Type: Deposit Bonus | Setiap deposit dalam range × rate → admin approve atau auto | | BE |
| Promo Type: Cashback | Net loss per periode × rate → batch credit Senin pagi | | BE |
| Promo Type: Referral | Member A refer B → A dapat bonus saat B deposit pertama | `referral_tracking` table | BE |
| Promo Type: Birthday | Auto-detect member ulang tahun → assign bonus | Cron daily | BE |
| Promo Type: Freebets | Assign freebets → `freebets` table → bisa dipakai tanpa deposit | | BE |
| Promo Type: Seasonal | Promo waktu terbatas (Lebaran, Natal, dll) dengan countdown | | BE |
| Bonus Code | Generate kode promo → member input kode → claim | `promo_codes` table | BE + FS |
| Claim History | `promotion_claims` table → track siapa claim kapan dengan nilai berapa | | BE |
| Manual Assign Bonus | Admin assign bonus ke member spesifik → UPDATE balance + INSERT claim | | BE + FS |
| Cashback Batch Runner | Cron Senin 00:00 → hitung net loss per member minggu lalu → batch credit | | BE |
| Rollover Requirement | Setiap bonus punya rollover X× → track di `rollover_tracking` | | BE |
| Rollover Progress | Tampilkan progress rollover per member di member detail modal | | FS |
| Wagering Validator | Sebelum approve WD → cek rollover terpenuhi | | BE |
| Bonus Report | Report: total bonus dikeluarkan, per tipe, per company, per bulan | | FS |

## Module 5.5 — Tournament System

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Tournament List | Wire `invoice-tournament` page ke `tournaments` Supabase | | FS |
| Create Tournament | Form: nama, tipe (bet volume/win count/GGR), start-end date, prize pool | INSERT `tournaments` | FS |
| Edit/Cancel Tournament | UPDATE/soft-delete | | FS |
| Leaderboard Real-time | Hitung ranking member berdasarkan kriteria tournament → live update | Supabase Realtime | BE + FS |
| Winner Determination | Setelah end date: finalize winner list berdasarkan leaderboard | | BE |
| Prize Distribution | Admin klik "Pay" per winner → UPDATE balance + INSERT log | | BE + FS |
| Bulk Pay | Tombol "Pay All Winners" → batch credit semua winner | | BE + FS |
| Tournament History | Archive semua tournament yang sudah selesai | | FS |
| Multi-Game Tournament | Tournament lintas game (slot + togel combined) | | BE |

## Module 5.6 — Invoice & Billing System

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Invoice List Wire | Wire `invoice-monthly` page ke `invoices` Supabase | | FS |
| Auto-Generate Invoice | Cron awal bulan → generate invoice per company: platform fee + license fee + tx fee | INSERT `invoices` | BE |
| Invoice Detail | Breakdown per fee type dengan periode | | FS |
| Invoice Status | Unpaid / Paid / Overdue dengan due date | | FS |
| Mark as Paid | Admin konfirmasi pembayaran → UPDATE `invoices.status = Paid` + audit log | | FS |
| Invoice PDF Export | Generate PDF invoice per company per bulan | PDFKit atau HTML → PDF | BE |
| Overdue Alert | Cron check: invoice > due date → INSERT `notifications` ke SuperAdmin | | BE |
| Fee Config | Platform fee, license fee rate → configurable di `settings` | | FS |

## Module 5.7 — Betting & Game Reports

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Bets List Wire | Wire `bets-list` ke `lottery_bets` + `seamless_transactions` gabung | Filter: pool, game, member, date, status | FS |
| Bet Detail Modal | Digit/guess, jenis taruhan, odds, prize, hasil final | | FS |
| Win/Loss Summary | Per member: total bet, total win, total loss, ROI% | | FS |
| Pool Performance | Per pool: total bet amount, total prize paid, GGR, margin | | FS |
| Provider Bet Stats | Total handle (total bet) per provider per hari | | FS |
| Export Bet Report | CSV export dengan semua filter aktif | | FS |

**✅ Gate P5:** Semua report tampil data nyata, commission dihitung, bonus bisa di-assign, tournament berjalan, invoice auto-generate

---

---

# ▌PHASE 6 — HARDENING & LAUNCH
### Tema: Platform aman, stabil, dan siap publik
**W7–W8 | 16–28 Juni 2026 | Tim: FS + BE + INF + PO**

---

## Module 6.1 — Security Hardening

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| RLS Final Audit | Test semua tabel dengan anon key → zero data bocor | Supabase SQL tester | BE |
| RLS Penetration Test | Coba akses tabel sebagai role berbeda → confirm blocked | | BE |
| CORS Strict | API server: hanya terima dari `admin.vigorgaming.id` + webhook IPs | `cors({ origin: [...] })` | BE |
| Input Sanitization | Strip HTML tags dari semua form input, parameterized query | XSS + SQLi prevention | FS + BE |
| Webhook IP Whitelist | Unopay IP list, Coin2Pay signature verify, Sawala `103.21.44.0` strict | | BE |
| Content Security Policy | Set CSP header di Cloudflare + API server | Blokir inline scripts | INF |
| Secret Rotation | Rotate: Supabase anon key, Seamless secretKey, payment gateway keys | Sebelum go live | INF + BE |
| Audit Log Lock | RLS `admin_logs`: tidak ada UPDATE/DELETE untuk semua role termasuk service | | BE |
| Remove Dev Tools | Role simulator bar NONAKTIF jika `VITE_ENV=production` | | FS |
| Demo Credentials | Disable `adminsub40/vgr-demo-2026` di production | | BE |
| Session Hardening | Cookie: `httpOnly=true`, `secure=true`, `sameSite=strict` | | BE |
| HTTPS Everywhere | Force HTTPS di Cloudflare + Express (helmet middleware) | | INF |
| Rate Limit Tuning | Tune per endpoint: auth=10 req/mnt, API=200 req/mnt, webhook=50 req/mnt | | BE |
| Admin Login Alert | Email alert ke SuperAdmin saat login dari IP baru | | BE |

## Module 6.2 — Performance Optimization

| Sub-Module | Task | Detail | PIC |
|---|---|---|---|
| Bundle Split | Vite code splitting: lazy import per halaman → target < 400KB gzip initial | | FS |
| Tree Shaking | Audit unused imports → remove → smaller bundle | | FS |
| DB Indexes | Index: `deposits(status, company, created_at)`, `members(company, status)`, `seamless_transactions(round_id)` | Supabase migration | BE |
| Query Optimization | Semua list: LIMIT/OFFSET, SELECT kolom minimal (no `SELECT *`) | | BE + FS |
| API Cache | Cache `/Cash/Get` balance 1 detik → cegah N+1 saat burst game bets | In-memory / Redis | BE |
| Settlement Performance | Batch UPDATE winner balance dalam 1 query, bukan loop per member | | BE |
| Image Optimization | Compress favicon, logo, banner, template thumbnails + lazy load | | FS |
| Font Preload | Preload font via `<link rel="preload">` untuk FOUT prevention | | FS |
| Lighthouse Audit | Target: Performance > 80, Accessibility > 90, Best Practices > 90 | | FS |
| DB Connection Pool | Optimize Supabase connection pooling di API server | PgBouncer | BE |

## Module 6.3 — UAT & Acceptance Testing

| Sub-Module | Skenario | Ekspektasi | PIC |
|---|---|---|---|
| Auth SuperAdmin + 2FA | Login dengan credentials real + TOTP | Dashboard penuh, sidebar tidak filtered | FS + PO |
| Auth Company Admin | Login Company role | Data filtered by company, menu terbatas sesuai RBAC | FS + PO |
| Auth Master Agent | Login Master role | Hanya lihat downline company-nya | FS + PO |
| Add Member Full Flow | Add → login → deposit → bet → WD | Semua berhasil, balance tepat | FS |
| Deposit VA BCA E2E | Generate VA → bayar di sandbox → webhook → balance naik | < 5 detik setelah webhook | BE + PO |
| Deposit QRIS | Generate QR → konfirmasi sandbox → balance naik | | BE + PO |
| Deposit Gopay/OVO | Generate deeplink → konfirmasi → balance naik | | BE + PO |
| Deposit USDT | Generate invoice Coin2Pay → konfirmasi → balance IDR naik | Rate conversion akurat | BE + PO |
| Withdrawal Approve | WD request → admin approve → balance turun + audit log | Atomic, no negative balance | BE |
| Seamless VerifySession | PGSoft ping VerifySession | Player data + balance return benar | BE |
| Seamless TransferInOut | Debit + Credit | Balance atomic, idempotency test (kirim 2× roundId sama) | BE |
| Togel Full Cycle | Input result → publish → settlement → winner dapat balance | Prize sesuai odds config | BE |
| Commission Calculation | Trigger settlement commission | Jumlah komisi sesuai GGR × rate | BE |
| Tournament Create & Pay | Create → member bet → close → pay winners | Leaderboard akurat | FS + BE |
| Domain Add | Add domain → NS check | Status update Propagating | INF |
| Multi-tab Realtime | Deposit approve di tab 1 | Badge hilang di tab 2 tanpa refresh | BE |
| Report CSV Export | Export GGR report | File download, data akurat, BOM UTF-8 | FS |
| PGSoft Production Keys | Test dengan production API key PGSoft | VerifySession sukses | BE + PO |
| Smartico Sync | Add member → check Smartico dashboard | Player terdaftar di Smartico | BE + PO |
| Security: RLS Test | Akses tabel dengan anon key | Zero data leak | BE |
| Performance | Load test 100 concurrent users | Response < 500ms, zero 500 errors | ALL |

## Module 6.4 — Go Live Execution

| Sub-Module | Task | PIC | Hari |
|---|---|---|---|
| Migration Check | Verifikasi semua schema + RLS + seed di `vgr-prod` | BE | H1 (23 Jun) |
| Data Migration | Migrate data staging ke production jika ada data riil | BE + INF | H1 (23 Jun) |
| Staging Final Smoke Test | Full smoke test di staging environment | FS + BE | H2 (24 Jun) |
| UAT Demo Walkthrough | Demo ke stakeholder semua modul utama | PO + ALL | H3 (25 Jun) |
| UAT Bug Triage | Kategorisasi bug: P0/P1/P2. Fix P0 + P1 dulu | FS + BE | H3–H4 (25–26 Jun) |
| PGSoft Prod Credentials | Final test seamless dengan PGSoft production API | BE | H4 (26 Jun) |
| Payment Gateway Prod | Final test Unopay + Coin2Pay + Sawala production | BE + PO | H4 (26 Jun) |
| Go Live Checklist | Semua item verified: SSL, auth, gateway, game, monitoring, backup | PO + INF | H5 (27 Jun) |
| Vendor Notification | Beritahu PGSoft + Unopay + Coin2Pay switch ke production | PO | H5 (27 Jun) |
| DNS Cutover | Point `admin.vigorgaming.id` + `api.vigorgaming.id` ke production server | INF | H5 (27 Jun) |
| Smoke Test Production | Quick test 8 flow utama di URL production | FS + BE | H5 (27 Jun) |
| **🚀 GO LIVE** | Announce ke stakeholder, post-launch monitoring aktif | ALL | **28 Jun 2026** |
| Hypercare H+1 | Monitor Sentry + Uptime + Supabase Dashboard aktif 24 jam | ALL | H6 (29 Jun) |
| Hypercare H+2 | Triage bug report, deploy hotfix jika ada P0 | ALL | H7 (30 Jun) |

**✅ Gate P6 (Final):** UAT sign-off, zero P0 bug, production live & stabil, hypercare aktif

---

---

## MASTER TIMELINE TABLE

| Phase | Tema | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 |
|---|---|---|---|---|---|---|---|---|---|
| **P1** | 🏗️ Fondasi | ████ | | | | | | | |
| **P2** | ⚙️ Operasional | | ████ | ████ | | | | | |
| **P3** | 🔌 PGA Connectivity | | | ████ | ████ | ████ | | | |
| **P4** | 🌐 Infrastruktur | | | | | ████ | ████ | ████ | |
| **P5** | 📊 Pelaporan & Bisnis | | | | | ████ | ████ | | |
| **P6** | 🔒 Hardening & Launch | | | | | | | ████ | ████ |

---

## TIMELINE PER MINGGU — RINGKASAN

| Minggu | Tanggal | Orang | Deliverable Utama |
|---|---|---|---|
| **W1** | 5–11 Mei | 3 | Supabase env, Auth real + 2FA, semua halaman tampil data DB, approve deposit/WD functional |
| **W2** | 12–18 Mei | 3 | Member CRUD lengkap, company hierarchy, deposit/WD atomic, bank management, admin management |
| **W3** | 19–25 Mei | 3 | CMS/customization, VIP tiers, Unopay end-to-end (VA/QRIS/Gopay/OVO/Dana), PGSoft server init |
| **W4** | 26 Mei–1 Jun | 3 | Coin2Pay + Sawala, payment routing, Seamless VerifySession + Cash/Get + TransferInOut + security |
| **W5** | 2–8 Jun | 4 | Seamless idempotency + tools, Togel engine + settlement, Domain API, Server deploy, Dashboard KPI |
| **W6** | 9–15 Jun | 4 | Reports real (GGR/bank/provider), commission, bonus engine, tournament, invoice, CI/CD + monitoring |
| **W7** | 16–22 Jun | 4 | Security hardening, performance optimization, UAT full, Smartico integration, PGSoft prod test |
| **W8** | 23–28 Jun | 4 | UAT bug fix, DNS cutover, go live checklist, **🚀 Go Live 28 Juni**, hypercare |

---

## DEPENDENCY EKSTERNAL

| Vendor | Dibutuhkan Untuk | Submit | SLA | Risk |
|---|---|---|---|---|
| **PGSoft** | Seamless game API | W1 H1 — URGENT | 2–4 minggu approval | ⚠️ Block P3 game module |
| **Unopay** | Payment VA/QRIS/e-wallet IDR | W1 H2 | 1–3 hari | Rendah |
| **Coin2Pay** | Crypto deposit/withdrawal | W1 H2 | 1–2 hari | Rendah |
| **Sawala** | Alternative payment gateway | W1 H2 | 1–3 hari | Rendah |
| **Smartico** | CRM + gamification | W3 | 3–7 hari | Rendah |
| **Cloudflare** | DNS + domain management | W5 | Langsung | Rendah |
| **Domain Registrar** | `.id` domain purchase | W4 | 1 hari | Rendah |

> ⚠️ **Hari 1 Prioritas:** Submit PGSoft integration request. Ini satu-satunya blocker eksternal yang tidak bisa dipercepat internal. Kerjakan Phase 1–2 sambil tunggu approval PGSoft.

---

## TOTAL MODULE & SUB-MODULE SUMMARY

| Phase | Modul | Sub-Modul / Task |
|---|---|---|
| P1 — Fondasi | 4 modul | 47 tasks |
| P2 — Operasional | 11 modul | 95 tasks |
| P3 — PGA Connectivity | 12 modul | 111 tasks |
| P4 — Infrastruktur | 4 modul | 38 tasks |
| P5 — Pelaporan & Bisnis | 7 modul | 67 tasks |
| P6 — Hardening & Launch | 4 modul | 57 tasks |
| **TOTAL** | **42 modul** | **~415 tasks** |

---

## ESTIMASI BIAYA

### Tim (8 Minggu)

| Role | Mulai | Rate/Bulan | Total |
|---|---|---|---|
| Full-Stack Developer | W1 | Rp 12–18 juta | Rp 24–36 juta |
| Backend Developer | W1 | Rp 12–15 juta | Rp 24–30 juta |
| Infrastructure Engineer | **W5** (1 bulan) | Rp 10–15 juta | **Rp 10–15 juta** |
| Product Owner | W1 | Rp 10–15 juta | Rp 20–30 juta |
| **Total Tim** | | | **Rp 78–111 juta** |

### Infrastructure (per bulan)

| Item | Estimasi Biaya |
|---|---|
| Supabase Pro | $25/bln |
| Vercel Pro | $20/bln |
| Railway / Render (API Server) | $10–20/bln |
| Sentry | $26/bln |
| UptimeRobot | $7/bln |
| Domain `.id` + SSL | Rp 200rb/thn |
| **Total Infra** | ~$88–98/bln ≈ Rp 1,4–1,6 juta/bln |

---

*VIGOR Project Plan v5.0 — Dibuat: 4 Mei 2026*
*Tim: 3 orang W1–W4 → 4 orang W5–W8 | Infrastructure mulai W5 | Tanpa QA*
*42 Modul | ~415 Tasks | 6 Phase | Go Live: 28 Juni 2026*
