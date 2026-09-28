#!/usr/bin/env node
/**
 * build-deploy.mjs — build lalu siapkan artefak deploy di `_deploy/`.
 *
 * Menutup dua celah yang pernah merusak deploy:
 *
 * 1) `admin/index.php` di server membaca `admin/panel.html`, BUKAN
 *    `admin/index.html` hasil build. `panel.html tidak pernah dihasilkan
 *    build, jadi harus disalin manual — dan kalau terlupa, dashboard
 *    admin diam-diam menyajikan UI lama terus-menerus (v2.6.0).
 *    Skrip ini menyalinnya otomatis ke `_deploy/admin/panel.html`.
 *
 * 2) `admin/panel.html` tidak ada di `.gitignore` (v2.6.1), sehingga
 *    `git add -A` bisa ikut meng-commit artefak build 80KB+ ke repo.
 *
 * Hasil: folder `_deploy/` yang strukturnya siap di-upload ke `htdocs/`.
 * Isi `_deploy/` tidak pernah masuk git.
 *
 * Jalankan:  npm run deploy:prep
 */
import { execSync } from 'node:child_process';
import {
  cpSync, existsSync, mkdirSync, rmSync, readFileSync, readdirSync, statSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const out = join(root, '_deploy');

/** Hitung ukuran folder dalam byte (untuk ringkasan). */
function ukuran(dir) {
  let total = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    total += e.isDirectory() ? ukuran(p) : statSync(p).size;
  }
  return total;
}

console.log('› Menjalankan build…');
// `npm run build` = gen-kunci + astro build + verify-build (kunci tidak boleh
// bocor ke HTML statis). Dulu skrip ini memanggil gen-kunci & astro build
// langsung, sehingga pemeriksaan bocor kunci hanya terjadi di deploy:prep.
execSync('npm run build', { cwd: root, stdio: 'inherit' });

if (!existsSync(join(dist, 'admin', 'index.html'))) {
  console.error('✗ dist/admin/index.html tidak ada — build tidak menghasilkan panel admin.');
  process.exit(1);
}

console.log('› Menyiapkan _deploy/ …');
rmSync(out, { recursive: true, force: true });
cpSync(dist, out, { recursive: true });

// Bagian kritis: panel.html harus ikut, karena admin/index.php membacanya.
mkdirSync(join(out, 'admin'), { recursive: true });
cpSync(join(dist, 'admin', 'index.html'), join(out, 'admin', 'panel.html'));
// index.html hasil build di /admin/ tidak pernah dilayani (index.php yang
// menang) dan membocorkan isi dashboard lewat URL langsung -> dibuang.
rmSync(join(out, 'admin', 'index.html'), { force: true });

// Kunci jawaban WAJIB ikut: tanpa berkas ini server tidak bisa menghitung skor.
const kunci = join(root, 'api', 'kunci.php');
if (!existsSync(kunci)) {
  console.error('✗ api/kunci.php tidak ada — generate ulang dengan `npm run gen-kunci`.');
  process.exit(1);
}
cpSync(kunci, join(out, 'api', 'kunci.php'));

// Salin config.php & kunci.php kalau ada (keduanya tidak ada di git).
for (const f of ['config.php', 'kunci.php']) {
  const src = join(root, 'api', f);
  if (existsSync(src)) {
    mkdirSync(join(out, 'api'), { recursive: true });
    cpSync(src, join(out, 'api', f));
  }
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const total = ukuran(out);

console.log('');
console.log('✓ _deploy/ siap di-upload ke htdocs/');
console.log(`  isi        : ${total < 1024 * 1024 ? kb(total) : (total / 1024 / 1024).toFixed(1) + ' MB'}`);
console.log('');
console.log('  WAJIB ikut (sudah ada di _deploy/):');
console.log('    admin/panel.html   dashboard admin — admin/index.php membacanya,');
console.log('                       bukan index.html. Tanpa ini panel menyajikan UI lama.');
console.log('    api/config.php     kredensial DB (tidak ada di git)');
console.log('    api/kunci.php      kunci jawaban (tidak ada di git)');
console.log('');
console.log('  TIDAK ada di _deploy/ — upload manual dari repo, urut dari kode server:');
console.log('    1. api/config.php      (udah ada di _deploy, tapi urutan tetap penting)');
console.log('    2. api/kunci.php');
console.log('    3. api/*.php           (admin.php, evaluasi.php, quiz.php, migrate.php, ...)');
console.log('    4. api/.htaccess');
console.log('    5. admin/index.php, admin/.htaccess');
console.log('');
console.log('  v2.8.0+: api/quiz.php WAJIB ikut terupload (endpoint penilaian latihan).');
console.log(' Tanpa file itu, kuis latihan tidak bisa dinilai sama sekali.');

// Pengaman: pastikan tidak ada kunci jawaban yang ikut ter-copy ke HTML statis.
const html = readFileSync(join(out, 'admin', 'panel.html'), 'utf8');
if (/"benar"\s*:\s*\d+/.test(html)) {
  console.error('✗ PANEL ADMIN MEMBOCORKAN KUNCI JAWABAN — deploy dibatalkan.');
  process.exit(1);
}
console.log('  ✓ panel.html tidak memuat kunci jawaban');
