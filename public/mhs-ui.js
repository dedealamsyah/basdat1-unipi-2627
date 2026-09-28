/* =====================================================================
   mhs-ui.js — UI khusus mahasiswa (v2.9.0)
   ---------------------------------------------------------------------
   Tiga hal, semuanya untuk MAHASISWA saja:

   1. Notifikasi (lonceng di header) — pemicunya PENGOLAHAN dan SKOR:
        - latihan belum tuntas di pertemuan yang sudah terbuka
        - evaluasi belum dikumpulkan, padahal latihan sudah tuntas
        - skor di bawah ambang (dua tingkat: <75 dan <60)
        - nilai kuis berjalan di bawah ambang
      Tugas dan PTS/UAS sengaja TIDAK jadi pemicu (permintaan dosen).

   2. Dashboard di beranda: sapaan, "lanjut belajar", progres, kartu
      "Perlu perhatian", dan nilai berjalan.

   3. Strip status di halaman materi: latihan · evaluasi · tugas + skor.

   Admin tidak menerima notifikasi apa pun: dia yang menginput nilai, bukan
   yang perlu diingatkan. Semua elemen UI di sini disembunyikan untuk admin
   dan untuk tamu (belum login).

   Data berasal dari `GET /api/me.php` (field `rekap` + `nilai`) yang
   diteruskan oleh auth.js lewat window.MhsUI.render(p).
   ===================================================================== */
