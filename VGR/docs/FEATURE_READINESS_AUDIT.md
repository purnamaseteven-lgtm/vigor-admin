# VIGOR Feature Readiness Audit

Last updated: 2026-05-05

## Legend
- `Ready`: Wired and functional with real backend path.
- `Partial`: Wired but still has mock/dependency/test gaps.
- `Demo-Only`: Mostly simulated path, not production-safe.

## Feature Matrix
| Feature | Status | Wiring | Main Gaps | Priority |
|---|---|---|---|---|
| Auth & Session | Partial | Supabase auth + profile lookup wired in `js/core/auth.js` | Demo credential fallback still active when Supabase unavailable | High |
| RBAC / Permissions | Partial | Permission matrix + UI gating wired in `js/core/auth.js` | UI hiding is strong, but server-side permission enforcement is limited per route | High |
| Members CRUD | Ready | `js/pages/members.js` -> `window.db` -> `js/core/db.js` | Needs stronger e2e tests and validation consistency | Medium |
| Company/Admin CRUD | Partial | UI + DB paths + admin server routes wired | Server admin APIs depend on service-role config and limited negative-case tests | High |
| Finance (Deposit/Withdrawal) | Partial | Approve/reject/adjust flows wired via DB functions | Provider webhook + reconciliation tests are thin | High |
| Payment Providers (Unopay/Coin2Pay/Sawala) | Partial | Frontend to backend API path wired; webhook handlers exist | Provider availability depends on env; mock mode exists in frontend; no contract tests | High |
| PG Seamless Wallet Backend | Partial | Express endpoints + DB logging + idempotency checks exist | Concurrency/atomicity needs stronger DB transaction/RPC enforcement | Critical |
| Dashboard Analytics | Partial | Real-state rendering + fetch-for-page flow wired | Metrics mixed with seeded/demo data in several modules | Medium |
| Reports | Partial | Multiple report pages wired to state/DB | Some fallback logic and sparse validation tests | Medium |
| CRM (segments/missions/tournaments/push) | Partial | CRUD functions and page actions wired | End-to-end campaign lifecycle tests missing | High |
| Customization / Banners / Announcements | Partial | CRUD + settings save wired | Some UI actions still placeholder ("coming soon") | Medium |
| Tools: Host/Cloudflare | Partial | Backend routes exist and tools UI is wired | Cloudflare routes return mock output when token missing | High |
| Nawala | Partial | UI + settings + scan flow wired | Includes demo simulation paths and fallback targets | Medium |
| Logs & Memo | Ready | UI actions wired to DB save/read methods | Needs notification consistency tests across roles | Medium |

## Environment Gating (Production Blockers)
1. `SUPABASE_URL` + service role key must exist on backend.
2. Payment keys (`UNOPAY_*`, `COIN2PAY_*`, `SAWALA_*`) must be present for full payment functionality.
3. `PG_OPERATOR_TOKEN`, `PG_SECRET_KEY`, and whitelist settings must be validated for seamless wallet.
4. Cloudflare token must be set to avoid mock responses in host tooling.

## Recommended Release Gates
1. Disable or explicitly gate demo/mock code paths per environment.
2. Run smoke checks from `docs/FEATURE_SMOKE_CHECKLIST.md`.
3. Run wiring regression script `node tests/feature-wiring.test.mjs`.
4. Execute seamless wallet integration test in a non-mock env.

## Added Guards (2026-05-07)
1. `tests/pages-registry.test.mjs` now blocks duplicate `pages['...']` registrations.
2. The same test validates each `go('...')` route in `app.html` resolves to a registered page key.
3. `tests/payment-webhook-routes.test.mjs` now runs in-process (no child `spawn`) to avoid environment EPERM failures.
