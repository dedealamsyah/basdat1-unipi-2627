<?php
/**
 * Uji logika `rekap` di api/me.php tanpa database.
 *
 * Kita tidak memanggil me.php langsung (butuh PDO + sesi), tapi diekstrak
 * blok perhitungannya lalu dijalankan dengan data contoh. Tujuannya:
 * memastikan rekap tidak salah soal pembeda "belum dikerjakan" vs
 * "dikerjakan dan nilainya 0" — kesalahan yang membuat notifikasi salah.
 */

$skorLatihan = array(
    1 => array('skor' => 3, 'total' => 3),   // tuntas
    2 => array('skor' => 2, 'total' => 3),   // parsial (diinput admin)
    3 => array('skor' => 0, 'total' => 3),   // ada baris, tapi belum apa-apa (0)
);
$evaluasi = array(
    1 => array('skor' => 42, 'total' => 100, 'flagged' => 0),
    2 => array('skor' => 68, 'total' => 100, 'flagged' => 0),
    4 => array('skor' => 0,  'total' => 100, 'flagged' => 0), // nilai 0 sungguhan
);
$active = array(1, 2, 3, 4, 5);
$statusMap = array(1 => 'done', 2 => 'done', 3 => 'open', 4 => 'done', 5 => 'locked');
$adaLatihan = array(1 => true, 2 => true, 3 => true, 4 => false, 5 => true);
$adaEvaluasi = array(1 => true, 2 => true, 3 => true, 4 => true, 5 => true);
$tugasStatus = array(1 => true, 3 => false, 4 => true);

$rekap = array();
foreach ($active as $pid) {
    $lat = isset($skorLatihan[$pid]) ? $skorLatihan[$pid] : null;
    $ev = isset($evaluasi[$pid]) ? $evaluasi[$pid] : null;
    $rekap[$pid] = array(
        'status' => $statusMap[$pid] ?? 'locked',
        'ada_latihan' => $adaLatihan[$pid],
        'ada_evaluasi' => $adaEvaluasi[$pid],
        'ada_tugas' => !empty($tugasStatus[$pid]),
        'latihan' => array(
            'skor' => $lat ? $lat['skor'] : 0,
            'total' => $lat ? $lat['total'] : 0,
            'pct' => ($lat && $lat['total'] > 0)
                ? (int) round(($lat['skor'] / $lat['total']) * 100) : null,
        ),
        'evaluasi' => array(
            'skor' => $ev ? (int) $ev['skor'] : 0,
            'total' => $ev ? (int) $ev['total'] : 0,
            'pct' => ($ev && (int) $ev['total'] > 0)
                ? (int) round(((int) $ev['skor'] / (int) $ev['total']) * 100) : null,
            'flagged' => $ev ? (int) $ev['flagged'] : 0,
        ),
    );
}

$gagal = 0;
function cek(string $nama, $dapat, $harap): void
{
    global $gagal;
    if ($dapat === $harap) {
        echo "  OK   $nama = " . var_export($dapat, true) . "\n";
    } else {
        echo "  GAGAL $nama: dapat " . var_export($dapat, true) . ", harap " . var_export($harap, true) . "\n";
        $gagal++;
    }
}

echo "== rekap per pertemuan ==\n";
cek('P1 latihan pct', $rekap[1]['latihan']['pct'], 100);
cek('P1 evaluasi pct', $rekap[1]['evaluasi']['pct'], 42);
cek('P2 latihan pct (parsial)', $rekap[2]['latihan']['pct'], 67);
cek('P3 latihan pct (baris ada, nilai 0)', $rekap[3]['latihan']['pct'], 0);
cek('P5 latihan pct (tidak ada baris)', $rekap[5]['latihan']['pct'], null);
cek('P3 evaluasi pct (belum)', $rekap[3]['evaluasi']['pct'], null);
cek('P4 latihan pct (tak ada latihan)', $rekap[4]['latihan']['pct'], null);
cek('P4 ada_latihan', $rekap[4]['ada_latihan'], false);
cek('P4 ada_tugas', $rekap[4]['ada_tugas'], true);
cek('P3 ada_tugas', $rekap[3]['ada_tugas'], false);

echo "\n== pembeda kunci: 0 sungguhan vs belum dikerjakan ==\n";
// Ini yang membuat notifikasi "skor 0%" tidak muncul untuk soal yang belum
// dijawab (dan sebaliknya tidak muncul juga).
cek('P4 evaluasi sudah dijawab (nilai 0)', $rekap[4]['evaluasi']['pct'], 0);
cek('P3 evaluasi belum dijawab', $rekap[3]['evaluasi']['pct'], null);
$beda = ($rekap[4]['evaluasi']['pct'] === 0) && ($rekap[3]['evaluasi']['pct'] === null);
cek('kedua kasus terbedakan', $beda, true);

echo "\n== aturan notifikasi (ambang 75 / 60) ==\n";
$level = function ($pct) {
    if ($pct === null) return 'aman';
    if ($pct < 60) return 'berat';
    if ($pct < 75) return 'perlu';
    return 'aman';
};
cek('42% -> berat', $level(42), 'berat');
cek('59% -> berat', $level(59), 'berat');
cek('60% -> perlu', $level(60), 'perlu');
cek('74% -> perlu', $level(74), 'perlu');
cek('75% -> aman', $level(75), 'aman');
cek('100% -> aman', $level(100), 'aman');
cek('null -> aman (tidak memunculkan)', $level(null), 'aman');

echo "\n== aturan per jenis pengingat ==\n";
cek('latihan belum tuntas (P3 open)', $rekap[3]['status'] !== 'done', true);
// Tidak ada notifikasi "skor latihan 0%" untuk P3: baris progress-nya ada
// tapi pertemuan belum tuntas, jadi yang tampil cuma "latihan belum tuntas".
cek('P3 tidak memicu notif skor latihan (belum tuntas)', $rekap[3]['status'] === 'done', false);
cek('latihan tuntas (P1 done)', $rekap[1]['status'] === 'done', true);
cek('evaluasi belum pada P1 (tuntas latihan)', $rekap[1]['ada_evaluasi'] && $rekap[1]['evaluasi']['pct'] === null, false);
cek('evaluasi P2 perlu latihan ulang', $level($rekap[2]['evaluasi']['pct']), 'perlu');
cek('evaluasi P1 berat', $level($rekap[1]['evaluasi']['pct']), 'berat');
cek('P5 terkunci -> tidak ada notifikasi', $rekap[5]['status'] === 'locked', true);

echo "\n" . ($gagal === 0
    ? "SEMUA UJI LULUS\n"
    : "$gagal UJI GAGAL\n");
exit($gagal === 0 ? 0 : 1);
