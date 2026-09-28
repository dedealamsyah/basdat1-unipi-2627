# Audit Portal Materi Basis Data UNIPI

**Tanggal audit:** 9 September 2026
**Versi sumber:** `main@6fd0e94`
**Akses live:** http://basdat1.byethost33.com (Byethost, HTTP)

> Status audit diperbarui 9 Sep 2026 untuk cakupan **v2.1** (latihan & evaluasi per pertemuan).
> Item P2 & P3 yang sudah diselesaikan ditandai ✅ di kolom status dan direkap di bagian 5.

---

## 0. Pembaruan Audit — 28 September 2026 (v2.8.0)

**Cakupan:** komponen yang belum pernah disentuh audit sebelumnya — **kuis latihan**, yaitu
40% nilai akhir. Dua temuan di bawah ditutup; sisanya dinyatakan terbuka sebagai trade-off.

### Temuan yang ditutup di v2.8.0

| Area | Severity | Status | Catatan |
|---|---|---|---|
| Kunci latihan inline di HTML (`data-correct`) | 🟠 Sedang | ✅ | Kunci pindah ke `api/kunci.php` (`KUIS_KUNCI`), dinilai `api/quiz.php`. Bentuk MDX jadi props; hanya `{id, soal, opsi}` yang dirender. Gate build gagal kalau `data-correct`/`data-explanation`/`KUIS_KUNCI` muncul di `dist/`. |
| Skor latihan client-reported (`complete.php`) | 🔴 Tinggi | ✅ | `POST {pertemuan_id, quiz_score, quiz_total}` dulu menuntaskan tanpa menjawab. Sekarang client hanya mengirim indeks opsi, server menghitung via `kuis_nilai()`. Tidak ada endpoint yang lagi membaca `quiz_score` dari client (kecuali jalur admin). |

### Yang diverifikasi pada pass ini

- `npm run check` → **0 error, 0 warning, 0 hint** (32 berkas).
- `npm run build` sukses, **39 halaman**; `verify-build.mjs` lulus atas **52 berkas teks**,
  9 bank evaluasi + 9 bank kuis latihan, jumlah kartu kuis per halaman cocok dengan kunci.
- `php -l` bersih untuk seluruh `api/*.php` dan `admin/*.php`.
- **Paritas konten:** 42 soal + 123 opsi di 9 halaman dibandingkan otomatis dengan baseline
  `dist/` pra-perubahan — teks dan urutan identik (satu-satunya beda: tanda kutip melengkung
  `‘Informatika’` menjadi `'Informatika'`, karena teks di dalam `opsi={[…]}` tidak lagi
  melewati `remark-smartypants`; untuk ekspresi SQL/AR ini justru lebih tepat).
- **Skor diuji langsung** dengan PHP CLI: `kuis_nilai()` mengembalikan tuntas hanya bila
  seluruh soal dijawab benar, dan `null` untuk pertemuan tanpa kunci latihan.
- Gate `verify-build` diuji gagal dengan benar: menyuntik `data-correct` ke
  `dist/pertemuan/1/index.html` → build dibatalkan.

### Yang masih terbuka (disengaja)

- **Kuis latihan bukan alat ukur integritas.** Server menjamin angka tercatat tidak bisa
  digelembungkan dari luar dan hanya naik bila jawaban yang dikirim benar. Yang tidak bisa
  dicegah tanpa mode ujian: mengulang dengan sesi/cookie baru, atau mengklik opsi satu per
  satu sampai ketemu. Jangkar integritas tetap **evaluasi** (1× percobaan, server-graded).
- **Penguncian jawaban pertama disimpan di sesi PHP**, bukan DB. Konsekuensinya, menghapus
  cookie menghapus penguncian itu. Menyimpannya di DB dengan konsekuensi "salah sekali
  terkunci selamanya" ditolak karena merusak pembelajaran.
- **`attempts` bertambah sekali per penyelesaian**, bukan per klik, jadi tidak lagi dapat
  dipakai sebagai sinyal "mencoba berkali-kali".

> Rincian perubahan: `docs/CHANGELOG.md` v2.8.0.

---

## 0.1 Pembaruan Audit — 27 September 2026 (v2.7.1)

