#!/usr/bin/env bash

set -euo pipefail

# Generate responsive image variants only when no equivalent alternative exists.
# Supported alternative patterns per size:
# - Subdir: <dir>/<size>/<name>.<ext> (thumb uses thumbs/)
# - Suffix: <dir>/<name>.<size>.<ext>
# Additional behavior:
# - Archive source originals to <dir>/original/<name>.<ext>
# - Generate a default web-optimized image at <dir>/<name>.<target-ext>
# - Record each image's pixel dimensions (dir+stem, extension-independent) to
#   a Jekyll data file, so _includes/responsive-image.html and
#   gallery-widget.html can emit width/height attributes without a build-time
#   plugin (remote_theme/GitHub Pages safe mode can't run custom generators).
# - Record a tiny blurred base64 placeholder (LQIP) alongside each image's
#   dimensions, in the same data file, for the same reason.

ROOT_DIR="assets/images"
SCHEME="subdir"
TARGET_FORMAT="webp"
EXTRA_FORMATS=()
QUALITY="82"
DRY_RUN="false"
VERBOSE="false"
ALLOW_ANIMATED_GIF="false"
UPDATE_CONTENT_REFS="false"
STATE_FILE="assets/images/.image-variant-state.tsv"
DIMENSIONS_FILE="_data/image-dimensions.yml"
PLACEHOLDER_WIDTH="24"
PLACEHOLDER_BLUR="0x1.2"
PLACEHOLDER_QUALITY="40"

declare -A WIDTHS=(
  [thumb]=480
  [small]=768
  [medium]=1200
  [large]=1600
  [full]=2200
)

usage() {
  cat <<'EOF'
Usage: scripts/generate-image-variants.sh [options]

Options:
  --root <dir>           Root directory to scan (default: assets/images)
  --scheme <subdir|suffix>
                         Output naming scheme (default: subdir)
  --target-format <ext>  Variant extension (default: webp)
  --quality <1-100>      Output quality for lossy formats (default: 82)
  --allow-animated-gif   Allow converting animated GIF sources
  --update-content-refs  Update image references in posts/pages content files
  --state-file <path>    Processing state file path (default: assets/images/.image-variant-state.tsv)
  --dimensions-file <path>
                         Jekyll data file recording each image's pixel
                         dimensions, keyed by dir+stem (default: _data/image-dimensions.yml)
  --placeholder-width <px>
                         Long-edge size of the generated blur-up placeholder (default: 24)
  --placeholder-blur <NxS>
                         ImageMagick -blur geometry applied to the placeholder (default: 0x1.2)
  --placeholder-quality <1-100>
                         Output quality for the placeholder (default: 40)
  --extra-format <ext>   Generate additional variants in this format alongside --target-format
                         (e.g. --extra-format avif). Can be specified multiple times.
  --dry-run              Show what would be generated
  --verbose              Print skip reasons
  -h, --help             Show this help text

Notes:
  - Only original images are scanned. Existing variant directories and files are skipped.
  - A variant is generated only if no equivalent alternative already exists.
  - Sources are moved into an original/ subdirectory before generation.
  - A default optimized image is generated at base resolution using --target-format.
  - Animated GIF sources are skipped by default unless --allow-animated-gif is set.
  - Content ref updates only touch pages/posts content (not _layouts or _includes).
  - A processing state file is used to skip unchanged sources on reruns.
  - Every image's pixel dimensions are recorded to the dimensions file (even
    when its variants already exist and are skipped), so the theme can render
    width/height attributes and avoid layout shift.
  - A tiny blurred base64 placeholder is recorded alongside each image's
    dimensions, so the theme can show something instantly while the real
    image loads (LQIP / "blur-up").
EOF
}

log() {
  printf '%s\n' "$*"
}

