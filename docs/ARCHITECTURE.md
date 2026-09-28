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
│   │   ├── QuizCard.astro           # Kuis latihan interaktif (feedback langsung)
│   │   ├── Evaluasi.astro           # Evaluasi kartu 1 soal/halaman (+ anti-salin)
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
  },
  kuis?: {
    latihan: number    // Jumlah soal latihan (QuizCard)
    evaluasi: number   // Jumlah soal evaluasi (Evaluasi)
  }
}
```

## Komponen Interaktif (Islands)

### QuizCard

```astro
<QuizCard
  id="q1"
  soal="Pertanyaan kuis?"
  opsi={["Opsi salah", "Opsi benar"]}
  benar={1}
  jelas="Penjelasan opsi benar."
/>
```

- `id` harus urut per pertemuan (`q1`, `q2`, ...) dan stabil — id inilah yang
  dicocokkan server dengan kunci di `api/kunci.php` (`KUIS_KUNCI`)
- `benar` & `jelas` **tidak pernah dirender**. Halaman hanya menampilkan
  `{ id, soal, opsi }`; nilai dikirim server lewat `api/quiz.php`
- Wajib self-closing. Bentuk lama (slot berisi `<button data-correct>`)
  menaruh kunci jawaban di HTML dan **ditolak build** oleh
  `scripts/verify-build.mjs`
- Penilaian: client mengirim indeks opsi yang diklik (`POST /api/quiz.php`),
  server menghitung dari kunci dan mengunci jawaban pertama per soal
- Satu `<script>` ter-bundle untuk seluruh kartu di halaman (Astro dedup),
  bukan satu script per kartu

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
   ├─ me.php      : GET status sesi + progresi + rekap (skor latihan/evaluasi per
   │                 pertemuan) + nilai berjalan → sumber data UI mahasiswa
   ├─ complete.php: POST tandai tuntas (admin bebas; mahasiswa dinilai ulang
   │                 dari `jawaban` memakai kunci server)
   ├─ quiz.php    : GET state jawaban di sesi | POST nilai kuis latihan
   │                 (server-side; kunci respons pertama per soal)
   ├─ evaluasi.php: POST simpan hasil evaluasi 1× per pertemuan + telemetri integritas
   ├─ admin.php   : GET daftar mahasiswa + nilai akhir/huruf + list evaluasi; ?nim= detail
   ├─ grade.php   : POST input manual PTS/UAS/tugas/hadir (admin)
   ├─ unlock.php  : POST override done/undone (admin)
   ├─ pertemuan.php: GET metadata menu (publik) / POST update (admin)
   ├─ import_users.php : POST impor massal nim,nama,kelas (admin)
   ├─ delete_user.php  : POST hapus akun (admin)
   ├─ migrate.php : buat tabel bila belum ada (POST + sesi admin + CSRF; GET hanya
   │                 membaca status skema; idempoten; seed akun dummy)
   └─ setup_db.php: setup awal + admin pertama (token; dikunci .htaccess;
                    HAPUS dari server setelah instalasi)
```

### Skema MySQL

Tabel `users` (nim PK, nama, kelas, role mahasiswa|admin, pass_hash), `progress`
(nim+pertemuan_id PK, quiz_score, quiz_total, attempts, completed_at), `grades`
(nim+komponen PK: pts|uas|tugas|hadir, nilai), `pertemuan` (id PK, title, subtitle,
aktif, posisi, alokasi, bobot, cpmk), `login_attempts` (rate-limit), dan **`evaluasi`**
(id AI PK, nim+pertemuan-id UNIQUE, skor, total, jumlah_soal, jawaban JSON,
paste_count, copy_count, blur_count, time_spent_ms, flagged, submitted_at).

### Progresi materiketik

