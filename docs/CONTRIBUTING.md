# Panduan Kontribusi

## Cara Berkontribusi

### 1. Menambah/Mengubah Materi

**Siapa:** Dosen pengampu atau asisten dosen

1. Clone repository
2. Edit file `src/content/pertemuan/{id}.mdx`
3. Lihat [Panduan Pengembangan](DEVELOPMENT.md) untuk format penulisan
4. Test di local: `npm run dev`
5. Commit & push

### 2. Mengubah Tampilan/Desain

**Siapa:** Developer

1. Fork repository
2. Buat branch baru: `git checkout -b fitur/nama-fitur`
3. Edit file terkait:
   - `src/styles/global.css` — untuk CSS
   - `src/components/*.astro` — untuk komponen
   - `src/layouts/BaseLayout.astro` — untuk layout utama
4. Test di berbagai device/browser
5. Buat Pull Request

### 3. Memperbaiki Bug

**Siapa:** Developer

1. Buka issue di GitHub (jika ada)
2. Fork & buat branch: `git checkout -b fix/nama-bug`
3. Perbaiki kode
4. Test perbaikan
5. Buat Pull Request dengan deskripsi jelas

## Branch Strategy

```
main          ← production (deployed)
  └── dev     ← development
       ├── fitur/xxx    ← fitur baru
       └── fix/xxx      ← perbaikan bug
```

## Commit Convention

```
type(scope): deskripsi singkat

Contoh:
feat(content): tambah materi pertemuan 3
fix(quiz): perbaiki bug kuis tidak berfungsi
docs(readme): update panduan deployment
style(css): perbaiki responsive mobile
```

**Type:**
- `feat` — fitur baru
- `fix` — perbaikan bug
- `docs` — dokumentasi
- `style` — CSS/tampilan
- `refactor` — restructuring kode
- `test` — penambahan test
- `chore` — maintenance

## Code Style

### Astro Components

```astro
---
// Frontmatter: imports & logic
import Component from '../components/Component.astro';

interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!-- Template: HTML + components -->
<div class="container">
  <h1>{title}</h1>
  <slot />
</div>

<style>
  /* Scoped styles */
  .container { max-width: 800px; }
</style>

<script is:inline>
  // Client-side JS (only when component is on page)
</script>
```

### CSS

- Gunakan CSS variables untuk warna/font
- Ikuti naming convention: `.block__element--modifier`
- Hindari `!important` kecuali benar-benar perlu
- Gunakan `rem` untuk font-size, `px` untuk border/padding kecil

### JavaScript

- Gunakan `var` atau `const/let` sesuai konteks
- Hindari framework JS berat (vanilla JS sudah cukup)
- Wrap dalam IIFE untuk menghindari global scope pollution
- Gunakan `data-*` attributes untuk interaksi

## Testing

### Manual Testing Checklist

- [ ] Semua halaman bisa diakses
- [ ] Navigasi berfungsi (sidebar, prev/next)
- [ ] Quiz interaktif berfungsi
- [ ] Game interaktif berfungsi
- [ ] Dark mode toggle berfungsi
- [ ] Mobile responsive (320px - 1920px)
- [ ] Print styles berfungsi
- [ ] Search sidebar berfungsi
- [ ] Copy code button berfungsi
- [ ] Back to top button berfungsi
- [ ] Reading progress bar berfungsi

### Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

## Report Bug

Buka issue di GitHub dengan format:

```
**Judul:** Deskripsi singkat bug

**Langkah repro:**
1. Buka halaman ...
2. Klik ...
3. Lihat ...

**Expected:** Yang seharusnya terjadi

**Actual:** Yang terjadi

**Screenshot:** (jika ada)

**Environment:**
- OS: macOS/Windows/Linux
- Browser: Chrome/Firefox/Safari
- Version: xx.x
```

## Contact

Untuk pertanyaan kontribusi:
- Email: [dosen@unipi.ac.id]
- GitHub Issues: [repository issues]
