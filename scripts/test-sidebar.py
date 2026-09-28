"""
Periksa CSS sidebar di build: struktur flex, atasan [hidden], dan
apakah markup sidebar sesuai dengan yang diharapkan mhs-ui.js.

Menangkap kelas bug layout yang tidak terlihat di `astro check` maupun
`php -l` — misalnya dua scrollbar, atau `display:flex` yang mengalahkan
atribut `hidden`.
"""
import io, os, re, sys

root = "/Users/dedealamsyah/MyLearn/basdat1-unipi-2627"
dist = os.path.join(root, "dist")
css_file = None
for f in os.listdir(os.path.join(dist, "_astro")):
    if f.startswith("Sidebar.") and f.endswith(".css"):
        css_file = os.path.join(dist, "_astro", f)
        break
if css_file is None:
    print("✗ CSS Sidebar tidak ditemukan di dist/_astro")
    sys.exit(1)

css = io.open(css_file, encoding="utf-8").read()
gagal = 0


def cek(nama, syarat, detail=""):
    global gagal
    if syarat:
        print("  OK   %s" % nama)
    else:
        print("  GAGAL %s %s" % (nama, detail))
        gagal += 1


def semua_blok(selektor):
    """Semua badan aturan CSS untuk selektor (CSS ter-build sudah diminifikasi)."""
    return [m.group(1) for m in re.finditer(re.escape(selektor) + r'\s*\{([^}]*)\}', css)]


def blok(selektor, mau=None):
    """Ambil satu aturan.

    Selektor bisa punya beberapa aturan (desktop + media query + print).
    `mau` = regex yang harus cocok di dalam aturan, untuk memilih yang benar;
    tanpa itu, ambil yang terpanjang (biasanya aturan desktop paling lengkap)."""
    kandidat = semua_blok(selektor)
    if mau is not None:
        for isi in kandidat:
            if re.search(mau, isi):
                return isi
        return None
    return max(kandidat, key=len) if kandidat else None


print("== Struktur sidebar (CSS ter-build) ==")

b = blok(".sidebar")
cek(".sidebar jadi flex column", b and re.search(r"flex-direction:\s*column", b))
cek(".sidebar setinggi layar", b and re.search(r"height:\s*100vh", b))
cek(".sidebar overflow hidden (bukan auto)",
    b and re.search(r"overflow:\s*hidden", b), "-> dua scrollbar bertumpuk" if b else "")

b = blok(".sidebar__nav")
cek(".sidebar__nav flex (menyerap sisa ruang)", b and re.search(r"flex:\s*(1|auto)", b))
cek(".sidebar__nav min-height:0 (boleh shrink)", b and re.search(r"min-height:\s*0", b))
cek(".sidebar__nav overflow-y:auto (satu-satunya scroll)",
    b and re.search(r"overflow-y:\s*auto", b))
cek(".sidebar__nav punya scrollbar tipis", ".sidebar__nav::-webkit-scrollbar" in css)

b = blok(".sidebar__list")
cek(".sidebar__list TIDAK lagi flex:1", b and "flex" not in b, "-> 3 daftar berebut ruang" if b else "")
cek(".sidebar__list padding ramping (desktop)", b and re.search(r"padding:\s*4px 10px", b))
mobile_l = re.findall(r'\.sidebar__list\s*\{([^}]*)\}', css)
cek("tidak ada max-height pada daftar (mobile)",
    not any("max-height" in x for x in mobile_l), "-> daftar jadi area scroll kedua")

b = blok(".sidebar__footer")
cek(".sidebar__footer flex:none (tidak gepeng)", b and re.search(r"flex:\s*(0|none)", b))

