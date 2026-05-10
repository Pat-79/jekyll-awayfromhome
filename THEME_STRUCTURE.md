---
sitemap: false
---
# jekyll-awayfromhome Theme Structure

This document describes the current structure of the jekyll-awayfromhome theme repository and how the main pieces fit together.

## Directory Structure

```text
jekyll-awayfromhome/
├── _data/
│   ├── authors.yml                 # Author directory used by author-card.html
│   ├── timezone_language_hints.yml # Build-time timezone → language hint map for auto-detection
│   └── i18n/                       # Per-language UI strings and search settings
│       ├── en.yml
│       ├── ar.yml
│       ├── nl.yml
│       └── de.yml
│
├── _includes/                      # Reusable Liquid partials
│   ├── author-card.html            # Author card with author lookup + optional socials/page
│   ├── css.html                    # Stylesheet loading
│   ├── entity-index.html           # Shared browse/index renderer
│   ├── font.html                   # Font loading
│   ├── footer.html                 # Footer and footer language-aware links
│   ├── format-date.html            # Language-aware date formatting helper
│   ├── gallery-widget.html       # Gallery widget markup
│   ├── head.html                   # Head assembly
│   ├── header.html                 # Header and home link
│   ├── icon.html                   # SVG sprite helper
│   ├── javascript-body.html        # Deferred script loading
│   ├── javascript-head.html        # Early inline script loading
│   ├── language-selector.html      # Translation switcher
│   ├── map-widget.html             # Map widget markup
│   ├── meta.html                   # SEO / Open Graph / alternates / JSON-LD
│   ├── post-hero.html              # Post hero banner
│   ├── responsive-image.html       # Responsive image include with existence-aware srcset
│   ├── search-widget.html          # Inline search field widget
│   ├── cookie-banner.html          # Cookie consent bottom bar (injected by base.html)
│   ├── cookie-preferences.html     # Inline preferences panel for the cookies page
│   ├── storage-widget.html         # localStorage summary and clear-all widget
│   ├── sidebar.html                # Drawer/sidebar contents
│   ├── social-links.html           # Social icon row
│   ├── tag-cloud-page.html         # Full-page tag cloud block
│   ├── tag-cloud.html              # Compact tag cloud block
│   ├── tag-index.html              # Tag-index renderer
│   └── video-widget.html           # Video widget markup
│
├── _layouts/                       # Page and data-output layouts
│   ├── archive.html                # Archive page with filters/pagination
│   ├── base.html                   # Root shell; computes lang, dir, translations JSON
│   ├── blog.html                   # Blog listing page
│   ├── entity-index.html           # Browse/category page layout
│   ├── error.html                  # Error pages
│   ├── home.html                   # Homepage / landing layout
│   ├── page.html                   # Standard content page
│   ├── post.html                   # Post page with hero, tags, author card, continue banner
│   ├── search-data.html            # Generates search-data.json
│   ├── search.html                 # Full-page search UI
│   ├── sitemap.html                # Human-readable sitemap
│   ├── sitemap_xml.html            # XML sitemap output
│   ├── social-media.html           # Social hub page
│   ├── tag-cloud.html              # Tag cloud page
│   └── tag-index.html              # Posts grouped by tag
│
├── _posts/
│   ├── ...                         # Default-language posts
│   ├── ar/                         # Arabic post translations
│   ├── de/                         # German post translations
│   └── nl/                         # Dutch post translations
│
├── _sass/
│   └── awayfromhome-theme/
│       ├── _base.scss             # Base element styling
│       ├── _cookies.scss          # Cookie consent banner, buttons, toggle switch
│       ├── _gallery.scss          # Gallery widget styles
│       ├── _layout.scss           # Header, footer, drawer, grids, site structure
│       ├── _map-widget.scss       # Map widget styles
│       ├── _post.scss             # Post, hero, author card, banners
│       ├── _print.scss            # Print stylesheet
│       ├── _search-widget.scss    # Search widget styles
│       ├── _variables.scss        # Theme variables and design tokens
│       └── _video-widget.scss     # Video widget styles
│
├── assets/
│   ├── css/
│   │   ├── main.scss              # Main SCSS entrypoint
│   │   ├── main.min.css           # Pre-compiled production CSS (committed; regenerate with scripts/minify.sh)
│   │   ├── gallery-widget.min.css
│   │   ├── map-widget.min.css
│   │   └── video-widget.min.css
│   ├── data/
│   │   ├── home-landing-chapters.json
│   │   └── search-data.md         # Source file that builds search-data.json
│   ├── images/
│   │   ├── avatar.svg             # Default author avatar
│   │   ├── default-hero.svg       # Default post hero fallback
│   │   ├── icons.svg              # SVG sprite sheet
│   │   ├── logo-mark.svg          # Brand mark
│   │   ├── page-hero-*.svg        # Default page hero illustrations
│   │   ├── posts/                 # User/content images
│   │   └── .image-variant-state.tsv
│   └── js/
│       ├── archive.js             # Archive filtering and pagination
│       ├── blog-pagination.js     # Blog page pagination
│       ├── cookie-consent.js      # Cookie consent banner + consent gate logic
│       ├── cookies-clear.js       # Storage summary and clear-all runtime
│       ├── entity-index.js        # Browse filtering
│       ├── gallery-widget.js      # Gallery behavior
│       ├── home-landing.js        # Home hero runtime
│       ├── lang-persist.js        # Language detection and persistence
│       ├── map-widget.js          # Leaflet map runtime
│       ├── post-snap.js           # Post page scroll behavior
│       ├── print-links.js         # Print-friendly external links
│       ├── search-highlight.js    # Search term highlighting
│       ├── search-widget.js       # Inline search UI
│       ├── search-worker.js       # Search worker
│       ├── search.js              # Search engine runtime
│       ├── tag-index.js           # Tag page filtering
│       ├── theme.js               # Theme switching and shared chrome logic
│       └── video-widget.js        # Video widget runtime
│
├── scripts/
│   ├── generate-image-variants.sh # ImageMagick helper for responsive image variants
│   ├── minify.sh                  # Build + minify all CSS and JS; run before committing CSS/JS changes
│   └── generate_timezone_language_hints.py  # Rebuild _data/timezone_language_hints.yml
│
├── theme/                         # Route source pages shipped by the theme
│   ├── about.markdown             # /about/
│   ├── archive.markdown           # /archive/
│   ├── blog.md                    # /blog/
│   ├── browse.md                  # /browse/
│   ├── cookies.markdown           # /cookies/ — includes cookie-preferences.html + storage-widget.html
│   ├── index.markdown             # /
│   ├── search.md                  # /search/
│   ├── sitemap_html.md            # /sitemap/
│   ├── sitemap_xml.md             # /sitemap.xml
│   ├── social-media.md            # /social-media/
│   ├── tags.md                    # /tags/
│   ├── ar/                        # Arabic translated pages
│   ├── de/                        # German translated pages
│   └── nl/                        # Dutch translated pages
│
├── lib/
│   ├── jekyll-awayfromhome.rb
│   └── jekyll-awayfromhome/
│       └── version.rb
│
├── _config.yml                    # Theme defaults and language scopes
├── Gemfile
├── README.md
├── LICENSE
└── THEME_STRUCTURE.md
```