(function () {
  "use strict";

  /* Ambang skor. Dua tingkat supaya pesan bisa berbeda sifat:
     <75 = masih bisa diperbaiki sendiri, <60 = perlu talk to dosen. */
  var AMBANG_AMAN = 75;
  var AMBANG_BERAT = 60;

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };
  if (window.APIAuth && window.APIAuth.esc) esc = window.APIAuth.esc;

  function levelSkor(pct) {
    if (pct === null || pct === undefined) return "aman";
    if (pct < AMBANG_BERAT) return "berat";
    if (pct < AMBANG_AMAN) return "perlu";
    return "aman";
  }

  /* ------------------------------------------------------------------
   * Model notifikasi
   * ---------------------------------------------------------------- */
  function bangunNotifikasi(p) {
    var out = [];
    if (!p || !p.logged_in) return out;
    if (p.user && p.user.role === "admin") return out;   // admin: tanpa notif

    var rekap = p.rekap || {};
    var aktif = p.active || [];

    aktif.forEach(function (id) {
      var r = rekap[id];
      if (!r || r.status === "locked") return;           // belum terbuka
      var link = "/pertemuan/" + id + "/";
      var ev = r.evaluasi || {};
      var lat = r.latihan || {};

      if (r.ada_evaluasi && r.status === "done" && ev.pct === null) {
        out.push({
          level: "tinggi",
          judul: "Evaluasi P" + id + " belum dikerjakan",
          detail: "Latihan sudah tuntas. Kerjakan evaluasinya agar komponen kuis terisi.",
          href: link,
          pid: id
        });
      }

      if (r.ada_latihan && r.status !== "done") {
        out.push({
          level: "sedang",
          judul: "Latihan P" + id + " belum tuntas",
          detail: "Semua soal latihan harus dijawab benar untuk membuka pertemuan berikutnya.",
          href: link,
          pid: id
        });
      }

      if (ev.pct !== null && ev.pct !== undefined) {
        var lv = levelSkor(ev.pct);
        if (lv === "berat") {
          out.push({
            level: "tinggi",
            judul: "Skor evaluasi P" + id + ": " + ev.pct + "%",
            detail: "Di bawah " + AMBANG_BERAT + "%. Pelajari ulang materinya, lalu konsultasikan ke dosen.",
            href: link,
            pid: id
          });
        } else if (lv === "perlu") {
          out.push({
            level: "sedang",
            judul: "Skor evaluasi P" + id + ": " + ev.pct + "%",
            detail: "Masih di bawah " + AMBANG_AMAN + "%. Ulangi materi P" + id + " untuk memperkuat.",
            href: link,
            pid: id
          });
        }
      }

      if (r.status === "done" && lat.pct !== null && lat.pct !== undefined &&
          levelSkor(lat.pct) !== "aman") {
        out.push({
          level: "sedang",
          judul: "Skor latihan P" + id + ": " + lat.pct + "%",
          detail: "Nilai latihan P" + id + " masih di bawah ambang " + AMBANG_AMAN + "%.",
          href: link,
          pid: id
        });
      }
    });

    // Nilai kuis berjalan = gabungan komponen latihan + evaluasi (40% nilai akhir).
    if (p.nilai && p.nilai.kuis_pct !== null && p.nilai.kuis_pct !== undefined) {
      var lvKuis = levelSkor(p.nilai.kuis_pct);
      if (lvKuis !== "aman") {
        out.push({
          level: lvKuis === "berat" ? "tinggi" : "sedang",
          judul: "Nilai kuis berjalan: " + p.nilai.kuis_pct + "%",
          detail: "Kuis bernilai 40% dari nilai akhir. Targetnya minimal " + AMBANG_AMAN + "%.",
          href: "/",
          pid: 0
        });
      }
    }

    var rank = { tinggi: 0, sedang: 1 };
    out.sort(function (a, b) {
      if (rank[a.level] !== rank[b.level]) return rank[a.level] - rank[b.level];
      return a.pid - b.pid;
    });
    return out;
  }

  /* ------------------------------------------------------------------
   * Render lonceng + panel
   * ---------------------------------------------------------------- */
  function renderPanel(list, boleh) {
    var listEl = document.getElementById("notifPanelList");
    var emptyEl = document.getElementById("notifPanelEmpty");
    if (listEl) {
      listEl.innerHTML = list
        .map(function (x) {
          return (
            '<a class="notif-item notif-item--' + x.level + '" href="' + esc(x.href) + '">' +
            '<span class="notif-item__icon" aria-hidden="true">' +
            (x.level === "tinggi" ? "!" : "i") + "</span>" +
            '<span class="notif-item__body">' +
            '<span class="notif-item__judul">' + esc(x.judul) + "</span>" +
            '<span class="notif-item__detail">' + esc(x.detail) + "</span>" +
            "</span></a>"
          );
        })
        .join("");
    }
    if (emptyEl) emptyEl.hidden = !boleh || list.length > 0;
    var panel = document.getElementById("notifPanel");
    if (panel) panel.classList.toggle("is-empty", list.length === 0);
  }

  function renderLonceng(jumlah) {
    ["notifBadge", "notifBadgeMobile"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = jumlah > 9 ? "9+" : String(jumlah);
      el.hidden = jumlah === 0;
    });
    var toggles = document.querySelectorAll("[data-notif-toggle]");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].classList.toggle("has-items", jumlah > 0);
    }
  }

  /* Pill ringkas di sidebar: satu kalimat, tidak daftar panjang. */
  function renderPill(list, boleh) {
    var box = document.getElementById("notifBox");
    var teks = document.getElementById("notifList");
    if (!box || !teks) return;
    if (!boleh) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    if (list.length === 0) {
      box.setAttribute("data-level", "aman");
      teks.textContent = "Tidak ada pengingat. Latihan & evaluasi beres.";
    } else {
      var berat = list.filter(function (x) { return x.level === "tinggi"; }).length;
      box.setAttribute("data-level", berat > 0 ? "tinggi" : "sedang");
      teks.textContent = list.length + " pengingat" + (berat > 0 ? ", " + berat + " perlu segera" : "");
    }
  }

  /* ------------------------------------------------------------------
   * Dashboard beranda
   * ---------------------------------------------------------------- */
  function judulPertemuan(id) {
    var row = document.querySelector(
      '.sidebar__list .row[data-id="' + id + '"], #pertemuanList .row[data-id="' + id + '"]'
    );
    if (!row) return "Pertemuan " + id;
    var t = row.querySelector(".row__title");
    return t ? t.textContent.trim() : "Pertemuan " + id;
  }

  function renderDashboard(p) {
    var wrap = document.getElementById("dashWrap");
    if (!wrap) return;
    var isAdmin = !!(p && p.user && p.user.role === "admin");

    if (!p || !p.logged_in || isAdmin) {
      wrap.hidden = true;               // tamu & admin: beranda tetap seperti biasa
      return;
    }
    wrap.hidden = false;

    var u = p.user || {};
    var salam = salamWaktu();
    var sapaan = document.getElementById("dashGreeting");
    if (sapaan) {
      sapaan.innerHTML =
        '<span class="dash__eyebrow">' + salam + "</span>" +
        "<h2 class=\"dash__title\">Halo, " + esc(u.nama || u.nim) + "</h2>" +
        '<p class="dash__sub">' + esc(u.nim) + (u.kelas ? " · " + esc(u.kelas) : "") + " · Semester 3</p>";
    }

    /* Pertemuan berikutnya: pertemuan aktif yang belum tuntas pertama. */
    var next = null;
    var rekap = p.rekap || {};
    (p.active || []).forEach(function (id) {
      if (next) return;
      var r = rekap[id];
      if (r && r.status !== "done") next = id;
    });

    var nextBox = document.getElementById("dashNext");
    if (nextBox) {
      if (next) {
        var r2 = rekap[next] || {};
        var status = r2.status === "locked" ? "Terkunci" : "Sedang dibuka";
        nextBox.innerHTML =
          '<a class="nextcard" href="/pertemuan/' + next + '/">' +
          '<span class="nextcard__eyebrow">LANJUT BELAJAR</span>' +
          '<span class="nextcard__title">Pertemuan ' + next + " · " + esc(judulPertemuan(next)) + "</span>" +
          '<span class="nextcard__meta">' + esc(status) +
          (r2.ada_latihan && r2.status !== "done" ? " · latihan belum tuntas" : "") +
          "</span>" +
          '<span class="nextcard__cta">Buka materi →</span>' +
          "</a>";
      } else {
        nextBox.innerHTML =
          '<div class="nextcard nextcard--done">' +
          '<span class="nextcard__eyebrow">PROGRES</span>' +
          '<span class="nextcard__title">Semua pertemuan aktif sudah tuntas</span>' +
          '<span class="nextcard__meta">Evaluasi & tugas tetap bisa dikerjakan</span>' +
          "</div>";
      }
    }

    /* Progres + nilai berjalan. */
    var total = (p.active || []).length;
    var done = 0;
    var kuisLatihan = null;
    var kuisEvaluasi = null;
    (p.active || []).forEach(function (id) {
      var r = rekap[id];
      if (!r) return;
      if (r.status === "done") done++;
      if (r.latihan && r.latihan.pct !== null && r.latihan.pct !== undefined) {
        kuisLatihan = (kuisLatihan === null ? 0 : kuisLatihan) + r.latihan.pct;
      }
      if (r.evaluasi && r.evaluasi.pct !== null && r.evaluasi.pct !== undefined) {
        kuisEvaluasi = (kuisEvaluasi === null ? 0 : kuisEvaluasi) + r.evaluasi.pct;
      }
    });

    var kartu = document.getElementById("dashCards");
    var nilai = p.nilai || {};
    if (kartu) {
      var isian = [
        { label: "Pertemuan tuntas", nilai: done + " / " + total, ket: "progres belajar" },
        {
          label: "Nilai latihan",
          nilai: kuisLatihan === null ? "–" : Math.round(kuisLatihan / total) + "%",
          ket: "rata-rata pertemuan"
        },
        {
          label: "Nilai evaluasi",
          nilai: kuisEvaluasi === null ? "–" : Math.round(kuisEvaluasi / total) + "%",
          ket: "rata-rata pertemuan"
        },
        {
          label: "Nilai akhir",
          nilai: nilai.akhir !== null && nilai.akhir !== undefined
            ? nilai.akhir + " (" + (nilai.huruf || "–") + ")"
            : "–",
          ket: "kuis 40% · PTS 30% · UAS 30%"
        }
      ];
      kartu.innerHTML = isian
        .map(function (k) {
          var lv = typeof k.nilai === "string" && /%$/.test(k.nilai) ? levelSkor(parseInt(k.nilai, 10)) : "aman";
          return (
            '<div class="stat stat--' + lv + '">' +
            '<span class="stat__label">' + esc(k.label) + "</span>" +
            '<span class="stat__nilai">' + esc(String(k.nilai)) + "</span>" +
            '<span class="stat__ket">' + esc(k.ket) + "</span>" +
            "</div>"
          );
        })
        .join("");
    }
  }

  function salamWaktu() {
    var jam = new Date().getHours();
    if (jam < 11) return "SELAMAT PAGI";
    if (jam < 15) return "SELAMAT SIANG";
    if (jam < 18) return "SELAMAT SORE";
    return "SELAMAT MALAM";
  }

  /* ------------------------------------------------------------------
   * Strip status di halaman materi
   * ---------------------------------------------------------------- */
  function renderPageStatus(p) {
    var el = document.getElementById("pageStatus");
    if (!el) return;
    if (!p || !p.logged_in || (p.user && p.user.role === "admin")) {
      el.hidden = true;
      return;
    }
    var meta = document.getElementById("pageMeta");
    var pid = String(parseInt((meta && meta.getAttribute("data-pertemuan")) || "0", 10));
    var r = (p.rekap || {})[pid];
    if (!r) { el.hidden = true; return; }

    var chip = function (cls, label, value) {
      return (
        '<span class="pstatus pstatus--' + cls + '">' +
        '<span class="pstatus__label">' + esc(label) + "</span>" +
        '<span class="pstatus__value">' + value + "</span>" +
        "</span>"
      );
    };

    var html = "";
    if (r.ada_latihan) {
      html += chip(
        r.status === "done" ? "done" : "todo",
        "Latihan",
        r.status === "done"
          ? (r.latihan.pct !== null ? "Tuntas · " + esc(r.latihan.pct) + "%" : "Tuntas")
          : r.status === "locked" ? "Terkunci" : "Belum tuntas"
      );
    }
    if (r.ada_evaluasi) {
      var ev = r.evaluasi;
      var lv = "done";
      if (ev.pct === null) lv = "todo";
      else {
        var lvSkor = levelSkor(ev.pct);
        if (lvSkor !== "aman") lv += " warn-" + lvSkor;
      }
      html += chip(
        lv,
        "Evaluasi",
        ev.pct === null
          ? (r.status === "done" ? "Belum dikerjakan" : "Setelah latihan tuntas")
          : "Skor " + esc(ev.pct) + "%"
      );
    }
    if (r.ada_tugas) {
      html += chip(r.tugas ? "done" : "todo", "Tugas", r.tugas ? "Terkirim" : "Belum dikirim");
    }

    el.innerHTML = html;
    el.hidden = !html;
  }

  /* ------------------------------------------------------------------
   * Badge status di baris sidebar / daftar pertemuan
   * ---------------------------------------------------------------- */
  function renderRowFlags(p) {
    var rows = document.querySelectorAll(
      '.sidebar__list .row[data-id], #pertemuanList .row[data-id]'
    );
    var rekap = p && p.rekap ? p.rekap : {};
    var isAdmin = !!(p && p.user && p.user.role === "admin");
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var slot = row.querySelector(".row__flag");
      if (!slot) continue;
      slot.textContent = "";
      slot.setAttribute("data-flag", "");
      if (!p || !p.logged_in || isAdmin) continue;

      var id = String(row.getAttribute("data-id"));
      var r = rekap[id];
      var st = (p.progress || {})[id];
      if (!r) {
        if (st === "locked") slot.setAttribute("data-flag", "locked");
        continue;
      }
      if (st === "done") {
        slot.setAttribute("data-flag", "done");
        slot.textContent = "✓";
        slot.title = "Tuntas";
      } else if (st === "locked") {
        slot.setAttribute("data-flag", "locked");
        slot.textContent = "🔒";
        slot.title = "Terkunci";
      } else {
        // Ada yang perlu dikerjakan?
        var ev = r.evaluasi || {};
        if (r.ada_evaluasi && r.status === "done" && ev.pct === null) {
          slot.setAttribute("data-flag", "due");
          slot.textContent = "!";
          slot.title = "Evaluasi belum dikerjakan";
        } else if (r.ada_latihan && r.status !== "done") {
          slot.setAttribute("data-flag", "due");
          slot.textContent = "•";
          slot.title = "Latihan belum tuntas";
        } else {
          slot.setAttribute("data-flag", "open");
          slot.textContent = "→";
          slot.title = "Sedang dibuka";
        }
      }
    }
  }

  /* ------------------------------------------------------------------
   * Entry point
   * ---------------------------------------------------------------- */
  function render(p) {
    var list = bangunNotifikasi(p);
    var isAdmin = !!(p && p.user && p.user.role === "admin");
    var boleh = !!(p && p.logged_in) && !isAdmin;

    // App bar (v2.9.4) SELALU tampil, termasuk untuk tamu — isinya konteks
    // halaman, kartu akun, dan tautan "Masuk". Sebelumnya disembunyikan untuk
    // tamu, padahal di sanalah tempat paling logis untuk masuk. Admin tetap
    // boleh melihatnya, tapi TANPA lonceng: tidak ada notifikasi untuknya.
    var appbar = document.getElementById("appbar");
    if (appbar) {
      appbar.classList.toggle("appbar--no-notif", isAdmin);
    }
    var toggles = document.querySelectorAll("[data-notif-toggle]");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].hidden = !boleh;
    }

    renderLonceng(boleh ? list.length : 0);
    renderPanel(list, boleh);
    renderPill(list, boleh);
    renderDashboard(p);
    renderPageStatus(p);
    renderRowFlags(p);
  }

  /* Panel: buka/tutup */
  function initPanel() {
    var panel = document.getElementById("notifPanel");
    if (!panel) return;
    var toggles = document.querySelectorAll("[data-notif-toggle]");

    function tutup() {
      panel.classList.remove("is-open");
      for (var i = 0; i < toggles.length; i++) {
        toggles[i].setAttribute("aria-expanded", "false");
      }
    }
    function buka() {
      panel.classList.add("is-open");
      for (var i = 0; i < toggles.length; i++) {
        toggles[i].setAttribute("aria-expanded", "true");
      }
    }

    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener("click", function (e) {
        e.stopPropagation();
        if (panel.classList.contains("is-open")) tutup();
        else buka();
      });
    }
    document.addEventListener("click", function (e) {
      if (!panel.contains(e.target)) tutup();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") tutup();
    });
  }

  function init() {
    // Hanya pasang handler panel. Data tidak di-fetch di sini: auth.js sudah
    // memanggil refresh() dan meneruskan datanya ke MhsUI.render(). Kalau
    // auth.js gagal dimuat, UI tetap punya handler (lonceng lalu mati
    // bisanya), bukan error JavaScript.
    initPanel();
  }

  window.MhsUI = { render: render, AMBANG: { aman: AMBANG_AMAN, berat: AMBANG_BERAT } };

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("astro:page-load", init);
})();
