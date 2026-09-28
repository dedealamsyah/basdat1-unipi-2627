<?php
/**
 * API Portal Materi Basis Data UNIPI
 * Konfigurasi koneksi database MySQL Byethost + helper.
 * File ini TIDAK boleh diakses langsung via URL (lihat .htaccess).
 */
declare(strict_types=1);

const DB_HOST = 'your-db-host.example.com';
const DB_NAME = 'your_db_name';
const DB_USER = 'your_db_user';
const DB_PASS = 'your_db_password';

/** Token satu-kali untuk setup database (ubah setelah setup) */
const SETUP_TOKEN = 'CHANGE_ME_SETUP_TOKEN';

/** Akun admin awal yang dibuat saat setup */
const ADMIN_DEFAULT_NIM = 'admin';
const ADMIN_DEFAULT_PASS = 'CHANGE_ME_ADMIN_PASSWORD';

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ));
    }
    return $pdo;
}

function json_out(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_in(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw !== false ? $raw : '{}', true);
    return is_array($data) ? $data : array();
}

/**
 * Error/exception handler global.
 *
 * Tanpa ini, PDOException yang tidak tertangani (mis. pelanggaran UNIQUE saat
 * dua request evaluasi berebut) akan berakhir sebagai *fatal error*. Bila
 * `display_errors` aktif di hosting, itu membocorkan path, query, dan detail
 * koneksi ke mahasiswa. Semua kegagalan jadi JSON minimal 500 tanpa detail.
 */
