/* =====================================================================
   auth.js · Otentikasi & progres belajar Portal Basis Data UNIPI
   Menyediakan window.APIAuth + memperbarui UI akun/progres di sidebar.
   Dipanggil dari setiap halaman via layout (BaseLayout.astro).
   ===================================================================== */
(function () {
  "use strict";

  var meCache = null;
  var csrfToken = null;

  async function api(path, opts) {
    opts = opts || {};
    opts.credentials = "same-origin";
    opts.cache = "no-store";
    var method = (opts.method || "GET").toUpperCase();
    if (opts.body && typeof opts.body !== "string" && !(opts.body instanceof FormData)) {
      opts.headers = Object.assign({}, opts.headers || {}, {
        "Content-Type": "application/json"
      });
      opts.body = JSON.stringify(opts.body);
    }
    if (method !== "GET" && method !== "HEAD" && csrfToken) {
      opts.headers = Object.assign({}, opts.headers || {}, { "X-CSRF-Token": csrfToken });
    }
    // Batasi waktu permintaan agar tidak menggantung (mis. server lambat/challenge hosting)
    if (typeof AbortController !== "undefined" && !opts.signal) {
      var ctrl = new AbortController();
      setTimeout(function () { ctrl.abort(); }, 15000);
      opts.signal = ctrl.signal;
    }
    return fetch(path, opts).then(async function (res) {
      try {
        var data = await res.json();
        return { status: res.status, data: data || {} };
      } catch (err) {
        return { status: res.status, data: { ok: false, error: "Respon tidak valid." } };
      }
    });
  }

  async function me(force) {
    if (meCache && !force) return Promise.resolve(meCache);
    return api("/api/me.php").then(function (r) {
      meCache = r.data.data || {};
      if (meCache.logged_in && meCache.csrf) csrfToken = meCache.csrf;
      return meCache;
    }).catch(function () {
      return { logged_in: false, user: null, progress: {}, active: [] };
    });
  }

  async function login(username, password) {
    return api("/api/login.php", { method: "POST", body: { username: username, password: password } })
      .then(function (r) {
        var d = r.data || {};
        if (d.ok && d.data && d.data.user) {
          // sukses atomik: keputusan tidak bergantung panggilan me() lanjutan
          // Simpan SELURUH payload login (user, progress, tugas, evaluasi, active)
          // supaya UI peringatan langsung terisi tanpa fetch ulang.
          meCache = d.data;
          // session diregenerasi di server tetapi data sesi (termasuk CSRF) dipertahankan,
          // jadi token lama tetap valid; muat ulang token juga bila respons login menyediakan.
          if (d.data.csrf) csrfToken = d.data.csrf;
          window.__apiReady = true;
          return d.data;
        }
        return d;
      });
  }

  /* True bila API merespons JSON valid (bukan challenge anti-bot Byethost) */
  async function readyCheck() {
    return me(false).then(function (p) {
      var ok = !!(p && typeof p === "object" && "logged_in" in p);
      if (ok) window.__apiReady = true;
      return ok;
    }).catch(function () { return false; });
  }

  async function logout() {
    return api("/api/logout.php", { method: "POST" }).then(function () {
      meCache = null;
      csrfToken = null;
      return refresh();
    });
  }

  async function changePassword(oldPassword, newPassword) {
    return api("/api/change_password.php", {
      method: "POST",
      body: { old_password: oldPassword, new_password: newPassword }
    }).then(function (r) {
      if (r.data.ok) { meCache = null; csrfToken = null; return r.data; }
      return r.data;
    });
  }

  /* ------------------------------------------------------------------
   * Kuis latihan (v2.8.0): yang dikirim hanya PILIHAN yang diklik.
   * Skor & status tuntas dihitung server dari kunci (api/quiz.php);
   * `quiz_score` dari client sudah tidak dipercaya di mana pun.
   * Bentuk jawaban: { "q1": 2, "q2": 0 } => indeks opsi.
   * ------------------------------------------------------------------ */
  async function gradeQuiz(pertemuanId, jawaban) {
    var r = await api("/api/quiz.php", {
      method: "POST",
      body: { pertemuan_id: pertemuanId, jawaban: jawaban || {} }
    });
    if (r.data && r.data.ok) {
      meCache = null; // progres berubah -> paksa muat ulang di sidebar
      return { ok: true, status: r.status, data: r.data.data || {} };
    }
    return { ok: false, status: r.status, error: (r.data && r.data.error) || "Gagal menyimpan jawaban." };
  }

  /* Baca jawaban yang sudah dinilai (memulihkan tampilan setelah reload). */
  async function quizState(pertemuanId) {
    var r = await api("/api/quiz.php?pertemuan_id=" + encodeURIComponent(pertemuanId));
    if (r.data && r.data.ok) return { ok: true, status: r.status, data: r.data.data || {} };
    return { ok: false, status: r.status };
  }

  /* ---------------- menu pertemuan dari DB (editable admin) ---------------- */
  function loadPertemuanMeta() {
    api("/api/pertemuan.php").then(function (r) {
      var payload = r.data && r.data.data;
      if (!payload || !payload.pertemuan) return;
      applyPertemuanMeta(payload.pertemuan);
    }).catch(function () {});
  }

  function applyPertemuanMeta(list) {
    list.forEach(function (item) {
      var sel = '.sidebar__list .row[data-id="' + item.id + '"], #pertemuanList .row[data-id="' + item.id + '"]';
      document.querySelectorAll(sel).forEach(function (row) {
        var t = row.querySelector('.row__title');
        if (t && item.title) t.textContent = item.title;
        row.classList.toggle('nav-hidden', !item.aktif);
        row.setAttribute('data-pos', String(item.posisi));
      });
    });
    // urutkan ulang menu sidebar sesuai posisi DB
    var ul = document.getElementById('sidebarList');
    if (ul) {
      Array.prototype.slice.call(ul.children)
        .sort(function (a, b) {
          var pa = a.getAttribute('data-pos') || '99';
          var pb = b.getAttribute('data-pos') || '99';
          return pa.localeCompare(pb);
        })
        .forEach(function (n) { ul.appendChild(n); });
    }
  }

  /* ---------------- UI update ---------------- */

  /**
   * Escape HTML untuk sisip ke innerHTML.
   *
   * WAJIB: nama/kelas/NIM berasal dari database (diisi admin lewat
   * import_users.php, atau hasil migrasi/seed) dan TIDAP pernah disanitasi
   * di sisi server. Tanpa escape di sini, satu baris CSV berisi
   * `<img src=x onerror=...>` akan dieksekusi di sidebar SETIAP pengguna
   * yang login — termasuk admin. Semua nilai dari API wajib lewat sini.
   */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function refresh() {
    return me(true).then(function (p) {
      refreshAccountBox(p);
      refreshProgressBar(p);
      refreshPertemuanStates(p);
      enforcePasswordChange(p);
      // Notifikasi, dashboard, dan strip status (v2.9.0) di file terpisah:
      // public/mhs-ui.js. Kegagalan di sana tidak boleh mengganggu auth.
      if (window.MhsUI && window.MhsUI.render) {
        try {
          window.MhsUI.render(p);
        } catch (e) {
          /* abaikan: UI tambahan */
        }
      }
      return p;
    });
  }

  /* Catatan: fungsi notifikasi lama (refreshNotifBox) dihapus di v2.9.0.
     Notifikasi kini dihitung dari `rekap` (latihan/evaluasi + skor) dan
     dirender oleh public/mhs-ui.js, bersama lonceng di header. */

  /* Wajib ganti password sebelum memakai portal (kecuali di halaman itu) */
  function enforcePasswordChange(p) {
    if (!p || !p.logged_in || !p.must_change_password) return;
    var path = location.pathname;
    if (path === "/ganti-password/" || path === "/ganti-password") return;
    var next = encodeURIComponent(path + location.search);
    location.replace("/ganti-password/?next=" + next);
  }

  function refreshPertemuanStates(p) {
    var rows = document.querySelectorAll(
      '.sidebar__list .row[data-id], #pertemuanList .row[data-id]'
    );
    rows.forEach(function (row) {
      var id = row.getAttribute('data-id');
      row.classList.remove('prog-done', 'prog-locked', 'prog-open', 'has-warning');
      if (!p || !p.logged_in) return;
      if (p.user && p.user.role === 'admin') return;

      var st = (p.progress || {})[String(id)];
      if (st === 'done') row.classList.add('prog-done');
      else if (st === 'open') row.classList.add('prog-open');
      else row.classList.add('prog-locked');
    });
  }

  /* Kartu akun (v2.9.4) — pindah dari footer sidebar ke header atas.
   *
   * Dua tempat sekaligus, karena app bar desktop disembunyikan di mobile:
   *   #accountBox       -> app bar (desktop): avatar + nama + NIM·kelas + aksi
   *   #accountBoxMobile -> mobile header: avatar + tombol keluar, tanpa teks
   *
   * Tamu tetap butuh jalan masuk, jadi keduanya menampilkan tautan "Masuk".
   * App bar sengaja TIDAK disembunyikan untuk tamu: isinya konteks halaman
   * yang berguna sekaligus tempat tautan masuk yang selalu terlihat.
   */
  function refreshAccountBox(p) {
    var desktop = document.getElementById("accountBox");
    var mobile = document.getElementById("accountBoxMobile");
    if (!desktop && !mobile) return;

    var next = encodeURIComponent(location.pathname + location.search);

    if (!p || !p.logged_in) {
      if (desktop) {
        desktop.innerHTML = '<a class="appbar__login" href="/login?next=' + next + '">Masuk</a>';
      }
      if (mobile) {
        mobile.innerHTML = '<a class="mh-account__login" href="/login?next=' + next + '">Masuk</a>';
      }
      return;
    }

    var u = p.user || {};
    var isAdmin = u.role === "admin";
    var kelas = u.kelas ? " · " + u.kelas : "";
    var inisial = esc((u.nama || u.nim).charAt(0).toUpperCase());

    // Ikon keluar sama di kedua tempat. Tombolnya dicari lewat data-attr,
    // bukan id, karena keduanya dirender bersamaan (id akan ganda).
    var svgKeluar =
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"' +
      ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/>' +
      '<path d="M21 12H9"/></svg>';

    var aksi = isAdmin
      ? '<a class="acc__adminlink" href="/admin/" title="Buka dashboard admin">Dashboard</a>'
      : '<button type="button" class="acc__logout" data-acc-logout' +
        ' title="Keluar" aria-label="Keluar dari akun">' + svgKeluar + "</button>";

    if (desktop) {
      desktop.innerHTML =
        '<div class="acc acc--in"><div class="acc__row">' +
        '<span class="acc__avatar" aria-hidden="true">' + inisial + "</span>" +
        '<span class="acc__id">' +
        '<span class="acc__name">' + esc(u.nama || u.nim) + "</span>" +
        '<span class="acc__meta">' + esc(u.nim) + esc(kelas) + "</span>" +
        "</span>" + aksi +
        "</div></div>";
    }

    if (mobile) {
      // Mobile: avatar + keluar saja. Nama sudah ada di drawer & halaman.
      mobile.innerHTML =
        '<span class="acc__avatar acc__avatar--sm" aria-hidden="true">' + inisial + "</span>" +
        (isAdmin
          ? '<a class="acc__adminlink acc__adminlink--sm" href="/admin/" title="Dashboard admin">D</a>'
          : '<button type="button" class="acc__logout acc__logout--sm" data-acc-logout' +
            ' title="Keluar" aria-label="Keluar dari akun">' + svgKeluar + "</button>");
    }

    // Listener dipasang ulang tiap render karena markup ikut diganti, jadi
    // node lamanya sudah hilang (tanpa ini, klik kedua tidak bereaksi).
    document.querySelectorAll("[data-acc-logout]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        logout().then(function () { location.reload(); });
      });
    });
  }

  function refreshProgressBar(p) {
    var count = document.getElementById("sidebarProgressCount");
    var fill = document.getElementById("sidebarProgressFill");
    if (!count || !fill) return;

    if (!p || !p.logged_in || (p.user && p.user.role === "admin")) {
      count.textContent = "–";
      fill.style.width = "0%";
      return;
    }

    var total = p.active ? p.active.length : 0;
    var done = 0;
    p.progress = p.progress || {};
    Object.keys(p.progress).forEach(function (k) {
      if (p.progress[k] === "done") done++;
    });
    count.textContent = done + " / " + total;
    fill.style.width = (total > 0 ? (done / total) * 100 : 0) + "%";
  }

  /* ---------------- expose ---------------- */

  window.APIAuth = {
    api: api,
    me: me,
    login: login,
    logout: logout,
    gradeQuiz: gradeQuiz,
    quizState: quizState,
    changePassword: changePassword,
    readyCheck: readyCheck,
    refresh: refresh,
    esc: esc
  };

  // True bila halaman punya header tempat kartu akun & lonceng hidup
  // (semua halaman BaseLayout; login & ganti-password tidak).
  function adaHeader() {
    return !!(document.getElementById("accountBox") ||
              document.getElementById("accountBoxMobile") ||
              document.getElementById("appbar"));
  }

  // Muat otomatis saat first-load & navigasi dalam situs (astro)
  function init() {
    if (adaHeader()) refresh();
    loadPertemuanMeta();

    // Polling status 5 menit: menyegarkan progres, lonceng, dan panel.
    var timer = setInterval(function () {
      if (adaHeader()) refresh();
    }, 300000);

    // Jangan jalankan interval saat tab disembunyikan (hemat kuota & server),
    // tapi langsung segarkan begitu tab kembali terlihat.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        refresh();
        timer = setInterval(function () {
          if (adaHeader()) refresh();
        }, 300000);
      }
    });
  }
  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("astro:page-load", init);
})();