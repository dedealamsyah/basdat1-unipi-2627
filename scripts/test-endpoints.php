<?php
/**
 * Smoke test endpoint API (v2.9.1).
 *
 * Cara kerja: setiap endpoint di-*salin* ke direktori sementara bersama
 * `config.php` tiruan (stub). Karena endpoint memakai `__DIR__ . '/config.php'`,
 * file tiruan itulah yang termuat — tanpa PDO, tanpa sesi asli.
 *
 * Tujuannya BUKAN menguji logika bisnis (itu tugas test-rekap.php), melainkan
 * menangkap galat yang lolos `php -l`:
 *
 *   - variabel tak terdefinisi  <- inilah bug v2.9.0 yang bikin seluruh portal
 *     tampak logout lalu halaman login reload terus-menerus
 *   - fungsi tak terdefinisi
 *   - endpoint yang tidak mengeluarkan JSON
 *
 * Warning/notice/deprecated apa pun diperlakukan sebagai GAGAL. Jalankan:
 *   php scripts/test-endpoints.php      atau   npm run test:api
 */
declare(strict_types=1);

// Handler galat: php -l tidak menangkap apa pun saat runtime.
$MASALAH = array();
set_error_handler(function (int $sev, string $msg, string $file = '', int $line = 0) use (&$MASALAH): bool {
    $jenis = array(
        E_WARNING => 'WARNING', E_NOTICE => 'NOTICE', E_DEPRECATED => 'DEPRECATED',
        E_USER_WARNING => 'USER_WARNING', E_USER_NOTICE => 'USER_NOTICE',
    );
    $MASALAH[] = sprintf('%s: %s (%s:%d)', $jenis[$sev] ?? ('E' . $sev), $msg, basename($file), $line);
    return true;
});
error_reporting(E_ALL);

$SANDBOX = sys_get_temp_dir() . '/api-smoke-' . getmypid();
@mkdir($SANDBOX, 0775, true);

/* ---------------------------------------------------------------------------
 * config.php tiruan: semua helper yang dibutuhkan endpoint, tanpa database.
 * ------------------------------------------------------------------------- */
$STUB = <<<'PHP'
<?php
declare(strict_types=1);

function json_out(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function json_in(): array {
    // php://input tidak dapat ditulis dari `php -r`, jadi smoke test
    ///memberi body lewat file yang jalurnya ada di env SMOKE_BODY.
    $f = getenv('SMOKE_BODY');
    $raw = ($f && is_file($f)) ? file_get_contents($f) : '';
    $d = json_decode($raw !== false && $raw !== '' ? $raw : '{}', true);
    return is_array($d) ? $d : array();
}
function start_session(): void { $_SESSION['csrf'] = $_SESSION['csrf'] ?? 'tok'; }
function current_user(): ?array { return $_SESSION['user'] ?? null; }
function require_auth(string $role = 'mahasiswa'): array {
    $u = current_user();
    if (!$u) { json_out(array('ok' => false, 'error' => 'Silakan login terlebih dahulu.'), 401); }
    if ($role === 'admin' && ($u['role'] ?? '') !== 'admin') {
        json_out(array('ok' => false, 'error' => 'Akses khusus admin.'), 403);
    }
    return $u;
}
function csrf_ok(): bool { return ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '') === ($_SESSION['csrf'] ?? 'x'); }
function require_csrf(): void { if (!csrf_ok()) { json_out(array('ok' => false, 'error' => 'Token tidak valid.'), 403); } }

