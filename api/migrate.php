<?php
/**
 * Migrasi DB (admin): membuat tabel tambahan bila belum ada.
 * GET /api/migrate.php  (admin, idempoten)
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

// Jalankan migrasi bila: sesi admin ATAU token setup (untuk bootstrap saat login belum siap).
$auth = current_user();
$isAdmin = $auth && ($auth['role'] ?? '') === 'admin';
$token = (string) ($_GET['token'] ?? '');
if (!$isAdmin && $token !== SETUP_TOKEN) {
    json_out(array('ok' => false, 'error' => 'Silakan login sebagai admin terlebih dahulu.'), 401);
}

// Utilitas: bersihkan log percobaan login untuk IP tertentu (ops opsional)
if (isset($_GET['clear_attempts']) && $_GET['clear_attempts'] === '1') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    db()->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute(array($ip));
}

// Utilitas: reset password admin (token ops)
if (isset($_GET['reset_admin']) && $_GET['reset_admin'] === '1' && $token === SETUP_TOKEN) {
    $np = (string) ($_GET['newpass'] ?? '');
    if (strlen($np) < 8) {
        json_out(array('ok' => false, 'error' => 'Password baru minimal 8 karakter.'), 422);
    }
    db()->prepare('UPDATE users SET pass_hash = ?, must_change_password = 1 WHERE nim = ?')
        ->execute(array(password_hash($np, PASSWORD_DEFAULT), ADMIN_DEFAULT_NIM));
    json_out(array('ok' => true, 'data' => array('status' => 'password admin di-reset (wajib diganti saat login)')));
}

$pdo = db();
$pdo->exec(
    "CREATE TABLE IF NOT EXISTS grades (
        nim VARCHAR(24) NOT NULL,
        komponen ENUM('pts','uas','tugas','hadir') NOT NULL,
        nilai INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (nim, komponen)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS pertemuan (
        id INT PRIMARY KEY,
        title VARCHAR(160) NOT NULL DEFAULT '',
        subtitle VARCHAR(255) NOT NULL DEFAULT '',
        aktif TINYINT(1) NOT NULL DEFAULT 1,
        posisi INT NOT NULL DEFAULT 0,
        alokasi VARCHAR(40) NOT NULL DEFAULT '',
        bobot VARCHAR(20) NOT NULL DEFAULT '',
        cpmk VARCHAR(120) NOT NULL DEFAULT ''
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(45) NOT NULL DEFAULT '',
        username VARCHAR(24) NOT NULL DEFAULT '',
        attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ok TINYINT(1) NOT NULL DEFAULT 0,
        KEY idx_login_ip (ip),
        KEY idx_login_user (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);

// Kolom kewajiban ganti password (bila belum ada) → paksa akun lama saat pertama migrasi
$cols = $pdo->query('SHOW COLUMNS FROM users')->fetchAll();
$hasMcp = false;
foreach ($cols as $c) {
    if ($c['Field'] === 'must_change_password') { $hasMcp = true; break; }
}
if (!$hasMcp) {
    $pdo->exec('ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER pass_hash');
    $pdo->exec('UPDATE users SET must_change_password = 1');
}

// Seed metadata pertemuan dari materi (hanya bila tabel kosong, agar edit admin tidak tertimpa)
$cnt = (int) $pdo->query('SELECT COUNT(*) FROM pertemuan')->fetchColumn();
if ($cnt === 0) {
    $seed = array(
        array(1, 'Introduction to Databases', 'Konsep dasar, komponen, dan arsitektur sistem basis data', 1, 1, '3 × 50 menit', '5%', 'CPMK-1'),
        array(2, 'Conceptual Model Design with ERD', 'Model konseptual dan notasi diagram E-R', 1, 2, '3 × 50 menit', '10%', 'CPMK-2'),
        array(3, 'ERD Design Case Studies', 'Studi kasus perancangan ERD', 1, 3, '3 × 50 menit', '10%', 'CPMK-2'),
        array(4, 'Transformasi ERD ke Model Relasional', 'Aturan pemetaan ERD menjadi skema relasi', 1, 4, '3 × 50 menit', '10%', 'CPMK-2'),
        array(5, 'Normalisasi 1NF-3NF', 'Normalisasi skema relasional 1NF sampai 3NF', 1, 5, '3 × 50 menit', '10%', 'CPMK-2'),
        array(6, 'Advanced Normalization BCNF', 'Normalisasi lanjutan BCNF dan dekomposisi', 1, 6, '3 × 50 menit', '5%', 'CPMK-2'),
        array(7, 'Physical Data Model Design', 'Perancangan model data fisik', 1, 7, '3 × 50 menit', '5%', 'CPMK-3'),
        array(8, 'Ujian Tengah Semester (UTS)', 'Evaluasi tengah semester', 0, 8, '-', '15%', 'CPMK'),
        array(9, 'DBMS Installation & Access', 'Instalasi dan akses DBMS', 1, 9, '3 × 50 menit', '5%', 'CPMK-3'),
        array(10, 'Relational Algebra', 'Aljabar relasional untuk query', 1, 10, '3 × 50 menit', '5%', 'CPMK-3'),
        array(11, 'SQL Dasar (DDL & DML)', 'Perintah dasar SQL', 0, 11, '3 × 50 menit', '5%', 'CPMK-3'),
        array(12, 'SQL Kompleks', 'Query SQL lanjutan', 0, 12, '3 × 50 menit', '5%', 'CPMK-3'),
        array(13, 'Implementasi RDBMS: Tabel & Query', 'Implementasi tabel dan query pada RDBMS', 0, 13, '3 × 50 menit', '5%', 'CPMK-3'),
        array(14, 'Form & Report pada RDBMS', 'Pembuatan form dan laporan', 0, 14, '3 × 50 menit', '5%', 'CPMK-3'),
        array(15, 'Switchboard Aplikasi Basis Data', 'Aplikasi basis data berbasis switchboard', 0, 15, '3 × 50 menit', '5%', 'CPMK-3'),
        array(16, 'Ujian Akhir Semester (UAS)', 'Evaluasi akhir semester', 0, 16, '-', '15%', 'CPMK'),
    );
    $ins = $pdo->prepare(
        'INSERT INTO pertemuan (id, title, subtitle, aktif, posisi, alokasi, bobot, cpmk)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($seed as $s) {
        $ins->execute($s);
    }
}

json_out(array('ok' => true, 'data' => array('status' => 'migrasi selesai')));