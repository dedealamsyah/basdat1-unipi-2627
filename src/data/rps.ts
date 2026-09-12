export type Fase = 'konsep' | 'normalisasi' | 'uts' | 'implementasi' | 'aplikasi' | 'uas';

export interface WeekItem {
  week: number;
  fase: Fase;
  cpmk: 1 | 2;
  topic: string;
  outcome: string;
  bobot: number;
}

export const PHASE_META: Record<Fase, { label: string; desc: string }> = {
  konsep: { label: 'KONSEP & PERANCANGAN', desc: 'Dasar basis data & model ERD' },
  normalisasi: { label: 'NORMALISASI & MODEL FISIK', desc: 'Tabel rapi, minimal redundansi' },
  uts: { label: 'EVALUASI TENGAH SEMESTER', desc: 'Ujian proyek tahap 1 (OBE)' },
  implementasi: { label: 'IMPLEMENTASI DBMS & SQL', desc: 'Instalasi, query, SQL' },
  aplikasi: { label: 'APLIKASI & PROYEK AKHIR', desc: 'Form, report, switchboard' },
  uas: { label: 'UJIAN AKHIR SEMESTER', desc: 'Demo proyek capstone' },
};

export const RPS_WEEKS: WeekItem[] = [
  { week: 1,  fase: 'konsep',       cpmk: 1, topic: 'Introduction to Databases & Peta OBE', outcome: 'Konsep dasar basis data, komponen, arsitektur & peta CPL–CPMK', bobot: 1 },
  { week: 2,  fase: 'konsep',       cpmk: 1, topic: 'Conceptual Data Modeling & Database Design', outcome: 'Merancang model konseptual (ERD): entitas, atribut, kardinalitas', bobot: 3 },
  { week: 3,  fase: 'konsep',       cpmk: 1, topic: 'Entity Relationship Diagram', outcome: 'Menyelesaikan perancangan ERD dari studi kasus nyata', bobot: 3 },
  { week: 4,  fase: 'konsep',       cpmk: 1, topic: 'The Relational Data Model and SQL', outcome: 'Mentransformasikan ERD ke model relasional (tabel & kunci)', bobot: 4 },
  { week: 5,  fase: 'normalisasi',  cpmk: 1, topic: 'Database Design Theory and Normalization', outcome: 'Normalisasi 1NF–3NF: eliminasi anomali & redundansi', bobot: 5 },
  { week: 6,  fase: 'normalisasi',  cpmk: 1, topic: 'Normalisasi Lanjutan', outcome: 'BCNF & dekomposisi lossless-join bebas anomali', bobot: 5 },
  { week: 7,  fase: 'normalisasi',  cpmk: 1, topic: 'Perancangan Model Fisik (PDM)', outcome: 'Tipe data, primary/foreign key & constraint sesuai DBMS', bobot: 5 },
  { week: 8,  fase: 'uts',          cpmk: 1, topic: 'Ujian Tengah Semester', outcome: 'Evaluasi capaian proyek tahap 1 (OBE milestone)', bobot: 18 },
  { week: 9,  fase: 'implementasi', cpmk: 2, topic: 'Instalasi dan Akses DBMS', outcome: 'Instalasi, konfigurasi & akses DBMS melalui CLI/GUI', bobot: 4 },
  { week: 10, fase: 'implementasi', cpmk: 2, topic: 'Aljabar Relasional (AR)', outcome: 'Memecahkan masalah query dengan notasi Aljabar Relasional', bobot: 4 },
  { week: 11, fase: 'implementasi', cpmk: 2, topic: 'SQL Dasar (DDL & DML)', outcome: 'Menulis sintaks SQL untuk membuat & memanipulasi data', bobot: 2 },
  { week: 12, fase: 'implementasi', cpmk: 2, topic: 'SQL Kompleks', outcome: 'JOIN, subquery & agregasi untuk masalah nyata', bobot: 4 },
  { week: 13, fase: 'aplikasi',     cpmk: 2, topic: 'Implementasi RDBMS', outcome: 'Membangun basis data sederhana (tabel & query) pada RDBMS', bobot: 4 },
  { week: 14, fase: 'aplikasi',     cpmk: 2, topic: 'Form dan Report pada RDBMS', outcome: 'Membuat form & report pada RDBMS', bobot: 4 },
  { week: 15, fase: 'aplikasi',     cpmk: 2, topic: 'Switchboard Aplikasi dengan RDBMS', outcome: 'Mendesain switchboard & integrasi dengan basis data', bobot: 4 },
  { week: 16, fase: 'uas',          cpmk: 2, topic: 'Ujian Akhir Semester', outcome: 'Demonstrasi proyek akhir (capstone) & evaluasi capaian OBE', bobot: 30 },
];

export const EVALUASI = [
  { label: 'Aktivitas Partisipatif', pct: 20 },
  { label: 'Penilaian Hasil Proyek / Produk', pct: 65 },
  { label: 'Praktik / Unjuk Kerja', pct: 15 },
];