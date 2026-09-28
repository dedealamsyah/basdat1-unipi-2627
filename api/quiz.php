<?php
/**
 * Penilaian kuis LATIHAN (server-graded, v2.8.0).
 *
 * GET  /api/quiz.php?pertemuan_id=N
 *   -> jawaban yang sudah dinilai pada sesi ini (halaman memakainya untuk
 *      memulihkan tampilan setelah reload). Tanpa efek samping, jadi tidak
 *      butuh token CSRF.
 *
 * POST /api/quiz.php  body: {
 *   pertemuan_id,
 *   jawaban: { "q1": 2, "q2": 0 }   // id soal => indeks opsi yang diklik
 * }
 *
 * PENTING: yang dikirim client HANYA pilihan yang diklik. Skor dan status
 * tuntas dihitung server dari kunci di `api/kunci.php`; tidak ada lagi
 * `quiz_score` dari client yang dipercaya (bug yang ditutup di v2.8.0 —
 * sebelumnya `complete.php` menerimanya apa adanya). Kunci jawaban tidak
 * pernah masuk HTML.
 *
 * Aturan jawaban pertama: untuk tiap soal, pilihan pertama yang dikirim
 * dihitung lalu dikunci di sesi server. Mengulang-klik opsi lain tidak
 * mengubah nilai yang akan tercatat.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

/**
 * Hitung hasil penilaian dari peta jawaban yang sudah dikunci.
 *
 * @param array  $kunci    KUIS_KUNCI[pid] dari api/kunci.php
 * @param array  $terkunci peta qid => indeks opsi terkunci
 * @param int    $pid      id pertemuan
 * @param string $nim      NIM mahasiswa
 * @param bool   $tulis    true bila boleh menulis tabel `progress`
 */
function kuis_hasil(array $kunci, array $terkunci, int $pid, string $nim, bool $tulis): array
{
    $hasil = kuis_nilai($pid, $terkunci);
    if ($hasil === null) {
        json_out(array('ok' => false, 'error' => 'Gagal menghitung nilai latihan.'), 500);
    }

    // Rinci per soal: pilihan mahasiswa + penilaian + penjelasan. Indeks
    // jawaban BENAR tidak pernah ikut dikirim ke browser.
    $results = array();
    foreach ($kunci['id'] as $i => $qid) {
        if (!array_key_exists($qid, $terkunci)) {
            continue;
        }
        $results[$qid] = array(
            'opt' => (int) $terkunci[$qid],
            'benar' => (bool) $hasil['rinci'][$qid],
            'jelas' => (string) ($kunci['jelas'][$i] ?? ''),
        );
    }

    if ($hasil['tuntas'] && $tulis) {
        kuis_catat_tuntas($nim, $pid, $hasil['jumlah']);
    }

    return array(
        'results' => $results,
        'benar' => $hasil['benar'],
        'tertawab' => $hasil['tertawab'],
        'total' => $hasil['jumlah'],
        'tuntas' => $hasil['tuntas'],
        'progress' => status_map($nim),
    );
}

/**
 * Catat pertemuan sebagai tuntas dengan nilai penuh (jumlah/jumlah).
 *
 * Angka yang pernah tercatat tidak berubah: seperti `complete.php` lama,
 * baris `progress` hanya ditulis saat semua kuis benar, dan skornya penuh.
 * `attempts` bertambah sekali per penyelesaian (percobaan ulang tidak
 * menggagalkan nilai, tapi jumlahnya terlihat di panel admin).
 */
function kuis_catat_tuntas(string $nim, int $pid, int $jumlah): void
{
    $pdo = db();
    $ada = $pdo->prepare('SELECT status FROM progress WHERE nim = ? AND pertemuan_id = ? LIMIT 1');
    $ada->execute(array($nim, $pid));
    if ($ada->fetch()) {
        return; // sudah tercatat; jangan menggembungkan attempts tiap klik
    }

    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            'INSERT INTO progress (nim, pertemuan_id, status, quiz_score, quiz_total, attempts, completed_at)
             VALUES (?, ?, "done", ?, ?, 1, NOW())'
        )->execute(array($nim, $pid, $jumlah, $jumlah));
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e; // ditangani handler global: JSON 500 tanpa detail internal
    }
}

