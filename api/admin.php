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

$st = db()->query(
    'SELECT u.nim, u.nama, u.kelas,
            COUNT(p.pertemuan_id) AS done_count
     FROM users u
     LEFT JOIN progress p ON p.nim = u.nim
     WHERE u.role = "mahasiswa"
     GROUP BY u.nim, u.nama, u.kelas
     ORDER BY u.kelas, u.nim'
);
$students = array();
foreach ($st as $r) {
    $nilai = compute_nilai($r['nim']);
    $students[] = array(
        'nim' => $r['nim'],
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

// Peta nilai evaluasi per mahasiswa per pertemuan (untuk grid nilai)
$evalByStudent = array();
foreach (evaluasi_list() as $e) {
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

json_out(array('ok' => true, 'data' => array(
    'students' => $students,
    'total' => $total,
    'evaluasi' => evaluasi_list(),
    'eval_by_student' => $evalByStudent,
)));