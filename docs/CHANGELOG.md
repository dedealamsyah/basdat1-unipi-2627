# Changelog

## [2.7.2] - 2026-09-28

### Security & Hardening
- **Logout via POST + CSRF**: `api/logout.php` dan `public/auth.js` diubah menjadi POST dengan validasi token CSRF (`require_csrf()`). Mencegah forced logout / DoS pemicuan GET via prefetch link/navigasi luar.
- **Rate Limit Login IP + Username**: `api/config.php` memeriksa `username = ? OR ip = ?` untuk menahan serangan enumerasi dan penguncian akun (lock-out) terdistribusi dari satu sumber IP.
- **Isolasi Draft Evaluasi di LocalStorage**: `src/components/Evaluasi.astro` menyertakan NIM pemilik draft; draft langsung dibersihkan otomatis jika akun yang login berbeda, mencegah kebocoran sisa jawaban di komputer bersama.

---

## [2.7.1] - 2026-09-27

> ⚠️ **DEPLOY — BACA DULU.** Rilisan ini memindahkan kunci jawaban evaluasi ke server dan
> menambahkan berkas baru yang **tidak ada di git**. QName & urutan upload ada di
> `docs/DEPLOYMENT.md`. Ringkasnya:
>
> 1. `npm run deploy:prep` → menghasilkan `_deploy/` (statis + `admin/panel.html`
>    + `api/config.php` + `api/kunci.php`).
> 2. Upload `_deploy/` ke `htdocs/`.
> 3. Upload manual dari repo, **berurutan**: `api/config.php` → `api/kunci.php` →
>    `api/*.php` → `api/.htaccess` → `admin/index.php` + `admin/.htaccess`.
>
> Tanpa `api/kunci.php` di server, semua endpoint evaluasi menjawab 503
> ("Kunci jawaban belum tersedia di server").

### Security — Grading evaluasi dipindah ke server (kunci tidak lagi di browser)

Ini menutup temuan paling serius di audit v2.6.1: **40% nilai akhir bisa dimanipulasi
mahasiswa dan seluruh deteksi integritas bisa dipalsukan.**

- **Kunci jawaban tidak lagi ada di HTML.** Sebelumnya `Evaluasi.astro` melakukan
  `define:vars={{ data }}` atas bank soal yang masih memuat field `benar` — jadi seluruh
  kunci bisa dibaca dari View Source, lalu jawaban dikirim lagi agar dijamin benar.
  Kini hanya `soal` + `opsi` yang dikirim (`soalTanpaKunci`).
- **Skor dihitung server, `skor` dari client dibuang.** `evaluasi.php` kini memuat
  `api/kunci.php` lewat helper `eval_nilai()` dan menghitung sendiri dari `jawaban`.
  Field `skor`, `total`, dan `jumlah_soal` dari client **tidak pernah dibaca lagi**.
  Bobot per soal tetap sama seperti versi lama (rata; sisa dibagi ke soal awal), jadi
  angka yang sudah tercatat tidak berubah.
- **Durasi dihitung server dari waktu yang dicatat server.** Endpoint baru
  `POST /api/evaluasi.php?action=start` menyimpan waktu mulai di sesi server saat form
  dibuka; saat submit, durasi = selisih waktu server. Mahasiswa tidak lagi bisa
  mengarang `time_spent_ms` (mis. melaporkan 5 detik untuk 15 soal). Sisa celahnya:
  menunda submission — tapi itu hanya membuat waktu terlihat lebih lama, tidak pernah
  lebih cepat.
- **Telemetri ditandai jujur sebagai advisory.** `paste_count`, `copy_count`,
  `blur_count` tetap dikirim browser dan **tetap bisa dimalsukan**; tidak ada cara
  memverifikasinya tanpa proctoring. Ketiganya kini diberi batas atas (0–1000) dan
  dilabeli indikatif di panel admin, bukan bukti. Ini trade-off yang disengaja:
  sistem tidak lagi menyiratkan-integritas yang tidak dimilikinya.
- **Dosen diberi akses kunci lewat endpoint khusus** `GET /api/admin.php?kunci=1`
  (admin-only) + tombol "Lihat kunci jawaban" di dashboard. Sebelumnya akses ini
  "gratis" lewat View Source; sekarang eksplisit dan tercatat sebagai akses admin.
- **Kegagalan server tidak lagi menampilkan skor palsu.** Dulu `localSaveAndShow()`
  menghitung skor di browser dan menampilkannya walau request gagal — cukup memutus
  koneksi untuk melihat nilai. Sekarang skor hanya ada di server; kalau gagal, tampil
  pesan dan jawaban tetap bisa di-submit ulang.

### Added

- **`scripts/gen-kunci.mjs`** — mengekstrak kunci jawaban dari `src/content/pertemuan/*.mdx`
  (field `benar`) ke `api/kunci.php`. Dijalankan otomatis oleh `npm run build`/`check`/`dev`.
  Validasi keras: jumlah `benar` harus cocok dengan jumlah field `soal:` (penghitung
  independen dari parser, supaya pergeseran format tidak lolos diam-diam), indeks harus
  dalam rentang opsi, dan `export const EVAL_` tanpa soal dianggap error. Build **gagal**
  kalau salah satu tidak terpenuhi. Output berisi jawaban → di-gitignore.
- **`api/kunci.php`** — hasil generate: `EVAL_KUNCI[pertemuan_id] = ['benar' => [...], 'opsi' => [...]]`.
- **`api/config.php`**: `eval_kunci_map()`, `eval_kunci()`, `eval_nilai()`.
- **`npm run deploy:prep`** (`scripts/build-deploy.mjs`) — build lalu menyiapkan `_deploy/`:
  menyalin `dist/admin/index.html` → `admin/panel.html` (langkah yang dulu harus
  dilakukan manual dan pernah terlewat → dashboard admin diam-diam menyajikan UI lama),
  membuang `admin/index.html` yang tidak pernah dilayani, menyertakan
  `api/config.php` + `api/kunci.php`, lalu **memverifikasi panel.html tidak memuat kunci
  jawaban** sebelum keluar sebagai "siap upload".
