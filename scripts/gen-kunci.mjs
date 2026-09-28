/**
 * gen-kunci.mjs — hasilkan `api/kunci.php` dari `src/content/pertemuan/*.mdx`.
 *
 * Kunci jawaban TIDAK boleh ikut ter-inline ke HTML halaman ( mahasiswa bisa
 * membacanya dari View Source ). Skrip ini memindahkannya ke sisi server:
 * Astro tetap me-render soal & opsi, sedangkan indeks jawaban benar ditulis
 * ke `api/kunci.php` yang hanya dibaca PHP.
 *
 * Format sumber soal (harus seragam di semua MDX):
 *   { soal: "...", opsi: [ "...", "...", "...", "..." ], benar: 2 },
 *
 * Validasi keras — build GAGAL kalau:
 *   - jumlah `benar` tidak sama dengan jumlah objek soal,
 *   - indeks `benar` di luar rentang jumlah opsi,
 *   - ada `export const EVAL_` tapi nol soal.
 *
 * Dijalankan otomatis oleh `npm run build` (lihat package.json) dan
 * `npm run check`. Output di-gitignore (berisi jawaban).
 *
 * Jalankan manual:  node scripts/gen-kunci.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(root, 'src', 'content', 'pertemuan');
const OUT_FILE = join(root, 'api', 'kunci.php');

// Satu objek soal lengkap: soal, opsi, benar.
const SOAL_RE =
  /\{\s*soal:\s*"((?:[^"\\]|\\.)*)",\s*opsi:\s*\[([\s\S]*?)\],\s*benar:\s*(\d+)\s*\}/g;
// Penghitung INDEPENDEN dari parser di atas: satu kemunculan per soal.
// Kalau jumlah `soal:` tidak sama dengan jumlah objek ter-parse, berarti
// formatnya bergeser dan kunci akan salah diam-diam — build harus gagal.
// (Pola `], benar: N }` TIDAK boleh dipakai sebagai penghitung: ia turunan
// dari parser yang sama, jadibuta terhadap pergeseran parser.)
const SOAL_HITUNG_RE = /\bsoal:\s*"/g;
// Penghitung kedua (silang): pola jawaban mentah.
const BENAR_MUNGKIN_RE = /\], benar: (\d+) \}/g;
// Adanya bank soal di berkas.
const ADA_BANK_RE = /export const EVAL_/;
// Urutan natural supaya 2 tidak tertukar dengan 10.
const NATURAL = { numeric: true, sensitivity: 'base' };

/** Hitung jumlah string literal di dalam array opsi. */
function hitungOpsi(blokOpsi) {
  const s = blokOpsi.match(/"(?:[^"\\]|\\.)*"/g);
  return s ? s.length : 0;
}

function bacaBank(namaFile) {
  const sumber = readFileSync(join(CONTENT_DIR, namaFile), 'utf8');

  if (!ADA_BANK_RE.test(sumber)) return null;

  const benar = [];
  const opsi = [];
  SOAL_RE.lastIndex = 0;
  let m;
  while ((m = SOAL_RE.exec(sumber)) !== null) {
    benar.push(Number(m[3]));
    opsi.push(hitungOpsi(m[2]));
  }

  // Validasi 1 (independen): jumlah kemunculan `soal:` harus sama dengan
  // jumlah objek yang ter-parse. Penghitung ini tidak bergantung pada regex
  // parser, jadi ia bisa menangkap pergeseran parser.
  SOAL_HITUNG_RE.lastIndex = 0;
  const nSoal = (sumber.match(SOAL_HITUNG_RE) || []).length;
  if (nSoal !== benar.length) {
    throw new Error(
      `${namaFile}: ada ${nSoal} field "soal:" tapi hanya ${benar.length} soal ` +
        `ter-parse. Format bank soal berubah? Kunci akan salah — build dihentikan.`
    );
  }

  // Validasi 2 (silang): pola jawaban mentah harus cocok juga.
  BENAR_MUNGKIN_RE.lastIndex = 0;
  const kasar = (sumber.match(BENAR_MUNGKIN_RE) || []).length;
  if (kasar !== benar.length) {
    throw new Error(
      `${namaFile}: ditemukan ${kasar} "], benar: N }" tapi hanya ${benar.length} ` +
        `soal ter-parse. Format bank soal berubah? Kunci akan salah.`
    );
  }
  if (benar.length === 0) {
    throw new Error(`${namaFile}: ada "export const EVAL_" tapi nol soal.`);
  }

  benar.forEach((k, i) => {
    if (!Number.isInteger(k) || k < 0 || k >= opsi[i]) {
      throw new Error(
        `${namaFile}: soal ke-${i + 1} punya benar=${k}, tapi opsi hanya ${opsi[i]}.`
      );
    }
  });

  return { benar, opsi };
}

const files = readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .sort((a, b) => a.localeCompare(b, NATURAL));

const kunci = {};
for (const f of files) {
  const pid = Number(f.replace(/\.mdx$/, ''));
  if (!Number.isInteger(pid)) {
    throw new Error(`Nama berkas tidak bisa jadi id pertemuan: ${f}`);
  }
  const bank = bacaBank(f);
  if (bank) kunci[pid] = bank;
}

const totalSoal = Object.values(kunci).reduce((n, b) => n + b.benar.length, 0);
if (totalSoal === 0) {
  throw new Error('Tidak ada kunci yang tergambar — Periksa sumber MDX.');
}

const baris = [];
baris.push('<?php');
baris.push('/**');
baris.push(' * KUNCI JAWABAN EVALUASI — BERKAS HASIL GENERATE, JANGAN DIEDIT MANUAL.');
baris.push(' *');
baris.push(' * Sumber: src/content/pertemuan/*.mdx (field `benar`).');
baris.push(' * Regenerasi: `npm run build` (atau `node scripts/gen-kunci.mjs`).');
baris.push(' *');
baris.push(' * Berkas ini RAHASIA — tidak boleh ter-deploy ke direktori publik dan tidak');
baris.push(' * boleh masuk git (sudah di-.gitignore). Server membacanya lewat');
baris.push(' * helper `eval_kunci()` di config.php untuk menghitung skor.');
baris.push(' *');
baris.push(' * Bentuk: EVAL_KUNCI[pertemuan_id] = array(\'benar\' => [indeks per soal],');
baris.push(" *                                      'opsi'  => [jumlah opsi per soal]);");
baris.push(' */');
baris.push('declare(strict_types=1);');
baris.push('');
baris.push('const EVAL_KUNCI = array(');
for (const pid of Object.keys(kunci).map(Number).sort((a, b) => a - b)) {
  const { benar, opsi } = kunci[pid];
  const fmt = (arr) => 'array(' + arr.join(', ') + ')';
  baris.push(`    ${pid} => array('benar' => ${fmt(benar)}, 'opsi' => ${fmt(opsi)}),`);
}
baris.push(');');
baris.push('');

writeFileSync(OUT_FILE, baris.join('\n'));

const ringkas = Object.keys(kunci)
  .map(Number)
  .sort((a, b) => a - b)
  .map((p) => `P${p}(${kunci[p].benar.length})`)
  .join(' ');

console.log(`gen-kunci: ${Object.keys(kunci).length} pertemuan, ${totalSoal} soal -> api/kunci.php`);
console.log(`           ${ringkas}`);
