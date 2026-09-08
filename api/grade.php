<?php
/**
 * Admin: input nilai manual mahasiswa.
 * POST /api/grade.php  body: { "nim": "...", "komponen": "pts|uas|tugas|hadir", "nilai": 0-100 }
 * Hapus nilai dgn mengirim nilai = -1 (set NULL).
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
$komponen = (string) ($in['komponen'] ?? '');
$nilai = (int) ($in['nilai'] ?? -2);

if ($nim === '' || !in_array($komponen, array('pts', 'uas', 'tugas', 'hadir'), true)) {
    json_out(array('ok' => false, 'error' => 'nim / komponen tidak valid.'), 422);
}

$pdo = db();
if ($nilai < 0) {
    $pdo->prepare('DELETE FROM grades WHERE nim = ? AND komponen = ?')
        ->execute(array($nim, $komponen));
} else {
    if ($nilai > 100) {
        json_out(array('ok' => false, 'error' => 'Nilai maksimal 100.'), 422);
    }
    $pdo->prepare(
        'INSERT INTO grades (nim, komponen, nilai) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)'
    )->execute(array($nim, $komponen, $nilai));
}

json_out(array('ok' => true, 'data' => array(
    'nim' => $nim,
    'nilai' => compute_nilai($nim),
)));