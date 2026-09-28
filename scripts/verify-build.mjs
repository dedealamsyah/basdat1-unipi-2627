#!/usr/bin/env node
/**
 * verify-build.mjs — Ensuring the answer key NEVER ships inside the static site.
 *
 * The evaluation key lives only in `api/kunci.php` (server side, read by
 * `eval_nilai()`). Nothing in `dist/` may contain it. That invariant is the
 * core of the v2.7.0 security fix, but until now it was only checked by hand
 * (grep over `dist/`), so a future `define:vars` or JSON island could quietly
 * leak it again without anyone noticing.
 *
 * This script makes it a HARD gate: it exits non-zero and fails the build.
 *
 * What is checked:
 *   1. For each meeting that has a bank soal, the `dist/pertemuan/<id>/` page
 *      exists and really renders the evaluation (the question text appears).
 *      → catches the reverse error: a key on the server whose question is not
 *        on the page (the student sees nothing, the score is meaningless).
 *   2. No file in `dist/` contains `"benar": <number>` — this is exactly the
 *      shape Astro produces for `define:vars` / JSON island props, the shape
 *      that leaked the key before v2.7.0.
 *   3. No file in `dist/` contains the literal `EVAL_KUNCI` or `KUIS_KUNCI`.
 *   4. No file in `dist/` contains a long key sequence (>= 8 soal) as a bare
 *      JSON array. Short keys are skipped because `[1,0,1,1]` can appear by
 *      chance in normal data and would make this gate cry wolf.
 *   5. The PRACTICE-QUIZ key must not ship at all (v2.8.0). It used to ride
 *      along in the HTML as `data-correct="true"` / `data-explanation=".."`
 *      and was reported as INFO ("latihan memang client-side"). Now that
 *      `api/quiz.php` grades server-side, any of these attributes in `dist/`
 *      means the key leaked again → hard failure.
 *   6. Cross-check the quiz key against the page: every meeting that has a
 *      `KUIS_KUNCI` must render exactly as many `.quiz-option` groups as the
 *      key has soal, and every page rendering quiz cards must have a key.
 *      → catches a key that is shifted or stale relative to the rendered page.
 *
 * Run manually:  node scripts/verify-build.mjs
 * It is already run by `npm run build`, `npm run deploy:prep`, and CI.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const KUNCI = join(root, 'api', 'kunci.php');
const SEQ_MIN = 8;
const TEKST = new Set(['.html', '.js', '.mjs', '.css', '.json', '.map', '.xml', '.txt']);

/** All files in dist worth scanning (text only — don't try to read the .wasm). */
function kumpulkan(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...kumpulkan(p));
    else if (TEKST.has(e.name.slice(e.name.lastIndexOf('.')))) out.push(p);
  }
  return out;
}

/** Parse the key: { [pertemuan_id]: [idx benar per soal] } */
function bacaKunci() {
  if (!existsSync(KUNCI)) {
    console.error('✗ api/kunci.php tidak ada — jalankan `node scripts/gen-kunci.mjs` lebih dulu.');
    process.exit(1);
  }
  const src = readFileSync(KUNCI, 'utf8');
  // Dua konstanta dalam satu berkas. Pisahkan per bagian supaya kunci kuis
  // latihan tidak ikut terhitung sebagai kunci evaluasi.
  const potong = src.indexOf('const KUIS_KUNCI');
  const bagianEval = potong === -1 ? src : src.slice(0, potong);
  const bagianKuis = potong === -1 ? '' : src.slice(potong);

  const re = /^\s*(\d+)\s*=>\s*array\(\s*'benar'\s*=>\s*array\(([^)]*)\)/gm;
  const ambil = (teks) => {
    const out = {};
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(teks)) !== null) {
      out[Number(m[1])] = m[2]
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n));
    }
    return out;
  };
  // KUIS_KUNCI menaruh 'id' lebih dulu, jadi pola di atas tidak cocok: pakai
  // pola sendiri yang mengabaikan urutan kunci atribut.
  const reKuis = /^\s*(\d+)\s*=>\s*array\([\s\S]*?'benar'\s*=>\s*array\(([^)]*)\)/gm;
  const ambilKuis = (teks) => {
    const out = {};
    reKuis.lastIndex = 0;
    let m;
    while ((m = reKuis.exec(teks)) !== null) {
      out[Number(m[1])] = m[2]
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n));
    }
    return out;
  };

  const evalKunci = ambil(bagianEval);
  const kuisKunci = ambilKuis(bagianKuis);
  if (Object.keys(evalKunci).length === 0) {
    console.error('✗ api/kunci.php tidak berisi kunci evaluasi yang bisa dibaca — format berubah?');
    process.exit(1);
  }
  if (Object.keys(kuisKunci).length === 0) {
    console.error('✗ api/kunci.php tidak berisi kunci kuis latihan — format berubah?');
    process.exit(1);
  }
  return { eval: evalKunci, kuis: kuisKunci };
}

/** Longest question text in the meeting, for the "is it really rendered?" check. */
function cekHalamanRenders(pid) {
  const page = join(dist, 'pertemuan', String(pid), 'index.html');
  if (!existsSync(page)) return `halaman dist/pertemuan/${pid}/index.html tidak ada`;
  const html = readFileSync(page, 'utf8');
  if (html.indexOf('id="evaluasiBox"') === -1) {
    return `blok <Evaluasi> tidak dirender di halaman ${pid}`;
  }
  return null;
}

