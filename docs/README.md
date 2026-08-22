PORTAL MATERI BASIS DATA — UNIPI (Website Lokal)
==================================================

CARA MEMBUKA
-------------
1. Ekstrak seluruh folder ini ke komputer (jangan pisahkan file-filenya).
2. Klik dua kali file "index.html" — akan terbuka otomatis di browser
   (Chrome/Edge/Firefox). Tidak perlu internet, tidak perlu server.
3. Materi Pertemuan 1 sudah lengkap & bisa langsung dipakai mengajar.
   Pertemuan 2–16 masih berstatus "belum tersedia" (placeholder).

ISI FOLDER
-----------
- index.html   -> kerangka halaman (JANGAN diedit kecuali paham HTML/CSS)
- app.js       -> logika tampilan (JANGAN diedit, otomatis baca content.js)
- content.js   -> SATU-SATUNYA FILE YANG PERLU DIEDIT untuk menambah materi

CARA MENAMBAH MATERI PERTEMUAN BARU (mis. Pertemuan 2)
--------------------------------------------------------
1. Buka content.js dengan Notepad / VS Code / editor teks apa pun.
2. Cari baris:
      { id: 2, locked: true, title: "Perancangan Model Konseptual (ERD)" },
3. Ganti seluruh baris itu menjadi format lengkap seperti Pertemuan 1,
   contoh kerangkanya:

      {
        id: 2,
        locked: false,                     // <- ubah jadi false
        title: "Judul Pertemuan 2",
        subtitle: "Sub-judul singkat",
        meta: {
          subCPMK: "...",
          alokasi: "3 x 50 menit",
          bobot: "3%",
          cpmk: "CPMK-1",
        },
        sections: [
          { heading: "A. ...", html: `<p>Isi materi...</p>` },
          { heading: "B. ...", html: `<p>Isi materi...</p>` },
          // tambah sebanyak yang dibutuhkan
        ],
      },

4. Simpan file, lalu refresh index.html di browser. Selesai — sidebar dan
   progress bar otomatis ikut terupdate.

TIPS PENULISAN ISI (html di dalam sections)
---------------------------------------------
- Bisa pakai tag HTML biasa: <p>, <ul><li>, <ol><li>, <table>, <strong>, <em>.
- Untuk tabel rapi otomatis, bungkus dengan class "dtable":
    <table class="dtable"><thead>...</thead><tbody>...</tbody></table>
- Untuk kotak highlight/catatan penting, pakai:
    <div class="callout"><span class="callout__label">Judul</span><p>Isi</p></div>
- Untuk langkah bernomor bergaya badge, pakai <ol class="steps">.
- Tanda kutip di dalam teks HTML pakai tanda kutip ganda ("...") seperti biasa,
  tapi karena keseluruhan blok memakai backtick (`...`), aman dipakai bebas.

BILA INGIN DI-HOST DI JARINGAN LOKAL KAMPUS (opsional)
---------------------------------------------------------
File ini juga bisa dijalankan lewat server lokal sederhana bila suatu saat
ingin dibagikan lewat jaringan wifi kampus, misalnya dengan Python:
    python -m http.server 8000
lalu diakses lewat browser di alamat: http://localhost:8000
Ini opsional — membuka index.html langsung (tanpa server) sudah cukup untuk
pemakaian sehari-hari di kelas.
