# Rollback Guide - BERSAMA Admin Platform
**Timestamp:** 2026-05-01 16:10

Jika terjadi kesalahan setelah optimasi "Premium & Intelligence", gunakan panduan ini untuk mengembalikan sistem ke kondisi stabil sebelumnya.

## Cara Restore Manual
Jalankan perintah berikut di terminal (PowerShell):

```powershell
Copy-Item "js/backups/stable_v1/main.js.bak" "js/main.js" -Force
Copy-Item "js/backups/stable_v1/state.js.bak" "js/core/state.js" -Force
Copy-Item "js/backups/stable_v1/components.js.bak" "js/ui/components.js" -Force
Copy-Item "js/backups/stable_v1/customization.js.bak" "js/pages/customization.js" -Force
Copy-Item "js/backups/stable_v1/dashboard.js.bak" "js/pages/dashboard.js" -Force
```

## Daftar File yang Dibackup:
1. `js/main.js`
2. `js/core/state.js`
3. `js/ui/components.js`
4. `js/pages/customization.js`
5. `js/pages/dashboard.js`

---
*Created by Antigravity AI Assistant*
