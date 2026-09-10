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
  must_change_password TINYINT(1) NOT NULL DEFAULT 1,
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

-- Hasil evaluasi per pertemuan (1x per mahasiswa + telemetri integritas)
CREATE TABLE IF NOT EXISTS evaluasi (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Akun admin awal (dibuat oleh setup_db.php bila belum ada):
--   nim = 'admin' / password = 'AdminUNIPI2026'
-- Mohon segera diganti setelah login pertama.