// Kunci: P1 & P2 punya latihan & evaluasi, P3 hanya latihan.
function _kunci_demo(): array {
    return array(
        1 => array('id' => array('q1', 'q2', 'q3'), 'benar' => array(1, 0, 2), 'opsi' => array(3, 3, 3), 'jelas' => array('a', 'b', 'c')),
        2 => array('id' => array('q1', 'q2'), 'benar' => array(0, 1), 'opsi' => array(3, 3), 'jelas' => array('x', 'y')),
        3 => array('id' => array('q1'), 'benar' => array(0), 'opsi' => array(2), 'jelas' => array('z')),
    );
}
function _eval_kunci_demo(): array {
    return array(
        1 => array('benar' => array(0, 1), 'opsi' => array(2, 2)),
        2 => array('benar' => array(0, 1), 'opsi' => array(2, 2)),
    );
}
function kuis_kunci_map(): array { static $m; return $m ??= _kunci_demo(); }
function kuis_kunci(int $p): ?array { $m = kuis_kunci_map(); return $m[$p] ?? null; }
function eval_kunci_map(): array { static $m; return $m ??= _eval_kunci_demo(); }
function eval_kunci(int $p): ?array { $m = eval_kunci_map(); return $m[$p] ?? null; }

function kuis_nilai(int $pertemuanId, array $terpilih): ?array {
    $k = kuis_kunci($pertemuanId);
    if ($k === null) { return null; }
    $ids = $k['id']; $jumlah = count($ids); $benar = 0; $tertawab = 0; $rinci = array();
    foreach ($ids as $i => $qid) {
        if (!array_key_exists($qid, $terpilih)) { continue; }
        $ok = (int) $terpilih[$qid] === (int) $k['benar'][$i];
        $rinci[$qid] = $ok; $tertawab++; if ($ok) { $benar++; }
    }
    return array('benar' => $benar, 'jumlah' => $jumlah, 'tertawab' => $tertawab,
        'tuntas' => ($tertawab === $jumlah && $benar === $jumlah), 'rinci' => $rinci);
}
function rekap_mahasiswa(array $active, array $statusMap, array $evaluasi, array $tugasStatus, array $skorLatihan): array {
    $out = array();
    foreach ($active as $pid) {
        $pid = (int) $pid;
        $lat = $skorLatihan[$pid] ?? null; $ev = $evaluasi[$pid] ?? null;
        $out[$pid] = array(
            'status' => $statusMap[$pid] ?? 'locked',
            'ada_latihan' => kuis_kunci($pid) !== null,
            'ada_evaluasi' => eval_kunci($pid) !== null,
            'ada_tugas' => !empty($tugasStatus[$pid]),
            'latihan' => array('skor' => $lat ? $lat['skor'] : 0, 'total' => $lat ? $lat['total'] : 0,
                'pct' => ($lat && $lat['total'] > 0) ? (int) round($lat['skor'] / $lat['total'] * 100) : null),
            'evaluasi' => array('skor' => $ev ? $ev['skor'] : 0, 'total' => $ev ? $ev['total'] : 0,
                'pct' => ($ev && $ev['total'] > 0) ? (int) round($ev['skor'] / $ev['total'] * 100) : null,
                'flagged' => $ev ? $ev['flagged'] : 0),
        );
    }
    return $out;
}
function progress_skor(string $nim): array { return array(1 => array('skor' => 3, 'total' => 3)); }
function active_pertemuan(): array { return array(1, 2, 3); }
function done_set(string $nim): array { return array(1); }
function status_map(string $nim): array { return array(1 => 'done', 2 => 'open', 3 => 'locked'); }
function evaluasi_rows(string $nim): array { return array(1 => array('skor' => 42, 'total' => 100, 'jumlah_soal' => 2, 'flagged' => 0, 'paste_count' => 0, 'copy_count' => 0, 'blur_count' => 0, 'time_spent_ms' => 0, 'submitted_at' => '2026-09-28 10:00:00')); }
function evaluasi_sum(string $nim): array { return array(42, 100); }
function manual_grades(string $nim): array { return array(); }
function compute_nilai(string $nim): array { return compute_nilai_dari(100, 100, 42, 100, array()); }
function compute_nilai_dari(?int $latihanSkor, int $latihanTotal, int $evalSkor, int $evalTotal, array $grades): array {
    $lpct = ($latihanTotal > 0 && $latihanSkor !== null) ? (int) round($latihanSkor / $latihanTotal * 100) : null;
    $epct = $evalTotal > 0 ? (int) round($evalSkor / $evalTotal * 100) : null;
    $kuis = ($lpct !== null && $epct !== null) ? (int) round(($lpct + $epct) / 2) : ($lpct ?? $epct);
    return array('kuis_latihan' => $lpct, 'kuis_evaluasi' => $epct, 'kuis_pct' => $kuis,
        'pts' => null, 'uas' => null, 'tugas' => null, 'hadir' => null, 'akhir' => null, 'huruf' => null);
}
function grade_weights(): array { return array('kuis' => 0.4, 'pts' => 0.3, 'uas' => 0.3); }
function grade_huruf(float $n): string { return $n >= 80 ? 'A' : 'B'; }
class SmokeStmt {
    public function execute($p = null) { return true; }
    public function fetch($mode = null) { return false; }
    public function fetchAll($mode = null) { return array(); }
    public function fetchColumn($i = 0) { return 0; }
    public function rowCount() { return 0; }
}
class SmokePdo {
    public function prepare($sql, $opt = array()) { return new SmokeStmt(); }
    public function query($sql) { return new SmokeStmt(); }
    public function exec($sql) { return true; }
    public function beginTransaction() { return true; }
    public function commit() { return true; }
    public function rollBack() { return true; }
    public function inTransaction() { return false; }
    public function lastInsertId() { return 0; }
}
function db() { static $p; return $p ??= new SmokePdo(); }
function set_exception_handler_stub(callable $h): void { }
PHP;

