# PGSoft API Integration Request — Email Template

**To:** api@pgsoft.com  
**CC:** support@pgsoft.com  
**Subject:** Seamless Wallet API Integration Request — VIGOR Platform (Operator ID: VGR-2026)

---

Dear PGSoft Integration Team,

We are writing to formally request API credentials and integration support for the **VIGOR Gaming Platform**, a licensed online gaming operator seeking to integrate PGSoft's Seamless Wallet solution.

## 1. Operator Information

| Field | Details |
|-------|---------|
| Company Name | VIGOR Group |
| Platform Name | VIGOR Admin |
| Contact Person | Purnama Steven |
| Email | purnama.seteven@kreditplusteknologi.id |
| Website (Frontend) | https://vigor-admin.vercel.app |
| Backend Server | https://vigor-backend.up.railway.app *(pending Railway deploy)* |
| Integration Type | Seamless Wallet (Server-to-Server) |
| PGSoft API Version | v2.4.11 |

## 2. Technical Details

### Callback / Seamless Endpoint URL
```
https://vigor-backend.up.railway.app/api/seamless
```

### Specific Endpoints Implemented
- `POST /api/seamless/VerifySession`
- `POST /api/seamless/Cash/Get`
- `POST /api/seamless/Cash/TransferInOut`
- `POST /api/seamless/Cash/Adjustment`
- `POST /api/seamless/Cash/UpdateBetDetail`

### Server IP (for whitelist)
Please advise the Railway server IP range once our project is deployed.  
We will confirm the exact outbound IP within 24 hours of deployment.

Estimated IP range: Railway's shared infrastructure (we can provide static IP via Railway Pro if required).

### Whitelisted PGSoft IPs (we will allow these)
Please provide the full list of PGSoft callback server IPs to whitelist on our server.

## 3. Integration Readiness

Our integration is complete and pending credentials:
- ✅ All 5 Seamless endpoints implemented (Node.js / Express)
- ✅ MD5 signature validation per PGSoft v2.4.11 spec
- ✅ Idempotency handling for TransferInOut (duplicate transaction prevention)
- ✅ Balance in IDR (dividing by 1000 for PGSoft base currency)
- ✅ Session management via Supabase PostgreSQL
- ✅ Error codes per PGSoft specification (0=success, 10001=token expired, etc.)
- ✅ Test environment ready at https://vigor-admin.vercel.app

## 4. Requested Items

We kindly request:

1. **Operator Token** (`operator_token`) for VIGOR platform
2. **Secret Key** (`secret_key`) for MD5 signature generation
3. **PGSoft API Domain** (staging + production)
4. **List of PGSoft callback IPs** to whitelist on our firewall
5. **Game list** with full metadata (game_id, name, type, RTP)
6. **Staging environment** for end-to-end testing before go-live

## 5. Timeline

We are targeting **go-live within 2-3 weeks** from receiving credentials. We have allocated dedicated technical resources for the integration.

## 6. Test Account for Verification

For initial VerifySession testing, our test player session format:
- Session token: `VIGOR_TEST_SESSION_[timestamp]`
- Test player ID: `test_player_001`
- Test balance: 1,000,000 IDR

---

We look forward to your prompt response. Our technical team is available for any clarification.

Best regards,  
**Purnama Steven**  
Technical Lead — VIGOR Platform  
Email: purnama.seteven@kreditplusteknologi.id  
Platform: https://vigor-admin.vercel.app

---
*This email was prepared on 4 May 2026*
