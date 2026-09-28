<?php
/**
 * Info sesi saat ini + status progresi.
 * GET /api/me.php
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

$u = current_user();
if (!$u) {
    json_out(array('ok' => true, 'data' => array(
        'logged_in' => false,
        'user' => null,
        'progress' => new stdClass(),
        'evaluasi' => new stdClass(),
        'active' => array(),
    )));
}

// ambil status kewajiban ganti password (toleran bila kolom belum termigrasi)
$mustChange = false;
try {
    $st = db()->prepare('SELECT must_change_password FROM users WHERE nim = ? LIMIT 1');
    $st->execute(array($u['nim']));
    $row = $st->fetch();
    $mustChange = $row ? (bool) $row['must_change_password'] : false;
} catch (Throwable $e) {
    $mustChange = false;
}

// hasil evaluasi (toleran bila tabel belum termigrasi)
$evaluasi = array();
try {
    $evaluasi = evaluasi_rows($u['nim']);
} catch (Throwable $e) {
    $evaluasi = array();
}

// Tambahkan status tugas per pertemuan untuk notifikasi
$tugasStatus = array();
try {
    $st = db()->prepare('SELECT pertemuan_id FROM tugas WHERE nim = ?');
    $st->execute(array($u['nim']));
    foreach ($st as $r) {
        $tugasStatus[(int)$r['pertemuan_id']] = true;
    }
} catch (Throwable $e) {
    $tugasStatus = array();
}

// Ambil metadata pertemuan untuk mengetahui mana yang punya evaluasi/tugas
$metaPertemuan = array();
try {
    $rows = db()->query('SELECT id, bobot FROM pertemuan WHERE aktif = 1')->fetchAll();
    foreach ($rows as $r) {
        $pid = (int)$r['id'];
        // Asumsi sederhana: jika bobot > 0 atau ada kriteria tertentu, 
        // tapi di portal ini biasanya evaluasi ada jika kuncinya ada.
        $metaPertemuan[$pid] = array(
            'has_evaluasi' => eval_kunci($pid) !== null,
            'has_tugas' => true // Mayoritas pertemuan di portal ini memiliki slot tugas Drive
        );
    }
} catch (Throwable $e) {}

/* ---------------------------------------------------------------------------
 * Rekap per pertemuan (v2.9.0) — dasar UI mahasiswa: lonceng notifikasi,
 * kartu "Perlu perhatian" di beranda, dan strip status di halaman materi.
 *
 * `progress` (status open/locked/done) saja tidak cukup untuk itu: notifikasi
 * berbasis skor butuh angka latihan & evaluasi, dan halaman materi perlu tahu
 * komponen mana yang sudah beres.
 * ------------------------------------------------------------------------- */
$skorLatihan = array();
try {
    $st = db()->prepare('SELECT pertemuan_id, quiz_score, quiz_total FROM progress WHERE nim = ?');
    $st->execute(array($u['nim']));
    foreach ($st as $r) {
        $skorLatihan[(int) $r['pertemuan_id']] = array(
            'skor' => (int) $r['quiz_score'],
            'total' => (int) $r['quiz_total'],
        );
    }
} catch (Throwable $e) {
    $skorLatihan = array();
}

$rekap = array();
$statusMap = status_map($u['nim']);
foreach ($active as $pid) {
    $lat = isset($skorLatihan[$pid]) ? $skorLatihan[$pid] : null;
    $ev = isset($evaluasi[$pid]) ? $evaluasi[$pid] : null;
    $rekap[$pid] = array(
        'status' => $statusMap[$pid] ?? 'locked',
        'ada_latihan' => kuis_kunci($pid) !== null,
        'ada_evaluasi' => eval_kunci($pid) !== null,
        'ada_tugas' => !empty($tugasStatus[$pid]),
        'latihan' => array(
            'skor' => $lat ? $lat['skor'] : 0,
            'total' => $lat ? $lat['total'] : 0,
            // null (bukan 0) bila belum ada latihan sama sekali — pembeda
            // penting: "belum dikerjakan" ≠ "dikerjakan dan nilainya 0".
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

// Nilai berjalan (kuis 40% + PTS 30% + UAS 30%) untuk kartu nilai di beranda.
// Toleran: tabel `grades` belum ada di instalasi lama -> null, bukan 500.
$nilai = null;
try {
    $nilai = compute_nilai($u['nim']);
} catch (Throwable $e) {
    $nilai = null;
}

json_out(array('ok' => true, 'data' => array(
    'logged_in' => true,
    'user' => $u,
    'progress' => $statusMap,
    'evaluasi' => $evaluasi,
    'tugas' => $tugasStatus,
    'meta_pertemuan' => $metaPertemuan,
    'rekap' => $rekap,
    'nilai' => $nilai,
    'active' => $active,
    'must_change_password' => $mustChange,
    'csrf' => $_SESSION['csrf'] ?? '',
)));