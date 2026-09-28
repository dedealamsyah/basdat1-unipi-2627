/**
 * gen-kunci.mjs — hasilkan `api/kunci.php` dari `src/content/pertemuan/*.mdx`.
 *
 * Kunci jawaban TIDAK boleh ikut ter-inline ke HTML halaman ( mahasiswa bisa
 * membacanya dari View Source ). Skrip ini memindahkannya ke sisi server:
 * Astro tetap me-render soal & opsi, sedangkan indeks jawaban benar ditulis
 * ke `api/kunci.php` yang hanya dibaca PHP.
 *
 * Dua jenis bank soal, dua konstanta di berkas yang sama:
 *   EVAL_KUNCI  — bank EVALUASI, format:  { soal: "...", opsi: [...], benar: 2 }
 *   KUIS_KUNCI  — bank KUIS LATIHAN, format:
 *                 <QuizCard id="q1" soal="..." opsi={["...", "..."]} benar={1} jelas="..." />
 *
 * Validasi keras — build GAGAL kalau:
 *   - jumlah `benar` tidak sama dengan jumlah objek soal,
 *   - indeks `benar` di luar rentang jumlah opsi,
 *   - ada `export const EVAL_` tapi nol soal,
 *   - jumlah `<QuizCard` tidak sama dengan jumlah kartu ter-parse,
 *   - id kuis latihan duplikat / tidak berurutan (q1, q2, ...),
 *   - kuis latihan punya < 2 opsi atau `jelas` bukan teks.
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

/* ---------------------------------------------------------------------------
 * Bank KUIS LATIHAN — <QuizCard ... />
 *
 * Kunci latihan sebelumnya ikut ter-inline ke HTML lewat atribut
 * `data-correct`/`data-explanation`, sehingga bisa dibaca dari View Source dan
 * `complete.php` boleh dikirimi skor apa saja. Sekarang atribut itu tidak ada
 * lagi: isi `<QuizCard>` dibaca di sini dan hanya indeks benarnya yang ditulis
 * ke `api/kunci.php` (KUIS_KUNCI), dinilai server di `api/quiz.php`.
 *
 * Parser sengaja menyisir tag dengan penghormatan kutip & kurung kurawal
 * (bukan regex sepele) karena teks soal boleh memuat `>` — mis. ekspresi
 * relasional `σ<prodi='Informatika'>`. Regex `[^>]*` akan terpotong di sana dan
 * kunci punjdan bergeser diam-diam.
 * ------------------------------------------------------------------------- */

/** Entitas HTML yang mungkin muncul di sumber MDX; dikembalikan ke karakter asli. */
const ENTITAS = { quot: '"', amp: '&', lt: '<', gt: '>', apos: "'", nbsp: '\u00a0' };

function decodeEntitas(teks, namaFile, konteks) {
  const hasil = teks.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, ent) => {
    if (ent[0] === '#') {
      const kode = ent[1] === 'x' || ent[1] === 'X'
        ? parseInt(ent.slice(2), 16)
        : parseInt(ent.slice(1), 10);
      return Number.isFinite(kode) ? String.fromCodePoint(kode) : m;
    }
    const key = ent.toLowerCase();
    if (key in ENTITAS) return ENTITAS[key];
    throw new Error(`${namaFile}: entitas HTML tak dikenal "${m}" pada ${konteks}.`);
  });
  if (/&[a-z#]/i.test(hasil)) {
    throw new Error(`${namaFile}: sisa "&" yang mungkin entitas pada ${konteks} -> "${hasil}".`);
  }
  return hasil;
}

