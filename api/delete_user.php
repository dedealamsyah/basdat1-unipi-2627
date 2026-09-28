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
require_csrf();
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
// Hapus seluruh data yang menempel pada NIM. `evaluasi`/`tugas` mungkin belum
// ada (belum termigrasi) — itu ditoleransi agar penghapusan akun tetap jalan.
// Nama tabel berasal dari literal di bawah (bukan input pengguna).
$tables = array('progress', 'grades', 'evaluasi', 'tugas');
foreach ($tables as $t) {
    try {
        $pdo->prepare('DELETE FROM ' . $t . ' WHERE nim = ?')->execute(array($nim));
    } catch (Throwable $e) {
        // tabel belum ada -> abaikan
    }
}
$pdo->prepare('DELETE FROM users WHERE nim = ?')->execute(array($nim));
$pdo->commit();

json_out(array('ok' => true, 'data' => array('deleted' => true, 'nim' => $nim)));