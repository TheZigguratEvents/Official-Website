/* =========================================================================
   TEMPLATES.JS  —  how each show and band LOOKS
   -------------------------------------------------------------------------
   Each template below is plain HTML inside backticks ( ` ).
   Anything written like  ${s.title}  is replaced with a value from the
   CSV files. Edit the HTML freely; just keep the backticks and the ${...}
   parts intact.

   when(value, `html`)   shows the html ONLY if value isn't blank.
                         Used so empty CSV cells don't leave empty rows.

   VALUES YOU CAN USE FOR A SHOW  (s.____)
     s.url             link to the show's own page
     s.title           show title
     s.date            Saturday, November 21, 2026
     s.dateShort       Sat, Nov 21, 2026
     s.month / s.day   NOV / 21   (for calendar-style date badges)
     s.time            exactly as typed in the CSV
     s.price           price ("$10", "Free", ...)
     s.location        location
     s.bands           bands, comma-separated (house bands are links)
     s.bandList        bands as a bulleted list
     s.poster          main poster image
     s.posterArtist    main poster artist
     s.postersHTML     every poster with its artist credit
     s.description     description (only used on the show's own page)
     s.ticketLink      ticket link (blank if none)

   VALUES YOU CAN USE FOR A BAND  (b.____)
     b.url             link to the band's own page
     b.id              short id (also the photo folder name)
     b.name, b.genre
     b.logo            logo image
     b.members         members as a bulleted list
     b.website         website address;  b.websiteLabel = short version
     b.instagram       @username;        b.instagramUrl = link
     b.streamingLinks  buttons for every streaming link filled in
     b.bio             biography
     b.photoFolder     the band's photo folder (for the slideshow)
     b.upcomingShows   that band's upcoming shows (as small tiles)
   ========================================================================= */