/** Kumpulkan seluruh tag <QuizCard ...> beserta isi atribut mentahnya. */
function kumpulkanKartu(namaFile, sumber) {
  const tag = [];
  let i = 0;
  while (i < sumber.length) {
    const start = sumber.indexOf('<QuizCard', i);
    if (start === -1) break;
    const lan = sumber[start + '<QuizCard'.length] || ' ';
    if (/[A-Za-z0-9]/.test(lan)) {
      i = start + '<QuizCard'.length;
      continue;
    }
    let j = start + '<QuizCard'.length;
    let depth = 0;
    let quote = null;
    let end = -1;
    for (; j < sumber.length; j++) {
      const ch = sumber[j];
      if (quote !== null) {
        if (ch === '\\') { j++; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
      if (ch === '{') { depth++; continue; }
      if (ch === '}') { depth--; continue; }
      if (ch === '>' && depth === 0) { end = j; break; }
    }
    if (end === -1) throw new Error(`${namaFile}: tag <QuizCard tidak tertutup.`);
    const mentah = sumber.slice(start, end + 1);
    if (!/\/>$/.test(mentah)) {
      throw new Error(
        `${namaFile}: <QuizCard harus self-closing (<QuizCard ... />). ` +
          `Bentuk dengan <button> di dalam berarti kunci jawaban ada di HTML — dilarang.`
      );
    }
    // buang pembuka `<QuizCard` dan penutup `/>`
    tag.push(mentah.slice('<QuizCard'.length, -2));
    i = end + 1;
  }
  return tag;
}

/** Pecah isi tag menjadi peta atribut: nama -> nilai mentah (string atau ekspresi). */
function parseAtribut(isi, namaFile) {
  const props = {};
  let i = 0;
  while (i < isi.length) {
    while (i < isi.length && /\s/.test(isi[i])) i++;
    if (i >= isi.length) break;
    const m = /^[A-Za-z_][A-Za-z0-9_:-]*/.exec(isi.slice(i));
    if (!m) throw new Error(`${namaFile}: atribut tidak terbaca -> "${isi.slice(i, i + 30)}".`);
    const nama = m[0];
    i += nama.length;
    while (i < isi.length && /\s/.test(isi[i])) i++;
    if (isi[i] !== '=') throw new Error(`${namaFile}: atribut "${nama}" tanpa nilai.`);
    i++;
    while (i < isi.length && /\s/.test(isi[i])) i++;
    const ch = isi[i];
    if (ch === '"' || ch === "'") {
      const close = isi.indexOf(ch, i + 1);
      if (close === -1) throw new Error(`${namaFile}: atribut "${nama}" tanpa penutup.`);
      props[nama] = isi.slice(i + 1, close);
      i = close + 1;
    } else if (ch === '{') {
      let depth = 0;
      let j = i;
      let quote = null;
      for (; j < isi.length; j++) {
        const c = isi[j];
        if (quote !== null) {
          if (c === '\\') { j++; continue; }
          if (c === quote) quote = null;
          continue;
        }
        if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) break; }
      }
      if (depth !== 0) throw new Error(`${namaFile}: atribut "${nama}" tidak tertutup.`);
      props[nama] = isi.slice(i + 1, j).trim();
      i = j + 1;
    } else {
      throw new Error(`${namaFile}: nilai atribut "${nama}" harus "teks" atau {ekspresi}.`);
    }
  }
  return props;
}

