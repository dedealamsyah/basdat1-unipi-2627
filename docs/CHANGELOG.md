# Changelog

## [2.1.0] - 2026-09-09

### Added — Latihan & Evaluasi per Pertemuan
- **Blok Evaluasi** di semua pertemuan aktif (P1–7, 9, 10) menggunakan komponen baru
  `src/components/Evaluasi.astro`; P1 & P2 masing-masing **15 soal**, sisanya 4 soal.
- Alur dua tahap: **Latihan** (feedback langsung, bisa diulang) → **Evaluasi**
  (hanya terbuka setelah pertemuan TUNTAS).
- Tampilan evaluasi **kartu satu-soal-per-halaman** + kartu pengantar + progress bar;
  mode admin = pratinjau satu-per-halaman (tanpa penyimpanan).
- **Anti-salin / anti-AI (deterrent + pemantauan)**: blokir paste/copy & klik kanan,
  hitung perpindahan tab (`visibilitychange`), ukur durasi pengerjaan; flag bitwise
  (1 = paste/copy, 2 = sering pindah tab, 4 = terlalu cepat).

### Added — Backend Evaluasi
- Tabel `evaluasi` (1× per mahasiswa/pertemuan; skor, total, jumlah_soal, jawaban JSON,
  telemetri, flagged) — dibuat idempoten di `migrate.php` **dan self-healing** di endpoint.
- Endpoint `POST /api/evaluasi.php`: validasi (pertemuan harus tuntas, skor 0..total,
  satu percobaan → 409), penghitungan flag integritas, penyimpanan; CSRF + auth.
- `compute_nilai()` (config.php): komponen **Kuis** kini = rata-rata persentase
  LATIHAN + EVALUASI (masing-masing 50% dari bobot 40%); `kuis_latihan`/`kuis_evaluasi`
  diekspos ke admin.
- `me.php` mengembalikan map `evaluasi`; `admin.php` mengembalikan `evaluasi` (list + detail
  per mahasiswa).

### Added — Dashboard Admin
- Section baru **"Evaluasi & Integritas"**: semua pengumpulan + durasi + paste/copy/tab +
  badge indikasi, filter "hanya yang terindikasi", klik NIM → detail.
- Detail mahasiswa menampilkan nilai latihan & evaluasi (kuis gabungan) + tabel evaluasi.

### Changed
- **Filter admin**: dropdown Kelas, Progres (tuntas/belum), Huruf (A–E), + pencarian NIM/nama.
- **Jumlah kuis** ditampilkan: chip `📝 N Latihan · 📋 M Evaluasi` di beranda & header pertemuan
  (field `kuis` di frontmatter).
- Akun **dummy pengujian**: `mhs_dummy` / `dummy` (kelas IF3A, tanpa paksa-ganti-password)
  di-seed `migrate.php`.
- **Service worker v2**: navigasi = network-first (konten selalu segar), aset statis
  cache-first; cache name di-bump.
- Evaluasi tangguh: CSRF diambil otomatis dari `/api/me.php`; bila server gagal, skor
  tetap tampil dan tersimpan lokal perangkat (penanda "belum terkirim").

### Fixed
- False-positive "pelanggaran" saat tombol navigasi soal (penyebab: window blur saat DOM
  di-render ulang) — pelanggaran hanya dihitung dari `visibilitychange`.
- Tombol "Kumpulkan Evaluasi" tidak merespons: binding event delegation satu kali +
  toast peringatan `pointer-events:none` agar tidak menutup tombol + `catch` jaringan.
- Konten lama tersaji karena service worker cache-first (kini network-first utk navigasi).
- Chip kuis tampil sebagai teks mentah karena string template di ekspresi Astro
  (diganti elemen JSX).

---

## [2.0.1] - 2026-09-08

### Security hardening (P1)
- **Force-change password**: kolom `must_change_password`; wajib ganti saat login
  pertama (halaman `/ganti-password`); berlaku untuk akun lama via migrasi.
- **Rate-limit login**: tabel `login_attempts`, ambang 10× gagal/15 menit per username
  → HTTP 429; + delay 400ms pada gagal (by-username, karena IP bersama tidak stabil).
- **CSRF token**: token per sesi dikirim via header `X-CSRF-Token`; divalidasi
  `require_csrf()` pada semua endpoint state-form (complete, unlock, grade, import,
  delete, pertemuan POST, change_password).
