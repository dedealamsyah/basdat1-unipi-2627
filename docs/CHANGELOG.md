# Changelog

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
4. **Pertemuan 4** paling relevan untuk dikerjakan berikutnya (mapping ERD → skema relasional dari studi kasus Pertemuan 3)