set_exception_handler(function (Throwable $e): void {
    error_log('[api] ' . get_class($e) . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
    }
    echo json_encode(
        array('ok' => false, 'error' => 'Terjadi kesalahan di server. Silakan coba lagi.'),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
});

set_error_handler(function (int $severity, string $message, string $file = '', int $line = 0): bool {
    // Dielevationkan ke exception supaya tidak pernah bocor ke output.
    throw new ErrorException($message, 0, $severity, $file, $line);
});

/** Direktori penyimpanan berkas tugas LAma (versi PDF di server).
 *  Hanya dipakai fallback `tugas_download.php` untuk data sebelum v2.4.0;
 *  pengumpulan baru menyimpan tautan Google Drive, bukan berkas. */
function tugas_dir(): string
{
    $d = __DIR__ . '/uploads/tugas';
    if (!is_dir($d)) {
        @mkdir($d, 0775, true);
    }
    return $d;
}

/** Sinkronkan skema tabel `tugas` (idempoten; menambah kolom bila masih versi berkas). */
function tugas_ensure(): void
{
    try {
        db()->exec(
            "CREATE TABLE IF NOT EXISTS tugas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nim VARCHAR(24) NOT NULL,
                pertemuan_id INT NOT NULL,
                filename VARCHAR(255) NOT NULL DEFAULT '',
                original_name VARCHAR(255) NOT NULL DEFAULT '',
                mime VARCHAR(120) NOT NULL DEFAULT 'google-drive',
                size INT NOT NULL DEFAULT 0,
                drive_file_id VARCHAR(255) NULL,
                drive_link VARCHAR(700) NULL,
                submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_tugas_nim_ptm (nim, pertemuan_id),
                KEY idx_tugas_ptm (pertemuan_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    } catch (Throwable $e) {
        // tabel sudah ada
    }
    try {
        $has = db()->query("SHOW COLUMNS FROM tugas LIKE 'drive_link'")->fetch();
        if (!$has) {
            db()->exec("ALTER TABLE tugas ADD COLUMN drive_link VARCHAR(700) NULL AFTER drive_file_id");
        }
    } catch (Throwable $e) {
        // abaikan bila tabel belum tersedia
    }
}

/** Deteksi HTTPS, termasuk saat di belakang proxy (Cloudflare). */
function is_https(): bool
{
    if (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
        return true;
    }
    if (strcasecmp((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''), 'https') === 0) {
        return true;
    }
    // header lama Cloudflare: {"scheme":"https"}
    $cf = (string) ($_SERVER['HTTP_CF_VISITOR'] ?? '');
    if ($cf !== '' && strpos($cf, 'https') !== false) {
        return true;
    }
    return false;
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        // Catatan: flag `Secure` sengaja TIDAK dipakai selama akses masih campur
        // http/https (Byethost). Cookie Secure tidak dikirim lintas skema dan
        // akan membuat sesi "hilang" (server:0). Aktifkan kembali hanya setelah
        // HTTPS termaktif penuh (mis. via Cloudflare).
        session_set_cookie_params(array(
            'httponly' => true,
            'samesite' => 'Lax',
        ));
        session_start();
    }
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
}

function current_user(): ?array
{
    start_session();
    return isset($_SESSION['user']) ? $_SESSION['user'] : null;
}

/** Validasi CSRF token (header X-CSRF-Token) untuk aksi state-bentang. */
function csrf_ok(): bool
{
    start_session();
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    return $token !== '' && hash_equals($_SESSION['csrf'] ?? '', $token);
}

function require_csrf(): void
{
    if (!csrf_ok()) {
        json_out(array('ok' => false, 'error' => 'Token keamanan tidak valid. Muat ulang halaman.'), 403);
    }
}

/** Nilai ambang rate-limit login (percobaan gagal per window menit) */
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MINUTES = 15;

function login_too_many(string $username): bool
{
    try {
        $pdo = db();
        $pdo->prepare(
            'DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL ? MINUTE)'
        )->execute(array(LOGIN_WINDOW_MINUTES));
        // throttle berbasis username (akurat; IP di hosting bersama tidak dapat-diandalkan)
        $st = $pdo->prepare(
            'SELECT COUNT(*) c FROM login_attempts WHERE username = ? AND ok = 0'
        );
        $st->execute(array(strtolower($username)));
        return (int) $st->fetchColumn() >= LOGIN_MAX_ATTEMPTS;
    } catch (Throwable $e) {
        return false; // tabel belum tersedia migrasi? biarkan login berjalan
    }
}

function login_log_fail(string $username): void
{
    try {
        db()->prepare(
            'INSERT INTO login_attempts (ip, username, attempted_at, ok) VALUES (?, ?, NOW(), 0)'
        )->execute(array($_SERVER['REMOTE_ADDR'] ?? 'unknown', strtolower($username)));
    } catch (Throwable $e) {
        // abaikan bila tabel belum ada
    }
}

function login_log_clear(string $username): void
{
    try {
        db()->prepare(
            'DELETE FROM login_attempts WHERE username = ?'
        )->execute(array(strtolower($username)));
    } catch (Throwable $e) {
        // abaikan bila tabel belum ada
    }
}

function require_auth(string $role = 'mahasiswa'): array
{
    $u = current_user();
    if (!$u) {
        json_out(array('ok' => false, 'error' => 'Silakan login terlebih dahulu.'), 401);
    }
    if ($role === 'admin' && ($u['role'] ?? '') !== 'admin') {
        json_out(array('ok' => false, 'error' => 'Akses khusus admin.'), 403);
    }
    return $u;
}

/** Daftar id pertemuan aktif (konten tersedia), urut progresi.
 *  Berasal dari tabel `pertemuan` (aktif=1, urut posisi) agar sinkron
 *  dengan menu yang diedit admin; fallback ke daftar statis bila tabel belum ada. */
function active_pertemuan(): array
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }
    try {
        $st = db()->query('SELECT id FROM pertemuan WHERE aktif = 1 ORDER BY posisi ASC, id ASC');
        $out = array();
        foreach ($st as $r) {
            $out[] = (int) $r['id'];
        }
        $cache = $out; // kosong pun sah (admin menonaktifkan semua)
        return $cache;
    } catch (Throwable $e) {
        $cache = array(1, 2, 3, 4, 5, 6, 7, 9, 10);
        return $cache;
    }
}

/** Set pertemuan yang sudah tuntas seorang mahasiswa */
function done_set(string $nim): array
{
    $st = db()->prepare('SELECT pertemuan_id FROM progress WHERE nim = ? AND status = "done"');
    $st->execute(array($nim));
    $out = array();
    foreach ($st as $row) {
        $out[] = (int) $row['pertemuan_id'];
    }
    return $out;
}

/** Status {id => open|locked} berdasarkan progresi berurutan */
function status_map(string $nim): array
{
    $list = active_pertemuan();
    $done = done_set($nim);
    $map = array();
    $prevDone = true;
    foreach ($list as $i => $id) {
        $isDone = in_array($id, $done, true);
        $map[$id] = $isDone ? 'done' : (($i === 0 || $prevDone) ? 'open' : 'locked');
        if ($isDone) {
            $prevDone = true;
        } else {
            // halaman ini belum selesai -> berikutnya terkunci
            $prevDone = false;
        }
    }
    return $map;
}

