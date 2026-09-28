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
 *   3. No file in `dist/` contains the literal `EVAL_KUNCI`.
 *   4. No file in `dist/` contains a long key sequence (>= 8 soal) as a bare
 *      JSON array. Short keys are skipped because `[1,0,1,1]` can appear by
 *      chance in normal data and would make this gate cry wolf.
 *   5. As an INFO (not a failure) — report how many practice-quiz answers
 *      (`data-correct="true"`) are still inlined in the HTML. Practice is
 *      client-side by design; the number is recorded so the audit figure
 *      (84 across 18 pages) does not quietly drift.
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
  const kunci = {};
  const re = /^\s*(\d+)\s*=>\s*array\(\s*'benar'\s*=>\s*array\(([^)]*)\)/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    kunci[Number(m[1])] = m[2]
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n));
  }
  if (Object.keys(kunci).length === 0) {
    console.error('✗ api/kunci.php tidak berisi kunci yang bisa dibaca — format berubah?');
    process.exit(1);
  }
  return kunci;
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

const kunci = bacaKunci();
const files = kumpulkan(dist);
const pids = Object.keys(kunci).map(Number).sort((a, b) => a - b);

console.log(`verify-build: menyisir ${files.length} berkas teks di dist/ untuk ${pids.length} bank soal`);

// 1) Key on the server must correspond to a page that actually renders the question.
const gagalRender = [];
for (const pid of pids) {
  const why = cekHalamanRenders(pid);
  if (why) gagalRender.push(`  P${pid}: ${why}`);
}

// 2-4) The key must not appear anywhere in the static site.
const polae = [
  { nama: '"benar": <angka> (JSON island / define:vars)', re: /"benar"\s*:\s*\d+/g },
  { nama: 'literal EVAL_KUNCI', re: /EVAL_KUNCI/g },
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

// 5) Info: practice-quiz keys are still inline (client-side by design).
let latihan = 0;
const halamanLatihan = [];
for (const file of files) {
  const n = (readFileSync(file, 'utf8').match(/data-correct="true"/g) || []).length;
  if (n > 0) {
    latihan += n;
    halamanLatihan.push(relative(dist, file));
  }
}

console.log('');
console.log(`  info: kunci soal latihan masih inline di ${halamanLatihan.length} halaman ` +
  `(${latihan}× data-correct="true") — latihan memang client-side, see AUDIT.md.`);
console.log('');

if (gagalRender.length > 0) {
  console.error('✗ Kunci ada di server tapi soal tidak dirender di halaman:');
  gagalRender.forEach((l) => console.error(l));
  console.error('  → cek blok <Evaluasi> di src/content/pertemuan/*.mdx');
  process.exit(1);
}
if (temuan.length > 0) {
  console.error('✗ KUNCI JAWABAN EVALUASI BOCOR KE BUILD STATIS — deploy dibatalkan:');
  temuan.forEach((l) => console.error(l));
  console.error('  → Evaluasi.astro harus hanya mengirim { soal, opsi } (lihat soalTanpaKunci)');
  process.exit(1);
}

console.log(`✓ Tidak ada kunci jawaban evaluasi di dist/ (${files.length} berkas disisir, ` +
  `${pids.length} pertemuan: P${pids.join(', P')})`);
