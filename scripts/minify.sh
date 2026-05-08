#!/usr/bin/env bash
# scripts/minify.sh
#
# Build the site, then minify all CSS and JS assets into *.min.* counterparts.
# Run this locally before committing whenever you change CSS or JS files.
# The minified files are committed to git and served in production.
#
# Usage:
#   ./scripts/minify.sh            # build + minify
#   ./scripts/minify.sh --no-build # skip Jekyll build (minify existing _site output only)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TERSER="$ROOT/node_modules/.bin/terser"
CSSO="$ROOT/node_modules/.bin/csso"

# ── Verify tools ────────────────────────────────────────────────────────────
if [[ ! -x "$TERSER" ]]; then
  echo "ERROR: terser not found. Run: npm install" >&2; exit 1
fi
if [[ ! -x "$CSSO" ]]; then
  echo "ERROR: csso not found. Run: npm install" >&2; exit 1
fi

# ── Optionally run Jekyll build to compile SCSS → CSS ───────────────────────
if [[ "${1:-}" != "--no-build" ]]; then
  echo "==> Building Jekyll..."
  bundle exec jekyll build
fi

SITE="$ROOT/_site"
CSS_SRC="$SITE/assets/css"
JS_SRC="$ROOT/assets/js/full"  # full (unminified) source JS lives here
JS_DEST="$ROOT/assets/js"      # minified output stays in assets/js/

# ── CSS ─────────────────────────────────────────────────────────────────────
echo "==> Minifying CSS..."
for css_file in "$CSS_SRC"/*.css; do
  # Skip files that are already minified
  [[ "$css_file" == *.min.css ]] && continue
  base="$(basename "$css_file" .css)"
  dest="$ROOT/assets/css/${base}.min.css"
  "$CSSO" "$css_file" --output "$dest"
  echo "    $base.css → assets/css/$base.min.css ($(wc -c < "$dest") bytes)"
done

# ── JS ───────────────────────────────────────────────────────────────────────
echo "==> Minifying JS..."

# search-widget.js (full) imports from /assets/js/full/search.js.
# search.js (full) spawns /assets/js/full/search-worker.js as a Worker.
# Both references must be patched in the minified output to point to
# the .min.js files in /assets/js/.

for js_file in "$JS_SRC"/*.js; do
  [[ "$js_file" == *.min.js ]] && continue
  base="$(basename "$js_file" .js)"
  dest="$JS_DEST/${base}.min.js"

  "$TERSER" "$js_file" \
    --compress \
    --mangle \
    --output "$dest"

  # Patch internal cross-references in the minified output
  case "$base" in
    search-widget)
      # import { ... } from '/assets/js/full/search.js' → /assets/js/search.min.js
      sed -i "s|/assets/js/full/search\.js|/assets/js/search.min.js|g" "$dest"
      ;;
    search)
      # new Worker('/assets/js/full/search-worker.js...') → /assets/js/search-worker.min.js
      sed -i "s|/assets/js/full/search-worker\.js|/assets/js/search-worker.min.js|g" "$dest"
      ;;
  esac

  echo "    $base.js → assets/js/$base.min.js ($(wc -c < "$dest") bytes)"
done

echo ""
echo "Done. Commit the generated assets/css/*.min.css and assets/js/*.min.js files."
