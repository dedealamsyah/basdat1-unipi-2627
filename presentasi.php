<?php
/**
 * Mode Presentasi Dosen - gate sisi server.
 * Keputusan akses diambil dari sesi (role admin) di server, BUKAN dari
 * fetch /api/me.php di sisi klien. Ini menghindari ketergantungan pada
 * challenge anti-bot hosting yang bisa membuat gate macet.
 *
 * URL: /presentasi.php?p={id_pertemuan}
 * Konten HTML dibaca dari hasil build statis per pertemuan.
 */
declare(strict_types=1);
require __DIR__ . '/api/config.php';

$id = (int) ($_GET['p'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    exit('Perlu parameter p (id pertemuan).');
}

$file = __DIR__ . '/pertemuan/' . $id . '/presentasi/index.html';
if (!is_file($file)) {
    http_response_code(404);
    exit('Halaman presentasi tidak ditemukan.');
}

$u = current_user();
$isAdmin = $u !== null && ($u['role'] ?? '') === 'admin';
$next = '/login?next=' . urlencode('/presentasi.php?p=' . $id . '');

// Suntikkan keputusan akses server sebelum dipakai skrip halaman.
$inject = $isAdmin
    ? '<script>window.__PRES_GATE="ok";</script>'
    : '<script>window.__PRES_GATE="no";window.__PRES_NEXT=' . json_encode($next) . ';</script>';

$html = file_get_contents($file);
$html = str_replace('</head>', $inject . '</head>', $html);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
echo $html;