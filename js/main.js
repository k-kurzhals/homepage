/* ============================================================
   Kuno Kurzhals — publications gallery
   Loads data/publications.json, renders tile grid with
   category filters and text search.
   ============================================================ */

(function () {
  "use strict";

  var CAT_LABELS = {
    journal: "Journal",
    conf: "Conference",
    chapter: "Book Chapter",
    thesis: "Dissertation"
  };

  var state = { all: [], filter: "all", query: "" };

  var grid = document.getElementById("grid");
  var empty = document.getElementById("empty");
  var filtersEl = document.getElementById("filters");
  var searchInput = document.getElementById("search-input");
  var pubCount = document.getElementById("pub-count");

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function authorsHTML(authors) {
    return authors
      .map(function (a) {
        var e = esc(a);
        if (/^Kurzhals/i.test(a)) {
          e = "<strong>" + e + "</strong>";
        }
        return e;
      })
      .join(", ");
  }

  function doiURL(p) {
    return p.doi ? "https://doi.org/" + p.doi : (p.url || null);
  }

  function cardHTML(p) {
    var link = doiURL(p);
    var title = link
      ? '<a href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a>"
      : esc(p.title);

    var desc =
      '<span class="authors">' + authorsHTML(p.authors) + "</span>" +
      '<span class="sep">·</span><span class="venue">' + esc(p.venue) + "</span>";
    if (p.pages) {
      desc += ", pp. " + esc(p.pages);
    }

    /* Optional card image.
       - "image": "path.png"  -> explicit file
       - "image": true        -> auto-detect img/<title>.(png|jpg|jpeg|webp) */
    var media = "";
    if (p.image) {
      var srcs;
      if (typeof p.image === "string") {
        srcs = [p.image];
      } else {
        /* Try the exact title, then a normalized one (OS-friendly file
           names): trailing "?" dropped, ":" replaced by " - ". */
        var variants = [p.title];
        var norm = p.title.trim().replace(/\?+$/, "").replace(/:\s*/g, " - ");
        if (norm !== p.title) variants.push(norm);
        srcs = [];
        [".png", ".jpg", ".jpeg", ".webp"].forEach(function (ext) {
          variants.forEach(function (v) {
            var s = "img/" + encodeURIComponent(v) + ext;
            if (srcs.indexOf(s) === -1) srcs.push(s);
          });
        });
      }
      media =
        '<div class="card-media"><img alt="" src="' + esc(srcs[0]) +
        '" data-cands="' + esc(srcs.join("|")) + '" loading="lazy"></div>';
    }

    var doiLink = link ?
      '<a class="card-link" href="' + esc(link) + '" target="_blank" rel="noopener">DOI →</a>' : "";
    var videoBtn = p.video ?
      '<a class="card-video" href="' + esc(p.video) + '" data-video="' + esc(p.video) +
      '" title="Watch video" aria-label="Watch video">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></a>' : "";
    var right = doiLink;
    if (!right && p.pages) {
      right = '<span class="doi-only">pp. ' + esc(p.pages) + "</span>";
    }

    var detail = "";
    if (p.detail) {
      detail =
        '<div class="card-detail">' +
        '<p class="card-detail-text">' + esc(p.detail) + "</p>" +
        '<button type="button" class="detail-toggle" aria-expanded="false">More ↓</button>' +
        "</div>";
    }

    return (
      '<article class="card">' +
      media +
      '<div class="card-meta"><span class="year-badge">' + p.year + "</span>" +
      videoBtn + "</div>" +
      "<h3>" + title + "</h3>" +
      '<p class="card-desc">' + desc + "</p>" +
      detail +
      '<div class="card-foot"><span class="tag">' + esc(CAT_LABELS[p.cat] || p.cat) +
      '</span><span class="card-foot-right">' + right + "</span></div>" +
      "</article>"
    );
  }

  /* ---------- filtering ---------- */

  function apply() {
    var q = state.query.trim().toLowerCase();
    var out = state.all.filter(function (p) {
      var okCat = state.filter === "all" || p.cat === state.filter;
      var okQ =
        !q ||
        p.title.toLowerCase().indexOf(q) !== -1 ||
        p.venue.toLowerCase().indexOf(q) !== -1 ||
        p.authors.join(" ").toLowerCase().indexOf(q) !== -1;
      return okCat && okQ;
    });

    out.sort(function (a, b) {
      return b.year - a.year || a.title.localeCompare(b.title);
    });

    grid.innerHTML = out.map(cardHTML).join("");
    wireMediaFallbacks();
    wireInteractions();
    empty.hidden = out.length !== 0;
  }

  /* For auto-detected images: walk the candidate extensions until one
     loads; if none exist, remove the media box entirely. */
  function wireMediaFallbacks() {
    grid.querySelectorAll(".card-media img[data-cands]").forEach(function (img) {
      var cands = img.dataset.cands.split("|");
      var i = 0;
      img.onerror = function () {
        i++;
        if (i < cands.length) {
          img.src = cands[i];
        } else {
          var box = img.parentNode;
          if (box) box.remove();
        }
      };
    });
  }

   /* Collapse/expand detail text + open video modals. */
  function wireInteractions() {
    grid.querySelectorAll(".detail-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var box = btn.closest(".card-detail");
        var open = box.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.textContent = open ? "Less ↑" : "More ↓";
      });
    });

    var modal = document.getElementById("video-modal");
    var frame = document.getElementById("video-frame");
    grid.querySelectorAll(".card-video").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var url = a.getAttribute("href");
        /* YouTube's embed player requires a real http(s) origin. Over
           file:// the origin is opaque / the referrer is empty, so the
           player fails to configure (YouTube "Error 153"). Fall back to
           opening the watch page in a new tab in that case. */
        if (location.protocol === "file:") {
          window.open(url, "_blank", "noopener");
          return;
        }
        var m = /v=([A-Za-z0-9_-]{6,})/.exec(url);
        var id = m ? m[1] : "";
        frame.src = "https://www.youtube.com/embed/" + id + "?rel=0";
        modal.classList.add("show");
      });
    });
  }

  function buildFilters() {
    var counts = { all: state.all.length };
    state.all.forEach(function (p) {
      counts[p.cat] = (counts[p.cat] || 0) + 1;
    });

    var defs = [
      ["all", "All"],
      ["journal", "Journals"],
      ["conf", "Conferences"],
      ["chapter", "Book Chapters"],
      ["thesis", "Dissertation"]
    ];

    filtersEl.innerHTML = defs
      .filter(function (d) { return counts[d[0]]; })
      .map(function (d) {
        var active = d[0] === state.filter ? " active" : "";
        return (
          '<button class="filter-btn' + active + '" data-cat="' + d[0] + '">' +
          d[1] + ' <span class="count">' + (counts[d[0]] || 0) + "</span></button>"
        );
      })
      .join("");

    filtersEl.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".filter-btn");
      if (!btn) return;
      state.filter = btn.dataset.cat;
      filtersEl.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      apply();
    });
  }

  /* ---------- init ---------- */

  function init(data) {
    state.all = data.publications || [];

    var years = state.all.map(function (p) { return p.year; });
    pubCount.textContent =
      state.all.length + " publications · " + Math.min.apply(null, years) + " – " +
      Math.max.apply(null, years);

    buildFilters();

    searchInput.addEventListener("input", function () {
      state.query = this.value;
      apply();
    });

    /* Video modal: close on X, backdrop, or Escape. */
    var modal = document.getElementById("video-modal");
    var frame = document.getElementById("video-frame");
    var close = document.getElementById("video-close");
    function closeModal() {
      modal.classList.remove("show");
      frame.src = "";
    }
    if (close) close.addEventListener("click", closeModal);
    if (modal) modal.addEventListener("click", function (ev) {
      if (ev.target === modal) closeModal();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && modal.classList.contains("show")) closeModal();
    });

    apply();
  }

  /* Data is loaded via <script src="data/publications.js"> (sets window.PUBLICATIONS)
     so the page works both over HTTP and when opened directly via file://. */
  var data = window.PUBLICATIONS;
  if (!data || !data.publications) {
    grid.innerHTML =
      '<p class="empty">Could not load publications — is <code>data/publications.js</code> present next to <code>index.html</code>?</p>';
    return;
  }
  init(data);
})();