- **Error/exception handler global** di `config.php`. Sebelumnya `PDOException` yang tak
  tertangani berakhir sebagai *fatal error*; bila `display_errors` aktif di hosting, path,
  query, dan detail koneksi bocor ke mahasiswa. Sekarang semua kegagalan jadi JSON minimal
  500, sementara detail lengkap tetap masuk `error_log` server.

### Fixed

- **Race pada `evaluasi.php`**: pengecekan "sudah pernah dikumpulkan" berjalan sebelum
  `INSERT`, sehingga dua request bersamaan bisa lolos. Pelanggaran `UNIQUE KEY` kini
  ditangkap dan dibalas 409 (bukan 500).
- **`api/config.php` & `api/kunci.php` di-`.gitignore`**, bersama `admin/panel.html` dan
  `_deploy/` — artefak build 84KB tidak lagi bisa ikut ter-commit `git add -A`.
- **`tsconfig.json`**: `exclude` `backup` → `_deploy` (folder lama sudah dihapus).

### Removed

- **`backup/`** — versi pra-Astro portal (729 baris `app.js`, `content.js`, PWA sendiri).
  Tidak direferensikan dari `src/`, `public/`, atau config build; terakhir disentuh saat
  migrasi ke Astro. README-nya masih menyuruh "buka `index.html` langsung di browser" dan
  mengarahkan edit materi ke `content.js`, yang sudah tidak berlaku — jadi hanya menyesatkan.
  Dipulihkan bila perlu: `git checkout HEAD -- backup/` (masih ada di riwayat).

---

## [2.6.1] - 2026-09-26

> ⚠️ **URUTAN DEPLOY WAJIB (v2.6.1)** — `api/config.php` ada di `.gitignore`, jadi
> perubahan helper di sana **tidak ikut** saat upload via git/FTP massal.
> `api/admin.php` dan `api/grade.php` kini memanggil `compute_nilai_dari()`, yang hanya ada
> di `config.php` versi baru. **Upload `api/config.php` DULU**, baru `api/admin.php` &
> `api/grade.php`. Kalau terbalik → *fatal error* `Call to undefined function`.
> Daftar fungsi wajib sinkron antara `api/config.php` (server) dan `api/config.example.php`
> (repo) — keduanya kini identik modulo 4 konstanta kredensial.

### Security — Tutup bypass reset password admin tanpa autentikasi

- **`api/migrate.php` tidak lagi menerima jalur token setup.** Sebelumnya
  `GET /api/migrate.php?token=<SETUP_TOKEN>&reset_admin=1&newpass=...` mengganti password
  admin **tanpa perlu login**, hanya dengan mengetahui token. `migrate.php` juga tidak
  tercakup blokir di `api/.htaccess` (hanya `config.php` + `setup_db.php`), sehingga
  endpoint ini benar-benar terjangkau publik.
  - Kini seluruh `migrate.php` wajib sesi admin (`require_auth('admin')`); jalur token dihapus.
  - Utilitas `reset_admin` dihapus — tidak berguna sebagai ops saat sudah login (pakai
    `change_password.php`). Pemulihan password admin yang lupa kini lewat phpMyAdmin/hosting.
  - Utilitas `clear_attempts` dipindah ke **POST + `require_csrf()`** agar tidak bisa
    dipicu GET (prefetch, riwayat, pratinjau tautan).
  - Bootstrap awal tidak terganggu: tetap lewat `setup_db.php` (wajib token, diblokir `.htaccess`).
- **`.htaccess` ditulis dual-sintaks (Apache 2.4 + 2.2)** di `api/` dan `admin/`.
  Sebelumnya hanya `order allow,deny` / `deny from all` (2.2). Bila host Apache 2.4 tanpa
  `mod_access_compat`, blokir tersebut tidak berlaku — berisiko `config.php` (kredensial DB)
  bisa terunduh. Sekarang memakai `<IfModule mod_authz_core.c>Require all denied</IfModule>`
  dengan fallback 2.2, mengikuti pola yang sudah dipakai `api/uploads/.htaccess`.

### Security — Kredensial yang bocor ke file ter-track git

Nilai kredensial sengaja **tidak ditulis ulang** di entri ini — hanya lokasinya.

- **`docs/DEPLOYMENT.md` menuliskan username cPanel/FTP.** Username adalah separuh kredensial.
  Diganti rujukan ke `docs/HOSTING-RAHASIA.md` (gitignored).
- **`api/schema.sql` menuliskan nama database** (mengandung username yang sama) → diganti
  keterangan umum.
- **Password admin default tercantum** di `api/schema.sql` (komentar), `api/setup_db.php`
  (docblock), dan `docs/AKUN-MAHASISWA.md` (tabel akun) — nilainya persis sama dengan
  `ADMIN_DEFAULT_PASS` di `config.php`. Siapa pun yang membaca repo akan tahu password
  pertama yang harus dicoba. Ketiganya diganti rujukan.
- **Password database sendiri tidak pernah masuk git** (tetap hanya di `api/config.php` yang
  di-gitignore) — diverifikasi ulang di seluruh riwayat revisi.
- **Efek git tidak bisa dihapus Fully.** Nilai-nilai ini masih ada di riwayat revisi.
  Karena itu **langkah yang benar-benar perlu dilakukan: rotasi** password admin default,
  `SETUP_TOKEN`, dan password database. Redaksi berkas hanya mencegah kebocoran lanjutan.

### Performance — Hilangkan N+1 di `admin.php`

- **`admin.php` jalur daftar tidak lagi query per mahasiswa.** Sebelumnya `compute_nilai()`
  dipanggil di dalam loop (3 query × N: `progress`, `grades`, `evaluasi`). Sekarang semua
  agregasi diambil satu kali per sumber data (`GROUP BY` pada `progress`, satu query penuh
  `grades`, satu query `evaluasi` JOIN `users`), lalu nilai tiap mahasiswa dihitung di PHP
  lewat `compute_nilai_dari()`.
  - 40 mahasiswa: ~125 query → **6 query**. 500 mahasiswa: ~1505 → tetap **6 query**.
