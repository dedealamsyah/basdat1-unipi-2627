# Changelog

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
- [ ] Pertemuan 6: Normalisasi Lanjutan (BCNF)
- [ ] Pindahkan materi pertemuan 11–13 agar memanfaatkan SQL playground

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
4. **Pertemuan 6** paling relevan untuk dikerjakan berikutnya (Normalisasi Lanjutan/BCNF — lanjutan dari normalisasi Pertemuan 5)