window.TEMPLATES = {

  /* ---------------------------------------------------------------
     One show on the UPCOMING SHOWS page
     --------------------------------------------------------------- */
  upcomingShow: (s) => `
    <div class="show-row">
      <a href="${s.url}" class="show-poster"><img src="${s.poster}" alt="Poster for ${s.title}"></a>
      <div class="show-info">
        <h3 class="show-title"><a href="${s.url}">${s.title}</a></h3>
        <table class="facts">
          <tr><th>Date</th><td>${s.date}</td></tr>
          ${when(s.time,     `<tr><th>Time</th><td>${s.time}</td></tr>`)}
          ${when(s.location, `<tr><th>Location</th><td>${s.location}</td></tr>`)}
          ${when(s.price,    `<tr><th>Price</th><td>${s.price}</td></tr>`)}
          ${when(s.bands,    `<tr><th>Bands</th><td>${s.bands}</td></tr>`)}
        </table>
        <p><a href="${s.url}" class="button">Show details &raquo;</a></p>
      </div>
      <div class="clear"></div>
    </div>`,

  /* ---------------------------------------------------------------
     One show on the PAST SHOWS page
     --------------------------------------------------------------- */
  pastShow: (s) => `
    <div class="show-row past">
      <a href="${s.url}" class="show-poster"><img src="${s.poster}" alt="Poster for ${s.title}"></a>
      <div class="show-info">
        <h3 class="show-title"><a href="${s.url}">${s.title}</a></h3>
        <table class="facts">
          <tr><th>Date</th><td>${s.date}</td></tr>
          ${when(s.location, `<tr><th>Location</th><td>${s.location}</td></tr>`)}
          ${when(s.bands,    `<tr><th>Bands</th><td>${s.bands}</td></tr>`)}
        </table>
      </div>
      <div class="clear"></div>
    </div>`,

  /* ---------------------------------------------------------------
     Small show tile (MAIN PAGE and band pages).
     The whole tile is one link to the show's page.
     --------------------------------------------------------------- */
  showTile: (s) => `
    <a href="${s.url}" class="show-tile">
      <img src="${s.poster}" alt="Poster for ${s.title}">
      <span class="tile-title">${s.title}</span>
      <span class="tile-date">${s.dateShort}</span>
      ${when(s.time, `<span class="tile-time">${s.time}</span>`)}
      ${when(s.location, `<span class="tile-location">${s.location}</span>`)}
    </a>`,

  /* ---------------------------------------------------------------
     A SHOW'S OWN PAGE (show.html?id=...)
     --------------------------------------------------------------- */
  showPage: (s) => `
    <p class="back-link"><a href="${s.isPast ? "past-shows.html" : "upcoming-shows.html"}">&laquo; ${s.isPast ? "All past shows" : "All upcoming shows"}</a></p>

    <h1 class="page-title">${s.title}</h1>
    ${s.isPast ? `<p class="label">This show has already happened</p>` : ""}

    <div class="columns">
      <div class="column-main">
        <table class="facts big">
          <tr><th>Date</th><td>${s.date}</td></tr>
          ${when(s.time,     `<tr><th>Time</th><td>${s.time}</td></tr>`)}
          ${when(s.location, `<tr><th>Location</th><td>${s.location}</td></tr>`)}
          ${when(s.price,    `<tr><th>Price</th><td>${s.price}</td></tr>`)}
        </table>

        ${when(s.ticketLink && !s.isPast, `<p><a href="${s.ticketLink}" class="button button-primary" target="_blank" rel="noopener">Get tickets &raquo;</a></p>`)}

        ${when(s.bandList,    `<h2>Lineup</h2>${s.bandList}`)}
        ${when(s.description, `<h2>About This Show</h2><div class="description">${s.description}</div>`)}
      </div>

      <div class="column-side">
        ${s.postersHTML}
      </div>
    </div>`,

  /* ---------------------------------------------------------------
     One band on the HOUSE BANDS page
     --------------------------------------------------------------- */
  bandCard: (b) => `
    <a href="${b.url}" class="band-card">
      <img src="${b.logo}" alt="${b.name} logo">
      <span class="band-name">${b.name}</span>
      ${when(b.genre, `<span class="band-genre">${b.genre}</span>`)}
    </a>`,

  /* ---------------------------------------------------------------
     A BAND'S OWN PAGE (band.html?id=...)
     The slideshow plays every photo in images/bands/BAND-ID/
     --------------------------------------------------------------- */
  bandPage: (b) => `
    <p class="back-link"><a href="house-bands.html">&laquo; All house bands</a></p>

    <div class="band-header">
      <img src="${b.logo}" alt="${b.name} logo" class="band-logo">
      <div>
        <h1 class="page-title">${b.name}</h1>
        ${when(b.genre, `<p class="band-genre">${b.genre}</p>`)}
      </div>
      <div class="clear"></div>
    </div>

    <div class="carousel" data-folder="${b.photoFolder}"></div>

    <div class="columns">
      <div class="column-main">
        ${when(b.bio, `<h2>About the Band</h2><div class="description">${b.bio}</div>`)}
        ${when(b.upcomingShows, `<h2>Upcoming Shows</h2><div class="tile-grid">${b.upcomingShows}</div>`)}
      </div>

      <div class="column-side">
        <div class="sidebar-box">
          ${when(b.members, `<h3>Members</h3>${b.members}`)}
          ${when(b.website, `<h3>Website</h3><p><a href="${b.website}" target="_blank" rel="noopener">${b.websiteLabel}</a></p>`)}
          ${when(b.instagram, `<h3>Instagram</h3><p><a href="${b.instagramUrl}" target="_blank" rel="noopener">${b.instagram}</a></p>`)}
          ${when(b.streamingLinks, `<h3>Listen</h3><p class="streaming">${b.streamingLinks}</p>`)}
        </div>
      </div>
    </div>`,

  /* ---------------------------------------------------------------
     Messages shown when a list is empty or a page isn't found
     --------------------------------------------------------------- */
  noUpcomingShows: () => `<p class="notice">No upcoming shows right now. Check back soon, or join our <a href="contact.html">mailing list</a>!</p>`,
  noPastShows:     () => `<p class="notice">No past shows yet.</p>`,
  noBands:         () => `<p class="notice">No house bands listed yet.</p>`,
  showNotFound:    () => `<h1 class="page-title">Show Not Found</h1><p>We couldn't find that show. <a href="upcoming-shows.html">See all upcoming shows &raquo;</a></p>`,
  bandNotFound:    () => `<h1 class="page-title">Band Not Found</h1><p>We couldn't find that band. <a href="house-bands.html">See all house bands &raquo;</a></p>`

};

/* Helper used above: returns html only when value isn't blank. */
function when(value, html) {
  return value ? html : "";
}
