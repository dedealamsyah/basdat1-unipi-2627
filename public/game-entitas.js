// Game: Klasifikasi Entitas (Pertemuan 2)
(function() {
  var entityStartBtn = document.getElementById('entityStart');
  if (!entityStartBtn) return;

  var ENTITY_QS = [
    { q: "MAHASISWA (ada NIM sendiri)", a: "KUAT" },
    { q: "TANGGUNGAN (bergantung pada KARYAWAN)", a: "LEMAH" },
    { q: "BUKU (ada ISBN sendiri)", a: "KUAT" },
    { q: "DETAIL_PESANAN (bergantung pada PESANAN)", a: "LEMAH" },
    { q: "DOSEN (ada NIP sendiri)", a: "KUAT" },
    { q: "ITEM_TAGIHAN (bergantung pada TAGIHAN)", a: "LEMAH" }
  ];

  var entityOrder = [], entityCur = 0, entityScore = 0, entityTimer = null;
  var entityQ = document.getElementById('entityQ');
  var entityS = document.getElementById('entityScore');
  var entityT = document.getElementById('entityTotal');
  var entityF = document.getElementById('entityFeedback');
  var entityBtns = document.querySelectorAll('.entity-btn');

  function entityFeedback(msg, color) {
    entityF.innerHTML = '';
    var span = document.createElement('span');
    span.style.color = color;
    span.textContent = msg;
    entityF.appendChild(span);
  }

  entityBtns.forEach(function(b) { b.disabled = true; });

  function entityShow() {
    entityTimer = null;
    if (entityCur >= entityOrder.length) {
      entityQ.textContent = 'Selesai! Skor: ' + entityScore + '/' + entityOrder.length;
      entityFeedback('', '');
      entityBtns.forEach(function(b) { b.disabled = true; });
      entityStartBtn.disabled = false;
      return;
    }
    entityQ.textContent = '(' + (entityCur + 1) + '/' + entityOrder.length + ') ' + entityOrder[entityCur].q;
    entityFeedback('', '');
  }

  entityStartBtn.onclick = function() {
    if (entityTimer) { clearTimeout(entityTimer); entityTimer = null; }
    entityOrder = ENTITY_QS.slice().sort(function() { return Math.random() - 0.5; });
    entityCur = 0;
    entityScore = 0;
    entityS.textContent = '0';
    entityT.textContent = entityOrder.length;
    this.disabled = true;
    entityBtns.forEach(function(b) { b.disabled = false; });
    entityShow();
  };

  entityBtns.forEach(function(b) {
    b.onclick = function() {
      if (!entityOrder.length || entityCur >= entityOrder.length) return;
      var ok = this.getAttribute('data-type') === entityOrder[entityCur].a;
      if (ok) {
        entityScore++;
        entityS.textContent = entityScore;
        entityFeedback('Benar!', '#166534');
      } else {
        entityFeedback('Salah! Jawaban: ' + entityOrder[entityCur].a, '#991b1b');
      }
      entityCur++;
      if (entityTimer) { clearTimeout(entityTimer); }
      entityTimer = setTimeout(entityShow, 900);
    };
  });

  window.addEventListener('astro:before-swap', function() {
    if (entityTimer) { clearTimeout(entityTimer); entityTimer = null; }
  });
})();