/** Jumlah kartu kuis latihan yang benar-benar ter-render di halaman pertemuan. */
function hitungKartuLatihan(pid) {
  const page = join(dist, 'pertemuan', String(pid), 'index.html');
  if (!existsSync(page)) return 0;
  const html = readFileSync(page, 'utf8');
  return (html.match(/class="interactive-card" data-quiz=/g) || []).length;
}

const { eval: kunci, kuis: kunciLatihan } = bacaKunci();
const files = kumpulkan(dist);
const pids = Object.keys(kunci).map(Number).sort((a, b) => a - b);
const pidsLatihan = Object.keys(kunciLatihan).map(Number).sort((a, b) => a - b);

console.log(
  `verify-build: menyisir ${files.length} berkas teks di dist/ untuk ` +
    `${pids.length} bank evaluasi + ${pidsLatihan.length} bank kuis latihan`
);

// 1) Key on the server must correspond to a page that actually renders the question.
const gagalRender = [];
for (const pid of pids) {
  const why = cekHalamanRenders(pid);
  if (why) gagalRender.push(`  P${pid}: ${why}`);
}

// 6) Kunci kuis harus cocok dengan jumlah kartu yang benar-benar dirender.
const kartuTidakCocok = [];
for (const pid of pidsLatihan) {
  const n = hitungKartuLatihan(pid);
  if (n !== kunciLatihan[pid].length) {
    kartuTidakCocok.push(
      `  P${pid}: kunci punya ${kunciLatihan[pid].length} soal, halaman merender ${n} kartu kuis`
    );
  }
}
// Kebalikannya: halaman merender kartu kuis tapi server tidak punya kuncinya
// (deploy kunci.php versi lama) — penilaiannya akan gagal 503.
for (const pid of pids) {
  if (kunciLatihan[pid]) continue;
  const n = hitungKartuLatihan(pid);
  if (n > 0) {
    kartuTidakCocok.push(`  P${pid}: halaman merender ${n} kartu kuis tapi api/kunci.php tidak punya KUIS_KUNCI`);
  }
}

// 2-5) Kunci tidak boleh ada di mana pun di situs statis.
const polae = [
  { nama: '"benar": <angka> (JSON island / define:vars)', re: /"benar"\s*:\s*\d+/g },
  { nama: 'literal EVAL_KUNCI', re: /EVAL_KUNCI/g },
  { nama: 'literal KUIS_KUNCI', re: /KUIS_KUNCI/g },
  // v2.8.0: atribut practice-quiz ini dulu jadi jalan bocornya kunci latihan.
  { nama: 'atribut kunci latihan data-correct', re: /data-correct\s*=/g },
  { nama: 'atribut penjelasan latihan data-explanation', re: /data-explanation\s*=/g },
];
// Only long keys: a short sequence like [1,0,1,1] can appear by chance in normal data.
for (const pid of pids) {
  const seq = kunci[pid];
  if (seq.length < SEQ_MIN) continue;
  polae.push({
    nama: `urutan kunci P${pid} (${seq.length} soal) sebagai array`,
    re: new RegExp('\\[\\s*' + seq.join('\\s*,\\s*') + '\\s*\\]'),
  });
}
for (const pid of pidsLatihan) {
  const seq = kunciLatihan[pid];
  if (seq.length < SEQ_MIN) continue;
  polae.push({
    nama: `urutan kunci latihan P${pid} (${seq.length} soal) sebagai array`,
    re: new RegExp('\\[\\s*' + seq.join('\\s*,\\s*') + '\\s*\\]'),
  });
}

const temuan = [];
for (const file of files) {
  const isi = readFileSync(file, 'utf8');
  for (const p of polae) {
    const cocok = isi.match(p.re);
    if (cocok) {
      temuan.push(`  ${relative(root, file)}: ${p.nama} (${cocok.length}×)`);
    }
  }
}

console.log('');

if (gagalRender.length > 0) {
  console.error('✗ Kunci ada di server tapi soal tidak dirender di halaman:');
  gagalRender.forEach((l) => console.error(l));
  console.error('  → cek blok <Evaluasi> di src/content/pertemuan/*.mdx');
  process.exit(1);
}
if (kartuTidakCocok.length > 0) {
  console.error('✗ Kunci kuis latihan tidak sinkron dengan halaman yang dirender:');
  kartuTidakCocok.forEach((l) => console.error(l));
  console.error('  → deploy ulang `node scripts/gen-kunci.mjs` lalu `npm run build`');
  process.exit(1);
}
if (temuan.length > 0) {
  console.error('✗ KUNCI JAWABAN BOCOR KE BUILD STATIS — deploy dibatalkan:');
  temuan.forEach((l) => console.error(l));
  console.error('  → Evaluasi.astro hanya boleh mengirim { soal, opsi };');
  console.error('    QuizCard.astro hanya boleh merender { id, soal, opsi } (bukan benar/jelas)');
  process.exit(1);
}

console.log(
  `✓ Tidak ada kunci jawaban di dist/ (${files.length} berkas disisir; ` +
    `evaluasi P${pids.join(', P')}; kuis latihan P${pidsLatihan.join(', P')})`
);

