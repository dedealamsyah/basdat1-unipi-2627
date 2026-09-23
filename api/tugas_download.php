<?php
/**
 * Buka pengumpulan tugas mahasiswa — khusus admin.
 * GET /api/tugas_download.php?id={row_id}
 *
 * Pengumpulan baru berbentuk tautan Google Drive -> redirect ke tautan tsb.
 * Pengumpulan lama (versi berkas PDF di server) tetap bisa diunduh lokal.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

require_auth('admin');

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    exit('id diperlukan');
}

$st = db()->prepare(
    'SELECT t.nim, t.pertemuan_id, t.filename, t.original_name, t.mime, t.drive_link, u.nama
     FROM tugas t JOIN users u ON u.nim = t.nim
     WHERE t.id = ?'
);
$st->execute(array($id));
$r = $st->fetch();
if (!$r) {
    http_response_code(404);
    exit('Tidak ditemukan.');
}

// Mode baru: tautan Google Drive
if (!empty($r['drive_link'])) {
    header('Location: ' . $r['drive_link']);
    exit;
}

// Mode lama: berkas PDF tersimpan di server
$path = tugas_dir() . '/' . (int) $r['pertemuan_id'] . '/' . $r['filename'];
if (!is_file($path)) {
    http_response_code(404);
    exit('Berkas tidak ada di server.');
}

$safe = $r['original_name'];
if (preg_match('/[^\x20-\x7E]/', $safe)) {
    $safe = 'tugas_' . $r['pertemuan_id'] . '_' . $r['nim'] . '.pdf';
}

header('Content-Type: ' . ($r['mime'] ?: 'application/pdf'));
header('Content-Length: ' . (string) filesize($path));
header('Content-Disposition: attachment; filename="' . addslashes($safe) . '"');
header('X-Content-Type-Options: nosniff');
readfile($path);
exit;