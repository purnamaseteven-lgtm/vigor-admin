# VIGOR ADMIN PANEL — Summary Timeline v6.1
**12 Minggu (3 Bulan) | 5 Mei – 26 Juli 2026 | Go Live Target: 26 Juli 2026**
*From Scratch | 33+ halaman | 5 role | 42+ modul | Manpower hanya bisa bertambah, tidak bisa berkurang*

---

## 1. MANPOWER

### Asumsi
- Project dihitung **dari scratch** (termasuk desain UI/UX)
- W1–W5 development di **localhost** (server lokal)
- **Infrastructure masuk W6** (~50% project)
- Tidak ada QA — testing oleh developer sendiri
- **Aturan manpower: sekali seseorang masuk, tidak bisa dikurangi di minggu berikutnya**

### Komposisi Tim & Rate

| Kode | Role | Rate/Bulan | Rate/Minggu |
|---|---|---|---|
| **FS** | Full-Stack Developer | Rp 15.000.000 | Rp 3.750.000 |
| **BE** | Backend Developer | Rp 15.000.000 | Rp 3.750.000 |
| **UI** | UI/UX Designer | Rp 12.000.000 | Rp 3.000.000 |
| **INF** | Infrastructure Engineer | Rp 15.000.000 | Rp 3.750.000 |
| **PO** | Product Owner | Rp 18.000.000 | Rp 4.500.000 |

### Headcount Per Minggu *(hanya bisa naik, tidak bisa turun)*

| Minggu | FS | BE | UI | INF | PO | **Total** | Keterangan |
|---|---|---|---|---|---|---|---|
| W1  | ✅ | ✅ | ✅ | — | ✅ | **4** | Kickoff |
| W2  | ✅ | ✅ | ✅ | — | ✅ | **4** | |
| W3  | ✅ | ✅ | ✅ | — | ✅ | **4** | |
| W4  | ✅ | ✅ | ✅ | — | ✅ | **4** | |
| W5  | ✅ | ✅ | ✅ | — | ✅ | **4** | |
| W6  | ✅ | ✅ | ✅ | ✅ | ✅ | **5** | ← INF masuk (50%) |
| W7  | ✅ | ✅ | ✅ | ✅ | ✅ | **5** | |
| W8  | ✅ | ✅ | ✅ | ✅ | ✅ | **5** | |
| W9  | ✅ | ✅ | ✅ | ✅ | ✅ | **5** | |
| W10 | ✅ | ✅ | ✅ | ✅ | ✅ | **5** | |
| W11 | ✅ | ✅ | ✅ | ✅ | ✅ | **5** | |
| W12 | ✅ | ✅ | ✅ | ✅ | ✅ | **5** | Go Live |

```
         W1   W2   W3   W4   W5   W6   W7   W8   W9  W10  W11  W12
FS    ── ████ ████ ████ ████ ████ ████ ████ ████ ████ ████ ████ ████
BE    ── ████ ████ ████ ████ ████ ████ ████ ████ ████ ████ ████ ████
UI    ── ████ ████ ████ ████ ████ ████ ████ ████ ████ ████ ████ ████
INF   ── ░░░░ ░░░░ ░░░░ ░░░░ ░░░░ ████ ████ ████ ████ ████ ████ ████  ← W6
PO    ── ████ ████ ████ ████ ███░ ████ ████ ████ ████ ████ ████ ████
       ──────────────────────────────────────────────────────────────
Total     4    4    4    4    4    5    5    5    5    5    5    5
```

---

## 2. PHASE OVERVIEW

