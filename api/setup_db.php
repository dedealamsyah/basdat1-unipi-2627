<?php
/**
 * Setup Database Portal Basis Data UNIPI
 *
 * Cara pakai (sekali setelah deploy):
 *   POST /api/setup_db.php
 *   body: { "token": "Basdat1UNIPI2026" }
 *
 * Membuat tabel users & progress + akun admin awal bila belum ada.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_out(array('ok' => false, 'error' => 'Gunakan POST.'), 405);
}

$in = json_in();
if (($in['token'] ?? '') !== SETUP_TOKEN) {
    json_out(array('ok' => false, 'error' => 'Token setup salah.'), 403);
}

$pdo = db();

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS users (
        nim VARCHAR(24) PRIMARY KEY,
        nama VARCHAR(120) NOT NULL,
        kelas VARCHAR(32) NOT NULL DEFAULT '',
        role ENUM('mahasiswa','admin') NOT NULL DEFAULT 'mahasiswa',
        pass_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS progress (
        nim VARCHAR(24) NOT NULL,
        pertemuan_id INT NOT NULL,
        status ENUM('done') NOT NULL DEFAULT 'done',
        quiz_score INT NOT NULL DEFAULT 0,
        quiz_total INT NOT NULL DEFAULT 0,
        attempts INT NOT NULL DEFAULT 0,
        completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (nim, pertemuan_id),
        KEY idx_progress_nim (nim)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS grades (
        nim VARCHAR(24) NOT NULL,
        komponen ENUM('pts','uas','tugas','hadir') NOT NULL,
        nilai INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (nim, komponen)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);

$createdAdmin = false;
$st = $pdo->query('SELECT 1 FROM users WHERE role = "admin" LIMIT 1');
if (!$st->fetch()) {
    $hash = password_hash(ADMIN_DEFAULT_PASS, PASSWORD_DEFAULT);
    $ins = $pdo->prepare(
        'INSERT INTO users (nim, nama, kelas, role, pass_hash) VALUES (?, ?, "", "admin", ?)'
    );
    $ins->execute(array(ADMIN_DEFAULT_NIM, 'Administrator Portal', $hash));
    $createdAdmin = true;
}

json_out(array(
    'ok' => true,
    'data' => array(
        'status' => 'database siap',
        'admin_created' => $createdAdmin,
        'login_admin' => ADMIN_DEFAULT_NIM . ' / ' . ADMIN_DEFAULT_PASS,
        'note' => 'Segera ubah password admin default setelah login.',
    ),
));