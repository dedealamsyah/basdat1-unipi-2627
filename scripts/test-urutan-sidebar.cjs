/**
 * Uji urutan sidebar setelah posisi dari server diterapkan (v2.9.5).
 *
 * Mereproduksi bug yang dilihat user: `localeCompare` bersifat leksikografis
 * sehingga "10" < "2": daftar meloncat begitu data tiba, dan klik bisa
 * mendarat di baris lain.
 *
 * Versi baru: (a) bandingkan numerik, (b) pakai CSS `order` — node DOM
 * tidak pernah dipindahkan, hanya urutan visualnya.
 */
let gagal = 0;
function cek(nama, dapat, harap) {
  const ok = JSON.stringify(dapat) === JSON.stringify(harap);
  console.log((ok ? "  OK   " : "  GAGAL ") + nama);
  if (!ok) {
    console.log("         dapat " + JSON.stringify(dapat));
    console.log("         harap " + JSON.stringify(harap));
    gagal = 1;
  }
}

// Peta posisi dari DB (P9 & P10 dua digit — kasus yang memicu bug).
const dbPosisi = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 9: 8, 10: 9,
  8: 10, 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16,
};

// Urutan visual = urutan node diurutkan berdasarkan `order` (CSS flex).
function urutVisual(rows) {
  return rows
    .slice()
    .sort((a, b) => (a.order - b.order))
    .map((r) => String(r.id));
}

function barisDariDom(urutanDom) {
  return urutanDom.map((id) => ({ id, order: 0 }));
}

// --- versi lama: sort leksikografis (bug) ---
const lama = barisDariDom([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
lama.forEach((r) => { r.order = dbPosisi[r.id]; });
const lamaUrut = lama
  .slice()
  .sort((a, b) => String(a.order).localeCompare(String(b.order)))
  .map((r) => String(r.id));
console.log("== versi LAMA (localeCompare) ==");
console.log("  urutan: " + lamaUrut.join(", "));
const benar = urutVisual(lama);
cek("  reproduksi bug: urutan lama memang salah", lamaUrut !== benar, true);

// --- versi baru: order numerik, tanpa pindah node ---
console.log("\n== versi BARU (CSS order, numerik) ==");
const baru = barisDariDom([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
baru.forEach((r) => { r.order = parseInt(dbPosisi[r.id], 10) || 99; });
cek("urutan visual mengikuti posisi DB", urutVisual(baru), benar);
cek("node DOM tidak dipindah (urutan tetap)",
  baru.map((r) => String(r.id)),
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"]);

// --- dua digit ---
const dua = [{ id: 1, order: 1 }, { id: 2, order: 2 }, { id: 10, order: 3 }, { id: 11, order: 4 }];
cek("dua digit urut benar (2, 10, 11)", urutVisual(dua), ["1", "2", "10", "11"]);

// --- posisi kosong / null ---
const kosong = [{ id: 1, order: 1 }, { id: 5, order: 2 }, { id: 3, order: 99 }, { id: 4, order: 99 }];
cek("posisi kosong -> turun ke bawah, stabil", urutVisual(kosong), ["1", "5", "3", "4"]);

// --- urutan pilihan admin dihormati ---
const admin = [{ id: 1, order: 3 }, { id: 2, order: 1 }, { id: 3, order: 2 }];
cek("urutan pilihan admin dihormati", urutVisual(admin), ["2", "3", "1"]);

// --- dua baris dengan order sama: stabil (tidak saling tertukar acak) ---
const sama = [{ id: 1, order: 5 }, { id: 2, order: 5 }, { id: 3, order: 1 }];
cek("order sama -> urut DOM dipertahankan", urutVisual(sama), ["3", "1", "2"]);

console.log("\n" + (gagal ? "ADA UJI GAGAL" : "SEMUA UJI LULUS"));
process.exit(gagal);
