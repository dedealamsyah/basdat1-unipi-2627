<?php
/**
 * Tandai pertemuan tuntas (khusus admin), atau ALIH-ALIH kui-lane mahasiswa.
 *
 * POST /api/complete.php  body: { "pertemuan_id": N }
 *
 * v2.8.0: endpoint ini TIDAK LAGI menerima `quiz_score`/`quiz_total` dari
 * client. Previously mahasiswa boleh mengirim skor bebas
 * (`{quiz_score: 3, quiz_total: 3}`) dan pertemuan langsung tercatat tuntas —
 * artinya 40% nilai akhir bisa dimanipulasi tanpa menjawab satu pun soal.
 * Sekarang penilaian latihan ada di `api/quiz.php`: client hanya mengirim
 * pilihan yang diklik, server menghitung dari `api/kunci.php`, dan endpoint
 * ini menandai tuntas bila hasil penilaian itu benar-benar tuntas.
 *
 * Body (mahasiswa): { pertemuan_id, jawaban: { "q1": 2, ... } }
 * Body (admin):     { pertemuan_id, quiz_score?, quiz_total? }  // opsional
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

if ($pertemuanId < 1) {
    json_out(array('ok' => false, 'error' => 'pertemuan_id tidak valid.'), 422);
}

$isAdmin = ($u['role'] ?? '') === 'admin';

/* --- Mahasiswa: nilai lagi di server, jangan percaya angka dari client ---- */
if (!$isAdmin) {
    $kunci = kuis_kunci($pertemuanId);
    if ($kunci === null) {
        json_out(array('ok' => false, 'error' => 'Kunci latihan belum tersedia di server. Hubungi dosen.'), 503);
    }

    $aktif = active_pertemuan();
    if (!in_array($pertemuanId, $aktif, true)) {
        json_out(array('ok' => false, 'error' => 'Pertemuan belum tersedia.'), 422);
    }
    $map = status_map($u['nim']);
    if (($map[$pertemuanId] ?? 'locked') === 'locked') {
        json_out(array('ok' => false, 'error' => 'Selesaikan pertemuan sebelumnya terlebih dahulu.'), 422);
    }

    $jawaban = isset($in['jawaban']) && is_array($in['jawaban']) ? $in['jawaban'] : array();
    $hasil = kuis_nilai($pertemuanId, array_map('intval', $jawaban));
    if ($hasil === null) {
        json_out(array('ok' => false, 'error' => 'Gagal menghitung nilai latihan.'), 500);
    }
    // Tuntas hanya bila SEMUA kuis dijawab benar — dicek server, bukan dari client.
    if (!$hasil['tuntas']) {
        json_out(array('ok' => false, 'error' => 'Jawab semua kuis pada pertemuan ini dengan benar untuk menuntaskannya.'), 422);
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            'INSERT INTO progress (nim, pertemuan_id, status, quiz_score, quiz_total, attempts, completed_at)
             VALUES (?, ?, "done", ?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE
                status = "done",
                completed_at = NOW()'
        )->execute(array($u['nim'], $pertemuanId, $hasil['jumlah'], $hasil['jumlah']));
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    json_out(array(
        'ok' => true,
        'data' => array('progress' => status_map($u['nim'])),
    ));
}

/* --- Admin: tandai/manualkan nilai (memang boleh bebas) ------------------ */
$quizScore = (int) ($in['quiz_score'] ?? 0);
$quizTotal = (int) ($in['quiz_total'] ?? 0);

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