print("\n== Aturan [hidden] wajib ada ==")
# Elemen yang masih memakai atribut `hidden` perlu aturan [hidden], karena
# `display` eksplisit di class mengalahkan atribut itu. .appbar TIDAK lagi
# memakai hidden (v2.9.4: selalu tampil, berisi tautan "Masuk" untuk tamu).
for sel in [".sidebar__notif[hidden]", ".pageStatus[hidden]",
            ".dash[hidden]", ".iconbtn .badge[hidden]", ".notif-panel__empty[hidden]"]:
    cek(sel, sel in css, "-> display:flex mengalahkan atribut hidden")

print("\n== Variabel CSS ==")
d = set(re.findall(r'(--[a-z0-9-]+)\s*:', css))
u = set(re.findall(r'var\((--[a-z0-9-]+)', css))
hilang = sorted(u - d)
cek("tidak ada var() tanpa definisi", not hilang, "-> %s" % ", ".join(hilang))

print("\n== Kartu akun di header (v2.9.4) ==")
for label, pola in [
    (".appbar__ada (kartu akun di app bar)", r"\.appbar__account"),
    (".appbar__login (tautan Masuk untuk tamu)", r"\.appbar__login"),
    (".mh-account (kartu akun di mobile header)", r"\.mh-account"),
    (".mh-account__login (Masuk di mobile)", r"\.mh-account__login"),
    (".acc__avatar--sm (avatar versi mobile)", r"\.acc__avatar--sm"),
    (".acc__logout--sm (keluar versi mobile)", r"\.acc__logout--sm"),
]:
    cek(label, re.search(pola, css) is not None)
cek("kartu akun tidak lagi di sidebar", ".sidebar__account" not in css,
    "-> masih ada gaya sidebar yang tidak terpakai")

print("\n== Account box ringkas (v2.9.3) ==")
for label, pola in [
    (".acc__row flex (satu baris)", r"\.acc__row\{[^}]*display:flex"),
    # minifier menulis `flex:auto` untuk `flex: 1 1 auto`, dan `flex:none`
    # untuk `flex: 0 0 auto` — terima keduanya.
    (".acc__id flex+min-width:0 (membuang ruang sisa)", r"\.acc__id\{[^}]*flex:(auto|1)[^}]*min-width:0"),
    (".acc__name ellipsis (nama panjang tidak melebar)", r"\.acc__name\{[^}]*text-overflow:ellipsis"),
    (".acc__logout fixed size (tidak melebar)", r"\.acc__logout\{[^}]*width:28px"),
    (".acc__avatar 30px", r"\.acc__avatar\{[^}]*width:30px"),
    (".acc__logout ada aksi fokus keyboard", r"\.acc__logout:focus-visible"),
]:
    cek(label, re.search(pola, css) is not None)

# Class yang DIHAPUS harus benar-benar hilang, kalau tidak kotak tetap tinggi.
tersisa = 0
for mati in ["acc__mini", "acc__chip", "acc__head"]:
    if re.search(r"\." + mati + r"\s*\{", css):
        print("  GAGAL class lama masih ada: .%s (kotak tetap tinggi)" % mati)
        tersisa += 1
cek("class lama (.acc__mini/.acc__chip/.acc__head) hilang", tersisa == 0)

print("\n== Padding .main (bug 'konten merapat ke atas') ==")
# .main punya beberapa aturan (desktop + 2 media query + print). Yang dicari
# adalah versi DESKTOP: padding 40px. Versi mobile sengaja 60px (ruang untuk
# mobile header) dan print menolaknya dengan !important.
b = blok(".main", r"padding:\s*40px")
cek(".main punya padding atas (desktop)", b and re.search(r"padding:\s*40px", b))
b = blok(".appbar")
cek(".appbar pakai margin negatif -40px", b and re.search(r"margin:\s*-40px", b))

