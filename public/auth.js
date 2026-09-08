/* =====================================================================
   auth.js · Otentikasi & progres belajar Portal Basis Data UNIPI
   Menyediakan window.APIAuth + memperbarui UI akun/progres di sidebar.
   Dipanggil dari setiap halaman via layout (BaseLayout.astro).
   ===================================================================== */
(function () {
  "use strict";

  var meCache = null;

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = "same-origin";
    if (opts.body && typeof opts.body !== "string") {
      opts.headers = Object.assign({}, opts.headers || {}, {
        "Content-Type": "application/json"
      });
      opts.body = JSON.stringify(opts.body);
    }
    return fetch(path, opts).then(function (res) {
      return res.json().then(function (data) {
        return { status: res.status, data: data || {} };
      }).catch(function () {
        return { status: res.status, data: { ok: false, error: "Respon tidak valid." } };
      });
    });
  }

  function me(force) {
    if (meCache && !force) return Promise.resolve(meCache);
    return api("/api/me.php").then(function (r) {
      meCache = r.data.data || {};
      return meCache;
    }).catch(function () {
      return { logged_in: false, user: null, progress: {}, active: [] };
    });
  }

  function login(username, password) {
    return api("/api/login.php", { method: "POST", body: { username: username, password: password } })
      .then(function (r) {
        if (r.data.ok) { meCache = null; return me(true); }
        return r.data;
      });
  }

  function logout() {
    return api("/api/logout.php").then(function () {
      meCache = null;
      return refresh();
    });
  }

  function complete(pertemuanId, score, total) {
    return api("/api/complete.php", {
      method: "POST",
      body: { pertemuan_id: pertemuanId, quiz_score: score || 1, quiz_total: total || 1 }
    }).then(function (r) {
      if (r.data.ok) { meCache = null; return r.data.data; }
      return r.data;
    });
  }

  /* ---------------- UI update ---------------- */

  function refresh() {
    return me(true).then(function (p) {
      refreshAccountBox(p);
      refreshProgressBar(p);
      refreshPertemuanStates(p);
      return p;
    });
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
      (isAdmin ? "" :
        '<div class="acc__mini"><span>Progres: ' + doneCount + " / " + total + "</span></div>") +
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
    refresh: refresh
  };

  // Muat otomatis saat first-load & navigasi dalam situs (astro)
  function init() {
    if (document.getElementById("accountBox")) refresh();
  }
  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("astro:page-load", init);
})();