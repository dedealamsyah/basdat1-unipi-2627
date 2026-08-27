/* =====================================================================
   erd-interactive.js — Interaktivitas Diagram ERD
   - Hover garis relasi  → sorot 2 entitas terhubung + tooltip info
   - Hover kotak entitas → sorot semua garis relasinya
   - Klik garis relasi    → pin/sematkan tooltip (klik lagi utk melepas)
------------------------------------------------------------------------
   Cara pakai:
   - Kotak entitas: <rect class="entity-box" data-entity="NAME" .../>
   - Garis relasi:  <line class="rel-line" data-a=".." data-b=".."
                     data-cardinality="1:N" data-desc=".."
                     data-participation=".." .../>
===================================================================== */
(function () {
  "use strict";

  if (window.__erdInteractiveLoaded) return;
  window.__erdInteractiveLoaded = true;

  function initDiagram(container) {
    var inner = container.querySelector(".diagram-inner");
    var svg = inner ? inner.querySelector("svg") : null;
    if (!svg) return;

    var entities = {};
    svg.querySelectorAll(".entity-box").forEach(function (el) {
      var id = el.getAttribute("data-entity");
      if (id) entities[id] = el;
    });

    var entityLines = {};
    var lines = [];

    svg.querySelectorAll(".rel-line").forEach(function (line) {
      var a = line.getAttribute("data-a");
      var b = line.getAttribute("data-b");
      if (!a || !b) return;
      lines.push(line);
      (entityLines[a] = entityLines[a] || []).push(line);
      (entityLines[b] = entityLines[b] || []).push(line);
    });

    if (!lines.length) return;

    // Tooltip element per diagram
    var tip = document.createElement("div");
    tip.className = "erd-tooltip";
    container.appendChild(tip);
    var pinned = null;

    function getEntity(id) { return entities[id] || null; }

    function clearHighlight() {
      if (pinned) return;
      svg.querySelectorAll(".rel-line").forEach(function (l) {
        l.classList.remove("rel-hl");
      });
      svg.querySelectorAll(".entity-box").forEach(function (el) {
        el.classList.remove("entity-hl", "entity-dim");
      });
    }

    function highlightPair(line) {
      var a = getEntity(line.getAttribute("data-a"));
      var b = getEntity(line.getAttribute("data-b"));
      clearHighlight();
      line.classList.add("rel-hl");
      [a, b].forEach(function (el) {
        if (el) { el.classList.add("entity-hl"); el.classList.remove("entity-dim"); }
      });
      svg.querySelectorAll(".entity-box").forEach(function (el) {
        if (el !== a && el !== b) el.classList.add("entity-dim");
      });
    }

    function highlightEntity(el) {
      clearHighlight();
      var id = el.getAttribute("data-entity");
      var related = entityLines[id] || [];
      related.forEach(function (l) { l.classList.add("rel-hl"); });
      el.classList.add("entity-hl");
      svg.querySelectorAll(".entity-box").forEach(function (other) {
        if (other !== el) other.classList.add("entity-dim");
      });
    }

    function tooltipHTML(line) {
      var card = line.getAttribute("data-cardinality") || "";
      var desc = line.getAttribute("data-desc") || "";
      var part = line.getAttribute("data-participation") || "";
      var cls = line.classList.contains("erd-junction") ? "erd-tip-card erd-tip-junction" : "erd-tip-card";
      return (
        '<div class="' + cls + '">' +
        '<div class="erd-tip-title">' + card + "</div>" +
        '<div class="erd-tip-desc">' + desc + "</div>" +
        (part ? '<div class="erd-tip-part">Partisipasi: ' + part + "</div>" : "") +
        "</div>"
      );
    }

    function showTip(line, e) {
      tip.innerHTML = tooltipHTML(line);
      tip.style.display = "block";
      moveTip(e);
    }

    function moveTip(e) {
      if (tip.style.display === "none") return;
      var rect = container.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var tw = tip.offsetWidth || 180;
      var th = tip.offsetHeight || 60;
      tip.style.left = (x + 14 + tw > rect.width ? x - tw - 10 : x + 14) + "px";
      tip.style.top = (y + 14 + th > rect.height ? y - th - 10 : y + 14) + "px";
    }

    function hideTip() {
      tip.style.display = "none";
    }

    function pinAt(line) {
      var r = line.getBoundingClientRect();
      var rect = container.getBoundingClientRect();
      moveTip({
        clientX: r.left + (r.right - r.left) / 2,
        clientY: r.top + (r.bottom - r.top) / 2
      });
    }

    function unpin() {
      pinned = null;
      tip.classList.remove("erd-tooltip-pinned");
      clearHighlight();
      hideTip();
    }

    lines.forEach(function (line) {
      line.addEventListener("mouseenter", function (e) {
        highlightPair(line);
        showTip(line, e);
      });
      line.addEventListener("mousemove", moveTip);
      line.addEventListener("mouseleave", function () {
        if (!pinned || pinned !== line) clearHighlight();
        hideTip();
      });
      line.addEventListener("click", function (e) {
        e.stopPropagation();
        if (pinned === line) {
          unpin();
        } else {
          pinned = line;
          highlightPair(line);
          tip.innerHTML = tooltipHTML(line);
          tip.classList.add("erd-tooltip-pinned");
          tip.style.display = "block";
          pinAt(line);
        }
      });
    });

    Object.keys(entities).forEach(function (id) {
      var el = entities[id];
      el.addEventListener("mouseenter", function () { highlightEntity(el); });
      el.addEventListener("mouseleave", function () {
        if (!pinned) clearHighlight();
      });
    });

    // Klik area kosong di SVG → lepas pin
    svg.addEventListener("click", function (e) {
      if (e.target === svg || !e.target.closest) {
        if (pinned) unpin();
        return;
      }
      if (!(e.target.closest(".rel-line") || e.target.closest(".entity-box"))) {
        if (pinned) unpin();
      }
    });
  }

  function initAll() {
    document.querySelectorAll(".diagram-inner svg").forEach(function (svg) {
      var container = svg.closest(".diagram-container");
      if (container) initDiagram(container);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
  document.addEventListener("astro:page-load", initAll);
})();