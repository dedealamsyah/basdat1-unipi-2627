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

$st = db()->prepare('SELECT nim, nama, kelas, role, pass_hash FROM users WHERE LOWER(nim) = ? LIMIT 1');
$st->execute(array($username));
$user = $st->fetch();

if (!$user || !password_verify($password, $user['pass_hash'])) {
    json_out(array('ok' => false, 'error' => 'NIM/NIP atau password salah.'), 401);
}

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
        'progress' => status_map($user['nim']),
    ),
));