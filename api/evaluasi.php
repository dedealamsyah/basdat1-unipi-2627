<?php
/**
 * Simpan hasil evaluasi pertemuan (1x per mahasiswa) + telemetri integritas.
 * POST /api/evaluasi.php  body: {
 *   pertemuan_id, skor, total, jumlah_soal,
 *   jawaban: [idx-opsi-terpilih],
 *   paste_count, copy_count, blur_count, time_spent_ms
 * }
 * Jawaban benar/salah TIDAK dikembalikan; hanya skor agregat.
 * Evaluasi hanya boleh dikerjakan setelah pertemuan itu TUNTAS (latihan selesai).
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_out(array('ok' => false, 'error' => 'Gunakan POST.'), 405);
}

$u = require_auth();
require_csrf();

// Admin melihat pratinjau: tidak disimpan.
if (($u['role'] ?? '') === 'admin') {
    json_out(array('ok' => false, 'error' => 'Mode admin: pratinjau evaluasi tidak disimpan.'), 403);
}

$in = json_in();
$pertemuanId = (int) ($in['pertemuan_id'] ?? 0);
$skor = (int) ($in['skor'] ?? -1);
$total = (int) ($in['total'] ?? 0);
$jumlahSoal = (int) ($in['jumlah_soal'] ?? 0);
$jawaban = is_array($in['jawaban'] ?? null) ? $in['jawaban'] : array();
$pasteCount = max(0, (int) ($in['paste_count'] ?? 0));
$copyCount = max(0, (int) ($in['copy_count'] ?? 0));
$blurCount = max(0, (int) ($in['blur_count'] ?? 0));
$timeSpentMs = max(0, (int) ($in['time_spent_ms'] ?? 0));

if ($pertemuanId < 1) {
    json_out(array('ok' => false, 'error' => 'pertemuan_id tidak valid.'), 422);
}
if ($total < 1 || $total > 1000) {
    json_out(array('ok' => false, 'error' => 'Total skor evaluasi tidak valid.'), 422);
}
if ($skor < 0 || $skor > $total) {
    json_out(array('ok' => false, 'error' => 'Skor evaluasi tidak valid.'), 422);
}
if ($jumlahSoal < 1 || $jumlahSoal > 200) {
    json_out(array('ok' => false, 'error' => 'Jumlah soal tidak valid.'), 422);
}

// Evaluasi hanya setelah latihan pertemuan itu selesai (status done).
$active = active_pertemuan();
$map = status_map($u['nim']);
if (!in_array($pertemuanId, $active, true)) {
    json_out(array('ok' => false, 'error' => 'Pertemuan belum tersedia.'), 422);
}
if (($map[$pertemuanId] ?? 'locked') !== 'done') {
    json_out(array('ok' => false, 'error' => 'Selesaikan Latihan pertemuan ini terlebih dahulu.'), 422);
}

$pdo = db();

// Pastikan tabel tersedia (self-healing) bila migrasi belum dijalankan.
try {
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS evaluasi (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nim VARCHAR(24) NOT NULL,
            pertemuan_id INT NOT NULL,
            skor INT NOT NULL DEFAULT 0,
            total INT NOT NULL DEFAULT 100,
            jumlah_soal INT NOT NULL DEFAULT 0,
            jawaban TEXT NULL,
            paste_count INT NOT NULL DEFAULT 0,
            copy_count INT NOT NULL DEFAULT 0,
            blur_count INT NOT NULL DEFAULT 0,
            time_spent_ms INT NOT NULL DEFAULT 0,
            flagged INT NOT NULL DEFAULT 0,
            submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_eval_nim_ptm (nim, pertemuan_id),
            KEY idx_eval_ptm (pertemuan_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
} catch (Throwable $e) {
    // abaikan bila tidak berhak membuat tabel; cek berikutnya akan mengungkap
}

// Satu percobaan saja per pertemuan.
$exists = $pdo->prepare('SELECT id FROM evaluasi WHERE nim = ? AND pertemuan_id = ? LIMIT 1');
$exists->execute(array($u['nim'], $pertemuanId));
if ($exists->fetch()) {
    json_out(array('ok' => false, 'error' => 'Evaluasi pertemuan ini sudah pernah dikumpulkan.'), 409);
}

// Deteksi integritas (deterrent + laporan dosen):
//  bit 0 (1) : ada percobaan paste/copy
//  bit 1 (2) : terlalu sering pindah tab (>=4 kali)
//  bit 2 (4) : waktu mengerjakan terlalu cepat (< 10 dtk/soal)
$flagged = 0;
if ($pasteCount > 0 || $copyCount > 0) {
    $flagged |= 1;
}
if ($blurCount >= 4) {
    $flagged |= 2;
}
if ($jumlahSoal > 0 && $timeSpentMs > 0 && $timeSpentMs < $jumlahSoal * 10000) {
    $flagged |= 4;
}
if ($timeSpentMs < 3000) {
    $flagged |= 4; // hampir pasti membuka-isi langsung
}

$pdo->prepare(
    'INSERT INTO evaluasi
        (nim, pertemuan_id, skor, total, jumlah_soal, jawaban,
         paste_count, copy_count, blur_count, time_spent_ms, flagged, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
)->execute(array(
    $u['nim'],
    $pertemuanId,
    $skor,
    $total,
    $jumlahSoal,
    json_encode($jawaban, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    $pasteCount,
    $copyCount,
    $blurCount,
    $timeSpentMs,
    $flagged,
));

json_out(array(
    'ok' => true,
    'data' => array(
        'skor' => $skor,
        'total' => $total,
        'flagged' => $flagged,
        'submitted_at' => date('Y-m-d H:i:s'),
    ),
));