- **`evaluasi_list()` tidak lagi dipanggil dua kali.** Satu query `evaluasi` sekarang mencakup
  tiga kebutuhan sekaligus: agregat per mahasiswa, daftar panel integritas, dan grid nilai
  (`eval_by_student`). Fungsi `evaluasi_list()` yang jadi tak terpakai sudah dihapus.
- **`done_count` hanya menghitung pertemuan yang aktif.** Sebelumnya `COUNT(p.pertemuan_id)`
  menghitung semua baris `progress`, termasuk pertemuan yang lalu dinonaktifkan/diubah admin —
  persentase progres bisa melewati 100%. Sekarang dibatasi `IN (id_aktif)`.
- **Fungsi matematika dipisah dari query.** `compute_nilai()` (satu mahasiswa, dipakai
  `grade.php` & `admin.php?nim=`) kini mengumpulkan agregat lalu mendelegasikan ke
  `compute_nilai_dari()` yang murni aritmatika — teruji 17 kasus (kombinasi latihan/evaluasi,
  nilai manual kosong, konversi huruf).
- `evaluasi_pct()` ditulis ulang di atas helper `evaluasi_sum()` baru (tanpa mengubah
  perilaku: tetap `null` bila tabel belum termigrasi).

### Fixed — `delete_user.php` meninggalkan baris yatim & dead code

- **Hapus akun kini bersih.** Sebelumnya hanya menghapus `progress` + `users`, sehingga
  `grades`, `evaluasi`, dan `tugas` menggantung sebagai baris yatim (FK tidak dideklarasikan,
  jadi tidak ada error — diam-diam menumpuk). Kini keempat tabel dihapus dalam satu transaksi.
- **Dead code dibuang**: `$deleted = $pdo->prepare('SELECT ROW_COUNT()')` disiapkan tapi
  tak pernah dieksekusi.

### Fixed — `config.example.php` tertinggal 4 fungsi

- Contoh konfigurasi tidak lagi mendefinisikan `evaluasi_list`, `evaluasi_rows`, `tugas_dir`,
  dan `tugas_ensure`. Anyone yang deploy dari contoh itu akan mendapat **fatal error** di
  `admin.php`, `me.php`, `upload_tugas.php`, dan `tugas_download.php`. Kini contoh adalah
  salinan penuh `config.php` dengan kredensial di-placeholder, diverifikasi hanya berbeda di
  4 konstanta kredensial + marker `DO_NOT_LOG`.

---

## [2.6.0] - 2026-09-24

### Changed — Dashboard admin: UI Ringkasan seragam & navigasi cepat antar bagian

- **Kartu KPI "Ringkasan" diseragamkan**: layout ikon + angka + label + meta yang sama untuk
  keempat kartu (Mahasiswa Terdaftar, Rata-rata Progres, Rata-rata Nilai, Tuntas 100%).
  Varian warna teal→hijau→navy→amber konsisten antara aksen atas kartu dan chip ikon.
- **"Rekap per Kelas" & "Distribusi Nilai"** kini dalam panel identik (`panel__title`) sehingga
  kolom kiri–kanan seimbang; kartu kelas memakai tag kelas berwarna + nilai + baris Progres/Nilai Ø.
  Distribusi nilai memakai track bar dengan border agar tetap terlihat saat 0.
- **Navigasi cepat (sticky jump-menu)**: menu bagian menempel di atas layar saat scroll
  (Mengajar, Ringkasan, Pencarian, Menu Pertemuan, Import Akun, Mahasiswa, Nilai, Integritas,
  Tugas, Template ERD) lengkap dengan **scroll-spy** yang menyorot bagian aktif; di mobile
  menu dapat digeser horizontal. Admin/dosen tidak perlu lagi scroll panjang.
- **CSS lebih kokoh**: `display:block` eksplisit pada `.stat-label`, `.stat-meta`,
  `.kcard__label`, `.kcard__rows` agar angka/label tidak pernah "menempel" bila stylesheet
  sebagian gagal termuat; divider solid menggantikan garis putus-putus.

### Fixed — Deploy dashboard admin (UI tidak pernah ter-update di server)

- **Akar masalah**: `admin/index.php` di server membaca **`panel.html`** sebagai konten
  dashboard — bukan `index.html` hasil build. Selama `panel.html` tidak diperbarui, UI lama
  selalu tersaji meski build baru sudah di-push ke git.
- **Perbaikan**: hasil build `dist/admin/index.html` di-deploy ke **`htdocs/admin/panel.html`**
  (bukan `index.html`); plus CSS `_astro/admin.*.css` baru. File `admin/index.html` sisa yang
  tidak diperlukan dihapus (akses web-nya memang di-block `.htaccess`).
- **Deploy via FTP**: seluruh isi `dist/` di-upload ke `htdocs/` (23 file baru, 45 sama);
  bagian PHP (`api/`, `admin/index.php`, `presentasi.php`) **tidak** ikut tertimpa.

---

## [2.5.0] - 2026-09-23

### Added — Template Worksheet Perancangan ERD (mode mengajar, khusus admin)

- **Panel admin · section "Template Worksheet Perancangan ERD"**: 5 template studi kasus lengkap
  (SIAKAD, Perpustakaan, Rumah Sakit, Parkir, Hotel) berisi entitas, atribut & key, relasi
  (kardinalitas + partisipasi), dan asumsi — model jawaban langsung jadi.
- Tombol **Solusi**: menampilkan model jawaban di panel admin untuk dijelaskan di kelas
  (tanpa mengetik manual). Tombol **Terapkan**: mengisi worksheet `/praktikum` secara otomatis
  melalui localStorage lalu membukanya untuk demonstrasi. **Reset Worksheet** mengosongkannya.
- Template **hanya dibundel di halaman admin** (`src/data/erdTemplates.ts`, di-gate side-server
  oleh `admin/index.php`) — **tidak tersedia/bocor di halaman mahasiswa**.

---

## [2.4.0] - 2026-09-18

### Changed — Pengumpulan tugas lewat tautan Google Drive (buka-ganti dari unggah PDF)