| Phase | Tema | Minggu | Modul Utama |
|---|---|---|---|
| **P1** | 🏗️ **Fondasi** | W1–W2 | Desain sistem & wireframe, Environment, Auth + 2FA + 5 Role, Core DB layer, Supabase wiring |
| **P2** | ⚙️ **Operasional** | W2–W5 | Desain + build: Member, Hierarchy (WL/Master/Company/Shop/Agent), Finance, Bank, Admin, Memo, Announcement, CMS, Theme Designer, Studio X, Template Gallery, Widget, VIP, SEO |
| **P3** | 🔌 **PGA Connectivity** | W4–W8 | PGSoft Seamless (5 endpoint), Togel Engine (10 bet type, 12 pool), Unopay (7 method), Coin2Pay (5 crypto), Sawala, Smartico, Cloudflare Domain API |
| **P4** | 🌐 **Infrastruktur** | W6–W10 | Server deploy, Domain API, CI/CD, Monitoring, Studio X deploy pipeline |
| **P5** | 📊 **Pelaporan & Bisnis** | W8–W10 | Desain + build: Dashboard KPI, 6 Report, Provider Analytics, Commission, 7 Bonus type, Freebet + Pragmatic FRB, Promotion Release, Tournament, Invoice, 5 Log type, Settings |
| **P6** | 🔒 **Hardening & Launch** | W10–W12 | Security, Performance, UAT 20 skenario, Go Live |

---

## 3. MASTER TIMELINE

| Phase | Tema | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 | W11 | W12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **P1** | 🏗️ Fondasi | ████ | ████ | | | | | | | | | | |
| **P2** | ⚙️ Operasional | | ████ | ████ | ████ | ████ | | | | | | | |
| **P3** | 🔌 PGA Connectivity | | | | ████ | ████ | ████ | ████ | ████ | | | | |
| **P4** | 🌐 Infrastruktur | | | | | | ████ | ████ | ████ | ████ | ████ | | |
| **P5** | 📊 Pelaporan & Bisnis | | | | | | | | ████ | ████ | ████ | | |
| **P6** | 🔒 Hardening & Launch | | | | | | | | | | ████ | ████ | ████ |

---

## 4. RINGKASAN PER MINGGU + BIAYA

> **Rumus biaya/minggu:**
> W1–W5 (4 orang): FS Rp3,75jt + BE Rp3,75jt + UI Rp3jt + PO Rp4,5jt = **Rp 15.000.000/minggu**
> W6–W12 (5 orang): + INF Rp3,75jt = **Rp 18.750.000/minggu**
> Infrastruktur (server/tools, aktif mulai W6): **± Rp 375.000/minggu**

| Minggu | Tanggal | Orang | Biaya Tim/Minggu | Infra/Minggu | **Total/Minggu** | **Kumulatif** | Deliverable Utama |
|---|---|---|---|---|---|---|---|
| **W1** | 5–11 Mei | 4 | Rp 15.000.000 | — | **Rp 15.000.000** | Rp 15.000.000 | Kickoff, wireframe 33+ halaman, desain sistem & DB schema, Supabase 3-env, vendor sandbox |
| **W2** | 12–18 Mei | 4 | Rp 15.000.000 | — | **Rp 15.000.000** | Rp 30.000.000 | Desain komponen UI, Auth + 2FA TOTP, 5 role RBAC dari DB, login page, session guard, core data layer |
| **W3** | 19–25 Mei | 4 | Rp 15.000.000 | — | **Rp 15.000.000** | Rp 45.000.000 | Desain + build: Member CRUD + balance adjustment, Hierarchy WL/Master/Company/Shop, Bank management |
| **W4** | 26 Mei–1 Jun | 4 | Rp 15.000.000 | — | **Rp 15.000.000** | Rp 60.000.000 | Desain + build: Deposit/WD atomic + realtime, Admin management, Memo/Logs, Announcement. PGSoft server init |
| **W5** | 2–8 Jun | 4 | Rp 15.000.000 | — | **Rp 15.000.000** | Rp 75.000.000 | CMS + Theme Designer + Template Gallery (30+) + Widget Library + Studio X, VIP Tiers, SEO, Unopay (7 method) |
| **W6** | 9–15 Jun | **5** | Rp 18.750.000 | Rp 375.000 | **Rp 19.125.000** | Rp 94.125.000 | **INF masuk.** Coin2Pay (5 crypto) + Sawala + payment routing. Server setup (Vercel + Railway + Supabase prod) |
| **W7** | 16–22 Jun | 5 | Rp 18.750.000 | Rp 375.000 | **Rp 19.125.000** | Rp 113.250.000 | Seamless VerifySession + Cash/Get + TransferInOut + MD5 + idempotency. Domain API Cloudflare |
| **W8** | 23–29 Jun | 5 | Rp 18.750.000 | Rp 375.000 | **Rp 19.125.000** | Rp 132.375.000 | Togel engine full (10 bet type, 12 pool, auto settlement). Seamless admin tools + bug recovery. CI/CD aktif |
| **W9** | 30 Jun–6 Jul | 5 | Rp 18.750.000 | Rp 375.000 | **Rp 19.125.000** | Rp 151.500.000 | Dashboard KPI real, Statistics + Provider Analytics + 6 Report. Smartico CRM. Commission engine. Monitoring |
| **W10** | 7–13 Jul | 5 | Rp 18.750.000 | Rp 375.000 | **Rp 19.125.000** | Rp 170.625.000 | 7 Bonus type + Freebet + Pragmatic FRB + Promo Release + Tournament + Invoice + 5 Log + Settings. Studio X pipeline |
| **W11** | 14–20 Jul | 5 | Rp 18.750.000 | Rp 375.000 | **Rp 19.125.000** | Rp 189.750.000 | Security hardening (RLS/CORS/CSP/webhook IP/secret rotation), Performance, Final desain revisi, UAT 20 skenario |
| **W12** | 21–26 Jul | 5 | Rp 18.750.000 | Rp 375.000 | **Rp 19.125.000** | **Rp 208.875.000** | UAT bug fix, prod credentials, DNS cutover, **🚀 Go Live 26 Juli 2026**, Hypercare |

