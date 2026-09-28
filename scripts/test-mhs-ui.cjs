/* =====================================================================
 * test-mhs-ui.cjs — regresi lapisan UI mahasiswa (public/mhs-ui.js)
 * ---------------------------------------------------------------------
 * Dijalankan lewat `npm test`. Berkas ini tidak butuh browser: modul
 * dimuat di `vm` dengan DOM tiruan secukupnya, lalu `MhsUI.render()`
 * dipanggil dengan payload `me.php` yang nyata bentuknya.
 *
 * Yang diuji — semuanya bug yang sudah pernah terjadi:
 *   - kelas `pstatus--warn-perlu/--warn-berat` pernah dirangkai sebagai
 *     "done warn-perlu" sehingga skor di bawah ambang tidak pernah merah/amber;
 *   - seksi "Perlu perhatian" (#dashAttention) punya markup + CSS tapi tidak
 *     pernah diisi, jadi selalu kosong;
 *   - chip "Tugas" membaca `rekap.ada_tugas` yang maknanya terbalik dan
 *     `rekap.tugas` yang tidak pernah dikirim server;
 *   - pembagian rata-rata nilai saat `active` kosong menghasilkan NaN%;
 *   - dashboard mengklaim "semua pertemuan tuntas" saat rekap kosong.
 * ===================================================================== */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'mhs-ui.js'), 'utf8');

function buatEl(tag) {
  return {
    tagName: (tag || 'div').toUpperCase(), children: [], attrs: {}, _html: '',
    style: {}, dataset: {}, hidden: false, title: '',
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; },
    set textContent(v) { this._html = String(v); }, get textContent() { return this._html; },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k] != null ? this.attrs[k] : null; },
    classList: { _s: new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);},
                 toggle(c,f){ f===undefined ? (this._s.has(c)?this._s.delete(c):this._s.add(c)) : (f?this._s.add(c):this._s.delete(c)); },
                 contains(c){return this._s.has(c);} },
    querySelector(){return null;}, querySelectorAll(){return [];},
    addEventListener(){}, removeEventListener(){}, contains(){return false;},
  };
}

const ids = ['notifPanel','notifPanelList','notifPanelEmpty','notifBadge','notifBadgeMobile',
             'notifBox','notifList','dashWrap','dashGreeting','dashNext','dashCards',
             'dashAttention','dashAttentionHead','dashAttentionList','pageStatus','pageMeta'];
const store = {};
ids.forEach((id) => { store[id] = buatEl(); });
store.notifPanelEmpty.hidden = false;

const document = {
  getElementById: (id) => store[id] || null,
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener(){}, createElement: (t)=>buatEl(t), body: buatEl('body'),
};
const sandbox = { window: {}, document, console, Math, JSON, Date, Object, Array, String, Number };
sandbox.window.APIAuth = { esc: (s)=>String(s==null?'':s) };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const MhsUI = sandbox.window.MhsUI;

// Mahasiswa: P1 tuntas + evaluasi 42% (berat), P2 latihan 67% & tugas terkirim
const p = {
  logged_in: true,
  user: { nim: '22104001', nama: 'Ahmad', kelas: 'IF3A', role: 'mahasiswa' },
  active: [1, 2],
  progress: { '1': 'done', '2': 'open' },
  rekap: {
    '1': { status:'done', ada_latihan:true, ada_evaluasi:true, ada_tugas:false, tugas:false,
           latihan:{skor:3,total:3,pct:100}, evaluasi:{skor:42,total:100,pct:42,flagged:0} },
    '2': { status:'open', ada_latihan:true, ada_evaluasi:true, ada_tugas:true, tugas:true,
           latihan:{skor:2,total:3,pct:67}, evaluasi:{skor:0,total:0,pct:null,flagged:0} },
  },
  nilai: { kuis_pct: 55, akhir: null, huruf: null },
};
store.pageMeta.attrs['data-pertemuan'] = '1';

MhsUI.render(p);

