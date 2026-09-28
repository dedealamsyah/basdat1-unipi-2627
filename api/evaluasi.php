<?php
/**
 * Simpan hasil evaluasi pertemuan (1x per mahasiswa) + telemetri integritas.
 *
 * POST /api/evaluasi.php?action=start
 *   -> mencatat waktu mulai di SESI server, membalas { server_now }.
 *      Client memanggil ini saat form evaluasi dibuka.
 *
 * POST /api/evaluasi.php  body: {
 *   pertemuan_id,
 *   jawaban: [idx-opsi-terpilih],   // indeks ASLI (sebelum diacak)
 *   paste_count, copy_count, blur_count
 * }
 *
 * PENTING: skor DIHITUNG DI SERVER dari kunci jawaban (api/kunci.php).
 * Nilai `skor` dari client TIDAK pernah dipercaya — kalau dulu begitu,
 * mahasiswa bisa mengirim skor sempurna tanpa menjawab. Kunci jawaban juga
 * tidak pernah dikirim ke browser.
 *
 * Yang masih client-reported (tidak bisa diverifikasi tanpa proctoring):
 * paste_count, copy_count, blur_count. Angka ini bersifat ADVISORY — sinyal
 * indikatif untuk dosen, bukan bukti. Waktu dihitung server dari `action=start`.
 *
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

/* ---------------------------------------------------------------------------
 * action=start — catat waktu mulai di server.
 * Durasi pengerjaan dihitung dari selisih waktu server sendiri, sehingga
 * mahasiswa tidak bisa memperpendek/memperpanjang durasi sesuka hatinya.
 * (Yang masih bisa dimanipulasi: menundasubmission — tapi itu hanya membuat
 *  waktunya terlihat lebih lama, tidak pernah lebih cepat.)
 * ------------------------------------------------------------------------- */
if (($_GET['action'] ?? '') === 'start') {
    if ($pertemuanId < 1) {
        json_out(array('ok' => false, 'error' => 'pertemuan_id tidak valid.'), 422);
    }
    if (eval_kunci($pertemuanId) === null) {
        json_out(array('ok' => false, 'error' => 'Evaluasi belum tersedia.'), 422);
    }
    start_session();
    if (!isset($_SESSION['eval_start']) || !is_array($_SESSION['eval_start'])) {
        $_SESSION['eval_start'] = array();
    }
    $_SESSION['eval_start'][$pertemuanId] = (int) round(microtime(true) * 1000);
    json_out(array('ok' => true, 'data' => array('server_now' => (int) round(microtime(true) * 1000))));
}

$jawaban = isset($in['jawaban']) && is_array($in['jawaban']) ? $in['jawaban'] : array();
$pasteCount = max(0, min(1000, (int) ($in['paste_count'] ?? 0)));
$copyCount = max(0, min(1000, (int) ($in['copy_count'] ?? 0)));
$blurCount = max(0, min(1000, (int) ($in['blur_count'] ?? 0)));

if ($pertemuanId < 1) {
    json_out(array('ok' => false, 'error' => 'pertemuan_id tidak valid.'), 422);
}

// Kunci harus ada (hasil generate build) sebelum bisa dinilai.
$kunci = eval_kunci($pertemuanId);
if ($kunci === null) {
    json_out(array('ok' => false, 'error' => 'Kunci jawaban belum tersedia di server. Hubungi dosen.'), 503);
}
$jumlahSoal = count($kunci['benar']);

// Client hanya mengirim jawaban; skor dihitung di sini.
if (count($jawaban) !== $jumlahSoal) {
    json_out(array('ok' => false, 'error' => 'Jumlah jawaban tidak sesuai jumlah soal.'), 422);
}
// Setiap indeks harus berada dalam rentang opsi soal tsb.
foreach ($kunci['benar'] as $i => $idxBenar) {
    $pilih = $jawaban[$i] ?? null;
    $jmlOpsi = (int) ($kunci['opsi'][$i] ?? 0);
    if (!is_int($pilih) && !(is_string($pilih) && ctype_digit($pilih))) {
        json_out(array('ok' => false, 'error' => 'Jawaban tidak valid.'), 422);
    }
    $pilih = (int) $pilih;
    if ($pilih < 0 || $pilih >= $jmlOpsi) {
        json_out(array('ok' => false, 'error' => 'Pilihan di luar rentang.'), 422);
    }
}

$hasil = eval_nilai($pertemuanId, array_map('intval', $jawaban));
if ($hasil === null) {
    json_out(array('ok' => false, 'error' => 'Gagal menghitung skor.'), 500);
}
$skor = $hasil['skor'];
$total = $hasil['total'];

// Durasi dari waktu server (lihat action=start di atas).
$timeSpentMs = 0;
start_session();
if (isset($_SESSION['eval_start'][$pertemuanId])) {
    $timeSpentMs = max(0, min(86400000, (int) round(microtime(true) * 1000) - (int) $_SESSION['eval_start'][$pertemuanId]));
    unset($_SESSION['eval_start'][$pertemuanId]);
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

// Satu percobaan saja per pertemuan. UNIQUE KEY (nim, pertemuan_id) yang
// menjadi penjaga sebenarnya; pengecekan di bawah hanya untuk pesan ramah.
$exists = $pdo->prepare('SELECT id FROM evaluasi WHERE nim = ? AND pertemuan_id = ? LIMIT 1');
$exists->execute(array($u['nim'], $pertemuanId));
if ($exists->fetch()) {
    json_out(array('ok' => false, 'error' => 'Evaluasi pertemuan ini sudah pernah dikumpulkan.'), 409);
}

// Sinyal integritas (ADVISORY — berasal dari client, bukan bukti):
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
// Durasi diukur server, jadi mahasiswa tak bisa membuat waktunya terlihat
// singkat. timeSpentMs == 0 berarti tidak ada action=start (sesi hilang /
// reload) — dalam hal itu durasi tidak bisa dinilai sama sekali.
if ($timeSpentMs > 0) {
    if ($timeSpentMs < $jumlahSoal * 10000 || $timeSpentMs < 3000) {
        $flagged |= 4;
    }
}

// Sisipkan. Kalau dua request berebut, UNIQUE KEY menolak yang kedua —
// tangkap dan balas 409 agar tidak jadi 500.
try {
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
} catch (PDOException $e) {
    if ((string) $e->getCode() === '23000') {
        json_out(array('ok' => false, 'error' => 'Evaluasi pertemuan ini sudah pernah dikumpulkan.'), 409);
    }
    throw $e; // biarkan handler global yang menangani
}

json_out(array(
    'ok' => true,
    'data' => array(
        'skor' => $skor,
        'total' => $total,
        'benar' => $hasil['benar'],
        'jumlah' => $jumlahSoal,
        'flagged' => $flagged,
        'submitted_at' => date('Y-m-d H:i:s'),
    ),
));