### Ringkasan Biaya Total

| Komponen | Perhitungan | Total |
|---|---|---|
| Tim W1–W5 (4 orang × 5 minggu) | Rp 15.000.000 × 5 | Rp 75.000.000 |
| Tim W6–W12 (5 orang × 7 minggu) | Rp 18.750.000 × 7 | Rp 131.250.000 |
| Infrastructure services W6–W12 | Rp 375.000 × 7 | Rp 2.625.000 |
| **GRAND TOTAL** | | **Rp 208.875.000** |

---

## 5. SCOPE RINGKASAN

| Kategori | Detail |
|---|---|
| **Halaman UI** | 33+ halaman (desain + build from scratch) |
| **Role Hierarchy** | 5 role: SuperAdmin → Master → Company → Shop → Agent |
| **Payment Gateway** | 3: Unopay (7 method) + Coin2Pay (5 crypto) + Sawala |
| **Game API** | PGSoft Seamless v2.4.11 + 7 provider |
| **Togel Engine** | 12 pool, 10 jenis bet, prize config, auto settlement |
| **Template & Builder** | 30+ template, Studio X drag-drop (5 layout), 10 widget |
| **Report** | Statistics + Provider Analytics + 6 halaman report |
| **Bonus** | 7 tipe + Agent Freebet + Pragmatic FRB + Promotion Release |
| **Log** | 5 jenis (admin/company/whitelabel/member/masterWL) |
| **Settings** | Commission + Referral + Pools + Games + Agent Games + Togel Commission + Limit Credit + VIP Designer + Rebate Calc |
| **Modul Total** | 42 modul, 420+ task |

---

## 6. DEPENDENCY VENDOR

| Vendor | Dibutuhkan | Submit | SLA | Risk |
|---|---|---|---|---|
| **PGSoft** | Seamless API (5 endpoint, 26 game) | **W1 Hari 1 — URGENT** | 2–4 minggu | ⚠️ Satu-satunya blocker eksternal |
| **Unopay** | VA BCA/BNI/BRI + QRIS + Gopay/OVO/Dana | W1 Hari 2 | 1–3 hari | Rendah |
| **Coin2Pay** | BTC/ETH/USDT/BNB/LTC | W1 Hari 2 | 1–2 hari | Rendah |
| **Sawala** | Alternative payment (api.sawala.id/v2) | W1 Hari 2 | 1–3 hari | Rendah |
| **Smartico** | CRM + gamification | W4 | 3–7 hari | Rendah |
| **Cloudflare** | DNS + domain API | W6 | Langsung | Rendah |

---

*VIGOR Summary Timeline v6.1 — 4 Mei 2026*
*From Scratch | 4 orang W1–W5 → 5 orang W6–W12 | Infrastructure mulai W6 | Tanpa QA*
*Go Live: 26 Juli 2026 | Grand Total: Rp 208.875.000*