**Cakupan:** audit lanjutan pada **lapisan client & operasi** — bagian yang terlewat di v2.7.0
karena fokusnya ada di `api/`. Semua temuan di bawah sudah **diperbaiki**, kecuali tiga
yang sengaja didokumentasikan sebagai trade-off atau|v2.8.0.

### Temuan baru yang sudah diperbaiki

| Area | Severity | Status | Catatan |
|---|---|---|---|
| **Stored XSS lewat nama mahasiswa** | 🔴 Tinggi | ✅ | `public/auth.js:199-209` menyisipkan `nama`/`nim`/`kelas` dari DB ke `innerHTML` **tanpa escape** — di sidebar yang tampil di **setiap halaman** setiap pengguna yang login. `nama` diisi dari CSV lewat `import_users.php` yang tidak menyanitasi apa pun, jadi satu baris CSV berisi `<img src=x onerror=…>` akan dieksekusi untuk semua mahasiswa **dan admin** (admin bisa ikut—when diklik/diambil CSRF-nya). Rantai ini nyata karena transport masih HTTP (password bisa disadap). Dashboard admin sendiri sudah aman (`esc()`); yang bocor justru komponen global. |
| **`setup_db.php` mengembalikan password admin** | 🟠 Sedang | ✅ | Respons JSON memuat `'login_admin' => ADMIN_DEFAULT_NIM . ' / ' . ADMIN_DEFAULT_PASS` — jadi whoever yang berhasil melewati blokir `.htaccess` **dapat membaca password admin** dalam plaintext. Field ini dihapus; hanya `admin_created` + instruksi yang dikembalikan. |
| **`api/schema.sql` bisa diunduh lewat URL** | 🟡 Rendah | ✅ | Ter-track di git, tidak ada blokir di `api/.htaccess` → menyajikan teks mentah (struktur tabel & asumsi), termasuk `api/gdrive-service.json` bila nanti ter-upload. `api/.htaccess` kini menutup `*.sql *.sqlite *.db *.log *.bak *.old *.orig *.swp *.ini *.sh *.json` (dual-sintaks). |
| **DDLvia GET di `migrate.php`** | 🟠 Sedang | ✅ | `GET /api/migrate.php` menjalankan `CREATE/ALTER TABLE` + `UPDATE users` — cukup satu tautan yang diklik admin untuk memicu (state-changing GET; `SameSite=Lax` mengizinkan cookie pada navigasi tingkat atas). Kini DDL **wajib POST + CSRF**; GET hanya membaca status skema. Ditutup dengan tombol **Jalankan Migrasi Skema** di panel agar alur ops tetap sekali klik. |
| **Logout lewat GET** | 🟢 Rendah | ✅ | `/api/logout.php` kini mewajibkan **POST + CSRF token** (`require_csrf()`). Pemicuan logout tak sengaja via navigasi browser/prefetch/pratinjau tautan telah dicegah. |
| **Rate limit login lock-out / enumerasi** | 🟡 Rendah | ✅ | Throttle di `api/config.php:login_too_many()` kini memeriksa kombinasi `username = ? OR ip = ?` sehingga penyerang dari IP yang sama dibatasi saat mencoba brute-force atau mengunci akun target secara masif. |
| **Draft evaluasi bocor antar pengguna di perangkat bersama** | 🟡 Rendah | ✅ | `src/components/Evaluasi.astro` kini menyimpan NIM pemilik draft di objek `localStorage`. Bila pengguna yang sedang aktif tidak cocok dengan pemilik draft, entri dihapus otomatis. |
| **Path traversal di `tugas_download.php`** | 🟡 Rendah | ✅ | `filename` diambil dari DB lalu disambung ke path tanpa `basename()`. Jalur ini sudah mati sejak v2.4.0 (berkas → tautan Drive), tapi `readfile()` pada `api/config.php` yang bocor kalau nilainya pernah berisi `../..`. Kini `basename()` + tolak `.`/`..`. |
| **`upload_tugas.php` menerima pertemuan non-aktif** | 🟡 Rendah | ✅ | `pertemuan_id` tidak divalidasi → mahasiswa bisa mengirim tautan tugas untuk pertemuan yang belum/non-aktif (mis. UTS/UAS) lewat crafted request. Kini harus termasuk `active_pertemuan()`. |
| **`access` diklaim "public" padahal tidak dicek** | 🟡 Rendah | ✅ | Respons GET selalu melaporkan `access: 'public'` padahal hanya saat POST tautan diperiksa terhadap Google. Sekarang `null` = "tidak diketahui" (polling tidak memanggil Google). |
| **Formula injection di ekspor CSV** | 🟡 Rendah | ✅ | Sel yang diawali `= + - @` dieksekusi sebagai formula Excel/Sheets; `nama` bisa mengandung karak itu. Ditambah kutip untuk sel berbaris baru. |
| **Invariant "kunci tidak bocor" hanya dicek manual** | 🟠 Sedang | ✅ (diperluas v2.8.0) | Klaim audit sebelumnya bertumpu pada "seseorang sempat grep `dist/`" — tidak ada yang menegakkan. `scripts/verify-build.mjs` kini **menggagalkan build** kalau `"benar": <angka>`, literal `EVAL_KUNCI`, atau urutan kunci panjang muncul di `dist/`; juga gagal kalau ada bank soal di server yang halamannya tidak merender `<Evaluasi>`. Dijalankan oleh `npm run build`, `deploy:prep`, dan CI. |