/* ========================================================================== */

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($metode !== 'GET' && $metode !== 'POST') {
    json_out(array('ok' => false, 'error' => 'Gunakan GET atau POST.'), 405);
}

$u = require_auth();
if (($u['role'] ?? '') === 'admin') {
    json_out(array('ok' => false, 'error' => 'Mode admin: nilai latihan tidak disimpan.'), 403);
}

$in = array();
$pertemuanId = (int) ($_GET['pertemuan_id'] ?? 0);
if ($metode === 'POST') {
    require_csrf();
    $in = json_in();
    $pertemuanId = (int) ($in['pertemuan_id'] ?? 0);
}
if ($pertemuanId < 1) {
    json_out(array('ok' => false, 'error' => 'pertemuan_id tidak valid.'), 422);
}

$kunci = kuis_kunci($pertemuanId);
if ($kunci === null) {
    json_out(array('ok' => false, 'error' => 'Kunci latihan belum tersedia di server. Hubungi dosen.'), 503);
}
$ids = $kunci['id'];
$banyakOpsi = $kunci['opsi'];
$jumlahSoal = count($ids);

start_session();
if (!isset($_SESSION['kuis']) || !is_array($_SESSION['kuis'])) {
    $_SESSION['kuis'] = array();
}
if (!isset($_SESSION['kuis'][$pertemuanId]) || !is_array($_SESSION['kuis'][$pertemuanId])) {
    $_SESSION['kuis'][$pertemuanId] = array();
}
$terkunci = $_SESSION['kuis'][$pertemuanId];

/* --- GET: baca saja jawaban yang sudah dinilai ---------------------------- */
if ($metode === 'GET') {
    json_out(array('ok' => true, 'data' => kuis_hasil($kunci, $terkunci, $pertemuanId, $u['nim'], false)));
}

/* --- POST: validasi jawaban baru ------------------------------------------ */
$jawaban = isset($in['jawaban']) && is_array($in['jawaban']) ? $in['jawaban'] : array();
if (count($jawaban) > $jumlahSoal) {
    json_out(array('ok' => false, 'error' => 'Terlalu banyak jawaban.'), 422);
}

$baru = array();
foreach ($jawaban as $qid => $pilih) {
    $qid = (string) $qid;
    $i = array_search($qid, $ids, true);
    if ($i === false) {
        json_out(array('ok' => false, 'error' => 'Id soal tidak dikenal.'), 422);
    }
    if (array_key_exists($qid, $terkunci)) {
        continue; // sudah dijawab: yang pertama yang berlaku
    }
    if (!is_int($pilih) && !(is_string($pilih) && ctype_digit($pilih))) {
        json_out(array('ok' => false, 'error' => 'Pilihan tidak valid.'), 422);
    }
    $pilih = (int) $pilih;
    $nOpsi = (int) ($banyakOpsi[$i] ?? 0);
    if ($pilih < 0 || $pilih >= $nOpsi) {
        json_out(array('ok' => false, 'error' => 'Pilihan di luar rentang.'), 422);
    }
    $baru[$qid] = $pilih;
}

// Akses diperiksa SEBELUM jawaban dikunci di sesi: Respon 422 di bawah tidak
// boleh meninggalkan jawaban yang sebenarnya ditolak.
$aktif = active_pertemuan();
if (!in_array($pertemuanId, $aktif, true)) {
    json_out(array('ok' => false, 'error' => 'Pertemuan belum tersedia.'), 422);
}
$map = status_map($u['nim']);
if (($map[$pertemuanId] ?? 'locked') === 'locked') {
    json_out(array('ok' => false, 'error' => 'Selesaikan pertemuan sebelumnya terlebih dahulu.'), 422);
}

if (count($baru) > 0) {
    $terkunci = array_merge($terkunci, $baru);
    $_SESSION['kuis'][$pertemuanId] = $terkunci;
}

json_out(array('ok' => true, 'data' => kuis_hasil($kunci, $terkunci, $pertemuanId, $u['nim'], true)));
