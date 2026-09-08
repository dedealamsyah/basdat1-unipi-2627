<?php
/**
 * Login mahasiswa/admin.
 * POST /api/login.php  body: { "username": "...", "password": "..." }
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_out(array('ok' => false, 'error' => 'Gunakan POST.'), 405);
}

$in = json_in();
$username = strtolower(trim((string) ($in['username'] ?? '')));
$password = (string) ($in['password'] ?? '');

if ($username === '' || $password === '') {
    json_out(array('ok' => false, 'error' => 'NIM/NIP dan password wajib diisi.'), 422);
}

// Rate-limit brute force
if (login_too_many($username)) {
    json_out(array(
        'ok' => false,
        'error' => 'Terlalu banyak percobaan login. Coba lagi nanti.',
    ), 429);
}

try {
    $st = db()->prepare('SELECT nim, nama, kelas, role, pass_hash, must_change_password FROM users WHERE LOWER(nim) = ? LIMIT 1');
    $st->execute(array($username));
    $user = $st->fetch();
} catch (Throwable $e) {
    // kompatibilitas: kolom must_change_password belum dimigrasi
    $st = db()->prepare('SELECT nim, nama, kelas, role, pass_hash FROM users WHERE LOWER(nim) = ? LIMIT 1');
    $st->execute(array($username));
    $user = $st->fetch();
    if ($user) { $user['must_change_password'] = 0; }
}

if (!$user || !password_verify($password, $user['pass_hash'])) {
    login_log_fail($username);
    usleep(400000); // perlambat enumerasi
    json_out(array('ok' => false, 'error' => 'NIM/NIP atau password salah.'), 401);
}

login_log_clear($username);

start_session();
session_regenerate_id(true);
$_SESSION['user'] = array(
    'nim' => $user['nim'],
    'nama' => $user['nama'],
    'kelas' => $user['kelas'],
    'role' => $user['role'],
);

json_out(array(
    'ok' => true,
    'data' => array(
        'user' => array(
            'nim' => $user['nim'],
            'nama' => $user['nama'],
            'kelas' => $user['kelas'],
            'role' => $user['role'],
        ),
        'must_change_password' => (bool) $user['must_change_password'],
        'progress' => status_map($user['nim']),
    ),
));