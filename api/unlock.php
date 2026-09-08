<?php
/**
 * Admin: override status progres mahasiswa (buka/tuntas / undone).
 * POST /api/unlock.php  body: { "nim": "...", "pertemuan_id": N, "action": "done"|"undone" }
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_out(array('ok' => false, 'error' => 'Gunakan POST.'), 405);
}

require_auth('admin');
$in = json_in();
$nim = trim((string) ($in['nim'] ?? ''));
$pertemuanId = (int) ($in['pertemuan_id'] ?? 0);
$action = (string) ($in['action'] ?? 'done');

if ($nim === '' || $pertemuanId < 1) {
    json_out(array('ok' => false, 'error' => 'nim / pertemuan_id tidak valid.'), 422);
}
if (!in_array($action, array('done', 'undone'), true)) {
    json_out(array('ok' => false, 'error' => 'action harus done atau undone.'), 422);
}

$pdo = db();
if ($action === 'done') {
    $pdo->prepare(
        'INSERT INTO progress (nim, pertemuan_id, status, attempts, completed_at)
         VALUES (?, ?, "done", 0, NOW())
         ON DUPLICATE KEY UPDATE status = "done", completed_at = NOW()'
    )->execute(array($nim, $pertemuanId));
} else {
    $pdo->prepare(
        'DELETE FROM progress WHERE nim = ? AND pertemuan_id = ?'
    )->execute(array($nim, $pertemuanId));
}

json_out(array('ok' => true, 'data' => array('status' => status_map($nim))));