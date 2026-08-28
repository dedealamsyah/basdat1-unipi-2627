# Panduan Pengembangan

## Prasyarat

- **Node.js** ≥ 22.12.0
- **npm** ≥ 11.0.0
- **Git** (opsional, untuk version control)
- **VS Code** (recommended) dengan extension Astro

## Memulai

### 1. Clone & Install

```bash
git clone <repository-url>
cd basdat1-unipi-2627
npm install
```

### 2. Jalankan Development Server

```bash
npm run dev
```

Server berjalan di `http://localhost:4321` dengan hot reload.

### 3. Build untuk Production

```bash
npm run build
```

Output generated di folder `dist/`.

### 4. Preview Build

```bash
npm run preview
```

## Menambah Materi Pertemuan Baru

### Langkah 1: Buat File MDX

Buat file baru di `src/content/pertemuan/{id}.mdx`:

```mdx
---
id: 3
title: "Judul Pertemuan 3"
subtitle: "Subtitle pertemuan"
locked: false
order: 3
meta:
  subCPMK: "Deskripsi sub-CPMK"
  alokasi: "3 × 50 menit"
  bobot: "3%"
  cpmk: "CPMK-1"
---

import QuizCard from '../../components/QuizCard.astro';

## A. Judul Section

Konten materi di sini...

## B. Kuis

<QuizCard question="Pertanyaan kuis?">
  <button class="quiz-option" data-correct="false">Opsi 1</button>
  <button class="quiz-option" data-correct="true" data-explanation="Penjelasan">Opsi 2</button>
</QuizCard>
```

### Langkah 2: Restart Dev Server

```bash
npm run dev
```

Sidebar dan navigation otomatis ter-update.

## Menambah Game Interaktif

### 1. Buat File JavaScript

Buat file di `public/game-{nama}.js`:

```javascript
(function() {
  var startBtn = document.getElementById('gameStart');
  if (!startBtn) return;

  var QUESTIONS = [
    { q: "Pertanyaan 1", a: "JAWABAN_A" },
    { q: "Pertanyaan 2", a: "JAWABAN_B" },
  ];

  // ... logika game
})();
```

### 2. Tambahkan di MDX

```mdx
<div class="interactive-card">
  <p id="gameQuestion">Klik Mulai untuk memulai.</p>
  <button class="btn-sim" data-comp="JAWABAN_A">Jawaban A</button>
  <button class="btn-sim" data-comp="JAWABAN_B">Jawaban B</button>
  <button id="gameStart" class="btn-sim">Mulai</button>
</div>

<script is:inline src="/game-{nama}.js"></script>
```

## Mengembangkan SQL Playground

Halaman `/playground` (`src/pages/playground.astro`) menjalankan SQLite via `sql.js`.

### Cara kerja
1. `import initSqlJs from 'sql.js'` → memuat SQLite WASM
2. Wasm di-serve dari `public/sql-wasm.wasm` (jangan pindahkan — di-refer alias lokasi root `"/" + f`)
3. `new SQL.Database()` dibuat, lalu di-seed dengan data contoh dari `schemaInit()`
4. Query dijalankan lewat `db.exec(sql)`, hasil dirender sebagai tabel HTML

### Menambah tabel contoh
Tambahkan `CREATE TABLE` dan `INSERT` pada array `schemaInit()` di `src/pages/playground.astro`. Reset data akan menjalankan ulang seluruh skrip tersebut.

### Menambah preset query
Tambah objek `{ label, sql }` pada array `PRESETS`. Tombol preset otomatis dirender.

> Catatan: Jangan pindahkan `sql-wasm.wasm` keluar dari `public/`. Posisinya di-root penting karena `locateFile` menggunakan `"/" + f` agar sesuai untuk SSG statis.

## Mengembangkan Worksheet Praktikum

Halaman `/praktikum` (`src/pages/praktikum.astro`) — satu file berisi markup + script inline.

