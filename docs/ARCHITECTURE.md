# Arsitektur Sistem

## Ikhtisar

Portal Materi Basis Data UNIPI dibangun dengan **Astro** — static site generator yang menghasilkan HTML statis dengan islands architecture untuk komponen interaktif.

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                          │
│  ┌───────────┐  ┌──────────────────────────────┐   │
│  │  Sidebar   │  │       Main Content           │   │
│  │  (static)  │  │  ┌──────────────────────┐   │   │
│  │            │  │  │  MDX Content          │   │   │
│  │  - Search  │  │  │  (Markdown + JSX)     │   │   │
│  │  - Nav     │  │  └──────────────────────┘   │   │
│  │  - Theme   │  │  ┌──────────────────────┐   │   │
│  │  - Progress│  │  │  QuizCard (Island)    │   │   │
│  │            │  │  └──────────────────────┘   │   │
│  └───────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Struktur Direktori

```
basdat1-unipi-2627/
├── public/                          # Aset statis (tidak di-bundle)
│   ├── favicon.svg                  # Ikon site
│   ├── manifest.json                # PWA manifest
│   ├── service-worker.js            # Offline cache
│   ├── images/                      # Gambar materi (wajib sertakan atribusi sumber)
│   │   ├── er-diagram.jpg           # Contoh model ER (Wikimedia Commons, PD)
│   │   ├── normal-2fn.jpg           # Pelanggaran 2NF (SQLpro, CC BY-SA 4.0)
│   │   ├── normal-3fn.jpg           # Pelanggaran 3NF (SQLpro, CC BY-SA 4.0)
│   │   └── database-normalization.svg # Hirarki normal form (CC BY-SA 3.0)
│   ├── game-komponen.js             # Game interaktif P1
│   └── game-entitas.js              # Game interaktif P2
│
├── src/
│   ├── components/                  # Komponen Astro (reusable)
│   │   ├── Sidebar.astro            # Navigasi samping
│   │   ├── QuizCard.astro           # Komponen kuis interaktif
│   │   ├── DiagramViewer.astro      # Diagram dengan zoom
│   │   └── CopyCode.astro           # Tombol salin kode
│   │
│   ├── content/
│   │   └── pertemuan/               # Materi perkuliahan (MDX)
│   │       ├── 1.mdx                # Pertemuan 1
│   │       ├── 2.mdx                # Pertemuan 2
│   │       └── 3-16.mdx             # Placeholder
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro         # Layout utama
│   │
│   ├── pages/
│   │   ├── index.astro              # Halaman beranda
│   │   └── pertemuan/
│   │       └── [slug].astro         # Dynamic route per pertemuan
│   │
│   ├── styles/
│   │   └── global.css               # CSS global (1268 baris)
│   │
│   └── content.config.ts            # Schema content collection
│
├── docs/                            # Dokumentasi proyek
├── astro.config.mjs                 # Konfigurasi Astro
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript config
```

## Alur Rendering

```
1. Build Time (SSG)
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ content/     │────▶│ Astro        │────▶│ dist/        │
   │ pertemuan/   │     │ Renderer     │     │ *.html       │
   │ *.mdx        │     │              │     │ _astro/      │
   └──────────────┘     └──────────────┘     └──────────────┘

2. Runtime (Client)
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ index.html   │────▶│ CSS Loaded   │────▶│ JS Islands   │
   │ (static)     │     │ (global.css) │     │ (Quiz, Game) │
   └──────────────┘     └──────────────┘     └──────────────┘
```

## Content Collection Schema

```typescript
// src/content.config.ts
{
  id: number           // Nomor pertemuan (1-16)
  title: string        // Judul pertemuan
  subtitle?: string    // Sub-judul (opsional)
  locked: boolean      // Status kunci (true = belum tersedia)
  order: number        // Urutan di sidebar
  meta?: {
    subCPMK: string    // Sub-capaian pembelajaran
    alokasi: string    // Alokasi waktu
    bobot: string      // Bobot penilaian
    cpmk: string       // CPMK terkait
  }
}
```

## Komponen Interaktif (Islands)

### QuizCard

```astro
<QuizCard question="Pertanyaan kuis?">
  <button class="quiz-option" data-correct="false">Opsi salah</button>
  <button class="quiz-option" data-correct="true" data-explanation="Penjelasan">Opsi benar</button>
</QuizCard>
```

- Menggunakan `data-quiz` ID unik untuk scope event handler
- Client-side JavaScript hanya load saat komponen ada di halaman

### DiagramViewer

```astro
<DiagramViewer label="Diagram ERD" source="Sumber: Elmasri & Navathe">
  <svg>...</svg>
</DiagramViewer>
```

- Zoom in/out dengan tombol atau Ctrl+scroll
- Double-click untuk toggle zoom 2x
- Pan untuk navigasi gambar besar

### CopyCode

Otomatis menambah tombol "Salin" pada semua `<pre><code>` blocks.

## Routing

| URL | Deskripsi |
|-----|-----------|
| `/` | Beranda + daftar pertemuan |
| `/praktikum` | Worksheet praktikum interaktif (isian tersimpan di localStorage) |
| `/playground` | SQL Playground interaktif (SQLite via sql.js WASM) |
| `/pertemuan/1` | Pertemuan 1: Introduction to Databases |
| `/pertemuan/2` | Pertemuan 2: Perancangan Model Konseptual ERD |
| `/pertemuan/{id}` | Dynamic route untuk setiap pertemuan |