vlog() {
  if [[ "$VERBOSE" == "true" ]]; then
    printf '%s\n' "$*"
  fi
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --root)
      ROOT_DIR="$2"
      shift 2
      ;;
    --scheme)
      SCHEME="$2"
      shift 2
      ;;
    --target-format)
      TARGET_FORMAT="${2,,}"
      shift 2
      ;;
    --quality)
      QUALITY="$2"
      shift 2
      ;;
    --allow-animated-gif)
      ALLOW_ANIMATED_GIF="true"
      shift
      ;;
    --update-content-refs)
      UPDATE_CONTENT_REFS="true"
      shift
      ;;
    --extra-format)
      EXTRA_FORMATS+=("${2,,}")
      shift 2
      ;;
    --state-file)
      STATE_FILE="$2"
      shift 2
      ;;
    --dimensions-file)
      DIMENSIONS_FILE="$2"
      shift 2
      ;;
    --placeholder-width)
      PLACEHOLDER_WIDTH="$2"
      shift 2
      ;;
    --placeholder-blur)
      PLACEHOLDER_BLUR="$2"
      shift 2
      ;;
    --placeholder-quality)
      PLACEHOLDER_QUALITY="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    --verbose)
      VERBOSE="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

[[ -d "$ROOT_DIR" ]] || die "Root directory does not exist: $ROOT_DIR"
[[ "$SCHEME" == "subdir" || "$SCHEME" == "suffix" ]] || die "--scheme must be subdir or suffix"
[[ "$QUALITY" =~ ^[0-9]+$ ]] || die "--quality must be numeric"
(( QUALITY >= 1 && QUALITY <= 100 )) || die "--quality must be between 1 and 100"

MAGICK_BIN=""
if command -v magick >/dev/null 2>&1; then
  MAGICK_BIN="magick"
elif command -v convert >/dev/null 2>&1; then
  MAGICK_BIN="convert"
else
  die "ImageMagick not found. Install 'magick' (preferred) or 'convert'."
fi

if ! command -v identify >/dev/null 2>&1; then
  die "ImageMagick 'identify' not found."
fi

build_destination() {
  local dir="$1"
  local stem="$2"
  local size="$3"
  local ext="$4"

  if [[ "$SCHEME" == "suffix" ]]; then
    printf '%s/%s.%s.%s' "$dir" "$stem" "$size" "$ext"
    return
  fi

  local subdir="$size"
  if [[ "$size" == "thumb" ]]; then
    subdir="thumbs"
  fi
  printf '%s/%s/%s.%s' "$dir" "$subdir" "$stem" "$ext"
}

has_alternative() {
  local src="$1"
  local dir="$2"
  local stem="$3"
  local size="$4"
  local target="$5"

  local -a patterns=()
  if [[ "$size" == "thumb" ]]; then
    patterns+=("$dir/thumbs/$stem.*" "$dir/$stem.thumb.*")
  else
    patterns+=("$dir/$size/$stem.*" "$dir/$stem.$size.*")
  fi

  local p f
  for p in "${patterns[@]}"; do
    for f in $p; do
      [[ -e "$f" ]] || continue
      [[ "$f" == "$src" ]] && continue
      [[ "$f" == "$target" ]] && continue
      return 0
    done
  done

  return 1
}

has_default_alternative() {
  local src="$1"
  local dir="$2"
  local stem="$3"
  local target="$4"

  local f
  for f in "$dir/$stem".*; do
    [[ -e "$f" ]] || continue
    [[ "$f" == "$src" ]] && continue
    [[ "$f" == "$target" ]] && continue

    # Ignore known generated variant naming patterns.
    if [[ "$f" =~ /(thumb|thumbs|small|medium|large|full)/[^/]+\.[^./]+$ ]]; then
      continue
    fi
    if [[ "$f" =~ \.(thumb|small|medium|large|full)\.[^.]+$ ]]; then
      continue
    fi

    return 0
  done

  return 1
}

needs_resize() {
  local src="$1"
  local max_width="$2"
  local width
  width="$(identify -format '%w' "$src" 2>/dev/null || true)"
  [[ "$width" =~ ^[0-9]+$ ]] || return 0
  (( width > max_width ))
}

is_animated_gif() {
  local src="$1"
  local frame_count
  frame_count="$(identify -format '%n\n' "$src" 2>/dev/null | head -n 1 || true)"
  if [[ "$frame_count" =~ ^[0-9]+$ ]] && (( frame_count > 1 )); then
    return 0
  fi
  return 1
}

