# Perbandingan Panduan Manual PDF VIGOR vs Web Panel Saat Ini

Dokumen ini berisi daftar fitur yang belum sesuai atau belum ada di sistem saat ini jika dibandingkan dengan standar SOP pada Panduan Manual PDF VIGOR.

### Mismatch / Fitur yang Belum Sesuai

#### 1. Bank Account Management (Hal 9 & 49-51)
- **Limit Settings Khusus Pulsa/E-Money (Rate/Cut):** Panduan meminta kemampuan untuk mengisi Rate / Potongan Deposit Khusus Pulsa (misal: Rate 0.8 atau potongan 20%). Sistem saat ini belum memiliki kalkulator cut/rate deposit pulsa.
- **Auto Rotate Pulsa:** Limit deposit pulsa otomatis non-aktif / rotate ke nomor lain bila mencapai limit Rp 1.050.000 per hari (Hal 49). Fitur logika otomatis ini belum ada.
- **Display Bank List & Banned Bank:** Menyetel jam "Online/Offline" Bank secara penjadwalan masih absen.

#### 2. Bets & Transfer Bets (Hal 11 & 30)
- **Menu Transfer Bets:** Menu untuk mentransfer pasangan taruhan member agen langsung ke pihak server VIGOR Pusat, beserta Limit Transfer Bets (batasan nominal maksimal lemparan bet) dari Settings belum diimplementasikan.

#### 3. Settings (Hal 23-24 & 30)
- **Limit Line:** Menu "Limit Line" (Hal 30) yang digunakan untuk menyetel max bet/nomor khusus untuk permainan 4D/3D/2D untuk setiap pool pasaran (contoh: SGP max bet 2D 1000 perak) belum ada di menu Settings.

#### 4. KYC Program & Referral (Hal 24-29)
- **Sistem Approval KYC:** Panduan (Hal 27) menunjukkan adanya Filter KYC Status (Pending/Pass/Fail) dan tombol "Approve/Reject KTP & Info Rekening" di halaman Member List sebelum kode Referral aktif. Saat ini, fungsionalitas UI KYC (Pop-up pengecekan data diri) belum ada di web.

#### 5. Customization (CMS Website Depan) (Hal 31-40)
*(Sistem saat ini menggunakan "Studio X" tingkat lanjut, berbeda format dengan panduan lama).*
- **Web Page Domain Cloning (Hal 33-34):** Fitur tombol "Clone Webpage Settings" untuk menyalin seluruh Metadata, Scripts, & Header dari satu domain ke domain lain belum dibuat.
- **Fitur Button Widget (Hal 35-36):** Di panduan, agent bisa mencentang (Telegram, Line, WA, Discord), mengisi Call To Action, mengatur warna, Button Size (Large/Medium), serta koordinat melayang kiri/kanan (Horizontal/Vertical Position). Modul UI khusus ini belum ada.
- **Running Text & Information Tags (Hal 37-38):** Form spesifik untuk "Before Login" vs "After Login", serta dukungan variasi Tags CMS seperti `[company_name]` atau `[shio_table]` untuk Information/Rules belum sinkron.

#### 6. Lost Money Report (Hal 47)
- **Lost Money Report:** Fitur khusus untuk mengembalikan / melihat tabel kredit member yang terpotong karena "Fault Bet" (Gagal pasang tapi uang di saldo terpotong). Laporan ini belum didesain di dalam tab Reports.

#### 7. Bonus Target Rules (Hal 51)
- **Kondisi Khusus Bonus:** Formulasi detail "Condition to Get / Do WD" saat membuat event Bonus. Pengaturan spesifik membatasi bonus hanya untuk transfer bank saja vs transfer pulsa (Dropdown Provider Bank di form Bonus) belum ditambahkan sesuai Hal 51.

#### 8. Modul Bonus & Laporan Promosi (Hal 12-13)
- **Upload Bonus via Excel (.xlsx) (Hal 13):** Panduan mewajibkan fitur "Upload Bonus" manual melalui *drag & drop* file Excel dengan format Kolom A (username) & Kolom B (jumlah). Di web saat ini pengaturan bonus kebanyakan *form-based*, fitur unggah excel ini belum ada.
- **Laporan Spesifik Promosi:** Sub-menu **Free Bet Report** dan **Bonus Report** (laporan sejenis riwayat tagihan khusus bonus) belum tersedia.

#### 9. Analisis Togel Hasil / Result (Hal 22)
- **Scan Result:** Sub-menu untuk melihat/memindai prediksi jumlah *profit/loss* perusahaan sebelum angka hasil ditarik (kalkulasi *min profit/max profit* pada pools). Modul prediksi ini belum dikembangkan dalam `results.js`.
- **Analyze Result:** Fitur analitik hasil pada halaman website (Hal 22) belum dibuat. Saat ini modul result hanya berfokus pada "Result List" biasa.

#### 10. Fitur Sitemap XML (Hal 32)
- **Upload Sitemap.xml:** Pada menu URL / Customization, fitur form seret & lepas (drag-drop) file sitemap belum disediakan (saat ini modul SEO kita hanya mengatur Metadata Title/Script saja).

---

### Fitur yang Sudah Sesuai (Sudah Dikerjakan)
- Login & Dashboard
- Profile & Notifikasi
- Sub Account & Member Management
- Request Management (Deposit/Withdraw)
- Bets Table & Bet List
- Bonus / Promo (Free Bet logic dasar)
- Result & Pools Update
- Tools Domain DNS
- Memo & Auto Memo
- Reports (Referral, Winlose) & Logs