- **Alur baru**: mahasiswa mengunggah berkas ke Google Drive pribadi, mengatur berbagi
  menjadi **"Siapa saja yang memiliki link"**, lalu menempelkan tautannya di portal.
  Tidak ada lagi unggah berkas ke server maupun service account Drive.
- **`api/upload_tugas.php`**: menerima `{ pertemuan_id, drive_link }` (JSON), memvalidasi
  bahwa tautan benar dari `drive.google.com`/`docs.google.com`, mengekstrak file id,
  lalu mengecek akses publik memakai endpoint unduhan publik Google
  (`docs.google.com/uc?export=download`). Tautan **privat ditolak** (422 + pesan arahan),
  akses tak-konkret diizinkan dengan status `unknown`.
- **DB `tugas`**: kolom baru `drive_link VARCHAR(700)` (idempoten via `tugas_ensure()`
  di `config.php`, dipakai `upload_tugas.php` & `admin.php`; sinkron `migrate.php` &
  `schema.sql`). Data lama (berkas PDF) tetap tersimpan & tetap bisa diunduh admin.
- **`src/components/TugasUpload.astro`**: input tautan + langkah 3-tahap (unggah →
  berbagi publik → tempel tautan), validasi URL sisi klien.
- **Dashboard admin**: section "Pengumpulan Tugas (Link Drive)", tombol **Buka** membuka
  tautan; mode lama tetap memakai **Unduh** (fallback berkas lokal).
- **`api/tugas_download.php`**: kini redirect ke tautan Drive; fallback ke berkas PDF lama.
- **`api/lib-drive.php` Dihapus**: layanan unggah otomatis (Service Account) tidak lagi
  diperlukan. `TUGAS_DRIVE_FOLDERS` serta `gdrive_*()` dibersihkan dari `config.php`
  (dan `config.example.php`); `tugas_dir()` dipertahankan hanya untuk unduh berkas
  PDF versi lama di `tugas_download.php`.

### Fixed

- Halaman **Pertemuan 2 di server ternyata 0 byte** (rusak sejak lama) → dipulihkan dengan
  hasil build baru.

---

## [2.3.0] - 2026-09-13

### Added — Nilai evaluasi & pengumpulan tugas
- **Dashboard admin · "Nilai Evaluasi Mahasiswa"**: matriks persentase skor evaluasi per
  pertemuan (hijau ≥80/amber 60–79/merah <60), titik merah indikasi integritas, kolom rata-rata
  evaluasi; data `eval_by_student` dari satu query `evaluasi_list()`.
- **Pengumpulan tugas PDF (Pertemuan 2)**: komponen `TugasUpload` di materi (Latihan Mandiri
  Belajar Mandiri), format PDF maks. 8 MB, satu pengumpulan boleh diganti, self-healing tabel
  `tugas`, penyimpanan di `api/uploads/tugas` (diblokir akses web langsung), unduh khusus admin
  (`/api/tugas_download.php`).
- **Google Drive (opsional)**: unggah otomatis ke Drive per pertemuan via service account
  (`api/gdrive-service.json` + `TUGAS_DRIVE_FOLDERS`); tanpa kredensial cukup tersimpan lokal.
- **Dashboard admin · "Pengumpulan Tugas PDF"**: daftar unggahan + tombol Unduh.
- `auth.js`: FormData tidak lagi dikonversi JSON pada `APIAuth.api()`.

### Fixed
- **JOIN evaluasi gagal**: tabel `evaluasi` dibuat dgn kolasi `utf8mb4_unicode_ci` sementara tabel
  lain `utf8mb4_general_ci` → `Illegal mix of collations` membuat "Evaluasi & Integritas" tampil
  0 pengumpulan padahal ada 42. Sinkronisasi kolasi di `migrate.php` (idempoten) + ALTER di DB live.

---

## [2.2.1] - 2026-09-11

### Fixed — Mode Presentasi Dosen "stuck" di "Memeriksa akses…"

- **Akar masalah (infrastruktur)**: hosting Byethost mengirim **halaman challenge anti-bot
  (HTML)** untuk `/auth.js` & `/api/me.php` bila cookie `__test` belum terverifikasi.
  Karena service worker memakai strategi cache-first untuk SEMUA GET non-navigasi, challenge
  HTML bisa tersimpan sebagai isi `auth.js`/`me.php` dan disajikan ulang → `window.APIAuth`
  tak pernah ada / `me()` bergantung selamanya → gate presentasi macet.
- **`public/service-worker.js`**:
  - `/api/*` dan seluruh request data (`destination === ""`) kini **network-only** (tidak
    pernah di-cache) → respons sesi/nilai selalu segar.
  - Hanya meng-cache aset yang memang aset (bukan `text/html`), sehingga HTML challenge
    hosting tidak pernah mencemari cache. Fungsi `cacheable()`.
  - Cache name di-bump ke **`basdat-unipi-v3`** → cache lama (berpotensi tercemar) dibersihkan
    saat activate.
- **`src/pages/pertemuan/[slug]/presentasi.astro`** — `gateInit()` kini anti-stuck:
  - Polling menunggu `window.APIAuth` termuat (~6 detik) sebelum menampilkan error.
  - Timeout 15 detik pada `me()`; bila melewati batas atau gagal, gate menampilkan pesan
    jelas + tombol "Coba lagi" (reload) alih-alih menggantung di "Memeriksa akses…".
- **`public/auth.js`, `src/pages/admin.astro`, `src/components/Evaluasi.astro`** — `fetch`
  kini dibatasi `AbortController` 15 detik sehingga API yang lambat/kemacetan jaringan tidak
  meninggalkan UI menggantung selamanya (bila salah, promise mereject → `.catch` pemanggil).

### Changed — Dokumentasi & higienitas kode

- **`README.md`**: boilerplate Astro starter diganti ringkasan proyek (fitur, struktur,
  perintah, tautan ke `docs/`).
- **CI/CD**: `.github/workflows/ci.yml` (npm ci → astro check → astro build → artifact).
- **Keamanan P1 (persiapan)**: helper `is_https()` + flag `Secure` otomatis pada cookie sesi
  (termasuk via proxy Cloudflare) di `api/config.php` & `api/config.example.php`; panduan
  Cloudflare di `docs/DEPLOYMENT.md`.