create_variant() {
  local src="$1"
  local dest="$2"
  local max_width="$3"

  local src_ext="${src##*.}"
  src_ext="${src_ext,,}"
  local dest_ext="${dest##*.}"
  dest_ext="${dest_ext,,}"

  local do_resize="false"
  if needs_resize "$src" "$max_width"; then
    do_resize="true"
  fi

  local do_convert="false"
  if [[ "$src_ext" != "$dest_ext" ]]; then
    do_convert="true"
  fi

  if [[ "$do_resize" == "false" && "$do_convert" == "false" ]]; then
    if [[ "$DRY_RUN" == "true" ]]; then
      log "[DRY] copy $src -> $dest"
      return
    fi
    cp -f "$src" "$dest"
    log "[COPY] $dest"
    return
  fi

  local -a args=("$src" -auto-orient -strip)
  if [[ "$do_resize" == "true" ]]; then
    args+=( -resize "${max_width}x>" )
  fi

  case "$dest_ext" in
    jpg|jpeg)
      args+=( -quality "$QUALITY" -interlace Plane )
      ;;
    webp|avif)
      args+=( -quality "$QUALITY" )
      ;;
  esac

  if [[ "$DRY_RUN" == "true" ]]; then
    log "[DRY] $MAGICK_BIN ${args[*]} $dest"
    return
  fi

  "$MAGICK_BIN" "${args[@]}" "$dest"
  log "[GEN ] $dest"
}

archive_original() {
  local src="$1"
  local archive_path="$2"

  if [[ -e "$archive_path" ]]; then
    return 1
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log "[DRY] move $src -> $archive_path"
    return 0
  fi

  mv "$src" "$archive_path"
  log "[MOVE] $archive_path"
  return 0
}

create_default_optimized() {
  local src="$1"
  local dest="$2"

  local dest_ext="${dest##*.}"
  dest_ext="${dest_ext,,}"

  local -a args=()
  if [[ "$src" == "$dest" ]]; then
    # In-place optimization: write via temp file first.
    args=("$src" -auto-orient -strip)
  else
    args=("$src" -auto-orient -strip)
  fi

  case "$dest_ext" in
    jpg|jpeg)
      args+=( -quality "$QUALITY" -interlace Plane )
      ;;
    webp|avif)
      args+=( -quality "$QUALITY" )
      ;;
  esac

  if [[ "$DRY_RUN" == "true" ]]; then
    log "[DRY] $MAGICK_BIN ${args[*]} $dest"
    return
  fi

  if [[ "$src" == "$dest" ]]; then
    local tmp_dest
    tmp_dest="${dest}.tmp.$$"
    "$MAGICK_BIN" "${args[@]}" "$tmp_dest"
    mv -f "$tmp_dest" "$dest"
  else
    "$MAGICK_BIN" "${args[@]}" "$dest"
  fi
  log "[BASE] $dest"
}

