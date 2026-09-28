<?php
/**
 * Uji logika `rekap` di api/config.php tanpa database.
 *
 * PENTING: berkas ini memanggil `rekap_mahasiswa()` yang SESUNGGUHNYA.
 * Versi sebelumnya menyalin logikanya ke dalam tesnya sendiri lalu menguji
 * salinan itu — jadi tesnya selalu lulus meski fungsi aslinya salah. Itulah
 * itulah bug `ada_tugas` yang maknanya terbalik bisa lolos: tes asserting
 * perilaku yang salah, dari kode yang tidak dijalankan sama sekali.
 *
 * Yang dijaga di sini:
 *   - pembeda "belum dikerjakan" (null) vs "dikerjakan dan nilainya 0";
 *   - `ada_tugas` = pertemuan punya kotak tugas (dari TUGAS_SLOT hasil
 *     generate MDX), dan `tugas` = mahasiswa sudah mengirim. Keduanya dulu
 *     tertukar dan `tugas` tidak pernah diisi sama sekali;
 *   - ambang notifikasi 75 / 60;
 *   - kunci evaluasi & kuis terbaca bersama-sama dalam satu request
 *     (kunci.php mendefinisikan EVAL_KUNCI dan KUIS_KUNCI; me.php memakai keduanya,
 *     dan dulu pemanggilannya membuat "Constant already defined").
 */

require __DIR__ . '/../api/config.php';

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
// Hanya P2 yang punya <TugasUpload> di MDX-nya. Di sini P2 dipakai untuk
// kedua sisi: data dikirim (P2) dan belum (P3) — P3 sengaja dipakai walau
// tidak punya slot, karena `$tugasStatus` bisa berisi id yang tak punya kotak
// dan rekap harus tetap melaporkannya apa adanya.
$tugasStatus = array(2 => true, 3 => true);

