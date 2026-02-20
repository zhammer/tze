#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
VIDEOS_DIR="$ROOT_DIR/videos"
GIFS_DIR="$ROOT_DIR/public/gifs"

# If a palette name is given, convert that subdirectory; otherwise convert top-level videos
PALETTE="${1:-}"

if [ -n "$PALETTE" ]; then
  INPUT_DIR="$VIDEOS_DIR/$PALETTE"
  OUTPUT_DIR="$GIFS_DIR/$PALETTE"
else
  INPUT_DIR="$VIDEOS_DIR"
  OUTPUT_DIR="$GIFS_DIR/tze"
fi

if [ ! -d "$INPUT_DIR" ]; then
  echo "error: directory not found: $INPUT_DIR"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

for video in "$INPUT_DIR"/*.{mov,mp4,MOV,MP4}; do
  [ -f "$video" ] || continue
  name="$(basename "${video%.*}")"
  # Sanitize filename (remove spaces, parens)
  safe_name="$(echo "$name" | tr ' ()' '_')"
  output="$OUTPUT_DIR/$safe_name.gif"

  if [ -f "$output" ]; then
    echo "skip: $safe_name.gif (already exists)"
    continue
  fi

  echo "converting: $(basename "$video") -> $safe_name.gif"

  # Generate a palette for better color quality
  palette=$(mktemp /tmp/palette-XXXXXXXX.png)
  ffmpeg -y -ss 0 -t 3 -i "$video" \
    -vf "fps=15,scale=200:-1:flags=lanczos,palettegen" \
    "$palette" 2>/dev/null

  ffmpeg -y -ss 0 -t 3 -i "$video" -i "$palette" \
    -lavfi "fps=15,scale=200:-1:flags=lanczos[x];[x][1:v]paletteuse" \
    "$output" 2>/dev/null

  rm -f "$palette"
  echo "  done: $safe_name.gif"
done

echo ""
echo "generated GIFs in $OUTPUT_DIR:"
ls -lh "$OUTPUT_DIR"/*.gif 2>/dev/null || echo "  (none)"
