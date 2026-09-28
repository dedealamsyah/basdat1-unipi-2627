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

json_out(array('ok' => true, 'data' => array(
    'logged_in' => true,
    'user' => $u,
    'progress' => status_map($u['nim']),
    'evaluasi' => $evaluasi,
    'tugas' => $tugasStatus,
    'active' => active_pertemuan(),
    'must_change_password' => $mustChange,
    'csrf' => $_SESSION['csrf'] ?? '',
)));