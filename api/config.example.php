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
}

function current_user(): ?array
{
    start_session();
    return isset($_SESSION['user']) ? $_SESSION['user'] : null;
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