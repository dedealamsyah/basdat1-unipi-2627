<?php
/**
 * Admin: hapus akun mahasiswa.
 * POST /api/delete_user.php  body: { "nim": "..." }
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_out(array('ok' => false, 'error' => 'Gunakan POST.'), 405);
}

require_auth('admin');
$in = json_in();
$nim = trim((string) ($in['nim'] ?? ''));

if ($nim === '') {
    json_out(array('ok' => false, 'error' => 'nim wajib diisi.'), 422);
}
if (strtolower($nim) === ADMIN_DEFAULT_NIM || strtolower($nim) === 'admin') {
    json_out(array('ok' => false, 'error' => 'Akun admin tidak boleh dihapus.'), 422);
}

$pdo = db();
$pdo->beginTransaction();
$pdo->prepare('DELETE FROM progress WHERE nim = ?')->execute(array($nim));
$pdo->prepare('DELETE FROM users WHERE nim = ?')->execute(array($nim));
$deleted = $pdo->prepare('SELECT ROW_COUNT()');
$pdo->commit();

json_out(array('ok' => true, 'data' => array('deleted' => true, 'nim' => $nim)));