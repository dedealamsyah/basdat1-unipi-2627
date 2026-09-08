<?php
/**
 * Tandai pertemuan tuntas (via kuis/klaim mahasiswa, atau admin).
 * POST /api/complete.php  body: { "pertemuan_id": N, "quiz_score": X, "quiz_total": Y }
 * Mahasiswa hanya bisa menyelesaikan pertemuan yang sedang terbuka.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_out(array('ok' => false, 'error' => 'Gunakan POST.'), 405);
}

 $u = require_auth();
require_csrf();
$in = json_in();
$pertemuanId = (int) ($in['pertemuan_id'] ?? 0);
$quizScore = (int) ($in['quiz_score'] ?? 0);
$quizTotal = (int) ($in['quiz_total'] ?? 0);

if ($pertemuanId < 1) {
    json_out(array('ok' => false, 'error' => 'pertemuan_id tidak valid.'), 422);
}

$active = active_pertemuan();
$map = status_map($u['nim']);

if ($u['role'] !== 'admin') {
    if (!in_array($pertemuanId, $active, true)) {
        json_out(array('ok' => false, 'error' => 'Pertemuan belum tersedia.'), 422);
    }
    $statusNow = $map[$pertemuanId] ?? 'locked';
    if ($statusNow === 'locked') {
        json_out(array('ok' => false, 'error' => 'Selesaikan pertemuan sebelumnya terlebih dahulu.'), 422);
    }
}

$pdo = db();
$pdo->beginTransaction();
$upsert = $pdo->prepare(
    'INSERT INTO progress (nim, pertemuan_id, status, quiz_score, quiz_total, attempts, completed_at)
     VALUES (?, ?, "done", ?, ?, 1, NOW())
     ON DUPLICATE KEY UPDATE
        status = "done",
        quiz_score = GREATEST(quiz_score, VALUES(quiz_score)),
        quiz_total = GREATEST(quiz_total, VALUES(quiz_total)),
        attempts = attempts + 1,
        completed_at = NOW()'
);
$upsert->execute(array($u['nim'], $pertemuanId, $quizScore, $quizTotal));
$pdo->commit();

json_out(array(
    'ok' => true,
    'data' => array('progress' => status_map($u['nim'])),
));