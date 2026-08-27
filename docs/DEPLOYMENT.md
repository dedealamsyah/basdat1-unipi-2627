# Panduan Deployment

## Build

```bash
npm run build
```

Output generated di folder `dist/` (HTML statis, CSS, JS, aset).

---

## Vercel (Recommended)

### Setup

1. Push repository ke GitHub/GitLab/Bitbucket
2. Buka [vercel.com](https://vercel.com)
3. Klik **"New Project"**
4. Import repository
5. Vercel otomatis mendeteksi Astro:
   - **Framework Preset:** Astro
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Klik **"Deploy"**

### Custom Domain

1. Buka **Settings** → **Domains**
2. Tambah custom domain (mis. `basisdata.unipi.ac.id`)
3. Follow instruksi DNS configuration

### Environment Variables

Tidak diperlukan untuk proyek ini (semuanya static).

---

## Netlify

### Setup

1. Push repository ke GitHub
2. Buka [app.netlify.com](https://app.netlify.com)
3. Klik **"Add new site"** → **Import an existing project**
4. Pilih repository
5. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Klik **"Deploy site"`

### netlify.toml (opsional)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 404
```

---

## GitHub Pages

### Setup

1. Pastikan repository public
2. Buat file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

3. Buka **Settings** → **Pages** → **Source**: GitHub Actions
4. Push ke `main` branch

### Konfigurasi Astro untuk GitHub Pages

Jika repository bukan root (mis. `username.github.io/basdat`):

```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://username.github.io',
  base: '/basdat',
  // ...
});
```

---

## Cloudflare Pages

### Setup

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages** → **Create** → **Pages**
3. Connect repository
4. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Deploy

---

## Server Lokal (Testing)

### Python

```bash
cd dist
python3 -m http.server 8000
# Buka http://localhost:8000
```

### Node.js

```bash
npx serve dist
```

### PHP

```bash
cd dist
php -S localhost:8000
```

---

## Deployment Checklist

- [ ] `npm run build` berhasil tanpa error
- [ ] Semua halaman bisa diakses
- [ ] Quiz interaktif berfungsi
- [ ] Dark mode berfungsi
- [ ] Mobile responsive berfungsi
- [ ] Service worker terdaftar (untuk PWA)
- [ ] Meta tags benar
- [ ] Favicon muncul

---

## Environment

| Variable | Nilai | Keterangan |
|----------|-------|------------|
| `NODE_ENV` | `production` | Set otomatis saat build |
| `SITE_URL` | `https://...` | URL deployment |

---

## Monitoring

### Core Web Vitals

Gunakan [PageSpeed Insights](https://pagespeed.web.dev/) untuk audit performa.

### Analytics (Opsional)

Tambahkan Google Analytics di `BaseLayout.astro`:

```astro
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>
```