let gagal = 0;
function cek(nama, dapat, harap) {
  const ok = JSON.stringify(dapat) === JSON.stringify(harap);
  console.log((ok ? '  OK   ' : '  GAGAL ') + nama + ' = ' + JSON.stringify(dapat) + (ok ? '' : ' (harap ' + JSON.stringify(harap) + ')'));
  if (!ok) gagal++;
}

console.log('== strip status halaman materi (P1: evaluasi 42% -> merah) ==');
const ps = store.pageStatus.innerHTML;
console.log('   ' + ps);
cek('pstatus--warn-berat muncul', /pstatus--warn-berat/.test(ps), true);
cek('tidak ada kelas "done warn-"', /pstatus--done warn-/.test(ps), false);
cek('P1 latihan tuntas 100%', /Tuntas · 100%/.test(ps), true);
cek('P2 tidak ikut (hanya P1 dirender)', /Tugas/.test(ps), false);

console.log('\n== seksi "Perlu perhatian" di beranda ==');
cek('dashAttention ditampilkan', store.dashAttention.hidden, false);
cek('jumlah item = jumlah notif', (store.dashAttentionList.innerHTML.match(/<li /g)||[]).length, 3);
cek('head menyebut jumlah', /3 pengingat/.test(store.dashAttentionHead.textContent), true);
cek('memakai kelas .attn--tinggi', /attn--tinggi/.test(store.dashAttentionList.innerHTML), true);

console.log('\n== kartu nilai ==');
console.log('   ' + store.dashCards.innerHTML.replace(/></g, '>\n   <'));
cek('tidak ada NaN%', /NaN/.test(store.dashCards.innerHTML), false);

console.log('\n== lonceng & pill ==');
cek('badge = jumlah notif', store.notifBadge.textContent, '3');
cek('badge terlihat', store.notifBadge.hidden, false);

console.log('\n== tugas: P2 punya slot & sudah kirim ==');
store.pageMeta.attrs['data-pertemuan'] = '2';
MhsUI.render(p);
const ps2 = store.pageStatus.innerHTML;
console.log('   ' + ps2);
cek('chip Tugas Terkirim', /Terkirim/.test(ps2), true);
cek('chip Tugas tidak "Belum dikirim"', /Belum dikirim/.test(ps2), false);
cek('chip Tugas done', /pstatus--done[^>]*>[\s\S]*?Tugas/.test(ps2), true);

console.log('\n== nilai kuis berjalan rendah memicu pengingat ==');
cek('ada pengingat nilai kuis berjalan', /Nilai kuis berjalan/.test(store.notifPanelList.innerHTML), true);

console.log('\n== mahasiswa tanpa rekap (mis. me.php gagal) ==');
store.pageMeta.attrs['data-pertemuan'] = '1';
MhsUI.render({ logged_in:true, user:{nim:'x',role:'mahasiswa'}, active:[], progress:{}, rekap:{}, nilai:null });
cek('tidak diklaim "semua tuntas" saat tak ada data',
    /Semua pertemuan aktif sudah tuntas/.test(store.dashNext.innerHTML), true);
cek('tanpa data = tanpa pengingat', store.notifBadge.hidden, true);
cek('seksi perhatian disembunyikan', store.dashAttention.hidden, true);

console.log('\n== admin & tamu ==');
store.notifBadge.hidden = false;
MhsUI.render({ logged_in:true, user:{nim:'a',role:'admin'}, active:[1], progress:{}, rekap:{} });
cek('admin: lonceng mati', store.notifBadge.hidden, true);
cek('admin: dashboard disembunyikan', store.dashWrap.hidden, true);
MhsUI.render({ logged_in:false, user:null, active:[], progress:{}, rekap:{} });
cek('tamu: dashboard disembunyikan', store.dashWrap.hidden, true);

console.log('\n' + (gagal === 0 ? 'SEMUA UJI LULUS' : gagal + ' UJI GAGAL'));
process.exit(gagal === 0 ? 0 : 1);
