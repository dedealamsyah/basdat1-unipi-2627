/* =====================================================================
   content.js — SUMBER DATA MATERI BASIS DATA (UNIPI)
   ---------------------------------------------------------------------
   CARA MENAMBAH MATERI PERTEMUAN BARU:
   1. Cari objek dengan id sesuai nomor pertemuan pada array PERTEMUAN.
   2. Ganti locked: true  ->  locked: false
   3. Isi title, subtitle, meta, dan sections (lihat contoh Pertemuan 1).
   4. Simpan file ini, lalu refresh index.html di browser. Selesai.

   Setiap "section" adalah blok materi dengan heading + html (boleh berisi
   tag HTML biasa: <p>, <ul>, <table>, <svg>, dst).
===================================================================== */

const COURSE = {
  name: "Basis Data",
  prodi: "Program Studi S1 Informatika — UNIPI",
  semester: "Semester 3 · Tahun Akademik 2026/2027",
  dbName: "basis_data_db", // hiasan tematik pada sidebar
};

const PERTEMUAN = [
  {
    id: 1,
    locked: false,
    title: "Introduction to Databases",
    subtitle: "Konsep Dasar, Sejarah, Komponen, Arsitektur, dan Model Basis Data",
    meta: {
      subCPMK: "Mahasiswa mampu menjelaskan konsep dasar basis data dan memahami peta capaian pembelajaran (CPL-CPMK-Sub-CPMK) berbasis OBE.",
      alokasi: "3 × 50 menit",
      bobot: "1%",
      cpmk: "CPMK-1",
    },
    sections: [
      {
        heading: "A. Identitas Pertemuan",
        html: `
          <table class="dtable">
            <tbody>
              <tr><th>Mata Kuliah</th><td>Basis Data — Program Studi S1 Informatika, UNIPI</td></tr>
              <tr><th>Pertemuan / Minggu</th><td>Ke-1 dari 16 (Semester 3, TA 2026/2027)</td></tr>
              <tr><th>Alokasi Waktu</th><td>3 × 50 menit (Tatap Muka) + Penugasan Terstruktur/Mandiri</td></tr>
              <tr><th>CPMK Terkait</th><td>CPMK-1: Menguasai konsep dan implementasi basis data dalam pengembangan rekayasa perangkat lunak, permainan, multimedia cerdas, dan teknik komputer jaringan.</td></tr>
              <tr><th>Sub-CPMK Minggu 1</th><td>Mahasiswa mampu menjelaskan konsep dasar basis data dan memahami peta capaian pembelajaran (CPL-CPMK-Sub-CPMK) mata kuliah berbasis OBE.</td></tr>
            </tbody>
          </table>`,
      },
      {
        heading: "B. Capaian Pembelajaran (Pendekatan OBE)",
        html: `
          <p>Sesuai prinsip <em>Outcome Based Education</em> (OBE), pembelajaran pertemuan ini dirancang mundur (<em>backward design</em>) dari outcome yang harus dicapai mahasiswa, bukan sekadar dari materi yang harus disampaikan dosen. Berikut peta keselarasan capaian (<em>constructive alignment</em>) untuk pertemuan 1:</p>
          <table class="dtable">
            <thead><tr><th style="width:60px">No</th><th>Indikator Capaian (Outcome yang Diukur)</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>Mahasiswa dapat menyimpulkan definisi basis data dengan kata-kata sendiri.</td></tr>
              <tr><td>2</td><td>Mahasiswa dapat menceritakan sejarah dan evolusi sistem basis data.</td></tr>
              <tr><td>3</td><td>Mahasiswa dapat menyebutkan komponen penyusun sistem basis data.</td></tr>
              <tr><td>4</td><td>Mahasiswa dapat menunjukkan arsitektur basis data (<em>three-schema architecture</em>).</td></tr>
              <tr><td>5</td><td>Mahasiswa dapat menyebutkan berbagai model basis data (DBMS) beserta contoh penerapannya.</td></tr>
            </tbody>
          </table>
          <div class="chipRow">
            <span class="chip">KRITERIA · Partisipasi &amp; ketepatan menjawab kuis reflektif</span>
            <span class="chip">BENTUK · Non-tes (refleksi capaian belajar)</span>
            <span class="chip chip--amber">BOBOT · 1%</span>
          </div>`,
      },
      {
        heading: "C. Peta Konsep Pertemuan",
        html: `
          <p>Materi pertemuan 1 mencakup lima pokok bahasan yang saling berkaitan, sebagai fondasi sebelum mahasiswa masuk ke perancangan basis data (ERD) pada pertemuan berikutnya:</p>
          <ol class="steps">
            <li>Definisi dan konsep dasar basis data</li>
            <li>Sejarah dan evolusi sistem basis data</li>
            <li>Komponen penyusun sistem basis data</li>
            <li>Arsitektur basis data (<em>three-schema architecture</em>)</li>
            <li>Model-model DBMS dan contoh penerapannya di dunia nyata</li>
          </ol>`,
      },
      {
        heading: "D. Kegiatan Pembelajaran (Alur OBE)",
        html: `
          <h4>1. Pendahuluan <span class="muted">(± 20 menit)</span></h4>
          <ul>
            <li>Dosen menyampaikan kontrak pembelajaran OBE: capaian akhir (CPMK), tahapan proyek basis data yang akan dibangun mahasiswa sepanjang 16 minggu, serta rubrik penilaian.</li>
            <li>Apersepsi: mahasiswa diajak mengingat aplikasi yang mereka pakai sehari-hari (media sosial, e-commerce, m-banking) sebagai pemantik diskusi "di mana data-data itu tersimpan?".</li>
          </ul>
          <h4>2. Kegiatan Inti <span class="muted">(± 100 menit)</span></h4>
          <ul>
            <li>Ceramah interaktif (<em>Contextual Teaching Learning</em>) tentang definisi, sejarah, komponen, arsitektur, dan model basis data (lihat bagian E).</li>
            <li>Diskusi kelompok kecil membahas studi kasus aplikasi e-commerce (bagian F).</li>
            <li>Eksplorasi mandiri via smartphone/laptop mengamati contoh basis data nyata secara online (bagian G).</li>
          </ul>
          <h4>3. Penutup <span class="muted">(± 30 menit)</span></h4>
          <ul>
            <li>Refleksi capaian belajar: mahasiswa menuliskan satu kalimat kesimpulan pribadi tentang "apa itu basis data".</li>
            <li>Kuis awal formatif via smartphone (Google Form/Quizizz) sebagai OBE outcome check (lihat bagian H).</li>
            <li>Dosen menyampaikan gambaran pertemuan berikutnya (perancangan ERD).</li>
          </ul>`,
      },
      {
        heading: "E.1 Definisi dan Konsep Dasar Basis Data",
        html: `
          <p>Basis data (<em>database</em>) adalah kumpulan data yang saling berkaitan dan terorganisasi secara sistematis, dikelola menggunakan perangkat lunak yang disebut <strong>Database Management System (DBMS)</strong>, sehingga dapat diakses, dimanipulasi, dan dipelihara secara efisien oleh banyak pengguna sekaligus. Konsep ini merujuk pada definisi baku dalam Elmasri &amp; Navathe (2016), yang menekankan bahwa basis data merepresentasikan aspek-aspek dari dunia nyata (<em>mini-world</em>) yang relevan bagi suatu organisasi.</p>
          <p>Beberapa istilah kunci yang perlu dipahami mahasiswa:</p>
          <ul>
            <li><strong>Data</strong> — fakta mentah yang belum diolah (mis. angka, teks, tanggal).</li>
            <li><strong>Basis Data (Database)</strong> — kumpulan data yang terorganisasi dan saling berelasi.</li>
            <li><strong>DBMS (Database Management System)</strong> — perangkat lunak untuk mendefinisikan, membuat, memelihara, dan mengendalikan akses ke basis data (contoh: MySQL, PostgreSQL, SQLite, Oracle, Microsoft SQL Server).</li>
            <li><strong>Sistem Basis Data (Database System)</strong> — gabungan basis data dan DBMS beserta aplikasi yang terkait dengannya.</li>
          </ul>
          <div class="callout">
            <span class="callout__label">Ilustrasi sederhana</span>
            <p>Buku telepon manual berisi ratusan nomor kontak adalah kumpulan data. Jika buku itu dikelola dengan aplikasi kontak di smartphone yang memungkinkan pencarian, penyortiran, dan sinkronisasi otomatis, maka aplikasi tersebut berperan sebagai DBMS sederhana yang mengelola "basis data kontak" pengguna.</p>
          </div>

          <h4>Jenis-Jenis Basis Data dalam Kehidupan Sehari-hari</h4>
          <p>Berikut berbagai jenis basis data yang mungkin sudah Anda gunakan tanpa sadar:</p>
          <table class="dtable">
            <thead><tr><th>Jenis</th><th>Cara Kerja</th><th>Contoh Nyata</th></tr></thead>
            <tbody>
              <tr><td><strong>Basis Data Relasional</strong></td><td>Data disusun dalam tabel (baris &amp; kolom) dengan hubungan antar tabel melalui key.</td><td>SIAKAD kampus, sistem perbankan, aplikasi e-commerce.</td></tr>
              <tr><td><strong>Basis Data Kolom</strong></td><td>Menyimpan data dalam kolom terpisah, optimal untuk analisis data waktu nyata.</td><td>Instagram (analisis popularitas postingan), sistem monitoring IoT.</td></tr>
              <tr><td><strong>Basis Data Graf</strong></td><td>Data disimpan sebagai node dan edge, memodelkan hubungan kompleks.</td><td>LinkedIn (rekomendasi koneksi), Google Maps (rute navigasi).</td></tr>
              <tr><td><strong>Basis Data Dokumen</strong></td><td>Data disimpan dalam format dokumen (JSON/BSON), fleksibel tanpa skema ketat.</td><td>WhatsApp (riwayat chat), MongoDB untuk aplikasi web modern.</td></tr>
              <tr><td><strong>Basis Data Kunci-Nilai</strong></td><td>Penyimpanan sederhana berpasangan kunci dan nilai, sangat cepat untuk akses data.</td><td>Session management di website, caching Redis.</td></tr>
            </tbody>
          </table>
          <div class="callout callout--amber">
            <span class="callout__label">Catatan Penting</span>
            <p>Meskipun ada berbagai jenis basis data, <strong>model relasional (RDBMS)</strong> tetap menjadi yang paling banyak digunakan di dunia industri karena keandalannya dalam menjaga konsistensi data transaksional (ACID). Itulah sebabnya mata kuliah ini berfokus pada RDBMS.</p>
          </div>`,
      },
      {
        heading: "E.2 Sejarah dan Evolusi Sistem Basis Data",
        html: `
          <p>Perkembangan basis data berjalan seiring kebutuhan pengelolaan data yang makin kompleks. Ringkasan evolusinya:</p>
          <table class="dtable">
            <thead><tr><th style="width:140px">Periode</th><th>Perkembangan</th></tr></thead>
            <tbody>
              <tr><td>1960-an</td><td>Sistem berbasis file (<em>file-based system</em>): setiap aplikasi punya file data sendiri, menyebabkan duplikasi dan inkonsistensi data.</td></tr>
              <tr><td>1966–1970</td><td>Model basis data awal — <em>Hierarchical</em> (mis. IBM IMS) dan <em>Network Model</em> (standar CODASYL/DBTG) mulai digunakan pada sistem mainframe perusahaan besar.</td></tr>
              <tr><td>1970</td><td>Edgar F. Codd (IBM) memperkenalkan model data relasional dalam makalah akademiknya, yang menjadi fondasi DBMS modern.</td></tr>
              <tr><td>1970-an–1980-an</td><td>Lahirnya bahasa SQL (<em>Structured Query Language</em>) di IBM, serta produk DBMS relasional awal seperti System R dan Oracle.</td></tr>
              <tr><td>1990-an</td><td>Perkembangan basis data berorientasi objek (<em>Object-Oriented Database</em>) dan <em>data warehouse</em> untuk kebutuhan analisis bisnis.</td></tr>
              <tr><td>2000-an–sekarang</td><td>Era <em>big data</em> melahirkan basis data NoSQL (MongoDB, Cassandra, Firebase) untuk data tidak terstruktur &amp; skala besar, berdampingan dengan RDBMS (MySQL, PostgreSQL) yang tetap dominan pada sistem transaksional.</td></tr>
            </tbody>
          </table>`,
      },
      {
        heading: "E.3 Komponen Penyusun Sistem Basis Data",
        html: `
          <p>Sebuah sistem basis data tidak hanya terdiri dari data, tetapi merupakan gabungan beberapa komponen yang saling mendukung:</p>
          <div class="diagram-container">
            <div class="diagram-zoom-controls">
              <button class="zoom-btn zoom-out">−</button>
              <span class="zoom-btn zoom-level" style="background:#EEF2F5;color:#3A4A63;cursor:default;">100%</span>
              <button class="zoom-btn zoom-in">+</button>
              <button class="zoom-btn zoom-reset">Reset</button>
            </div>
            <div class="diagram-wrapper">
              <div class="diagram-inner">
                <svg viewBox="0 0 640 420" role="img" aria-label="Diagram komponen sistem basis data" style="width:560px;">
                  <g font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700">
                <rect x="30" y="30" width="230" height="90" rx="10" fill="#E7F0F1" stroke="#2BA6A0" stroke-width="2"/>
                <text x="145" y="60" text-anchor="middle" fill="#0D1B30">DATA</text>
                <text x="145" y="80" text-anchor="middle" font-weight="400" font-size="10.5" fill="#3A4A63">Basis data terintegrasi</text>
                <text x="145" y="94" text-anchor="middle" font-weight="400" font-size="10.5" fill="#3A4A63">&amp; dapat dipakai bersama</text>

                <rect x="380" y="30" width="230" height="90" rx="10" fill="#FBEFDC" stroke="#E7A83D" stroke-width="2"/>
                <text x="495" y="60" text-anchor="middle" fill="#0D1B30">HARDWARE</text>
                <text x="495" y="80" text-anchor="middle" font-weight="400" font-size="10.5" fill="#3A4A63">Server, storage, jaringan,</text>
                <text x="495" y="94" text-anchor="middle" font-weight="400" font-size="10.5" fill="#3A4A63">smartphone / laptop</text>

                <circle cx="320" cy="210" r="72" fill="#16294A"/>
                <text x="320" y="216" text-anchor="middle" fill="#F1F4F6" font-size="20">DBMS</text>

                <rect x="20" y="300" width="210" height="90" rx="10" fill="#E9F3E9" stroke="#4C8F5A" stroke-width="2"/>
                <text x="125" y="330" text-anchor="middle" fill="#0D1B30">SOFTWARE</text>
                <text x="125" y="350" text-anchor="middle" font-weight="400" font-size="10.5" fill="#3A4A63">DBMS + aplikasi</text>
                <text x="125" y="364" text-anchor="middle" font-weight="400" font-size="10.5" fill="#3A4A63">(mis. MySQL, phpMyAdmin)</text>

                <rect x="243" y="300" width="154" height="90" rx="10" fill="#ECEAF6" stroke="#7A6FC9" stroke-width="2"/>
                <text x="320" y="330" text-anchor="middle" fill="#0D1B30" font-size="11">PENGGUNA</text>
                <text x="320" y="350" text-anchor="middle" font-weight="400" font-size="10" fill="#3A4A63">DBA, programmer,</text>
                <text x="320" y="364" text-anchor="middle" font-weight="400" font-size="10" fill="#3A4A63">end-user</text>

                <rect x="410" y="300" width="210" height="90" rx="10" fill="#FDEAEA" stroke="#C9584F" stroke-width="2"/>
                <text x="515" y="330" text-anchor="middle" fill="#0D1B30">PROSEDUR</text>
                <text x="515" y="350" text-anchor="middle" font-weight="400" font-size="10.5" fill="#3A4A63">SOP backup, akses,</text>
                <text x="515" y="364" text-anchor="middle" font-weight="400" font-size="10.5" fill="#3A4A63">keamanan data</text>

                <g stroke="#9AA7BB" stroke-width="1.6" fill="none">
                  <line x1="270" y1="160" x2="145" y2="120"/>
                  <line x1="370" y1="160" x2="495" y2="120"/>
                  <line x1="270" y1="260" x2="125" y2="300"/>
                  <line x1="300" y1="278" x2="320" y2="300"/>
                  <line x1="370" y1="260" x2="515" y2="300"/>
                </g>
              </g>
            </svg>
              </div>
            </div>
            <p class="diagram-source">Sumber konsep: Elmasri &amp; Navathe (2016), Bab 1 — Databases and Database Users; diagram digambar ulang untuk keperluan pembelajaran.</p>
          </div>
          <ul>
            <li><strong>Data</strong> — inti dari sistem, harus terintegrasi (tidak terpisah-pisah per aplikasi) dan dapat dipakai bersama (<em>shared</em>).</li>
            <li><strong>Hardware</strong> — perangkat fisik penyimpan dan pemroses data: server, storage, jaringan, hingga smartphone/laptop yang digunakan mahasiswa untuk mengakses basis data.</li>
            <li><strong>Software</strong> — DBMS itu sendiri beserta aplikasi pendukung (mis. phpMyAdmin, MySQL Workbench, aplikasi mobile client).</li>
            <li><strong>Prosedur</strong> — aturan dan SOP dalam mengelola basis data: backup rutin, kontrol akses, penanganan kegagalan sistem.</li>
            <li><strong>Pengguna (Users)</strong> — pihak yang berinteraksi dengan basis data: Database Administrator (DBA), programmer aplikasi, dan end-user (pengguna akhir).</li>
          </ul>

          <h4>Latihan: Klasifikasi Komponen Sistem</h4>
          <div class="interactive-card">
            <p>Identifikasi komponen sistem basis data yang sesuai dengan pernyataan teknis berikut.</p>
            <div class="sim-box" style="background:#FBEFDC; border-color:#E7A83D;">
              <p id="gameQuestion" style="font-weight:600; margin:0 0 12px; font-size:15px;">Klik "Mulai Evaluasi" untuk memulai.</p>
            </div>
            <div id="gameButtons" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;">
              <button class="btn-sim comp-btn" data-comp="DATA">DATA</button>
              <button class="btn-sim comp-btn" data-comp="HARDWARE">HARDWARE</button>
              <button class="btn-sim comp-btn" data-comp="SOFTWARE">SOFTWARE</button>
              <button class="btn-sim comp-btn" data-comp="PROSEDUR">PROSEDUR</button>
              <button class="btn-sim comp-btn" data-comp="PENGGUNA">PENGGUNA</button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px;">
              <span class="muted">Kemajuan: <strong id="gameScore" style="color:#0D1B30;">0</strong>/<span id="gameTotal">0</span></span>
              <button class="btn-sim" id="gameStart" style="background:#2BA6A0;">Mulai Evaluasi</button>
            </div>
            <div id="gameFeedback" style="margin-top:10px; font-weight:600;"></div>
          </div>`,
      },
      {
        heading: "E.4 Arsitektur Basis Data (Three-Schema Architecture)",
        html: `
          <p>Untuk memisahkan kepentingan pengguna dari detail teknis penyimpanan, ANSI-SPARC (<em>American National Standards Institute – Standards Planning and Requirements Committee</em>) mengusulkan arsitektur tiga lapis (<em>three-schema architecture</em>) yang menjadi standar rujukan dalam perancangan DBMS modern:</p>
          <div class="diagram-container">
            <div class="diagram-zoom-controls">
              <button class="zoom-btn zoom-out">−</button>
              <span class="zoom-btn zoom-level" style="background:#EEF2F5;color:#3A4A63;cursor:default;">100%</span>
              <button class="zoom-btn zoom-in">+</button>
              <button class="zoom-btn zoom-reset">Reset</button>
            </div>
            <div class="diagram-wrapper">
              <div class="diagram-inner">
                <svg viewBox="0 0 640 330" role="img" aria-label="Diagram arsitektur three-schema" style="width:560px;">
                  <g font-family="'JetBrains Mono', monospace">
                <rect x="40" y="20" width="560" height="80" rx="10" fill="#FBEFDC" stroke="#E7A83D" stroke-width="2"/>
                <text x="320" y="50" text-anchor="middle" font-size="13" font-weight="700" fill="#0D1B30">EXTERNAL LEVEL</text>
                <text x="320" y="70" text-anchor="middle" font-size="10.5" font-weight="400" fill="#3A4A63">View mahasiswa · view dosen · view admin akademik</text>
                <text x="320" y="86" text-anchor="middle" font-size="10.5" font-weight="400" fill="#3A4A63">setiap pengguna melihat data sesuai kebutuhannya</text>

                <rect x="40" y="125" width="560" height="80" rx="10" fill="#E7F0F1" stroke="#2BA6A0" stroke-width="2"/>
                <text x="320" y="155" text-anchor="middle" font-size="13" font-weight="700" fill="#0D1B30">CONCEPTUAL LEVEL</text>
                <text x="320" y="175" text-anchor="middle" font-size="10.5" font-weight="400" fill="#3A4A63">Skema logis: entitas, atribut, relasi, constraint</text>
                <text x="320" y="191" text-anchor="middle" font-size="10.5" font-weight="400" fill="#3A4A63">tanpa detail fisik penyimpanan</text>

                <rect x="40" y="230" width="560" height="80" rx="10" fill="#E9F3E9" stroke="#4C8F5A" stroke-width="2"/>
                <text x="320" y="260" text-anchor="middle" font-size="13" font-weight="700" fill="#0D1B30">INTERNAL LEVEL</text>
                <text x="320" y="280" text-anchor="middle" font-size="10.5" font-weight="400" fill="#3A4A63">Struktur penyimpanan fisik: index, file, blok data</text>
                <text x="320" y="296" text-anchor="middle" font-size="10.5" font-weight="400" fill="#3A4A63">pada storage / disk</text>

                <g stroke="#16294A" stroke-width="2.4" fill="none" marker-end="url(#arrow)">
                  <line x1="320" y1="100" x2="320" y2="122"/>
                  <line x1="320" y1="205" x2="320" y2="227"/>
                </g>
                <defs>
                  <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                    <path d="M0,0 L10,5 L0,10 Z" fill="#16294A"/>
                  </marker>
                </defs>
              </g>
            </svg>
              </div>
            </div>
            <p class="diagram-source">Sumber konsep: Elmasri &amp; Navathe (2016), Bab 2 — Database System Concepts and Architecture; diagram digambar ulang.</p>
          </div>
          <ul>
            <li><strong>External Level</strong> — level pandangan pengguna (<em>user view</em>). Setiap kelompok pengguna dapat melihat bagian data yang relevan saja. Contoh: mahasiswa hanya melihat nilai dan jadwalnya sendiri di aplikasi akademik, sedangkan admin akademik melihat data seluruh mahasiswa.</li>
            <li><strong>Conceptual Level</strong> — level skema logis keseluruhan basis data (entitas, atribut, relasi, aturan/<em>constraint</em>) tanpa memedulikan bagaimana data disimpan secara fisik.</li>
            <li><strong>Internal Level</strong> — level fisik: bagaimana data benar-benar disimpan di storage/disk, termasuk struktur indeks untuk mempercepat pencarian.</li>
          </ul>
          <p>Fungsi utama arsitektur ini adalah menjaga <strong>data independence</strong> — perubahan pada level internal (mis. optimasi penyimpanan) tidak memengaruhi level eksternal (aplikasi/pengguna), dan sebaliknya.</p>
          
          <h4>Simulasi Interaktif: Three-Schema dalam Aksi</h4>
          <div class="interactive-card">
            <p><strong>Bayangkan seorang mahasiswa membuka aplikasi SIAKAD untuk melihat nilai:</strong></p>
            <div class="sim-box">
              <p style="margin-top:0;"><strong style="color:#0D1B30;">🔹 EXTERNAL LEVEL (Pandangan Mahasiswa)</strong></p>
              <table class="dtable" style="margin:10px 0; font-size:12px;">
                <tbody>
                  <tr><td><strong>ID Mahasiswa</strong></td><td>22104567</td></tr>
                  <tr><td><strong>Nama</strong></td><td>Budi Santoso</td></tr>
                  <tr><td><strong>Nilai Basis Data</strong></td><td>85</td></tr>
                </tbody>
              </table>
            </div>
            <div class="sim-box" style="margin-top:10px;">
              <p style="margin-top:0;"><strong style="color:#0D1B30;">🔹 CONCEPTUAL LEVEL (Logika Database)</strong></p>
              <p style="margin:8px 0; font-size:13px;">Entitas: Mahasiswa [id, nama, email] — Matakuliah [id, nama] — Nilai [id_mhs, id_mk, nilai]</p>
              <p style="margin:8px 0; font-size:13px; color:#666;">Relasi: Mahasiswa dapat memiliki banyak Nilai, Matakuliah dapat memiliki banyak Nilai (M:N)</p>
            </div>
            <div class="sim-box" style="margin-top:10px;">
              <p style="margin-top:0;"><strong style="color:#0D1B30;">🔹 INTERNAL LEVEL (Penyimpanan Fisik)</strong></p>
              <p style="margin:8px 0; font-size:12px; font-family:var(--font-mono);">File: mhs_tbl.dat | Index: idx_mhs_id.ndx | Blocks: [...]</p>
              <p style="margin:8px 0; font-size:11px; color:#666;">DBMS menggunakan index untuk mencari data mahasiswa 22104567 secara cepat (dalam milliseconds) di storage disk.</p>
            </div>
          </div>`,
      },
      {
        heading: "E.5 Model-Model DBMS dan Penerapannya",
        html: `
          <p>DBMS dikembangkan dengan beberapa model data yang berbeda, sesuai kebutuhan pengelolaan datanya. Tabel berikut merangkum model utama beserta contoh penerapan nyata yang mudah dikenali mahasiswa:</p>
          <table class="dtable">
            <thead><tr><th>Model Basis Data</th><th>Karakteristik Singkat</th><th>Contoh Penerapan Nyata</th></tr></thead>
            <tbody>
              <tr><td><strong>Hierarchical</strong></td><td>Data disusun seperti pohon (parent-child), satu induk banyak anak.</td><td>Sistem file Windows/Linux, struktur organisasi perusahaan (lama, IBM IMS).</td></tr>
              <tr><td><strong>Network</strong></td><td>Mirip hierarchical, tetapi satu anak bisa punya banyak induk (graf).</td><td>Sistem reservasi penerbangan generasi awal (mis. Sabre).</td></tr>
              <tr><td><strong>Relational (RDBMS)</strong></td><td>Data disimpan dalam tabel (baris &amp; kolom) yang saling berelasi melalui key.</td><td>Sistem akademik kampus (SIAKAD), aplikasi perbankan, MySQL/PostgreSQL/Oracle.</td></tr>
              <tr><td><strong>Object-Oriented</strong></td><td>Data disimpan sebagai objek, mendukung tipe data kompleks.</td><td>Aplikasi CAD/CAM, sistem multimedia kompleks.</td></tr>
              <tr><td><strong>NoSQL (Document/Key-Value)</strong></td><td>Skema fleksibel, cocok untuk data tidak terstruktur &amp; skala besar.</td><td>Media sosial (Instagram, TikTok), aplikasi chat (WhatsApp), MongoDB, Firebase.</td></tr>
            </tbody>
          </table>
          <div class="callout callout--amber">
            <span class="callout__label">Catatan penting</span>
            <p>Mata kuliah ini berfokus pada model <strong>Relasional (RDBMS)</strong>, karena masih menjadi model paling banyak digunakan pada sistem informasi transaksional (akademik, keuangan, kepegawaian) dan menjadi dasar sebelum mempelajari model lain seperti NoSQL.</p>
          </div>

          <h4>🔄 Simulasi Interaktif: Hierarchical vs Relational</h4>
          <div class="interactive-card">
            <p>Pilih model data untuk membandingkan struktur penyimpanan:</p>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
              <button class="btn-sim model-btn" data-model="hier" style="background:#E7A83D;">Model Hierarchical</button>
              <button class="btn-sim model-btn" data-model="rel" style="background:#2BA6A0;">Model Relational</button>
            </div>
            <div class="sim-box" id="modelHier" style="display:none;">
              <p style="margin-top:0;"><strong>Struktur Pohon (Parent → Child):</strong></p>
              <svg viewBox="0 0 500 220" style="width:100%; max-width:420px;">
                <g font-family="'JetBrains Mono', monospace" font-size="11">
                  <rect x="190" y="10" width="120" height="36" rx="8" fill="#16294A"/>
                  <text x="250" y="33" text-anchor="middle" fill="#fff">FAKULTAS</text>
                  <rect x="60" y="90" width="120" height="36" rx="8" fill="#2BA6A0"/>
                  <text x="120" y="113" text-anchor="middle" fill="#03211D">Prodi Informatika</text>
                  <rect x="320" y="90" width="120" height="36" rx="8" fill="#2BA6A0"/>
                  <text x="380" y="113" text-anchor="middle" fill="#03211D">Prodi Sipil</text>
                  <rect x="20" y="170" width="110" height="34" rx="8" fill="#FBEFDC" stroke="#E7A83D"/>
                  <text x="75" y="192" text-anchor="middle" fill="#0D1B30">Mhs: Budi</text>
                  <rect x="150" y="170" width="110" height="34" rx="8" fill="#FBEFDC" stroke="#E7A83D"/>
                  <text x="205" y="192" text-anchor="middle" fill="#0D1B30">Mhs: Sari</text>
                  <rect x="300" y="170" width="110" height="34" rx="8" fill="#FBEFDC" stroke="#E7A83D"/>
                  <text x="355" y="192" text-anchor="middle" fill="#0D1B30">Mhs: Andi</text>
                  <g stroke="#9AA7BB" stroke-width="1.6">
                    <line x1="230" y1="46" x2="130" y2="88"/><line x1="270" y1="46" x2="370" y2="88"/>
                    <line x1="100" y1="126" x2="70" y2="168"/><line x1="140" y1="126" x2="200" y2="168"/>
                    <line x1="390" y1="126" x2="360" y2="168"/>
                  </g>
                </g>
              </svg>
              <p style="font-size:13px;">⚠️ <em>Keterbatasan:</em> Data mahasiswa hanya bisa "menggantung" di satu prodi. Jika Budi mengambil kuliah lintas prodi, struktur pohon harus diduplikasi → duplikasi data!</p>
            </div>
            <div class="sim-box" id="modelRel" style="display:none;">
              <p style="margin-top:0;"><strong>Tabel-Tabel yang Berelasi via Key:</strong></p>
              <table class="dtable" style="font-size:12px;">
                <thead><tr><th>Mahasiswa</th><th>Prodi</th><th>Nilai</th></tr></thead>
                <tbody>
                  <tr><td>Budi →<code>prodi_id=1</code></td><td><code>id=1</code> Informatika</td><td>Budi, Basis Data, A</td></tr>
                  <tr><td>Sari →<code>prodi_id=1</code></td><td><code>id=1</code> Informatika</td><td>Sari, Basis Data, A-</td></tr>
                  <tr><td>Andi →<code>prodi_id=2</code></td><td><code>id=2</code> Sipil</td><td>Andi, Basis Data, B+ ← lintas prodi!</td></tr>
                </tbody>
              </table>
              <p style="font-size:13px;">✅ <em>Keunggulan:</em> Andi dari prodi Sipil bisa ikut mata kuliah Basis Data milik Informatika tanpa duplikasi — cukup relasi via key.</p>
            </div>
          </div>`,
      },
      {
        heading: "E.6 Latihan: Pencocokan Konsep Database",
        html: `
          <p>Cocokkan istilah database dengan definisi yang benar. Klik pasangan yang sesuai untuk menguji pemahaman Anda!</p>
          <div class="interactive-card">
            <p><strong>Pencocokan Istilah</strong></p>
            <p class="muted">Klik istilah di sebelah kiri, lalu klik definisi yang cocok di sebelah kanan.</p>
            <div id="matchGame" style="display:flex; gap:20px; margin-top:15px; flex-wrap:wrap;">
              <div id="matchTerms" style="flex:1; min-width:180px;">
                <p style="font-weight:600; margin-bottom:8px;">Istilah</p>
              </div>
              <div id="matchDefs" style="flex:1.5; min-width:240px;">
                <p style="font-weight:600; margin-bottom:8px;">Definisi</p>
              </div>
            </div>
            <div id="matchFeedback" style="margin-top:15px; font-weight:600; min-height:24px;"></div>
            <button class="btn-sim" id="matchReset" style="background:#E7A83D; margin-top:10px;">Ulangi</button>
          </div>`,
      },
      {
        heading: "F. Studi Kasus Nyata: Basis Data pada Aplikasi E-Commerce",
        html: `
          <p>Untuk mengaitkan konsep dengan pengalaman sehari-hari, perhatikan bagaimana aplikasi e-commerce (seperti yang biasa digunakan mahasiswa untuk berbelanja daring) menyimpan datanya. Setiap kali pengguna membuka aplikasi di smartphone, aplikasi tersebut sesungguhnya sedang mengakses basis data relasional di server melalui internet. Berikut gambaran sederhana entitas/tabel yang terlibat:</p>
          <table class="dtable">
            <thead><tr><th>Entitas / Tabel</th><th>Contoh Atribut (Kolom)</th><th>Fungsi dalam Aplikasi</th></tr></thead>
            <tbody>
              <tr><td><strong>Pelanggan (Customer)</strong></td><td><code>id_pelanggan, nama, email, no_hp, alamat</code></td><td>Menyimpan data akun pengguna yang login lewat aplikasi mobile/web.</td></tr>
              <tr><td><strong>Produk (Product)</strong></td><td><code>id_produk, nama_produk, harga, stok, kategori</code></td><td>Menampilkan katalog produk yang bisa dicari &amp; difilter pengguna.</td></tr>
              <tr><td><strong>Pesanan (Order)</strong></td><td><code>id_pesanan, id_pelanggan, tanggal, status, total_bayar</code></td><td>Mencatat transaksi setiap kali pengguna melakukan checkout.</td></tr>
              <tr><td><strong>Detail Pesanan (Order_Detail)</strong></td><td><code>id_pesanan, id_produk, jumlah, subtotal</code></td><td>Menghubungkan pesanan dengan produk yang dibeli (relasi many-to-many).</td></tr>
            </tbody>
          </table>
          <div class="callout">
            <span class="callout__label">Diskusi kelompok (3–4 mahasiswa)</span>
            <p>"Ketika Anda menekan tombol <em>checkout</em> di aplikasi belanja daring, tabel mana saja yang menurut Anda ikut 'bekerja' di baliknya, dan mengapa data pelanggan serta data produk perlu dipisah ke tabel berbeda, bukan digabung dalam satu tabel besar?" Diskusi ini menjadi pemantik awal menuju topik relasi antar-tabel yang akan dipelajari pada pertemuan-pertemuan berikutnya (ERD dan normalisasi).</p>
          </div>`,
      },
      {
        heading: "F.2 Studi Kasus: Basis Data Media Sosial",
        html: `
          <p>Selain e-commerce, media sosial juga sangat bergantung pada basis data untuk menyimpan dan mengelola jutaan data pengguna setiap detik. Perhatikan bagaimana sebuah platform media sosial (seperti Instagram atau TikTok) mengelola datanya:</p>
          <table class="dtable">
            <thead><tr><th>Entitas / Tabel</th><th>Contoh Atribut (Kolom)</th><th>Fungsi dalam Aplikasi</th></tr></thead>
            <tbody>
              <tr><td><strong>Pengguna (User)</strong></td><td><code>user_id, username, email, password_hash, bio, created_at</code></td><td>Menyimpan data akun pengguna yang terdaftar.</td></tr>
              <tr><td><strong>Postingan (Post)</strong></td><td><code>post_id, user_id, caption, media_url, location, posted_at</code></td><td>Mencatat setiap konten yang dibagikan pengguna.</td></tr>
              <tr><td><strong>Komentar (Comment)</strong></td><td><code>comment_id, post_id, user_id, text, commented_at</code></td><td>Menyimpan respons pengguna terhadap postingan.</td></tr>
              <tr><td><strong>Likes</strong></td><td><code>like_id, post_id, user_id, liked_at</code></td><td>Mencatat siapa saja yang menyukai sebuah postingan.</td></tr>
              <tr><td><strong>Follower</strong></td><td><code>follower_id, user_id, following_id, followed_at</code></td><td>Mengelola hubungan pertemanan/pengikut antar pengguna.</td></tr>
            </tbody>
          </table>
          <div class="callout">
            <span class="callout__label">Diskusi Cepat</span>
            <p>Jika Anda menekan tombol "Like" pada sebuah postingan di Instagram, tabel <strong>Likes</strong> akan menambah satu baris data baru. Pertanyaan: Apa yang terjadi pada kolom <code>liked_at</code> (waktu suka) dan mengapa kolom ini penting untuk disimpan?</p>
          </div>
          <div class="callout callout--amber">
            <span class="callout__label">Pembanding</span>
            <p>Perbedaan mendasar basis data e-commerce dengan media sosial: <strong>E-commerce</strong> berfokus pada data transaksi (pesanan, pembayaran) yang membutuhkan integritas tinggi (ACID), sedangkan <strong>media sosial</strong> berfokus pada data interaksi (likes, komentar, share) yang membutuhkan skalabilitas tinggi untuk jutaan pengguna aktif bersamaan.</p>
          </div>`,
      },
      {
        heading: "G. Simulasi Interaktif: Database Explorer",
        html: `
          <p>Coba simulasi pencarian data pada tabel "Produk" di bawah ini. Bayangkan ini adalah apa yang terjadi di balik layar aplikasi e-commerce saat Anda mengetik di kolom pencarian.</p>
          <div class="interactive-card">
            <input type="text" id="simSearch" placeholder="Cari nama produk atau kategori..." style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--line); margin-bottom:15px; font-family:var(--font-body);">
            <div class="sim-table-res">
              <table class="dtable" id="simTable">
                <thead>
                  <tr><th>ID</th><th>Nama Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th></tr>
                </thead>
                <tbody>
                  <tr><td>P01</td><td>Smartphone X Pro</td><td>Gadget</td><td>Rp 5.000.000</td><td>25</td></tr>
                  <tr><td>P02</td><td>Laptop Ultra 14</td><td>Gadget</td><td>Rp 12.000.000</td><td>10</td></tr>
                  <tr><td>P03</td><td>Kopi Arabika 250g</td><td>Food</td><td>Rp 65.000</td><td>200</td></tr>
                  <tr><td>P04</td><td>Mouse Wireless</td><td>Aksesoris</td><td>Rp 150.000</td><td>50</td></tr>
                  <tr><td>P05</td><td>Keyboard Mekanik</td><td>Aksesoris</td><td>Rp 450.000</td><td>30</td></tr>
                  <tr><td>P06</td><td>Headphone Bluetooth</td><td>Aksesoris</td><td>Rp 350.000</td><td>40</td></tr>
                  <tr><td>P07</td><td>Power Bank 20000mAh</td><td>Gadget</td><td>Rp 280.000</td><td>60</td></tr>
                  <tr><td>P08</td><td>Tumbler Stainless 500ml</td><td>Food</td><td>Rp 85.000</td><td>120</td></tr>
                </tbody>
              </table>
            </div>
            <p class="muted" style="margin-top:10px;">* Ketikkan kata kunci seperti "Gadget", "Aksesoris", atau "Kopi" untuk melihat bagaimana DBMS memfilter data secara instan.</p>
            <div class="callout" style="margin-top:15px;">
              <span class="callout__label">Yang Terjadi di Balik Layar</span>
              <p>Ketika Anda mengetik "Gadget", DBMS menjalankan perintah SQL: <code>SELECT * FROM produk WHERE kategori = 'Gadget'</code>. Proses ini disebut <strong>query</strong> — instruksi untuk mengambil data dari basis data sesuai kriteria tertentu.</p>
            </div>
          </div>`,
      },
      {
        heading: "H. Kuis Interaktif (Refleksi Cepat)",
        html: `
          <p>Uji pemahaman Anda tentang konsep dasar yang baru saja dipelajari:</p>
          
          <div class="interactive-card">
            <p><strong>1. Manakah dari berikut ini yang merupakan contoh DBMS?</strong></p>
            <button class="quiz-option" data-correct="false">Microsoft Excel</button>
            <button class="quiz-option" data-correct="true" data-explanation="PostgreSQL adalah salah satu sistem manajemen basis data relasional (RDBMS) yang populer.">PostgreSQL</button>
            <button class="quiz-option" data-correct="false">Google Chrome</button>
            <div class="quiz-feedback" style="margin-top:10px; font-weight:600;"></div>
          </div>

          <div class="interactive-card">
            <p><strong>2. Arsitektur yang memisahkan pandangan pengguna dengan penyimpanan fisik disebut...</strong></p>
            <button class="quiz-option" data-correct="true" data-explanation="Three-Schema Architecture (ANSI-SPARC) membagi database menjadi External, Conceptual, dan Internal level.">Three-Schema Architecture</button>
            <button class="quiz-option" data-correct="false">Client-Server Architecture</button>
            <button class="quiz-option" data-correct="false">Single-Tier Architecture</button>
            <div class="quiz-feedback" style="margin-top:10px; font-weight:600;"></div>
          </div>

          <div class="interactive-card">
            <p><strong>3. Manakah yang merupakan keunggulan utama basis data dibandingkan sistem berbasis file?</strong></p>
            <button class="quiz-option" data-correct="false">Lebih mudah diakses tanpa software khusus</button>
            <button class="quiz-option" data-correct="false">Tidak membutuhkan hardware khusus</button>
            <button class="quiz-option" data-correct="true" data-explanation="Basis data mengurangi duplikasi data (redundansi) dan menjaga konsistensi data melalui mekanisme terpusat yang dikelola DBMS.">Mengurangi redundansi data dan menjaga konsistensi</button>
            <div class="quiz-feedback" style="margin-top:10px; font-weight:600;"></div>
          </div>

          <div class="interactive-card">
            <p><strong>4. Komponen sistem basis data yang bertanggung jawab atas backup rutin dan kontrol akses adalah...</strong></p>
            <button class="quiz-option" data-correct="false">Hardware</button>
            <button class="quiz-option" data-correct="true" data-explanation="Prosedur mencakup SOP dan aturan dalam mengelola basis data, termasuk backup rutin dan kontrol akses keamanan data.">Prosedur</button>
            <button class="quiz-option" data-correct="false">Data</button>
            <button class="quiz-option" data-correct="false">Software</button>
            <div class="quiz-feedback" style="margin-top:10px; font-weight:600;"></div>
          </div>

          <div class="interactive-card">
            <p><strong>5. Model basis data yang paling cocok untuk data tidak terstruktur dengan skala besar (big data) adalah...</strong></p>
            <button class="quiz-option" data-correct="false">Relational (RDBMS)</button>
            <button class="quiz-option" data-correct="false">Hierarchical</button>
            <button class="quiz-option" data-correct="true" data-explanation="NoSQL dirancang untuk menangani data tidak terstruktur dan skala besar dengan skema yang fleksibel.">NoSQL</button>
            <button class="quiz-option" data-correct="false">Network</button>
            <div class="quiz-feedback" style="margin-top:10px; font-weight:600;"></div>
          </div>

          <div class="interactive-card">
            <p><strong>6. Level pada arsitektur three-schema yang menentukan bagaimana data benar-benar disimpan di disk adalah...</strong></p>
            <button class="quiz-option" data-correct="false">External Level</button>
            <button class="quiz-option" data-correct="false">Conceptual Level</button>
            <button class="quiz-option" data-correct="true" data-explanation="Internal Level adalah level fisik yang menentukan bagaimana data disimpan di storage/disk, termasuk struktur indeks dan blok data.">Internal Level</button>
            <div class="quiz-feedback" style="margin-top:10px; font-weight:600;"></div>
          </div>
        `,
      },
      {
        heading: "I. Evaluasi Formatif (Tugas Mandiri)",
        html: `
          <p>Sebagai pengecekan capaian pembelajaran (bukan penentu kelulusan mata kuliah), mahasiswa mengerjakan kuis reflektif singkat berikut secara mandiri melalui smartphone/laptop (Google Form/Quizizz):</p>
          <ol class="steps">
            <li>Jelaskan dengan kata-kata Anda sendiri, apa perbedaan antara "data" dan "basis data"?</li>
            <li>Sebutkan minimal 3 komponen penyusun sistem basis data beserta contohnya.</li>
            <li>Mengapa arsitektur <em>three-schema</em> memisahkan level eksternal, konseptual, dan internal? Apa manfaatnya?</li>
            <li>Berikan satu contoh aplikasi yang Anda gunakan sehari-hari, lalu perkirakan model basis data (relasional/NoSQL) apa yang mungkin digunakan aplikasi tersebut, dan jelaskan alasannya.</li>
            <li>Tuliskan satu kalimat refleksi: apa yang paling menarik dari materi hari ini dan mengapa?</li>
          </ol>
          <h4>Rubrik Penilaian Singkat</h4>
          <table class="dtable">
            <thead><tr><th style="width:170px">Kategori</th><th>Indikator Capaian</th></tr></thead>
            <tbody>
              <tr><td><strong>Sangat Baik</strong></td><td>Menjawab seluruh pertanyaan dengan tepat, disertai contoh nyata yang relevan.</td></tr>
              <tr><td><strong>Baik</strong></td><td>Menjawab sebagian besar pertanyaan dengan tepat, contoh kurang spesifik.</td></tr>
              <tr><td><strong>Cukup</strong></td><td>Menjawab sebagian pertanyaan, pemahaman konsep dasar masih perlu penguatan.</td></tr>
              <tr><td><strong>Perlu Bimbingan</strong></td><td>Belum mampu menjelaskan konsep dasar basis data secara mandiri.</td></tr>
            </tbody>
          </table>`,
      },
      {
        heading: "J. Rangkuman",
        html: `
          <ul>
            <li>Basis data adalah kumpulan data yang terorganisasi dan saling berelasi, dikelola oleh DBMS agar dapat diakses secara efisien oleh banyak pengguna.</li>
            <li>Sistem basis data berevolusi dari sistem berbasis file menuju model relasional (sejak 1970) hingga NoSQL pada era <em>big data</em> saat ini.</li>
            <li>Sistem basis data terdiri atas lima komponen utama: data, hardware, software, prosedur, dan pengguna.</li>
            <li>Arsitektur <em>three-schema</em> (external, conceptual, internal) menjaga <em>data independence</em> antara pengguna dan detail penyimpanan fisik.</li>
            <li>Model RDBMS menjadi fokus utama mata kuliah ini karena paling umum digunakan pada sistem informasi transaksional, dan menjadi dasar sebelum mempelajari perancangan ERD pada pertemuan berikutnya.</li>
          </ul>`,
      },
      {
        heading: "K. Referensi",
        html: `
          <ul class="refs">
            <li>Elmasri, R., &amp; Navathe, S. B. (2016). <em>Fundamentals of Database Systems</em> (7th ed.). Edinburgh: Pearson Education Limited.</li>
            <li>J Prayoga, Sinar Sinurat, Andi Rachman, dkk. (2023). <em>Sistem Basis Data</em>. Deli Serdang: Graha Mitra Edukasi.</li>
            <li>Silberschatz, A., Korth, H. F., &amp; Sudarshan, S. (2020). <em>Database System Concepts</em> (7th ed.). New York: McGraw-Hill Education.</li>
            <li>Codd, E. F. (1970). A Relational Model of Data for Large Shared Data Banks. <em>Communications of the ACM</em>, 13(6), 377–387.</li>
          </ul>`,
      },
    ],
  },

  /* ---- Pertemuan 2–16: placeholder, tinggal isi seperti contoh Pertemuan 1 di atas ---- */
  {
    id: 2,
    locked: false,
    title: "Perancangan Model Konseptual (ERD)",
    subtitle: "Entitas, Atribut, Relasi, dan Notasi Crow's Foot dalam Pemodelan Data Konseptual",
    meta: {
      subCPMK: "Mahasiswa mampu merancang model data konseptual menggunakan diagram hubungan entitas (ERD) sesuai dengan studi kasus bisnis.",
      alokasi: "3 × 50 menit",
      bobot: "3%",
      cpmk: "CPMK-1",
    },
    sections: [
      {
        heading: "A. Identitas Pertemuan",
        html: `
          <table class="dtable">
            <tbody>
              <tr><th>Mata Kuliah</th><td>Basis Data — Program Studi S1 Informatika, UNIPI</td></tr>
              <tr><th>Pertemuan / Minggu</th><td>Ke-2 dari 16 (Semester 3, TA 2026/2027)</td></tr>
              <tr><th>Alokasi Waktu</th><td>3 × 50 menit (Tatap Muka) + Penugasan Terstruktur/Mandiri</td></tr>
              <tr><th>CPMK Terkait</th><td>CPMK-1: Menguasai konsep dan implementasi basis data dalam pengembangan rekayasa perangkat lunak.</td></tr>
              <tr><th>Sub-CPMK Minggu 2</th><td>Mahasiswa mampu merancang model data konseptual menggunakan Entity-Relationship Diagram (ERD) berdasarkan analisis kebutuhan sistem informasi.</td></tr>
            </tbody>
          </table>`,
      },
      {
        heading: "B. Capaian Pembelajaran (Pendekatan OBE)",
        html: `
          <p>Berdasarkan prinsip Outcome Based Education (OBE), capaian pembelajaran untuk pertemuan ini meliputi:</p>
          <table class="dtable">
            <thead><tr><th style="width:60px">No</th><th>Indikator Capaian (Outcome yang Diukur)</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>Mahasiswa dapat mengidentifikasi entitas dan atribut dari sebuah narasi sistem.</td></tr>
              <tr><td>2</td><td>Mahasiswa dapat membedakan antara entitas kuat dan entitas lemah.</td></tr>
              <tr><td>3</td><td>Mahasiswa dapat menentukan rasio kardinalitas (1:1, 1:N, M:N) antar entitas.</td></tr>
              <tr><td>4</td><td>Mahasiswa dapat menerapkan batasan partisipasi (total/parsial) dalam diagram.</td></tr>
              <tr><td>5</td><td>Mahasiswa dapat mengonstruksi ERD lengkap menggunakan notasi Crow's Foot.</td></tr>
            </tbody>
          </table>
          <div class="chipRow">
            <span class="chip">KRITERIA · Ketepatan pemodelan dalam studi kasus</span>
            <span class="chip">BENTUK · Penugasan perancangan diagram</span>
            <span class="chip chip--amber">BOBOT · 3%</span>
          </div>`,
      },
      {
        heading: "C. Peta Konsep Pertemuan",
        html: `
          <p>Materi pertemuan 2 mencakup lima pokok bahasan utama dalam pemodelan semantik data:</p>
          <ol class="steps">
            <li>Definisi dan peran model data konseptual</li>
            <li>Komponen dasar ERD: Entitas, Atribut, dan Relasi</li>
            <li>Jenis entitas dan taksonomi atribut (Silberschatz et al., 2020)</li>
            <li>Batasan struktural: Kardinalitas dan Partisipasi (Elmasri &amp; Navathe, 2016)</li>
            <li>Notasi Crow's Foot dan metodologi perancangan ERD</li>
          </ol>`,
      },
      {
        heading: "D. Kegiatan Pembelajaran (Alur OBE)",
        html: `
          <h4>1. Pendahuluan (± 15 menit)</h4>
          <ul>
            <li>Apersepsi: Mengaitkan materi Pertemuan 1 (Sistem Basis Data) dengan kebutuhan perancangan sebelum implementasi teknis.</li>
            <li>Penyampaian target sub-CPMK dan relevansinya terhadap proyek akhir mata kuliah.</li>
          </ul>
          <h4>2. Kegiatan Inti (± 105 menit)</h4>
          <ul>
            <li>Eksplorasi konsep entitas dan atribut melalui diskusi interaktif.</li>
            <li>Demonstrasi perancangan ERD menggunakan notasi Crow's Foot.</li>
            <li>Praktik kelompok: Analisis narasi bisnis menjadi diagram konseptual.</li>
            <li>Simulasi interaktif visualisasi kardinalitas pada portal materi.</li>
          </ul>
          <h4>3. Penutup (± 30 menit)</h4>
          <ul>
            <li>Review hasil rancangan kelompok dan umpan balik antar rekan (peer feedback).</li>
            <li>Kuis formatif berbasis portal untuk mengecek pemahaman konsep kunci.</li>
            <li>Instruksi tugas mandiri: Melengkapi rancangan ERD untuk studi kasus masing-masing kelompok.</li>
          </ul>`,
      },
      {
        heading: "E.1 Definisi dan Peran Model Data Konseptual",
        html: `
          <p>Pemodelan data konseptual adalah proses membangun representasi data organisasi yang independen terhadap detail teknis penyimpanan. Menurut <strong>Elmasri &amp; Navathe (2016)</strong>, model ER (Entity-Relationship) adalah standar de-facto untuk tahap ini karena kemampuannya menggambarkan aspek semantik dunia nyata dengan jelas.</p>
          <div class="callout">
            <span class="callout__label">Pentingnya Pemodelan</span>
            <p>Model konseptual berfungsi sebagai jembatan komunikasi antara perancang sistem (analis) dengan pemilik bisnis (pengguna), memastikan kebutuhan data dipahami secara selaras sebelum masuk ke tahap teknis SQL atau pemrograman.</p>
          </div>`,
      },
      {
        heading: "E.2 Komponen: Entitas dan Set Entitas",
        html: `
          <p>Entitas merupakan objek atau konsep yang dapat dibedakan secara unik. Terdapat klasifikasi penting berdasarkan karakteristik keberadaannya:</p>
          <ol class="steps">
            <li><strong>Strong Entity (Entitas Kuat):</strong> Memiliki identitas mandiri melalui Primary Key. Contoh: KARYAWAN (NIK), BUKU (ISBN).</li>
            <li><strong>Weak Entity (Entitas Lemah):</strong> Tidak memiliki Primary Key sendiri dan keberadaannya bergantung pada entitas lain (Identifying Owner). Contoh: TANGGUNGAN bergantung pada KARYAWAN.</li>
          </ol>
          <div class="diagram-container">
            <div class="diagram-zoom-controls">
              <button class="zoom-btn zoom-out">−</button>
              <span class="zoom-btn zoom-level" style="background:#EEF2F5;color:#3A4A63;cursor:default;">100%</span>
              <button class="zoom-btn zoom-in">+</button>
              <button class="zoom-btn zoom-reset">Reset</button>
            </div>
            <div class="diagram-wrapper">
              <div class="diagram-inner">
                <svg viewBox="0 0 500 120" style="width:400px;" font-family="JetBrains Mono" font-size="12">
                  <rect x="20" y="30" width="120" height="40" stroke="#16294A" stroke-width="2" fill="#E7F0F1"/>
                  <text x="80" y="55" text-anchor="middle">KARYAWAN</text>
                  <text x="80" y="90" text-anchor="middle" font-size="10" fill="#666">Entitas Kuat</text>
                  <rect x="220" y="30" width="120" height="40" stroke="#16294A" stroke-width="2" fill="#E7F0F1"/>
                  <rect x="224" y="34" width="112" height="32" stroke="#16294A" stroke-width="1" fill="none"/>
                  <text x="280" y="55" text-anchor="middle">TANGGUNGAN</text>
                  <text x="280" y="90" text-anchor="middle" font-size="10" fill="#666">Entitas Lemah</text>
                </svg>
              </div>
            </div>
            <p class="diagram-source">Sumber konsep: Elmasri &amp; Navathe (2016), Bab 7; Representasi Entitas Kuat vs Lemah.</p>
          </div>

          <h4>Latihan: Klasifikasi Entitas</h4>
          <div class="interactive-card">
            <p>Klasifikasikan entitas-entitas berikut sebagai <strong>Kuat</strong> atau <strong>Lemah</strong>:</p>
            <div id="entityGame" style="margin-top:12px;">
              <p id="entityQ" style="font-weight:600; font-size:15px; margin-bottom:12px;">Klik "Mulai" untuk memulai.</p>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn-sim" id="entityStart" style="background:#2BA6A0;">Mulai</button>
                <button class="btn-sim entity-btn" data-type="KUAT" disabled style="background:#166534;">Kuat</button>
                <button class="btn-sim entity-btn" data-type="LEMAH" disabled style="background:#991b1b;">Lemah</button>
              </div>
              <div id="entityFeedback" style="margin-top:10px; font-weight:600;"></div>
              <p class="muted" style="margin-top:8px;">Skor: <span id="entityScore">0</span>/<span id="entityTotal">0</span></p>
            </div>
          </div>`,
      },
      {
        heading: "E.3 Taksonomi Atribut (Silberschatz et al., 2020)",
        html: `
          <p>Atribut mendeskripsikan properti dari entitas. Klasifikasi menurut <strong>Silberschatz, Korth, &amp; Sudarshan (2020)</strong>:</p>
          <table class="dtable">
            <thead><tr><th>Tipe Atribut</th><th>Deskripsi Teknis</th><th>Contoh</th></tr></thead>
            <tbody>
              <tr><td><strong>Simple (Atomic)</strong></td><td>Nilai tunggal yang tidak dapat didekomposisi lagi.</td><td><code>Jenis_Kelamin</code></td></tr>
              <tr><td><strong>Composite</strong></td><td>Dapat dipecah menjadi sub-atribut yang lebih kecil secara logis.</td><td><code>Nama (Depan, Belakang)</code></td></tr>
              <tr><td><strong>Multi-valued</strong></td><td>Memungkinkan lebih dari satu nilai untuk satu instansi entitas.</td><td><code>No_Handphone, Skill</code></td></tr>
              <tr><td><strong>Derived</strong></td><td>Nilai yang dihasilkan melalui perhitungan atribut lain, tidak disimpan secara fisik.</td><td><code>Usia</code> (dari Tgl_Lahir)</td></tr>
            </tbody>
          </table>

          <h4>Latihan: Klasifikasi Atribut</h4>
          <div class="interactive-card">
            <p>Klasifikasikan atribut-atribut berikut ke dalam kategori yang benar:</p>
            <div id="attrGame" style="margin-top:12px;">
              <p id="attrQ" style="font-weight:600; font-size:15px; margin-bottom:12px;">Klik "Mulai" untuk memulai.</p>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="btn-sim" id="attrStart" style="background:#2BA6A0;">Mulai</button>
                <button class="btn-sim attr-btn" data-type="SIMPLE" disabled style="background:#16294A;">Simple</button>
                <button class="btn-sim attr-btn" data-type="COMPOSITE" disabled style="background:#1F3864;">Composite</button>
                <button class="btn-sim attr-btn" data-type="MULTI-VALUED" disabled style="background:#7A6FC9;">Multi-valued</button>
                <button class="btn-sim attr-btn" data-type="DERIVED" disabled style="background:#C9584F;">Derived</button>
              </div>
              <div id="attrFeedback" style="margin-top:10px; font-weight:600;"></div>
              <p class="muted" style="margin-top:8px;">Skor: <span id="attrScore">0</span>/<span id="attrTotal">0</span></p>
            </div>
          </div>`,
      },
      {
        heading: "E.4 Batasan Struktural: Kardinalitas dan Partisipasi",
        html: `
          <p>Dua konsep utama dalam menentukan validitas hubungan antar entitas (Elmasri &amp; Navathe, 2016):</p>
          <h4>1. Rasio Kardinalitas (Cardinality Ratio)</h4>
          <p>Menentukan jumlah maksimum instansi entitas yang dapat berelasi (1:1, 1:N, M:N). Lihat visualisasi di bawah.</p>
          
          <h4>2. Batasan Partisipasi (Participation Constraint)</h4>
          <ul>
            <li><strong>Total Participation (Wajib):</strong> Setiap instansi entitas harus terlibat dalam relasi.</li>
            <li><strong>Partial Participation (Opsional):</strong> Instansi entitas boleh tidak terlibat dalam relasi.</li>
          </ul>

          <h4>Contoh Partisipasi dalam Konteks Nyata</h4>
          <table class="dtable">
            <thead><tr><th>Relasi</th><th>Tipe Partisipasi</th><th>Penjelasan</th></tr></thead>
            <tbody>
              <tr><td>DOSEN — MENGAJAR — KULIAH</td><td><strong>Total</strong> (Dosen)</td><td>Setiap dosen di kampus WAJIB mengajar minimal satu mata kuliah.</td></tr>
              <tr><td>MAHASISWA — MENGIKUTI — UKT</td><td><strong>Total</strong> (Mahasiswa)</td><td>Setiap mahasiswa WAJIB membayar UKT untuk bisa kuliah.</td></tr>
              <tr><td>PELANGGAN — MEMBERI — ULASAN</td><td><strong>Parsial</strong> (Pelanggan)</td><td>Tidak semua pelanggan memberi ulasan setelah membeli.</td></tr>
              <tr><td>DOSEN — MEMBINA — SKRIPSI</td><td><strong>Parsial</strong> (Dosen)</td><td>Tidak semua dosen membina mahasiswa skripsi (terutama dosen muda).</td></tr>
            </tbody>
          </table>

          <div class="interactive-card">
            <p><strong>Visualisasi Interaktif: Rasio Kardinalitas</strong></p>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:15px;">
              <button class="btn-sim" onclick="showRel('11')">One-to-One (1:1)</button>
              <button class="btn-sim" onclick="showRel('1n')">One-to-Many (1:N)</button>
              <button class="btn-sim" onclick="showRel('mn')">Many-to-Many (M:N)</button>
            </div>
            <div id="relVis" class="sim-box" style="height:180px; background:#f8fafc; border:1px solid var(--line);">
              <p style="text-align:center; color:#8CA0BA; margin-top:65px;">Pilih tipe relasi untuk melihat struktur</p>
            </div>
            <div id="relDesc" style="margin-top:10px; font-size:13px; color:#3A4A63; min-height:40px;"></div>
          </div>

          <h4>Panduan Membaca Notasi Crow's Foot</h4>
          <p>Notasi Crow's Foot menggunakan simbol-simbol khusus pada ujung garis relasi untuk menunjukkan kardinalitas:</p>
          <div class="diagram-container">
            <div class="diagram-zoom-controls">
              <button class="zoom-btn zoom-out">−</button>
              <span class="zoom-btn zoom-level" style="background:#EEF2F5;color:#3A4A63;cursor:default;">100%</span>
              <button class="zoom-btn zoom-in">+</button>
              <button class="zoom-btn zoom-reset">Reset</button>
            </div>
            <div class="diagram-wrapper">
              <div class="diagram-inner">
                <svg viewBox="0 0 500 200" style="width:480px;" font-family="JetBrains Mono" font-size="11">
                  <!-- 1:1 -->
                  <line x1="30" y1="40" x2="170" y2="40" stroke="#16294A" stroke-width="2"/>
                  <circle cx="30" cy="40" r="4" fill="#16294A"/>
                  <circle cx="170" cy="40" r="4" fill="#16294A"/>
                  <text x="100" y="30" text-anchor="middle" font-size="12" font-weight="bold">1 : 1</text>
                  <text x="100" y="55" text-anchor="middle" font-size="10" fill="#666">Satu — Satu</text>

                  <!-- 1:N -->
                  <line x1="30" y1="100" x2="170" y2="100" stroke="#16294A" stroke-width="2"/>
                  <circle cx="30" cy="100" r="4" fill="#16294A"/>
                  <line x1="160" y1="90" x2="170" y2="100" stroke="#16294A" stroke-width="2"/>
                  <line x1="160" y1="110" x2="170" y2="100" stroke="#16294A" stroke-width="2"/>
                  <line x1="170" y1="90" x2="170" y2="110" stroke="#16294A" stroke-width="2"/>
                  <text x="100" y="90" text-anchor="middle" font-size="12" font-weight="bold">1 : N</text>
                  <text x="100" y="115" text-anchor="middle" font-size="10" fill="#666">Satu — Banyak</text>

                  <!-- M:N -->
                  <line x1="30" y1="160" x2="170" y2="160" stroke="#16294A" stroke-width="2"/>
                  <line x1="20" y1="150" x2="30" y2="160" stroke="#16294A" stroke-width="2"/>
                  <line x1="20" y1="170" x2="30" y2="160" stroke="#16294A" stroke-width="2"/>
                  <line x1="30" y1="150" x2="30" y2="170" stroke="#16294A" stroke-width="2"/>
                  <line x1="160" y1="150" x2="170" y2="160" stroke="#16294A" stroke-width="2"/>
                  <line x1="160" y1="170" x2="170" y2="160" stroke="#16294A" stroke-width="2"/>
                  <line x1="170" y1="150" x2="170" y2="170" stroke="#16294A" stroke-width="2"/>
                  <text x="100" y="150" text-anchor="middle" font-size="12" font-weight="bold">M : N</text>
                  <text x="100" y="175" text-anchor="middle" font-size="10" fill="#666">Banyak — Banyak</text>

                  <!-- Legend -->
                  <text x="250" y="40" font-size="11" font-weight="bold" fill="#16294A">Simbol:</text>
                  <circle cx="260" cy="60" r="4" fill="#16294A"/>
                  <text x="270" y="64" font-size="10" fill="#3A4A63">= "Satu" (One)</text>
                  <line x1="250" y1="85" x2="260" y2="85" stroke="#16294A" stroke-width="2"/>
                  <line x1="250" y1="80" x2="260" y2="85" stroke="#16294A" stroke-width="2"/>
                  <line x1="250" y1="90" x2="260" y2="85" stroke="#16294A" stroke-width="2"/>
                  <line x1="260" y1="80" x2="260" y2="90" stroke="#16294A" stroke-width="2"/>
                  <text x="270" y="90" font-size="10" fill="#3A4A63">= "Banyak" (Crow's Foot)</text>
                  <line x1="250" y1="115" x2="260" y2="115" stroke="#16294A" stroke-width="2"/>
                  <circle cx="260" cy="115" r="4" fill="#fff" stroke="#16294A" stroke-width="2"/>
                  <text x="270" y="119" font-size="10" fill="#3A4A63">= "Nol atau Satu" (Optional)</text>
                  <line x1="250" y1="140" x2="260" y2="140" stroke="#16294A" stroke-width="2"/>
                  <circle cx="252" cy="140" r="4" fill="#fff" stroke="#16294A" stroke-width="2"/>
                  <line x1="252" y1="133" x2="260" y2="140" stroke="#16294A" stroke-width="2"/>
                  <line x1="252" y1="147" x2="260" y2="140" stroke="#16294A" stroke-width="2"/>
                  <line x1="260" y1="133" x2="260" y2="147" stroke="#16294A" stroke-width="2"/>
                  <text x="270" y="144" font-size="10" fill="#3A4A63">= "Nol atau Banyak" (Optional Many)</text>
                </svg>
              </div>
            </div>
            <p class="diagram-source">Notasi Crow's Foot adalah standar industri yang paling banyak digunakan untuk diagram ER.</p>
          </div>`,
      },
      {
        heading: "F. Studi Kasus: Sistem Manajemen Perpustakaan",
        html: `
          <p>Analisis narasi untuk membangun ERD Perpustakaan:</p>
          <div class="callout">
            <p>"Sebuah perpustakaan menyimpan data <strong>Buku</strong> yang memiliki ISBN, Judul, dan Tahun. Setiap buku dapat dipinjam oleh banyak <strong>Anggota</strong>, dan satu anggota dapat meminjam banyak buku sekaligus. Kita juga mencatat <strong>Dosen</strong> yang menjadi pembina setiap kategori buku."</p>
          </div>
          <p>Hasil Analisis:</p>
          <ul>
            <li><strong>Entitas:</strong> BUKU, ANGGOTA, DOSEN.</li>
            <li><strong>Relasi ANGGOTA-BUKU:</strong> M:N (Peminjaman).</li>
            <li><strong>Relasi DOSEN-BUKU:</strong> 1:N (Pembinaan).</li>
          </ul>

          <h4>Diagram ER Perpustakaan (Notasi Crow's Foot)</h4>
          <div class="diagram-container">
            <div class="diagram-zoom-controls">
              <button class="zoom-btn zoom-out">−</button>
              <span class="zoom-btn zoom-level" style="background:#EEF2F5;color:#3A4A63;cursor:default;">100%</span>
              <button class="zoom-btn zoom-in">+</button>
              <button class="zoom-btn zoom-reset">Reset</button>
            </div>
            <div class="diagram-wrapper">
              <div class="diagram-inner">
                <svg viewBox="0 0 600 350" style="width:560px;" font-family="JetBrains Mono" font-size="11">
                  <!-- DOSEN -->
                  <rect x="20" y="130" width="140" height="80" stroke="#16294A" stroke-width="2" fill="#FBEFDC" rx="8"/>
                  <text x="90" y="155" text-anchor="middle" font-weight="bold" font-size="12">DOSEN</text>
                  <line x1="20" y1="165" x2="160" y2="165" stroke="#16294A" stroke-width="1"/>
                  <text x="90" y="180" text-anchor="middle" font-size="10" fill="#3A4A63">nip</text>
                  <text x="90" y="195" text-anchor="middle" font-size="10" fill="#3A4A63">nama_dosen</text>

                  <!-- BUKU -->
                  <rect x="220" y="130" width="160" height="100" stroke="#16294A" stroke-width="2" fill="#E7F0F1" rx="8"/>
                  <text x="300" y="155" text-anchor="middle" font-weight="bold" font-size="12">BUKU</text>
                  <line x1="220" y1="165" x2="380" y2="165" stroke="#16294A" stroke-width="1"/>
                  <text x="300" y="180" text-anchor="middle" font-size="10" fill="#3A4A63">isbn (PK)</text>
                  <text x="300" y="195" text-anchor="middle" font-size="10" fill="#3A4A63">judul</text>
                  <text x="300" y="210" text-anchor="middle" font-size="10" fill="#3A4A63">tahun</text>
                  <text x="300" y="225" text-anchor="middle" font-size="10" fill="#7A6FC9">nip_dosen (FK)</text>

                  <!-- ANGGOTA -->
                  <rect x="430" y="130" width="150" height="80" stroke="#16294A" stroke-width="2" fill="#E9F3E9" rx="8"/>
                  <text x="505" y="155" text-anchor="middle" font-weight="bold" font-size="12">ANGGOTA</text>
                  <line x1="430" y1="165" x2="580" y2="165" stroke="#16294A" stroke-width="1"/>
                  <text x="505" y="180" text-anchor="middle" font-size="10" fill="#3A4A63">id_anggota (PK)</text>
                  <text x="505" y="195" text-anchor="middle" font-size="10" fill="#3A4A63">nama</text>

                  <!-- PINJAMAN (tabel penghubung M:N) -->
                  <rect x="300" y="290" width="160" height="50" stroke="#C9584F" stroke-width="2" fill="#FDEAEA" rx="8"/>
                  <text x="380" y="315" text-anchor="middle" font-weight="bold" font-size="11" fill="#C9584F">PINJAMAN</text>
                  <text x="380" y="335" text-anchor="middle" font-size="9" fill="#3A4A63">isbn (FK) + id_anggota (FK) + tanggal</text>

                  <!-- Relasi 1:N DOSEN-BUKU -->
                  <line x1="160" y1="170" x2="220" y2="170" stroke="#16294A" stroke-width="2"/>
                  <text x="185" y="165" font-size="10" fill="#666">1 : N</text>

                  <!-- Relasi M:N via PINJAMAN -->
                  <line x1="300" y1="230" x2="340" y2="290" stroke="#C9584F" stroke-width="2" stroke-dasharray="5,3"/>
                  <line x1="505" y1="210" x2="420" y2="290" stroke="#C9584F" stroke-width="2" stroke-dasharray="5,3"/>
                  <text x="395" y="260" font-size="10" fill="#C9584F" font-weight="bold">M:N dipecah</text>
                  <text x="395" y="275" font-size="9" fill="#888">→ tabel penghubung</text>

                  <!-- Crow's foot notation hints -->
                  <text x="175" y="185" font-size="9" fill="#888">──┤</text>
                  <text x="210" y="185" font-size="9" fill="#888">├──</text>
                </svg>
              </div>
            </div>
            <p class="diagram-source">Diagram ER Sistem Perpustakaan dengan notasi Crow's Foot. Relasi M:N antara ANGGOTA dan BUKU dipecah menjadi tabel penghubung PINJAMAN.</p>
          </div>

          <div class="callout callout--amber">
            <span class="callout__label">Poin Penting</span>
            <p>Perhatikan bahwa relasi <strong>M:N</strong> antara ANGGOTA dan BUKU tidak bisa langsung dihubungkan. Harus ada <strong>tabel penghubung</strong> (PINJAMAN) yang menyimpan foreign key dari kedua entitas, ditambah atribut seperti tanggal_peminjaman dan tanggal_pengembalian.</p>
          </div>

          <h4>Studi Kasus Tambahan: Sistem Ticketing Konser</h4>
          <div class="callout">
            <p>"Sebuah platform penjualan tiket konser mencatat data <strong>Event</strong> (nama, tanggal, tempat), <strong>Pembeli</strong> (nama, email, no_hp), dan <strong>Tiket</strong> (jenis, harga). Satu event memiliki banyak tiket, dan satu tiket jenis tertentu hanya ada di satu event. Satu pembeli bisa membeli banyak tiket dari berbagai event."</p>
          </div>
          <table class="dtable">
            <thead><tr><th>Entitas</th><th>Atribut</th><th>Relasi</th></tr></thead>
            <tbody>
              <tr><td><strong>EVENT</strong></td><td>event_id (PK), nama_event, tanggal, tempat</td><td>1 event → banyak tiket (1:N)</td></tr>
              <tr><td><strong>PEMBELI</strong></td><td>pembeli_id (PK), nama, email, no_hp</td><td>1 pembeli → banyak pembelian (1:N)</td></tr>
              <tr><td><strong>TIKET</strong></td><td>tiket_id (PK), jenis, harga, event_id (FK)</td><td>1 tiket → 1 event (N:1)</td></tr>
              <tr><td><strong>PEMBELIAN</strong></td><td>pembelian_id (PK), pembeli_id (FK), tiket_id (FK), tanggal_beli</td><td>Tabel penghubung M:N antara PEMBELI dan TIKET</td></tr>
            </tbody>
          </table>
          <div class="callout">
            <span class="callout__label">Diskusi Cepat</span>
            <p>Mengapa data "tanggal_beli" diletakkan di tabel PEMBELIAN (tabel penghubung), bukan di tabel PEMBELI atau TIKET?</p>
          </div>`,
      },
      {
        heading: "G. Aktivitas Praktik: Perancangan Mandiri",
        html: `
          <p>Mahasiswa diminta melakukan eksplorasi mandiri menggunakan laptop/smartphone:</p>
          <ol class="steps">
            <li>Gunakan alat pemodelan seperti <strong>draw.io</strong> atau <strong>Lucidchart</strong>.</li>
            <li>Pilih salah satu studi kasus: (a) Sistem Retail, (b) Rekam Medis, atau (c) Parkir Digital.</li>
            <li>Identifikasi minimal 3 entitas, atribut kunci, dan kardinalitas relasinya.</li>
            <li>Gambarkan menggunakan notasi Crow's Foot.</li>
          </ol>`,
      },
      {
        heading: "G.2 Simulasi: Identifikasi Komponen ERD dari Narasi",
        html: `
          <p>Latihan mengidentifikasi komponen ERD dari sebuah narasi bisnis sederhana. Baca narasi, lalu tentukan apakah pernyataan yang diberikan benar atau salah:</p>
          <div class="interactive-card">
            <p><strong>Narasi:</strong></p>
            <div class="callout">
              <p>"Di sebuah <strong>toko online</strong>, ada <strong>Pelanggan</strong> yang bisa memesan banyak <strong>Produk</strong>. Satu produk bisa dipesan oleh banyak pelanggan. Setiap pesanan punya <strong>tanggal</strong> dan <strong>status</strong>. Pelanggan punya <strong>nama</strong> dan <strong>email</strong>. Produk punya <strong>nama</strong> dan <strong>harga</strong>."</p>
            </div>

            <div id="erdGame" style="margin-top:15px;">
              <p id="erdQ" style="font-weight:600; font-size:14px; margin-bottom:12px;">Klik "Mulai" untuk memulai.</p>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn-sim" id="erdStart" style="background:#2BA6A0;">Mulai</button>
                <button class="btn-sim erd-btn" data-type="true" disabled style="background:#166534;">Benar ✓</button>
                <button class="btn-sim erd-btn" data-type="false" disabled style="background:#991b1b;">Salah ✗</button>
              </div>
              <div id="erdFeedback" style="margin-top:10px; font-weight:600;"></div>
              <p class="muted" style="margin-top:8px;">Skor: <span id="erdScore">0</span>/<span id="erdTotal">0</span></p>
            </div>
          </div>`,
      },
      {
        heading: "H. Evaluasi Formatif (OBE Outcome Check)",
        html: `
          <div class="interactive-card">
            <p><strong>1. Mengapa relasi Many-to-Many (M:N) perlu perhatian khusus saat transformasi ke tabel? (Referensi: Codd, 1970)</strong></p>
            <button class="quiz-option" data-correct="false">Karena memakan banyak memori server.</button>
            <button class="quiz-option" data-correct="true" data-explanation="Relasi M:N harus dipecah menjadi tabel penghubung untuk menghindari redundansi data dan menjaga integritas relasional sesuai teori Codd.">Untuk mencegah redundansi data yang masif.</button>
            <div class="quiz-feedback" style="margin-top:10px; font-weight:600;"></div>
          </div>
          <div class="interactive-card">
            <p><strong>2. Atribut 'Alamat' yang terdiri dari Jalan, Kota, dan Provinsi disebut atribut...</strong></p>
            <button class="quiz-option" data-correct="false">Multi-valued</button>
            <button class="quiz-option" data-correct="true" data-explanation="Atribut composite adalah atribut yang dapat dipecah menjadi komponen yang lebih kecil namun memiliki arti mandiri.">Composite</button>
            <div class="quiz-feedback" style="margin-top:10px; font-weight:600;"></div>
          </div>

          <div class="interactive-card">
            <p><strong>3. Entitas "TANGGUNGAN" yang tidak memiliki Primary Key sendiri dan bergantung pada KARYAWAN disebut...</strong></p>
            <button class="quiz-option" data-correct="true" data-explanation="Entitas lemah (weak entity) tidak memiliki identitas mandiri dan bergantung pada entitas kuat sebagai owner.">Weak Entity (Entitas Lemah)</button>
            <button class="quiz-option" data-correct="false">Strong Entity</button>
            <button class="quiz-option" data-correct="false">Derived Entity</button>
            <div class="quiz-feedback" style="margin-top:10px; font-weight:600;"></div>
          </div>

          <div class="interactive-card">
            <p><strong>4. Jika setiap mahasiswa harus memiliki minimal satu alamat email kampus, maka partisipasi entitas MAHASISWA terhadap relasi EMAIL adalah...</strong></p>
            <button class="quiz-option" data-correct="false">Partial Participation</button>
            <button class="quiz-option" data-correct="true" data-explanation="Total participation (partisipasi total) berarti SETIAP instansi entitas WAJIB terlibat dalam relasi. Karena setiap mahasiswa harus punya email, maka ini adalah total participation.">Total Participation</button>
            <div class="quiz-feedback" style="margin-top:10px; font-weight:600;"></div>
          </div>

          <div class="interactive-card">
            <p><strong>5. Manakah yang merupakan contoh relasi One-to-One (1:1) dalam dunia nyata?</strong></p>
            <button class="quiz-option" data-correct="true" data-explanation="Satu negara memiliki satu ibu kota, dan satu ibu kota mewakili satu negara.">Negara — Ibu Kota</button>
            <button class="quiz-option" data-correct="false">Dosen — Kuliah (1:N)</button>
            <button class="quiz-option" data-correct="false">Mahasiswa — Mata Kuliah (M:N)</button>
            <div class="quiz-feedback" style="margin-top:10px; font-weight:600;"></div>
          </div>

          <div class="interactive-card">
            <p><strong>6. Atribut "Usia" yang dihitung dari "Tanggal_Lahir" termasuk kategori atribut...</strong></p>
            <button class="quiz-option" data-correct="false">Simple</button>
            <button class="quiz-option" data-correct="false">Composite</button>
            <button class="quiz-option" data-correct="true" data-explanation="Atribut derived adalah atribut yang nilainya diperoleh dari perhitungan atribut lain dan tidak disimpan secara fisik di database.">Derived</button>
            <button class="quiz-option" data-correct="false">Multi-valued</button>
            <div class="quiz-feedback" style="margin-top:10px; font-weight:600;"></div>
          </div>
        `,
      },
      {
        heading: "I. Rangkuman",
        html: `
          <ul>
            <li>ERD adalah alat pemodelan konseptual yang memetakan kebutuhan bisnis ke dalam struktur data semantik.</li>
            <li>Komponen dasar terdiri dari Entitas (Kuat/Lemah), Atribut (Simple/Composite/Multi/Derived), dan Relasi.</li>
            <li>Batasan struktural (Kardinalitas dan Partisipasi) sangat menentukan integritas data dalam sistem.</li>
            <li>Notasi Crow's Foot adalah standar industri yang memudahkan pemahaman relasi antar tabel secara visual.</li>
          </ul>`,
      },
      {
        heading: "J. Referensi",
        html: `
          <ul class="refs">
            <li>Elmasri, R., &amp; Navathe, S. B. (2016). <em>Fundamentals of Database Systems</em> (7th ed.). Pearson Education Limited.</li>
            <li>J Prayoga, Sinar Sinurat, Andi Rachman, dkk. (2023). <em>Sistem Basis Data</em>. Deli Serdang: Graha Mitra Edukasi.</li>
            <li>Silberschatz, A., Korth, H. F., &amp; Sudarshan, S. (2020). <em>Database System Concepts</em> (7th ed.). McGraw-Hill Education.</li>
            <li>Codd, E. F. (1970). A Relational Model of Data for Large Shared Data Banks. <em>Communications of the ACM</em>, 13(6), 377–387.</li>
          </ul>`,
      },
    ],
  },
  { id: 3, locked: true, title: "Perancangan Basis Data dengan ERD (Studi Kasus)" },
  { id: 4, locked: true, title: "Transformasi ERD ke Model Relasional" },
  { id: 5, locked: true, title: "Normalisasi Basis Data (1NF–3NF)" },
  { id: 6, locked: true, title: "Normalisasi Lanjutan (BCNF)" },
  { id: 7, locked: true, title: "Perancangan Model Fisik (PDM)" },
  { id: 8, locked: true, title: "Ujian Tengah Semester (UTS)" },
  { id: 9, locked: true, title: "Instalasi & Akses DBMS" },
  { id: 10, locked: true, title: "Aljabar Relasional (AR)" },
  { id: 11, locked: true, title: "SQL Dasar (DDL & DML)" },
  { id: 12, locked: true, title: "SQL Kompleks" },
  { id: 13, locked: true, title: "Implementasi RDBMS: Tabel & Query" },
  { id: 14, locked: true, title: "Form & Report pada RDBMS" },
  { id: 15, locked: true, title: "Switchboard Aplikasi Basis Data" },
  { id: 16, locked: true, title: "Ujian Akhir Semester (UAS)" },
];