- **TypeScript bersih: 38 hint → 0** (`astro check`): `z` dari `astro/zod`, `async`/`await`
  di `auth.js`/`Evaluasi.astro`/`admin.astro`, hapus variabel tak terpakai
  (`erd-interactive.js`, `service-worker.js`, `presentasi.astro`, `admin.astro`), pengecualian
  folder legacy `backup/` di `tsconfig.json`.

---

## [2.2.0] - 2026-09-10

### Added — Mode Presentasi Dosen
- Halaman `/pertemuan/{id}/presentasi`: mode slide fullscreen untuk penyampaian materi
  di kelas, terpisah per bagian `##` heading; navigasi keyboard (`←/→/Space/F/G/Esc`),
  klik kiri/kanan area slide, progress bar, daftar slide panel.
- Gate akses: hanya admin/dosen (via `APIAuth.me`). Slide dibangun client-side dengan
  memindahkan node DOM (event listener komponen interaktif tetap hidup).

### Added — Panel "Mode Mengajar" di Dashboard Admin
- Section pertama di `/admin` berisi kartu per pertemuan dengan tombol
  "Presentasikan" → buka halaman presentasi + "Buka Materi" → halaman materi standar.
- Menampilkan metadata: alokasi, bobot, CPMK; badge AKTIF/SEMBUNYI.

### Added — 8 Gambar SVG Interaktif (P1–P4, P9, P10)
- `p1-komponen-sistem.svg`: 5 komponen sistem basis data
- `p1-three-schema.svg`: Arsitektur tiga skema (ANSI-SPARC)
- `p2-taksonomi-atribut.svg`: Taksonomi atribut + contoh PK
- `p2-crows-foot.svg`: Notasi Crow's Foot (1:1, 1:N, M:N)
- `p3-metodologi-erd.svg`: Alur 5 langkah metodologi perancangan ERD
- `p4-aturan-transformasi.svg`: Ringkasan 6 aturan transformasi ERD→relasional
- `p9-bahasa-sql.svg`: Empat bahasa SQL (DDL/DML/DCL/TCL)
- `p10-operasi-ar.svg`: 6 operasi dasar aljabar relasional + join turunan

### Changed — Konsistensi Konten MDX
- Sisipkan gambar via `<figure class="media-figure">` ke pertemuan 1, 2, 3, 4, 9, 10.

### Fixed — Bug Fixes
- **`api/schema.sql`**: tambah kolom `must_change_password` (hilang vs `setup_db.php`,
  menyebabkan error SQL pada fresh install dari schema).
- **`api/config.example.php`**: hapus kredensial asli (DB password, admin password,
  setup token) → ganti placeholder. Sinkronkan `compute_nilai()` (tambah
  `evaluasi_pct()`, `kuis_latihan`, `kuis_evaluasi`) agar identik `config.php`.
- **`api/config.php`**: parameterized query untuk `DELETE login_attempts`
  (`INTERVAL ? MINUTE`) mengganti interpolasi string.
- **`public/auth.js`**: pertahankan CSRF token setelah login sukses
  (`csrfToken = ""` diganti → simpan token dari server jika ada).
- **`src/pages/login.astro`**: reset `btnText` ke "Masuk" di semua path error
  `warmUp()` (sebelumnya tetap "Menghubungi…" saat API tidak merespons).
- **`src/components/Sidebar.astro`**: ubah selector click handler dari
  `.row:not(.locked)` global → `#sidebarList .row:not(.locked)` agar tidak
  meng-intercept baris di luar sidebar.
- **`src/pages/admin.astro`**: hapus duplikasi logika filter di handler sort
  (cukup panggil `applyFilter()` yang sudah ada).

---

## [2.1.0] - 2026-09-09

### Added — Latihan & Evaluasi per Pertemuan
- **Blok Evaluasi** di semua pertemuan aktif (P1–7, 9, 10) menggunakan komponen baru
  `src/components/Evaluasi.astro`; P1 & P2 masing-masing **15 soal**, sisanya 4 soal.
- Alur dua tahap: **Latihan** (feedback langsung, bisa diulang) → **Evaluasi**
  (hanya terbuka setelah pertemuan TUNTAS).
- Tampilan evaluasi **kartu satu-soal-per-halaman** + kartu pengantar + progress bar;
  mode admin = pratinjau satu-per-halaman (tanpa penyimpanan).
- **Anti-salin / anti-AI (deterrent + pemantauan)**: blokir paste/copy & klik kanan,
  hitung perpindahan tab (`visibilitychange`), ukur durasi pengerjaan; flag bitwise
  (1 = paste/copy, 2 = sering pindah tab, 4 = terlalu cepat).

### Added — Backend Evaluasi
- Tabel `evaluasi` (1× per mahasiswa/pertemuan; skor, total, jumlah_soal, jawaban JSON,
  telemetri, flagged) — dibuat idempoten di `migrate.php` **dan self-healing** di endpoint.
- Endpoint `POST /api/evaluasi.php`: validasi (pertemuan harus tuntas, skor 0..total,
  satu percobaan → 409), penghitungan flag integritas, penyimpanan; CSRF + auth.
- `compute_nilai()` (config.php): komponen **Kuis** kini = rata-rata persentase
  LATIHAN + EVALUASI (masing-masing 50% dari bobot 40%); `kuis_latihan`/`kuis_evaluasi`
  diekspos ke admin.
- `me.php` mengembalikan map `evaluasi`; `admin.php` mengembalikan `evaluasi` (list + detail
  per mahasiswa).

### Added — Dashboard Admin
- Section baru **"Evaluasi & Integritas"**: semua pengumpulan + durasi + paste/copy/tab +
  badge indikasi, filter "hanya yang terindikasi", klik NIM → detail.
- Detail mahasiswa menampilkan nilai latihan & evaluasi (kuis gabungan) + tabel evaluasi.

### Changed
- **Filter admin**: dropdown Kelas, Progres (tuntas/belum), Huruf (A–E), + pencarian NIM/nama.
- **Jumlah kuis** ditampilkan: chip `📝 N Latihan · 📋 M Evaluasi` di beranda & header pertemuan
  (field `kuis` di frontmatter).
