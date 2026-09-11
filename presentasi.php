<?php
/**
 * Mode Presentasi Dosen - gate sisi server + render slide di server.
 *
 * Keputusan akses diambil dari sesi (role admin) di server, BUKAN dari
 * fetch /api/me.php di sisi klien. Ketika admin, slide di-render langsung
 * menjadi HTML statis (navigasi prev/next = link ?p=N&s=INDEX), sehingga
 * presentasi tetap berfungsi walau JavaScript gagal/terblokir di browser.
 *
 * URL: /presentasi.php?p={id_pertemuan}[&s={indeks_slide}]
 * Konten HTML dibaca dari hasil build statis per pertemuan.
 */
declare(strict_types=1);
require __DIR__ . '/api/config.php';

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

$id = (int) ($_GET['p'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    exit('Perlu parameter p (id pertemuan).');
}

$file = __DIR__ . '/pertemuan/' . $id . '/presentasi/index.html';
if (!is_file($file)) {
    http_response_code(404);
    exit('Halaman presentasi tidak ditemukan.');
}

$u = current_user();
$isAdmin = $u !== null && ($u['role'] ?? '') === 'admin';
$next = '/login?next=' . urlencode('/presentasi.php?p=' . $id);

$html = file_get_contents($file);
$sessName = session_name();
$hasSessCookie = isset($_COOKIE[$sessName]);
$stamp = ($isAdmin ? 'server:1' : 'server:0') . '·ck' . ($hasSessCookie ? '1' : '0');
$html = str_replace('build 2026.09.3', 'build 2026.09.3 · ' . $stamp, $html);

/* ============================================================
   ADMIN: render slide di server (tidak bergantung JavaScript)
   ============================================================ */
if ($isAdmin) {
    // Ambil metadata pertemuan dari #presMeta
    $meta = array();
    foreach (array('data-pertemuan', 'data-title', 'data-subtitle', 'data-cpmk', 'data-alokasi', 'data-bobot') as $attr) {
        if (preg_match('~' . preg_quote($attr, '~') . '="([^"]*)"~', $html, $mm)) {
            $meta[$attr] = $mm[1];
        } else {
            $meta[$attr] = '';
        }
    }
    $ptId = (int) ($meta['data-pertemuan'] ?: $id);
    $title = $meta['data-title'];
    $subtitle = $meta['data-subtitle'];
    $cpmk = $meta['data-cpmk'];
    $alokasi = $meta['data-alokasi'];
    $bobot = $meta['data-bobot'];

    // Ambil isi <article id="presArticle">
    if (!preg_match('~<article\b[^>]*>\s*(.*?)\s*</article>~is', $html, $m)) {
        http_response_code(500);
        exit('Struktur halaman presentasi tidak sesuai.');
    }
    $content = $m[1];

    // Pecah menurut <h2> -> tiap bagian = satu slide
    $parts = preg_split('/(<h2\b[^>]*>.*?<\/h2>)/is', $content, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
    $sections = array();
    $cur = null;
    $coverExtra = '';
    foreach ($parts as $part) {
        if (preg_match('~^<h2\b~is', $part)) {
            if ($cur !== null) {
                $sections[] = $cur;
            }
            $cur = array('label' => trim(strip_tags($part)), 'html' => '');
        } elseif ($cur === null) {
            $coverExtra .= $part;
        } else {
            $cur['html'] .= $part;
        }
    }
    if ($cur !== null) {
        $sections[] = $cur;
    }

    $s = (int) ($_GET['s'] ?? 0);
    if ($s < 0 || $s >= count($sections) + 2) {
        $s = 0;
    }
    $total = count($sections) + 2; // + cover + penutup

    $num = str_pad((string) $ptId, 2, '0', STR_PAD_LEFT);

    // --- build all slides ---
    $slides = array();

    // slide 0: cover
    $chips = '';
    if ($alokasi !== '') {
        $chips .= '<span class="chip">⏱ ' . e($alokasi) . '</span>';
    }
    if ($bobot !== '') {
        $chips .= '<span class="chip chip--amber">BOBOT ' . e($bobot) . '</span>';
    }
    $chips .= '<span class="chip">S1 Informatika · UNIPI</span>';
    $slides[] = '<section id="s0" class="ps-slide ps-slide--cover' . ($s === 0 ? ' is-active' : '') . '">'
        . '<div class="ps-slide__inner">'
        . '<span class="ps-cover__badge">PERTEMUAN ' . $num . ' · ' . e($cpmk !== '' ? $cpmk : 'CPMK') . '</span>'
        . '<h1 class="ps-cover__title">' . e($title) . '</h1>'
        . ($subtitle !== '' ? '<p class="ps-cover__sub">' . e($subtitle) . '</p>' : '')
        . '<div class="ps-cover__chips">' . $chips . '</div>'
        . ($coverExtra != '' ? '<div class="ps-cover__extra">' . $coverExtra . '</div>' : '')
        . '<p class="ps-cover__hint">Navigasi: tombol <kbd>›</kbd> / link di bawah · <kbd>F</kbd> layar penuh (jika browser mendukung)</p>'
        . '<p class="ps-cover__chips" style="margin-top:18px;"><a class="btn-sim" href="/presentasi.php?p=' . $id . '&amp;s=1" style="background:var(--teal-400); text-decoration:none;">Mulai Presentasi →</a></p>'
        . '</div></section>';

    // slide tengah: tiap bagian
    foreach ($sections as $i => $sec) {
        $n = $i + 1;
        $active = ($s === $n) ? ' is-active' : '';
        $slides[] = '<section id="s' . $n . '" class="ps-slide' . $active . '">'
            . '<div class="ps-slide__heading"><span class="ps-slide__no">' . str_pad((string) $n, 2, '0', STR_PAD_LEFT) . '</span><span>' . e($sec['label']) . '</span></div>'
            . '<div class="ps-slide__body">' . $sec['html'] . '</div>'
            . '</section>';
    }

    // slide terakhir: penutup
    $endIdx = $total - 1;
    $slides[] = '<section id="s' . $endIdx . '" class="ps-slide ps-slide--end' . ($s === $endIdx ? ' is-active' : '') . '">'
        . '<div class="ps-slide__inner">'
        . '<div class="ps-end__icon">✓</div>'
        . '<h2 class="ps-end__title">Terima kasih</h2>'
        . '<p class="ps-end__text">Demikian materi ' . e($title) . '. Silakan lanjutkan ke bagian berikutnya atau buka halaman materi untuk latihan &amp; evaluasi.</p>'
        . '<div class="ps-cover__chips"><a class="btn-sim" href="/pertemuan/' . $ptId . '">Buka Halaman Materi</a></div>'
        . '</div></section>';

    $slidesHtml = implode("\n", $slides);

    // Ganti <article> dengan slide hasil render server
    $html = preg_replace('~<article\b[^>]*>\s*(.*?)\s*</article>~is', $slidesHtml, $html, 1);

    // Tampilkan #presApp (buang hidden) & sembunyikan gate (server decide)
    $html = str_replace('id="presApp" hidden', 'id="presApp"', $html);
    $html = str_replace(
        '<div class="pres-gate" id="presGate">',
        '<div class="pres-gate" id="presGate" hidden style="display:none">',
        $html
    );

    // Suntik keputusan akses + sembunyikan tombol daftar slide (server mode)
    $inject = '<script>window.__PRES_GATE="server";</script>'
        . '<style id="presServerHide">#presListBtn{display:none}</style>';
    $html = str_replace('</head>', $inject . '</head>', $html);

    // Nav prev/next + counter + progress (link murni, tanpa JS)
    $prevHref = $s > 0 ? '/presentasi.php?p=' . $id . '&amp;s=' . ($s - 1) : null;
    $nextHref = $s < $total - 1 ? '/presentasi.php?p=' . $id . '&amp;s=' . ($s + 1) : null;

    $prevBtn = $prevHref !== null
        ? '<a class="ps-btn" id="presPrev" href="' . $prevHref . '" style="text-decoration:none">‹ Sebelumnya</a>'
        : '<span class="ps-btn" id="presPrev" style="opacity:.4">‹ Sebelumnya</span>';
    $nextBtn = $nextHref !== null
        ? '<a class="ps-btn ps-btn--primary" id="presNext" href="' . $nextHref . '" style="text-decoration:none">Berikutnya ›</a>'
        : '<span class="ps-btn ps-btn--primary" id="presNext" style="opacity:.4">Berikutnya ›</span>';

    $html = str_replace(
        '<button class="ps-btn" id="presPrev" title="Sebelumnya (←)">‹ Sebelumnya</button>',
        $prevBtn,
        $html
    );
    $html = str_replace(
        '<button class="ps-btn ps-btn--primary" id="presNext" title="Berikutnya (→)">Berikutnya ›</button>',
        $nextBtn,
        $html
    );
    $html = str_replace(
        '<span class="pres__counter" id="presCounter">1 / 1</span>',
        '<span class="pres__counter" id="presCounter">' . ($s + 1) . ' / ' . $total . '</span>',
        $html
    );
    $html = str_replace(
        '<div class="pres__progress-fill" id="presProgress"></div>',
        '<div class="pres__progress-fill" id="presProgress" style="width:' . (int) round(($s + 1) / $total * 100) . '%"></div>',
        $html
    );

    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    echo $html;
    exit;
}

/* ============================================================
   NON-ADMIN: halaman statis + suntik keputusan akses
   ============================================================ */
$inject = '<script>window.__PRES_GATE="no";window.__PRES_NEXT=' . json_encode($next) . ';</script>';
$html = str_replace('</head>', $inject . '</head>', $html);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
echo $html;