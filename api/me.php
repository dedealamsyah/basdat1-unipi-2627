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
 * `progress` (status open/locked/done) saja tidak cukup: notifikasi berbasis
 * skor butuh angka latihan & evaluasi, dan halaman materi perlu tahu
 * komponen mana yang sudah beres. Logikanya ada di `rekap_mahasiswa()`.
 *
 * DEFENSIF: me.php dipanggil setiap halaman dan jadi sumber kebenaran seluruh
 * UI. Kalau rekap gagal, endpoint tetap harus balas 200 dengan `rekap` kosong —
 * bukan 500. Rilis v2.9.0 sempat mengirim 500 karena satu variabel tak
 * terdefinisi, dan akibatnya bukan sekadar "notifikasi kosong": seluruh portal
 * tampak seperti sudah logout (sidebar kosong), lalu halaman login memuat
 * ulang dirinya sendiri terus-menerus.
 * ------------------------------------------------------------------------- */
$active = active_pertemuan();
$statusMap = status_map($u['nim']);
$rekap = array();
$nilai = null;

try {
    $rekap = rekap_mahasiswa($active, $statusMap, $evaluasi, $tugasStatus, progress_skor($u['nim']));
} catch (Throwable $e) {
    error_log('[me] rekap gagal: ' . $e->getMessage());
    $rekap = array();
}

// Nilai berjalan (kuis 40% + PTS 30% + UAS 30%) untuk kartu nilai di beranda.
// Toleran: tabel `grades` belum ada di instalasi lama -> null, bukan 500.
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