- **Security headers** (`api/.htaccess`): `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`.
- `migrate.php` dapat dipanggil via token setup saat bootstrap (login belum siap),
  plus utilitas `?clear_attempts=1`.

### Changed
- `me.php`/`login.php` mengembalikan `must_change_password`; `me` juga memberikan `csrf`.
- `login.php`/`me.php` toleran bila kolom migrasi belum ada (tidak 500).

---

## [2.0.0] - 2026-09-08

### Added — Sistem Autentikasi, Progres & Panel Admin
- Backend PHP + MySQL (Byethost): `login`, `logout`, `me`, `complete` (progresi berurutan),
  `admin`, `unlock`, `grade`, `import_users`, `delete_user`, `migrate`, `pertemuan`, `setup_db`.
- Login mahasiswa & admin (password hash, sesi HttpOnly + SameSite=Lax).
- Progresi bertingkat: pertemuan N terbuka hanya setelah N-1 tuntas; kombinasi auto (kuis benar)
  + override admin.
- Halaman `/login` (UI poles: ikon, toggle password, hint) & `/admin` (dashboard).
- **Dashboard admin kompleks**: ringkasan statistik (mahasiswa, rata-rata progres/nilai,
  tuntas 100%), distribusi nilai A–E, pencarian & filter kelas, ekspor CSV.
- **Gradebook**: nilai otomatis dari kuis (40%) + input manual PTS (30%)/UAS (30%),
  tugas & kehadiran; nilai akhir + huruf (A–E, skala SN-Dikti).
- **Kelola Menu Pertemuan** (editable): judul, sub-judul, posisi, alokasi, bobot, status
  tampil — langsung tampil di portal tanpa rebuild (overlay via `auth.js`).
- Impor massal mahasiswa: `nim,nama,kelas` / CSV / reset password (default = NIM).
- Proteksi `/admin/` server-side (guard PHP + `.htaccess`); API admin `require_auth('admin')`.

### Changed
- Tema UI total: **"Tinta & Emas"** + neumorphism; font editorial (Lora/Public Sans).
- Em-dash (—) dihapus total di seluruh teks; placeholder memakai en-dash (–).
- Logo UNIPI terpasang (sidebar, mobile header, favicon, PWA manifest).
- Data dummy diganti nama Islami-tokoh (Al-Khawarizmi, Faris Alamsyah, Ibnu Sina, dll.).
- Registrasi 40 mahasiswa IF3A (NIM 26105001–26105040, password awal = NIM);
  `docs/AKUN-MAHASISWA.md` berisi daftar akun.

### Security hardening
- `config.php` (kredensial) di-gitignore + block `.htaccess`; `config.example.php` untuk dev.
- Directory listing mati (`Options -Indexes`) di `admin/` & `api/`.
- XSS: escape via `esc()`/textContent; SQL injection: PDO prepared statements.

### Catatan batasan (lihat docs/AUDIT.md)
- Situs HTTP (Byethost) → HTTPS, force-change password, rate-limit login, CSRF token,
  dan agregasi nilai (N+1) belum tersedia; dijadwalkan sebagai langkah berikutnya.

---

## [1.8.0] - 2026-08-29

### Added

#### Content
- ✅ **Pertemuan 10: Aljabar Relasional (AR)** — lengkap (lanjutan fase implementasi/CPMK-2)
  - Sub-CPMK sesuai RPS: memecahkan permasalahan query dengan notasi Aljabar Relasional (AR) (bobot 4%)
  - Operasi dasar: select (σ), project (π), rename (ρ), union (∪), set difference (−), cartesian product (×)
  - Operasi turunan: inner/natural join (⋈), intersection (∩), division (÷)
  - Cheat sheet simbol AR + padanan SQL (WHERE, SELECT, UNION, EXCEPT, INTERSECT, JOIN)
  - Strategi pemecahan masalah query & contoh melibatkan 1–3 tabel (MAHASISWA/NILAI/MATAKULIAH)
  - Studi kasus praktikum (ANGGOTA/BUKU/PEMINJAMAN) termasuk penggunaan set difference & division utk query "untuk semua"
  - 5 kuis evaluasi + penugasan laporan praktikum algoritma relasional (AR → SQL + screenshot)
  - Terjemahan AR→SQL siap diverifikasi di SQL Playground portal

### Changed
- Jumlah pertemuan terbuka: 8 → **9** (P10 dibuka; P8 UTS & 11–16 masih terkunci)