### Temuan pass ini (2 baris sudah ditutup di v2.8.0)

| Area | Severity | Detail |
|---|---|---|
| ~~**Kunci jawaban *latihan* masih inline di HTML**~~ | ✅ Ditutup v2.8.0 | Kunci latihan kini hidup di `api/kunci.php` (`KUIS_KUNCI`) dan dinilai `api/quiz.php`. Bentuk MDX berubah jadi props (`<QuizCard id="q1" soal="…" opsi={[…]} benar={n} jelas="…" />`); yang dirender hanya `{id, soal, opsi}`. `verify-build.mjs` kini **menggagalkan build** kalau `data-correct`/`data-explanation`/`KUIS_KUNCI` muncul di `dist/`, dan jumlah kartu kuis per halaman harus sama dengan jumlah soal di kunci. |
| ~~**Skor latihan client-reported** (`complete.php`)~~ | ✅ Ditutup v2.8.0 | `POST {"pertemuan_id":2,"quiz_score":1,"quiz_total":1}` dulu menuntaskan tanpa menjawab. Sekarang mahasiswa hanya boleh mengirim `jawaban` (indeks opsi), dan `complete.php` menilai ulang lewat `kuis_nilai()` memakai kunci server. Skor tidak lagi pernah dibaca dari client di endpoint mana pun (grep `in['quiz_score']` hanya menyisakan jalur admin). |
| **`ALTER TABLE … CONVERT` tiap migrasi** | 🟡 Rendah | `migrate.php` menjalankan `ALTER TABLE evaluasi CONVERT TO CHARACTER SET` **setiap kali** dipanggil (idempoten secara hasil, tapi tetap membangun ulang tabel). Pada data besar di shared hosting ini bisa timeout. Ide: jalankan sekali lalu dihapus dari skrip. |
| **Service worker cache-first untuk `auth.js`** | 🟢 Rendah | `public/auth.js` (nama tetap, tanpa hash) di-cache cache-first; versi baru baru berlaku setelah satu page view. Assets `_astro/*` aman karena hash-nya berubah. |

### Koreksi atas audit sebelumnya

