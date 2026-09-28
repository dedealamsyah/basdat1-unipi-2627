# Panduan Deployment

> ⚠️ **Baca dulu untuk v2.7.0 ke atas.** Rilasan ini menambah dua hal yang **tidak ada di git**:
> `api/kunci.php` (kunci jawaban evaluasi) dan cara otomatis menyiapkan `admin/panel.html`.
> Lewati bagian ini → dashboard admin menyajikan UI lama, atau seluruh evaluasi membalas 503.
> Ringkasnya: **`npm run deploy:prep`**, upload `_deploy/`, lalu upload `api/` manual **berurutan**.

## Build

```bash
npm run build
```

Output generated di folder `dist/` (HTML statis, CSS, JS, aset).

Samping build, `npm run build` (dan `check`/`dev`) menjalankan `scripts/gen-kunci.mjs` yang
menghasilkan **`api/kunci.php`** dari field `benar` di `src/content/pertemuan/*.mdx`.
Build **gagal** kalau jumlah kunci tidak cocok dengan jumlah soal atau indeksnya di luar
rentang opsi — jadi kunci tidak mungkin diam-diam tidak sinkron dengan halaman.

Setelah `astro build`, `npm run build` juga menjalankan **`scripts/verify-build.mjs`**:
build **gagal** kalau kunci jawaban evaluasi ternyata ikut masuk ke `dist/`
(`"benar": <angka>`, literal `EVAL_KUNCI`, atau urutan kunci panjang sebagai array JSON),
atau kalau ada bank soal di server yang halamannya tidak merender blok evaluasi.
Jadi kebocoran kunci tidak lagi bergantung pada "seseorang sempat grep".

Untuk memeriksa tanpa build ulang (mis. setelah `astro build` manual):

```bash
npm run verify:build
```

## Menyiapkan paket deploy (`npm run deploy:prep`)

```bash
npm run deploy:prep
```

Sama seperti `build`, ditambah menyiapkan folder **`_deploy/`** yang siap di-upload:

| Isi `_deploy/` | Kenapa wajib |
|---|---|
| seluruh `dist/` | halaman statis |
| `admin/panel.html` | `admin/index.php` membaca berkas **ini**, bukan `index.html`. Dulu harus disalin manual dan pernah terlewat → dashboard diam-diam menyajikan UI lama. |
| `api/config.php` | kredensial DB — tidak ada di git, tapi tetap milik server ini |
| `api/kunci.php` | kunci jawaban — tidak ada di git. **Tanpa ini semua evaluasi membalas 503.** |

Skrip juga membuang `admin/index.html` hasil build (tidak pernah dilayani — `index.php` menang,
dan membocorkan isi dashboard lewat URL langsung), lalu **memverifikasi `panel.html` tidak
memuat kunci jawaban** sebelum menyatakan siap.

Folder `_deploy/` sendiri di-gitignore.

---

## Byethost (Hosting PHP saat ini) — Deploy Statis via FTP

> Kredensial FTP & akun ada di `docs/HOSTING-RAHASIA.md` (tidak di-commit).

### Tahapan

1. **Build + siapkan paket**:
   ```bash
   npm run deploy:prep
   ```
   Menghasilkan `dist/` dan `_deploy/`.
2. **Upload isi `_deploy/` ke web root** server (Byethost: folder `htdocs`) via FTP
   (`ftpupload.net`, username & password ada di `docs/HOSTING-RAHASIA.md` — file gitignored,
   jangan ditulis di sini). File yang sama ukurannya boleh dilewati.
   `_deploy/` sudah berisi `admin/panel.html` (nama yang dibaca `admin/index.php`), dan
   **tidak** berisi `admin/index.html` yang tak pernah dilayani. CSS hash baru
   `_astro/admin.*.css` ikut sebagai bagian dari `dist/`.
3. **Upload manual `api/` dari repo — URUTAN PENTING.** Berkas ini tidak ada di `_deploy/`
   (kecuali dua berkas di bawah), dan urutannya penting:

   | # | Berkas | Alasan |
   |---|---|---|
   | 1 | `api/config.php` | `compute_nilai_dari()`, `eval_kunci()` dipakai endpoint lain. Terbalik → *fatal error*. |
   | 2 | `api/kunci.php` | Kunci jawaban. Tanpa ini semua evaluasi membalas **503**. |
   | 3 | `api/*.php` | `admin.php`, `evaluasi.php`, `migrate.php`, `delete_user.php`, … |
   | 4 | `api/.htaccess` | Blokir `config.php`, `setup_db.php`, & berkas non-web (`*.sql`, `*.json`, …) (dual-sintaks 2.4/2.2). |
   | 5 | `admin/index.php`, `admin/.htaccess` | Guard server-side + blokir akses file lain. |

   `api/config.php` & `api/kunci.php` sudah ikut disalin ke `_deploy/api/` — tapi urutan
   upload tetap penting karena endpoint bisa dipanggil di antaranya.
4. **Jangan tertimpa/dihapus**: file lain di `admin/` (`panel.html` memang harus ditimpa;
   `.htaccess` & `index.php` jangan).

> ⚠️ **Cek konsistensi sebelum deploy.** Daftar fungsi `api/config.php` dan
> `api/config.example.php` harus sama; selisihnya berarti ada helper yang belum ada di server.
> ```bash
> diff <(grep -o '^function [a-z_]*' api/config.php) \
>      <(grep -o '^function [a-z_]*' api/config.example.php)   # harus kosong
> node scripts/gen-kunci.mjs                                  # harus sukses, kunci 58 soal
> node scripts/verify-build.mjs                               # harus lulus, kunci tidak bocor
> ```

