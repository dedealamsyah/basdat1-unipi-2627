<?php
/**
 * Upload / status pengumpulan tugas berkas (PDF) per mahasiswa.
 * GET  /api/upload_tugas.php?pertemuan_id={id}  -> status submit user ini
 * POST /api/upload_tugas.php (multipart: file, pertemuan_id)
 */
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/lib-drive.php';

$u = require_auth();

const TUGAS_MAX_BYTES = 8 * 1024 * 1024; // 8 MB

function tugas_row(PDO $pdo, string $nim, int $pid): ?array
{
    // Self-healing: pastikan tabel ada (setara dengan migrate.php)
    try {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS tugas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nim VARCHAR(24) NOT NULL,
                pertemuan_id INT NOT NULL,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                mime VARCHAR(120) NOT NULL DEFAULT 'application/pdf',
                size INT NOT NULL DEFAULT 0,
                drive_file_id VARCHAR(255) NULL,
                submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_tugas_nim_ptm (nim, pertemuan_id),
                KEY idx_tugas_ptm (pertemuan_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    } catch (Throwable $e) {
        // tabel sudah ada tentunya
    }
    $st = $pdo->prepare(
        'SELECT id, filename, original_name, mime, size, drive_file_id, submitted_at
         FROM tugas WHERE nim = ? AND pertemuan_id = ? LIMIT 1'
    );
    $st->execute(array($nim, $pid));
    $r = $st->fetch();
    return $r !== false ? $r : null;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pid = (int) ($_GET['pertemuan_id'] ?? $_POST['pertemuan_id'] ?? 0);

if ($method === 'GET') {
    $row = $pid > 0 ? tugas_row(db(), $u['nim'], $pid) : null;
    json_out(array('ok' => true, 'data' => $row ? array(
        'pertemuan_id' => $pid,
        'original_name' => $row['original_name'],
        'mime' => $row['mime'],
        'size' => (int) $row['size'],
        'drive_file_id' => $row['drive_file_id'],
        'submitted_at' => $row['submitted_at'],
    ) : null));
}

if ($method !== 'POST') {
    json_out(array('ok' => false, 'error' => 'Metode tidak didukung.'), 405);
}

require_csrf();

if ($pid <= 0) {
    json_out(array('ok' => false, 'error' => 'Pertemuan tidak valid.'), 422);
}

if (!isset($_FILES['file'])) {
    json_out(array('ok' => false, 'error' => 'Pilih berkas PDF terlebih dahulu.'), 422);
}
$f = $_FILES['file'];
if ($f['error'] !== UPLOAD_ERR_OK) {
    $map = array(
        UPLOAD_ERR_INI_SIZE => 'Ukuran berkas melebihi batas server.',
        UPLOAD_ERR_FORM_SIZE => 'Ukuran berkas melebihi 8 MB.',
        UPLOAD_ERR_PARTIAL => 'Berkas hanya terunggah sebagian.',
        UPLOAD_ERR_NO_FILE => 'Pilih berkas PDF terlebih dahulu.',
        UPLOAD_ERR_NO_TMP_DIR => 'Folder sementara server tidak tersedia.',
    );
    json_out(array('ok' => false, 'error' => $map[$f['error']] ?? 'Gagal mengunggah berkas.'), 422);
}
if ($f['size'] > TUGAS_MAX_BYTES || $f['size'] <= 0) {
    json_out(array('ok' => false, 'error' => 'Ukuran maksimal 8 MB.'), 422);
}
$ext = strtolower(pathinfo((string) $f['name'], PATHINFO_EXTENSION));
$mime = (string) $f['type'];
if ($ext !== 'pdf' && !in_array($mime, array('application/pdf', 'application/octet-stream'), true)) {
    json_out(array('ok' => false, 'error' => 'Hanya berkas PDF yang diizinkan.'), 422);
}

$pdo = db();
$old = tugas_row($pdo, $u['nim'], $pid);

$dir = tugas_dir() . '/' . $pid;
if (!is_dir($dir)) {
    @mkdir($dir, 0775, true);
}
$store = sprintf('%d_%s.pdf', time(), bin2hex(random_bytes(6)));
$dest = $dir . '/' . $store;

if (!move_uploaded_file($f['tmp_name'], $dest)) {
    json_out(array('ok' => false, 'error' => 'Server gagal menyimpan berkas.'), 500);
}
@chmod($dest, 0644);

// Unggah ke Google Drive (opsional; tanpa kredensial = tersimpan lokal saja)
$driveId = null;
$folderId = TUGAS_DRIVE_FOLDERS[$pid] ?? '';
if ($folderId !== '') {
    $driveId = gdrive_upload_if_configured($folderId, $dest, (string) $f['name'], 'application/pdf');
}

$pdo->prepare(
    'INSERT INTO tugas (nim, pertemuan_id, filename, original_name, mime, size, drive_file_id, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
        filename = VALUES(filename),
        original_name = VALUES(original_name),
        mime = VALUES(mime),
        size = VALUES(size),
        drive_file_id = VALUES(drive_file_id),
        submitted_at = NOW()'
)->execute(array($u['nim'], $pid, $store, basename((string) $f['name']), 'application/pdf', (int) $f['size'], $driveId));

// Bersihkan berkas lama bila mengganti pengumpulan
if ($old && $old['filename'] !== $store) {
    $oldPath = $dir . '/' . $old['filename'];
    if (is_file($oldPath)) {
        @unlink($oldPath);
    }
}

json_out(array('ok' => true, 'data' => array(
    'pertemuan_id' => $pid,
    'original_name' => basename((string) $f['name']),
    'size' => (int) $f['size'],
    'drive_sent' => $driveId !== null,
    'submitted_at' => date('Y-m-d H:i:s'),
)));