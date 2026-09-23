<?php
/**
 * Pengumpulan tugas via tautan Google Drive.
 *
 * Alur mahasiswa:
 *   1. Unggah berkas ke Google Drive masing-masing.
 *   2. Setel berbagi menjadi "Siapa saja yang memiliki link" (Viewer).
 *   3. Salin tautan lalu tempel di portal.
 *
 * GET  /api/upload_tugas.php?pertemuan_id={id}  -> status submit user ini
 * POST /api/upload_tugas.php  body: { "pertemuan_id": 2, "drive_link": "https://..." }
 *
 * Server memvalidasi format tautan + mengecek apakah file cukup tersedia
 * secara publik (bukan privat). Tidak ada berkas yang disimpan di server.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

$u = require_auth();

const TUGAS_MAX_LINK = 700;

function tugas_row(PDO $pdo, string $nim, int $pid): ?array
{
    tugas_ensure();
    $st = $pdo->prepare(
        'SELECT id, filename, original_name, mime, size, drive_file_id, drive_link, submitted_at
         FROM tugas WHERE nim = ? AND pertemuan_id = ? LIMIT 1'
    );
    $st->execute(array($nim, $pid));
    $r = $st->fetch();
    return $r !== false ? $r : null;
}

/** Ekstrak file id dari tautan Google Drive/Docs. Kembalikan null bila bukan tautan Drive. */
function drive_link_id(string $url): ?string
{
    $u = trim($url);
    if ($u === '') {
        return null;
    }
    if (preg_match('~drive\.google\.com/(?:file/d/|open\?id=|uc\?id=|folderview\?id=)([a-zA-Z0-9_-]{20,})~', $u, $m)) {
        return $m[1];
    }
    if (preg_match('~docs\.google\.com/(?:document|spreadsheets|presentation|forms)/d/([a-zA-Z0-9_-]{20,})~', $u, $m)) {
        return $m[1];
    }
    if (preg_match('~[?&]id=([a-zA-Z0-9_-]{20,})~', $u, $m) && stripos($u, 'google.com') !== false) {
        return $m[1];
    }
    return null;
}

/**
 * Cek apakah file Drive dapat diakses publik (tanpa login), memakai endpoint
 * unduhan publik Google. status: 'public' | 'private' | 'unknown'.
 */
function drive_access(string $fileId): array
{
    if (!function_exists('curl_init')) {
        return array('status' => 'unknown', 'note' => 'Server tidak mendukung cURL.');
    }
    $check = 'https://docs.google.com/uc?export=download&id=' . rawurlencode($fileId);
    $ch = curl_init($check);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 6,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        CURLOPT_HTTPHEADER => array('Accept-Language: id,en-US;q=0.9,en;q=0.8'),
    ));
    $body = curl_exec($ch);
    $errno = curl_errno($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $final = (string) curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    curl_close($ch);
    $body = (string) $body;

    if ($errno !== 0) {
        return array('status' => 'unknown', 'note' => 'Google tidak dapat dijangkau (curl err ' . $errno . ').');
    }
    if (stripos($final, 'accounts.google.com') !== false) {
        return array('status' => 'private', 'note' => 'File masih privat (Google meminta login).');
    }
    if (stripos($body, 'You need access') !== false
        || stripos($body, 'Request access') !== false
        || stripos($body, 'need access') !== false) {
        return array('status' => 'private', 'note' => 'File belum di-share publik.');
    }
    if ($code >= 400) {
        return array('status' => 'private', 'note' => 'Google menolak tautan (HTTP ' . $code . ').');
    }
    return array('status' => 'public', 'note' => 'Akses publik OK.');
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$in = $method === 'POST' ? json_in() : array();
$pid = (int) ($_GET['pertemuan_id'] ?? $in['pertemuan_id'] ?? 0);

if ($method === 'GET') {
    $row = $pid > 0 ? tugas_row(db(), $u['nim'], $pid) : null;
    json_out(array('ok' => true, 'data' => $row ? array(
        'pertemuan_id' => $pid,
        'drive_link' => $row['drive_link'],
        'drive_file_id' => $row['drive_file_id'],
        'access' => $row['drive_link'] ? 'public' : null,
        'original_name' => $row['original_name'],
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

$rawLink = trim((string) ($in['drive_link'] ?? ''));
if ($rawLink === '') {
    json_out(array('ok' => false, 'error' => 'Tempel tautan Google Drive terlebih dahulu.'), 422);
}
$len = function_exists('mb_strlen') ? mb_strlen($rawLink) : strlen($rawLink);
if ($len > TUGAS_MAX_LINK) {
    json_out(array('ok' => false, 'error' => 'Tautan terlalu panjang.'), 422);
}

$fileId = drive_link_id($rawLink);
if (!$fileId) {
    json_out(array('ok' => false, 'error' => 'Tautan bukan dari Google Drive. Gunakan tautan file di drive.google.com/file/d/... atau docs.google.com/.../d/...'), 422);
}

$acc = drive_access($fileId);
if ($acc['status'] === 'private') {
    json_out(array(
        'ok' => false,
        'error' => 'Berkas masih privat. Ubah pengaturan berbagi menjadi "Siapa saja yang memiliki link" lalu salin ulang tautannya.',
        'access' => $acc,
    ), 422);
}

$share = 'https://drive.google.com/file/d/' . $fileId . '/view';
$pdo = db();
tugas_ensure();
$pdo->prepare(
    'INSERT INTO tugas (nim, pertemuan_id, filename, original_name, mime, size, drive_file_id, drive_link, submitted_at)
     VALUES (?, ?, "", ?, "google-drive", 0, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
        original_name = VALUES(original_name),
        mime = VALUES(mime),
        size = 0,
        drive_file_id = VALUES(drive_file_id),
        drive_link = VALUES(drive_link),
        submitted_at = NOW()'
)->execute(array(
    $u['nim'],
    $pid,
    function_exists('mb_substr') ? mb_substr($rawLink, 0, 255) : substr($rawLink, 0, 255),
    $fileId,
    $share,
));

json_out(array('ok' => true, 'data' => array(
    'pertemuan_id' => $pid,
    'drive_link' => $share,
    'drive_file_id' => $fileId,
    'access' => $acc['status'],
    'submitted_at' => date('Y-m-d H:i:s'),
)));