# Your Show Co. — Website Guide

This is everything you need to set up and run the site. Anything marked
**REPLACE** or **SAMPLE** in the files is placeholder content.

---

## Part 1: First-time setup (about 20 minutes)

### 1. Fill in your settings first
Open **`_config.yml`** and edit the values: business name, domain, email,
Instagram username, Google interest-form link. Each line is labeled.

Open **`CNAME`** and replace `www.your-domain.com` with your domain
(just the domain, no `https://`).

Replace these two images with your own, keeping the same file names:

| File | What it is |
|---|---|
| `images/logo/logo.png` | Logo in the top-left corner (a wide PNG with a transparent background looks best on the dark header) |
| `images/logo/favicon.png` | Icon in the browser tab (square, at least 32×32) |

### 2. Put the site on GitHub
1. Sign in at github.com and click **+ → New repository**.
2. Name it anything (e.g. `website`), set it to **Public**, and click **Create repository**.
3. Click **uploading an existing file**, then drag **everything inside this folder**
   (not the folder itself) into the upload box. Click **Commit changes**.
4. Go to **Settings → Pages**. Under *Build and deployment*, choose
   **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.

GitHub builds the site in a minute or two. Because of the `CNAME` file, it sends visitors
to your domain, so the site shows up there once step 3 is done.

### 3. Connect your domain
1. In **Settings → Pages → Custom domain**, your domain should already be filled in from the
   `CNAME` file. If it isn't, type it (e.g. `www.yourdomain.com`) and click **Save**.
2. At the company where you bought the domain, open its **DNS settings** and add:

   | Type | Name / Host | Value |
   |---|---|---|
   | CNAME | `www` | `YOUR-USERNAME.github.io` |
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |

   The A records make `yourdomain.com` (without www) work too. Delete any old
   "parking page" A records first.
3. DNS can take up to a day. Once GitHub shows a green check, tick **Enforce HTTPS**.

GitHub recommends also verifying your domain (your account **Settings → Pages → Add a domain**)
so no one else can use it. Their help page, "Managing a custom domain for your GitHub Pages
site," has screenshots of every step.

### 4. Turn on the contact form and mailing list (free)
1. Go to **web3forms.com**, enter the email that should receive messages, and they'll email you an **access key**.
2. Paste it into `_config.yml` on the `web3forms_access_key:` line.

Both forms on the Contact page now email you. Mailing-list signups arrive with the subject
"New mailing list signup", so you can filter them into a folder. The free plan
covers 250 submissions a month.

---

## Part 2: Everyday editing

You can edit any file right on github.com: open it, click the **pencil icon**, make changes,
then **Commit changes**. The site updates in 1–2 minutes. (To add images, open a folder
and use **Add file → Upload files**.)

### Add, change, or remove a show → `data/shows.csv`
One row per show. Open it in Excel, Google Sheets or Numbers and save as **CSV**,
or edit the text directly on GitHub.

| Column | What to put | Example |
|---|---|---|
| `date` | The show date | `2026-12-12` (or `12/12/2026`) |
| `time` | Written as you want it shown | `8:00 PM` |
| `title` | Show name | `Winter Warmer` |
| `location` | Venue/address | `The Backyard Stage, 123 Example St` |
| `price` | Anything, or a plain number | `$10 adv / $15 door`, `Free`, `10` → `$10`, `0` → `Free` |
| `bands` | Band names separated by **semicolons** | `The Example Band; Guest Band` |
| `poster_image` | Path to the poster | `images/posters/winter.jpg` |
| `poster_artist` | Who made it | `Jane Doe` |
| `poster_image_2`, `poster_artist_2`, `poster_image_3`, `poster_artist_3` | Extra posters (optional) | |
| `ticket_link` | Ticket page (optional) | `https://...` |
| `description` | Only shown on the show's own page | Any length |

**What happens automatically:**
- Shows dated today or later appear on the **Main Page** and **Upcoming Shows**, soonest first.
- The day after a show, it moves to **Past Shows** by itself. No editing needed.
- Every show gets its own page.
- Band names that match a house band become links to that band's page.

**Tips:**
- Put poster images in `images/posters/`. Blank poster = the "coming soon" poster.
- Want a 4th poster? Add columns named `poster_image_4` and `poster_artist_4`.
- In the description, a blank line starts a new paragraph. Simple HTML like `<b>bold</b>` or links works.
- When editing the CSV as text, put quotes around any cell that has a comma or line break in it.
- If a row can't be read (usually a date typo), a red "Heads up" box on the page says which line to fix.

### Add, change, or remove a house band → `data/bands.csv`

