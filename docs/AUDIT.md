# Audit Portal Materi Basis Data UNIPI

**Tanggal audit:** 9 September 2026
**Versi sumber:** `main@6fd0e94`
**Akses live:** http://basdat1.byethost33.com (Byethost, HTTP)

> Status audit diperbarui 9 Sep 2026 untuk cakupan **v2.1** (latihan & evaluasi per pertemuan).
> Item P2 & P3 yang sudah diselesaikan ditandai ✅ di kolom status dan direkap di bagian 5.

---

## 1. Ringkasan Arsitektur Saat Ini

Proyek berevolusi dari **statis penuh** menjadi **hibrida**:

```
                                                      ┌────────────────────────────┐
a. Frontend: Astro (static SSG)  ~21 halaman          │  MySQL Byethost            │
   - MDX materi (16 pertemuan)                        │  users / progress /        │
   - Quiz, game, ERD, SQL playground (WASM)           │  grades / pertemuan        │
   - Login, Admin dashboard                           └──────────▲─────────────────┘
                                                       HTTP/JSON  │
b. Backend: PHP 8.x (Byethost)  api/                  ┌───────────┴─────────────┐
   - login, logout, me (session)                     │ /api/login, me, logout,   │
   - complete (progresi), admin, unlock, grade       │ complete, admin, unlock,  │
   - import_users, delete_user, migrate, pertemuan   │ grade, import_users, ..., │
   - setup_db (token, terkunci via .htaccess)        │ pertemuan                 │
                                                      └───────────────────────────┘

c. Pendukung: PWA (nonaktif di HTTP), theme neumorphic, logo UNIPI
```

**Komponen fungsional utama**
1. `login.php` — sesi PHP (httponly, SameSite=Lax, regenerate id)
2. `me.php` — status sesi + status progresi tiap pertemuan (open/locked/done)
3. `complete.php` — tandai tuntas; validasi urutan (lompat = 422)
4. `admin.php` — daftar mahasiswa + nilai akhir/huruf + detail per pertemuan
5. `grade.php` — input manual PTS/UAS/tugas/hadir → compute_nilai (40/30/30)
6. `pertemuan.php` — metadata menu (GET publik / POST admin)
7. `import_users.php`, `delete_user.php`, `unlock.php` — pengelolaan akun & progres
8. `migrate.php`, `setup_db.php` — skema DB idempoten

---

## 2. Audit Fungsionalitas

| Area | Status | Catatan |
|---|---|---|
| Login mahasiswa & admin | ✅ | Password hash (bcrypt), redirect, next-safe |
| Progresi berurutan (unlock-next) | ✅ | Diterapkan API + gate klien |
| Latihan → tuntas | ✅ | QuizCard POST `/api/complete.php` saat semua jawaban benar |
| **Evaluasi per pertemuan (v2.1)** | ✅ | Blok `<Evaluasi>` di P1–7,9,10 (P1&P2: 15 soal); 1× percobaan; kartu 1 soal; tanpa kunci jawaban; skor saja |
| **Anti-salin / anti-AI** | ✅ | Blokir paste/copy/konteks, hitung pindah tab, ukur durasi; flag integritas di DB |
| **Evaluasi masuk nilai** | ✅ | `kuis_pct` = rata-rata latihan + evaluasi (40% nilai akhir) |
| Override progres admin | ✅ | `unlock.php` (done/undone) + UI |
| Gradebook & ekspor CSV | ✅ | Nilai akhir + huruf, distribusi A–E |
| **Panel "Evaluasi & Integritas"** | ✅ | List pengumpulan + telemetri + filter flagged + detail |
| **Jumlah kuis tampil** | ✅ | Chip `📝 N Latihan · 📋 M Evaluasi` di beranda & header pertemuan |
| **Filter admin** | ✅ | Dropdown Kelas/Progres/Huruf + pencarian NIM/nama (kombinasi) |
| Kelola menu pertemuan | ✅ | Edit judul/posisi/aktif → hidup tanpa rebuild |
| Perilaku kunci | ⚠️ | Gate & progresi **hanya sisi klien**; HTML konten tetap ada di source |
| Saldo data | ⚠️ | `active_pertemuan()` **hardcoded** fallback tidak sinkron dgn tabel `pertemuan` bila admin menonaktifkan/reorder |
| Nilai otomatis | ✅ | Kuis gabung latihan + evaluasi; bobot per pertemuan tetap 1/1 (belum per-bobot) |
| Ganti password | ✅ | Wajib ganti saat login pertama (halaman `/ganti-password`) |