`status_map()` (config.php): setiap pertemuan `open` bila sebelumnya `done`.
Pertemuan pertama selalu terbuka. `active_pertemuan()` menentukan daftar konten aktif
(1–7, 9–10) — dokumentasikan untuk disinkronkan dengan tabel `pertemuan` (lihat docs/AUDIT.md).

### Evaluasi (v2.1)

- Komponen `src/components/Evaluasi.astro`: kartu pengantar → satu soal per kartu →
  kumpulkan; opsi diacak; skor ditampilkan tanpa kunci jawaban; 1× percobaan.
- Soal didefinisikan di frontmatter MDX sebagai `export const EVAL_Px` (array
  `{ soal, opsi[], benar }`) dan dirender via `<Evaluasi pid={N} data={EVAL_PN} />`.
- Penimbangan skor: 100 poin terbentang rata (sisa dibagikan) agar total selalu 100.
- **Integritas**: blokir paste/copy/konteks-menu, catat `visibilitychange` (pindah tab),
  ukur durasi; server men-gate `flagged` bitwise (1 paste/copy, 2 tab, 4 terlalu cepat).
- `compute_nilai()`: `kuis_pct` = rata-rata `kuis_latihan` (dari progress) dan
  `kuis_evaluasi` (dari tabel evaluasi); rumus akhir tetap 40% kuis + 30% PTS + 30% UAS.

### Frontend integration

- `public/auth.js` (window.APIAuth): `me/login/logout/gradeQuiz/quizState/refresh`;
  memperbarui kotak akun sidebar, progress bar, status tiap pertemuan
  (`prog-done/open/locked`), overlay menu pertemuan dari DB (judul/urutan/tampil),
  lalu meneruskan data ke `window.MhsUI.render(p)`.
- `public/mhs-ui.js` (window.MhsUI, v2.9.0): seluruh UI mahasiswa tambahan —
  model notifikasi, lonceng + panel di header, dashboard beranda, strip status
  di halaman materi, badge status di baris sidebar. Semuanya membaca `rekap` +
  `nilai` dari `/api/me.php`; untuk admin dan tamu modul ini tidak menampilkan
  apa pun. Notifikasi hanya untuk mahasiswa dan hanya menyangkut pengerjaan
  latihan/evaluasi serta skor di bawah ambang (75% / 60%).
- Halaman pertemuan: `<span id="pageMeta" data-pertemuan data-active-order>` +
  `<div id="pageStatus">` (strip status diisi MhsUI) + gate klien (overlay
  login/terkunci). Jawaban latihan dikirim ke `/api/quiz.php` (nilai dihitung
  server); evaluasi terbuka setelah latihan tuntas dan dikirim via
  `/api/evaluasi.php`.
- `src/pages/login.astro`: form login (toggle password, hint password awal = NIM).
- `src/pages/admin.astro` → di-deploy sebagai `admin/panel.html`; `admin/index.php`
  (server-side guard) membaca panel tersebut hanya untuk role admin.
- `/admin/` di-proteksi `.htaccess` (semua file kecuali `index.php` diblokir).

### Service worker (v2)

- Navigasi halaman: **network-first** (konten selalu segar, fallback ke cache saat offline).
- Aset statis: cache-first (nama diberi hash versi di `_astro/`); cache name di-bump
  (`basdat-unipi-v2`) agar versi lama ter-bersihkan saat activate.

### Catatan deployment

- Credential DB ada di `api/config.php` (gitignored); `api/config.example.php` sebagai template.
- `api/.htaccess` menonaktifkan listing direktori, memblokir `config.php`/`setup_db.php`,
  dan menutup berkas non-web (`*.sql`, `*.json`, `*.log`, …).
- Kunci jawaban evaluasi hanya di `api/kunci.php` (hasil `gen-kunci`, gitignored);
  `scripts/verify-build.mjs` gagalkan build kalau bocor ke `dist/`.
- Situs berjalan di HTTP (Byethost) → PWA & flag `Secure` tak aktif; lihat rekomendasi HTTPS di docs/AUDIT.md.
