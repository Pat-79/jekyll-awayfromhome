---
sitemap: false
---
# jekyll-awayfromhome Theme Structure

This document describes the structure of the jekyll-awayfromhome theme gem and how it's organized for Jekyll 3.10.0+ compatibility.

## Directory Structure

```
jekyll-awayfromhome/
├── _data/
│   └── i18n/                   # Per-language UI strings
│       ├── en.yml              # English (default)
│       ├── ar.yml              # Arabic (RTL)
│       ├── nl.yml              # Dutch
│       └── de.yml              # German
│
├── _includes/              # Partial templates included in layouts
│   ├── head.html
│   ├── footer.html
│   ├── icon.html
│   ├── meta.html
│   ├── social-links.html
│   ├── javascript-body.html
│   ├── language-selector.html
│   └── ...
│
├── _layouts/               # Page layouts
│   ├── base.html           # Root layout (wraps all others); injects afh-page-meta JSON
│   ├── home.html           # Landing/homepage
│   ├── page.html           # Standard page
│   ├── post.html           # Blog post
│   ├── search.html         # Search results
│   ├── blog.html           # Blog archive
│   ├── entity-index.html   # Browse/category pages
│   ├── tag-index.html      # Tag cloud
│   ├── search-data.html    # Generates search-data.json (per-language stopwords)
│   ├── sitemap.html        # XML sitemap
│   └── ...
│
├── _sass/                  # SCSS partials (compiled to CSS)
│   └── awayfromhome-theme/
│       ├── variables.scss  # Design tokens (colors, fonts, sizes)
│       ├── reset.scss      # CSS reset
│       ├── typography.scss # Font and text styles
│       ├── layout.scss     # Layout, header, footer, grid
│       ├── components.scss # Buttons, cards, etc.
│       └── ...
│
├── assets/                 # Static assets
│   ├── css/
│   │   └── main.scss       # Main SCSS entrypoint (with YAML front matter)
│   ├── js/
│   │   ├── theme.js        # Core theme logic
│   │   ├── lang-persist.js # Language detection, preference persistence, chrome override
│   │   ├── search.js       # Search engine (index loading, SearchEngine class)
│   │   ├── search-worker.js# Web Worker — inverted index + fuzzy search
│   │   ├── search-widget.js# Search UI (dropdown, language filtering, ref deduplication)
│   │   ├── search-highlight.js # Post-page term highlighter (Unicode-aware, i18n word_regex)
│   │   ├── home-landing.js # Landing page snap behavior
│   │   ├── post-snap.js    # Post snap behavior
│   │   ├── tag-index.js    # Tag index filtering
│   │   ├── entity-index.js # Browse page filtering
│   │   └── ...
│   └── images/
│       ├── logo-mark.svg
│       ├── icons.svg
│       └── ...
│
├── ar/                     # Arabic language pages
│   ├── index.markdown
│   ├── about.markdown
│   ├── blog.markdown
│   ├── browse.markdown
│   ├── archive.markdown
│   ├── search.markdown
│   └── tags.markdown
│
├── nl/                     # Dutch language pages
│   └── (same structure as ar/)
│
├── de/                     # German language pages
│   └── (same structure as ar/)
│
├── _posts/
│   ├── (English posts — default lang)
│   ├── ar/                 # Arabic translations
│   ├── nl/                 # Dutch translations
│   └── de/                 # German translations
│
├── lib/                    # Ruby gem code (minimal for Jekyll themes)
│   ├── jekyll-awayfromhome.rb
│   └── jekyll-awayfromhome/
│       └── version.rb
│
├── _config.yml             # Theme defaults (incl. languages list and defaults scopes)
├── jekyll-awayfromhome.gemspec # Gem metadata and dependencies
├── README.md               # Installation and usage guide
├── LICENSE                 # MIT License
└── THEME_STRUCTURE.md      # This file
```

## Key Design Principles

