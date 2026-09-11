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
    if (opts.body && typeof opts.body !== "string") {
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
          meCache = { logged_in: true, user: d.data.user, progress: d.data.progress || {} };
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
    return api("/api/logout.php").then(function () {
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

  async function complete(pertemuanId, score, total) {
    return api("/api/complete.php", {
      method: "POST",
      body: { pertemuan_id: pertemuanId, quiz_score: score || 1, quiz_total: total || 1 }
    }).then(function (r) {
      if (r.data.ok) { meCache = null; return r.data.data; }
      return r.data;
    });
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

  async function refresh() {
    return me(true).then(function (p) {
      refreshAccountBox(p);
      refreshProgressBar(p);
      refreshPertemuanStates(p);
      enforcePasswordChange(p);
      return p;
    });
  }

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
      row.classList.remove('prog-done', 'prog-locked', 'prog-open');
      if (!p || !p.logged_in) return;
      if (p.user && p.user.role === 'admin') return; // admin melihat semua normal
      var st = (p.progress || {})[String(id)];
      if (st === 'done') row.classList.add('prog-done');
      else if (st === 'open') row.classList.add('prog-open');
      else row.classList.add('prog-locked');
    });
  }

  function refreshAccountBox(p) {
    var box = document.getElementById("accountBox");
    if (!box) return;

    if (!p.logged_in) {
      var next = encodeURIComponent(location.pathname + location.search);
      box.innerHTML =
        '<div class="acc acc--out">' +
        '<p class="acc__title">Portal Dosen & Mahasiswa</p>' +
        '<a class="btn-sim acc__login" href="/login?next=' + next + '">Login</a>' +
        '<p class="acc__hint">Khusus mahasiswa terdaftar</p>' +
        "</div>";
      return;
    }

    var u = p.user || {};
    var total = p.active ? p.active.length : 0;
    var doneCount = 0;
    p.progress = p.progress || {};
    Object.keys(p.progress).forEach(function (k) {
      if (p.progress[k] === "done") doneCount++;
    });
    var isAdmin = u.role === "admin";
    var label = isAdmin ? "ADMIN" : (u.nama || u.nim);
    var kelas = u.kelas ? u.kelas : "";

    box.innerHTML =
      '<div class="acc acc--in">' +
      '<div class="acc__head">' +
      '<span class="acc__chip">' + label + "</span>" +
      "<button type=\"button\" class=\"acc__logout\" id=\"accLogout\">Keluar</button>" +
      "</div>" +
      '<p class="acc__name">' + (u.nama || u.nim) + "</p>" +
      '<p class="acc__meta">' + u.nim + (kelas ? " · " + kelas : "") + "</p>" +
      (isAdmin
        ? '<a class="btn-sim acc__admin" href="/admin/">Dashboard Admin</a>'
        : '<div class="acc__mini"><span>Progres: ' + doneCount + " / " + total + "</span></div>") +
      "</div>";

    var btn = document.getElementById("accLogout");
    if (btn) btn.addEventListener("click", function () {
      logout().then(function () { location.reload(); });
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
    complete: complete,
    changePassword: changePassword,
    readyCheck: readyCheck,
    refresh: refresh
  };

  // Muat otomatis saat first-load & navigasi dalam situs (astro)
  function init() {
    if (document.getElementById("accountBox")) refresh();
    loadPertemuanMeta();
  }
  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("astro:page-load", init);
})();