---

## [1.7.0] - 2026-08-29

### Added

#### Content
- ✅ **Pertemuan 9: Instalasi & Akses DBMS** — lengkap (mulai fase implementasi/CPMK-2)
  - Sub-CPMK sesuai RPS: melakukan instalasi, konfigurasi, dan akses DBMS untuk membangun basis data sederhana (bobot 4%)
  - Perbandingan jenis DBMS (MySQL, MariaDB, PostgreSQL, SQLite, SQL Server, Oracle)
  - Bahasa pemrograman basis data: DDL, DML, DCL, TCL
  - Alur instalasi XAMPP (ringkas) + port default (MySQL 3306, PostgreSQL 5432)
  - Akses DBMS melalui CLI (mysql/psql) dan GUI (phpMyAdmin, MySQL Workbench, pgAdmin, DBeaver)
  - Studi kasus: basis data pertama "Akademik_UNIPI" (CREATE DATABASE + USE) terhubung ke PDM Pertemuan 7
  - Latihan pengganti tanpa instal sudah tertaut ke SQL Playground portal
  - 5 kuis evaluasi + penugasan persiapan proyek tahap 2

### Changed
- Jumlah pertemuan terbuka: 7 → **8** (P9 dibuka; P8 UTS & 10–16 masih terkunci)
- Posisi kategori sidebar & beranda: penuh otomatis dari frontmatter `locked`

---

## [1.6.2] - 2026-08-28

### Changed

- ✅ **Hilangkan seluruh em-dash (`—`) dari teks materi** (kesan hasil AI). Penggantian kontekstual:
  - Definisi & subjudul → titik dua `:` (mis. `## D.1 Aturan 1: Entitas Kuat → Tabel`, `- **Data**: fakta mentah`)
  - Prosa & kalimat lanjutan → koma `,` atau titik (mis. `...profesional: ada rak berlabel...`)
  - Notasi relasi dipertahankan dengan `·` (mis. `DOSEN · MENGAJAR · KULIAH`)
  - Cakupan: seluruh `src/content/pertemuan/*.mdx`, `Sidebar.astro`, `index/playground/praktikum`
  - Halaman yang dirender kini bebas em-dash (terverifikasi di `dist/`)

---

## [1.6.1] - 2026-08-28

### Added

#### Content (analogi penguat pemahaman)
- ✅ **Pertemuan 1** diperkaya dengan analogi:
  - "Dapur & Masakan" (data vs informasi vs DBMS) di D.1
  - "Evolusi Penyimpanan Catatan" (file → relasional → big data) di D.2
  - "Sistem Basis Data adalah Restoran" (5 komponen) di D.3
  - **Section baru D.4 Arsitektur Tiga Skema** + analogi "Restoran Berlapis" (sebelumnya hanya ada di kuis)
- ✅ **Pertemuan 2** diperkaya dengan analogi:
  - "Denah Rumah" (peran model konseptual) di D.1
  - "Kartu Keluarga" (entitas kuat vs lemah) di D.2
  - "Isian KTP" (taksonomi atribut) di D.3
  - "Hubungan Antar Manusia" (kardinalitas 1:1/1:N/M:N) di D.4

---

## [1.6.0] - 2026-08-28

### Added

#### Content
- ✅ **Pertemuan 7: Perancangan Model Fisik (PDM)** — lengkap
  - Sub-CPMK sesuai RPS: merancang model fisik sesuai spesifikasi DBMS (bobot 5%)
  - Jenjang pemodelan CDM → LDM → PDM + diagram original (SVG)
  - Peta tipe data antar DBMS (MySQL/PostgreSQL/SQLite) + tips pemilihan
  - Key & constraint (PRIMARY KEY, NOT NULL, UNIQUE, DEFAULT, CHECK, FOREIGN KEY)
  - Studi kasus PDM SIAKAD lengkap dengan DDL MySQL + sintaks dbdiagram.io
  - Alur menuju implementasi (P9–16) dan penugasan finalisasi proyek tahap 1 (UTS)
  - 5 kuis evaluasi; memakai ulang er-diagram.jpg (domain publik) dengan atribusi

### Changed
- Jumlah pertemuan terbuka: 6 → **7** (P8 UTS & 9–16 masih terkunci)

---

## [1.5.0] - 2026-08-28

### Added

