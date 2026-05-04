# VIGOR Admin Panel — Go Live Setup Guide

## Langkah 1: Supabase Setup (WAJIB)

### 1a. Buat Supabase Project
1. Buka https://supabase.com → **New Project**
2. Nama: `vigor-admin`, region: `Southeast Asia (Singapore)`
3. Tunggu project selesai dibuat (~2 menit)

### 1b. Jalankan SQL Migrations
Di Supabase → **SQL Editor** → jalankan berurutan:
```
1. supabase/migrations/001_schema.sql   ← semua tabel
2. supabase/migrations/002_rls.sql      ← row level security
3. supabase/migrations/003_seed.sql     ← seed admin + games
```

### 1c. Ambil API Keys
Supabase → **Project Settings → API**:
- `Project URL` → masukkan ke `VITE_SUPABASE_URL`
- `anon public` key → masukkan ke `VITE_SUPABASE_ANON_KEY`
- `service_role` key → masukkan ke `SUPABASE_SERVICE_ROLE_KEY` (server only!)

---

## Langkah 2: Edit .env (Frontend)

Edit file `.env`:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_API_SERVER_URL=https://your-app.up.railway.app
VITE_PG_OPERATOR_TOKEN=...    (dari PGSoft)
VITE_PG_SECRET_KEY=...        (dari PGSoft)
VITE_UNOPAY_API_KEY=...       (dari Unopay)
VITE_COIN2PAY_API_KEY=...     (dari Coin2Pay)
VITE_SAWALA_TOKEN=...         (dari Sawala)
VITE_CLOUDFLARE_API_TOKEN=... (dari Cloudflare)
```

---

## Langkah 3: Deploy Backend (Railway)

### 3a. Buat Railway Project
1. https://railway.app → **New Project → Deploy from GitHub**
2. Pilih repo ini
3. **Root Directory**: `server`

### 3b. Set Environment Variables di Railway
Di Railway → **Variables**, tambahkan dari `.env.server`:
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PG_OPERATOR_TOKEN=...
PG_SECRET_KEY=...
PG_WHITELISTED_IPS=103.28.12.0/24,202.134.56.78
UNOPAY_API_KEY=...
COIN2PAY_API_KEY=...
SAWALA_TOKEN=...
SAWALA_CALLBACK_IP=103.21.44.0
CLOUDFLARE_API_TOKEN=...
CORS_ORIGINS=https://your-frontend.vercel.app
```

### 3c. Dapatkan Railway URL
Railway → **Networking → Generate Domain**
Format: `https://your-app.up.railway.app`
→ Masukkan ke `VITE_API_SERVER_URL` di frontend `.env`

---

## Langkah 4: Deploy Frontend (Vercel)

### 4a. Import ke Vercel
1. https://vercel.com → **New Project → Import Git Repository**
2. Pilih repo ini (root directory = `/`)
3. Framework: **Vite**

### 4b. Set Environment Variables di Vercel
Vercel → **Settings → Environment Variables**:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_SERVER_URL=https://your-app.up.railway.app
VITE_APP_NAME=VIGOR Admin
```

### 4c. Deploy!
Vercel akan otomatis build dan deploy setiap push ke `main`.

---

## Langkah 5: GitHub Actions Secrets

Di GitHub repo → **Settings → Secrets → Actions**, tambahkan:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VITE_API_SERVER_URL
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
RAILWAY_TOKEN
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_REF
```

---

## Langkah 6: Konfigurasi PGSoft

### 6a. Submit ke PGSoft (W1 Hari 1 — URGENT)
- Kirim email ke PGSoft: operator token, callback domain, IP server Railway
- Callback URL: `https://your-app.up.railway.app/api/seamless`
- Whitelist IP Railway di PGSoft dashboard

### 6b. Test Seamless
```bash
curl -X POST https://your-app.up.railway.app/api/seamless/VerifySession \
  -H "Content-Type: application/json" \
  -d '{"operator_token":"VGR-OPR-2024-ABCD","secret_key":"your_secret","operator_player_session":"testuser"}'
```

---

## Langkah 7: Konfigurasi Payment Gateways

### Unopay
- Dashboard: https://dashboard.unopay.id
- Set webhook URL: `https://your-app.up.railway.app/api/webhooks/unopay`

### Coin2Pay
- Dashboard: https://merchant.coin2pay.com
- Set callback URL: `https://your-app.up.railway.app/api/webhooks/coin2pay`

### Sawala
- Contact Sawala untuk credentials
- Set webhook URL: `https://your-app.up.railway.app/api/webhooks/sawala`
- Allow IP: `103.21.44.0` di server anda

---

## Langkah 8: Test Checklist Sebelum Go Live

### Authentication
- [ ] Login dengan email SuperAdmin berjalan
- [ ] Role SuperAdmin bisa akses semua menu
- [ ] Role Company hanya bisa akses menu yang diizinkan
- [ ] Logout redirect ke login page

### Finance
- [ ] Deposit Manual: create → pending → approve → balance member bertambah
- [ ] Withdrawal Manual: create → pending → approve → balance member berkurang
- [ ] Deposit Unopay: create → bayar → callback → auto approve
- [ ] Coin2Pay: create → konfirmasi → balance bertambah

### Seamless
- [ ] VerifySession: return player data
- [ ] Cash/Get: return balance benar
- [ ] Cash/TransferInOut: bet kurangi balance, win tambah balance
- [ ] Idempotency: request duplikat return response sama

### Data
- [ ] Member CRUD berjalan dan sync ke DB
- [ ] Company CRUD berjalan dan sync ke DB
- [ ] Bank CRUD berjalan dan sync ke DB
- [ ] Memo send/receive berjalan
- [ ] Log tercatat setiap aksi

### Security
- [ ] RLS: Company A tidak bisa lihat data Company B
- [ ] CSP headers active
- [ ] HTTPS di semua endpoint
- [ ] PGSoft IP whitelist active

---

## Informasi Login Demo
- URL: `http://localhost:5173` (dev) atau Vercel URL (prod)
- Username: `adminsub40`
- Password: `vgr-demo-2026`
- Mode: **Demo Mode** (data mock, tidak tersimpan ke DB)

Untuk mode production: login dengan email SuperAdmin yang dibuat di `003_seed.sql`

---

*VIGOR Setup Guide v2.0 — 4 Mei 2026*
