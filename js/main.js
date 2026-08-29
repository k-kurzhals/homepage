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

    var foot;
    if (link) {
      foot =
        '<span class="tag">' + esc(CAT_LABELS[p.cat] || p.cat) + "</span>" +
        '<a class="card-link" href="' + esc(link) + '" target="_blank" rel="noopener">DOI →</a>';
    } else {
      foot =
        '<span class="tag">' + esc(CAT_LABELS[p.cat] || p.cat) + "</span>" +
        '<span class="doi-only">' + (p.pages ? "pp. " + esc(p.pages) : "—") + "</span>";
    }

    return (
      '<article class="card">' +
      '<div class="card-meta"><span class="year-badge">' + p.year + "</span>" +
      "<span>" + esc(shortVenue(p.venue)) + "</span></div>" +
      "<h3>" + title + "</h3>" +
      '<p class="card-desc">' + desc + "</p>" +
      '<div class="card-foot">' + foot + "</div>" +
      "</article>"
    );
  }

  /* compact venue name for the card meta row */
  function shortVenue(v) {
    var map = [
      ["Computer Graphics Forum", "CGF"],
      ["IEEE Transactions on Visualization and Computer Graphics", "IEEE TVCG"],
      ["IEEE Computer Graphics and Applications", "IEEE CG&A"],
      ["ACM Symposium on Eye Tracking Research and Applications", "ETRA"],
      ["CHI Conference on Human Factors in Computing Systems", "CHI"],
      ["The Visual Computer", "The Visual Computer"],
      ["Computers & Graphics", "Computers & Graphics"],
      ["Proceedings of the ACM on Human-Computer Interaction", "PACM HCI"],
      ["Proceedings of the ACM on Computer Graphics and Interactive Techniques", "PACM CGIT"],
      ["Information Visualization", "Information Visualization"],
      ["IEEE Transactions on Multimedia", "IEEE TMM"],
      ["Spatial Cognition", "Spatial Cognition & Comp."],
      ["Computing in Science", "Comput. in Sci. & Eng."],
      ["it – Information Technology", "it – Information Technology"],
      ["Hawaii International Conference on System Sciences", "HICSS"],
      ["EuroVis", "EuroVis"],
      ["Extended Abstracts of the CHI", "CHI Extended Abstracts"],
      ["IEEE Conference on Virtual Reality", "IEEE VR"],
      ["IEEE BELIV", "IEEE BELIV"]
    ];
    for (var i = 0; i < map.length; i++) {
      if (v.indexOf(map[i][0]) === 0 || v.indexOf(map[i][0]) !== -1) {
        var rest = v.replace(map[i][0], "").replace(/^[\s.·]+/, "");
        return map[i][1] + (rest ? " " + rest : "");
      }
    }
    return v.length > 46 ? v.slice(0, 45) + "…" : v;
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
    empty.hidden = out.length !== 0;
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

    apply();
  }

  fetch("data/publications.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(init)
    .catch(function (err) {
      grid.innerHTML =
        '<p class="empty">Could not load publications (' +
        esc(err.message) + '). Open the site over HTTP (e.g. <code>npx serve</code> or GitHub Pages) instead of via <code>file://</code>.</p>';
      empty.hidden = true;
    });
})();