/** Bobot komponen nilai */
function grade_weights(): array
{
    return array('kuis' => 0.40, 'pts' => 0.30, 'uas' => 0.30);
}

/** Ambil nilai manual seorang mahasiswa: komponen => nilai */
function manual_grades(string $nim): array
{
    $st = db()->prepare('SELECT komponen, nilai FROM grades WHERE nim = ?');
    $st->execute(array($nim));
    $out = array();
    foreach ($st as $r) {
        $out[$r['komponen']] = (int) $r['nilai'];
    }
    return $out;
}

/** Semua baris evaluasi seorang mahasiswa: map { pertemuan_id => row } */
function evaluasi_rows(string $nim): array
{
    try {
        $st = db()->prepare(
            'SELECT pertemuan_id, skor, total, jumlah_soal, flagged, paste_count, copy_count,
                    blur_count, time_spent_ms, submitted_at
             FROM evaluasi WHERE nim = ? ORDER BY pertemuan_id'
        );
        $st->execute(array($nim));
        $out = array();
        foreach ($st as $r) {
            $out[(int) $r['pertemuan_id']] = array(
                'skor' => (int) $r['skor'],
                'total' => (int) $r['total'],
                'jumlah_soal' => (int) $r['jumlah_soal'],
                'flagged' => (int) $r['flagged'],
                'paste_count' => (int) $r['paste_count'],
                'copy_count' => (int) $r['copy_count'],
                'blur_count' => (int) $r['blur_count'],
                'time_spent_ms' => (int) $r['time_spent_ms'],
                'submitted_at' => $r['submitted_at'],
            );
        }
        return $out;
    } catch (Throwable $e) {
        return array(); // tabel belum termigrasi
    }
}

/**
 * Muat kunci jawaban evaluasi dari `api/kunci.php` (hasil generate build).
 *
 * Kunci TIDAK pernah dikirim ke browser — hanya server yang memakainya untuk
 * menghitung skor. Berkas kunci di-gitignore karena berisi jawaban.
 *
 * @return array<int,array{benar:int[],opsi:int[]}> map pertemuan_id => kunci
 */
function eval_kunci_map(): array
{
    static $map = null;
    if ($map !== null) {
        return $map;
    }
    $file = __DIR__ . '/kunci.php';
    if (!is_file($file)) {
        $map = array();
        return $map;
    }
    require $file;
    $map = defined('EVAL_KUNCI') ? EVAL_KUNCI : array();
    return $map;
}

/** Kunci satu pertemuan, atau null bila tidak ada (mis. belum di-generate). */
function eval_kunci(int $pertemuanId): ?array
{
    $map = eval_kunci_map();
    return isset($map[$pertemuanId]) ? $map[$pertemuanId] : null;
}

/** Hitung skor 0..100 dari jawaban mahasiswa memakai kunci server.
 *
 *  Bobot per soal dibagi rata agar total selalu 100 (sama seperti versi
 *  client-side sebelumnya: base = floor(100/n), sisa dibagikan ke soal awal).
 *
 * @param int[] $jawaban indeks opsi yang dipilih, urutan soal
 * @return array{skor:int,total:int,benar:int,jumlah:int}|null null bila kunci tak ada
 */
function eval_nilai(int $pertemuanId, array $jawaban): ?array
{
    $kunci = eval_kunci($pertemuanId);
    if ($kunci === null) {
        return null;
    }
    $kunciBenar = $kunci['benar'];
    $jumlah = count($kunciBenar);
    if ($jumlah < 1 || count($jawaban) !== $jumlah) {
        return null;
    }

    $benar = 0;
    foreach ($kunciBenar as $i => $idx) {
        if (isset($jawaban[$i]) && (int) $jawaban[$i] === (int) $idx) {
            $benar++;
        }
    }

    // Bobot rata; sisa pembagian diberikan ke soal-soal awal (base + 1).
    $base = (int) floor(100 / $jumlah);
    $sisa = 100 - $base * $jumlah;
    $skor = 0;
    for ($i = 0; $i < $jumlah; $i++) {
        if (isset($jawaban[$i]) && (int) $jawaban[$i] === (int) $kunciBenar[$i]) {
            $skor += $base + ($i < $sisa ? 1 : 0);
        }
    }

    return array('skor' => $skor, 'total' => 100, 'benar' => $benar, 'jumlah' => $jumlah);
}

/** Sum skor & total soal evaluasi seorang mahasiswa: [skor, total].
 *  Toleran bila tabel `evaluasi` belum termigrasi → [0, 0]. */