update_content_references() {
  local changed_files=0
  local scanned_files=0
  local file content updated old_ref new_ref

  if [[ ${#REF_MAP[@]} -eq 0 ]]; then
    log "- Content refs updated: 0 (no eligible mappings)"
    return
  fi

  while IFS= read -r -d '' file; do
    ((scanned_files+=1))
    content="$(cat "$file")"
    updated="$content"

    for old_ref in "${!REF_MAP[@]}"; do
      new_ref="${REF_MAP[$old_ref]}"
      updated="$(OLD_REF="$old_ref" NEW_REF="$new_ref" perl -0777 -pe 's/\Q$ENV{OLD_REF}\E/$ENV{NEW_REF}/g' <<<"$updated")"
    done

    if [[ "$updated" != "$content" ]]; then
      ((changed_files+=1))
      if [[ "$DRY_RUN" == "true" ]]; then
        log "[DRY] update refs in $file"
      else
        printf '%s' "$updated" > "$file"
        log "[EDIT] $file"
      fi
    fi
  done < <(
    find . \
      -type d \( -name .git -o -name .vscode -o -name .restorepoints -o -name _site -o -name _includes -o -name _layouts -o -name _sass -o -name assets -o -name lib -o -name theme -o -name scripts \) -prune -o \
      -type f \( -name '*.md' -o -name '*.markdown' -o -name '*.html' \) -print0
  )

  log "- Content files scanned: $scanned_files"
  log "- Content refs updated: $changed_files"
}

build_source_signature() {
  local src="$1"
  local src_size src_mtime
  src_size="$(stat -c '%s' "$src" 2>/dev/null || echo 0)"
  src_mtime="$(stat -c '%Y' "$src" 2>/dev/null || echo 0)"
  printf '%s|%s|%s|%s|%s|%s|%s' "$src_size" "$src_mtime" "$TARGET_FORMAT" "$QUALITY" "$SCHEME" "$ALLOW_ANIMATED_GIF" "${EXTRA_FORMATS[*]}"
}

load_state_file() {
  local path="$1"
  [[ -f "$path" ]] || return 0

  while IFS=$'\t' read -r key sig; do
    [[ -n "$key" ]] || continue
    STATE_MAP["$key"]="$sig"
  done < "$path"
}

save_state_file() {
  local path="$1"
  local dir
  dir="$(dirname "$path")"
  mkdir -p "$dir"

  : > "$path"
  if [[ ${#STATE_MAP[@]} -eq 0 ]]; then
    return
  fi

  while IFS= read -r key; do
    printf '%s\t%s\n' "$key" "${STATE_MAP[$key]}" >> "$path"
  done < <(printf '%s\n' "${!STATE_MAP[@]}" | sort)
}

# Dimensions file uses a flat YAML mapping: quoted "dir+stem" key (no
# extension, leading slash, site-root relative) -> {width: W, height: H,
# placeholder: "data:image/webp;base64,..."}. The placeholder field is
# optional (older entries, or images generated before this existed, simply
# lack it). All variants of an image share the same aspect ratio (resize
# preserves it), so one recorded size/placeholder per image is enough
# regardless of which variant a given <img> ends up referencing.
load_dimensions_file() {
  local path="$1"
  [[ -f "$path" ]] || return 0

  local line key w h ph
  while IFS= read -r line; do
    if [[ "$line" =~ ^\"(.*)\":\ \{width:\ ([0-9]+),\ height:\ ([0-9]+)(,\ placeholder:\ \"([^\"]*)\")?\}$ ]]; then
      key="${BASH_REMATCH[1]}"
      w="${BASH_REMATCH[2]}"
      h="${BASH_REMATCH[3]}"
      ph="${BASH_REMATCH[5]}"
      DIM_MAP["$key"]="${w}x${h}"
      if [[ -n "$ph" ]]; then
        PLACEHOLDER_MAP["$key"]="$ph"
      fi
    fi
  done < "$path"
}

save_dimensions_file() {
  local path="$1"
  local dir
  dir="$(dirname "$path")"
  mkdir -p "$dir"

  {
    printf '# Generated by scripts/generate-image-variants.sh — do not hand-edit.\n'
    printf '# Keyed by dir+stem (extension-independent); consumed by\n'
    printf '# _includes/responsive-image.html and _includes/gallery-widget.html\n'
    printf '# to render width/height attributes and blur-up placeholders without\n'
    printf '# a build-time plugin.\n'
    if [[ ${#DIM_MAP[@]} -gt 0 ]]; then
      while IFS= read -r key; do
        if [[ -n "${PLACEHOLDER_MAP[$key]:-}" ]]; then
          printf '"%s": {width: %s, height: %s, placeholder: "%s"}\n' "$key" "${DIM_MAP[$key]%x*}" "${DIM_MAP[$key]#*x}" "${PLACEHOLDER_MAP[$key]}"
        else
          printf '"%s": {width: %s, height: %s}\n' "$key" "${DIM_MAP[$key]%x*}" "${DIM_MAP[$key]#*x}"
        fi
      done < <(printf '%s\n' "${!DIM_MAP[@]}" | sort)
    fi
  } > "$path"
}

record_dimensions() {
  local dim_key="$1"
  local file="$2"
  [[ -f "$file" ]] || return 0

  local wh
  wh="$(identify -format '%wx%h' "$file" 2>/dev/null || true)"
  [[ "$wh" =~ ^[0-9]+x[0-9]+$ ]] || return 0
  DIM_MAP["$dim_key"]="$wh"

  local tmp_ph
  tmp_ph="$(mktemp --suffix=.webp)"
  if "$MAGICK_BIN" "$file" -resize "${PLACEHOLDER_WIDTH}x${PLACEHOLDER_WIDTH}" -blur "$PLACEHOLDER_BLUR" -quality "$PLACEHOLDER_QUALITY" "$tmp_ph" 2>/dev/null; then
    local b64
    b64="$(base64 -w0 "$tmp_ph" 2>/dev/null || base64 "$tmp_ph" | tr -d '\n')"
    if [[ -n "$b64" ]]; then
      PLACEHOLDER_MAP["$dim_key"]="data:image/webp;base64,${b64}"
    fi
  fi
  rm -f "$tmp_ph"
}

generated=0
skipped_exists=0
skipped_alt=0
skipped_filtered=0
skipped_processed=0
archived=0
default_generated=0
default_skipped_exists=0
default_skipped_alt=0
declare -A REF_MAP=()
declare -A STATE_MAP=()
declare -A DIM_MAP=()
declare -A PLACEHOLDER_MAP=()

load_state_file "$STATE_FILE"
load_dimensions_file "$DIMENSIONS_FILE"

while IFS= read -r -d '' src; do
  rel="${src#${ROOT_DIR%/}/}"
  dir="$(dirname "$src")"
  name="$(basename "$src")"
  stem="${name%.*}"
  ext="${name##*.}"
  ext="${ext,,}"

  # Only process raster image formats suitable for resize/convert.
  case "$ext" in
    jpg|jpeg|png|webp|gif|avif) ;;
    *)
      ((skipped_filtered+=1))
      vlog "[SKIP] unsupported format: $rel"
      continue
      ;;
  esac

  # Skip source files that already look like generated variants.
  if [[ "$stem" =~ \.(thumb|small|medium|large|full)$ ]]; then
    ((skipped_filtered+=1))
    vlog "[SKIP] looks like suffix variant: $rel"
    continue
  fi

  if [[ "$dir" =~ /(thumb|thumbs|small|medium|large|full|original)$ ]]; then
    ((skipped_filtered+=1))
    vlog "[SKIP] inside variant directory: $rel"
    continue
  fi

  if [[ "$ext" == "gif" && "$ALLOW_ANIMATED_GIF" != "true" ]]; then
    if is_animated_gif "$src"; then
      ((skipped_filtered+=1))
      vlog "[SKIP] animated GIF (use --allow-animated-gif to include): $rel"
      continue
    fi
  fi

  dim_key="/${dir}/${stem}"
  dim_key="${dim_key//\/\//\/}"
  if [[ -z "${DIM_MAP[$dim_key]:-}" || -z "${PLACEHOLDER_MAP[$dim_key]:-}" ]]; then
    # Upgrading an existing repo: back-fill dimensions/placeholder for images
    # processed by an older version of this script, without forcing a full
    # reprocess.
    record_dimensions "$dim_key" "$dir/$stem.$TARGET_FORMAT"
  fi

  src_key="${src#./}"
  src_sig="$(build_source_signature "$src")"
  if [[ -n "${STATE_MAP[$src_key]:-}" && "${STATE_MAP[$src_key]}" == "$src_sig" ]]; then
    ((skipped_processed+=1))
    vlog "[SKIP] unchanged since last processing: $rel"
    continue
  fi

  archive_dir="$dir/original"
  archive_path="$archive_dir/$name"
  effective_src="$src"
  source_prepared="false"

  default_dest="$dir/$stem.$TARGET_FORMAT"
  default_ready="false"
  if [[ -e "$default_dest" ]]; then
    ((default_skipped_exists+=1))
    vlog "[SKIP] default already exists: ${default_dest#${ROOT_DIR%/}/}"
    default_ready="true"
    record_dimensions "$dim_key" "$default_dest"
  elif has_default_alternative "$src" "$dir" "$stem" "$default_dest"; then
    ((default_skipped_alt+=1))
    vlog "[SKIP] default alternative exists: $rel"
  else
    if [[ "$source_prepared" != "true" ]]; then
      mkdir -p "$archive_dir"
      if archive_original "$src" "$archive_path"; then
        ((archived+=1))
        if [[ "$DRY_RUN" != "true" ]]; then
          effective_src="$archive_path"
        fi
      fi
      source_prepared="true"
    fi
    create_default_optimized "$effective_src" "$default_dest"
    ((default_generated+=1))
    default_ready="true"
    record_dimensions "$dim_key" "$default_dest"
  fi

  if [[ "$UPDATE_CONTENT_REFS" == "true" && "$default_ready" == "true" ]]; then
    REF_MAP["/$src"]="/$default_dest"
    REF_MAP["$src"]="$default_dest"
  fi

  for size in thumb small medium large full; do
    max_width="${WIDTHS[$size]}"
    dest="$(build_destination "$dir" "$stem" "$size" "$TARGET_FORMAT")"

    if [[ -e "$dest" ]]; then
      ((skipped_exists+=1))
      vlog "[SKIP] already exists: ${dest#${ROOT_DIR%/}/}"
      continue
    fi

    if has_alternative "$src" "$dir" "$stem" "$size" "$dest"; then
      ((skipped_alt+=1))
      vlog "[SKIP] alternative exists for $size: $rel"
      continue
    fi

    if [[ "$source_prepared" != "true" ]]; then
      mkdir -p "$archive_dir"
      if archive_original "$src" "$archive_path"; then
        ((archived+=1))
        if [[ "$DRY_RUN" != "true" ]]; then
          effective_src="$archive_path"
        fi
      fi
      source_prepared="true"
    fi

    mkdir -p "$(dirname "$dest")"
    create_variant "$effective_src" "$dest" "$max_width"
    ((generated+=1))
  done

  # Generate extra-format variants (e.g. avif) alongside the primary format.
  # We skip has_alternative so both formats coexist in the same size directories.
  for extra_fmt in "${EXTRA_FORMATS[@]}"; do
    for size in thumb small medium large full; do
      max_width="${WIDTHS[$size]}"
      extra_dest="$(build_destination "$dir" "$stem" "$size" "$extra_fmt")"

      if [[ -e "$extra_dest" ]]; then
        vlog "[SKIP] extra format already exists: ${extra_dest#${ROOT_DIR%/}/}"
        continue
      fi

      if [[ "$source_prepared" != "true" ]]; then
        mkdir -p "$archive_dir"
        if archive_original "$src" "$archive_path"; then
          ((archived+=1))
          if [[ "$DRY_RUN" != "true" ]]; then
            effective_src="$archive_path"
          fi
        fi
        source_prepared="true"
      fi

      mkdir -p "$(dirname "$extra_dest")"
      create_variant "$effective_src" "$extra_dest" "$max_width"
      ((generated+=1))
    done
  done

  STATE_MAP["$src_key"]="$src_sig"
done < <(find "$ROOT_DIR" -type f -print0)

log ""
log "Done"
log "- Archived originals: $archived"
log "- Default generated: $default_generated"
log "- Default skipped (target exists): $default_skipped_exists"
log "- Default skipped (alternative exists): $default_skipped_alt"
log "- Generated: $generated"
log "- Skipped (target exists): $skipped_exists"
log "- Skipped (alternative exists): $skipped_alt"
log "- Skipped (filtered): $skipped_filtered"
log "- Skipped (already processed): $skipped_processed"
log "- Dimensions recorded: ${#DIM_MAP[@]}"

if [[ "$UPDATE_CONTENT_REFS" == "true" ]]; then
  update_content_references
fi

if [[ "$DRY_RUN" != "true" ]]; then
  save_state_file "$STATE_FILE"
  save_dimensions_file "$DIMENSIONS_FILE"
fi