## SQL Playground

Halaman `/playground` menjalankan **SQLite** sepenuhnya di browser menggunakan **`sql.js`** (SQLite dikompilasi ke WebAssembly).

```
Browser ──▶ initSqlJs() ──▶ /sql-wasm.wasm (public/) ──▶ SQL.Database
                │
                └─▶ run(query) ──▶ db.exec() ──▶ render tabel hasil
```

- Wasm diletakkan di `public/sql-wasm.wasm` agar bisa di-fetch dari root
- 5 tabel contoh (mahasiswa, dosen, matakuliah, krs, nilai) di-seed pada inisialisasi
- 7 preset contoh query siap pakai; editor mendukung Ctrl/Cmd+Enter untuk menjalankan
- Tidak memerlukan backend — cocok untuk model SSG

## Tema (Dark Mode)

- Toggle tersimpan di `localStorage`
- Variabel CSS di `[data-theme="dark"]`
- Prefers color scheme dari OS sebagai default

## PWA (Progressive Web App)

- `manifest.json` untuk installability
- `service-worker.js` untuk offline access
- Cache-first strategy dengan network fallback

## Performa

| Metrik | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Total Blocking Time | < 200ms |
| Cumulative Layout Shift | < 0.1 |

## Dependensi

| Package | Versi | Fungsi |
|---------|-------|--------|
| astro | ^7.2.8 | Static site generator |
| @astrojs/mdx | latest | MDX support untuk konten |
| sql.js | latest | SQLite WASM untuk SQL playground |

**Total size node_modules:** ~140MB (dev), ~2MB (dist output)

---

## Subsistem Autentikasi, Progres & Admin (PHP + MySQL)

Sejak v2.0 proyek bersifat **hibrida**: frontend tetap statis (Astro SSG), namun dilapisi
subsistem dinamis PHP + MySQL yang melayani login, progres belajar, gradebook, dan panel admin.

```
Browser (statis Astro)
   │  fetch (same-origin, JSON)
   ▼
/api/*.php  (PHP 8, Byethost)  ── PDO (prepared statements) ──►  MySQL Byethost
   ├─ login.php   : POST sesi (password_hash bcrypt, regenerate id)
   ├─ logout.php  : destroy sesi
   ├─ me.php      : GET status sesi + status progresi (open/locked/done)
   ├─ complete.php: POST tandai tuntas; validasi urutan (lompat = 422)
   ├─ admin.php   : GET daftar mahasiswa + nilai akhir/huruf; ?nim= detail
   ├─ grade.php   : POST input manual PTS/UAS/tugas/hadir (admin)
   ├─ unlock.php  : POST override done/undone (admin)
   ├─ pertemuan.php: GET metadata menu (publik) / POST update (admin)
   ├─ import_users.php : POST impor massal nim,nama,kelas (admin)
   ├─ delete_user.php  : POST hapus akun (admin)
   ├─ migrate.php : buat tabel bila belum ada (admin, idempoten)
   └─ setup_db.php: setup awal + admin pertama (token; dikunci .htaccess)
```

### Skema MySQL

Tabel `users` (nim PK, nama, kelas, role mahasiswa|admin, pass_hash), `progress`
(nim+pertemuan_id PK, quiz_score, quiz_total, attempts, completed_at), `grades`
(nim+komponen PK: pts|uas|tugas|hadir, nilai), `pertemuan` (id PK, title, subtitle,
aktif, posisi, alokasi, bobot, cpmk).

### Progresi materiketik

`status_map()` (config.php): setiap pertemuan `open` bila sebelumnya `done`.
Pertemuan pertama selalu terbuka. `active_pertemuan()` menentukan daftar konten aktif
(1–7, 9–10) — dokumentasikan untuk disinkronkan dengan tabel `pertemuan` (lihat docs/AUDIT.md).

### Frontend integration

- `public/auth.js` (window.APIAuth): `me/login/logout/complete/refresh`; memperbarui
  kotak akun sidebar, progress bar, chip status tiap pertemuan (`prog-done/open/locked`),
  dan overlay menu pertemuan dari DB (judul/urutan/tampil).
- Halaman pertemuan: `<span id="pageMeta" data-pertemuan data-active-order>` + gate
  klien (overlay login/terkunci). Kuis benar → `complete()`.
- `src/pages/login.astro`: form login (toggle password, hint password awal = NIM).
- `src/pages/admin.astro` → di-deploy sebagai `admin/panel.html`; `admin/index.php`
  (server-side guard) membaca panel tersebut hanya untuk role admin.
- `/admin/` di-proteksi `.htaccess` (semua file kecuali `index.php` diblokir).

### Catatan deployment

- Credential DB ada di `api/config.php` (gitignored); `api/config.example.php` sebagai template.
- `api/.htaccess` menonaktifkan listing direktori & memblokir `config.php`/`setup_db.php`.
- Situs berjalan di HTTP (Byethost) → PWA & flag `Secure` tak aktif; lihat rekomendasi HTTPS di docs/AUDIT.md.