| Column | What to put |
|---|---|
| `id` | Short name, no spaces, e.g. `night-owls`. Used in the web address and the photo folder name. |
| `name` | Band name as displayed |
| `genre` | Music genre |
| `members` | Separated by semicolons: `Ana - vocals; Ben - drums` |
| `website` | Full link |
| `instagram` | Username (with or without @) |
| `stream_spotify`, `stream_apple_music`, `stream_youtube`, `stream_bandcamp`, `stream_soundcloud`, `stream_amazon_music`, `stream_tidal` | Links to their pages. Leave blank to hide the button. |
| `logo_image` | e.g. `images/band-logos/night-owls.png` |
| `bio` | Biography. Blank line = new paragraph. |

- Bands appear in the order of the rows.
- **Band photos:** make a folder `images/bands/ID/` (using the band's `id`) and put photos in it.
  They play in a slideshow on the band's page. No photos = no slideshow.
- Need another streaming service? Add a column named `stream_` plus its name, e.g. `stream_deezer`.
- A band's page automatically lists its upcoming shows.

### Change slideshow photos
Each slideshow plays every image in its folder, in filename order (`01.jpg`, `02.jpg`, ...):

| Slideshow | Folder |
|---|---|
| Main Page | `images/carousel/home/` |
| About Us | `images/carousel/about/` |
| Each band | `images/bands/BAND-ID/` |

Add or delete files. That's it. Wide photos (about 2:1) fit best.

### Write a blog post → `_posts/`
1. Copy `_templates/new-blog-post.md` into the `_posts` folder.
2. Name it `YEAR-MONTH-DAY-short-title.md`, e.g. `2026-12-01-new-shows.md`.
3. Fill in the title and `date: 2026-12-01 18:45` (24-hour time, no seconds). That's the upload time shown on the post.
4. Write the post underneath. Instructions for bold, links and photos are inside the template.

The newest post appears in full on the Blog page; all posts are listed below it, each with its own page.

### Edit page text
| Page | File |
|---|---|
| Main Page (title, intro) | `index.html` |
| About Us | `about.html` (paragraphs and photo slots are labeled) |
| Contact | `contact.html` (email/Instagram/form link come from `_config.yml`) |
| Intro lines on other pages | `house-bands.html`, `upcoming-shows.html`, `past-shows.html` |

### Add a new page
1. Copy `_templates/new-page.html` into the main folder and rename it (e.g. `merch.html`).
2. Edit `title`, `nav_order` and `description` at the top.

It appears in the drop-down menu and the Site Directory automatically, with the logo,
menu and styles. The template lists ready-made pieces you can paste in (slideshow, show lists, band list).
Set `nav: false` for a page you don't want in the menu.

---

## Part 3: Changing the look

| What | Where |
|---|---|
| Colors and fonts | Top of `css/site.css` (the "COLORS AND FONTS" section) |
| Any other style | `css/site.css`, organized by page section |
| The HTML for show listings, band cards, show pages, band pages | `js/templates.js` |
| Header (logo + menu) | `_includes/header.html` |
| Footer | `_includes/footer.html` |
| Overall page frame | `_layouts/default.html` |

In `js/templates.js`, each template is plain HTML. Values like `${s.title}` are filled in from
the CSV; a list of every available value is at the top of the file.

---

## Map of the files

```
_config.yml          Site settings (start here)
CNAME                Your domain
index.html           Main Page
house-bands.html     House Bands
upcoming-shows.html  Upcoming Shows
past-shows.html      Past Shows
about.html           About Us
contact.html         Contact
blog.html            Blog
show.html            Shows every show's own page (don't rename)
band.html            Shows every band's own page (don't rename)
thanks.html, 404.html
data/
  shows.csv          ← your shows
  bands.csv          ← your house bands
  images.json        Automatic list of images (don't edit)
_posts/              ← blog posts
_templates/          Copy-and-paste starters for new pages and posts
_layouts/, _includes/  Shared page parts (header, footer, slideshow)
css/site.css         Styles
js/templates.js      HTML for shows and bands
js/site.js           The engine (normally no need to touch)
images/              All pictures
```

---

## Good to know
- **Updates take 1–2 minutes** after you commit. If you don't see a change, wait a bit and refresh. Visitors' browsers can hold the old version for up to 10 minutes.
- **Check the build:** the **Actions** tab on GitHub shows each update. A red ✗ means something in a file broke the build (often a missing quote in `_config.yml` or a blog post's top section); click it to see which file.
- **File names:** use lowercase letters, numbers and dashes, and no spaces (`fall-show.jpg`, not `Fall Show.JPG`). Web addresses are case-sensitive.
- **Image sizes:** keep photos under about 1 MB (2000 px wide is plenty) so pages load quickly on phones.
- **Show dates** are checked against the visitor's own date, so shows move to Past Shows on time without you updating anything.
- **Previewing locally (optional):** the site is built by GitHub with Jekyll. Opening the HTML files straight from your computer won't work. Either preview on GitHub, or install Jekyll and run `jekyll serve`.
