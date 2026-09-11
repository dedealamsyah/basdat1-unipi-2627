# Portal Materi Basis Data — UNIPI

Portal materi interaktif untuk mata kuliah **Basis Data**, Program Studi S1 Informatika, Universitas Persatuan Islam (UNIPI). Digunakan untuk perkuliahan Semester 3, TA 2026/2027.

## Ringkasan

| | |
|---|---|
| **Versi** | v2.2.0 |
| **Framework** | Astro 7.x (Static Site Generator) |
| **Backend** | PHP 8.x + MySQL (`api/` dan `admin/`) |
| **Content** | MDX (Markdown + JSX) via content collections |
| **Pertemuan** | 16 minggu (9 aktif, 7 terkunci) |
| **Output** | HTML statis di `dist/` |

## Fitur Utama

- **Materi 16 pertemuan** — ditulis MDX, dengan kuis latihan per pertemuan
- **Evaluasi per pertemuan (v2.1)** — 1× percobaan, anti-salin/pindah-tab, skor masuk nilai
- **Sistem autentikasi** — login mahasiswa & admin (NIM/NIP + password), progresi berurutan
- **Dashboard admin** — nilai akhir (kuis 40% + PTS 30% + UAS 30%), gradebook, impor mahasiswa, panel "Evaluasi & Integritas", mode presentasi dosen
- **SQL Playground** (`/playground`) — SQLite di browser (WASM), tanpa server
- **Worksheet Praktikum** (`/praktikum`) — perancangan ERD interaktif dengan auto-save
- **Diagram ERD & SVG interaktif** — zoom, hover relasi
- **Game edukatif**, dark mode, mobile responsive, **PWA** (offline)

## Cepat Mulai

```bash
# Install dependencies
npm install

# Jalankan development server (background)
astro dev --background

# Atau foreground
npm run dev

# Typecheck
npm run check

# Build produksi ke ./dist/
npm run build
```

> Catatan: modul di `api/` dan `admin/` membutuhkan PHP 8.x + MySQL. Salin `api/config.example.php` ke `api/config.php` lalu isi kredensial (file ini di-gitignore).

## Struktur Proyek

```
├── src/                   # Frontend Astro
│   ├── components/        #   QuizCard, Evaluasi, Sidebar, DiagramViewer, CopyCode
│   ├── content/
│   │   └── pertemuan/     #   16 materi perkuliahan (MDX)
│   ├── layouts/           #   BaseLayout (tema, PWA, global JS)
│   ├── pages/             #   Routing (beranda, login, admin, praktikum, playground)
│   └── styles/global.css  #   Tema "Tinta & Emas"
├── public/                # Aset statis (SVG diagram, JS interaktif, service worker)
├── api/                   # Backend PHP (login, me, complete, evaluasi, admin, ...)
├── admin/                 # Guard PHP untuk dashboard admin statis
├── docs/                  # Dokumentasi lengkap (arsitektur, deployment, audit)
└── backup/                # Versi lama (pre-Astro)
```

## Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [README](docs/README.md) | Gambaran umum & panduan singkat |
| [Arsitektur](docs/ARCHITECTURE.md) | Struktur sistem, komponen, routing |
| [Panduan Pengembangan](docs/DEVELOPMENT.md) | Cara menambah materi & komponen |
| [Panduan Deployment](docs/DEPLOYMENT.md) | Deploy ke Vercel/Netlify/GitHub Pages |
| [Panduan Kontribusi](docs/CONTRIBUTING.md) | Cara berkontribusi |
| [Audit](docs/AUDIT.md) | Hasil audit fungsionalitas, keamanan, skalabilitas |
| [Changelog](docs/CHANGELOG.md) | Riwayat perubahan |
| [Akun Mahasiswa](docs/AKUN-MAHASISWA.md) | Daftar akun percobaan |

## Deployment

Bagian static (`dist/`) bisa di-deploy ke Vercel/Netlify/GitHub Pages; bagian `api/` + `admin/` membutuhkan hosting PHP (saat ini Byethost).

```bash
npm run build
```

Lihat [Panduan Deployment](docs/DEPLOYMENT.md) untuk detail.

## Lisensi

© 2026 Program Studi S1 Informatika — Universitas Persatuan Islam