## Key Design Principles

### Route Sources in `theme/`

- Route-level pages now live in `theme/` instead of the repository root.
- Default-language pages are stored directly in `theme/`.
- Translated pages are stored in `theme/<lang>/`.
- Output URLs are controlled by front matter `permalink`, so moving a source file does not need to change the public route.

### Multilingual Architecture

- UI translations live in `_data/i18n/<lang>.yml`.
- Page and post translations are tied together with shared `ref` values.
- `base.html` computes `_lang_prefix`, directionality, and a JSON translations map for client-side code.
- Page language defaults are assigned in `_config.yml` using `defaults` scopes for `theme/<lang>` and `_posts/<lang>`.
- `lang-persist.js` handles browser-language detection and explicit user preference storage.
- The language selector always reflects the current mode: **Automatic** (`🇺🇳`) is shown when no preference is stored; the chosen language is shown when one is. Selecting Automatic clears `localStorage('afh-lang')` and returns to auto-detection.
- Appending `?theme=light|dark|auto` or `?lang=<code>` to any URL overrides the respective setting in the same inline head script, writing to the same `localStorage` keys. Useful for testing and external tools such as PageSpeed Insights.

### Author Data Model

- Author records live in `_data/authors.yml`.
- `author-card.html` resolves author data by matching `author:` front matter to the `name` field.
- `bio` and `location` may be plain strings or language maps with per-language values and a `default` fallback.
- Optional `page_url` / `page` and `social_links` entries are rendered when present.

### Responsive Image Pipeline

