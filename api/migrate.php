<?php
/**
 * Migrasi DB (admin): membuat tabel tambahan bila belum ada.
 * GET /api/migrate.php  (admin, idempoten)
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

require_auth('admin');

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

json_out(array('ok' => true, 'data' => array('status' => 'migrasi selesai')));