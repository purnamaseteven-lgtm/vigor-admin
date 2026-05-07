# VIGOR Project Architecture & Page Correlation Audit

Tanggal audit: 2026-05-07
Repo: `C:\Project\Git\Git\bin\VGR`

## 1) Executive Summary
- Build produksi: `PASS` (`npm run build`)
- Test critical suite: `PASS` (`npm run test:critical`)
- Guard route/page registry: `PASS` (`tests/pages-registry.test.mjs`)
- Status umum: sistem dalam kondisi fungsional untuk alur utama dashboard, data CRUD, integrasi payment/seamless, CRM, reporting, customization.

## 2) Arsitektur Tingkat Tinggi
- Frontend SPA:
  - Entry: `js/main.js`
  - Router: `js/core/router.js`
  - State: `js/core/state.js`
  - Data layer (Supabase bridge): `js/core/db.js`
  - Page modules: `js/pages/*.js`
  - UI primitives/components: `js/ui/components.js`, `js/ui/charts.js`
- Backend API (Express):
  - Entry: `server/index.js`
  - Seamless wallet routes: `server/routes/seamless.js`
  - Payment routes/webhooks: `server/routes/payment.js`
  - Cloudflare tools routes: `server/routes/cloudflare.js`
  - Admin routes: `server/routes/admin.js`
  - Middleware auth/session: `server/middleware/*.js`
- Database:
  - Supabase schema/migrations: `supabase/schema.sql`, `supabase/migrations/*.sql`
  - Edge function terkait seamless: `supabase/functions/seamless-wallet/index.ts`

## 3) Routing Runtime (Lazy Module Resolver)
Sumber: `js/main.js` (`lazyPageModules`).

- `dashboard` -> `js/pages/dashboard.js`
- `logs-*`, `invoice-*`, `tools-*` -> `js/pages/tools.js`
- `*member*`, `tier-history` -> `js/pages/members.js`
- `*finance*`, `*deposit*`, `*withdraw*`, `*bank*` -> `js/pages/finance.js`
- `*setting*`, `profile` -> `js/pages/settings.js`
- `*bet*`, `*lottery*`, `*game*`, `*transfer*` -> `js/pages/betting.js`
- `*admin*`, `dev-menu-config`, `system-*` -> `js/pages/admins.js`
- `*custom*`, `*template*`, `*widget*`, `*vip*`, `*tier*`, `*announc*`, `*rebate*`, `*seo*`, `site-config` -> `js/pages/customization.js` (+ `js/builder/engine.js`)
- `*memo*`, `logs-admin` -> `js/pages/logs-memo.js`
- `*notif*` -> `js/pages/missing-pages.js`
- `*company*`, `*whitelabel*`, `*agent*`, `my-downlines`, `master` -> `js/pages/company.js`
- `*result*` -> `js/pages/results.js`
- `*bonus*`, `*promo*` -> `js/pages/bonus.js`
- `*report*`, `statistics`, `*analytic*`, `provider-*`, `device-report` -> `js/pages/reports.js`
- `seamless-sandbox` -> `js/pages/seamless-sandbox.js`
- `*seamless*`, `*pgsoft*` -> `js/pages/seamless.js`
- `*master*`, `whitelist`, `blacklist` -> `js/pages/master.js`
- `rbac-management` -> `js/pages/rbac.js`
- `branding-settings` -> `js/pages/branding.js`
- `security-center` -> `js/pages/security.js`
- `*crm*` -> `js/pages/crm.js`
- `*manual*` -> `js/pages/manual.js`
- `*nawala*`, `*sawala*` -> `js/pages/nawala.js`
- `*autonomous*`, `agent-*` -> `js/pages/autonomous.js`
- `risk-management` -> `js/pages/risk.js`
- `*simulator*` -> `js/pages/simulator.js`
- Fallback -> `js/pages/missing-pages.js`

## 4) Page Map dari Menu (`app.html`) dan Modulnya

### Home
- `dashboard` -> `js/pages/dashboard.js`
- `statistics` -> `js/pages/reports.js`
- `provider-analytics` -> `js/pages/reports.js`

### Master/Company/Whitelabel/Members/Bank/Finance
- `master` -> `js/pages/company.js`
- `company-create`, `company-list`, `company-tree`, `master-whitelabel-list`, `whitelabel-list`, `my-downlines`, `bank-create`, `profile` -> `js/pages/company.js`
- `global-member-list`, `tier-history` -> `js/pages/members.js`
- `bank-list`, `deposit-list`, `withdrawal-list` -> `js/pages/finance.js`

### Seamless
- `seamless-config`, `seamless-transactions`, `seamless-games`, `seamless-api-logs`, `seamless-docs` -> `js/pages/seamless.js`