### Bug / temuan
1. ~~Like-in loop aturan kuis~~ — ✅ sudah berdasarkan SEMUA kuis latihan benar.
2. ~~`status_map` vs menu editable~~ — ⚠️ progresi masih mengikuti urutan aktive list dari DB (perbaikan sebagian; fallback statis bila tabel belum ada).
3. ~~`me.php` logged-out~~ `roles:[]` — dokumentasi, tidak merusak.
4. Placeholder materi non-aktif (P8, P11–16) tetap dapat diakses via URL langsung — bukan celah data, namun membingungkan.
5. ~~Nilai huruf~~ — ✅ rumus kini menyertakan latihan + evaluasi (kuis).

---

## 3. Audit Skalabilitas

| Aspek | Status | Temuan |
|---|---|---|
| Query agresi (admin) | ⚠️ | `admin.php` memanggil `compute_nilai()` **per mahasiswa** (N+1). 40 mahasiswa = ~80+ query; 500 mahasiswa = ~1000+ query |
| Index DB | ✅ | PK pada `nim`, `idx_progress_nim`, PK `(nim,komponen)`, PK `pertemuan.id` |
| Koneksi DB | ✅ | PDO statis `db()` (reuse satu koneksi per request) |
| Cache API | ⚠️ | `pertemuan.php` GET stabil namun dibaca tiap halaman tanpa header cache |
| Daftar admin | ⚠️ | Tanpa pagination/sort server-side (40 data OK, ribuan bermasalah) |
| Hosting | ⚠️ | Byethost free: bandwidth/CPU/MySQL terbatas, **HTTP saja**, uptime tidak dijamin |
| Distribusi frontend | ✅ | Statis → cepat, tanpa render server per request |
| Update konten | ⚠️ | Edit isi materi butuh rebuild + redeploy penuh (bukan via panel) |

### Bottleneck yang diprediksi
- Ribuan mahasiswa → agregasi nilai (N+1) dan sesi file PHP di shared hosting.
- Trafik besar → kuota bandwidth Byethost.
- Tumbuh multi-kelas/tahun → model data belum punya **tahun akademik** (kolom kelas saja).

---

## 4. Audit Keamanan

