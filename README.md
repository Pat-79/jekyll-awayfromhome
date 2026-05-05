---
sitemap: false
---
# jekyll-awayfromhome

A modern, responsive Jekyll theme for personal websites and travel blogs, built for GitHub Pages. It features a full-screen video landing hero (HLS stream or YouTube), client-side full-text search, light/dark/auto theme switching, SEO meta tags, and a mobile-first layout — all without requiring a build pipeline or server-side plugins beyond what GitHub Pages already provides.

## Demo website

A demo website is available at [demo.awayfromhome.nl](https://demo.awayfromhome.nl), built from the [Pat-79/jekyll-awayfromhome-sample](https://github.com/Pat-79/jekyll-awayfromhome-sample) repository on GitHub.

---

## Features

- **Full-screen landing hero** — HLS live/VOD stream, YouTube embed, or static image as the homepage background, with chapter-weighted random seek
- **Inline video widget** — lightweight HLS, YouTube, and Vimeo embeds with shared options and lazy loading
- **Image gallery widget** — responsive photo grid with lightbox and a carousel mode with thumbnail strip, autoplay, and viewport-aware pause
- **Archive page + sidebar archive modes** — querystring-driven archive filtering with year/month/day and configurable drawer archive views
- **Light / Dark / Auto theme** — persistent user preference stored in `localStorage`, no flash on load
- **Client-side search** — full-text search engine with a JSON index built at compile time; no external service required
- **SEO ready** — Open Graph, Twitter Card, and JSON-LD structured data included on every page
- **Mobile-first responsive layout** — single-column on phones, expanding to a sidebar+content layout on wider screens
- **Accessible** — semantic HTML5, ARIA labels, keyboard-navigable drawer and search
- **GitHub Pages compatible** — works with Jekyll 3.10.0 and the `github-pages ~> 232` gem; no unsupported plugins
- **No build pipeline** — plain ES6 modules and SCSS `@import`; everything compiles inside Jekyll

---

## Requirements

| Dependency | Minimum version |
|---|---|
| Ruby | 2.6 |
| Jekyll | 3.10.0 |
| Bundler | 2.0 |
| github-pages gem | ~> 232 |

No Node.js, npm, or webpack required.

---

## Browser Support

| Browser | Supported |
|---|---|
| Chrome / Edge | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | 14+ |
| iOS Safari | 14+ |

---

## Installation

### 1. Add the theme to your site's `_config.yml`

```yaml
remote_theme: Pat-79/jekyll-awayfromhome

plugins:
  - jekyll-remote-theme
  - jekyll-feed
```

> Theme repository: https://github.com/Pat-79/jekyll-awayfromhome.git

### 2. Configure your site's `Gemfile`

```ruby
source "https://rubygems.org"

gem "github-pages", "~> 232", group: :jekyll_plugins

group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-remote-theme"
end
```

### 3. Install and preview locally

```bash
bundle install
bundle exec jekyll serve
```

Open `http://localhost:4000` in your browser.

### 4. Deploy to GitHub Pages

Push your site repository to GitHub. In **Settings → Pages**, set the source branch to `main` and the folder to `/` (root). GitHub will build and publish the site automatically within about a minute.

---

## Configuration

All theme settings live in your site's `_config.yml`.

```yaml
# ── Site identity ──────────────────────────────────────────────────────────────
title: My Site
description: A short description shown in search results and the RSS feed.
url: "https://yourusername.github.io"
baseurl: ""           # Leave empty for user/org sites. Use /repo-name for project sites.
email: you@example.com

# ── Brand ──────────────────────────────────────────────────────────────────────
brand:
  title: My Site Name           # Shown in the header and drawer
  logo: /assets/images/logo-mark.svg  # Path to your SVG or PNG logo

# ── Navigation ─────────────────────────────────────────────────────────────────
navigation:
  - title: Home
    url: /
  - title: About
    url: /about/
  - title: Blog
    url: /blog/
  - title: Search
    url: /search/

# ── Social links ───────────────────────────────────────────────────────────────
social_links:
  - platform: x
    url: https://x.com/yourhandle
  - platform: instagram
    url: https://www.instagram.com/yourhandle
  - platform: youtube
    url: https://www.youtube.com/yourchannel
  - platform: github
    url: https://github.com/yourusername
  - platform: linkedin
    url: https://www.linkedin.com/in/yourprofile
  - platform: tiktok
    url: https://www.tiktok.com/@yourhandle
  - platform: email
    url: mailto:you@example.com
  - platform: phone
    url: tel:+1234567890

# ── Post defaults ──────────────────────────────────────────────────────────────
default_post_image: /assets/images/default-hero.svg   # Fallback hero for posts without an image

# ── Home landing hero ──────────────────────────────────────────────────────────
home_landing:
  hls_url: https://example.com/streams/playlist.m3u8  # HLS stream (takes priority)
  youtube_id: dQw4w9WgXcQ                             # YouTube video ID (fallback)
  image: /assets/images/default-hero.svg              # Static image (last fallback)
  latest_posts_limit: 6                               # Posts shown in the homepage grid

# ── Map widget defaults ────────────────────────────────────────────────────────
map_widget:
  tile_url: https://{s}.openstreetmap.org/{z}/{x}/{y}.png
  tile_attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  tile_subdomains: tile
  tile_max_zoom: 19
  locked: false
  scroll_wheel_zoom: false
  dragging:
  touch_zoom:
  double_click_zoom:
  box_zoom:
  keyboard:
  tile_referrer_policy: strict-origin-when-cross-origin
  tile_cross_origin:
  max_width:                                          # Optional max width constraint (e.g., "600px", "80%")
  max_height:                                         # Optional max height constraint (e.g., "400px")

# ── Video widget defaults ──────────────────────────────────────────────────────
video_widget:
  width:                                              # Optional width constraint (e.g., "640px", "90%")
  height:                                             # Optional height constraint (e.g., "360px")
  max_width:                                          # Optional max width constraint (e.g., "800px")
  max_height:                                         # Optional max height constraint (e.g., "600px")
  aspect_ratio: 16:9
  bare: false
  autoplay: false
  muted: false
  loop: false
  controls: true
  playsinline: true
  preload: metadata
  lazy: true
  privacy_mode: true
  referrer_policy: strict-origin-when-cross-origin
  poster:

# ── Gallery widget defaults ────────────────────────────────────────────────────
gallery_widget:
  max_width: 900px                                    # Optional max width constraint (any CSS unit, e.g. "900px", "80%", "70vw")
  max_height:                                         # Optional max height constraint (e.g., "70vh", "600px")
  min_width:                                          # Optional min width constraint
  min_height:                                         # Optional min height constraint
  show_image_caption: false                           # Show image title in lightbox
  show_image_description: false                       # Show image description in lightbox
  carousel_autoplay: 6                                # Autoplay interval in seconds for carousel mode (0 = disabled)

# ── Sidebar archive menu ──────────────────────────────────────────────────────
sidebar:
  archive:
    enabled: true                                     # Show or hide the ARCHIVE section in the drawer
    mode: year-month-tree                             # 'year' | 'month-year' | 'year-month-tree'
    show_post_counts: false                           # Show post counts next to year/month labels

# ── Plugins ────────────────────────────────────────────────────────────────────
plugins:
  - jekyll-remote-theme
  - jekyll-feed
```

You can override any map setting per include call, and include-level values always win over `map_widget` defaults.

### Author Profiles in Data Files

Authors are best maintained in a dedicated data file instead of `_config.yml`.

Create `_data/authors.yml`:

```yaml
- name: Patrick
  avatar: /assets/images/avatar.svg
  bio:
    default: Exploring local cities, scenic drives, and practical family travel routes.
    en: Exploring local cities, scenic drives, and practical family travel routes.
    nl: Lokale stedentrips, mooie autoroutes en praktische familievakanties.
  location:
    default: The Netherlands
    en: The Netherlands
    nl: Nederland
  page_url: /author-patrick/   # Optional: user-created page, not provided by theme
  social_links:                # Optional
    - platform: github
      url: https://github.com/yourusername
    - platform: instagram
      url: https://instagram.com/yourhandle
    - platform: website
      url: https://example.com
```

Then use matching names in front matter:

```yaml
author: Patrick
```

Notes:

- `page_url` (or `page`) is optional. When set, the author name in the author card links to that page.
- Author pages are intentionally user content. The theme does not generate or ship author pages.
- `social_links` is optional and supports the same platform icon names as the global social links include.
- `bio` and `location` can be either a plain string or a language map using `default`, `en`, `nl`, etc.
- Language fallback behavior for `bio` and `location`: current page language value first, then `default`, then legacy plain-string value.
- Backward compatibility is kept: if `_data/authors.yml` is missing, the theme still falls back to existing `site.author`/`site.authors` values.

```liquid
{% include map-widget.html
  center="46.0569,14.5058"
  tile_url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
  tile_attribution='&copy; OpenStreetMap contributors, OSM DE'
  tile_referrer_policy="strict-origin-when-cross-origin"
%}
```

To render only the map itself with no widget padding, border, shadow, or header wrapper, add `bare="true"`:

```liquid
{% include map-widget.html
  center="46.0569,14.5058"
  width="320px"
  height="220px"
  bare="true"
%}
```

To lock the map against drag, touch, double-click, box-zoom, and keyboard interactions while still keeping Leaflet controls visible, add `locked="true"`:

```liquid
{% include map-widget.html
  center="46.0569,14.5058"
  height="220px"
  locked="true"
%}
```

You can also override individual interaction modes per widget or in `map_widget`, using `scroll_wheel_zoom`, `dragging`, `touch_zoom`, `double_click_zoom`, `box_zoom`, and `keyboard`.

To constrain the map widget's maximum dimensions, use `max_width` and `max_height` (supports `px`, `%`, `rem`, `em`, `vw`, `vh`, `ch`, and `calc()` expressions):

```liquid
{% include map-widget.html
  center="46.0569,14.5058"
  max_width="800px"
  max_height="600px"
%}
```

The theme also includes a lightweight `video-widget.html` include for HLS, YouTube, and Vimeo. The widget uses native HTML5 video for HLS and only loads `hls.js` on pages that contain an HLS widget and need it.

```liquid
{% include video-widget.html
  provider="hls"
  src="/assets/streams/sample/sample_stream.m3u8"
  poster="/assets/images/default-hero.svg"
  width="100%"
  aspect_ratio="16:9"
  autoplay="false"
  muted="false"
  loop="false"
  controls="true"
%}
```

```liquid
{% include video-widget.html
  provider="youtube"
  youtube_id="dQw4w9WgXcQ"
  aspect_ratio="16:9"
  controls="true"
  privacy_mode="true"
%}
```

```liquid
{% include video-widget.html
  provider="vimeo"
  vimeo_id="76979871"
  aspect_ratio="16:9"
  controls="true"
%}
```

Supported widget options are `provider`, `src`, `url`, `youtube_id`, `vimeo_id`, `title`, `description`, `player_title`, `poster`, `width`, `height`, `max_width`, `max_height`, `aspect_ratio`, `bare`, `autoplay`, `muted`, `loop`, `controls`, `playsinline`, `preload`, `lazy`, `privacy_mode`, and `referrer_policy`. Include-level values override `video_widget` defaults.

### Gallery Widget (`gallery-widget.html`)

The gallery widget renders a responsive photo gallery from a folder of images. Two modes are available: `grid` (default masonry-style grid with lightbox) and `carousel` (stage + thumbnail strip with autoplay).

#### Grid mode

Point `src` at the image directory:

```liquid
{% include gallery-widget.html
  src="/assets/images/posts/2026-04-19-my-post/"
%}
```

A lightbox opens when a grid image is clicked. Gallery titles render above the frame, gallery descriptions render below the frame, and per-image titles and descriptions render only when metadata exists. When `show_caption` and `show_description` are enabled, that per-image metadata is also shown in the lightbox.

#### Carousel mode

```liquid
{% include gallery-widget.html
  src="/assets/images/posts/2026-04-19-my-post/"
  mode="carousel"
  autoplay_seconds="6"
  show_caption="false"
  align="center"
  max_width="900px"
%}
```

With `mode="carousel"`, the widget renders a large stage image and a scrollable thumbnail strip below it. Gallery titles stay above the frame, gallery descriptions stay below it, and per-image titles and descriptions sit inside the stage frame at the bottom when metadata exists. Autoplay cycles through slides automatically and pauses on hover, focus, or when the carousel scrolls out of the viewport.

#### Sizing

`max_width`, `min_width`, `max_height`, and `min_height` all accept any valid CSS length — `px`, `%`, `rem`, `em`, `vw`, `vh`, `ch`, `calc(...)`, `clamp(...)`, etc. Plain numbers without a unit are treated as `px`.

```liquid
{% include gallery-widget.html
  src="/assets/images/posts/2026-04-19-my-post/"
  mode="carousel"
  max_width="70vw"
  max_height="70vh"
  align="center"
%}
```

#### Responsive image variants

When image variants exist in subdirectories (`thumbs/`, `small/`, `medium/`, `large/`, `full/`), the widget uses them automatically for thumbnails and the lightbox/stage, loading the right size for the display context.

#### Optional `gallery.json` metadata

Place a `gallery.json` file in the same folder as your images to override titles, descriptions, and alt text per image:

```json
{
  "name": "My Trip",
  "description": "A few highlights from the journey.",
  "images": [
    { "file": "photo-01.jpg", "title": "Arrival", "description": "Landing at dusk.", "alt": "Airplane view of city lights" },
    { "file": "photo-02.jpg", "title": "Old Town" }
  ]
}
```

The widget discovers `gallery.json` automatically when it sits alongside the images. Supply a custom path with `json="/path/to/gallery.json"`.

#### All parameters

| Parameter | Default | Description |
|---|---|---|
| `src` | *(required)* | Directory path or single image path |
| `mode` | `grid` | `grid` or `carousel` |
| `title` | — | Gallery heading |
| `description` | — | Gallery description shown below the frame |
| `align` | — | `left`, `center`, or `right` |
| `max_width` | `site.gallery_widget.max_width` | Max width — any CSS unit |
| `min_width` | `site.gallery_widget.min_width` | Min width — any CSS unit |
| `max_height` | `site.gallery_widget.max_height` | Max height — any CSS unit |
| `min_height` | `site.gallery_widget.min_height` | Min height — any CSS unit |
| `autoplay_seconds` | `site.gallery_widget.carousel_autoplay` | Carousel autoplay interval in seconds (`0` = off) |
| `show_caption` | `site.gallery_widget.show_image_caption` | Show image title in lightbox / carousel |
| `show_description` | `site.gallery_widget.show_image_description` | Show image description in lightbox / carousel |
| `alt` | — | Alt text for single-image galleries |
| `alt_prefix` | `Gallery image` | Prefix for auto-generated alt text |
| `json` | *(auto-discovered)* | Path to `gallery.json` metadata file |
| `sizes` | *(auto)* | Custom `srcset` sizes attribute |
| `loading` | `lazy` | Image loading hint (`lazy` or `eager`) |
| `id` | *(slug of src)* | Custom gallery ID for the DOM |

Include-level values always override `gallery_widget` defaults from `_config.yml`.

### Responsive Image Include (`responsive-image.html`)

The theme uses `_includes/responsive-image.html` to render `<img>` tags that automatically use responsive variants when available.

What it does:

- accepts a source image and emits a standard `<img>` with optional `srcset` and `sizes`
- detects existing generated variants and only references files that actually exist
- supports both variant naming schemes:
  - subdirectories: `thumbs/`, `small/`, `medium/`, `large/`, `full/`
  - suffixes: `.thumb`, `.small`, `.medium`, `.large`, `.full`
- supports extension flexibility (`jpg`, `jpeg`, `png`, `webp`, `avif`, `gif`, `svg`)
- falls back safely when the original source path no longer exists but variants do

Common usage:

```liquid
{% assign _all_static_paths = site.static_files | map: 'path' | join: '||' %}
{% assign _all_static_paths = '||' | append: _all_static_paths | append: '||' %}

{% include responsive-image.html
  src=page.image
  class='post-hero__media-image'
  alt=page.title
  loading='eager'
  decoding='async'
  fetchpriority='high'
  sizes='100vw'
  base_width=2000
  fallback=site.default_post_image
  all_static_paths=_all_static_paths
%}
```

Key include parameters:

- `src`: image path or external URL
- `alt`: alt text
- `class`: CSS class(es)
- `loading`, `decoding`, `fetchpriority`: native browser loading hints
- `sizes`: responsive sizes attribute
- `base_width`: width descriptor used for base `src` in `srcset` when base exists
- `fallback`: fallback image path used when `src` cannot be resolved
- `all_static_paths`: optional precomputed static file marker for performance

### Image Variant Generator (ImageMagick)

The repository includes a helper script at `scripts/generate-image-variants.sh` to generate responsive image variants for theme images.

The script:

- moves each source file into an `original/` subdirectory before generating derivatives
- creates a default web-optimized image at the original resolution using `--target-format` (default: `webp`)
- creates `thumb`, `small`, `medium`, `large`, and `full` variants
- can output either subdirectory variants (`thumbs/`, `small/`, `medium/`, `large/`, `full/`) or suffix variants (`.thumb`, `.small`, `.medium`, `.large`, `.full`)
- supports converting to another format (for example `webp`)
- only generates a variant when no equivalent alternative already exists (so it avoids unnecessary conversions/resizes)

Prerequisite:

- install ImageMagick (`magick` preferred, `convert` supported)

Basic usage:

```bash
# Preview what would be generated (recommended first)
./scripts/generate-image-variants.sh --dry-run --verbose

# Generate variants under assets/images using default settings
./scripts/generate-image-variants.sh
```

Common options:

```bash
# Use filename suffix naming
./scripts/generate-image-variants.sh --scheme suffix

# Force output format and quality
./scripts/generate-image-variants.sh --target-format webp --quality 82

# Limit generation to a specific folder
./scripts/generate-image-variants.sh --root assets/images/posts/2026-03-02_canyon-skies-of-orrin-basin

# By default animated GIFs are skipped. Opt in explicitly if needed:
./scripts/generate-image-variants.sh --allow-animated-gif

# Also update image paths in posts/pages content files (safe scope: not _layouts/_includes)
./scripts/generate-image-variants.sh --update-content-refs

# Optional: override where processing state is stored
./scripts/generate-image-variants.sh --state-file assets/images/.image-variant-state.tsv
```

Run `./scripts/generate-image-variants.sh --help` for full options.

### Supported Social Media Platforms

The theme includes icons for the following platforms. Add any or all to your `social_links` array in `_config.yml`:

| Platform | URL Format | Notes |
|---|---|---|
| **Social Media** | | |
| `x` | `https://x.com/yourhandle` | X (Twitter X) logo |
| `twitter` | `https://twitter.com/yourhandle` | Classic Twitter bird (legacy) |
| `facebook` | `https://www.facebook.com/yourpage` | Facebook icon |
| `instagram` | `https://www.instagram.com/yourhandle` | Instagram icon |
| `linkedin` | `https://www.linkedin.com/in/yourprofile` | LinkedIn icon |
| `youtube` | `https://www.youtube.com/yourchannel` | YouTube icon |
| `tiktok` | `https://www.tiktok.com/@yourhandle` | TikTok icon |
| `pinterest` | `https://www.pinterest.com/yourprofile` | Pinterest icon |
| `reddit` | `https://www.reddit.com/u/yourprofile` | Reddit icon |
| `discord` | `https://discord.gg/yourserver` | Discord icon |
| `mastodon` | `https://mastodon.social/@yourhandle` | Mastodon icon |
| `twitch` | `https://www.twitch.tv/yourhandle` | Twitch icon |
| `spotify` | `https://open.spotify.com/user/yourprofile` | Spotify icon |
| **Contact** | | |
| `email` | `mailto:you@example.com` | Envelope icon |
| `phone` | `tel:+1234567890` | Phone icon |
| **Auto-detected** | | |
| `rss` | *(auto-injected if jekyll-feed is enabled)* | RSS feed icon — automatically added if not manually configured |

Only include the platforms you actively use. Icons are rendered as a responsive grid with automatic wrapping.

---

## Theme Structure

The `theme/` directory contains route-level page sources that render site URLs.

- language-neutral routes live directly in `theme/` (for example `theme/about.markdown`, `theme/archive.markdown`, `theme/index.markdown`)
- translated routes live in `theme/<lang>/` (for example `theme/nl/about.markdown`)
- URL output is controlled by front matter `permalink`, so source paths stay flexible


```
jekyll-awayfromhome/
├── theme/                        # Route page sources (default + translated)
│   ├── index.markdown            # Home page (/)
│   ├── about.markdown            # About page (/about/)
│   ├── archive.markdown          # Archive page (/archive/)
│   ├── blog.md                   # Blog listing page
│   ├── browse.md                 # Browse page
│   ├── search.md                 # Search page
│   ├── tags.md                   # Tags page
│   ├── social-media.md           # Social hub page
│   ├── sitemap_html.md           # HTML sitemap page
│   ├── sitemap_xml.md            # XML sitemap source
│   ├── nl/                       # Dutch translated routes
│   ├── de/                       # German translated routes
│   └── ar/                       # Arabic translated routes
│
├── _includes/                    # Reusable HTML partials
│   ├── head.html                 # <head>: charset, viewport, CSS links
│   ├── meta.html                 # SEO: Open Graph, Twitter Card, JSON-LD
│   ├── header.html               # Top navigation bar
│   ├── footer.html               # Site footer
│   ├── sidebar.html              # Slide-in drawer / sidebar
│   ├── author-card.html          # Post author byline
│   ├── post-hero.html            # Hero banner for posts
│   ├── map-widget.html           # Map widget include (Leaflet)
│   ├── gallery-widget.html     # Image gallery include
│   ├── video-widget.html         # Inline video include (HLS/YouTube/Vimeo)
│   ├── search-widget.html        # Inline search input with dropdown results
│   ├── social-links.html         # Social media icon row
│   ├── tag-cloud.html            # Compact tag cloud snippet
│   ├── tag-cloud-page.html       # Full-page tag cloud
│   ├── tag-index.html            # Tag index listing
│   ├── entity-index.html         # Browse / category index partial
│   ├── icon.html                 # SVG icon helper
│   ├── css.html                  # <link> stylesheet tags
│   ├── font.html                 # Web font loading
│   ├── javascript-head.html      # Scripts loaded in <head>
│   └── javascript-body.html      # Scripts loaded before </body>
│
├── _layouts/                     # Page templates
│   ├── base.html                 # Root shell — <html>, header, footer
│   ├── home.html                 # Homepage: hero + latest posts grid
│   ├── page.html                 # Generic prose page (About, etc.)
│   ├── post.html                 # Blog post with hero, author card, tags
│   ├── blog.html                 # Reverse-chronological post archive
│   ├── archive.html              # Querystring-driven archive page
│   ├── entity-index.html         # Filterable browse / category page
│   ├── search.html               # Full-page search interface
│   ├── search-data.html          # Generates /assets/data/search-data.json
│   ├── tag-cloud.html            # Tag cloud page
│   ├── tag-index.html            # Posts grouped by tag
│   ├── social-media.html         # Link-in-bio / social hub page
│   ├── sitemap.html              # Human-readable HTML sitemap
│   ├── sitemap_xml.html          # Machine-readable sitemap.xml
│   └── error.html                # 404 / error page
│
├── _sass/
│   └── awayfromhome-theme/
│       ├── _variables.scss       # Design tokens — override to customise
│       ├── _base.scss            # CSS reset and element defaults
│       ├── _layout.scss          # Header, footer, drawer, grid
│       ├── _post.scss            # Post and article styles
│       ├── _search-widget.scss   # Search input component
│       └── _print.scss           # Print stylesheet
│
├── assets/
│   ├── css/
│   │   └── main.scss             # SCSS entrypoint (imports all partials)
│   ├── js/
│   │   ├── theme.js              # Light/dark/auto mode switching
│   │   ├── search.js             # Search engine: index loading and querying
│   │   ├── search-widget.js      # Search UI: input, dropdown, keyboard nav
│   │   ├── home-landing.js       # Hero player: HLS, chapter-based random seek
│   │   ├── archive.js            # Archive page filters + pagination
│   │   ├── blog-pagination.js    # Blog page client-side pagination
│   │   ├── post-snap.js          # Post-page scroll-snap behaviour
│   │   ├── entity-index.js       # Browse page live filtering
│   │   ├── tag-index.js          # Tag index live filtering
│   │   ├── map-widget.js         # Leaflet map widget runtime
│   │   ├── gallery-widget.js     # Gallery widget runtime
│   │   ├── video-widget.js       # Video widget runtime
│   │   ├── print-links.js        # Print link table generator
│   │   └── search-worker.js      # Search index worker
│   ├── data/
│   │   ├── search-data.md        # Liquid template → outputs search-data.json
│   │   └── home-landing-chapters.json  # Chapter markers for HLS hero
│   ├── fonts/                    # Self-hosted web fonts (optional)
│   └── images/                   # Default theme images (replace with your own)
│       ├── logo-mark.svg         # Site logo shown in header/drawer
│       ├── default-hero.svg      # Fallback hero for posts with no image
│       ├── avatar.svg            # Author avatar placeholder
│       ├── icons.svg             # SVG sprite for UI icons
│       └── page-hero-*.svg       # Per-layout hero illustrations
│
└── lib/
    └── jekyll-awayfromhome.rb    # Ruby gem entry point (minimal)
```

---

## Layouts

Set the layout in any page or post's front matter with `layout:`.

| Layout | Description |
|---|---|
| `base` | Root shell — `<html>`, `<head>`, header, footer. All other layouts extend this. |
| `home` | Homepage. Full-screen hero (HLS / YouTube / image) and a latest-posts grid. |
| `page` | Standard content page (About, contact, landing pages). |
| `post` | Blog post. Includes a hero banner, author card, tags, and post body. |
| `blog` | Post archive listed in reverse-chronological order. |
| `archive` | Filterable archive page with year/month/day selectors and pagination. |
| `entity-index` | Filterable browse/category index. |
| `search` | Full-page search interface with query input and results. |
| `tag-cloud` | Visual tag cloud weighted by post count. |
| `tag-index` | All posts grouped and listed by tag. |
| `social-media` | Link-in-bio / social media hub page. |
| `sitemap` | Human-readable HTML sitemap. |
| `sitemap_xml` | Machine-readable `sitemap.xml`. |
| `error` | 404 and error pages. |

**Example — a blog post:**

```yaml
---
layout: post
title: Three Days in Ljubljana
date: 2026-04-19
image: /assets/images/my-hero.jpg
tags: [europe, city, travel]
---

Post content goes here.
```

**Example — a standard page:**

```yaml
---
layout: page
title: About
permalink: /about/
---
```

---

## Archive

The `archive` layout provides a filterable, paginated post archive driven by URL query parameters.

### Create an archive page

Create `archive.md` in your site:

```yaml
---
layout: archive
title: Archive
permalink: /archive/
---
```

### Query parameters

- `year` — filter by year (for example: `/archive/?year=2026`)
- `month` — filter by month within a year (for example: `/archive/?year=2026&month=04`)
- `day` — filter by exact day (for example: `/archive/?year=2026&month=04&day=19`)
- `page` — pagination state (for example: `/archive/?year=2026&page=2`)

The page keeps filters, pagination, and URL state synchronized, so links from the sidebar archive menu open directly to matching filtered results.

### Sidebar archive modes

Configure the drawer ARCHIVE section in `_config.yml`:

```yaml
sidebar:
  archive:
    enabled: true
    mode: year-month-tree      # 'year' | 'month-year' | 'year-month-tree'
    show_post_counts: false
```

- `year`: one entry per year
- `month-year`: one entry per month (for example: April 2026)
- `year-month-tree`: collapsible years with nested months

When `show_post_counts: true`, the drawer shows counts for both years and months.

---

## Customisation

### Overriding SCSS variables

Every design token in `_sass/awayfromhome-theme/_variables.scss` is declared with `!default`, which means your own value wins if you set it first.

Create `assets/css/main.scss` in your site with an empty YAML front matter block, declare your overrides, then import the theme:

```scss
---
---

// ── Your overrides (must come before the @import) ────────────────────────────

// Accent colours
$light-accent:       #e63946;
$light-accent-strong:#c1121f;
$dark-accent:        #ff6b7a;
$dark-accent-strong: #ff8fa3;

// Fonts (use any Google Font or system font stack)
$font-display: 'Playfair Display', Georgia, serif;
$font-body:    'Lato', 'Helvetica Neue', Arial, sans-serif;

// Rounding — set to 0 for a sharper look
$radius-small: 0.25rem;
$radius-large: 0.5rem;

// ── Theme import ─────────────────────────────────────────────────────────────
@import "awayfromhome-theme/base";
@import "awayfromhome-theme/layout";
@import "awayfromhome-theme/search-widget";
@import "awayfromhome-theme/post";
@import "awayfromhome-theme/print";
```

#### Typography

| Variable | Default | Description |
|---|---|---|
| `$font-display` | `Sora, "Avenir Next", sans-serif` | Headings and display text |
| `$font-body` | `"Nunito Sans", "Segoe UI", Arial, sans-serif` | Body copy |

#### Layout & Geometry

| Variable | Default | Description |
|---|---|---|
| `$layout-max-width` | `76rem` | Maximum overall page width |
| `$reading-width` | `48rem` | Maximum width of post body text |
| `$panel-max-width` | `52rem` | Maximum width for narrower panels |
| `$page-gutter` | `1.15rem` | Horizontal edge padding |
| `$drawer-width` | `18rem` | Sidebar/drawer width |
| `$drawer-width-wide` | `22rem` | Sidebar width on wide screens |
| `$header-height` | `4.75rem` | Fixed header bar height |
| `$radius-small` | `1rem` | Corner radius for cards and inputs |
| `$radius-large` | `1.75rem` | Corner radius for modals and panels |
| `$radius-pill` | `999px` | Fully rounded pill shape |

#### Motion

| Variable | Default | Description |
|---|---|---|
| `$motion-fast` | `160ms` | Micro-interactions |
| `$motion-base` | `240ms` | Standard transitions |
| `$motion-theme` | `400ms` | Dark/light mode crossfade |

#### Responsive Breakpoints

| Variable | Default |
|---|---|
| `$breakpoint-sm` | `560px` |
| `$breakpoint-mobile` | `640px` |
| `$breakpoint-tablet` | `700px` |
| `$breakpoint-desktop` | `900px` |

#### Light Theme Palette

| Variable | Default | Description |
|---|---|---|
| `$light-bg` | `#f4f7fb` | Page background |
| `$light-surface` | `#ffffff` | Card / surface background |
| `$light-text` | `#102033` | Primary text |
| `$light-muted` | `#5a677a` | Secondary / muted text |
| `$light-accent` | `#11b8bd` | Accent, links, interactive elements |
| `$light-accent-strong` | `#0e8793` | Hovered / pressed accent |
| `$light-border` | `rgba(16,32,51,0.12)` | Dividers and borders |

#### Dark Theme Palette

| Variable | Default | Description |
|---|---|---|
| `$dark-bg` | `#171b22` | Page background |
| `$dark-surface` | `#222833` | Card / surface background |
| `$dark-text` | `#f4f8fb` | Primary text |
| `$dark-muted` | `#b3c0cb` | Secondary / muted text |
| `$dark-accent` | `#1dc9d2` | Accent, links, interactive elements |
| `$dark-accent-strong` | `#7ce8ed` | Hovered / pressed accent |
| `$dark-border` | `rgba(244,248,251,0.12)` | Dividers and borders |

#### Footer

| Variable | Default | Description |
|---|---|---|
| `$footer-bg` | `#0b1016` | Footer background (same in both themes) |
| `$footer-text` | `rgba(245,248,251,0.88)` | Footer primary text |
| `$footer-text-muted` | `rgba(245,248,251,0.68)` | Footer secondary text |

---

### Replacing images

The theme ships with a set of SVG placeholder images in `assets/images/`. Replace any of them in your own site by placing a file with the same name in your site's `assets/images/` folder — Jekyll will use yours instead of the theme's.

| File | Used for |
|---|---|
| `logo-mark.svg` | Site logo in the header and drawer |
| `default-hero.svg` | Fallback hero image for posts that have no `image:` set |
| `avatar.svg` | Author avatar placeholder in the author card |
| `icons.svg` | SVG sprite for all UI icons (navigation, social, controls) |
| `page-hero-blog.svg` | Hero on the blog archive page |
| `page-hero-about.svg` | Hero on the about page |
| `page-hero-tags.svg` | Hero on the tag pages |
| `page-hero-sitemap.svg` | Hero on the sitemap page |
| `page-hero-social.svg` | Hero on the social media page |
| `page-hero-error-404.svg` | Hero on the 404 error page |

You can also set a per-post hero image via front matter:

```yaml
---
layout: post
title: My Post
image: /assets/images/my-custom-hero.jpg
---
```

---

### Overriding layouts and includes

Jekyll's theme override mechanism lets you replace any layout or include by placing a file with the same path in your site:

- To override a layout, copy it from `_layouts/` to your site's `_layouts/` folder.
- To override a partial, copy it from `_includes/` to your site's `_includes/` folder.

Your version takes precedence, leaving the rest of the theme untouched.

---

### Adding custom JavaScript

Place your scripts in your site's `assets/js/` folder and load them by overriding `_includes/javascript-body.html`:

```html
<!-- _includes/javascript-body.html -->
{% include javascript-body.html %}   <!-- keeps the theme scripts -->
<script src="{{ '/assets/js/my-custom.js' | relative_url }}" defer></script>
```

---

## Search

The theme includes a client-side full-text search engine. No external service, API key, or server-side plugin required.

### How it works

1. **Index generation** — At build time, Jekyll processes `assets/data/search-data.md` through the `search-data` layout. This Liquid template crawls all posts and pages, strips HTML, removes language-specific stopwords (read from `_data/i18n/<lang>.yml` per document), and emits a weighted inverted-keyword index as `/assets/data/search-data.json`.

2. **Runtime caching** — On first visit, `search.js` fetches `search-data.json` and stores it in `localStorage` for 24 hours, keyed by a build-time version hash. Subsequent searches in the same browser use the cached index without a network request.

3. **Query matching** — The engine tokenises the query, looks up each token in the inverted index, and scores results (title and tag matches weighted higher than body matches). Results are returned sorted by relevance score.

4. **Two entry points:**
   - **`/search/`** — A dedicated full-page search powered by the `search` layout.
   - **Search widget** — An inline search input with a live dropdown, rendered via `{% include search-widget.html %}` and visible in the sidebar on every page.

### Required search page

Create a `search.md` file in your site:

```yaml
---
layout: search
title: Search
permalink: /search/
---
```

Do not delete `assets/data/search-data.md` — it is the Liquid template that generates the JSON index at build time.

### What gets indexed

- All posts in `_posts/`
- All pages with a layout (except `error`, `none`, and asset files)
- Post and page titles, tags, categories, excerpts, and body content
- Pages excluded via `sitemap: false` front matter are not indexed

---

## Multilingual Support

The theme includes a built-in multilingual system supporting any number of languages, automatic browser-preference detection, and per-language UI strings.

### How it works

1. **UI strings** — Each language has a YAML file in `_data/i18n/` (e.g. `en.yml`, `nl.yml`). All templates resolve strings via `{% assign t = site.data.i18n[page.lang] | default: site.data.i18n.en %}`.

2. **`afh-page-meta`** — A JSON blob injected into every page by `base.html`, containing `currentLang`, `defaultLang`, a `translations` map (language code → URL for this page's translations), and the full `i18n` object. All client-side scripts read from this.

3. **Language detection** — On first visit (no explicit preference stored), `lang-persist.js` detects the best matching language using:
   - `navigator.languages` — browser language list (BCP 47); exact match first, then base language (`nl-BE` → `nl`, `en-US` → `en`)
   - Timezone hint — `Intl.DateTimeFormat().resolvedOptions().timeZone` mapped to a language code as a weak tiebreaker
   - The detected language is **not** saved to storage; detection re-runs on every visit until the user makes an explicit choice.

4. **Explicit preference** — When the user picks a language from the dropdown, `localStorage('afh-lang')` is set and always takes priority over detection.

5. **RTL support** — Languages in the RTL list (`ar`, `he`, `fa`, `ur`, and others) automatically receive `dir="rtl"` on `<html>`.

6. **Fallback content** — With `lang_fallback: true` in `_config.yml`, posts that have no translation in the current language appear in listing pages using the original language as a fallback.

### Configuring languages

In `_config.yml`:

```yaml
lang: en            # default site language
lang_fallback: true # show default-lang posts on translated pages that lack a translation

languages:
  - code: en
    name: English
    native: English
    flag: "🇬🇧"
  - code: nl
    name: Dutch
    native: Nederlands
    flag: "🇳🇱"
  - code: de
    name: German
    native: Deutsch
    flag: "🇩🇪"
  - code: ar
    name: Arabic
    native: العربية
    flag: "🇸🇦"

defaults:
  - scope: { path: "theme/nl" }
    values:
      lang: nl
  - scope: { path: "_posts/nl", type: "posts" }
    values:
      lang: nl
      permalink: "/nl/blog/:slug/"
```

### Adding a new language

1. Add the language to `_config.yml` `languages:` list and `defaults:` scopes.
2. Create `_data/i18n/<code>.yml` with all UI string keys — copy `en.yml` as a starting template.
3. Create `theme/<code>/` with translated page files — copy `theme/ar/` as a template, updating `lang:`, `title:`, `permalink:`, and page content.
4. Optionally add translated posts to `_posts/<code>/` with matching `ref:` front matter.

### Translating posts and pages

Use `lang` and `ref` front matter to link translations of the same content:

```yaml
# English post (_posts/2026-04-19-my-post.markdown)
---
layout: post
lang: en
ref: my-post-slug
title: "My Post"
---

# Dutch translation (_posts/nl/2026-04-19-my-post.markdown)
---
layout: post
lang: nl
ref: my-post-slug   # same ref ties translations together
title: "Mijn bericht"
---
```

The `ref` field enables:
- The language switcher to link directly to each translated version
- Search results to show the current-language version instead of duplicates
- Browse and tag pages to avoid listing the same post in multiple languages

### i18n file structure

Each `_data/i18n/<lang>.yml` must contain these top-level sections: `site`, `nav`, `ui`, `drawer`, `theme`, `archive`, `blog`, `browse`, `search`, `tags`, `footer`.

The `search` section has two keys used by the client-side highlighter:

```yaml
search:
  word_regex: "[A-Za-zÀ-ÖØ-öø-ÿ0-9''\\-]+"  # token pattern for Latin scripts
  stopwords: "a,the,and,..."                  # comma-separated words to exclude
```

For non-Latin scripts, provide a matching Unicode range. The current-language regex is combined with the default-language regex at runtime so mixed-script content is highlighted correctly.

---

The `home` layout renders a full-screen hero at the top of the page. Three video sources are tried in order:

| Source | Condition |
|---|---|
| **HLS stream** | `hls_url` is set to an `.m3u8` URL |
| **YouTube** | `youtube_id` is set (or `video_url` contains a YouTube link) |
| **Static image** | Always available as a fallback / poster while video loads |

### Configuring the hero

In `_config.yml` (applies to all home pages):

```yaml
home_landing:
  hls_url: https://example.com/streams/playlist.m3u8
  youtube_id: dQw4w9WgXcQ
  image: /assets/images/default-hero.svg
  latest_posts_limit: 6
```

Override per-page in your `index.md` front matter:

```yaml
---
layout: home
landing_hls_url: /assets/streams/my-stream/playlist.m3u8
landing_image: /assets/images/my-hero.jpg
latest_posts_limit: 8
---
```

---

### Using an HLS stream

[HLS (HTTP Live Streaming)](https://en.wikipedia.org/wiki/HTTP_Live_Streaming) breaks a video into small `.ts` segments described by a `.m3u8` playlist. The theme loads [hls.js](https://github.com/video-dev/hls.js) dynamically — only when `hls_url` is set — so there is zero overhead on pages without video.

The video plays muted, autoplays, and loops. Playback starts at a position chosen by the chapter file (see below) rather than always from the beginning.

**Generating HLS segments with ffmpeg:**

```bash
ffmpeg -i input.mp4 \
  -codec: copy \
  -start_number 0 \
  -hls_time 6 \
  -hls_list_size 0 \
  -f hls \
  assets/streams/my-stream/playlist.m3u8
```

Commit the resulting `playlist.m3u8` and all `.ts` segment files, or host them on a CDN. Update `hls_url` to point to the `playlist.m3u8`.

---

### Chapter file (`home-landing-chapters.json`)

`assets/data/home-landing-chapters.json` defines named time ranges in the stream. When the page loads, the theme performs a **weighted random pick** to decide where playback begins — so cinematically interesting sections appear more often than credits or slow intros.

```json
[
  {
    "id": "chapter-01",
    "label": "Aerial opening",
    "start": 1,
    "weight": 4
  },
  {
    "id": "chapter-02",
    "label": "City walkthrough",
    "start": 45,
    "weight": 5
  },
  {
    "id": "chapter-03",
    "label": "Credits",
    "start": 280,
    "weight": 0
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (not displayed) |
| `label` | string | Human-readable name (not displayed; for your reference) |
| `start` | number | Chapter start time in **seconds** from the beginning of the stream |
| `weight` | number | Relative likelihood of this chapter being picked. `0` disables it. Higher values = more likely. |

A chapter is chosen by weighted random selection based on its weight value, then playback starts exactly at that chapter's `start` time. Chapters that would end within 4 seconds of the stream's end are automatically skipped. If the chapter file cannot be fetched or no valid chapters remain after filtering, playback falls back to a uniform random position across the full stream duration.

---

## License

This theme is released under the [MIT License](LICENSE).