- Akun **dummy pengujian**: `mhs_dummy` / `dummy` (kelas IF3A, tanpa paksa-ganti-password)
  di-seed `migrate.php`.
- **Service worker v2**: navigasi = network-first (konten selalu segar), aset statis
  cache-first; cache name di-bump.
- Evaluasi tangguh: CSRF diambil otomatis dari `/api/me.php`; bila server gagal, skor
  tetap tampil dan tersimpan lokal perangkat (penanda "belum terkirim").

### Fixed
- False-positive "pelanggaran" saat tombol navigasi soal (penyebab: window blur saat DOM
  di-render ulang) — pelanggaran hanya dihitung dari `visibilitychange`.
- Tombol "Kumpulkan Evaluasi" tidak merespons: binding event delegation satu kali +
  toast peringatan `pointer-events:none` agar tidak menutup tombol + `catch` jaringan.
- Konten lama tersaji karena service worker cache-first (kini network-first utk navigasi).
- Chip kuis tampil sebagai teks mentah karena string template di ekspresi Astro
  (diganti elemen JSX).

---

## [2.0.1] - 2026-09-08

### Security hardening (P1)
- **Force-change password**: kolom `must_change_password`; wajib ganti saat login
  pertama (halaman `/ganti-password`); berlaku untuk akun lama via migrasi.
- **Rate-limit login**: tabel `login_attempts`, ambang 10× gagal/15 menit per username
  → HTTP 429; + delay 400ms pada gagal (by-username, karena IP bersama tidak stabil).
- **CSRF token**: token per sesi dikirim via header `X-CSRF-Token`; divalidasi
  `require_csrf()` pada semua endpoint state-form (complete, unlock, grade, import,
  delete, pertemuan POST, change_password).
- **Security headers** (`api/.htaccess`): `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`.
- ~~`migrate.php` dapat dipanggil via token setup saat bootstrap (login belum siap),
  plus utilitas `?clear_attempts=1`.~~ → **Dihapus di 2.6.1**: jalur token membuka reset
  password admin tanpa autentikasi. Kini wajib sesi admin; `clear_attempts` via POST+CSRF.

### Changed
- `me.php`/`login.php` mengembalikan `must_change_password`; `me` juga memberikan `csrf`.
- `login.php`/`me.php` toleran bila kolom migrasi belum ada (tidak 500).

---

## [2.0.0] - 2026-09-08

### Added — Sistem Autentikasi, Progres & Panel Admin
- Backend PHP + MySQL (Byethost): `login`, `logout`, `me`, `complete` (progresi berurutan),
  `admin`, `unlock`, `grade`, `import_users`, `delete_user`, `migrate`, `pertemuan`, `setup_db`.
- Login mahasiswa & admin (password hash, sesi HttpOnly + SameSite=Lax).
- Progresi bertingkat: pertemuan N terbuka hanya setelah N-1 tuntas; kombinasi auto (kuis benar)
  + override admin.
- Halaman `/login` (UI poles: ikon, toggle password, hint) & `/admin` (dashboard).
- **Dashboard admin kompleks**: ringkasan statistik (mahasiswa, rata-rata progres/nilai,
  tuntas 100%), distribusi nilai A–E, pencarian & filter kelas, ekspor CSV.
- **Gradebook**: nilai otomatis dari kuis (40%) + input manual PTS (30%)/UAS (30%),
  tugas & kehadiran; nilai akhir + huruf (A–E, skala SN-Dikti).
- **Kelola Menu Pertemuan** (editable): judul, sub-judul, posisi, alokasi, bobot, status
  tampil — langsung tampil di portal tanpa rebuild (overlay via `auth.js`).
- Impor massal mahasiswa: `nim,nama,kelas` / CSV / reset password (default = NIM).
- Proteksi `/admin/` server-side (guard PHP + `.htaccess`); API admin `require_auth('admin')`.

### Changed
- Tema UI total: **"Tinta & Emas"** + neumorphism; font editorial (Lora/Public Sans).
- Em-dash (—) dihapus total di seluruh teks; placeholder memakai en-dash (–).
- Logo UNIPI terpasang (sidebar, mobile header, favicon, PWA manifest).
- Data dummy diganti nama Islami-tokoh (Al-Khawarizmi, Faris Alamsyah, Ibnu Sina, dll.).
- Registrasi 40 mahasiswa IF3A (NIM 26105001–26105040, password awal = NIM);
  `docs/AKUN-MAHASISWA.md` berisi daftar akun.

### Security hardening
- `config.php` (kredensial) di-gitignore + block `.htaccess`; `config.example.php` untuk dev.
- Directory listing mati (`Options -Indexes`) di `admin/` & `api/`.
- XSS: escape via `esc()`/textContent; SQL injection: PDO prepared statements.

### Catatan batasan (lihat docs/AUDIT.md)
- Situs HTTP (Byethost) → HTTPS, force-change password, rate-limit login, CSRF token,
  dan agregasi nilai (N+1) belum tersedia; dijadwalkan sebagai langkah berikutnya.

---

## [1.8.0] - 2026-08-29

### Added

#### Content
- ✅ **Pertemuan 10: Aljabar Relasional (AR)** — lengkap (lanjutan fase implementasi/CPMK-2)
  - Sub-CPMK sesuai RPS: memecahkan permasalahan query dengan notasi Aljabar Relasional (AR) (bobot 4%)
  - Operasi dasar: select (σ), project (π), rename (ρ), union (∪), set difference (−), cartesian product (×)
  - Operasi turunan: inner/natural join (⋈), intersection (∩), division (÷)
  - Cheat sheet simbol AR + padanan SQL (WHERE, SELECT, UNION, EXCEPT, INTERSECT, JOIN)
  - Strategi pemecahan masalah query & contoh melibatkan 1–3 tabel (MAHASISWA/NILAI/MATAKULIAH)
  - Studi kasus praktikum (ANGGOTA/BUKU/PEMINJAMAN) termasuk penggunaan set difference & division utk query "untuk semua"
  - 5 kuis evaluasi + penugasan laporan praktikum algoritma relasional (AR → SQL + screenshot)
  - Terjemahan AR→SQL siap diverifikasi di SQL Playground portal

