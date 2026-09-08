-- ============================================================
-- Portal Materi Basis Data UNIPI
-- Schema database MySQL (Byethost: b33_42859006_basdat1)
-- Dibuat otomatis oleh api/setup_db.php
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  nim VARCHAR(24) PRIMARY KEY,
  nama VARCHAR(120) NOT NULL,
  kelas VARCHAR(32) NOT NULL DEFAULT '',
  role ENUM('mahasiswa','admin') NOT NULL DEFAULT 'mahasiswa',
  pass_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS progress (
  nim VARCHAR(24) NOT NULL,
  pertemuan_id INT NOT NULL,
  status ENUM('done') NOT NULL DEFAULT 'done',
  quiz_score INT NOT NULL DEFAULT 0,
  quiz_total INT NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (nim, pertemuan_id),
  KEY idx_progress_nim (nim)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS grades (
  nim VARCHAR(24) NOT NULL,
  komponen ENUM('pts','uas','tugas','hadir') NOT NULL,
  nilai INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (nim, komponen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Akun admin awal (dibuat oleh setup_db.php bila belum ada):
--   nim = 'admin' / password = 'AdminUNIPI2026'
-- Mohon segera diganti setelah login pertama.