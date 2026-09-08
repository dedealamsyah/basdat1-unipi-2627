<?php
/**
 * Kelola metadata menu pertemuan.
 * - GET  /api/pertemuan.php            : daftar (publik, untuk overlay navigasi)
 * - POST /api/pertemuan.php (admin)    : update metadata
 *   body: { "updates": [ {"id":1,"title":"","subtitle":"","aktif":1,"posisi":1,"alokasi":"","bobot":"","cpmk":""} ] }
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    require_auth('admin');
    $in = json_in();
    $updates = isset($in['updates']) && is_array($in['updates']) ? $in['updates'] : array();
    if (empty($updates)) {
        json_out(array('ok' => false, 'error' => 'Tidak ada data untuk diperbarui.'), 422);
    }

    $pdo = db();
    $upd = $pdo->prepare(
        'UPDATE pertemuan SET
            title = COALESCE(?, title),
            subtitle = COALESCE(?, subtitle),
            aktif = COALESCE(?, aktif),
            posisi = COALESCE(?, posisi),
            alokasi = COALESCE(?, alokasi),
            bobot = COALESCE(?, bobot),
            cpmk = COALESCE(?, cpmk)
         WHERE id = ?'
    );
    foreach ($updates as $u) {
        $id = (int) ($u['id'] ?? 0);
        if ($id < 1) continue;
        $title = isset($u['title']) ? trim((string) $u['title']) : null;
        $subtitle = isset($u['subtitle']) ? trim((string) $u['subtitle']) : null;
        $aktif = isset($u['aktif']) ? (int) (bool) $u['aktif'] : null;
        $posisi = isset($u['posisi']) ? (int) $u['posisi'] : null;
        $alokasi = isset($u['alokasi']) ? trim((string) $u['alokasi']) : null;
        $bobot = isset($u['bobot']) ? trim((string) $u['bobot']) : null;
        $cpmk = isset($u['cpmk']) ? trim((string) $u['cpmk']) : null;
        $upd->execute(array($title, $subtitle, $aktif, $posisi, $alokasi, $bobot, $cpmk, $id));
    }
}

// respons daftar (publik)
$rows = db()->query('SELECT id, title, subtitle, aktif, posisi, alokasi, bobot, cpmk FROM pertemuan ORDER BY posisi ASC, id ASC')
    ->fetchAll();

$list = array();
foreach ($rows as $r) {
    $list[] = array(
        'id' => (int) $r['id'],
        'title' => $r['title'],
        'subtitle' => $r['subtitle'],
        'aktif' => (bool) $r['aktif'],
        'posisi' => (int) $r['posisi'],
        'alokasi' => $r['alokasi'],
        'bobot' => $r['bobot'],
        'cpmk' => $r['cpmk'],
    );
}

json_out(array('ok' => true, 'data' => array('pertemuan' => $list)));