### Pengerasan setelah instalasi (WAJIB, sekali)

Instalasi selesai belum tentu aman. Tiga langkah ini tidak bisa dilewati karena portal
menyimpan kredensial di disk dan melayani PHP lewat `api/`:

1. **Hapus `api/setup_db.php` dari server.** Endpoint ini membuat tabel & akun admin awal
   hanya dengan `SETUP_TOKEN`. Selama file-nya ada, siapa pun yang tahu tokennya bisa
   menjalankan ulang bootstrap. Hapus lewat FTP setelah admin pertama berhasil login.
2. **Rotasi `SETUP_TOKEN` di `api/config.php`.** Nilai di `config.example.php`
   (`CHANGE_ME_SETUP_TOKEN`) jelas placeholder; pastikan nilai di server bukan itu dan
   tidak dipakai ulang di portal lain.
3. **Ganti password admin** lewat menu Ganti Password — jangan sampai akun admin memakai
   `ADMIN_DEFAULT_PASS` selamanya.

Catatan: `api/.htaccess` juga memblokir `setup_db.php` (dual-sintaks), jadi langkah 1
adalah lapisan kedua — bukan satu-satunya.

### Migrasi skema DB

`migrate.php` (buat/perbarui tabel, seed metadata pertemuan) **wajib POST + sesi admin +
CSRF token** — membuka URL tidak lagi menjalankan `CREATE/ALTER TABLE`. Jalur GET hanya
**membaca status** skema (tabel mana yang sudah ada), jadi aman dipanggil sesuka hati.

Cara menjalankan:

- **Dari panel admin** (disarankan): bagian **3 · Kelola Menu Pertemuan** →
  **Jalankan Migrasi Skema** (ada konfirmasi) atau **Cek Status Skema** untuk melihat
  tabel yang belum ada.
- Dari terminal:
  ```bash
  curl -X POST https://domain/api/migrate.php \
       -H 'Content-Type: application/json' \
       -H 'X-CSRF-Token: <token dari /api/me.php>' \
       -b 'PHPSESSID=<sesi admin>' -d '{}'
  ```

Idempoten — aman dijalankan berulang. Yang perlu diwaspadai: `ALTER TABLE evaluasi CONVERT
TO CHARACTER SET` membangun ulang tabel, jadi beri jeda bila tabelnya besar.

### Cek cepat setelah deploy

- `panel.html` berisi penanda versi baru (mis. `admin-nav` / `id="bag-ringkasan"`).
- URL CSS `/_astro/admin.<hash>.css` yang dirujuk `panel.html` ada di server (HTTP dari IP
  lokal bisa diblokir Byethost → verifikasi via FTP `SIZE`).
- Login admin → buka `/admin/` (hard refresh Cmd/Ctrl+Shift+R untuk menyingkirkan cache).

### Riwayat

- **v2.7.0 (26 Sep 2026)** — `_deploy/` + `npm run deploy:prep` menggantikan langkah manual
  `panel.html` (penyebab dashboard lama terus tersaji) danmenambahkan `api/kunci.php`
  ke urutan deploy. Endpoint `POST /api/evaluasi.php?action=start` baru.
- **v2.6.0 (24 Sep 2026)** — ditemukan bahwa `panel.html` lama tersaji sehingga UI admin
  tidak pernah ter-update meski build baru di git. Deploy ulang `panel.html` + CSS baru
  menyelesaikannya.

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

## HTTPS: Cloudflare di depan hosting HTTP (Rekomendasi)

> Item kritis dari [Audit](AUDIT.md): tanpa HTTPS, password terkirim plaintext dan
> cookie sesi tidak bisa diberi flag `Secure`. Hosting PHP (Byethost) hanya menyediakan
> HTTP, jadi pasang **Cloudflare proxy** di depan domain agar pengunjung selalu lewat HTTPS.

### Langkah

1. Tambahkan domain di Cloudflare (rutin DNS, gratis) dan delegasikan nameserver.
2. Pada halaman **SSL/TLS**, set **Flexible** atau **Full**:
   - **Flexible**: koneksi pengunjung → Cloudflare = HTTPS; Cloudflare → origin = HTTP.
     Cukup untuk membuat cookie `Secure` aktif (dikenali via header `X-Forwarded-Proto`).
3. **Edge Certificates** → aktifkan **Always Use HTTPS** agar semua permintaan HTTP
   pengunjung di-redirect ke HTTPS.
4. Verifikasi di browser: padlock aktif, tidak ada peringatan mixed content
   (PWA/service worker tidak jalan di HTTP dan hanya terdaftar saat HTTPS).

### Perilaku di sisi kode

- `api/config.php` (helper `is_https()`) otomatis mendeteksi HTTPS:
  - `$_SERVER['HTTPS']` (HTTPS langsung), atau
  - header proxy Cloudflare `X-Forwarded-Proto: https` / `CF-Visitor`.
- Cookie sesi diberi flag `Secure` **hanya** saat `is_https()` bernilai `true`,
  sehingga saat HTTP murni pun login tetap berfungsi (tanpa flag tersebut).

### Alternatif (hosting baru)

- Hosting statis ber-HTTPS (Vercel/Netlify/Cloudflare Pages) + Supabase untuk API –
  membuat backend juga HTTPS-native.

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