- `_includes/responsive-image.html` is the shared image renderer used by heroes, cards, banners, and author avatars.
- It supports two variant layouts:
  - subdirectories: `thumbs/`, `small/`, `medium/`, `large/`, `full/`
  - suffixes: `.thumb`, `.small`, `.medium`, `.large`, `.full`
- It only emits `srcset` entries for files that actually exist in `site.static_files`.
- It supports extension fallback across `webp`, `avif`, `jpg`, `jpeg`, `png`, `gif`, and `svg`.
- `scripts/generate-image-variants.sh` creates these variants and can optionally rewrite content references.

## Current Routing Model

### Default-language pages

- `theme/index.markdown` -> `/`
- `theme/about.markdown` -> `/about/`
- `theme/archive.markdown` -> `/archive/`
- `theme/blog.md` -> `/blog/`
- `theme/browse.md` -> `/browse/`
- `theme/search.md` -> `/search/`
- `theme/tags.md` -> `/tags/`

### Translated pages

- `theme/nl/index.markdown` -> `/nl/`
- `theme/nl/about.markdown` -> `/nl/about/`
- `theme/de/archive.markdown` -> `/de/archive/`
- `theme/ar/search.markdown` -> `/ar/search/`

### Posts

- Default-language posts live in `_posts/`.
- Translated posts live in `_posts/<lang>/`.
- Permalinks for translated posts are controlled by `_config.yml` defaults, for example `/nl/blog/:slug/`.

## Build Output

When Jekyll builds the site, the main outputs include:

1. `_site/index.html` from `theme/index.markdown`
2. `_site/about/index.html`, `_site/archive/index.html`, and other route pages from `theme/`
3. `_site/nl/`, `_site/de/`, `_site/ar/` for translated page trees
4. `_site/assets/data/search-data.json` from `assets/data/search-data.md` + `_layouts/search-data.html`
5. `_site/assets/css/main.css` from `assets/css/main.scss` (compiled SCSS)
6. Copied assets from `assets/js/` and `assets/images/`

> **Important:** Production builds serve `assets/css/main.min.css` and `assets/js/*.min.js` — pre-compiled, minified files committed to the repository. Run `./scripts/minify.sh` after any SCSS or JS change and commit the updated minified files.

## Cookie Consent Architecture

Enabled via `cookie_consent.enabled: true` in `_config.yml`.

- `cookie-banner.html` is injected by `base.html` and hidden by default; `cookie-consent.js` shows it when the `banner_trigger` condition is met.
- Cookie categories (`essential`, `maps`, `video`) correspond to consent gates. Map and video widgets wrap third-party content in `<div class="afh-consent-gate" data-consent-gate="maps|video">`. When consent is granted, `cookie-consent.js` adds `.afh-consent-gate--granted` to unlock the content.
- `cookie-preferences.html` and `storage-widget.html` are placed on the cookies page to let visitors manage and clear their choices.
- `afh:consent-changed` is dispatched on `document` whenever preferences change; `map-widget.js` and `video-widget.js` listen for it to re-initialize gated widgets without a page reload.
- Preferences are stored in `localStorage` under `afh-cookie-consent` as JSON.

## Adding a New Language

1. Add the language to `_config.yml` under `languages:`.
2. Add a page default scope for `theme/<code>`.
3. Add a post default scope for `_posts/<code>` if translated posts are needed.
4. Create `_data/i18n/<code>.yml` by copying `en.yml`.
5. Create translated pages in `theme/<code>/` by copying one of the existing language directories.
6. Optionally create translated posts in `_posts/<code>/` using matching `ref` values.

## Customization Rules

### Overriding layouts and includes

- Copy a layout from `_layouts/` into your site’s `_layouts/` to override it.
- Copy an include from `_includes/` into your site’s `_includes/` to override it.
- User site files take precedence over the theme copies.

### Styling

- Theme tokens live in `_sass/awayfromhome-theme/_variables.scss`.
- Main layout styles live in `_layout.scss`.
- Post-specific styles, including the author card, live in `_post.scss`.
- Widget styles are kept in their own partials where appropriate.

### Content images

- Put content images under `assets/images/posts/...`.
- Use `responsive-image.html` directly for custom templates.
- Use `generate-image-variants.sh` to create responsive derivatives.

## Development Notes

- The project is designed for Jekyll 3.10.0+ and GitHub Pages compatibility.
- Layouts and includes avoid newer Liquid-only patterns where practical.
- JavaScript is plain ES modules with no bundler.
- The theme supports RTL languages through automatic `dir="rtl"` handling.