- **State** disimpan di `localStorage` (key `basdat_wks_v1`) dan diekspor/impor sebagai JSON.
- **Validasi** ada di function `validate()` — mengecek kelengkapan identitas, entitas, atribut, relasi, asumsi, lalu menampilkan skor + masalah.
- Untuk menambah studi kasus, tambahkan entri pada array `studyCases` (frontmatter) dan objek `NAR` (script).

## Komponen yang Tersedia

### QuizCard

Kuis interaktif dengan feedback.

```astro
---
import QuizCard from '../components/QuizCard.astro';
---

<QuizCard question="Pertanyaan?">
  <button class="quiz-option" data-correct="true" data-explanation="Alasan">Benar</button>
  <button class="quiz-option" data-correct="false">Salah</button>
</QuizCard>
```

### DiagramViewer

Diagram dengan zoom controls.

```astro
<DiagramViewer label="Judul Diagram" source="Sumber referensi">
  <svg viewBox="0 0 600 400">
    <!-- SVG content -->
  </svg>
</DiagramViewer>
```

### CopyCode

Otomatis ditambahkan ke semua `<pre><code>`. Tidak perlu import manual.

## CSS Classes yang Tersedia

### Layout

| Class | Fungsi |
|-------|--------|
| `.content` | Container utama konten |
| `.contentHeader` | Header halaman |
| `.eyebrow` | Label kecil di atas judul |
| `.pageTitle` | Judul halaman (h1) |
| `.pageSubtitle` | Sub-judul halaman |

### Cards & Boxes

| Class | Fungsi |
|-------|--------|
| `.interactive-card` | Container untuk interaktif |
| `.sim-box` | Box untuk simulasi |
| `.callout` | Catatan penting (teal) |
| `.callout--amber` | Catatan warning (amber) |
| `.lockedNotice` | Notice materi terkunci |

### Tables

| Class | Fungsi |
|-------|--------|
| `.dtable` | Tabel data dengan styling |
| `.dtable thead th` | Header tabel |
| `.dtable tbody th` | Row header |

### Buttons

| Class | Fungsi |
|-------|--------|
| `.btn-sim` | Tombol simulasi |
| `.quiz-option` | Opsi kuis |
| `.navBtn` | Navigasi prev/next |
| `.zoom-btn` | Tombol zoom |

### Chips & Badges

| Class | Fungsi |
|-------|--------|
| `.chip` | Badge info (teal) |
| `.chip--amber` | Badge warning (amber) |
| `.chipRow` | Container chips |

### Code

| Class | Fungsi |
|-------|--------|
| `pre code` | Code block |
| `code` | Inline code |

### Typography

| Class | Fungsi |
|-------|--------|
| `.muted` | Teks redup |
| `.refs` | Daftar referensi |
| `.steps` | Ordered list bernomor |
| `.toc` | Table of contents |

## Troubleshooting

### Build Error: "LegacyContentConfigError"

Pastikan `content.config.ts` ada di `src/content.config.ts` (bukan `src/content/config.ts`).

### Quiz Tidak Berfungsi

1. Pastikan file game JS ada di `public/`
2. Gunakan `<script is:inline src="/game-xxx.js">` (bukan inline)
3. Setiap quiz harus punya `data-quiz` ID unik

### MDX Parse Error

Hindari object literal kompleks di props MDX. Gunakan slot pattern:

```mdx
<!-- SALAH -->
<QuizCard options={[{ text: "...", correct: true }]} />

<!-- BENAR -->
<QuizCard question="...">
  <button class="quiz-option" data-correct="true">...</button>
</QuizCard>
```

### CSS Tidak Terload

Pastikan import CSS di layout:

```astro
<style is:global>
  @import '../styles/global.css';
</style>
```

## Scripts

| Command | Fungsi |
|---------|--------|
| `npm run dev` | Jalankan dev server |
| `npm run build` | Build untuk production |
| `npm run preview` | Preview hasil build |
| `npm run astro` | Jalankan Astro CLI |