/** Baca bank kuis latihan satu berkas MDX; null bila tidak ada kartu. */
function bacaKuis(namaFile, sumber) {
  const tag = kumpulkanKartu(namaFile, sumber);
  if (tag.length === 0) return null;

  // Penghitung independen: bila parser melewatkan satu tag, jumlah ini beda.
  const jumlahTag = (sumber.match(/<QuizCard(?![A-Za-z0-9])/g) || []).length;
  if (jumlahTag !== tag.length) {
    throw new Error(
      `${namaFile}: ada ${jumlahTag} tag <QuizCard tapi hanya ${tag.length} ter-parse.`
    );
  }

  const id = [];
  const benar = [];
  const opsi = [];
  const jelas = [];

  tag.forEach((isiTag, idx) => {
    const p = parseAtribut(isiTag, namaFile);
    const nama = `kartu ${idx + 1} (<QuizCard>)`;
    for (const wajib of ['id', 'soal', 'opsi', 'benar']) {
      if (p[wajib] === undefined) throw new Error(`${namaFile}: ${nama} tanpa atribut "${wajib}".`);
    }
    if (id.includes(p.id)) throw new Error(`${namaFile}: id kuis "${p.id}" ganda.`);
    id.push(decodeEntitas(p.id, namaFile, nama));
    if (p.id !== `q${idx + 1}`) {
      throw new Error(
        `${namaFile}: id kuis harus berurutan q1, q2, ... (dapat "${p.id}" di posisi ${idx + 1}).`
      );
    }
    decodeEntitas(p.soal, namaFile, `${nama} soal`); // hanya validasi
    if (p.jelas !== undefined) decodeEntitas(p.jelas, namaFile, `${nama} jelas`);

    let daftarOpsi;
    try {
      daftarOpsi = JSON.parse(p.opsi);
    } catch (e) {
      throw new Error(`${namaFile}: ${nama} opsi bukan array JSON yang sah -> ${p.opsi}`);
    }
    if (!Array.isArray(daftarOpsi) || daftarOpsi.length < 2) {
      throw new Error(`${namaFile}: ${nama} butuh minimal 2 opsi.`);
    }
    if (!/^\d+$/.test(p.benar.trim())) {
      throw new Error(`${namaFile}: ${nama} atribut benar harus bilangan bulat.`);
    }
    const k = Number(p.benar.trim());
    if (k < 0 || k >= daftarOpsi.length) {
      throw new Error(`${namaFile}: ${nama} benar=${k}, tapi opsi hanya ${daftarOpsi.length}.`);
    }
    opsi.push(daftarOpsi.length);
    benar.push(k);
    jelas.push(p.jelas === undefined ? '' : decodeEntitas(p.jelas, namaFile, `${nama} jelas`));
  });

  return { id, benar, opsi, jelas };
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
const kuis = {};
for (const f of files) {
  const pid = Number(f.replace(/\.mdx$/, ''));
  if (!Number.isInteger(pid)) {
    throw new Error(`Nama berkas tidak bisa jadi id pertemuan: ${f}`);
  }
  const sumber = readFileSync(join(CONTENT_DIR, f), 'utf8');
  const bank = bacaBank(f);
  if (bank) kunci[pid] = bank;
  const bankKuis = bacaKuis(f, sumber);
  if (bankKuis) kuis[pid] = bankKuis;
}

const totalSoal = Object.values(kunci).reduce((n, b) => n + b.benar.length, 0);
if (totalSoal === 0) {
  throw new Error('Tidak ada kunci yang tergambar — Periksa sumber MDX.');
}
const totalKuis = Object.values(kuis).reduce((n, b) => n + b.benar.length, 0);
if (totalKuis === 0) {
  throw new Error('Tidak ada kunci kuis latihan yang tergambar — Periksa <QuizCard> di MDX.');
}

/** String literal PHP: petik tunggal, escape backslash lalu petik. */
const phpStr = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const phpArr = (arr) => 'array(' + arr.join(', ') + ')';

const baris = [];
baris.push('<?php');
baris.push('/**');
baris.push(' * KUNCI JAWABAN EVALUASI & KUIS LATIHAN — BERKAS HASIL GENERATE, JANGAN DIEDIT MANUAL.');
baris.push(' *');
baris.push(' * Sumber: src/content/pertemuan/*.mdx');
baris.push(" *          - EVAL_KUNCI: field `benar` pada bank soal (`{ soal, opsi, benar }`)");
baris.push(' *          - KUIS_KUNCI: atribut `benar` pada tiap `<QuizCard id=".." soal=".." opsi={[..]} benar={n} />`');
baris.push(' * Regenerasi: `npm run build` (atau `node scripts/gen-kunci.mjs`).');
baris.push(' *');
baris.push(' * Berkas ini RAHASIA — tidak boleh ter-deploy ke direktori publik dan tidak');
baris.push(' * boleh masuk git (sudah di-.gitignore). Server membacanya lewat helper');
baris.push(' * `eval_kunci()` (evaluasi) dan `kuis_kunci()` (latihan) di config.php untuk');
baris.push(' * menghitung skor. Kunci tidak pernah dikirim ke browser.');
baris.push(' *');
baris.push(" * Bentuk: EVAL_KUNCI[pertemuan_id] = array('benar' => [indeks per soal],");
baris.push(" *                                      'opsi'  => [jumlah opsi per soal]);");
baris.push(" *         KUIS_KUNCI[pertemuan_id] = array('id'    => ['q1', 'q2', ...],");
baris.push(" *                                      'benar' => [indeks per soal],");
baris.push(" *                                      'opsi'  => [jumlah opsi per soal],");
baris.push(" *                                      'jelas' => [penjelasan]);");
baris.push(' */');
baris.push('declare(strict_types=1);');
baris.push('');
baris.push('const EVAL_KUNCI = array(');
for (const pid of Object.keys(kunci).map(Number).sort((a, b) => a - b)) {
  const { benar, opsi } = kunci[pid];
  baris.push(`    ${pid} => array('benar' => ${phpArr(benar)}, 'opsi' => ${phpArr(opsi)}),`);
}
baris.push(');');
baris.push('');
baris.push('const KUIS_KUNCI = array(');
for (const pid of Object.keys(kuis).map(Number).sort((a, b) => a - b)) {
  const { id, benar, opsi, jelas } = kuis[pid];
  baris.push(`    ${pid} => array(`);
  baris.push(`        'id' => ${phpArr(id.map(phpStr))},`);
  baris.push(`        'benar' => ${phpArr(benar)},`);
  baris.push(`        'opsi' => ${phpArr(opsi)},`);
  baris.push(`        'jelas' => ${phpArr(jelas.map(phpStr))},`);
  baris.push('    ),');
}
baris.push(');');
baris.push('');

writeFileSync(OUT_FILE, baris.join('\n'));

const pids = Object.keys(kunci).map(Number).sort((a, b) => a - b);
const ringkas = pids.map((p) => `P${p}(${kunci[p].benar.length})`).join(' ');
const pidsKuis = Object.keys(kuis).map(Number).sort((a, b) => a - b);
const ringkasKuis = pidsKuis.map((p) => `P${p}(${kuis[p].benar.length})`).join(' ');

console.log(`gen-kunci: ${pids.length} bank evaluasi (${totalSoal} soal), ` +
  `${pidsKuis.length} bank kuis latihan (${totalKuis} soal) -> api/kunci.php`);
console.log(`  evaluasi: ${ringkas}`);
console.log(`  kuis    : ${ringkasKuis}`);

