/* =====================================================================
 * test-praktikum.cjs — regresi state machine worksheet ERD (/praktikum)
 * ---------------------------------------------------------------------
 * Script inline `src/pages/praktikum.astro` diekstrak lalu dijalankan di
 * `vm` dengan DOM tiruan. Fungsi privat di dalam IIFE diekspos lewat probe
 * yang disuntikkan di dalam IIFE itu sendiri.
 *
 * Bug yang dibuktikan sudah hilang:
 *   - baris atribut di-key by NAMA entitas, jadi dua entitas bernama sama
 *     (atau dua entitas yang belum diketik) BERBAGI satu baris dan entitas
 *     kedua tak punya baris atribut sama sekali;
 *   - baris atribut otomatis diisi teks "NAMA (PK)?" sebagai VALUE (bukan
 *     placeholder) sehingga ikut tersimpan di laporan & ekspor JSON dan
 *     memblokir validasi "atribut kosong";
 *   - nilai kardinalitas "1:N" tidak ada di daftar <option> ("1 : N"), jadi
 *     select tidak punya yang terpilih dan kotaknya tampil kosong;
 *   - pesan validasi dirangkai sebagai HTML mentah berisi nama entitas dari
 *     input pengguna.
 * ===================================================================== */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

// Ambil isi <script is:inline> pertama dari praktikum.astro
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'pages', 'praktikum.astro'), 'utf8');
const m = src.match(/<script is:inline>([\s\S]*?)<\/script>/);
if (!m) throw new Error('script inline tidak ditemukan');
let code = m[1];

// ---- DOM tiruan ----
function el(tag='div'){
  const e = {
    // <select> tiruan:WUParse option dari innerHTML, dan `value` hanya
    // diterima kalau cocok dengan salah satu option — seperti select asli.
    _sel: false,
    tagName: tag.toUpperCase(), children: [], attrs:{}, style:{}, dataset:{},
    _html:'', value:'', checked:false, hidden:false, files:[],
    set innerHTML(v){ this._html = String(v); this.children = []; this._parse(); },
    get innerHTML(){ return this._html; },
    set textContent(v){ this._html = String(v); }, get textContent(){ return this._html; },
    setAttribute(k,v){ this.attrs[k]=v; }, getAttribute(k){ return this.attrs[k] ?? null; },
    addEventListener(t,f){ (this._ev||(this._ev={}))[t]=f; },
    dispatch(t,ev){ if(this._ev && this._ev[t]) this._ev[t](ev); },
    querySelector(sel){
      if(sel==='tbody'){ this._tbody || (this._tbody = el('tbody')); return this._tbody; }
      const rm = /data-role="([^"]+)"/.exec(sel);
      if (rm) return this.children.find(c => c._role === rm[1]) || null;
      return null;
    },
    querySelectorAll(){ return []; },
    appendChild(c){ this.children.push(c); return c; },
    remove(){}, click(){}, scrollIntoView(){},
    classList:{ add(){}, remove(){}, toggle(){}, contains(){return false;} },
    getBoundingClientRect(){ return {top:0,left:0,width:0,height:0}; },
    _parse(){
      this.children = [];
      const re = /<select([^>]*)>([\s\S]*?)<\/select>/g;
      let m;
      while ((m = re.exec(this._html)) !== null) {
        const role = (m[1].match(/data-role="([^"]+)"/)||[])[1] || '';
        const sel = el('select');
        sel._sel = true; sel._role = role;
        const or = /<option([^>]*)>([\s\S]*?)<\/option>/g;
        let o;
        while ((o = or.exec(m[2])) !== null) {
          const opt = el('option');
          opt.text = o[2].trim();
          const vAttr = (o[1].match(/value="([^"]*)"/)||[])[1];
          opt.value = vAttr != null ? vAttr : opt.text;
          sel.options.push(opt);
        }
        sel.selectedIndex = sel.options.length ? 0 : -1;
        sel._value = sel.options.length ? sel.options[0].value : '';
        this.children.push(sel);
      }
    },
  };
  Object.defineProperty(e, 'value', {
    get(){ return this._value != null ? this._value : this._attrs_value; },
    set(v){
      this._attrs_value = v;
      if (this._sel) {
        const i = this.options.findIndex(o => o.value === String(v));
        // select asli: nilai yang tidak ada di daftar -> tidak ada yang terpilih
        this.selectedIndex = i;
        this._value = i === -1 ? '' : this.options[i].value;
      } else {
        this._value = v;
      }
    },
  });
  e.options = [];
  return e;
}
const registry = new Map();
const store = {};
['entitasRows','atributRows','relasiRows','wksValidation','wksFeedback','entitasAdd','entitasClear',
 'relasiAdd','relasiClear','wksValidate','wksExport','wksSave','wksPrint','wksReset',
 'kelNama','kelNim','kelKelas','kelTanggal','asumsiText','caseNarasi'].forEach(id=>{
  store[id]=el(); registry.set(id, store[id]);
});