### Jekyll 3.10.0 Compatibility

- **No Liquid 5+ Syntax**: Uses older Liquid template syntax
- **Minimal Dependencies**: Only requires Jekyll ≥3.10.0
- **No Ruby 3+ Features**: Compatible with Ruby 2.6+
- **GitHub Pages Compatible**: Works with `github-pages` gem ~232

### SCSS Organization

- **Single Entrypoint**: `assets/css/main.scss` with YAML front matter
- **Variables File**: `_sass/awayfromhome-theme/variables.scss` for theming
- **Exports CSS Variables**: Uses `--custom-property` for runtime overrides
- **Mobile-First**: Responsive design with mobile defaults

### JavaScript Organization

- **Modular Design**: Each feature in separate modules
- **No Build Step**: Plain ES6 modules (no bundler needed)
- **Progressive Enhancement**: Works without JavaScript
- **Keyboard Navigation**: Full keyboard accessibility support

### Multilingual Architecture

- **i18n data**: `_data/i18n/<lang>.yml` — UI strings for every language
- **`afh-page-meta`**: JSON blob injected by `base.html` containing `currentLang`, `defaultLang`, `translations` (ref→url map), and the full `i18n` object — used by all client-side scripts
- **`lang` + `ref` front matter**: `lang` identifies the language; `ref` ties translations of the same page/post together across languages
- **Language detection** (`lang-persist.js`): `navigator.languages` (BCP 47, exact then base-language match e.g. `nl-BE → nl`) → timezone hint → site default. Detection result is never saved; only explicit dropdown selection writes `localStorage('afh-lang')`.
- **RTL**: Automatic `dir="rtl"` on `<html>` for Arabic and other RTL language codes
- **Search**: Per-language stopwords (used at build time in `search-data.html` and at runtime in `search-highlight.js`); `word_regex` in each i18n file controls Unicode tokenisation for highlighting; ref-based deduplication in `search-widget.js`

## Customization

### Using Theme Variables

Create `_sass/awayfromhome-theme/custom-variables.scss` in your site:

```scss
@use "awayfromhome-theme/variables" as *;

// Override theme colors
$color-accent: #your-color;
$color-primary: #your-primary;
$font-display: 'Your Font', sans-serif;
```

### Overriding Layouts and Includes

1. Copy the desired file from the theme
2. Place it in your site's corresponding directory (e.g., `_layouts/page.html`)
3. Modify as needed—Jekyll will use your local version

### CSS Custom Properties

All colors and sizes are exposed as CSS custom properties for runtime overrides:

```css
:root {
  --accent: #0066cc;
  --text: #333;
  --background: #fff;
  --header-bg-scrolled: rgba(255, 255, 255, 0.9);
  /* ... more variables ... */
}
```

### Adding a New Language

1. Add to `_config.yml` `languages:` list and `defaults:` scopes
2. Create `_data/i18n/<code>.yml` with all UI string keys (copy `en.yml` as template)
3. Create `<code>/` directory with translated page files (copy `ar/` as template)
4. Add translated posts to `_posts/<code>/` with matching `ref:` front matter

## Build Output

When Jekyll builds with this theme:

1. **_site/assets/css/main.css** - Compiled SCSS
2. **_site/assets/js/** - JavaScript files (copied as-is)
3. **_site/assets/images/** - Image assets
4. **_site/index.html** - Homepage (using `home` layout)
5. **_site/about/** - Pages (using default/custom layouts)
6. **_site/assets/data/search-data.json** - Search index (from `_layouts/search-data.html`)
7. **_site/ar/**, **_site/nl/**, **_site/de/** - Language-prefixed page trees

## Theme Configuration (defaults in _config.yml)

```yaml
# Default and available languages
lang: en
lang_fallback: true
languages:
  - code: en
    name: English
    native: English
    flag: "🇬🇧"

# Home page hero section
home_landing:
  video_url: null
  youtube_id: null
  image: null
  latest_posts_limit: 6
  hls_url: null

# SEO/Social
url: https://example.com
twitter_username: null
github_username: null
```

## Testing the Theme

During development:

```bash
cd jekyll-awayfromhome
bundle install
bundle exec jekyll serve
```

This loads the theme from the local directory.

## Publishing to RubyGems

1. Update version in `lib/jekyll-awayfromhome/version.rb`
2. Build: `gem build jekyll-awayfromhome.gemspec`
3. Push: `gem push jekyll-awayfromhome-X.X.X.gem`

## Browser Compatibility

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari 12+
- iOS Safari 12+
- Mobile Chrome/Firefox (latest)

## Performance Considerations

- **Lazy-loaded images**: Except hero image
- **Deferred JavaScript**: Non-critical JS deferred
- **Minified CSS/JS**: Compiled assets
- **Optimized fonts**: System font stack by default
- **No external dependencies**: Zero CDN dependencies

## Accessibility (WCAG 2.1)

- **Semantic HTML**: Proper heading hierarchy, nav landmarks
- **ARIA labels**: For icon buttons, navigation
- **Keyboard navigation**: Full keyboard support
- **Color contrast**: WCAG AA compliant
- **Focus visible**: Custom focus indicators

## Known Limitations on Jekyll 3.10.0

- No native support for newer Liquid filters/tags (e.g., `relative_url` filter only in 4.0+)
- SCSS features limited to what's in Sass 3.x
- No built-in incremental file watching (use --incremental flag)


This document describes the structure of the jekyll-awayfromhome theme gem and how it's organized for Jekyll 3.10.0+ compatibility.

## Directory Structure

```
jekyll-awayfromhome/
├── _includes/              # Partial templates included in layouts
│   ├── head.html
│   ├── footer.html
│   ├── icon.html
│   ├── meta.html
│   ├── social-links.html
│   ├── javascript-body.html
│   └── ...
│
├── _layouts/               # Page layouts
│   ├── base.html           # Root layout (wraps all others)
│   ├── home.html           # Landing/homepage
│   ├── page.html           # Standard page
│   ├── post.html           # Blog post
│   ├── search.html         # Search results
│   ├── blog.html           # Blog archive
│   ├── entity-index.html   # Browse/category pages
│   ├── tag-index.html      # Tag cloud
│   ├── sitemap.html        # XML sitemap
│   └── ...
│
├── _sass/                  # SCSS partials (compiled to CSS)
│   └── awayfromhome-theme/
│       ├── variables.scss  # Design tokens (colors, fonts, sizes)
│       ├── reset.scss      # CSS reset
│       ├── typography.scss # Font and text styles
│       ├── layout.scss     # Layout, header, footer, grid
│       ├── components.scss # Buttons, cards, etc.
│       └── ...
│
├── assets/                 # Static assets
│   ├── css/
│   │   └── main.scss       # Main SCSS entrypoint (with YAML front matter)
│   ├── js/
│   │   ├── theme.js        # Core theme logic
│   │   ├── search.js       # Search engine
│   │   ├── search-widget.js# Search UI component
│   │   ├── home-landing.js # Landing page snap behavior
│   │   ├── post-snap.js    # Post snap behavior
│   │   └── ...
│   └── images/
│       ├── logo-mark.svg
│       ├── icons.svg
│       └── ...
│
├── lib/                    # Ruby gem code (minimal for Jekyll themes)
│   ├── jekyll-awayfromhome.rb
│   └── jekyll-awayfromhome/
│       └── version.rb
│
├── _config.yml             # Theme defaults
├── jekyll-awayfromhome.gemspec # Gem metadata and dependencies
├── README.md               # Installation and usage guide
├── LICENSE                 # MIT License
└── THEME_STRUCTURE.md      # This file
```

## Key Design Principles

### Jekyll 3.10.0 Compatibility

- **No Liquid 5+ Syntax**: Uses older Liquid template syntax
- **Minimal Dependencies**: Only requires Jekyll ≥3.10.0
- **No Ruby 3+ Features**: Compatible with Ruby 2.6+
- **GitHub Pages Compatible**: Works with `github-pages` gem ~232

### SCSS Organization

- **Single Entrypoint**: `assets/css/main.scss` with YAML front matter
- **Variables File**: `_sass/awayfromhome-theme/variables.scss` for theming
- **Exports CSS Variables**: Uses `--custom-property` for runtime overrides
- **Mobile-First**: Responsive design with mobile defaults

### JavaScript Organization

- **Modular Design**: Each feature in separate modules
- **No Build Step**: Plain ES6 modules (no bundler needed)
- **Progressive Enhancement**: Works without JavaScript
- **Keyboard Navigation**: Full keyboard accessibility support

## Customization

### Using Theme Variables

Create `_sass/awayfromhome-theme/custom-variables.scss` in your site:

```scss
@use "awayfromhome-theme/variables" as *;

// Override theme colors
$color-accent: #your-color;
$color-primary: #your-primary;
$font-display: 'Your Font', sans-serif;
```

### Overriding Layouts and Includes

1. Copy the desired file from the theme
2. Place it in your site's corresponding directory (e.g., `_layouts/page.html`)
3. Modify as needed—Jekyll will use your local version

### CSS Custom Properties

All colors and sizes are exposed as CSS custom properties for runtime overrides:

```css
:root {
  --accent: #0066cc;
  --text: #333;
  --background: #fff;
  --header-bg-scrolled: rgba(255, 255, 255, 0.9);
  /* ... more variables ... */
}
```

## Build Output

When Jekyll builds with this theme:

1. **_site/assets/css/main.css** - Compiled SCSS
2. **_site/assets/js/** - JavaScript files (copied as-is)
3. **_site/assets/images/** - Image assets
4. **_site/index.html** - Homepage (using `home` layout)
5. **_site/about/** - Pages (using default/custom layouts)
6. **_site/search-data.json** - Search index (from `_layouts/search-data.html`)

## Theme Configuration (defaults in _config.yml)

```yaml
# Home page hero section
home_landing:
  video_url: null               # Background video URL
  youtube_id: null              # YouTube video ID
  image: null                   # Fallback hero image
  latest_posts_limit: 6         # Posts shown on homepage
  hls_url: null                 # HLS stream URL

