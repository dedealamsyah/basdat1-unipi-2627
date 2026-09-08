<?php
/**
 * Ganti password (mahasiswa & admin, wajib saat must_change_password).
 * POST /api/change_password.php
 * body: { "old_password": "...", "new_password": "..." }
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_out(array('ok' => false, 'error' => 'Gunakan POST.'), 405);
}

$u = require_auth();
require_csrf();

$in = json_in();
$oldPass = (string) ($in['old_password'] ?? '');
$newPass = (string) ($in['new_password'] ?? '');

if ($oldPass === '' || $newPass === '') {
    json_out(array('ok' => false, 'error' => 'Password lama dan baru wajib diisi.'), 422);
}
if (strlen($newPass) < 8) {
    json_out(array('ok' => false, 'error' => 'Password baru minimal 8 karakter.'), 422);
}
if ($newPass === $oldPass) {
    json_out(array('ok' => false, 'error' => 'Password baru tidak boleh sama dengan yang lama.'), 422);
}

$st = db()->prepare('SELECT pass_hash, nim FROM users WHERE nim = ? LIMIT 1');
$st->execute(array($u['nim']));
$row = $st->fetch();
if (!$row || !password_verify($oldPass, $row['pass_hash'])) {
    usleep(400000);
    json_out(array('ok' => false, 'error' => 'Password lama salah.'), 401);
}

db()->prepare('UPDATE users SET pass_hash = ?, must_change_password = 0 WHERE nim = ?')
    ->execute(array(password_hash($newPass, PASSWORD_DEFAULT), $u['nim']));

// regenerate sesi agar lama tidak dipakai
start_session();
session_regenerate_id(true);
$_SESSION['user'] = array(
    'nim' => $u['nim'],
    'nama' => $u['nama'],
    'kelas' => $u['kelas'],
    'role' => $u['role'],
);

json_out(array('ok' => true, 'data' => array('changed' => true)));