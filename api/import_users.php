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
        $parts = str_getcsv($line);
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

$selUser = $pdo->prepare('SELECT pass_hash FROM users WHERE nim = ?');
$insUser = $pdo->prepare('INSERT INTO users (nim, nama, kelas, role, pass_hash, must_change_password) VALUES (?, ?, ?, "mahasiswa", ?, 1)');
$updUser = $pdo->prepare('UPDATE users SET nama = ?, kelas = ? WHERE nim = ?');
$updHash = $pdo->prepare('UPDATE users SET pass_hash = ?, must_change_password = 1 WHERE nim = ?');

$imported = 0;
$updated = 0;
foreach ($users as $u) {
    $nim = trim((string) ($u['nim'] ?? ''));
    $nama = trim((string) ($u['nama'] ?? ''));
    if ($nim === '' || $nama === '') {
        continue;
    }
    $kelas = trim((string) ($u['kelas'] ?? ''));

    $selUser->execute(array($nim));
    $existing = $selUser->fetch();

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
    'default_password' => 'NIM masing-masing',
)));