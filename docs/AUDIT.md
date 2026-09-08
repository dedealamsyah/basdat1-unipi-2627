# Audit Portal Materi Basis Data UNIPI

**Tanggal audit:** 8 September 2026
**Versi sumber:** `main@a45dbe5`
**Akses live:** http://basdat1.byethost33.com (Byethost, HTTP)

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
| Kuis → auto tuntas | ✅ | QuizCard POST `/api/complete.php` saat jawaban benar |
| Override progres admin | ✅ | `unlock.php` (done/undone) + UI |
| Gradebook & ekspor CSV | ✅ | Nilai akhir + huruf, distribusi A–E |
| Kelola menu pertemuan | ✅ | Edit judul/posisi/aktif → hidup tanpa rebuild |
| Pencarian & filter admin | ✅ | NIM/nama + kelas |
| Perilaku kunci | ⚠️ | Gate & progresi **hanya sisi klien**; HTML konten tetap ada di source |
| Saldo data | ⚠️ | Daftar `active_pertemuan()` di `config.php` **hardcoded** tidak sinkron dgn tabel `pertemuan` bila admin menonaktifkan/reorder |
| Nilai otomatis | ⚠️ | `kuis_pct` = agresi skor kuis; belum ada pembagi per pertemuan (semua dianggap 1/1) |
| Ganti password | ❌ | Belum ada (admin & mahasiswa); password awal = NIM diketahui publik |

### Bug / temuan
1. **Like-in loop aturan kuis**: setiap kuis benar melapor `score=1/1`; siswa hanya butuh 1 jawaban benar per pertemuan (bukan semua kuis dalam pertemuan).
2. **`status_map` vs menu editable**: admin bisa menyembunyikan pertemuan 2, tetapi rantai progresi masih mengharapkan 2.
3. **`me.php` logged-out** mengembalikan kunci `roles:[]` (dok saja, tidak merusak).
4. **Placeholder materi non-aktif** (P8, P11–16) tetap dapat diakses via URL langsung (isi "belum tersedia") — bukan celah data, namun membingungkan.
5. **Nilai huruf** belum memperhitungkan `tugas`/`hadir` dalam rumus (hanya kuis/PTS/UAS).

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
| Password default | 🟠 Tinggi | Admin `AdminUNIPI2026`, mahasiswa=NIM; belum ada force-change |
| Brute-force login | 🟠 Tinggi | Tidak ada rate-limit/lockout di `login.php` |
| CSRF | 🟠 Sedang | Dilindungi parsial oleh SameSite=Lax + POST-only; belum ada token CSRF |
| Session cookie | 🟡 Sedang | `HttpOnly` + `SameSite=Lax` ✅; **tanpa `Secure`** (tak bisa di HTTP) |
| SQL Injection | 🟢 Aman | PDO prepared statements di semua endpoint |
| XSS | 🟢 Aman* | `esc()` di admin; textContent pada input user; *lihat catatan* |
| Secret handling | 🟢 Aman | `config.php` di-gitignore + deny via `.htaccess`; contoh config tersedia |
| Akses admin | 🟢 Aman | `admin/index.php` guard + semua file di folder dikecualikan; API admin `require_auth('admin')` |
| Header keamanan | 🟡 Sedang | Tidak ada `X-Frame-Options`, `CSP`, `Referrer-Policy` |
| Info disclosure | 🟢 Baik | Error JSON minimal; directory listing mati |

---

## 5. Rekomendasi Perbaikan (prioritas)

### 🔴 P1 — Keamanan (segera)
1. **Aktifkan HTTPS** — melalui Cloudflare (gratis) di depan Byethost, atau pindah hosting (Vercel/Netlify + Supabase). Setelah HTTPS: tambah flag `Secure` pada session cookie.
2. **Force-change password** — wajib ganti saat login pertama (admin & mahasiswa). Matikan akun tanpa ganti password setelah periode X.
3. **Rate limiting login** — batasi percobaan (mis. 5×/menit/IP+NIM) + delay eksponensial + lockout sementara. Simpan counter di DB atau file.
4. **CSRF token** — token per sesi pada semua endpoint state-bentuk (selain SameSite=Lax).
5. **Security headers** — via `.htaccess` (bila `mod_headers` aktif) atau meta pada layout: `X-Frame-Options`, `Referrer-Policy`, minimal `X-Content-Type-Options`.

### 🟠 P2 — Fungsionalitas & Data
6. **Sinkronkan progresi dengan tabel `pertemuan`** — ganti `active_pertemuan()` hardcoded dengan query `aktif=1` terurut `posisi`; clone ke frontend (halaman menyebarkan urutan dari DB saat load).
7. **Definisikan "tuntas" yang benar** — pertemuan tuntas bila **semua kuis** di dalamnya benar (kirim `total_kuis` per pertemuan), atau admin override. Simpan `quiz_total` = jumlah kuis pertemuan.
8. **Perkuat perimeter** — pertemuan non-aktif & non-tersedia jangan memuat isi; sembunyikan atau blokir client-side (akan jadi leak bila data sensitif).
9. **Halaman Ganti Password** + logout semua sesi saat ganti/password reset.

### 🟡 P3 — Skalabilitas & Maintainability
10. **Agregasi nilai satu query** — `compute_nilai` digabung jadi query `LEFT JOIN`/`GROUP BY` (hilangkan N+1).
11. **Pagination & sorting admin** — `?page=`, `?sort=nilai`, jumlah per halaman; tambah indeks `(kelas)`.
12. **Cache `pertemuan.php`** — header `Cache-Control: public, max-age=300` + hash versi; data berubah jarang.
13. **Model data multi-tahun** — tambah kolom `tahun_ajaran`/`angkatan` bila ada kelas berikutnya; nominal `kelas` saja rapuh.
14. **CI/CD** — GitHub Actions: `astro check` + `astro build` tiap push; migrasi DB idempoten via `migrate.php`.

### Bonus
15. **Audit akses teratur** — simpan log aktivitas admin (siapa ubah progres/nilai).
16. **Analytics ringan** — alternatif GA yang hemat (mis. Plausible/Umami) bila diperlukan.

---

## 6. Titik Ukur (Checklist)

```
[ ] HTTPS termaktif (tidak lagi HTTP murni)
[ ] Password default sudah tidak valid / force-change aktif
[ ] Rate limit login berfungsi (uji brute-force)
[ ] Progresi sinkron dengan menu pertemuan yang diedit
[ ] Nilai akhir = agregasi seluruh kuis pertemuan (bukan 1/1)
[ ] N+1 di admin.php tereliminasi
[ ] Security headers + CSRF token terpasang
[ ] Halaman admin & API hanya untuk admin (server-side)
```

> Catatan: item ⚠️/❌ pada audit fungsional & skalabilitas adalah direktori rekomendasi
> untuk pengembangan bertahap berikutnya, bukan kegagalan sistem saat ini untuk skala kelas IF3A (~40 mhs).