#### Content
- ✅ **Pertemuan 6: Normalisasi Lanjutan (BCNF)** — lengkap
  - Sub-CPMK sesuai RPS: memecahkan masalah perancangan basis data dengan normalisasi lanjutan (bobot 5%)
  - Keterbatasan 3NF: celah "atau dependennya prime"
  - Definisi formal BCNF + prosedur uji BCNF langkah demi langkah
  - Studi kasus PENGAMPUAN (nim, kode_mk, nip): 3NF namun bukan BCNF, dengan data
  - Dekomposisi lossless-join + pembahasan dependency preservation (trade-off klasik BCNF)
  - Cheat sheet 3NF vs BCNF + 5 kuis evaluasi + penugasan lanjutan dari P5
  - Memakai kembali gambar hirarki normal form berlisensi (CC BY-SA 3.0) dengan atribusi

### Changed
- Jumlah pertemuan terbuka: 5 → **6** (Pertemuan 7–16 masih terkunci)

---

## [1.4.0] - 2026-08-28

### Added

#### Content
- ✅ **Pertemuan 5: Normalisasi Basis Data (1NF–3NF)** — lengkap
  - Sub-CPMK sesuai RPS: merancang basis data dengan teknik normalisasi (bobot 5%)
  - Tiga anomali data (insert, update, delete) dengan contoh tabel transaksi
  - Functional dependency: full, partial, transitive + latihan interaktif klasifikasi FD
  - Normalisasi bertahap UNF → 1NF → 2NF → 3NF pada studi kasus transaksi penjualan
  - Hasil akhir dikaitkan dengan skema E-Commerce Pertemuan 3–4 (validasi desain ERD)
  - Cheat sheet normal form + 5 kuis evaluasi + penugasan normalisasi pinjaman perpustakaan
- ✅ **Pertemuan 5 diperkaya** (revisi):
  - Analogi "satu binder besar" untuk anomali & "satu kunci → satu data" untuk FD
  - Bukti data sebelum/sesudah normalisasi (data TRANSAKSI dirender ulang di 4 tabel tanpa redundansi)
  - 3 variasi pola baru: kunci gabungan + transitif (SIAKAD), kunci tunggal + transitif (Rumah Sakit), atribut multivalued
  - Aturan emas: tabel ber-PK tunggal otomatis lolos 2NF
  - Kuis bertambah dari 5 → 8 soal
  - ✅ **Gambar asli (media) ditambahkan dengan atribusi sumber** (folder `public/images/`):
    - `er-diagram.jpg` — contoh model ER (Wikimedia Commons, domain publik)
    - `normal-2fn.jpg` & `normal-3fn.jpg` — contoh pelanggaran 2NF/3NF (SQLpro, CC BY-SA 4.0)
    - `database-normalization.svg` — hirarki normal form 1NF–5NF (LimoWreck/Beao, CC BY-SA 3.0)
    - Diagram FD original (SVG) "peta ketergantungan fungsional" dibuat khusus untuk portal
    - Gaya `figure.media-figure` + `figcaption` dengan blok `media-src` ditambahkan ke global.css
  - **Kebijakan media**: setiap gambar eksternal diberi keterangan sumber & lisensi; diagram yang dibuat sendiri ditandai "Gambar asli dibuat untuk Portal Basis Data UNIPI".

### Changed
- Jumlah pertemuan terbuka: 4 → **5** (Pertemuan 6–16 masih terkunci)

---

## [1.3.0] - 2026-08-28

### Added

#### Content
- ✅ **Pertemuan 4: Transformasi ERD ke Model Relasional** — lengkap
  - Sub-CPMK sesuai RPS: mentransformasikan ERD ke Relational Model (bobot 4%)
  - 6 aturan baku pemetaan ERD → skema relasi (Elmasri & Navathe)
  - Ilustrasi visual transformasi (SVG) untuk Aturan 1:N dan M:N
  - Transformasi lengkap 3 studi kasus Pertemuan 3 (SIAKAD, E-Commerce, Rumah Sakit)
  - DDL SQL `CREATE TABLE` (PK, FK `REFERENCES`, `CHECK`, `UNIQUE` untuk 1:1)
  - Cheat sheet rangkuman aturan + 5 kuis evaluasi
  - Tautan verifikasi langsung di SQL Playground + penugasan transformasi

