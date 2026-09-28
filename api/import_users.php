<?php
/**
 * Admin: impor akun mahasiswa massal.
 * POST /api/import_users.php
 * body (JSON): {
 *    "token": "tidak wajib",
 *    "reset_password": false,
 *    "users": [
 *        { "nim": "22104001", "nama": "Faris Alamsyah", "kelas": "IF3A" },
 *        ...
 *    ]
 * }
 * -- ATAU -- text/plain baris per baris: "nim,nama,kelas"
 * Default password = NIM (dapat diubah admin/mahasiswa nantinya).
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_out(array('ok' => false, 'error' => 'Gunakan POST.'), 405);
}

require_auth('admin');
require_csrf();

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$resetPassword = isset($_GET['reset']) && $_GET['reset'] === '1';
$users = array();

if (strpos($contentType, 'application/json') !== false) {
    $in = json_in();
    $resetPassword = $resetPassword || !empty($in['reset_password']);
    $users = isset($in['users']) && is_array($in['users']) ? $in['users'] : array();
} else {
    // format text: "nim,nama,kelas" per baris
    $raw = file_get_contents('php://input');
    foreach (preg_split('/\r\n|\r|\n/', trim((string) $raw)) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }
        // `$escape` ("\\") ditulis eksplisit. Tanpa itu PHP 8.4+ memunculkan
        // deprecation, dan karena config.php elevate semua warning jadi
        // exception, satu deprecation cukup untuk membalas 500 — artinya
        // impor CSV mati total di hosting yang sudah upgraded.
        $parts = str_getcsv($line, ',', '"', '\\');
        if (count($parts) >= 2) {
            $users[] = array(
                'nim' => trim($parts[0]),
                'nama' => trim($parts[1]),
                'kelas' => trim($parts[2] ?? ''),
            );
        }
    }
}

if (empty($users)) {
    json_out(array('ok' => false, 'error' => 'Tidak ada data mahasiswa untuk diimpor.'), 422);
}

// validasi
$pdo = db();
$pdo->beginTransaction();

$selUser = $pdo->prepare('SELECT pass_hash, role FROM users WHERE nim = ?');
$insUser = $pdo->prepare('INSERT INTO users (nim, nama, kelas, role, pass_hash, must_change_password) VALUES (?, ?, ?, "mahasiswa", ?, 1)');
$updUser = $pdo->prepare('UPDATE users SET nama = ?, kelas = ? WHERE nim = ? AND role <> "admin"');
$updHash = $pdo->prepare('UPDATE users SET pass_hash = ?, must_change_password = 1 WHERE nim = ? AND role <> "admin"');

$imported = 0;
$updated = 0;
$ditolak = 0;
foreach ($users as $u) {
    $nim = trim((string) ($u['nim'] ?? ''));
    $nama = trim((string) ($u['nama'] ?? ''));
    if ($nim === '' || $nama === '') {
        continue;
    }
    $kelas = trim((string) ($u['kelas'] ?? ''));

    $selUser->execute(array($nim));
    $existing = $selUser->fetch();

    if ($existing && ($existing['role'] ?? '') === 'admin') {
        /* Lewati akun admin. Daftar impor adalah daftar MAHASISWA; tanpa
           penjaga ini satu baris `admin,Nama Baru,IF3A` menimpa nama & kelas
           akun admin, dan dengan `?reset=1` juga me-reset passwordnya jadi
           password_hash('admin') — dilaporkan hanya sebagai
           `updated_existing: 1`, jadi kelihatannya seperti impor biasa. */
        $ditolak++;
        continue;
    }

    if ($existing) {
        // update identitas
        $updUser->execute(array($nama, $kelas, $nim));
        // reset password bila diminta, atau perbaiki pass_hash 'KEEP' hasil bug lama
        if ($resetPassword || $existing['pass_hash'] === 'KEEP') {
            $updHash->execute(array(password_hash($nim, PASSWORD_DEFAULT), $nim));
        }
        $updated++;
    } else {
        // akun baru, password awal = NIM
        $insUser->execute(array($nim, $nama, $kelas, password_hash($nim, PASSWORD_DEFAULT)));
        $imported++;
    }
}
$pdo->commit();

json_out(array('ok' => true, 'data' => array(
    'imported' => $imported,
    'updated_existing' => $updated,
    'ditolak_admin' => $ditolak,
    'default_password' => 'NIM masing-masing',
)));