### Changed
- Jumlah pertemuan terbuka: 8 → **9** (P10 dibuka; P8 UTS & 11–16 masih terkunci)

---

## [1.7.0] - 2026-08-29

### Added

#### Content
- ✅ **Pertemuan 9: Instalasi & Akses DBMS** — lengkap (mulai fase implementasi/CPMK-2)
  - Sub-CPMK sesuai RPS: melakukan instalasi, konfigurasi, dan akses DBMS untuk membangun basis data sederhana (bobot 4%)
  - Perbandingan jenis DBMS (MySQL, MariaDB, PostgreSQL, SQLite, SQL Server, Oracle)
  - Bahasa pemrograman basis data: DDL, DML, DCL, TCL
  - Alur instalasi XAMPP (ringkas) + port default (MySQL 3306, PostgreSQL 5432)
  - Akses DBMS melalui CLI (mysql/psql) dan GUI (phpMyAdmin, MySQL Workbench, pgAdmin, DBeaver)
  - Studi kasus: basis data pertama "Akademik_UNIPI" (CREATE DATABASE + USE) terhubung ke PDM Pertemuan 7
  - Latihan pengganti tanpa instal sudah tertaut ke SQL Playground portal
  - 5 kuis evaluasi + penugasan persiapan proyek tahap 2

### Changed
- Jumlah pertemuan terbuka: 7 → **8** (P9 dibuka; P8 UTS & 10–16 masih terkunci)
- Posisi kategori sidebar & beranda: penuh otomatis dari frontmatter `locked`

---

## [1.6.2] - 2026-08-28

### Changed

- ✅ **Hilangkan seluruh em-dash (`—`) dari teks materi** (kesan hasil AI). Penggantian kontekstual:
  - Definisi & subjudul → titik dua `:` (mis. `## D.1 Aturan 1: Entitas Kuat → Tabel`, `- **Data**: fakta mentah`)
  - Prosa & kalimat lanjutan → koma `,` atau titik (mis. `...profesional: ada rak berlabel...`)
  - Notasi relasi dipertahankan dengan `·` (mis. `DOSEN · MENGAJAR · KULIAH`)
  - Cakupan: seluruh `src/content/pertemuan/*.mdx`, `Sidebar.astro`, `index/playground/praktikum`
  - Halaman yang dirender kini bebas em-dash (terverifikasi di `dist/`)

---

## [1.6.1] - 2026-08-28

### Added

#### Content (analogi penguat pemahaman)
- ✅ **Pertemuan 1** diperkaya dengan analogi:
  - "Dapur & Masakan" (data vs informasi vs DBMS) di D.1
  - "Evolusi Penyimpanan Catatan" (file → relasional → big data) di D.2
  - "Sistem Basis Data adalah Restoran" (5 komponen) di D.3
  - **Section baru D.4 Arsitektur Tiga Skema** + analogi "Restoran Berlapis" (sebelumnya hanya ada di kuis)
- ✅ **Pertemuan 2** diperkaya dengan analogi:
  - "Denah Rumah" (peran model konseptual) di D.1
  - "Kartu Keluarga" (entitas kuat vs lemah) di D.2
  - "Isian KTP" (taksonomi atribut) di D.3
  - "Hubungan Antar Manusia" (kardinalitas 1:1/1:N/M:N) di D.4

---

## [1.6.0] - 2026-08-28

### Added

#### Content
- ✅ **Pertemuan 7: Perancangan Model Fisik (PDM)** — lengkap
  - Sub-CPMK sesuai RPS: merancang model fisik sesuai spesifikasi DBMS (bobot 5%)
  - Jenjang pemodelan CDM → LDM → PDM + diagram original (SVG)
  - Peta tipe data antar DBMS (MySQL/PostgreSQL/SQLite) + tips pemilihan
  - Key & constraint (PRIMARY KEY, NOT NULL, UNIQUE, DEFAULT, CHECK, FOREIGN KEY)
  - Studi kasus PDM SIAKAD lengkap dengan DDL MySQL + sintaks dbdiagram.io
  - Alur menuju implementasi (P9–16) dan penugasan finalisasi proyek tahap 1 (UTS)
  - 5 kuis evaluasi; memakai ulang er-diagram.jpg (domain publik) dengan atribusi

### Changed
- Jumlah pertemuan terbuka: 6 → **7** (P8 UTS & 9–16 masih terkunci)

---

## [1.5.0] - 2026-08-28

### Added

#### Content
- ✅ **Pertemuan 6: Normalisasi Lanjutan (BCNF)** — lengkap
  - Sub-CPMK sesuai RPS: memecahkan masalah perancangan basis data dengan normalisasi lanjutan (bobot 5%)
  - Keterbatasan 3NF: celah "atau dependennya prime"
  - Definisi formal BCNF + prosedur uji BCNF langkah demi langkah
  - Studi kasus PENGAMPUAN (nim, kode_mk, nip): 3NF namun bukan BCNF, dengan data
  - Dekomposisi lossless-join + pembahasan dependency preservation (trade-off klasik BCNF)
  - Cheat sheet 3NF vs BCNF + 5 kuis evaluasi + penugasan lanjutan dari P5
  - Memakai kembali gambar hirarki normal form berlisensi (CC BY-SA 3.0) dengan atribusi

### Changed
- Jumlah pertemuan terbuka: 5 → **6** (Pertemuan 7–16 masih terkunci)

---

## [1.4.0] - 2026-08-28

### Added

#### Content
- ✅ **Pertemuan 5: Normalisasi Basis Data (1NF–3NF)** — lengkap
  - Sub-CPMK sesuai RPS: merancang basis data dengan teknik normalisasi (bobot 5%)
  - Tiga anomali data (insert, update, delete) dengan contoh tabel transaksi
  - Functional dependency: full, partial, transitive + latihan interaktif klasifikasi FD
  - Normalisasi bertahap UNF → 1NF → 2NF → 3NF pada studi kasus transaksi penjualan
  - Hasil akhir dikaitkan dengan skema E-Commerce Pertemuan 3–4 (validasi desain ERD)
  - Cheat sheet normal form + 5 kuis evaluasi + penugasan normalisasi pinjaman perpustakaan
