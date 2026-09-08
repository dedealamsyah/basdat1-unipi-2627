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

json_out(array('ok' => true, 'data' => array(
    'logged_in' => true,
    'user' => $u,
    'progress' => status_map($u['nim']),
    'active' => active_pertemuan(),
    'must_change_password' => $mustChange,
    'csrf' => $_SESSION['csrf'] ?? '',
)));