file_put_contents($SANDBOX . '/config.php', $STUB . "\n");

/* ---------------------------------------------------------------------------
 * Skenario: (file, method, query, body, sesi)
 * ------------------------------------------------------------------------ */
function sesiMahasiswa(): array {
    return array('user' => array('nim' => '22101', 'nama' => 'Andi', 'kelas' => 'IF3A', 'role' => 'mahasiswa'),
        'csrf' => 'tok');
}
function sesiAdmin(): array {
    return array('user' => array('nim' => 'admin', 'nama' => 'Dosen', 'kelas' => '', 'role' => 'admin'),
        'csrf' => 'tok');
}

$skenario = array(
    // nama, file, method, query, body, sesi, mau cek apa
    array('me.php tamu', 'me.php', 'GET', array(), null, array(), 200),
    array('me.php mahasiswa', 'me.php', 'GET', array(), null, sesiMahasiswa(), 200),
    array('me.php admin', 'me.php', 'GET', array(), null, sesiAdmin(), 200),
    array('quiz.php GET tamu', 'quiz.php', 'GET', array('pertemuan_id' => '1'), null, array(), 401),
    array('quiz.php GET mhs', 'quiz.php', 'GET', array('pertemuan_id' => '1'), null, sesiMahasiswa(), 200),
    array('quiz.php POST benar', 'quiz.php', 'POST', array(),
        array('pertemuan_id' => 1, 'jawaban' => array('q1' => 1, 'q2' => 0, 'q3' => 2)), sesiMahasiswa(), 200),
    array('quiz.php POST salah', 'quiz.php', 'POST', array(),
        array('pertemuan_id' => 1, 'jawaban' => array('q1' => 0)), sesiMahasiswa(), 200),
    array('quiz.php POST admin', 'quiz.php', 'POST', array(),
        array('pertemuan_id' => 1, 'jawaban' => array('q1' => 1)), sesiAdmin(), 403),
    array('complete.php POST', 'complete.php', 'POST', array(),
        array('pertemuan_id' => 1, 'jawaban' => array('q1' => 1, 'q2' => 0, 'q3' => 2)), sesiMahasiswa(), 200),
    array('admin.php GET', 'admin.php', 'GET', array(), null, sesiAdmin(), 200),
    array('admin.php kunci', 'admin.php', 'GET', array('kunci' => '1'), null, sesiAdmin(), 200),
    array('admin.php kuis', 'admin.php', 'GET', array('kuis' => '1'), null, sesiAdmin(), 200),
);

$gagal = 0;
$lewati = 0;

