<?php
/**
 * Admin: input nilai manual mahasiswa.
 * POST /api/grade.php  body: { "nim": "...", "komponen": "pts|uas|tugas|hadir", "nilai": 0-100 }
 * Hapus nilai dgn mengirim nilai = -1 (hapus baris).
 * Field `nilai` wajib ada: tanpa itu permintaan ditolak 422, bukan dianggap
 * "hapus" — kalau tidak, body yang terpotong diam-diam menghapus nilai.
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

if ($nim === '' || !in_array($komponen, array('pts', 'uas', 'tugas', 'hadir'), true)) {
    json_out(array('ok' => false, 'error' => 'nim / komponen tidak valid.'), 422);
}

/* `nilai` WAJIB ada. Sebelumnya `?? -2` dipakai bersama tes `$nilai < 0`,
   sehingga "nilai tidak terkirim" (body terpotong, bug klien) ikut berarti
   "hapus nilai" — operações destruktif yang membalas 200 ok. Dua makna itu
   kini dipisahkan: -1 = hapus (sengaja), tanpa field = tolak. */
if (!array_key_exists('nilai', $in)) {
    json_out(array('ok' => false, 'error' => 'Field "nilai" wajib dikirim.'), 422);
}
$nilai = (int) $in['nilai'];

$pdo = db();
if ($nilai === -1) {
    $pdo->prepare('DELETE FROM grades WHERE nim = ? AND komponen = ?')
        ->execute(array($nim, $komponen));
} elseif ($nilai < 0) {
    json_out(array('ok' => false, 'error' => 'Nilai harus 0-100, atau -1 untuk menghapus.'), 422);
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