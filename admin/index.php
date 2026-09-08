<?php
/**
 * Pengaman server-side halaman admin.
 * Hanya sesi dengan role admin yang boleh melihat isi panel.
 * Konten statis dibaca dari panel.html (hasil build Astro).
 */
declare(strict_types=1);
require __DIR__ . '/../api/config.php';

$u = current_user();
if (!$u || ($u['role'] ?? '') !== 'admin') {
    header('Location: /login?next=' . urlencode('/admin/') . '&type=admin');
    exit;
}

$html = @file_get_contents(__DIR__ . '/panel.html');
if ($html === false) {
    http_response_code(500);
    echo 'Panel belum tersedia. Hubungi admin sistem.';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
echo $html;