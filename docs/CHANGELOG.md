# Changelog

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

### [1.1.0] - Planned
- [ ] Pertemuan 3: Perancangan Basis Data dengan ERD (Studi Kasus)
- [ ] Pertemuan 4: Transformasi ERD ke Model Relasional
- [ ] Pertemuan 5: Normalisasi Basis Data (1NF-3NF)

### [1.2.0] - Planned
- [ ] Pertemuan 6-10 content
- [ ] SQL syntax highlighting improvement
- [ ] Interactive SQL playground

### [2.0.0] - Future
- [ ] Backend integration (optional)
- [ ] User authentication
- [ ] Progress tracking per user
- [ ] Quiz scoring system
- [ ] Export PDF functionality
