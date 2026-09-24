/**
 * Template worksheet perancangan ERD (mode mengajar / admin).
 *
 * Dipakai DI PANEL ADMIN saja (halaman /admin di-gate server-side via
 * admin/index.php) sehingga solusi model tidak bocor ke halaman mahasiswa.
 * Struktur data mengikuti state localStorage worksheet (/praktikum):
 *   identitas {nama,nim,kelas,tanggal} | studiKasus | entitas {nama,desk}
 *   atribut {entitas,atribut,pk,fk} | relasi {entitasA,relasi,entitasB,partisipasi}
 *   asumsi
 */

export interface ErdEntitas {
  nama: string;
  desk: string;
}

export interface ErdAtribut {
  entitas: string;
  atribut: string;
  pk: boolean;
  fk: boolean;
}

export interface ErdRelasi {
  entitasA: string;
  relasi: string;
  entitasB: string;
  partisipasi: string;
}

export interface ErdTemplate {
  id: string;
  title: string;
  narasi: string;
  entitas: ErdEntitas[];
  atribut: ErdAtribut[];
  relasi: ErdRelasi[];
  asumsi: string;
}

export const erdTemplates: ErdTemplate[] = [
  {
    id: "SIAKAD",
    title: "Sistem Informasi Akademik",
    narasi:
      "Universitas memiliki Mahasiswa yang terdaftar di suatu Program Studi. Setiap mahasiswa dapat mengambil banyak Mata Kuliah, dan satu mata kuliah dapat diambil oleh banyak mahasiswa. Setiap mata kuliah diasuh oleh minimal satu Dosen. Sistem mencatat Nilai setiap mahasiswa pada setiap mata kuliah.",
    entitas: [
      { nama: "MAHASISWA", desk: "Mahasiswa yang terdaftar pada satu program studi." },
      { nama: "PROGRAM_STUDI", desk: "Program studi tempat mahasiswa terdaftar." },
      { nama: "DOSEN", desk: "Dosen pengampu mata kuliah / pemberi nilai." },
      { nama: "MATA_KULIAH", desk: "Mata kuliah yang ditawarkan dan diambil." },
      { nama: "NILAI", desk: "Hasil belajar mahasiswa pada suatu mata kuliah (entitas asosiatif)." },
    ],
    atribut: [
      { entitas: "MAHASISWA", atribut: "nim (PK), nama, tanggal_lahir, alamat, telepon", pk: true, fk: false },
      { entitas: "PROGRAM_STUDI", atribut: "id_prodi (PK), nama_prodi, akreditasi", pk: true, fk: false },
      { entitas: "DOSEN", atribut: "nip (PK), nama, bidang_keahlian", pk: true, fk: false },
      { entitas: "MATA_KULIAH", atribut: "kode_mk (PK), nama_mk, sks, semester", pk: true, fk: false },
      { entitas: "NILAI", atribut: "id_nilai (PK), nim (FK), kode_mk (FK), nip (FK), nilai_angka, nilai_huruf", pk: true, fk: true },
    ],
    relasi: [
      { entitasA: "MAHASISWA", relasi: "1 : N", entitasB: "PROGRAM_STUDI", partisipasi: "Total" },
      { entitasA: "PROGRAM_STUDI", relasi: "M : N", entitasB: "MATA_KULIAH", partisipasi: "Parsial" },
      { entitasA: "DOSEN", relasi: "M : N", entitasB: "MATA_KULIAH", partisipasi: "Total" },
      { entitasA: "MAHASISWA", relasi: "1 : N", entitasB: "NILAI", partisipasi: "Total" },
      { entitasA: "MATA_KULIAH", relasi: "1 : N", entitasB: "NILAI", partisipasi: "Total" },
      { entitasA: "DOSEN", relasi: "1 : N", entitasB: "NILAI", partisipasi: "Parsial" },
    ],
    asumsi:
      "Satu mahasiswa hanya terdaftar pada satu Program Studi (Total). Satu mata kuliah wajib diasuh minimal satu dosen (Total), dan satu dosen dapat mengasuh banyak mata kuliah. Relasi Mahasiswa–Matakuliah yang banyak-ke-banyak dipecah menjadi entitas asosiatif NILAI agar nilai per mahasiswa per matakuliah dapat dicatat. NIM/NIP/id_prodi/kode_mk bersifat unik global.",
  },
  {
    id: "PERPUSTAKAAN",
    title: "Sistem Perpustakaan Universitas",
    narasi:
      "Perpustakaan memiliki Buku (ISBN, judul, tahun) yang dipinjam oleh Anggota. Satu anggota bisa meminjam banyak buku. Setiap kategori buku dibina oleh satu Dosen.",
    entitas: [
      { nama: "ANGGOTA", desk: "Pengguna perpustakaan yang terdaftar dan dapat meminjam." },
      { nama: "BUKU", desk: "Koleksi buku perpustakaan." },
      { nama: "KATEGORI", desk: "Klasifikasi/jenis buku." },
      { nama: "DOSEN", desk: "Pembina kategori buku." },
      { nama: "PEMINJAMAN", desk: "Transaksi pinjam–kembali buku (entitas asosiatif)." },
    ],
    atribut: [
      { entitas: "ANGGOTA", atribut: "no_anggota (PK), nama, telepon, alamat", pk: true, fk: false },
      { entitas: "BUKU", atribut: "isbn (PK), judul, tahun, pengarang, stok, id_kategori (FK)", pk: true, fk: true },
      { entitas: "KATEGORI", atribut: "id_kategori (PK), nama_kategori", pk: true, fk: false },
      { entitas: "DOSEN", atribut: "nip (PK), nama", pk: true, fk: false },
      { entitas: "PEMINJAMAN", atribut: "no_pinjam (PK), no_anggota (FK), isbn (FK), tanggal_pinjam, tanggal_kembali, status", pk: true, fk: true },
    ],
    relasi: [
      { entitasA: "DOSEN", relasi: "1 : N", entitasB: "KATEGORI", partisipasi: "Total" },
      { entitasA: "KATEGORI", relasi: "1 : N", entitasB: "BUKU", partisipasi: "Total" },
      { entitasA: "ANGGOTA", relasi: "1 : N", entitasB: "PEMINJAMAN", partisipasi: "Total" },
      { entitasA: "BUKU", relasi: "1 : N", entitasB: "PEMINJAMAN", partisipasi: "Parsial" },
    ],
    asumsi:
      "Setiap buku memiliki ISBN unik dan berada dalam tepat satu kategori; setiap kategori wajib dibina oleh satu dosen dan satu dosen dapat membina banyak kategori. Peminjaman dicatat lewat entitas asosiatif PEMINJAMAN sehingga satu anggota boleh meminjam banyak buku dan satu buku boleh dipinjam berulang pada waktu berbeda. Untuk koleksi dengan banyak salinan, ditambahkan nomor eksemplar pada tahap lanjutan.",
  },
  {
    id: "REDSOMS",
    title: "Sistem Manajemen Rumah Sakit",
    narasi:
      "Rumah sakit memiliki Dokter yang bekerja di suatu Unit. Pasien datang untuk Kunjungan. Setiap kunjungan ditangani satu dokter dan tercatat dalam Rekam Medis. Pasien mendapatkan Resep Obat yang berisi Daftar Obat.",
    entitas: [
      { nama: "UNIT", desk: "Unit kerja rumah sakit (poliklinik, UGD, dst.)." },
      { nama: "DOKTER", desk: "Dokter yang bertugas pada satu unit." },
      { nama: "PASIEN", desk: "Pasien yang berobat di rumah sakit." },
      { nama: "KUNJUNGAN", desk: "Kedatangan pasien pada suatu waktu." },
      { nama: "REKAM_MEDIS", desk: "Catatan medis hasil satu kunjungan." },
      { nama: "RESEP", desk: "Resep obat yang diberikan pada kunjungan." },
      { nama: "OBAT", desk: "Daftar obat yang tersedia di apotek." },
      { nama: "RINCIAN_RESEP", desk: "Isi resep: obat + dosis (entitas asosiatif)." },
    ],
    atribut: [
      { entitas: "UNIT", atribut: "id_unit (PK), nama_unit, lantai", pk: true, fk: false },
      { entitas: "DOKTER", atribut: "nip (PK), nama, spesialisasi, id_unit (FK)", pk: true, fk: true },
      { entitas: "PASIEN", atribut: "no_rm (PK), nama, tanggal_lahir, telepon", pk: true, fk: false },
      { entitas: "KUNJUNGAN", atribut: "no_kunjungan (PK), no_rm (FK), nip (FK), tanggal, keluhan", pk: true, fk: true },
      { entitas: "REKAM_MEDIS", atribut: "no_rekam (PK), no_kunjungan (FK), diagnosa, tindakan, catatan", pk: true, fk: true },
      { entitas: "RESEP", atribut: "no_resep (PK), no_kunjungan (FK), tanggal", pk: true, fk: true },
      { entitas: "OBAT", atribut: "kode_obat (PK), nama_obat, harga", pk: true, fk: false },
      { entitas: "RINCIAN_RESEP", atribut: "id_rincian (PK), no_resep (FK), kode_obat (FK), dosis, jumlah", pk: true, fk: true },
    ],
    relasi: [
      { entitasA: "UNIT", relasi: "1 : N", entitasB: "DOKTER", partisipasi: "Total" },
      { entitasA: "PASIEN", relasi: "1 : N", entitasB: "KUNJUNGAN", partisipasi: "Total" },
      { entitasA: "DOKTER", relasi: "1 : N", entitasB: "KUNJUNGAN", partisipasi: "Total" },
      { entitasA: "KUNJUNGAN", relasi: "1 : 1", entitasB: "REKAM_MEDIS", partisipasi: "Parsial" },
      { entitasA: "KUNJUNGAN", relasi: "1 : N", entitasB: "RESEP", partisipasi: "Parsial" },
      { entitasA: "RESEP", relasi: "1 : N", entitasB: "RINCIAN_RESEP", partisipasi: "Total" },
      { entitasA: "OBAT", relasi: "1 : N", entitasB: "RINCIAN_RESEP", partisipasi: "Total" },
    ],
    asumsi:
      "Satu kunjungan ditangani tepat satu dokter dan menghasilkan satu rekam medis (1:1); tidak semua kunjungan wajib berrekam medis (Parsial). Satu kunjungan boleh menulis beberapa resep, dan satu resep berisi banyak obat lewat entitas asosiatif RINCIAN_RESEP. Setiap dokter wajib berada pada satu unit.",
  },
  {
    id: "PARKIR",
    title: "Sistem Manajemen Parkir",
    narasi:
      "Area Parkir mencatat Kendaraan yang masuk. Setiap kendaraan mendapatkan Tiket. Saat keluar, pengendara melakukan Pembayaran berdasarkan durasi parkir.",
    entitas: [
      { nama: "KENDARAAN", desk: "Kendaraan yang pernah masuk area parkir." },
      { nama: "TIKET", desk: "Tiket pintu masuk untuk satu kali parkir." },
      { nama: "PEMBAYARAN", desk: "Transaksi pembayaran saat kendaraan keluar." },
    ],
    atribut: [
      { entitas: "KENDARAAN", atribut: "no_plat (PK), jenis, warna", pk: true, fk: false },
      { entitas: "TIKET", atribut: "no_tiket (PK), no_plat (FK), jam_masuk, slot", pk: true, fk: true },
      { entitas: "PEMBAYARAN", atribut: "no_bayar (PK), no_tiket (FK), jam_keluar, durasi, tarif, total", pk: true, fk: true },
    ],
    relasi: [
      { entitasA: "KENDARAAN", relasi: "1 : N", entitasB: "TIKET", partisipasi: "Total" },
      { entitasA: "TIKET", relasi: "1 : 1", entitasB: "PEMBAYARAN", partisipasi: "Total" },
    ],
    asumsi:
      "Satu kendaraan boleh masuk berkali-kali dan setiap kali masuk menerima satu tiket. Setiap tiket saat keluar wajib memiliki satu pembayaran (Total), tarif dihitung dari durasi parkir. Satu tiket hanya dibayar oleh satu pembayaran (1:1). Slot diasumsikan satu kendaraan per slot pada satu waktu.",
  },
  {
    id: "HOTEL",
    title: "Sistem Booking Hotel",
    narasi:
      "Hotel memiliki Kamar dengan berbagai Tipe. Tamu melakukan Reservasi untuk kamar tertentu. Setiap reservasi dapat mencakup Fasilitas tambahan.",
    entitas: [
      { nama: "TIPE_KAMAR", desk: "Klasifikasi kamar (standard, deluxe, suite)." },
      { nama: "KAMAR", desk: "Kamar fisik hotel." },
      { nama: "TAMU", desk: "Pelanggan yang melakukan reservasi." },
      { nama: "RESERVASI", desk: "Pemesanan satu kamar oleh satu tamu." },
      { nama: "FASILITAS", desk: "Layanan/fasilitas tambahan (breakfast, spa)." },
      { nama: "RESERVASI_FASILITAS", desk: "Fasilitas yang dipilih pada reservasi (entitas asosiatif)." },
    ],
    atribut: [
      { entitas: "TIPE_KAMAR", atribut: "id_tipe (PK), nama_tipe, harga_dasar", pk: true, fk: false },
      { entitas: "KAMAR", atribut: "no_kamar (PK), id_tipe (FK), lantai", pk: true, fk: true },
      { entitas: "TAMU", atribut: "id_tamu (PK), nama, no_hp", pk: true, fk: false },
      { entitas: "RESERVASI", atribut: "no_reservasi (PK), id_tamu (FK), no_kamar (FK), tanggal_check_in, tanggal_check_out, status", pk: true, fk: true },
      { entitas: "FASILITAS", atribut: "id_fasilitas (PK), nama_fasilitas, biaya", pk: true, fk: false },
      { entitas: "RESERVASI_FASILITAS", atribut: "id_rf (PK), no_reservasi (FK), id_fasilitas (FK), qty", pk: true, fk: true },
    ],
    relasi: [
      { entitasA: "TIPE_KAMAR", relasi: "1 : N", entitasB: "KAMAR", partisipasi: "Total" },
      { entitasA: "TAMU", relasi: "1 : N", entitasB: "RESERVASI", partisipasi: "Total" },
      { entitasA: "KAMAR", relasi: "1 : N", entitasB: "RESERVASI", partisipasi: "Total" },
      { entitasA: "RESERVASI", relasi: "1 : N", entitasB: "RESERVASI_FASILITAS", partisipasi: "Parsial" },
      { entitasA: "FASILITAS", relasi: "1 : N", entitasB: "RESERVASI_FASILITAS", partisipasi: "Total" },
    ],
    asumsi:
      "Satu kamar pada rentang waktu tertentu hanya dipesan untuk satu reservasi, tetapi kamar yang sama dapat dipesan pada banyak reservasi di waktu berbeda. Satu reservasi hanya untuk satu kamar dan satu tamu. Fasilitas tambahan bersifat opsional (Parsial) dan dicatat lewat entitas asosiatif RESERVASI_FASILITAS agar satu reservasi dapat memuat banyak fasilitas.",
  },
];