- ✅ **Pertemuan 5 diperkaya** (revisi):
  - Analogi "satu binder besar" untuk anomali & "satu kunci → satu data" untuk FD
  - Bukti data sebelum/sesudah normalisasi (data TRANSAKSI dirender ulang di 4 tabel tanpa redundansi)
  - 3 variasi pola baru: kunci gabungan + transitif (SIAKAD), kunci tunggal + transitif (Rumah Sakit), atribut multivalued
  - Aturan emas: tabel ber-PK tunggal otomatis lolos 2NF
  - Kuis bertambah dari 5 → 8 soal
  - ✅ **Gambar asli (media) ditambahkan dengan atribusi sumber** (folder `public/images/`):
    - `er-diagram.jpg` — contoh model ER (Wikimedia Commons, domain publik)
    - `normal-2fn.jpg` & `normal-3fn.jpg` — contoh pelanggaran 2NF/3NF (SQLpro, CC BY-SA 4.0)
    - `database-normalization.svg` — hirarki normal form 1NF–5NF (LimoWreck/Beao, CC BY-SA 3.0)
    - Diagram FD original (SVG) "peta ketergantungan fungsional" dibuat khusus untuk portal
    - Gaya `figure.media-figure` + `figcaption` dengan blok `media-src` ditambahkan ke global.css
  - **Kebijakan media**: setiap gambar eksternal diberi keterangan sumber & lisensi; diagram yang dibuat sendiri ditandai "Gambar asli dibuat untuk Portal Basis Data UNIPI".

### Changed
- Jumlah pertemuan terbuka: 4 → **5** (Pertemuan 6–16 masih terkunci)

---

## [1.3.0] - 2026-08-28

### Added

#### Content
- ✅ **Pertemuan 4: Transformasi ERD ke Model Relasional** — lengkap
  - Sub-CPMK sesuai RPS: mentransformasikan ERD ke Relational Model (bobot 4%)
  - 6 aturan baku pemetaan ERD → skema relasi (Elmasri & Navathe)
  - Ilustrasi visual transformasi (SVG) untuk Aturan 1:N dan M:N
  - Transformasi lengkap 3 studi kasus Pertemuan 3 (SIAKAD, E-Commerce, Rumah Sakit)
  - DDL SQL `CREATE TABLE` (PK, FK `REFERENCES`, `CHECK`, `UNIQUE` untuk 1:1)
  - Cheat sheet rangkuman aturan + 5 kuis evaluasi
  - Tautan verifikasi langsung di SQL Playground + penugasan transformasi

#### Fix
- **Tombol zoom diagram kini berfungsi** di semua halaman materi. Sebelumnya markup zoom di MDX (Pertemuan 3) tidak memiliki handler JS karena komponen `DiagramViewer` tidak dirender. Zoom + pan sekarang dipasang secara global di `BaseLayout` (guard terhadap pengikatan ganda).
- **SQL Playground: error 404 `sql-wasm-browser.wasm`**. Vite me-resolve `sql.js` ke bundle browser yang meminta `sql-wasm-browser.wasm`, padahal `public/` berisi `sql-wasm.wasm` (isi keduanya identik). `locateFile` kini selalu memetakan ke `"/sql-wasm.wasm"`. Sekaligus `renderResult` kini menampilkan **semua** result set (bukan hanya yang pertama) dan preset contoh diberi guard sebelum SQLite siap.

### Changed
- Jumlah pertemuan terbuka: 3 → **4** (Pertemuan 5–16 masih terkunci)

---

## [1.2.0] - 2026-08-28

### Added

#### SQL Playground Interaktif (baru)
- ✅ **`/playground` — SQL Playground** (`src/pages/playground.astro`)
  - SQLite berjalan penuh di browser via **sql.js** (WASM), tanpa backend/server
  - Wasm disalin ke `public/sql-wasm.wasm` (di-serve dari root)
  - 5 tabel relasional contoh ter-seed otomatis: `mahasiswa`, `dosen`, `matakuliah`, `krs`, `nilai`
  - Editor query + tombol jalankan, jalankan semua (Ctrl/Cmd+Enter), reset data, bersihkan editor
  - 7 preset contoh query (SELECT, JOIN, GROUP BY, fungsi agregasi, CREATE TABLE)
  - Pemilih tabel untuk melihat isi langsung
  - Hasil dirender sebagai tabel HTML rapi
  - Link di sidebar (📌 "LAB · SQL Playground") dan beranda

#### Worksheet Praktikum (diperkuat)
- ✅ **Validasi otomatis** (section G) — memeriksa kelengkapan & konsistensi:
  - Identitas, studi kasus, minimal 2 entitas, nama entitas, duplikat, deskripsi
  - PK/atribut, referensi relasi ke entitas terdaftar, kardinalitas, asumsi
  - Output skor kelengkapan + daftar masalah kritis & saran
- ✅ **Ekspor / Impor data kelompok** (section H) — simpan & muat ulang JSON isian seluruh worksheet (untuk review silang / lanjutan di rumah)
- ✅ Print styles diperbaiki (section `break-inside`, hasil validasi terbaca saat dicetak)

### Changed
- Jumlah halaman: 19 (18 + `/playground`)
- Dependensi: tambah `sql.js`

### Roadmap (terbaru)
- [ ] Pertemuan 9: Instalasi & Akses DBMS (XAMPP/MySQL/PostgreSQL)
- [ ] Pindahkan materi pertemuan 11–13 agar memanfaatkan SQL playground
- [ ] Pertemuan 8 (UTS) & 16 (UAS): template halaman evaluasi

---

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
4. **Pertemuan 10** kini selesai (Aljabar Relasional / AR). Berikutnya: **Pertemuan 11: SQL Dasar (DDL & DML)** yang paling relevan dilanjutkan, memakai SQL Playground / SQL online editor, lalu P12–13 (SQL kompleks & implementasi RDBMS) menyusul.
