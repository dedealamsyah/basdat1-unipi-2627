// Game: Klasifikasi Komponen Sistem Basis Data (Pertemuan 1)
(function() {
  var gameStartBtn = document.getElementById('gameStart');
  if (!gameStartBtn) return;

  var QUESTIONS = [
    { q: "Server dan storage yang menyimpan file basis data.", a: "HARDWARE" },
    { q: "MySQL — perangkat lunak yang mengelola tabel dan index.", a: "SOFTWARE" },
    { q: "SOP backup harian yang wajib dijalankan DBA.", a: "PROSEDUR" },
    { q: "Mahasiswa yang login ke SIAKAD untuk melihat nilai.", a: "PENGGUNA" },
    { q: "Kumpulan record nilai mahasiswa yang terintegrasi.", a: "DATA" },
    { q: "Laptop yang dipakai end-user untuk membuka aplikasi.", a: "HARDWARE" },
    { q: "Aturan kontrol akses: hanya dosen boleh menginput nilai.", a: "PROSEDUR" },
    { q: "phpMyAdmin sebagai aplikasi pendukung administrasi.", a: "SOFTWARE" }
  ];

  var order = [], current = 0, score = 0, gTimer = null;
  var qEl = document.getElementById('gameQuestion');
  var sEl = document.getElementById('gameScore');
  var tEl = document.getElementById('gameTotal');
  var fEl = document.getElementById('gameFeedback');
  var compBtns = document.querySelectorAll('.comp-btn');

  function gameFeedback(msg, color) {
    fEl.innerHTML = '';
    if (!msg) return;
    var span = document.createElement('span');
    span.style.color = color;
    span.textContent = msg;
    fEl.appendChild(span);
  }

  compBtns.forEach(function(b) { b.disabled = true; });

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
    }
    return arr;
  }

  function showQuestion() {
    gTimer = null;
    if (current >= order.length) {
      qEl.textContent = "Skor akhir: " + score + "/" + order.length;
      gameFeedback('', '');
      gameStartBtn.textContent = "Ulangi";
      gameStartBtn.disabled = false;
      compBtns.forEach(function(b) { b.disabled = true; });
      return;
    }
    qEl.textContent = "(" + (current + 1) + "/" + order.length + ") " + order[current].q;
    gameFeedback('', '');
  }

  gameStartBtn.onclick = function() {
    if (gTimer) { clearTimeout(gTimer); gTimer = null; }
    order = shuffle(QUESTIONS.slice());
    current = 0; score = 0;
    sEl.textContent = '0';
    tEl.textContent = order.length;
    this.disabled = true;
    compBtns.forEach(function(b) { b.disabled = false; });
    showQuestion();
  };

  compBtns.forEach(function(btn) {
    btn.onclick = function() {
      if (!order.length || current >= order.length) return;
      var correct = this.getAttribute('data-comp') === order[current].a;
      if (correct) {
        score++;
        sEl.textContent = score;
        gameFeedback('[Benar]', '#166534');
      } else {
        gameFeedback('[Salah] Jawaban: ' + order[current].a, '#991b1b');
      }
      current++;
      if (gTimer) { clearTimeout(gTimer); }
      gTimer = setTimeout(showQuestion, 900);
    };
  });

  window.addEventListener('astro:before-swap', function() {
    if (gTimer) { clearTimeout(gTimer); gTimer = null; }
  });
})();