# SEO/Social
url: https://example.com
twitter_username: null
github_username: null
```

## Testing the Theme

During development:

```bash
cd jekyll-awayfromhome
bundle install
bundle exec jekyll serve
```

This loads the theme from the local directory.

## Publishing to RubyGems

1. Update version in `lib/jekyll-awayfromhome/version.rb`
2. Build: `gem build jekyll-awayfromhome.gemspec`
3. Push: `gem push jekyll-awayfromhome-X.X.X.gem`

## Browser Compatibility

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari 12+
- iOS Safari 12+
- Mobile Chrome/Firefox (latest)

## Performance Considerations

- **Lazy-loaded images**: Except hero image
- **Deferred JavaScript**: Non-critical JS deferred
- **Minified CSS/JS**: Compiled assets
- **Optimized fonts**: System font stack by default
- **No external dependencies**: Zero CDN dependencies

## Accessibility (WCAG 2.1)

- **Semantic HTML**: Proper heading hierarchy, nav landmarks
- **ARIA labels**: For icon buttons, navigation
- **Keyboard navigation**: Full keyboard support
- **Color contrast**: WCAG AA compliant
- **Focus visible**: Custom focus indicators

## Known Limitations on Jekyll 3.10.0

- No native support for newer Liquid filters/tags (e.g., `relative_url` filter only in 4.0+)
- SCSS features limited to what's in Sass 3.x
- No built-in incremental file watching (use --incremental flag)
