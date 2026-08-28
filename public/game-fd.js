/* =====================================================================
   game-fd.js — Latihan klasifikasi Functional Dependency (Pertemuan 5)
   - Menampilkan satu pernyataan FD; pemain memilih FULL / PARTIAL / TRANSITIVE
   - Konvensi markup:
     #fdStmt, #fdHint, #fdStart, .fd-btn[data-val], #fdFeedback,
     #fdScore, #fdTotal
===================================================================== */
(function () {
  "use strict";

  var stmt = document.getElementById("fdStmt");
  if (!stmt) return;

  var hint = document.getElementById("fdHint");
  var start = document.getElementById("fdStart");
  var btns = document.querySelectorAll(".fd-btn");
  var feedback = document.getElementById("fdFeedback");
  var scoreEl = document.getElementById("fdScore");
  var totalEl = document.getElementById("fdTotal");

  var ITEMS = [
    { stmt: "(no_nota, id_produk) \u2192 jumlah", ans: "FULL", why: "Atribut 'jumlah' hanya bisa ditentukan bila seluruh PK diketahui." },
    { stmt: "no_nota \u2192 tgl", ans: "PARTIAL", why: "'tgl' cukup ditentukan oleh sebagian PK (no_nota saja)." },
    { stmt: "id_produk \u2192 nama_produk", ans: "PARTIAL", why: "'nama_produk' cukup ditentukan oleh sebagian PK (id_produk saja)." },
    { stmt: "id_pelanggan \u2192 kota", ans: "TRANSITIVE", why: "Keduanya non-kunci; 'kota' bergantung transitif lewat id_pelanggan." },
    { stmt: "id_produk \u2192 harga", ans: "PARTIAL", why: "'harga' ditentukan oleh sebagian PK (id_produk)." }
  ];

  var idx = 0, score = 0, started = false;

  function show(i) {
    stmt.textContent = ITEMS[i].stmt;
    feedback.innerHTML = "";
  }

  function enable(flag) {
    for (var i = 0; i < btns.length; i++) btns[i].disabled = !flag;
  }

  function finish() {
    enable(false);
    stmt.textContent = "Selesai! Skor akhir: " + score + "/" + ITEMS.length + ".";
    if (hint) hint.textContent = "Klik 'Mulai' untuk mengulang.";
    if (start) start.style.display = "";
  }

  if (start) {
    start.addEventListener("click", function () {
      started = true;
      idx = 0; score = 0;
      scoreEl.textContent = "0";
      totalEl.textContent = String(ITEMS.length);
      start.style.display = "none";
      enable(true);
      show(0);
    });
  }

  for (var b = 0; b < btns.length; b++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        if (!started) return;
        var val = btn.getAttribute("data-val");
        var item = ITEMS[idx];
        if (val === item.ans) {
          score++;
          scoreEl.textContent = String(score);
          feedback.innerHTML = '<span style="color:#166534;">[Benar] ' + item.why + "</span>";
        } else {
          feedback.innerHTML = '<span style="color:#991b1b;">[Kurang tepat] Jawaban: ' + item.ans + ". " + item.why + "</span>";
        }
        idx++;
        if (idx < ITEMS.length) {
          setTimeout(show, 350, idx);
        } else {
          finish();
        }
      });
    })(btns[b]);
  }
})();