function evaluasi_sum(string $nim): array
{
    try {
        $st = db()->prepare('SELECT SUM(skor) s, SUM(total) t FROM evaluasi WHERE nim = ? AND total > 0');
        $st->execute(array($nim));
        $r = $st->fetch();
        if (!$r || (int) $r['t'] <= 0) {
            return array(0, 0);
        }
        return array((int) $r['s'], (int) $r['t']);
    } catch (Throwable $e) {
        return array(0, 0); // tabel belum termigrasi
    }
}

/** Persentase evaluasi gabungan (skor/total seluruh pertemuan), null bila kosong */
function evaluasi_pct(string $nim): ?int
{
    list($s, $t) = evaluasi_sum($nim);
    return $t > 0 ? (int) round(($s / $t) * 100) : null;
}


/** Konversi 0-100 ke nilai huruf (skala SN-Dikti umum) */
function grade_huruf(float $n): string
{
    if ($n >= 80) return 'A';
    if ($n >= 75) return 'AB';
    if ($n >= 70) return 'B';
    if ($n >= 65) return 'BC';
    if ($n >= 60) return 'C';
    if ($n >= 50) return 'D';
    return 'E';
}

/**
 * Hitung nilai akhir dari agregat yang SUDAH terkumpul (tanpa query).
 *
 * Dipakai `compute_nilai()` (satu mahasiswa) dan `admin.php` (bulk satu query
 * untuk seluruh mahasiswa — Hindari N+1). Komponen kuis = rata-rata persentase
 * LATIHAN dan EVALUASI (masing-masing 50% dari 40%).
 *
 * @param int|null $latihanSkor  SUM(quiz_score), null bila belum ada latihan
 * @param int      $latihanTotal SUM(quiz_total)
 * @param int      $evalSkor     SUM(skor) evaluasi
 * @param int      $evalTotal    SUM(total) evaluasi
 * @param array    $grades       map komponen => nilai
 * @return array { kuis_latihan, kuis_evaluasi, kuis_pct, pts, uas, tugas, hadir, akhir, huruf }
 */
function compute_nilai_dari(?int $latihanSkor, int $latihanTotal, int $evalSkor, int $evalTotal, array $grades): array
{
    $latihanPct = ($latihanTotal > 0 && $latihanSkor !== null)
        ? (int) round(($latihanSkor / $latihanTotal) * 100)
        : null;
    $evaluasiPct = $evalTotal > 0 ? (int) round(($evalSkor / $evalTotal) * 100) : null;

    if ($latihanPct !== null && $evaluasiPct !== null) {
        $kuisPct = (int) round(($latihanPct + $evaluasiPct) / 2);
    } else {
        $kuisPct = $latihanPct !== null ? $latihanPct : $evaluasiPct;
    }

    $pts = $grades['pts'] ?? null;
    $uas = $grades['uas'] ?? null;

    $akhir = null;
    if ($kuisPct !== null && $pts !== null && $uas !== null) {
        $w = grade_weights();
        $akhir = (int) round(
            $kuisPct * $w['kuis'] + $pts * $w['pts'] + $uas * $w['uas']
        );
    }

    return array(
        'kuis_latihan' => $latihanPct,
        'kuis_evaluasi' => $evaluasiPct,
        'kuis_pct' => $kuisPct,
        'pts' => $pts,
        'uas' => $uas,
        'tugas' => $grades['tugas'] ?? null,
        'hadir' => $grades['hadir'] ?? null,
        'akhir' => $akhir,
        'huruf' => $akhir !== null ? grade_huruf($akhir) : null,
    );
}

/**
 * Hitung nilai akhir seorang mahasiswa (satu agregat per sumber data).
 * Return array { kuis_latihan, kuis_evaluasi, kuis_pct, pts, uas, tugas, hadir, akhir, huruf }.
 */
function compute_nilai(string $nim): array
{
    $st = db()->prepare(
        'SELECT SUM(quiz_score) s, SUM(quiz_total) t FROM progress WHERE nim = ? AND quiz_total > 0'
    );
    $st->execute(array($nim));
    $q = $st->fetch();
    $latihanTotal = $q ? (int) $q['t'] : 0;
    $latihanSkor = $latihanTotal > 0 ? (int) $q['s'] : null;

    list($evalSkor, $evalTotal) = evaluasi_sum($nim);

    return compute_nilai_dari($latihanSkor, $latihanTotal, $evalSkor, $evalTotal, manual_grades($nim));
}