# Feature Smoke Checklist (Pre-Release)

Last updated: 2026-05-05

## 1) Auth & Access
1. Login with active SuperAdmin account.
2. Confirm protected route redirects when session is missing.
3. Switch role and validate menu/action visibility changes.

## 2) Members/Company/Admin
1. Create member, edit status, delete member.
2. Create company and update company status.
3. Create admin user through Admin Management (backend route check).

## 3) Finance & Wallet
1. Create manual deposit and approve it.
2. Create withdrawal and reject it.
3. Run balance adjustment and verify member balance changes.

## 4) Payment Providers
1. Unopay create + status check.
2. Coin2Pay create + status check.
3. Sawala create call.
4. Trigger each webhook payload and verify deposit auto-approval behavior.

## 5) Seamless Wallet
1. VerifySession with valid player.
2. Cash/Get for existing player.
3. TransferInOut idempotency test (same transaction id twice).
4. Adjustment with negative balance guard.

## 6) CRM
1. Create segment, mission, tournament, automation rule, and push campaign.
2. Activate/deactivate and delete each item.
3. Validate loyalty points update path.

## 7) Customization/Tools
1. Save announcement and promotion changes.
2. Save GTM/Pixel/Hotjar settings.
3. Run host/cloudflare tooling and confirm non-mock response.
4. Run Nawala scan with configured targets.

## 8) Final Verification
1. `npm run build` (frontend)
2. `node --check server/index.js` (backend syntax)
3. `node tests/feature-wiring.test.mjs` (wiring regression)