- **"Tanpa CI" (entry v2.7.0 & butir P3 #14) adalah salah.** `.github/workflows/ci.yml`
  sudah ada sejak **v2.2.1** (`0b507de`) — `astro check` + `astro build` + artifact pada
  push/PR ke `main`. Yang benar adalah: **CI ada, tapi cakupannya belum memverifikasi
  kebocoran kunci** — baru v2.7.1 yang menambah langkah `verify-build`.
- Angka "84× `data-correct`" dan "18 halaman" di atas adalah hasil hitung ulang, bukan
  perkiraan.

### Yang sudah diverifikasi ulang (pass ini)

- `astro check` → **0 error, 0 warning, 0 hint** (31 berkas).
- `astro build` sukses, **39 halaman** HTML.
- `scripts/verify-build.mjs` lulus: **52 berkas teks** di `dist/` disisir, nihil
  `"benar": <angka>`, nihil `EVAL_KUNCI`, dan 9 bank soal (P1,2,3,4,5,6,7,9,10) semuanya
  punya halaman yang benar-benar merender blok evaluasi.
- Gate `verify-build` **diuji gagal dengan benar**: menyuntik `"benar": 2` + urutan kunci
  P1 ke `dist/pertemuan/1/index.html` → build dibatalkan; mengganti `id="evaluasiBox"`
  di halaman P3 → build dibatalkan juga.
- **Angka latihan di frontmatter cocok** dengan jumlah `QuizCard` di MDX untuk 9 file
  (P2 3, P3 4, P4 5, P5 7, P6 5, P7 5, P9 5, P10 5) — tidak ada selisih yang membuat
  pelacak tuntas salah hitung.
- Daftar fungsi `api/config.php` vs `api/config.example.php` tetap identik (dicek ulang).

> Rincian perubahan: `docs/CHANGELOG.md` v2.7.1.

---

## 0.2 Pembaruan Audit — 26 September 2026 (v2.7.0)

**Cakupan:** audit keamanan & performa pada lapisan API, berdasarkan pembacaan kode
(bukan hanya dokumen lama di bawah). Rilis v2.6.1 (keamanan) lalu v2.7.0 (grading server,
deploy, error handling).

### Temuan baru yang sudah diperbaiki

| Area | Severity | Status | Catatan |
|---|---|---|---|
| **Reset password admin tanpa autentikasi** | 🔴 Kritis | ✅ | `migrate.php` menerima `?token=<SETUP_TOKEN>&reset_admin=1&newpass=…` lewat **GET**, tanpa login — dan `migrate.php` tidak tercakup blokir `.htaccess`. Jalur token dihapus; kini wajib sesi admin. |
| **`.htaccess` hanya sintaks Apache 2.2** | 🔴 Tinggi | ✅ | `api/` & `admin/` pakai `order allow,deny` tanpa fallback `mod_authz_core`. Bila blokir tak berlaku, `config.php` (kredensial DB) bisa terunduh. Kini dual-sintaks. |
| **Grading & kunci evaluasi di sisi client** | 🔴 Kritis | ✅ | `benar` sempat ter-inline ke HTML tiap halaman dan `evaluasi.php` mempercayai `skor` dari client → 40% nilai akhir bisa dimanipulasi. Kunci kini hanya di `api/kunci.php` (server), skor dihitung `eval_nilai()`, `skor` client dibuang. Durasi diukur dari `action=start` di server. |
| **Skor kuis latihan client-supplied** | 🔴 Tinggi | ⚠️ | `complete.php:37` masih hanya memeriksa *gate* (pertemuan terbuka), bukan skor — mahasiswa bisa `POST {"pertemuan_id":2,"quiz_score":15,"quiz_total":15}` untuk menuntaskan tanpa menjawab. Bank soal latihan masih di MDX statis, jadi pemindahannya ke server butuh pola sama seperti evaluasi (v2.8.0). |
| **N+1 di `admin.php`** | 🟠 Sedang | ✅ | `compute_nilai()` per mahasiswa (3 query × N) + `evaluasi_list()` dua kali. 40 mhs: ~125 query → **6 query**; 500 mhs: ~1505 → tetap 6. |
| **Baris yatim saat hapus akun** | 🟠 Sedang | ✅ | `delete_user.php` hanya menghapus `progress` + `users`; `grades`/`evaluasi`/`tugas` menggantung. |
| **Dead code** | 🟡 Rendah | ✅ | `delete_user.php` menyiapkan `SELECT ROW_COUNT()` tapi tak pernah jalan; `evaluasi_list()` jadi tak terpakai setelah refactor. |
| **`config.example.php` tertinggal** | 🟠 Sedang | ✅ | Contoh config tidak mendefinisikan 4 fungsi (`evaluasi_list`, `evaluasi_rows`, `tugas_dir`, `tugas_ensure`) — deploy dari contoh berujung **fatal error** di 4 endpoint. |
| **`done_count` bisa > 100%** | 🟡 Rendah | ✅ | Menghitung semua baris `progress`, termasuk pertemuan yang dinonaktifkan admin. |

### Temuan yang masih terbuka

| Area | Severity | Detail |
|---|---|---|
| **Telemetri paste/copy/blur masih client-reported** | 🟠 Sedang | Tidak bisa diverifikasi tanpa proctoring — mahasiswa bisa mengirim nol. Sekarang **dilabeli indikatif, bukan bukti** di panel admin, dan dibatasi 0–1000. Ini trade-off sadar: sistem tidak lagi menyiratkan integritas yang tidak dimilikinya. |
| **Transport HTTP murni** | 🔴 Tinggi | Kode `is_https()` + flag `Secure` sudah siap (v2.2.1), tapi **aktivasi Cloudflare/HTTPS di hosting belum** — satu-satunya item yang sepenuhnya di luar kendali kode. |
| **Kredensial plaintext di `config.php`** | 🟠 Sedang | Di-gitignore & diblokir `.htaccess` (aman), tapi `SETUP_TOKEN` & `ADMIN_DEFAULT_PASS` lemah dan tersimpan polos di disk. Perlu rotasi. Username cPanel, nama DB, dan password admin default yang bocor ke file ter-track sudah direduksi (v2.6.1). |
| **Rate limit login per-username saja** | 🟡 Rendah | Tanpa throttle per-IP; enumerasi NIM lintas akun tidak terbatas. |
| ~~**Deploy panel admin rapuh**~~ | 🟢 Selesai (v2.7.0) | `npm run deploy:prep` menyalin `dist/admin/index.html` → `admin/panel.html` otomatis, membuang `admin/index.html` yang tak pernah dilayani, dan memverifikasi panel tidak memuat kunci jawaban. `admin/panel.html` & `_deploy/` sudah di-gitignore. |
| ~~**`backup/` duplikat basi**~~ | 🟢 Selesai (v2.7.0) | Dihapus dari repo (pulih: `git checkout HEAD -- backup/`). |
| **Tanpa CI** | 🟡 Rendah | `astro check` bersih tapi tidak ada yang menegakkannya. |

### Yang sudah terverifikasi bagus

- `astro check` → **0 error**; `astro build` sukses (39 halaman).
- **Kunci jawaban terbukti tidak bocor**: `"benar": <angka>` nihil di seluruh HTML hasil build
  (dicek dengan regex atas semua file di `dist/`), sementara urutan kunci P1 hanya ada di
  `api/kunci.php`.
- **Fungsi grading server diuji 15 kasus** (semua benar, semua salah, pembobotan tak rata,
  jumlah jawaban salah, kunci tak ada) — angkanya identik dengan perhitungan client-side lama.
- **Error handler diuji**: exception berisi kredensial/pwd → client hanya dapat JSON minimal,
  detail lengkap terkonfirmasi masuk `error_log`.
- **Tidak ada kredensial di riwayat git** (dicek seluruh revisi).
- CSRF token, bcrypt, prepared statements, `session_regenerate_id`, `api/uploads/.htaccess`
  deny-all, security headers — semua benar.
- `config.php` tidak melakukan koneksi DB saat di-load, sehingga helper nilai bisa diuji
  terpisah (**17 kasus aritmatika lulus** setelah refactor).

> Rincian perubahan: `docs/CHANGELOG.md` v2.7.0 dan v2.6.1.

---

## 0.3 Pembaruan Audit — 24 September 2026 (v2.6.0)

**Cakupan:** dashboard admin (UI konsisten + navigasi cepat) dan perbaikan mekanisme deploy.

### Hasil

| Area | Status | Catatan |
|---|---|---|
| Kosistensi UI dashboard admin | ✅ | Kartu KPI "Ringkasan" seragam (ikon+angka+label+meta); "Rekap per Kelas" & "Distribusi Nilai" dalam panel identik; kelas memakai tag berwarna. |
| Navigasi antar bagian dashboard | ✅ | Sticky jump-menu (10 bagian) + scroll-spy; latar blur; geser horizontal di mobile. |
| Render kartu tangguh CSS | ✅ | `display:block` eksplisit pada label/meta; tidak ada teks "menempel" bila CSS tertinggal. |
| **Deploy dashboard admin (Temuan)** | ✅ | UI admin lama **tidak pernah ter-update** karena `admin/index.php` membaca `panel.html`, bukan `index.html` hasil build. Diperbaiki dgn deploy `dist/admin/index.html` → `admin/panel.html`. |
| Proses deploy statis (FTP) | ✅ | `dist/` di-upload ke `htdocs/`; PHP (`api/`, `admin/index.php`) tidak tertimpa. Rincian di `docs/DEPLOYMENT.md`. |

### Catatan penting yang tersisa (bukan bagian pembaruan ini)

- Transport masih **HTTP murni** — item 🔴 P1 tetap dibuka; kode siap via `is_https()` (v2.2.1).
- ~~N+1 agregasi nilai (`admin.php`)~~ ✅ selesai v2.6.1; pagination server-side masih di P3.

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
| Persentase progres | ✅ | `done_count` dibatasi ke pertemuan aktif (v2.6.1); sebelumnya bisa > 100% |
| Ganti password | ✅ | Wajib ganti saat login pertama (halaman `/ganti-password`) |
| **Gate presentasi (v2.2.1)** | ✅ | `gateInit()` timeout + retry + tombol "Coba lagi"; SW tidak lagi meng-cache `/api/*`/challenge HTML (perbaikan "stuck" `Memeriksa akses…`) |

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
| Query agregasi (admin) | ✅ | N+1 dihapus (v2.6.1): agregat `progress`/`grades`/`evaluasi` diambil 1× masing-masing, nilai dihitung di PHP. 40 maupun 500 mahasiswa = **6 query** |
| Index DB | ✅ | PK pada `nim`, `idx_progress_nim`, PK `(nim,komponen)`, PK `pertemuan.id` |
| Koneksi DB | ✅ | PDO statis `db()` (reuse satu koneksi per request) |
| Cache API | ⚠️ | `pertemuan.php` GET stabil namun dibaca tiap halaman tanpa header cache |
| Daftar admin | ⚠️ | Tanpa pagination/sort server-side (40 data OK, ribuan bermasalah) |
| Hosting | ⚠️ | Byethost free: bandwidth/CPU/MySQL terbatas, **HTTP saja**, uptime tidak dijamin |
| Distribusi frontend | ✅ | Statis → cepat, tanpa render server per request |
| Update konten | ⚠️ | Edit isi materi butuh rebuild + redeploy penuh (bukan via panel) |

### Bottleneck yang diprediksi
- ~~Ribuan mahasiswa → agregasi nilai (N+1)~~ — ✅ teratasi (v2.6.1); sisanya sesi file PHP di shared hosting.
- Trafik besar → kuota bandwidth Byethost.
- Tumbuh multi-kelas/tahun → model data belum punya **tahun akademik** (kolom kelas saja).

---

## 4. Audit Keamanan

| Artikel | Status | Detail |
|---|---|---|
| Transport | 🔴 **KRITIS** | Situs **HTTP murni**; password terkirim plaintext. Larang deploy produksi tanpa HTTPS. **Kode siap (v2.2.1):** helper `is_https()` + flag `Secure` otomatis saat HTTPS (termasuk via proxy Cloudflare). Tersisa: pasang Cloudflare / HTTPS di hosting. |
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
| **Kunci jawaban evaluasi** | 🟢 Selesai (v2.7.0) | Kunci hanya di `api/kunci.php` (server, gitignored), skor dihitung `eval_nilai()`. Dosen bisa melihat kunci lewat `admin.php?kunci=1`. |
| **Skor latihan (`complete.php`)** | 🔴 Tinggi | `quiz_score`/`quiz_total` dikirim client dan dipercaya server. Menuntaskan pertemuan tanpa menjawab soal latihan masih mungkin. |
| **Telemetri integritas** | 🟠 Catatan | `paste_count`/`copy_count`/`blur_count` client-reported → bisa dipalsukan;durasi kini diukur server. Dilabeli advisory di panel admin. |
| **Otorisasi `migrate.php`** (v2.6.1) | 🟢 Selesai | Jalur token yang membuka reset password admin tanpa login sudah dihapus; endpoint wajib sesi admin |
| **Blokir file `.htaccess`** (v2.6.1) | 🟢 Selesai | Dual-sintaks Apache 2.4/2.2 di `api/` & `admin/` (sebelumnya 2.2 saja, berisiko blokir tak berlaku) |
| ~~**Error handling PHP**~~ | 🟢 Selesai (v2.7.0) | Handler global: semua kegagalan jadi JSON minimal 500 tanpa detail; detail lengkap hanya ke `error_log`. Race UNIQUE KEY di `evaluasi.php` ditangkap → 409. |

---

## 5. Rekomendasi Perbaikan (prioritas)

### 🔴 P1 — Keamanan (segera)
1. **Aktifkan HTTPS** — melalui Cloudflare (gratis) di depan Byethost, atau pindah hosting (Vercel/Netlify + Supabase). Setelah HTTPS: tambah flag `Secure` pada session cookie. *(kode siap v2.2.1: `is_https()` + Secure otomatis; langkah terakhir = aktivasi di hosting/Cloudflare)*
2. **Force-change password** — ✅ selesai (v2.0.1): `must_change_password`, halaman `/ganti-password`. Ide lanjutan: nonaktifkan akun yang belum ganti password dalam X hari.
3. **Rate limiting login** — ✅ selesai (v2.0.1): 10×/15 menit + delay 400ms.
4. **CSRF token** — ✅ selesai (v2.0.1), termasuk `evaluasi.php` (v2.1).
5. **Security headers** — ✅ selesai (v2.0.1). Tambahan: CSP bila memungkinkan.

### 🟠 P2 — Fungsionalitas & Data
6. **Sinkronkan progresi dengan tabel `pertemuan`** — ⚠️ sebagian: `active_pertemuan()` kini membaca `aktif=1 ORDER BY posisi` dari DB (fallback statis bila tabel belum ada). Tinggal sinkronisasi urutan sisi frontend saat admin reorder.
7. **Definisikan "tuntas" yang benar** — ✅ pertemuan tuntas bila **semua kuis latihan** benar; evaluasi kolom terpisah. v2.8.0: syarat "semua kuis benar" dihitung server dari `jawaban`, bukan angka kiriman client.
8. **Perkuat perimeter** — ⚠️ pertemuan non-aktif & non-tersedia masih memuat isi placeholder (P8, P11–16) via URL langsung — bukan leak data, tapi buat halaman terkunci tidak me-render isi di masa depan.
9. **Halaman Ganti Password** — ✅ selesai (v2.0.1).

### 🟡 P3 — Skalabilitas & Maintainability
10. **Agregasi nilai satu query** — ✅ selesai (v2.6.1): 6 query konstan via `compute_nilai_dari()`.
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
[~] HTTPS termaktif (tidak lagi HTTP murni) — kode siap (flag Secure otomatis); aktivasi Cloudflare/hosting tersisa
[x] `api/me.php` tidak lagi bisa menjatuhkan seluruh portal (fail-soft + smoke test) — v2.9.1
[x] Layout sidebar punya satu area scroll & aturan `[hidden]` berlaku (tes `test:layout`) — v2.9.2
[x] Kotak akun sidebar satu baris, tanpa duplikasi nama/progres — v2.9.3
[x] Password default sudah tidak valid / force-change aktif — selesai v2.0.1
[x] Rate limit login berfungsi (uji brute-force) — selesai v2.0.1
[~] Progresi sinkron dengan menu pertemuan yang diedit — sebagian (DB aktif), urutan frontend menyusul
[x] Nilai akhir = agregasi seluruh kuis pertemuan (bukan 1/1) — selesai v2.1 (latihan + evaluasi)
[x] N+1 di admin.php tereliminasi — selesai v2.6.1 (6 query, konstan)
[x] Security headers + CSRF token terpasang — selesai v2.0.1 (+ evaluasi.php v2.1)
[x] Halaman admin & API hanya untuk admin (server-side) — selesai
[x] Evaluasi 1× per pertemuan + anti-copy-paste + skor tanpa kunci — selesai v2.1
[x] Kunci jawaban tidak lagi di HTML & skor dihitung server — selesai v2.7.0
[x] Durasi evaluasi diukur server (bukan client) — selesai v2.7.0
[x] Skor kuis latihan diverifikasi server — selesai v2.8.0 (kunci di `api/kunci.php`
    `KUIS_KUNCI`, dinilai `api/quiz.php`, `complete.php` tidak lagi baca skor client)
[x] Kunci kuis latihan tidak lagi ada di HTML (dijalankan `verify-build.mjs`) — v2.8.0
[~] Kuis latihan bukan alat ukur integritas (sisa yang memang tidak bisa ditutup tanpa
    mode ujian: mengulang dengan sesi/cookie baru atau mengklik opsi satu per satu)
[x] Akun dummy pengujian (mhs_dummy/dummy) — selesai v2.1
```

> Catatan: item ⚠️/❌ pada audit fungsional & skalabilitas adalah direktori rekomendasi
> untuk pengembangan bertahap berikutnya, bukan kegagalan sistem saat ini untuk skala kelas IF3A (~40 mhs).