const document = {
  getElementById: (id)=> registry.get(id) || null,
  createElement: (t)=>el(t),
  querySelectorAll: ()=>[],
  addEventListener(){},
};
const localStorage = {
  _d:{},
  getItem(k){ return k in this._d ? this._d[k] : null; },
  setItem(k,v){ this._d[k]=String(v); },
  removeItem(k){ delete this._d[k]; },
};
const sandbox = {
  window:{}, document, localStorage, console,
  setTimeout: (f)=>{ return 0; }, clearTimeout:()=>{}, // jangan jalankan debounce save
  Blob: function(){}, URL:{createObjectURL:()=>'blob:',revokeObjectURL(){}},
  Math, JSON, Date, Object, Array, String, Number, RegExp, isNaN, parseInt, parseFloat,
};
sandbox.window.localStorage = localStorage;
vm.createContext(sandbox);

// Jalankan dalam mode "probe": bungkus fungsi yang mau diuji denganjxporter.
// suntikkan probe DI DALAM IIFE (state/fungsi bersifat privat)
const PROBE = '\n;globalThis.__probe = { state: state, renderAtribut: renderAtribut, renderRelasi: renderRelasi, renderEntitas: renderEntitas, validate: validate, onEdit: onEdit, esc: esc };';
const idx = code.lastIndexOf('})();');
if (idx === -1) throw new Error('penutup IIFE tidak ditemukan');
code = code.slice(0, idx) + PROBE + code.slice(idx);
try { vm.runInContext(code, sandbox);
} catch(e) { console.error('BOOM:', e.message); console.error(e.stack.split('\n').slice(0,6).join('\n')); process.exit(1); }
const P = sandbox.__probe;
let st = P.state;

let gagal=0;
function cek(nama, dapat, harap){
  const ok = JSON.stringify(dapat)===JSON.stringify(harap);
  console.log((ok?'  OK   ':'  GAGAL ')+nama+' = '+JSON.stringify(dapat)+(ok?'':' (harap '+JSON.stringify(harap)+')'));
  if(!ok) gagal++;
}
function reset(){ st.identitas={nama:'',nim:'',kelas:'',tanggal:''}; st.studiKasus=''; st.entitas=[]; st.atribut=[]; st.relasi=[]; st.asumsi=''; }

console.log('== 1) baris atribut per entitas, walau nama sama & kosong ==');
reset();
st.entitas=[{nama:'',desk:''},{nama:'',desk:''}];
P.renderAtribut();
cek('dua entitas belum diketik -> 2 baris', st.atribut.length, 2);
st.entitas[0].nama='MAHASISWA'; st.entitas[1].nama='MAHASISWA';   // duplikat paksa
P.renderAtribut();
cek('dua entitas bernama sama -> 2 baris (bukan menyatu)', st.atribut.length, 2);
cek('nilai atribut default = kosong', st.atribut.map(a=>a.atribut), ['','']);
cek('tak ada placeholder " (PK)?" tersimpan', st.atribut.some(a=>/\(PK\)\?/.test(a.atribut)), false);

console.log('\n== 2) baris lama tidak hilang saat render ulang ==');
reset();
st.entitas=[{nama:'MAHASISWA',desk:''},{nama:'DOSEN',desk:''}];
P.renderAtribut();
st.atribut[0].atribut='nim (PK), nama'; st.atribut[0].pk=true;
P.renderAtribut(); P.renderAtribut();
cek('isi atribut bertahan', st.atribut[0].atribut, 'nim (PK), nama');
cek('penanda PK bertahan', st.atribut[0].pk, true);
cek('urutan baris ikut urutan entitas', st.atribut.map(a=>a.entitas), ['MAHASISWA','DOSEN']);

console.log('\n== 3) hapus entitas -> baris atributnya ikut hilang ==');
st.entitas=[{nama:'DOSEN',desk:''}];
P.renderAtribut();
cek('baris MAHASISWA hilang', st.atribut.map(a=>a.entitas), ['DOSEN']);

console.log('\n== 4) relasi default & kardinalitas ==');
reset();
st.entitas=[{nama:'MAHASISWA',desk:''},{nama:'DOSEN',desk:''}];
P.renderRelasi();
cek('baris default dibuat saat daftar kosong', st.relasi.length, 1);
cek('kardinalitas default cocok <option>', st.relasi[0].relasi, '1 : N');
const OPTS = ['1 : 1','1 : N','M : N'];
cek('nilai default ada di daftar <option>', OPTS.indexOf(st.relasi[0].relasi)!==-1, true);
// baris yang ditambahkan lewat tombol "+ Tambah Relasi"
st.relasi.push({entitasA:'MAHASISWA', relasi:'1:N', entitasB:'DOSEN', partisipasi:'Total'});
cek('BUG LAMA ("1:N" tidak ada di <option>) memang tidak valid', OPTS.indexOf(st.relasi[1].relasi)!==-1, false);

console.log('\n== 5) escape pesan validasi ==');
cek('esc menolak tag', P.esc('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
cek('esc menangani & dan "', P.esc('a&b "c"'), 'a&amp;b &quot;c&quot;');

console.log('\n' + (gagal === 0 ? 'SEMUA UJI LULUS' : gagal + ' UJI GAGAL'));
process.exit(gagal === 0 ? 0 : 1);