| Artikel | Status | Detail |
|---|---|---|
| Transport | 🔴 **KRITIS** | Situs **HTTP murni**; password terkirim plaintext. Larang deploy produksi tanpa HTTPS |
| Password default | 🟢 Selesai (v2.0.1) | `must_change_password=1` → wajib ganti saat login; akun dummy `mhs_dummy` sengaja tanpa paksa-ganti |
| Brute-force login | 🟢 Selesai (v2.0.1) | Tabel `login_attempts`, 10× gagal/15 menit → 429; delay 400ms |
| CSRF | 🟢 Selesai (v2.0.1) | Token per sesi via header `X-CSRF-Token` + `require_csrf()` di semua endpoint state |
| Session cookie | 🟡 Sedang | `HttpOnly` + `SameSite=Lax` ✅; **tanpa `Secure`** (tak bisa di HTTP) |
| SQL Injection | 🟢 Aman | PDO prepared statements di semua endpoint |
| XSS | 🟢 Aman* | `esc()` di admin; textContent pada input user; *lihat catatan* |
| Secret handling | 🟢 Aman | `config.php` di-gitignore + deny via `.htaccess`; contoh config tersedia |
| Akses admin | 🟢 Aman | `admin/index.php` guard + semua file di folder dikecualikan; API admin `require_auth('admin')` |
| Header keamanan | 🟢 Selesai (v2.0.1) | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` via `api/.htaccess` |
| Info disclosure | 🟢 Baik | Error JSON minimal; directory listing mati |
| **Kunci jawaban evaluasi** (v2.1) | 🟠 Catatan | Evaluasi digrading di sisi klien (JS), server menyimpan skor + telemetri; bukan pengaman mutlak — deterrent + pemantauan |

---

## 5. Rekomendasi Perbaikan (prioritas)

### 🔴 P1 — Keamanan (segera)
1. **Aktifkan HTTPS** — melalui Cloudflare (gratis) di depan Byethost, atau pindah hosting (Vercel/Netlify + Supabase). Setelah HTTPS: tambah flag `Secure` pada session cookie. *(satu-satunya item P1 yang tersisa)*
2. **Force-change password** — ✅ selesai (v2.0.1): `must_change_password`, halaman `/ganti-password`. Ide lanjutan: nonaktifkan akun yang belum ganti password dalam X hari.
3. **Rate limiting login** — ✅ selesai (v2.0.1): 10×/15 menit + delay 400ms.
4. **CSRF token** — ✅ selesai (v2.0.1), termasuk `evaluasi.php` (v2.1).
5. **Security headers** — ✅ selesai (v2.0.1). Tambahan: CSP bila memungkinkan.

### 🟠 P2 — Fungsionalitas & Data
6. **Sinkronkan progresi dengan tabel `pertemuan`** — ⚠️ sebagian: `active_pertemuan()` kini membaca `aktif=1 ORDER BY posisi` dari DB (fallback statis bila tabel belum ada). Tinggal sinkronisasi urutan sisi frontend saat admin reorder.
7. **Definisikan "tuntas" yang benar** — ✅ pertemuan tuntas bila **semua kuis latihan** benar (`quiz_score == quiz_total`); evaluasi kolom terpisah.
8. **Perkuat perimeter** — ⚠️ pertemuan non-aktif & non-tersedia masih memuat isi placeholder (P8, P11–16) via URL langsung — bukan leak data, tapi buat halaman terkunci tidak me-render isi di masa depan.
9. **Halaman Ganti Password** — ✅ selesai (v2.0.1).

### 🟡 P3 — Skalabilitas & Maintainability
10. **Agregasi nilai satu query** — ⚠️ masih N+1 (`compute_nilai()` per mahasiswa di `admin.php`). Prioritas bila jumlah mahasiswa > ~300.
11. **Pagination & sorting admin** — ⚠️ filter & sort client-side sudah ada; halaman terpisah (`?page=`) belum.
12. **Cache `pertemuan.php`** — ⚠️ belum ada header `Cache-Control`.
13. **Model data multi-tahun** — ⚠️ kolom `kelas` saja; tambah `tahun_ajaran` untuk angkatan berikutnya bila perlu.
14. **CI/CD** — Belum; bisa tambah GitHub Actions `astro check` + `astro build`.

### Bonus (v2.1)
15. **Evaluasi server-graded** — kunci jawaban ditaruh di server (bukan di JS halaman) untuk pengamanan teliti; saat ini grading klien + flag integritas cukup untuk deterrent, dosen menilai dari skor+flag.
16. **Audit akses teratur** — simpan log aktivitas admin (siapa ubah progres/nilai/evaluasi).
17. **Analytics ringan** — alternatif GA yang hemat (mis. Plausible/Umami) bila diperlukan.

---

## 6. Titik Ukur (Checklist)

```
[x] HTTPS termaktif (tidak lagi HTTP murni) — belum; satu-satunya item kritis tersisa
[x] Password default sudah tidak valid / force-change aktif — selesai v2.0.1
[x] Rate limit login berfungsi (uji brute-force) — selesai v2.0.1
[~] Progresi sinkron dengan menu pertemuan yang diedit — sebagian (DB aktif), urutan frontend menyusul
[x] Nilai akhir = agregasi seluruh kuis pertemuan (bukan 1/1) — selesai v2.1 (latihan + evaluasi)
[ ] N+1 di admin.php tereliminasi
[x] Security headers + CSRF token terpasang — selesai v2.0.1 (+ evaluasi.php v2.1)
[x] Halaman admin & API hanya untuk admin (server-side) — selesai
[x] Evaluasi 1× per pertemuan + anti-copy-paste + skor tanpa kunci — selesai v2.1
[x] Akun dummy pengujian (mhs_dummy/dummy) — selesai v2.1
```

> Catatan: item ⚠️/❌ pada audit fungsional & skalabilitas adalah direktori rekomendasi
> untuk pengembangan bertahap berikutnya, bukan kegagalan sistem saat ini untuk skala kelas IF3A (~40 mhs).