#### Fix
- **Tombol zoom diagram kini berfungsi** di semua halaman materi. Sebelumnya markup zoom di MDX (Pertemuan 3) tidak memiliki handler JS karena komponen `DiagramViewer` tidak dirender. Zoom + pan sekarang dipasang secara global di `BaseLayout` (guard terhadap pengikatan ganda).
- **SQL Playground: error 404 `sql-wasm-browser.wasm`**. Vite me-resolve `sql.js` ke bundle browser yang meminta `sql-wasm-browser.wasm`, padahal `public/` berisi `sql-wasm.wasm` (isi keduanya identik). `locateFile` kini selalu memetakan ke `"/sql-wasm.wasm"`. Sekaligus `renderResult` kini menampilkan **semua** result set (bukan hanya yang pertama) dan preset contoh diberi guard sebelum SQLite siap.

### Changed
- Jumlah pertemuan terbuka: 3 → **4** (Pertemuan 5–16 masih terkunci)

---

## [1.2.0] - 2026-08-28

### Added

#### SQL Playground Interaktif (baru)
- ✅ **`/playground` — SQL Playground** (`src/pages/playground.astro`)
  - SQLite berjalan penuh di browser via **sql.js** (WASM), tanpa backend/server
  - Wasm disalin ke `public/sql-wasm.wasm` (di-serve dari root)
  - 5 tabel relasional contoh ter-seed otomatis: `mahasiswa`, `dosen`, `matakuliah`, `krs`, `nilai`
  - Editor query + tombol jalankan, jalankan semua (Ctrl/Cmd+Enter), reset data, bersihkan editor
  - 7 preset contoh query (SELECT, JOIN, GROUP BY, fungsi agregasi, CREATE TABLE)
  - Pemilih tabel untuk melihat isi langsung
  - Hasil dirender sebagai tabel HTML rapi
  - Link di sidebar (📌 "LAB · SQL Playground") dan beranda

#### Worksheet Praktikum (diperkuat)
- ✅ **Validasi otomatis** (section G) — memeriksa kelengkapan & konsistensi:
  - Identitas, studi kasus, minimal 2 entitas, nama entitas, duplikat, deskripsi
  - PK/atribut, referensi relasi ke entitas terdaftar, kardinalitas, asumsi
  - Output skor kelengkapan + daftar masalah kritis & saran
- ✅ **Ekspor / Impor data kelompok** (section H) — simpan & muat ulang JSON isian seluruh worksheet (untuk review silang / lanjutan di rumah)
- ✅ Print styles diperbaiki (section `break-inside`, hasil validasi terbaca saat dicetak)

### Changed
- Jumlah halaman: 19 (18 + `/playground`)
- Dependensi: tambah `sql.js`

### Roadmap (terbaru)
- [ ] Pertemuan 9: Instalasi & Akses DBMS (XAMPP/MySQL/PostgreSQL)
- [ ] Pindahkan materi pertemuan 11–13 agar memanfaatkan SQL playground
- [ ] Pertemuan 8 (UTS) & 16 (UAS): template halaman evaluasi

---

## [1.1.0] - 2026-08-27 (Booking terakhir)

### Added

#### Content
- ✅ **Pertemuan 3: Perancangan Basis Data dengan ERD (Studi Kasus)** — lengkap
  - Metodologi perancangan ERD 5 langkah
  - Studi kasus 1: SIAKAD (gambar ERD)
  - Studi kasus 2: E-Commerce (gambar ERD)
  - Studi kasus 3: Rumah Sakit (gambar ERD)
  - Checklist validasi ERD + panduan Crow's Foot
  - 4 kuis evaluasi + penugasan individu

#### Interaktivitas ERD (baru)
- **Diagram ERD interaktif** (`public/erd-interactive.js`)
  - Hover garis relasi → sorot 2 entitas + tooltip kardinalitas/partisipasi
  - Hover kotak entitas → sorot relasinya
  - Klik garis → pin tooltip (klik lagi/klik kosong untuk lepas)
  - CSS: `.entity-hl`, `.entity-dim`, `.rel-hl`, `.erd-tooltip`
- Perbaiki geometri ERD E-Commerce (relasi sebelumnya salah koneksi)

#### Halaman Baru
- ✅ **`/praktikum` — Worksheet Perancangan ERD** (menu terpisah)
  - 7 tahap: Identitas → Studi Kasus → Entitas → Atribut/Key → Relasi → Asumsi → Simpan
  - 5 studi kasus pilihan (SIAKAD, Perpustakaan, Rumah Sakit, Parkir, Hotel)
  - Isian auto-save di localStorage (key `basdat_wks_v1`)
  - Unduh laporan `.txt` & cetak/PDF
  - Item menu "🧪 Praktikum" di sidebar + tautan di beranda

