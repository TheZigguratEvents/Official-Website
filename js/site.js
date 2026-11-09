/* =========================================================================
   SITE.JS  —  the "engine" of the site. You normally won't need to edit it.
   -------------------------------------------------------------------------
   What it does:
     1. Reads data/shows.csv and data/bands.csv
     2. Splits shows into upcoming and past using today's date
     3. Fills in every <div data-render="..."> on a page
     4. Runs the photo carousels and the drop-down menu
     5. Sends the forms on the Contact page

   To change how shows and bands LOOK  -> edit js/templates.js
   To change settings                  -> edit _config.yml
   ========================================================================= */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var TEMPLATES = window.TEMPLATES || {};
  var LANGUAGE = "en-US";        // Language used when writing out dates
  var COUNTER_WORD = "Tablet";   // Slideshow counter: "Tablet 1 of 3" (change to "Photo" for plain)

  /* Button names for streaming columns. A column called stream_youtube
     becomes a "YouTube" button. To add a service, add a column to
     data/bands.csv named stream_SOMETHING. Add it here only if the
     automatic name looks wrong (e.g. stream_soundcloud -> "Soundcloud"). */
  var STREAMING_NAMES = {
    spotify: "Spotify",
    apple_music: "Apple Music",
    youtube: "YouTube",
    youtube_music: "YouTube Music",
    bandcamp: "Bandcamp",
    soundcloud: "SoundCloud",
    amazon_music: "Amazon Music",
    tidal: "TIDAL",
    deezer: "Deezer"
  };

  /* Other column headings the CSV files may use (left) for the
     headings the site expects (right). Headings ignore capitals,
     and spaces count as underscores ("Show Date" = show_date). */
  var COLUMN_ALIASES = {
    show_date: "date", show_time: "time", show_title: "title",
    show_location: "location", venue: "location",
    show_cost: "price", cost: "price", show_price: "price",
    show_description: "description",
    band_list: "bands", lineup: "bands",
    poster: "poster_image", show_poster: "poster_image", poster_image_link: "poster_image",
    tickets: "ticket_link", ticket_url: "ticket_link",
    band_name: "name", band_members: "members", band_website: "website",
    music_genre: "genre", instagram_username: "instagram",
    band_biography: "bio", biography: "bio",
    logo: "logo_image", band_logo: "logo_image", logo_image_link: "logo_image"
  };


  /* ---------------------------------------------------------------------
     1. SMALL HELPERS
     --------------------------------------------------------------------- */

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  // Makes text safe to put inside HTML.
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // "The Example Band!" -> "the-example-band"
  function slugify(value) {
    return clean(value).toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // "A; B | C" (or one per line) -> ["A", "B", "C"]
  function splitList(value) {
    return clean(value).split(/\s*[;|\n]\s*/).map(clean).filter(Boolean);
  }

  // "apple_music" -> "Apple Music"
  function titleCase(value) {
    return clean(value).replace(/_/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  // Long text from the CSV -> paragraphs. A blank line starts a new paragraph.
  // HTML typed into the CSV is kept, so links and bold text work.
  function richText(value) {
    var text = clean(value).replace(/\r\n?/g, "\n");
    if (!text) return "";
    return text.split(/\n\s*\n/).map(function (para) {
      return "<p>" + para.trim().replace(/\n/g, "<br>") + "</p>";
    }).join("\n");
  }

  // Image paths from the CSV. "images/x.jpg", "/images/x.jpg" and full
  // https:// links all work.
  function imagePath(value, fallback) {
    var path = (clean(value) || clean(fallback)).replace(/\\/g, "/");
    if (/^(https?:)?\/\//i.test(path) || /^data:/i.test(path)) return path;
    return path.replace(/^\.?\/+/, "");
  }

  // Web links from the CSV. Adds https:// if it was left off.
  function webLink(value) {
    var link = clean(value);
    if (!link) return "";
    if (!/^[a-z][a-z0-9+.\-]*:/i.test(link)) link = "https://" + link.replace(/^\/+/, "");
    return link;
  }

  // "https://www.example.com/band/" -> "example.com/band"
  function shortLink(link) {
    return clean(link).replace(/^[a-z]+:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "");
  }

  // "@name", "name" or an Instagram link -> "name"
  function instagramName(value) {
    var name = clean(value);
    var match = name.match(/instagram\.com\/([^\/?#]+)/i);
    if (match) name = match[1];
    return name.replace(/^@+/, "").replace(/\/+$/, "");
  }

  // ["a", "b"] -> <ul><li>a</li><li>b</li></ul>  (items must already be safe HTML)
  function listHTML(items) {
    if (!items.length) return "";
    return "<ul>" + items.map(function (item) { return "<li>" + item + "</li>"; }).join("") + "</ul>";
  }

  // Keeps ids unique: "show", "show" -> "show", "show-2"
  function uniqueId(id, used) {
    var base = id || "item", candidate = base, n = 2;
    while (used[candidate.toLowerCase()]) candidate = base + "-" + n++;
    used[candidate.toLowerCase()] = true;
    return candidate;
  }

  function pageParam(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  // Sorts "2.jpg" before "10.jpg"
  function naturalCompare(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  }


  /* ---------------------------------------------------------------------
     2. READING CSV FILES
     Handles quotes, commas and line breaks inside cells, and files
     saved from Excel, Numbers or Google Sheets.
     --------------------------------------------------------------------- */

  function parseCSV(text) {
    text = String(text || "").replace(/^﻿/, "");               // remove Excel's hidden marker
    var firstLine = text.split(/\r?\n/, 1)[0] || "";
    var sep = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";

    var rows = [], row = [], field = "", inQuotes = false;
    var line = 1, rowLine = 1;

    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { if (c === "\n") line++; field += c; }
      } else if (c === '"' && field.trim() === "") {
        inQuotes = true; field = "";
      } else if (c === sep) {
        row.push(field); field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); row.line = rowLine; rows.push(row);
        row = []; field = ""; line++; rowLine = line;
      } else {
        field += c;
      }
    }
    if (field !== "" || row.length) { row.push(field); row.line = rowLine; rows.push(row); }
    return rows;
  }

  function columnName(heading) {
    var key = clean(heading).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return COLUMN_ALIASES[key] || key;
  }

  // Turns CSV text into a list of rows like { date: "...", title: "..." }
  function readTable(text, fileName) {
    var rows = parseCSV(text);
    var headers = (rows.shift() || []).map(columnName);
    var records = [];
    rows.forEach(function (cells) {
      if (!cells.some(function (cell) { return clean(cell); })) return;   // skip empty rows
      var record = { _line: cells.line, _file: fileName };
      headers.forEach(function (h, i) { if (h) record[h] = clean(cells[i]); });
      records.push(record);
    });
    return { headers: headers, records: records, problems: [] };
  }


  /* ---------------------------------------------------------------------
     3. DATES AND TIMES
     Dates can be written 2026-11-21, 11/21/2026, Nov 21 2026,
     November 21, 2026 or 21 November 2026.
     --------------------------------------------------------------------- */

  var MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

  function monthNumber(word) {
    return MONTHS.indexOf(clean(word).slice(0, 3).toLowerCase()) + 1;
  }

  function parseDate(value) {
    var v = clean(value), m, y, mo, d;
    if ((m = v.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) {                  // 2026-11-21
      y = +m[1]; mo = +m[2]; d = +m[3];
    } else if ((m = v.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2}|\d{4})\b/))) {    // 11/21/2026
      mo = +m[1]; d = +m[2]; y = +m[3]; if (y < 100) y += 2000;
    } else if ((m = v.match(/^(?:[a-z]+,?\s+)?([a-z]{3,})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/i))) {
      mo = monthNumber(m[1]); d = +m[2]; y = +m[3];                                // Nov 21, 2026
    } else if ((m = v.match(/^(?:[a-z]+,?\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,})\.?,?\s+(\d{4})$/i))) {
      d = +m[1]; mo = monthNumber(m[2]); y = +m[3];                                // 21 Nov 2026
    } else {
      return null;
    }
    var date = new Date(y, mo - 1, d);
    if (!mo || date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
    return date;
  }

  // "7:30 PM" -> 1170 minutes. Only used to order two shows on the same day.
  function timeToMinutes(value) {
    var m = clean(value).toLowerCase().match(/(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m|p\.?m)?/);
    if (!m) return 0;
    var hour = +m[1] % 24, minutes = +(m[2] || 0);
    if (m[3] && m[3].charAt(0) === "p" && hour < 12) hour += 12;
    if (m[3] && m[3].charAt(0) === "a" && hour === 12) hour = 0;
    return hour * 60 + minutes;
  }

  function startOfToday() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function isoDate(date) {
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  // "10" -> "$10", "0" -> "Free", anything else stays as typed
  function formatPrice(value) {
    var v = clean(value);
    if (/^\d+(\.\d{1,2})?$/.test(v)) return +v === 0 ? "Free" : (SITE.currencySymbol || "$") + v;
    return v;
  }


  /* ---------------------------------------------------------------------
     4. LOADING FILES
     --------------------------------------------------------------------- */

  var fileCache = {};

  function loadFile(path) {
    if (!fileCache[path]) {
      var version = encodeURIComponent(SITE.version || String(Date.now()));
      fileCache[path] = fetch(path + "?v=" + version).then(function (response) {
        if (!response.ok) throw new Error("couldn't open " + path + " (error " + response.status + ")");
        return response.text();
      });
    }
    return fileCache[path];
  }

  var dataPromise = null;

  function getData() {
    if (dataPromise) return dataPromise;
    var problems = [];
    function loadOrNote(path) {
      return loadFile(path).catch(function (err) { problems.push(err.message); return ""; });
    }
    dataPromise = Promise.all([loadOrNote("data/bands.csv"), loadOrNote("data/shows.csv")])
      .then(function (texts) {
        var bands = buildBands(texts[0]);
        var shows = buildShows(texts[1], bands.list);
        return {
          bands: bands.list,
          shows: shows.list,
          problems: problems.concat(bands.problems, shows.problems)
        };
      });
    return dataPromise;
  }


  /* ---------------------------------------------------------------------
     5. TURNING CSV ROWS INTO BANDS AND SHOWS
     Everything handed to templates.js is already HTML-safe.
     --------------------------------------------------------------------- */

  function buildBands(text) {
    var table = readTable(text, "data/bands.csv");
    var used = {}, list = [];

    table.records.forEach(function (row) {
      var name = clean(row.name);
      if (!name) {
        table.problems.push("data/bands.csv, line " + row._line + ": this band has no name, so it was skipped.");
        return;
      }
      var id = uniqueId(clean(row.id) || slugify(name), used);

      var streaming = [];
      table.headers.forEach(function (h) {
        if (h.indexOf("stream_") === 0 && clean(row[h])) {
          var service = h.slice(7);
          streaming.push('<a class="button button-small" href="' + esc(webLink(row[h])) +
            '" target="_blank" rel="noopener">' + esc(STREAMING_NAMES[service] || titleCase(service)) + "</a>");
        }
      });

      var website = webLink(row.website);
      var insta = instagramName(row.instagram);

      list.push({
        id: esc(id),
        key: id.toLowerCase(),
        plainName: name,
        url: "band.html?id=" + encodeURIComponent(id),
        name: esc(name),
        genre: esc(row.genre),
        logo: esc(imagePath(row.logo_image, SITE.defaultBandLogo)),
        members: listHTML(splitList(row.members).map(esc)),
        website: esc(website),
        websiteLabel: esc(shortLink(website)),
        instagram: insta ? "@" + esc(insta) : "",
        instagramUrl: insta ? "https://www.instagram.com/" + encodeURIComponent(insta) + "/" : "",
        streamingLinks: streaming.join(" "),
        bio: richText(row.bio),
        photoFolder: esc("images/bands/" + id),
        upcomingShows: ""            // filled in on the band's page
      });
    });

    return { list: list, problems: table.problems };
  }

  function collectPosters(row) {
    var posters = [];
    if (clean(row.poster_image)) {
      posters.push({ n: 1, image: imagePath(row.poster_image), artist: clean(row.poster_artist) });
    }
    // poster_image_2 / poster_artist_2, poster_image_3 / poster_artist_3, ... as many as you add
    Object.keys(row).forEach(function (key) {
      var m = key.match(/^poster_(?:image_)?(\d+)$/);
      if (m && clean(row[key])) {
        posters.push({ n: +m[1], image: imagePath(row[key]), artist: clean(row["poster_artist_" + m[1]]) });
      }
    });
    return posters.sort(function (a, b) { return a.n - b.n; });
  }

  function postersHTML(posters, title) {
    return posters.map(function (p, i) {
      return '<div class="poster-box">' +
        '<a href="' + esc(p.image) + '" target="_blank" rel="noopener" title="Open full size">' +
        '<img src="' + esc(p.image) + '" alt="Poster ' + (i + 1) + " for " + esc(title) + '"></a>' +
        (p.artist ? '<p class="caption">Poster art by ' + esc(p.artist) + "</p>" : "") +
        "</div>";
    }).join("");
  }

  function buildShows(text, bands) {
    var table = readTable(text, "data/shows.csv");
    var bandLookup = {};
    bands.forEach(function (b) {
      bandLookup[b.plainName.toLowerCase()] = b;
      bandLookup[b.key] = b;
    });

    var today = startOfToday(), used = {}, list = [];

    table.records.forEach(function (row, index) {
      var date = parseDate(row.date);
      var title = clean(row.title) || "Untitled Show";
      if (!date) {
        table.problems.push("data/shows.csv, line " + row._line + ' ("' + title + '"): couldn\'t read the date "' +
          clean(row.date) + '". Write it like 2026-11-21.');
        return;
      }
      var id = uniqueId(clean(row.id) || isoDate(date) + "-" + slugify(title), used);

      var bandNames = splitList(row.bands);
      var bandLinks = bandNames.map(function (name) {
        var band = bandLookup[name.toLowerCase()];
        return band ? '<a href="' + band.url + '">' + esc(name) + "</a>" : esc(name);
      });

      var posters = collectPosters(row);
      var mainPoster = posters[0] || { image: imagePath("", SITE.defaultPoster), artist: "" };

      list.push({
        id: esc(id),
        key: id.toLowerCase(),
        url: "show.html?id=" + encodeURIComponent(id),
        plainTitle: title,
        title: esc(title),
        date: esc(date.toLocaleDateString(LANGUAGE, { weekday: "long", year: "numeric", month: "long", day: "numeric" })),
        dateShort: esc(date.toLocaleDateString(LANGUAGE, { weekday: "short", year: "numeric", month: "short", day: "numeric" })),
        month: esc(date.toLocaleDateString(LANGUAGE, { month: "short" }).toUpperCase()),
        day: String(date.getDate()),
        time: esc(row.time),
        price: esc(formatPrice(row.price)),
        location: esc(row.location),
        bands: bandLinks.join(", "),
        bandList: listHTML(bandLinks),
        bandKeys: bandNames.map(function (n) { return n.toLowerCase(); }),
        poster: esc(mainPoster.image),
        posterArtist: esc(mainPoster.artist),
        postersHTML: postersHTML(posters.length ? posters : [mainPoster], title),
        description: richText(row.description),
        ticketLink: esc(webLink(row.ticket_link)),
        isPast: date < today,
        sortDate: date.getTime(),
        sortTime: timeToMinutes(row.time),
        csvOrder: index
      });
    });

    return { list: list, problems: table.problems };
  }

  function soonestFirst(a, b) {
    return (a.sortDate - b.sortDate) || (a.sortTime - b.sortTime) || (a.csvOrder - b.csvOrder);
  }


  /* ---------------------------------------------------------------------
     6. FILLING IN THE PAGES
     Each <div data-render="NAME" data-template="TEMPLATE"> is filled by
     RENDERERS[NAME] using TEMPLATES[TEMPLATE] from templates.js.
     data-limit="3" shows only the first 3 items.
     --------------------------------------------------------------------- */

  function templateFor(el, fallback) {
    var name = el.getAttribute("data-template") || fallback;
    if (typeof TEMPLATES[name] !== "function") {
      throw new Error('There is no template called "' + name + '" in js/templates.js.');
    }
    return TEMPLATES[name];
  }

  function limitList(el, list) {
    var limit = parseInt(el.getAttribute("data-limit"), 10);
    return limit > 0 ? list.slice(0, limit) : list;
  }

  var RENDERERS = {

    "upcoming-shows": function (el, data) {
      var list = limitList(el, data.shows.filter(function (s) { return !s.isPast; }).sort(soonestFirst));
      return list.length ? list.map(templateFor(el, "upcomingShow")).join("") : TEMPLATES.noUpcomingShows();
    },

    "past-shows": function (el, data) {
      var list = data.shows.filter(function (s) { return s.isPast; }).sort(soonestFirst);
      if (SITE.pastShowsOrder === "newest_first") list.reverse();
      list = limitList(el, list);
      return list.length ? list.map(templateFor(el, "pastShow")).join("") : TEMPLATES.noPastShows();
    },

    "house-bands": function (el, data) {
      var list = limitList(el, data.bands);
      return list.length ? list.map(templateFor(el, "bandCard")).join("") : TEMPLATES.noBands();
    },

    "show-page": function (el, data) {
      var wanted = pageParam("id").toLowerCase();
      var show = data.shows.filter(function (s) { return s.key === wanted; })[0];
      if (!show) return TEMPLATES.showNotFound();
      document.title = show.plainTitle + " | " + (SITE.title || "");
      return templateFor(el, "showPage")(show);
    },

    "band-page": function (el, data) {
      var wanted = pageParam("id").toLowerCase();
      var band = data.bands.filter(function (b) { return b.key === wanted; })[0];
      if (!band) return TEMPLATES.bandNotFound();
      document.title = band.plainName + " | " + (SITE.title || "");
      var theirShows = data.shows.filter(function (s) {
        return !s.isPast && (s.bandKeys.indexOf(band.plainName.toLowerCase()) > -1 || s.bandKeys.indexOf(band.key) > -1);
      }).sort(soonestFirst);
      band.upcomingShows = theirShows.map(TEMPLATES.showTile).join("");
      return templateFor(el, "bandPage")(band);
    }
  };

  function problemsHTML(problems) {
    if (!problems.length) return "";
    return '<div class="notice notice-warning"><b>Heads up:</b> some of the site\'s data couldn\'t be read.' +
      listHTML(problems.map(esc)) + "</div>";
  }

  function renderAll() {
    var targets = document.querySelectorAll("[data-render]");
    if (!targets.length) return;
    targets.forEach(function (el) { el.innerHTML = '<p class="muted">Loading&hellip;</p>'; });

    getData().then(function (data) {
      var warned = false;
      targets.forEach(function (el) {
        var name = el.getAttribute("data-render");
        try {
          if (!RENDERERS[name]) throw new Error('Unknown data-render="' + name + '".');
          var html = RENDERERS[name](el, data);
          if (!warned && data.problems.length) { html += problemsHTML(data.problems); warned = true; }
          el.innerHTML = html;
          el.classList.add("rendered", "rendered-" + (el.getAttribute("data-template") || name));
          startCarousels(el);
        } catch (err) {
          console.error(err);
          el.innerHTML = '<div class="notice notice-warning">' + esc(err.message) + "</div>";
        }
      });
    }).catch(function (err) {
      console.error(err);
      targets.forEach(function (el) {
        el.innerHTML = '<div class="notice notice-warning">Sorry, this list couldn\'t load. ' + esc(err.message) + "</div>";
      });
    });
  }


  /* ---------------------------------------------------------------------
     7. PHOTO CAROUSELS
     <div class="carousel" data-folder="images/carousel/home"></div>
     plays every image directly inside that folder, in filename order.
     The list of images comes from data/images.json, which is rebuilt
     by GitHub every time the site changes.
     --------------------------------------------------------------------- */

  var imageListPromise = null;

  function getImageList() {
    if (!imageListPromise) {
      imageListPromise = loadFile("data/images.json")
        .then(function (text) { return JSON.parse(text); })
        .catch(function (err) { console.warn("Carousel photos unavailable:", err.message); return []; });
    }
    return imageListPromise;
  }

  function startCarousels(root) {
    var boxes = Array.prototype.slice.call((root || document).querySelectorAll(".carousel:not([data-started])"));
    if (!boxes.length) return;
    boxes.forEach(function (box) { box.setAttribute("data-started", "yes"); });

    getImageList().then(function (allImages) {
      boxes.forEach(function (box) {
        var folder = clean(box.getAttribute("data-folder")).replace(/^\.?\/+|\/+$/g, "").toLowerCase() + "/";
        var photos = allImages
          .map(function (p) { return String(p).replace(/^\/+/, ""); })
          .filter(function (p) {
            var lower = p.toLowerCase();
            return lower.indexOf(folder) === 0 && lower.slice(folder.length).indexOf("/") === -1;
          })
          .sort(naturalCompare);
        buildCarousel(box, photos);
      });
    });
  }

  function buildCarousel(box, photos) {
    if (!photos.length) { box.style.display = "none"; return; }

    var html = '<div class="carousel-frame">';
    photos.forEach(function (src, i) {
      html += '<img src="' + esc(src) + '" alt="" class="slide' + (i === 0 ? " active" : "") + '">';
    });
    html += "</div>";
    if (photos.length > 1) {
      html += '<div class="carousel-controls">' +
                '<button type="button" class="carousel-prev">&laquo; Prev</button> ' +
                '<span class="carousel-count" aria-live="polite">' + COUNTER_WORD + " 1 of " + photos.length + "</span> " +
                '<button type="button" class="carousel-next">Next &raquo;</button>' +
              "</div>";
    }
    box.innerHTML = html;
    if (photos.length < 2) return;

    var slides = box.querySelectorAll(".slide");
    var count = box.querySelector(".carousel-count");
    var current = 0, timer = null;
    var seconds = parseFloat(box.getAttribute("data-seconds")) || parseFloat(SITE.carouselSeconds) || 5;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function show(n) {
      slides[current].classList.remove("active");
      current = (n + slides.length) % slides.length;
      slides[current].classList.add("active");
      count.textContent = COUNTER_WORD + " " + (current + 1) + " of " + slides.length;
    }
    function play() { if (!reduceMotion) { stop(); timer = setInterval(function () { show(current + 1); }, seconds * 1000); } }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    box.querySelector(".carousel-prev").addEventListener("click", function () { show(current - 1); play(); });
    box.querySelector(".carousel-next").addEventListener("click", function () { show(current + 1); play(); });
    box.addEventListener("mouseenter", stop);
    box.addEventListener("mouseleave", play);
    box.addEventListener("focusin", stop);
    box.addEventListener("focusout", play);
    play();
  }


  /* ---------------------------------------------------------------------
     8. DROP-DOWN MENU  (closes when you click elsewhere or press Esc)
     --------------------------------------------------------------------- */

  function setupMenu() {
    var menu = document.getElementById("site-menu");
    if (!menu) return;
    document.addEventListener("click", function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    });
  }


  /* ---------------------------------------------------------------------
     9. CONTACT + MAILING LIST FORMS  (sent through Web3Forms)
     --------------------------------------------------------------------- */

  function setupForms() {
    document.querySelectorAll("form[data-form]").forEach(function (form) {
      var status = form.querySelector(".form-status");
      var key = form.querySelector('input[name="access_key"]');
      var redirect = form.querySelector('input[name="redirect"]');
      var button = form.querySelector('[type="submit"]');
      var ready = key && clean(key.value);

      function say(message, kind) {
        if (!status) return;
        status.textContent = message;
        status.className = "form-status" + (kind ? " " + kind : "");
      }

      // Without JavaScript the form goes to Web3Forms, then to thanks.html.
      if (redirect) redirect.value = new URL("thanks.html", document.baseURI).href;

      if (!ready) say("Not connected yet: add your Web3Forms access key in _config.yml.", "error");

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!ready) { say("Not connected yet: add your Web3Forms access key in _config.yml.", "error"); return; }

        var fields = Object.fromEntries(new FormData(form));
        delete fields.redirect;
        if (button) button.disabled = true;
        say("Sending…");

        fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(fields)
        })
          .then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (json) {
              if (response.ok && json.success !== false) {
                form.reset();
                say(form.getAttribute("data-success") || "Thanks! It's on its way.", "success");
              } else {
                say("Sorry, that didn't go through" + (json.message ? " (" + json.message + ")" : "") +
                    ". Please try again or email us.", "error");
              }
            });
          })
          .catch(function () { say("Sorry, that didn't send. Check your connection and try again, or email us.", "error"); })
          .then(function () { if (button) button.disabled = false; });
      });
    });
  }


  /* ---------------------------------------------------------------------
     10. START EVERYTHING
     --------------------------------------------------------------------- */

  function start() {
    setupMenu();
    setupForms();
    startCarousels(document);
    renderAll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  // Exposed for testing in the browser console. Not used by the pages.
  window.SITE_ENGINE = { parseCSV: parseCSV, parseDate: parseDate, getData: getData };
})();
