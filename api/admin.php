<?php
/**
 * Admin: daftar mahasiswa + ringkasan progres.
 * GET /api/admin.php            -> semua mahasiswa (ringkas)
 * GET /api/admin.php?nim=...    -> detail progres satu mahasiswa
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

require_auth('admin');

$active = active_pertemuan();
$total = count($active);

/**
 * GET /api/admin.php?kunci=1 -> kunci jawaban EVALUASI seluruh pertemuan.
 *
 * Kunci tidak lagi ada di HTML halaman (sebelumnya bisa dibaca lewat View
 * Source), jadi dosen perlu endpoint ini untuk menyusun soal / memeriksa
 * jawaban. Tetap di balik require_auth('admin').
 */
if (($_GET['kunci'] ?? '') === '1') {
    $out = array();
    foreach (eval_kunci_map() as $pid => $k) {
        $out[(int) $pid] = array('benar' => $k['benar'], 'opsi' => $k['opsi'], 'jumlah' => count($k['benar']));
    }
    json_out(array('ok' => true, 'data' => array('kunci' => $out)));
}

/**
 * GET /api/admin.php?kuis=1[&pertemuan_id=N] -> kunci kuis LATIHAN.
 *
 * Sama seperti `kunci=1`: sejak v2.8.0 kunci latihan pun tidak ada di HTML,
 * sehingga mode presentasi (?/pertemuan/N/presentasi) tidak lagi bisa
 * membacanya dari DOM. Dosen memintanya dari sini — endpoint admin-only, jadi
 * akses kunci tercatat sebagai akses admin, bukan "gratis" lewat View Source.
 */
if (($_GET['kuis'] ?? '') === '1') {
    $cuma = isset($_GET['pertemuan_id']) ? (int) $_GET['pertemuan_id'] : 0;
    $out = array();
    foreach (kuis_kunci_map() as $pid => $k) {
        if ($cuma > 0 && (int) $pid !== $cuma) {
            continue;
        }
        $out[(int) $pid] = array(
            'benar' => $k['benar'],
            'opsi' => $k['opsi'],
            'jelas' => $k['jelas'],
            'jumlah' => count($k['id']),
        );
    }
    json_out(array('ok' => true, 'data' => array('kuis' => $out)));
}

$nim = trim((string) ($_GET['nim'] ?? ''));

if ($nim !== '') {
    $st = db()->prepare(
        'SELECT u.nim, u.nama, u.kelas, p.pertemuan_id, p.quiz_score, p.quiz_total, p.attempts, p.completed_at
         FROM users u
         LEFT JOIN progress p ON p.nim = u.nim
         WHERE u.nim = ?'
    );
    $st->execute(array($nim));
    $map = status_map($nim);
    $rows = $st->fetchAll();
    $done = array();
    foreach ($rows as $r) {
        if ($r['pertemuan_id'] !== null) {
            $done[(int) $r['pertemuan_id']] = $r;
        }
    }
    $detail = array();
    foreach ($active as $id) {
        $detail[] = array(
            'pertemuan_id' => $id,
            'status' => $map[$id],
            'quiz_score' => isset($done[$id]) ? (int) $done[$id]['quiz_score'] : 0,
            'quiz_total' => isset($done[$id]) ? (int) $done[$id]['quiz_total'] : 0,
            'attempts' => isset($done[$id]) ? (int) $done[$id]['attempts'] : 0,
            'completed_at' => isset($done[$id]) ? $done[$id]['completed_at'] : null,
        );
    }
    $evalRows = array();
    foreach (evaluasi_rows($nim) as $pid => $e) {
        $evalRows[] = array_merge(array('pertemuan_id' => $pid), $e);
    }
    json_out(array('ok' => true, 'data' => array(
        'nim' => $nim,
        'progress' => $detail,
        'evaluasi' => $evalRows,
        'nilai' => compute_nilai($nim),
    )));
}

// ---------------------------------------------------------------------------
// Daftar semua mahasiswa.
//
// Semua agregasi dikumpulkan satu kali per sumber data (3 query), lalu nilai
// tiap mahasiswa dihitung di PHP lewat compute_nilai_dari(). Sebelumnya
// compute_nilai() dipanggil per mahasiswa (N+1) dan evaluasi_list() dua kali.
// ---------------------------------------------------------------------------

// 1) Progres latihan: SUM(skor), SUM(total) per mahasiswa.
$latihan = array();
$stLat = db()->query(
    'SELECT nim, SUM(quiz_score) s, SUM(quiz_total) t
     FROM progress WHERE quiz_total > 0 GROUP BY nim'
);
foreach ($stLat as $r) {
    $latihan[$r['nim']] = array((int) $r['s'], (int) $r['t']);
}

// 2) Nilai manual: komponen => nilai, per mahasiswa.
$manual = array();
$stGrade = db()->query('SELECT nim, komponen, nilai FROM grades');
foreach ($stGrade as $r) {
    if (!isset($manual[$r['nim']])) {
        $manual[$r['nim']] = array();
    }
    $manual[$r['nim']][$r['komponen']] = (int) $r['nilai'];
}

