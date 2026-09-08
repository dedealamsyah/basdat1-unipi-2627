<?php
/**
 * API Portal Materi Basis Data UNIPI
 * Konfigurasi koneksi database MySQL Byethost + helper.
 * File ini TIDAK boleh diakses langsung via URL (lihat .htaccess).
 */
declare(strict_types=1);

const DB_HOST = 'YOUR_DB_HOST';
const DB_NAME = 'YOUR_DB_NAME';
const DB_USER = 'YOUR_DB_USER';
const DB_PASS = 'YOUR_DB_PASS';

/** Default password akun saat diimpor = NIM */
const DO_NOT_LOG = true;

/** Token satu-kali untuk setup database (ubah setelah setup) */
const SETUP_TOKEN = 'YOUR_SETUP_TOKEN';

/** Akun admin awal yang dibuat saat setup */
const ADMIN_DEFAULT_NIM = 'admin';
const ADMIN_DEFAULT_PASS = 'YOUR_ADMIN_PASS';

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

function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params(array('httponly' => true, 'samesite' => 'Lax'));
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
            'DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL ' . LOGIN_WINDOW_MINUTES . ' MINUTE)'
        )->execute();
        $st = $pdo->prepare(
            'SELECT COUNT(*) c FROM login_attempts
             WHERE (ip = ? OR username = ?) AND ok = 0'
        );
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $st->execute(array($ip, strtolower($username)));
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
            'DELETE FROM login_attempts WHERE ip = ? OR username = ?'
        )->execute(array($_SERVER['REMOTE_ADDR'] ?? 'unknown', strtolower($username)));
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

/** Daftar id pertemuan aktif (konten tersedia), urut progresi */
function active_pertemuan(): array
{
    return array(1, 2, 3, 4, 5, 6, 7, 9, 10);
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
 * Hitung nilai akhir dari skor kuis + nilai manual.
 * Return array { kuis_pct, pts, uas, tugas, hadir, akhir, huruf }.
 */
function compute_nilai(string $nim): array
{
    $st = db()->prepare(
        'SELECT quiz_score, quiz_total FROM progress WHERE nim = ? AND quiz_total > 0'
    );
    $st->execute(array($nim));
    $qs = 0;
    $qt = 0;
    foreach ($st as $r) {
        $qs += (int) $r['quiz_score'];
        $qt += (int) $r['quiz_total'];
    }
    $kuisPct = $qt > 0 ? round(($qs / $qt) * 100) : null;

    $g = manual_grades($nim);
    $pts = $g['pts'] ?? null;
    $uas = $g['uas'] ?? null;

    $akhir = null;
    if ($kuisPct !== null && $pts !== null && $uas !== null) {
        $w = grade_weights();
        $akhir = round(
            $kuisPct * $w['kuis'] + $pts * $w['pts'] + $uas * $w['uas']
        );
    }

    return array(
        'kuis_pct' => $kuisPct,
        'pts' => $pts,
        'uas' => $uas,
        'tugas' => $g['tugas'] ?? null,
        'hadir' => $g['hadir'] ?? null,
        'akhir' => $akhir,
        'huruf' => $akhir !== null ? grade_huruf($akhir) : null,
    );
}