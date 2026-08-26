/* =====================================================================
   app.js — RENDERER. Tidak perlu diedit untuk menambah materi;
   cukup edit content.js.
===================================================================== */
(function () {
  const sidebarList = document.getElementById("sidebarList");
  const content = document.getElementById("content");

  document.getElementById("dbNameLabel").textContent = COURSE.dbName;
  document.getElementById("courseName").textContent = COURSE.name;
  document.getElementById("courseMeta").textContent = COURSE.prodi + " · " + COURSE.semester;

  // DARK MODE
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);

  themeToggle.addEventListener('click', function() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeUI(next);
  });

  function updateThemeUI(theme) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }

  const available = PERTEMUAN.filter((p) => !p.locked).length;
  document.getElementById("progressText").textContent = available + " / " + PERTEMUAN.length;
  document.getElementById("progressFill").style.width = (available / PERTEMUAN.length * 100) + "%";

  function buildSidebar(activeId, filter) {
    sidebarList.innerHTML = "";
    const f = (filter || "").toLowerCase();
    const bookmarks = getBookmarks();
    PERTEMUAN.forEach((p) => {
      const title = (p.title || "").toLowerCase();
      if (f && !title.includes(f)) return;
      const li = document.createElement("li");
      const isBookmarked = bookmarks[p.id];
      li.className = "row" + (p.locked ? " locked" : "") + (p.id === activeId ? " active" : "");
      li.innerHTML =
        '<span class="row__pk">' + String(p.id).padStart(2, "0") + '</span>' +
        '<span class="row__text">' +
          '<span class="row__num">PERTEMUAN ' + p.id + (isBookmarked ? ' <span style="color:#E7A83D;">★</span>' : '') + '</span>' +
          '<span class="row__title">' + (p.locked ? (p.title || "Belum tersedia") : p.title) + '</span>' +
        '</span>';
      if (!p.locked) {
        li.addEventListener("click", () => { location.hash = "p" + p.id; });
      }
      sidebarList.appendChild(li);
    });
  }

  function renderLocked(p) {
    content.innerHTML =
      '<div class="lockedNotice">' +
        '<div class="bigIcon">◌</div>' +
        '<h2 style="font-family:var(--font-display);color:var(--navy-800);margin:0 0 8px;">Pertemuan ' + p.id + ' belum tersedia</h2>' +
        '<p>' + (p.title ? '"' + p.title + '" ' : '') + 'akan ditambahkan oleh dosen pengampu. Materi ini akan otomatis muncul di sini setelah <code>content.js</code> diperbarui.</p>' +
      '</div>';
  }

  function renderPertemuan(p) {
    const tocLinks = p.sections.map((s, i) =>
      '<a href="#sec-' + i + '">' + s.heading.replace(/^[A-Z]\.\d*\.?\s*/, "").split(" (")[0] + '</a>'
    ).join("");

    const sectionsHtml = p.sections.map((s, i) =>
      '<section class="block" id="sec-' + i + '"><h2>' + s.heading + '</h2>' + s.html + '</section>'
    ).join("");

    const idx = PERTEMUAN.findIndex((x) => x.id === p.id);
    const prev = PERTEMUAN[idx - 1];
    const next = PERTEMUAN[idx + 1];
    const isBookmarked = getBookmarks()[p.id];
    const bmLabel = isBookmarked ? '★ Tersimpan' : '☆ Simpan';

    content.innerHTML =
      '<div class="contentHeader">' +
        '<div class="eyebrow">Pertemuan ' + String(p.id).padStart(2, "0") + ' · ' + COURSE.name + '</div>' +
        '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">' +
          '<div style="flex:1;">' +
            '<h1 class="pageTitle">' + p.title + '</h1>' +
            (p.subtitle ? '<p class="pageSubtitle">' + p.subtitle + '</p>' : '') +
          '</div>' +
          '<button id="bookmarkBtn" class="zoom-btn" style="flex:0 0 auto; padding:8px 14px; font-size:12px; background:' + (isBookmarked ? '#E7A83D' : 'var(--navy-700)') + '; color:#fff; white-space:nowrap;">' + bmLabel + '</button>' +
        '</div>' +
        (p.meta ? '<div class="chipRow">' +
          '<span class="chip">' + p.meta.cpmk + '</span>' +
          '<span class="chip">⏱ ' + p.meta.alokasi + '</span>' +
          '<span class="chip chip--amber">BOBOT ' + p.meta.bobot + '</span>' +
        '</div>' : '') +
      '</div>' +
      '<nav class="toc">' + tocLinks + '</nav>' +
      sectionsHtml +
      '<div class="navFooter">' +
        (prev && !prev.locked ? '<a class="navBtn" href="#p' + prev.id + '">‹ Pertemuan ' + prev.id + '</a>' : '<span class="navBtn" disabled>‹ Pertemuan sebelumnya</span>') +
        (next && !next.locked ? '<a class="navBtn" href="#p' + next.id + '">Pertemuan ' + next.id + ' ›</a>' : '<span class="navBtn" disabled>Pertemuan berikutnya ›</span>') +
      '</div>';

    // Bookmark toggle
    document.getElementById('bookmarkBtn').addEventListener('click', function() {
      const newStatus = !getBookmarks()[p.id];
      setBookmarked(p.id, newStatus);
      this.textContent = newStatus ? '★ Tersimpan' : '☆ Simpan';
      this.style.background = newStatus ? '#E7A83D' : 'var(--navy-700)';
      buildSidebar(p.id, currentFilter);
    });
  }

  // BOOKMARK & PROGRESS TRACKING
  const BOOKMARK_KEY = 'basdat_bookmarks';
  const LAST_READ_KEY = 'basdat_last_read';
  
  function getBookmarks() {
    return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '{}');
  }
  
  function setBookmarked(pertemuanId, isBookmarked) {
    const bm = getBookmarks();
    if (isBookmarked) bm[pertemuanId] = Date.now();
    else delete bm[pertemuanId];
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bm));
  }
  
  function setLastRead(pertemuanId) {
    localStorage.setItem(LAST_READ_KEY, pertemuanId);
  }
  
  function getLastRead() {
    return parseInt(localStorage.getItem(LAST_READ_KEY), 10) || null;
  }

  // Sidebar search
  const sidebarSearch = document.getElementById('sidebarSearch');
  let currentFilter = '';
  sidebarSearch.addEventListener('input', function() {
    currentFilter = this.value;
    const activeId = parseInt(location.hash.replace('#p', ''), 10) || 1;
    buildSidebar(activeId, currentFilter);
  });

  function route() {
    const hash = location.hash.replace("#p", "");
    let id = parseInt(hash, 10);
    if (!id) {
      const lastRead = getLastRead();
      const firstAvailable = PERTEMUAN.find((p) => !p.locked);
      id = lastRead || (firstAvailable ? firstAvailable.id : 1);
    }
    const p = PERTEMUAN.find((x) => x.id === id) || PERTEMUAN[0];
    setLastRead(p.id);
    buildSidebar(p.id, currentFilter);
    if (p.locked) renderLocked(p); else renderPertemuan(p);
    window.scrollTo(0, 0);
    initInteractivity();
    highlightCode();
  }

  function initInteractivity() {
    // Quiz Logic
    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.onclick = function() {
        const isCorrect = this.getAttribute('data-correct') === 'true';
        const feedback = this.parentNode.querySelector('.quiz-feedback');
        
        // Reset options
        this.parentNode.querySelectorAll('.quiz-option').forEach(opt => {
          opt.classList.remove('correct', 'wrong');
        });

        if (isCorrect) {
          this.classList.add('correct');
          feedback.innerHTML = '<span style="color:#166534">[Benar] ' + this.getAttribute('data-explanation') + '</span>';
        } else {
          this.classList.add('wrong');
          feedback.innerHTML = '<span style="color:#991b1b">[Kurang tepat] Coba perhatikan kembali konsepnya.</span>';
        }
      };
    });

    // Simulation: Filter Table
    const searchInput = document.getElementById('simSearch');
    if (searchInput) {
      searchInput.oninput = function() {
        const val = this.value.toLowerCase();
        document.querySelectorAll('#simTable tbody tr').forEach(tr => {
          tr.style.display = tr.innerText.toLowerCase().includes(val) ? '' : 'none';
        });
      };
    }

    // Toggle Model: Hierarchical vs Relational
    document.querySelectorAll('.model-btn').forEach(btn => {
      btn.onclick = function() {
        const m = this.getAttribute('data-model');
        document.getElementById('modelHier').style.display = m === 'hier' ? 'block' : 'none';
        document.getElementById('modelRel').style.display = m === 'rel' ? 'block' : 'none';
      };
    });

    // Mini-Game: Klasifikasi Komponen
    const gameStartBtn = document.getElementById('gameStart');
    if (gameStartBtn) {
      const QUESTIONS = [
        { q: "Server dan storage yang menyimpan file basis data di pusat data kampus.", a: "HARDWARE" },
        { q: "MySQL — perangkat lunak yang mengelola tabel, index, dan hak akses.", a: "SOFTWARE" },
        { q: "SOP backup harian yang wajib dijalankan DBA setiap tengah malam.", a: "PROSEDUR" },
        { q: "Mahasiswa yang login ke SIAKAD untuk melihat nilai ujiannya.", a: "PENGGUNA" },
        { q: "Kumpulan record nilai mahasiswa yang terintegrasi dan saling berelasi.", a: "DATA" },
        { q: "Laptop / smartphone yang dipakai end-user untuk membuka aplikasi.", a: "HARDWARE" },
        { q: "Aturan kontrol akses: hanya dosen yang boleh menginput nilai.", a: "PROSEDUR" },
        { q: "phpMyAdmin sebagai aplikasi pendukung administrasi basis data.", a: "SOFTWARE" },
        { q: "Database Administrator (DBA) yang mengelola hak akses pengguna.", a: "PENGGUNA" },
        { q: "Backup file basis data ke cloud storage untuk keamanan data.", a: "PROSEDUR" },
        { q: "Harddisk SSD yang menyimpan file index untuk mempercepat pencarian data.", a: "HARDWARE" },
        { q: "Data transaksi penjualan yang tersimpan di tabel ORDERS.", a: "DATA" }
      ];
      let order = [], current = 0, score = 0;
      const qEl = document.getElementById('gameQuestion');
      const sEl = document.getElementById('gameScore');
      const tEl = document.getElementById('gameTotal');
      const fEl = document.getElementById('gameFeedback');
      const compBtns = document.querySelectorAll('.comp-btn');

      compBtns.forEach(b => b.disabled = true);

      function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      }

      function showQuestion() {
        if (current >= order.length) {
          qEl.textContent = "Evaluasi selesai. Skor akhir Anda: " + score + "/" + order.length +
            (score === order.length ? " — Pemahaman Sempurna." : score >= order.length * 0.7 ? " — Pemahaman Baik." : " — Disarankan untuk meninjau kembali materi.");
          fEl.innerHTML = '';
          gameStartBtn.textContent = "Ulangi Evaluasi";
          gameStartBtn.disabled = false;
          compBtns.forEach(b => b.disabled = true);
          return;
        }
        qEl.textContent = "(" + (current + 1) + "/" + order.length + ") " + order[current].q;
        fEl.innerHTML = '';
      }

      gameStartBtn.onclick = function() {
        order = shuffle(QUESTIONS.slice());
        current = 0; score = 0;
        sEl.textContent = '0';
        tEl.textContent = order.length;
        this.disabled = true;
        compBtns.forEach(b => b.disabled = false);
        showQuestion();
      };

      compBtns.forEach(btn => {
        btn.onclick = function() {
          if (!order.length || current >= order.length) return;
          const correct = this.getAttribute('data-comp') === order[current].a;
          if (correct) {
            score++;
            sEl.textContent = score;
            fEl.innerHTML = '<span style="color:#166534">[Benar]</span>';
          } else {
            fEl.innerHTML = '<span style="color:#991b1b">[Salah] Kategori yang tepat: <strong>' + order[current].a + '</strong></span>';
          }
          current++;
          setTimeout(showQuestion, 900);
        };
      });
    }

    // Zoom Diagram
    document.querySelectorAll('.diagram-container').forEach(container => {
      const inner = container.querySelector('.diagram-inner');
      const zoomLabel = container.querySelector('.zoom-level');
      if (!inner) return;
      let scale = 1;
      const minScale = 1, maxScale = 3;

      function applyZoom() {
        inner.style.transform = 'scale(' + scale + ')';
        if (zoomLabel) zoomLabel.textContent = Math.round(scale * 100) + '%';
      }

      container.querySelectorAll('.zoom-in').forEach(b => b.onclick = function() {
        scale = Math.min(maxScale, scale + 0.25);
        applyZoom();
      });
      container.querySelectorAll('.zoom-out').forEach(b => b.onclick = function() {
        scale = Math.max(minScale, scale - 0.25);
        applyZoom();
      });
      container.querySelectorAll('.zoom-reset').forEach(b => b.onclick = function() {
        scale = 1;
        applyZoom();
      });

      // Scroll-wheel zoom (Ctrl+scroll)
      const wrapper = container.querySelector('.diagram-wrapper');
      if (wrapper) {
        wrapper.addEventListener('wheel', function(e) {
          if (!e.ctrlKey) return;
          e.preventDefault();
          scale = e.deltaY < 0 ? Math.min(maxScale, scale + 0.25) : Math.max(minScale, scale - 0.25);
          applyZoom();
        }, { passive: false });

        // Double-click toggle zoom
        wrapper.addEventListener('dblclick', function() {
          scale = scale === 1 ? 2 : 1;
          applyZoom();
        });
      }
    });

    // Visualization: Relational Diagram (for Pertemuan 2)
    window.showRel = function(type) {
      const vis = document.getElementById('relVis');
      const desc = document.getElementById('relDesc');
      if (!vis) return;
      if (type === '11') {
        vis.innerHTML = `
          <svg style="width:100%; height:100%;" viewBox="0 0 400 150">
            <rect x="20" y="40" width="100" height="40" fill="#E7F0F1" stroke="#16294A" stroke-width="2" rx="5"/>
            <text x="70" y="65" text-anchor="middle" fill="#0D1B30" font-weight="bold">PASPOR</text>
            <rect x="260" y="40" width="100" height="40" fill="#E9F3E9" stroke="#4C8F5A" stroke-width="2" rx="5"/>
            <text x="310" y="65" text-anchor="middle" fill="#0D1B30" font-weight="bold">WARGA_NEGARA</text>
            <line x1="120" y1="60" x2="260" y2="60" stroke="#16294A" stroke-width="2"/>
            <text x="190" y="55" text-anchor="middle" font-size="11" fill="#666">1 : 1</text>
            <text x="190" y="75" text-anchor="middle" font-size="10" fill="#888">satu paspor ↔ satu warga</text>
          </svg>
        `;
        if (desc) desc.innerHTML = '<strong>One-to-One (1:1):</strong> Satu instansi entitas A berelasi dengan tepat satu instansi entitas B. Contoh: Satu orang memiliki satu paspor, dan satu paspor hanya dimiliki satu orang.';
      } else if (type === '1n') {
        vis.innerHTML = `
          <svg style="width:100%; height:100%;" viewBox="0 0 400 150">
            <rect x="20" y="20" width="80" height="40" fill="#2BA6A0" rx="5"/>
            <text x="60" y="45" text-anchor="middle" fill="#fff" font-weight="bold">Dosen A</text>
            <rect x="150" y="10" width="80" height="40" fill="#FBEFDC" rx="5"/>
            <text x="190" y="35" text-anchor="middle" fill="#0D1B30" font-size="12">Kelas X</text>
            <rect x="150" y="60" width="80" height="40" fill="#FBEFDC" rx="5"/>
            <text x="190" y="85" text-anchor="middle" fill="#0D1B30" font-size="12">Kelas Y</text>
            <line x1="100" y1="40" x2="150" y2="30" stroke="#16294A" stroke-width="2"/>
            <line x1="100" y1="40" x2="150" y2="80" stroke="#16294A" stroke-width="2"/>
            <text x="115" y="35" font-size="11" fill="#666">1:N</text>
          </svg>
        `;
        if (desc) desc.innerHTML = '<strong>One-to-Many (1:N):</strong> Satu instansi entitas A berelasi dengan banyak instansi entitas B. Contoh: Satu dosen mengampu banyak kelas, tetapi satu kelas hanya diasuh satu dosen.';
      } else if (type === 'mn') {
        vis.innerHTML = `
          <svg style="width:100%; height:100%;" viewBox="0 0 400 150">
            <rect x="20" y="20" width="80" height="40" fill="#E7F0F1" rx="5"/>
            <text x="60" y="35" text-anchor="middle" fill="#0D1B30" font-size="12">Mhs 1</text>
            <rect x="20" y="80" width="80" height="40" fill="#E7F0F1" rx="5"/>
            <text x="60" y="100" text-anchor="middle" fill="#0D1B30" font-size="12">Mhs 2</text>
            <rect x="180" y="50" width="80" height="40" fill="#E9F3E9" rx="5"/>
            <text x="220" y="75" text-anchor="middle" fill="#0D1B30" font-weight="bold">Buku A</text>
            <line x1="100" y1="40" x2="180" y2="70" stroke="#16294A" stroke-width="2"/>
            <line x1="100" y1="100" x2="180" y2="70" stroke="#16294A" stroke-width="2"/>
            <text x="130" y="50" font-size="11" fill="#666">M:N</text>
          </svg>
        `;
        if (desc) desc.innerHTML = '<strong>Many-to-Many (M:N):</strong> Banyak instansi entitas A berelasi dengan banyak instansi entitas B. Contoh: Banyak mahasiswa meminjam banyak buku, dan satu buku bisa dipinjam banyak mahasiswa (bergantian). Relasi M:N membutuhkan tabel penghubung saat implementasi.';
      }
    };

    // MATCHING GAME (Pertemuan 1, Section E.6)
    var matchTerms = document.getElementById('matchTerms');
    var matchDefs = document.getElementById('matchDefs');
    var matchFeedback = document.getElementById('matchFeedback');
    var matchReset = document.getElementById('matchReset');
    if (matchTerms && matchDefs && matchFeedback) {
      var MATCH_TERMS = [
        { id:'t1', term:'DBMS', def:'Perangkat lunak untuk mengelola basis data' },
        { id:'t2', term:'Redundansi', def:'Pengulangan data yang tidak perlu di beberapa tabel' },
        { id:'t3', term:'Data Independence', def:'Perubahan level storage tidak memengaruhi pengguna' },
        { id:'t4', term:'ACID', def:'Properti transaksi: Atomicity, Consistency, Isolation, Durability' },
        { id:'t5', term:'DBA', def:'Petugas yang mengelola dan mengamankan basis data' },
      ];
      var matchSelected = null, matchCount = 0;
      function renderMatch() {
        matchCount = 0; matchSelected = null; matchFeedback.innerHTML = '';
        matchTerms.innerHTML = '<p style="font-weight:600; margin-bottom:8px;">Istilah</p>';
        matchDefs.innerHTML = '<p style="font-weight:600; margin-bottom:8px;">Definisi</p>';
        var sTerms = MATCH_TERMS.slice().sort(function(){ return Math.random()-0.5; });
        var sDefs = MATCH_TERMS.slice().sort(function(){ return Math.random()-0.5; });
        sTerms.forEach(function(t) {
          var btn = document.createElement('button');
          btn.className = 'btn-sim';
          btn.style.cssText = 'display:block; width:100%; margin:4px 0; text-align:left; background:var(--navy-700);';
          btn.textContent = t.term;
          btn.setAttribute('data-term-id', t.id);
          btn.onclick = function() {
            matchTerms.querySelectorAll('.btn-sim').forEach(function(b){ b.style.background = 'var(--navy-700)'; });
            this.style.background = '#2BA6A0';
            matchSelected = t.id;
          };
          matchTerms.appendChild(btn);
        });
        sDefs.forEach(function(d) {
          var btn = document.createElement('button');
          btn.className = 'btn-sim';
          btn.style.cssText = 'display:block; width:100%; margin:4px 0; text-align:left; background:#EEF2F5; color:var(--ink);';
          btn.textContent = d.def;
          btn.setAttribute('data-def-id', d.id);
          btn.onclick = function() {
            if (!matchSelected) { matchFeedback.innerHTML = '<span style="color:#E7A83D;">Pilih istilah terlebih dahulu!</span>'; return; }
            if (matchSelected === this.getAttribute('data-def-id')) {
              this.style.background = '#dcfce7'; this.style.borderColor = '#22c55e';
              this.style.pointerEvents = 'none';
              var termBtn = matchTerms.querySelector('[data-term-id="'+matchSelected+'"]');
              if (termBtn) { termBtn.style.background = '#dcfce7'; termBtn.style.borderColor = '#22c55e'; termBtn.style.pointerEvents = 'none'; }
              matchCount++;
              matchFeedback.innerHTML = '<span style="color:#166534;">Benar! (' + matchCount + '/' + MATCH_TERMS.length + ')</span>';
              matchSelected = null;
              if (matchCount === MATCH_TERMS.length) matchFeedback.innerHTML = '<span style="color:#166534;">Semua tercocok! Pemahaman Anda sangat baik.</span>';
            } else {
              this.style.background = '#fee2e2'; this.style.borderColor = '#ef4444';
              matchFeedback.innerHTML = '<span style="color:#991b1b;">Kurang tepat, coba lagi.</span>';
              var self = this;
              setTimeout(function(){ self.style.background = '#EEF2F5'; self.style.borderColor = 'var(--line)'; }, 800);
            }
          };
          matchDefs.appendChild(btn);
        });
      }
      renderMatch();
      if (matchReset) matchReset.onclick = renderMatch;
    }

    // ENTITY CLASSIFICATION GAME (Pertemuan 2, Section E.2)
    var entityStart = document.getElementById('entityStart');
    if (entityStart) {
      var ENTITY_QS = [
        { q: "MAHASISWA (ada NIM sendiri)", a: "KUAT" },
        { q: "TANGGUNGAN (bergantung pada KARYAWAN)", a: "LEMAH" },
        { q: "BUKU (ada ISBN sendiri)", a: "KUAT" },
        { q: "DETAIL_PESANAN (bergantung pada PESANAN)", a: "LEMAH" },
        { q: "DOSEN (ada NIP sendiri)", a: "KUAT" },
        { q: "ITEM_TAGIHAN (bergantung pada TAGIHAN)", a: "LEMAH" },
        { q: "PRODUK (ada ID_produk sendiri)", a: "KUAT" },
        { q: "ENKRIPSI_FILE (bergantung pada FILE_DOKUMEN)", a: "LEMAH" },
      ];
      var entityOrder=[], entityCur=0, entityScore=0;
      var entityQ=document.getElementById('entityQ');
      var entityS=document.getElementById('entityScore');
      var entityT=document.getElementById('entityTotal');
      var entityF=document.getElementById('entityFeedback');
      var entityBtns=document.querySelectorAll('.entity-btn');
      entityBtns.forEach(function(b){b.disabled=true;});
      function entityShow(){if(entityCur>=entityOrder.length){entityQ.textContent='Selesai! Skor: '+entityScore+'/'+entityOrder.length;entityF.innerHTML='';entityBtns.forEach(function(b){b.disabled=true;});entityStart.disabled=false;return;}entityQ.textContent='('+(entityCur+1)+'/'+entityOrder.length+') '+entityOrder[entityCur].q;entityF.innerHTML='';}
      entityStart.onclick=function(){entityOrder=ENTITY_QS.slice().sort(function(){return Math.random()-0.5;});entityCur=0;entityScore=0;entityS.textContent='0';entityT.textContent=entityOrder.length;this.disabled=true;entityBtns.forEach(function(b){b.disabled=false;});entityShow();};
      entityBtns.forEach(function(b){b.onclick=function(){if(!entityOrder.length||entityCur>=entityOrder.length)return;var ok=this.getAttribute('data-type')===entityOrder[entityCur].a;if(ok){entityScore++;entityS.textContent=entityScore;entityF.innerHTML='<span style="color:#166534">Benar!</span>';}else{entityF.innerHTML='<span style="color:#991b1b">Salah! Jawaban: <strong>'+entityOrder[entityCur].a+'</strong></span>';}entityCur++;setTimeout(entityShow,900);};});
    }

    // ATTRIBUTE CLASSIFICATION GAME (Pertemuan 2, Section E.3)
    var attrStart = document.getElementById('attrStart');
    if (attrStart) {
      var ATTR_QS = [
        { q: "Alamat_Pengguna (Jalan, Kota, Provinsi)", a: "COMPOSITE" },
        { q: "Jenis_Kelamin (Laki-laki / Perempuan)", a: "SIMPLE" },
        { q: "No_Handphone (bisa lebih dari satu)", a: "MULTI-VALUED" },
        { q: "Usia (dihitung dari Tanggal_Lahir)", a: "DERIVED" },
        { q: "Email (satu nilai per pengguna)", a: "SIMPLE" },
        { q: "Tanggal_Lahir", a: "SIMPLE" },
        { q: "Nama_Lengkap (Depan, Tengah, Belakang)", a: "COMPOSITE" },
        { q: "Skill_Programmer (Python, Java, dll)", a: "MULTI-VALUED" },
        { q: "Total_Belanja (dihitung dari semua transaksi)", a: "DERIVED" },
        { q: "Kota_Tinggal", a: "SIMPLE" },
      ];
      var attrOrder=[], attrCur=0, attrScore=0;
      var attrQ=document.getElementById('attrQ');
      var attrS=document.getElementById('attrScore');
      var attrT=document.getElementById('attrTotal');
      var attrF=document.getElementById('attrFeedback');
      var attrBtns=document.querySelectorAll('.attr-btn');
      attrBtns.forEach(function(b){b.disabled=true;});
      function attrShow(){if(attrCur>=attrOrder.length){attrQ.textContent='Selesai! Skor: '+attrScore+'/'+attrOrder.length;attrF.innerHTML='';attrBtns.forEach(function(b){b.disabled=true;});attrStart.disabled=false;return;}attrQ.textContent='('+(attrCur+1)+'/'+attrOrder.length+') '+attrOrder[attrCur].q;attrF.innerHTML='';}
      attrStart.onclick=function(){attrOrder=ATTR_QS.slice().sort(function(){return Math.random()-0.5;});attrCur=0;attrScore=0;attrS.textContent='0';attrT.textContent=attrOrder.length;this.disabled=true;attrBtns.forEach(function(b){b.disabled=false;});attrShow();};
      attrBtns.forEach(function(b){b.onclick=function(){if(!attrOrder.length||attrCur>=attrOrder.length)return;var ok=this.getAttribute('data-type')===attrOrder[attrCur].a;if(ok){attrScore++;attrS.textContent=attrScore;attrF.innerHTML='<span style="color:#166534">Benar!</span>';}else{attrF.innerHTML='<span style="color:#991b1b">Salah! Jawaban: <strong>'+attrOrder[attrCur].a+'</strong></span>';}attrCur++;setTimeout(attrShow,900);};});
    }

    // ERD IDENTIFICATION GAME (Pertemuan 2, Section G.2)
    var erdStart = document.getElementById('erdStart');
    if (erdStart) {
      var ERD_QS = [
        { q: "PELANGGAN dan PRODUK merupakan entitas dalam ERD ini.", a: "true", exp: "Benar! Keduanya adalah objek yang memiliki data dan berelasi." },
        { q: "Relasi antara PELANGGAN dan PRODUK adalah One-to-One (1:1).", a: "false", exp: "Salah! Satu pelanggan bisa memesan banyak produk, dan satu produk bisa dipesan banyak pelanggan, yaitu relasi M:N." },
        { q: "Atribut 'tanggal' pada pesanan termasuk atribut relasi, bukan atribut entitas.", a: "true", exp: "Benar! Tanggal adalah atribut dari relasi PESANAN (hubungan antara PELANGGAN dan PRODUK)." },
        { q: "PELANGGAN bisa langsung dikaitkan dengan PRODUK tanpa tabel penghubung.", a: "false", exp: "Salah! Relasi M:N membutuhkan tabel penghubung (mis. PESANAN) saat implementasi." },
        { q: "Atribut 'harga' pada PRODUK termasuk atribut sederhana (simple).", a: "true", exp: "Benar! Harga adalah nilai tunggal yang tidak bisa dipecah lagi." },
        { q: "Dalam ERD, entitas PELANGGAN ditandai dengan oval.", a: "false", exp: "Salah! Entitas ditandai dengan persegi/rectangle. Oval digunakan untuk atribut." },
      ];
      var erdOrder=[], erdCur=0, erdScore=0;
      var erdQ=document.getElementById('erdQ');
      var erdS=document.getElementById('erdScore');
      var erdT=document.getElementById('erdTotal');
      var erdF=document.getElementById('erdFeedback');
      var erdBtns=document.querySelectorAll('.erd-btn');
      erdBtns.forEach(function(b){b.disabled=true;});
      function erdShow(){if(erdCur>=erdOrder.length){erdQ.textContent='Selesai! Skor: '+erdScore+'/'+erdOrder.length;erdF.innerHTML='';erdBtns.forEach(function(b){b.disabled=true;});erdStart.disabled=false;return;}erdQ.textContent='('+(erdCur+1)+'/'+erdOrder.length+') '+erdOrder[erdCur].q;erdF.innerHTML='';}
      erdStart.onclick=function(){erdOrder=ERD_QS.slice().sort(function(){return Math.random()-0.5;});erdCur=0;erdScore=0;erdS.textContent='0';erdT.textContent=erdOrder.length;this.disabled=true;erdBtns.forEach(function(b){b.disabled=false;});erdShow();};
      erdBtns.forEach(function(b){b.onclick=function(){if(!erdOrder.length||erdCur>=erdOrder.length)return;var ok=this.getAttribute('data-type')===erdOrder[erdCur].a;if(ok){erdScore++;erdS.textContent=erdScore;erdF.innerHTML='<span style="color:#166534">Benar! '+erdOrder[erdCur].exp+'</span>';}else{erdF.innerHTML='<span style="color:#991b1b">Salah! '+erdOrder[erdCur].exp+'</span>';}erdCur++;setTimeout(erdShow,1500);};});
    }
  }

  // CODE HIGHLIGHTING
  function highlightCode() {
    document.querySelectorAll('pre code').forEach(block => {
      let html = block.innerHTML;
      // Comments
      html = html.replace(/(--[^\n]*)/g, '<span class="hl-comment">$1</span>');
      html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
      // Strings
      html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>');
      // Numbers
      html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>');
      // Keywords
      const kw = 'SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|JOIN|INNER|LEFT|RIGHT|OUTER|ON|AND|OR|NOT|IN|IS|NULL|AS|DISTINCT|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|COUNT|SUM|AVG|MAX|MIN|PRIMARY|KEY|FOREIGN|REFERENCES|CONSTRAINT|UNIQUE|CHECK|DEFAULT|AUTO_INCREMENT|VARCHAR|INT|INTEGER|TEXT|DATE|DATETIME|BOOLEAN|DECIMAL|FLOAT|DOUBLE|CHAR|BLOB|ENUM|SET|IF|EXISTS|REPLACE|GRANT|REVOKE|ALL|PRIVILEGES|TO|CASCADE|RESTRICT|BETWEEN|LIKE|ANY|SOME|EXISTS|UNION|INTERSECT|EXCEPT|WITH|RECURSIVE|CASE|WHEN|THEN|ELSE|END|BETWEEN|LIKE|IN|IS|NOT|NULL|TRUE|FALSE|ASC|DESC|TOP|PERCENT|FETCH|NEXT|ROWS|ONLY|OVER|PARTITION|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|FIRST_VALUE|LAST_VALUE|NTH_VALUE|WITHIN|GROUP|ROLLUP|CUBE|GROUPING|SETS|PIVOT|UNPIVOT|FOR|XML|JSON|PATH|ROOT|ELEMENTS|CONTENT|AUTO|WITHOUT|ARRAY|KEYS|VALUES|PATH|LANGUAGE|SQL|ROWS?|TYPE|SECURITY|DEFINER|INVOKER|SQL|SECURITY|DEFINER|INVOKER|PROCEDURE|FUNCTION|TRIGGER|EVENT|SCHEDULE|EVERY|STARTS|ENDS|INTERVAL|DAY|HOUR|MINUTE|MONTH|YEAR|SECOND|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|TRANSACTION|ISOLATION|LEVEL|READ|COMMITTED|UNCOMMITTED|REPEATABLE|SERIALIZABLE|LOCK|TABLES|WAIT|NOWAIT|SKIP|LOCKED|FORCE|IGNORE|KEY|USE|FORCE|INDEX|FOR|ORDER|BY|LIMIT|INTO|OUTFILE|DUMPFILE|LOAD|DATA|INFILE|REPLACE|INTO|TABLE|FIELDS|TERMINATED|BY|OPTIONALLY|ENCLOSED|BY|LINES|TERMINATED|BY|IGNORE|1|LINES|SET|NAMES|CHARACTER|SET|COLLATE|DATABASE|SCHEMA|IF|NOT|EXISTS|CREATE|DATABASE|USE|DATABASE|DROP|DATABASE|IF|EXISTS|SHOW|DATABASES|SHOW|TABLES|SHOW|COLUMNS|FROM|DESCRIBE|EXPLAIN|ANALYZE|SELECT|INTO|OUTFILE|DUMPFILE|LOAD|DATA|INFILE|REPLACE|INTO|TABLE|FIELDS|TERMINATED|BY|OPTIONALLY|ENCLOSED|BY|LINES|TERMINATED|BY|IGNORE|1|LINES|SET|NAMES|CHARACTER|SET|COLLATE|DATABASE|SCHEMA|IF|NOT|EXISTS|CREATE|DATABASE|USE|DATABASE|DROP|DATABASE|IF|EXISTS|SHOW|DATABASES|SHOW|TABLES|SHOW|COLUMNS|FROM|DESCRIBE|EXPLAIN|ANALYZE'.split('|').join('|');
      const kwRegex = new RegExp('\\b(' + kw + ')\\b', 'gi');
      html = html.replace(kwRegex, (m) => {
        if (/<span/.test(html.substring(html.indexOf(m)-30, html.indexOf(m)))) return m;
        return '<span class="hl-keyword">' + m + '</span>';
      });
      // Types
      const types = 'INT|INTEGER|VARCHAR|TEXT|CHAR|FLOAT|DOUBLE|DECIMAL|BOOLEAN|DATE|DATETIME|TIMESTAMP|BLOB|CLOB|ENUM|SET|BIGINT|SMALLINT|TINYINT|MEDIUMINT|LONGTEXT|MEDIUMTEXT|TINYTEXT|VARBINARY|BINARY'.split('|').join('|');
      const typeRegex = new RegExp('\\b(' + types + ')\\b', 'gi');
      html = html.replace(typeRegex, '<span class="hl-type">$1</span>');
      // Functions
      const fns = 'COUNT|SUM|AVG|MAX|MIN|COALESCE|IFNULL|NULLIF|CAST|CONVERT|CONCAT|SUBSTRING|TRIM|UPPER|LOWER|LENGTH|REPLACE|NOW|CURDATE|DATE_FORMAT|IF|CASE|WHEN|THEN|ELSE|END'.split('|').join('|');
      const fnRegex = new RegExp('\\b(' + fns + ')\\b', 'gi');
      html = html.replace(fnRegex, '<span class="hl-function">$1</span>');
      block.innerHTML = html;
    });
  }

  window.addEventListener("hashchange", route);
  route();
})();