// 3) Evaluasi: satu query, dipakai untuk agregat per mahasiswa, daftar panel,
//    dan grid nilai. Toleran bila tabel belum termigrasi.
$evaluasi = array(); // list untuk respons (terbaru dulu)
$evalSum = array(); // nim => [skor, total], hanya baris total > 0
try {
    $stEval = db()->query(
        'SELECT e.nim, u.nama, u.kelas, e.pertemuan_id, e.skor, e.total, e.jumlah_soal,
                e.paste_count, e.copy_count, e.blur_count, e.time_spent_ms, e.flagged,
                e.submitted_at
         FROM evaluasi e
         JOIN users u ON u.nim = e.nim
         ORDER BY e.submitted_at DESC'
    );
    foreach ($stEval as $r) {
        $tot = (int) $r['total'];
        $skor = (int) $r['skor'];
        $evaluasi[] = array(
            'nim' => $r['nim'],
            'nama' => $r['nama'],
            'kelas' => $r['kelas'],
            'pertemuan_id' => (int) $r['pertemuan_id'],
            'skor' => $skor,
            'total' => $tot,
            'jumlah_soal' => (int) $r['jumlah_soal'],
            'paste_count' => (int) $r['paste_count'],
            'copy_count' => (int) $r['copy_count'],
            'blur_count' => (int) $r['blur_count'],
            'time_spent_ms' => (int) $r['time_spent_ms'],
            'flagged' => (int) $r['flagged'],
            'submitted_at' => $r['submitted_at'],
        );
        if ($tot > 0) {
            if (!isset($evalSum[$r['nim']])) {
                $evalSum[$r['nim']] = array(0, 0);
            }
            $evalSum[$r['nim']][0] += $skor;
            $evalSum[$r['nim']][1] += $tot;
        }
    }
} catch (Throwable $e) {
    $evaluasi = array(); // tabel belum ada / kolasi belum disinkronkan
    $evalSum = array();
}

// 4) Peta nilai evaluasi per mahasiswa per pertemuan (untuk grid nilai).
$evalByStudent = array();
foreach ($evaluasi as $e) {
    $pid = (int) $e['pertemuan_id'];
    if (!isset($evalByStudent[$e['nim']])) {
        $evalByStudent[$e['nim']] = array();
    }
    $tot = (int) $e['total'];
    $evalByStudent[$e['nim']][$pid] = array(
        'skor' => (int) $e['skor'],
        'total' => $tot,
        'pct' => $tot > 0 ? (int) round((int) $e['skor'] / $tot * 100) : 0,
        'flagged' => (int) $e['flagged'],
    );
}

// 5) Daftar mahasiswa. done_count hanya menghitung pertemuan yang masih
//    aktif, agar persentase tidak melewati 100% bila ada pertemuan dinonaktifkan.
if ($active) {
    $in = implode(',', array_fill(0, count($active), '?'));
    $st = db()->prepare(
        'SELECT u.nim, u.nama, u.kelas, COUNT(p.pertemuan_id) AS done_count
         FROM users u
         LEFT JOIN progress p ON p.nim = u.nim AND p.pertemuan_id IN (' . $in . ')
         WHERE u.role = "mahasiswa"
         GROUP BY u.nim, u.nama, u.kelas
         ORDER BY u.kelas, u.nim'
    );
    $st->execute($active);
} else {
    $st = db()->query(
        'SELECT u.nim, u.nama, u.kelas, 0 AS done_count
         FROM users u WHERE u.role = "mahasiswa"
         ORDER BY u.kelas, u.nim'
    );
}

$students = array();
foreach ($st as $r) {
    $nimK = $r['nim'];
    $lt = isset($latihan[$nimK]) ? $latihan[$nimK] : array(null, 0);
    $ev = isset($evalSum[$nimK]) ? $evalSum[$nimK] : array(0, 0);
    $nilai = compute_nilai_dari(
        $lt[0],
        $lt[1],
        $ev[0],
        $ev[1],
        isset($manual[$nimK]) ? $manual[$nimK] : array()
    );
    $students[] = array(
        'nim' => $nimK,
        'nama' => $r['nama'],
        'kelas' => $r['kelas'],
        'done_count' => (int) $r['done_count'],
        'total' => $total,
        'persen' => $total > 0 ? round(((int) $r['done_count'] / $total) * 100) : 0,
        'eval_pct' => $nilai['kuis_evaluasi'],
        'akhir' => $nilai['akhir'],
        'huruf' => $nilai['huruf'],
    );
}

// Daftar pengumpulan tugas (tautan Google Drive) — terbaru dulu
$tugas = array();
try {
    tugas_ensure();
    $st = db()->query(
        'SELECT t.id, t.nim, u.nama, u.kelas, t.pertemuan_id, t.original_name, t.mime,
                t.size, t.drive_file_id, t.drive_link, t.submitted_at
         FROM tugas t JOIN users u ON u.nim = t.nim
         ORDER BY t.submitted_at DESC'
    );
    foreach ($st as $r) {
        $tugas[] = array(
            'id' => (int) $r['id'],
            'nim' => $r['nim'],
            'nama' => $r['nama'],
            'kelas' => $r['kelas'],
            'pertemuan_id' => (int) $r['pertemuan_id'],
            'original_name' => $r['original_name'],
            'mime' => $r['mime'],
            'size' => (int) $r['size'],
            'drive_file_id' => $r['drive_file_id'],
            'drive_link' => $r['drive_link'] ?? null,
            'submitted_at' => $r['submitted_at'],
        );
    }
} catch (Throwable $e) {
    $tugas = array(); // tabel belum ada
}

json_out(array('ok' => true, 'data' => array(
    'students' => $students,
    'total' => $total,
    'evaluasi' => $evaluasi,
    'eval_by_student' => $evalByStudent,
    'tugas' => $tugas,
)));