/** Bungkus sepasang nilai agar pesan kegagalan enak dibaca. */
function nilai(array $r, string $path)
{
    $v = $r;
    foreach (explode('.', $path) as $k) {
        if (!is_array($v) || !array_key_exists($k, $v)) {
            return '<<tidak ada: ' . $path . '>>';
        }
        $v = $v[$k];
    }
    return $v;
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

// ------------------------------------------------------------------ kunci
echo "== kunci evaluation & kuis terbaca bersamaan (satu request) ==\n";
// me.php memanggil eval_kunci() (untuk meta_pertemuan) lalu rekap_mahasiswa()
// yang memanggil kuis_kunci(). Dulu keduanya me-`require` kunci.php sehingga
// pemanggilan kedua melempar ErrorException "Constant EVAL_KUNCI already
// defined", dan me.php menelan exception itu -> rekap terkirim sebagai [].
$adaEval = array();
$adaKuis = array();
for ($pid = 1; $pid <= 10; $pid++) {
    if (eval_kunci($pid) !== null) {
        $adaEval[] = $pid;
    }
    if (kuis_kunci($pid) !== null) {
        $adaKuis[] = $pid;
    }
}
cek('bank evaluasi terbaca', $adaEval, array(1, 2, 3, 4, 5, 6, 7, 9, 10));
cek('bank kuis latihan terbaca', $adaKuis, array(1, 2, 3, 4, 5, 6, 7, 9, 10));
cek('TUGAS_SLOT terbaca dari MDX', array_keys(tugas_slot_map()), array(2));

// ------------------------------------------------------------------ rekap
$rekap = rekap_mahasiswa($active, $statusMap, $evaluasi, $tugasStatus, $skorLatihan);

echo "\n== rekap per pertemuan ==\n";
cek('P1 latihan pct', nilai($rekap[1], 'latihan.pct'), 100);
cek('P1 evaluasi pct', nilai($rekap[1], 'evaluasi.pct'), 42);
cek('P2 latihan pct (parsial)', nilai($rekap[2], 'latihan.pct'), 67);
cek('P3 latihan pct (baris ada, nilai 0)', nilai($rekap[3], 'latihan.pct'), 0);
cek('P5 latihan pct (tidak ada baris)', nilai($rekap[5], 'latihan.pct'), null);
cek('P3 evaluasi pct (belum)', nilai($rekap[3], 'evaluasi.pct'), null);
cek('P4 latihan pct (tak ada latihan)', nilai($rekap[4], 'latihan.pct'), null);
cek('P4 ada_evaluasi', nilai($rekap[4], 'ada_evaluasi'), true);
cek('P8 tidak punya bank evaluasi', in_array(8, $adaEval, true), false);

echo "\n== ada_tugas vs tugas (BUG LAMA: keduanya tertukar) ==\n";
cek('P2 ada_tugas (punya kotak tugas)', nilai($rekap[2], 'ada_tugas'), true);
cek('P2 tugas (sudah dikirim)', nilai($rekap[2], 'tugas'), true);
// P1/P3/P4/P5 tidak punya <TugasUpload> di MDX-nya sama sekali.
cek('P1 tidak punya slot tugas', nilai($rekap[1], 'ada_tugas'), false);
cek('P4 tidak punya slot tugas', nilai($rekap[4], 'ada_tugas'), false);
cek('P5 tidak punya slot tugas', nilai($rekap[5], 'ada_tugas'), false);
// Ada kiriman untuk P3 tapi P3 tidak punya kotak -> chip tidak boleh muncul,
// walau `tugas` = true.
cek('P3 ada_tugas tetap false walau ada kiriman', nilai($rekap[3], 'ada_tugas'), false);
cek('P3 tugas tetap true (data apa adanya)', nilai($rekap[3], 'tugas'), true);
// BUG LAMA: ada_tugas dihitung dari "sudah mengirim", jadi chip Tugas hanya
// muncul SESUDAH mahasiswa mengirim — persis kebalikannya.
$munculSebelumKirim = nilai($rekap[1], 'ada_tugas');
cek('P1 tanpa slot tugas tidak menampilkan chip', $munculSebelumKirim, false);

echo "\n== pembeda kunci: 0 sungguhan vs belum dikerjakan ==\n";
// Ini yang membuat notifikasi "skor 0%" tidak muncul untuk soal yang belum
// dijawab (dan sebaliknya tidak muncul juga).
cek('P4 evaluasi sudah dijawab (nilai 0)', nilai($rekap[4], 'evaluasi.pct'), 0);
cek('P3 evaluasi belum dijawab', nilai($rekap[3], 'evaluasi.pct'), null);
$beda = (nilai($rekap[4], 'evaluasi.pct') === 0) && (nilai($rekap[3], 'evaluasi.pct') === null);
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
cek('latihan belum tuntas (P3 open)', nilai($rekap[3], 'status') !== 'done', true);
// Tidak ada notifikasi "skor latihan 0%" untuk P3: baris progress-nya ada
// tapi pertemuan belum tuntas, jadi yang tampil cuma "latihan belum tuntas".
cek('P3 tidak memicu notif skor latihan (belum tuntas)', nilai($rekap[3], 'status') === 'done', false);
cek('latihan tuntas (P1 done)', nilai($rekap[1], 'status') === 'done', true);
cek('evaluasi belum pada P1 (tuntas latihan)', nilai($rekap[1], 'ada_evaluasi') && nilai($rekap[1], 'evaluasi.pct') === null, false);
cek('evaluasi P2 perlu latihan ulang', $level(nilai($rekap[2], 'evaluasi.pct')), 'perlu');
cek('evaluasi P1 berat', $level(nilai($rekap[1], 'evaluasi.pct')), 'berat');
cek('P5 terkunci -> tidak ada notifikasi', nilai($rekap[5], 'status') === 'locked', true);

echo "\n== rekap tidak kosong (kasus me.php dulu 500-yang-di-swallow) ==\n";
cek('jumlah entry rekap = jumlah pertemuan aktif', count($rekap), count($active));
cek('semua id ada', array_keys($rekap), $active);

echo "\n" . ($gagal === 0
    ? "SEMUA UJI LULUS\n"
    : "$gagal UJI GAGAL\n");
exit($gagal === 0 ? 0 : 1);
