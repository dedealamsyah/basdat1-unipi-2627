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

  const available = PERTEMUAN.filter((p) => !p.locked).length;
  document.getElementById("progressText").textContent = available + " / " + PERTEMUAN.length;
  document.getElementById("progressFill").style.width = (available / PERTEMUAN.length * 100) + "%";

  function buildSidebar(activeId) {
    sidebarList.innerHTML = "";
    PERTEMUAN.forEach((p) => {
      const li = document.createElement("li");
      li.className = "row" + (p.locked ? " locked" : "") + (p.id === activeId ? " active" : "");
      li.innerHTML =
        '<span class="row__pk">' + String(p.id).padStart(2, "0") + '</span>' +
        '<span class="row__text">' +
          '<span class="row__num">PERTEMUAN ' + p.id + '</span>' +
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

    content.innerHTML =
      '<div class="contentHeader">' +
        '<div class="eyebrow">Pertemuan ' + String(p.id).padStart(2, "0") + ' · ' + COURSE.name + '</div>' +
        '<h1 class="pageTitle">' + p.title + '</h1>' +
        (p.subtitle ? '<p class="pageSubtitle">' + p.subtitle + '</p>' : '') +
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
  }

  function route() {
    const hash = location.hash.replace("#p", "");
    let id = parseInt(hash, 10);
    if (!id) {
      const firstAvailable = PERTEMUAN.find((p) => !p.locked);
      id = firstAvailable ? firstAvailable.id : 1;
    }
    const p = PERTEMUAN.find((x) => x.id === id) || PERTEMUAN[0];
    buildSidebar(p.id);
    if (p.locked) renderLocked(p); else renderPertemuan(p);
    window.scrollTo(0, 0);
    initInteractivity();
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
        { q: "phpMyAdmin sebagai aplikasi pendukung administrasi basis data.", a: "SOFTWARE" }
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
      if (!vis) return;
      if (type === '1n') {
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
      }
    };
  }

  window.addEventListener("hashchange", route);
  route();
})();