#### Docs (diperbarui)
- `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md` — routing `/praktikum`
- Rubrik penilaian & RPS bisa dicek ulang di file `docs/*.docx`

### Changed
- Jumlah halaman: 18 (17 + `/praktikum`)

---

## [1.0.0] - 2026-08-27

### Added

#### Framework
- Migrasi dari vanilla HTML/JS ke **Astro 7.x** static site generator
- Content collections dengan MDX support
- Dynamic routing `[slug].astro`
- Component-based architecture

#### Components
- `QuizCard.astro` — Kuis interaktif dengan feedback
- `DiagramViewer.astro` — Diagram dengan zoom controls
- `CopyCode.astro` — Tombol salin kode otomatis
- `Sidebar.astro` — Navigasi samping dengan search

#### Features
- Dark mode toggle (tersimpan di localStorage)
- Reading progress bar
- Back-to-top button
- Mobile hamburger menu
- Sidebar search/filter
- Bookmark materi
- Keyboard shortcuts (Alt+←/→, Alt+T)

#### Content
- Pertemuan 1: Introduction to Databases (lengkap)
- Pertemuan 2: Perancangan Model Konseptual ERD (lengkap)
- Pertemuan 3-16: Placeholder

#### PWA
- `manifest.json` untuk installability
- `service-worker.js` untuk offline access

#### SEO
- Meta tags (description, keywords, author)
- Open Graph theme-color
- Schema.org JSON-LD

#### Documentation
- Architecture documentation
- Development guide
- Deployment guide
- Contributing guide

### Changed
- Struktur proyek dari flat files ke Astro project structure
- Content dari `content.js` ke Markdown/MDX files
- CSS dari inline ke global stylesheet
- Game scripts dari inline ke external JS files

### Fixed
- Quiz component bugs (scoped event handlers)
- MDX parsing errors (slot-based QuizCard)
- Mobile responsive issues

---

## [0.1.0] - 2026-08-26

### Added
- Initial release (vanilla HTML/JS)
- Pertemuan 1: Introduction to Databases
- Pertemuan 2: Perancangan Model Konseptual ERD
- Dark mode support
- Interactive quizzes
- Diagram zoom
- Mobile responsive

### Known Issues
- Quiz bugs in Astro migration (fixed in 1.0.0)
- Inline scripts conflict with MDX (fixed in 1.0.0)

---

## Roadmap

### [1.2.0] - Planned (lanjutan berikutnya)
- [ ] **Pertemuan 4: Transformasi ERD ke Model Relasional** — mapping rules ER → tabel
- [ ] **Pertemuan 5: Normalisasi Basis Data (1NF-3NF)**
- [ ] **Pertemuan 6: Normalisasi Lanjutan (BCNF)**
- [ ] Perkuat worksheet: import/ekspor relasi antar kelompok, auto-check
- [ ] Perbaiki print styles worksheet agar lebih rapi

### [1.3.0] - Planned
- [ ] Pertemuan 7-10 content
- [ ] SQL syntax highlighting improvement
- [ ] Interactive SQL playground

### [2.0.0] - Future
- [ ] Backend integration (optional)
- [ ] User authentication
- [ ] Progress tracking per user
- [ ] Quiz scoring system
- [ ] Export PDF functionality

---

## Catatan Lanjutan (checkpoint)

Untuk melanjutkan di sesi berikutnya:
1. **Menambah materi baru**: buat `src/content/pertemuan/{id}.mdx` lalu set `locked: false`
2. **Worksheet**: logika di `src/pages/praktikum.astro` (inline script, state di `localStorage` key `basdat_wks_v1`)
3. **Diagram interaktif**: tambahkan `class="entity-box" data-entity=".."` pada rect, dan `class="rel-line" data-a data-b data-cardinality data-desc data-participation` pada line relasi
4. **Pertemuan 10** kini selesai (Aljabar Relasional / AR). Berikutnya: **Pertemuan 11: SQL Dasar (DDL & DML)** yang paling relevan dilanjutkan, memakai SQL Playground / SQL online editor, lalu P12–13 (SQL kompleks & implementasi RDBMS) menyusul.
