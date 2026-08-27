# Portal Materi Basis Data — UNIPI

Portal materi interaktif untuk mata kuliah Basis Data, Program Studi S1 Informatika, Universitas Persatuan Islam (UNIPI).

## Ringkasan

| | |
|---|---|
| **Framework** | Astro 7.x (Static Site Generator) |
| **Content** | MDX (Markdown + JSX) |
| **Output** | HTML statis (~2MB) |
| **Pertemuan** | 16 minggu (3 aktif, 13 placeholder) |
| **Halaman** | 18 (beranda + 16 pertemuan + worksheet praktikum) |
| **Fitur** | Kuis, Game, Diagram ERD Interaktif, Worksheet Praktikum, Dark Mode, PWA |

## Cepat Mulai

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Buka http://localhost:4321
```

## Struktur Proyek

```
src/
├── components/       # Komponen Astro (QuizCard, Sidebar, dll)
├── content/
│   └── pertemuan/    # Materi perkuliahan (MDX)
├── layouts/          # Layout halaman
├── pages/            # Routing
└── styles/           # CSS global
```

Lihat [Arsitektur Sistem](ARCHITECTURE.md) untuk detail lengkap.

## Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [Arsitektur](ARCHITECTURE.md) | Struktur sistem, komponen, routing |
| [Panduan Pengembangan](DEVELOPMENT.md) | Cara menambah materi & komponen |
| [Panduan Deployment](DEPLOYMENT.md) | Deploy ke Vercel/Netlify/GitHub Pages |
| [Panduan Kontribusi](CONTRIBUTING.md) | Cara berkontribusi |
| [Changelog](CHANGELOG.md) | Riwayat perubahan |

## Fitur Utama

- **Kuis Interaktif** — Feedback langsung dengan penjelasan
- **Game Edukatif** — Klasifikasi komponen, entitas, dll
- **Diagram ERD Interaktif** — Hover/klik garis relasi untuk info kardinalitas & partisipasi
- **Worksheet Praktikum** (`/praktikum`) — Lembar kerja perancangan ERD interaktif (auto-save)
- **Dark Mode** — Toggle tema gelap/terang
- **Mobile Responsive** — Optimasi untuk smartphone/tablet
- **Offline Access** — PWA dengan service worker
- **Print Friendly** — CSS cetak untuk A4
- **Keyboard Shortcuts** — Navigasi cepat dengan keyboard

## Cara Menambah Materi

1. Buat file `src/content/pertemuan/{id}.mdx`
2. Isi frontmatter dan konten
3. Restart dev server

Lihat [Panduan Pengembangan](DEVELOPMENT.md) untuk format lengkap.

## Deploy

```bash
# Build
npm run build

# Deploy ke Vercel (recommended)
npx vercel

# Atau ke Netlify
npx netlify deploy --prod --dir=dist
```

Lihat [Panduan Deployment](DEPLOYMENT.md) untuk opsi lainnya.

## Tech Stack

- [Astro](https://astro.build) — Static site generator
- [MDX](https://mdxjs.com) — Markdown with JSX
- [Vanilla JS](https://developer.mozilla.org/en-US/docs/Web/JavaScript) — Interaktivitas
- [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) — Theming

## Lisensi

© 2026 Program Studi S1 Informatika — Universitas Persatuan Islam

---

*Dibuat untuk keperluan perkuliahan Basis Data Semester 3, TA 2026/2027*