echo "== Smoke test endpoint (stub, tanpa DB) ==\n";
foreach ($skenario as $s) {
    list($nama, $file, $method, $query, $body, $sesi, $harus) = $s;

    if (!is_file('api/' . $file)) { echo "  lewati $nama (berkas tidak ada)\n"; $lewati++; continue; }
    copy('api/' . $file, $SANDBOX . '/' . $file);

    $MASALAH = array();
    $bodyFile = $SANDBOX . '/body.json';
    file_put_contents($bodyFile, $body === null ? '' : json_encode($body));

    $script = '';
    $script .= '$_SESSION = ' . var_export($sesi, true) . ";\n";
    $script .= '$_SERVER["REQUEST_METHOD"] = ' . var_export($method, true) . ";\n";
    $script .= '$_SERVER["HTTP_X_CSRF_TOKEN"] = "tok";' . "\n";
    $script .= '$_GET = ' . var_export($query, true) . ";\n";
    $script .= '$_POST = array();' . "\n";
    $script .= 'require ' . var_export($SANDBOX . '/' . $file, true) . ";\n";

    $cmd = sprintf(
        'SMOKE_BODY=%s %s -d error_reporting=E_ALL -d display_errors=1 -d log_errors=0 -r %s 2>&1',
        escapeshellarg($bodyFile),
        escapeshellarg(PHP_BINARY),
        escapeshellarg($script)
    );
    $keluaran = shell_exec($cmd);
    $keluaran = trim((string) $keluaran);

    $json = json_decode($keluaran, true);
    $adaGalat = stripos($keluaran, 'Warning') !== false
        || stripos($keluaran, 'Notice') !== false
        || stripos($keluaran, 'Deprecated') !== false
        || stripos($keluaran, 'Fatal error') !== false
        || stripos($keluaran, 'Uncaught') !== false;

    if ($adaGalat) {
        echo "  GAGAL $nama — galat runtime:\n";
        foreach (explode("\n", $keluaran) as $l) { echo "        " . $l . "\n"; }
        $gagal++;
        continue;
    }
    if ($json === null) {
        echo "  GAGAL $nama — keluarannya bukan JSON: " . substr($keluaran, 0, 120) . "\n";
        $gagal++;
        continue;
    }
    if (($json['ok'] ?? false) !== true && $harus === 200) {
        echo "  GAGAL $nama — ok=false: " . ($json['error'] ?? '?') . "\n";
        $gagal++;
        continue;
    }
    // 401/403 memang yang diharapkan pada skenario menolak
    if ($harus === 401 || $harus === 403) {
        if (($json['ok'] ?? true) !== false) { echo "  GAGAL $nama — seharusnya ditolak\n"; $gagal++; continue; }
    }
    echo "  OK   $nama (HTTP $harus)\n";

    // Cek khusus: me.php untuk mahasiswa WAJIB punya rekap berisi 3 pertemuan.
    if ($nama === 'me.php mahasiswa') {
        $r = $json['data']['rekap'] ?? null;
        if (!is_array($r) || count($r) !== 3) {
            echo "  GAGAL me.php mahasiswa — rekap berisi " . (is_array($r) ? count($r) : '?') . " pertemuan, harap 3\n";
            $gagal++;
        } else {
            echo "       rekap: 3 pertemuan, P1 status=" . $r[1]['status'] .
                " eval_pct=" . var_export($r[1]['evaluasi']['pct'], true) . "\n";
        }
        if (array_key_exists('nilai', $json['data']) === false) {
            echo "  GAGAL me.php mahasiswa — field nilai hilang\n"; $gagal++;
        }
    }
}

echo "\n";
if ($gagal === 0) {
    echo "SEMUA UJI LULUS (" . (count($skenario) - $lewati) . " skenario)\n";
} else {
    echo "$gagal SKENARIO GAGAL\n";
}

// Bersihkan sandbox.
foreach (glob($SANDBOX . '/*') as $f) { @unlink($f); }
@rmdir($SANDBOX);

exit($gagal === 0 ? 0 : 1);