print("\n== Markup sidebar di dist ==")
html = io.open(os.path.join(dist, "index.html"), encoding="utf-8").read()
m = re.search(r'<aside class="sidebar" id="sidebar">([\s\S]*?)</aside>', html)
cek("aside sidebar ada", m is not None)
if m:
    isi = m.group(1)
    cek("ada .sidebar__nav", 'class="sidebar__nav"' in isi)
    cek("ada 3 daftar (main/tools/materi)",
        isi.count('class="sidebar__list') == 3, "-> dapat %d" % isi.count('class="sidebar__list'))
    cek("ada grup label", isi.count('class="sidebar__group"') == 2)
    cek("pill notif ada & hidden", 'id="notifBox"' in isi and re.search(r'id="notifBox"[^>]*hidden', isi) is not None)
    cek("lonceng mobile ada (di luar aside)", "notifBadgeMobile" in html)
    # urutan: brand, progress, notif, search, nav, footer
    urutan = [x for x in ["sidebar__brand", "sidebar__progress", "notifBox",
                          "sidebar__search", "sidebar__nav", "sidebar__footer"]
              if x in isi]
    cek("urutan bagian benar", urutan == ["sidebar__brand", "sidebar__progress", "notifBox",
                                          "sidebar__search", "sidebar__nav", "sidebar__footer"],
        "-> %s" % urutan)

# --- uji negatif: harness harus menangkap regresi yang nyata terjadi ---
# Tujuannya-reverse: kalau suatu perbaikan dihapus, tes ini harus GAGAL.
print("\n== Uji negatif (pola harus terdeteksi) ==")
kasus = [
    ("sidebar__list kembali flex:1",
     re.sub(r'\.sidebar__list\{[^}]*\}', '.sidebar__list{flex:1;padding:4px 10px}', css, count=1),
     lambda c: bool(re.search(r"\.sidebar__list\{[^}]*flex:1", c))),
    ("aturan .sidebar__notif[hidden] dihapus",
     re.sub(r'\.sidebar__notif\[hidden\]\{display:none\}', '', css, count=1),
     lambda c: ".sidebar__notif[hidden]" not in c),
    (".main padding atas jadi 0",
     re.sub(r'\.main\{([^}]*?)padding:40px 56px 80px', r'.main{\1padding:0 56px 80px', css, count=1),
     lambda c: not bool(re.search(r"\.main\{[^}]*padding:40px 56px 80px", c))),
    (".sidebar desktop overflow kembali auto",
     re.sub(r'\.sidebar\{([^}]*?)overflow:hidden', r'.sidebar{\1overflow-y:auto', css, count=1),
     lambda c: not bool(re.search(r"\.sidebar\{width:var\(--sidebar-w\)[^}]*overflow:hidden", c))),
    ("kelas lama .acc__mini muncul lagi (kotak jadi tinggi)",
     css + ".acc__mini{margin-top:8px}",
     lambda c: bool(re.search(r"\.acc__mini\{", c))),
    (".acc__logout kembali melebar (tanpa width tetap)",
     re.sub(r"\.acc__logout\{[^}]*\}", ".acc__logout{padding:3px 10px}", css, count=1),
     lambda c: not bool(re.search(r"\.acc__logout\{[^}]*width:28px", c))),
    ("kartu akun balik lagi ke sidebar",
     css + ".sidebar__account{padding:12px}",
     lambda c: bool(re.search(r"\.sidebar__account\{", c))),
    (".appbar__account hilang (tidak ada tempat masuk)",
     re.sub(r"\.appbar__account\{[^}]*\}", "", css, count=1),
     lambda c: not bool(re.search(r"\.appbar__account", c))),
]
for nama, rusak, deteksi in kasus:
    if rusak == css:
        print("  GAGAL  %s -> pola tidak ditemukan; uji tidak valid" % nama)
        gagal += 1
        continue
    if deteksi(rusak):
        print("  OK     %s (regresi terdeteksi)" % nama)
    else:
        print("  GAGAL  %s (regresi TIDAK terdeteksi - uji lemah)" % nama)
        gagal += 1

print("\n" + ("SEMUA UJI LULUS\n" if gagal == 0 else "%d UJI GAGAL\n" % gagal))
sys.exit(0 if gagal == 0 else 1)