### Bets/Results/Bonus/Settings
- `bets-table`, `bets-list`, `bets-transferred` -> `js/pages/betting.js`
- `results-list`, `results-scan`, `results-analyze`, `results-live` -> `js/pages/results.js`
- `bonus-agent-freebet`, `bonus-freebet-report`, `bonus-report`, `bonus-pragmatic-frb` -> `js/pages/bonus.js`
- `settings-commission`, `settings-referral-rate`, `settings-pools`, `settings-games`, `settings-agent-games`, `settings-togel-commission`, `settings-limit-credit-out` -> `js/pages/settings.js`

### Customization
- `custom-site-config`, `custom-template`, `custom-global-banner`, `custom-promotion-list`, `custom-theme`, `custom-vip`, `custom-seo`, `custom-app-notification`, `template-builder`, `template-preview` -> `js/pages/customization.js`
- `widget-library`, `widget-configure` -> `js/pages/missing-pages.js`

### Tools/CRM/Memo/Reports/Invoice/Logs
- `tools-unopay`, `tools-coin2pay`, `tools-sawala`, `tools-smartico`, `tools-host`, `archive-logs`, `invoice-tournament`, `invoice-monthly`, `invoice-file`, `logs-company`, `logs-whitelabel`, `logs-master-wl`, `logs-member` -> `js/pages/tools.js`
- `nawala-scan` -> `js/pages/nawala.js`
- `crm-dashboard`, `crm-segments`, `crm-missions`, `crm-tournaments`, `crm-automation`, `crm-push`, `crm-dormancy`, `crm-loyalty` -> `js/pages/crm.js`
- `memo-list`, `memo-auto`, `logs-admin` -> `js/pages/logs-memo.js`
- `reports-agent-daily`, `reports-winloss`, `reports-limit-credit`, `reports-togel-lost`, `reports-lost-money`, `reports-top-turnover`, `provider-analytics` -> `js/pages/reports.js`

### Autonomous
- `autonomous-dashboard`, `autonomous-agents`, `autonomous-plans` -> `js/pages/autonomous.js`
- `risk-management` -> `js/pages/risk.js`

## 5) Korelasi Data Layer (Frontend <-> Supabase)
Sumber utama: `js/core/db.js`.

- `window.db` mengekspos fetch + CRUD untuk:
  - Members, Companies, Banks
  - Deposits/Withdrawals
  - Memos, Logs, Settings
  - Seamless transactions/games/api logs
  - Promotions/Bonuses/Announcements/Notifications
  - Lottery bets/results
  - CRM (segments, missions, tournaments, automation, push, loyalty)
  - Popup banners + system notifications
- Strategi: stale-while-revalidate.
  - Page render dari `STATE`.
  - `fetchForPage(page)` refresh dari Supabase background.
  - Re-render jika data baru masuk.

## 6) Korelasi API Backend
Sumber route: `server/routes/*.js`, mount di `server/index.js`.

- Mounted prefixes:
  - `/api/seamless` -> seamless router
  - `/api/webhooks` -> payment router
  - `/api/payments` -> payment router
  - `/api/cloudflare` -> cloudflare router
  - `/api/admin` -> admin router

### Seamless endpoints (`server/routes/seamless.js`)
- `POST /VerifySession`
- `POST /Cash/Get`
- `POST /Cash/TransferInOut`
- `POST /Cash/Adjustment`
- `POST /Cash/UpdateBetDetail`

### Payment endpoints (`server/routes/payment.js`)
- Provider proxy (admin):
  - `POST /unopay/create`, `POST /unopay/status`
  - `POST /coin2pay/create`, `POST /coin2pay/status`
  - `POST /sawala/create`
- Webhooks:
  - `POST /unopay`
  - `POST /coin2pay`
  - `POST /sawala`

### Cloudflare endpoints (`server/routes/cloudflare.js`)
- `POST /add-domain`
- `POST /remove-domain`
- `POST /update-redirect`
- `GET /domains`
- `GET /check-propagation/:zoneId`

### Admin endpoints (`server/routes/admin.js`)
- `POST /create-user`
- `POST /delete-user`
- `POST /reset-password`

## 7) Security Posture (Current)
- Seamless credentials server-side (`PG_OPERATOR_TOKEN`, `PG_SECRET_KEY`), bukan `VITE_*`.
- Signature verification enforced default (`PG_REQUIRE_SIGNATURE=true`).
- IP handling hardened via normalized `req.ip` + optional `TRUST_PROXY`.
- Critical tests sudah include page-registry guard untuk cegah duplicate page key / route orphan.

## 8) Audit Functional Verdict
- Build: PASS
- Test critical: PASS
- Registry check route/menu -> page: PASS
- Kesimpulan: baseline fungsional aplikasi dalam kondisi baik untuk release internal.

## 9) Known Residual Risks / Gaps
- Belum ada full browser click-through E2E untuk setiap halaman dengan assertion DOM (saat ini validasi via build + route registry + unit/integration tests).
- Masih ada beberapa file legacy/backup (`*-legacy`) yang tidak aktif, perlu housekeeping berkala agar tidak membingungkan maintainer baru.

