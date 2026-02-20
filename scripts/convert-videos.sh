#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
INPUT_DIR="$ROOT_DIR/videos"
OUTPUT_DIR="$ROOT_DIR/public/gifs"

mkdir -p "$OUTPUT_DIR"

for video in "$INPUT_DIR"/*.{mov,mp4,MOV,MP4}; do
  [ -f "$video" ] || continue
  name="$(basename "${video%.*}")"
  output="$OUTPUT_DIR/$name.gif"

  if [ -f "$output" ]; then
    echo "skip: $name.gif (already exists)"
    continue
  fi

  echo "converting: $(basename "$video") -> $name.gif"

  # Generate a palette for better color quality
  palette=$(mktemp /tmp/palette-XXXXXXXX.png)
  ffmpeg -y -ss 0 -t 3 -i "$video" \
    -vf "fps=15,scale=200:-1:flags=lanczos,palettegen" \
    "$palette" 2>/dev/null

  ffmpeg -y -ss 0 -t 3 -i "$video" -i "$palette" \
    -lavfi "fps=15,scale=200:-1:flags=lanczos[x];[x][1:v]paletteuse" \
    "$output" 2>/dev/null

  rm -f "$palette"
  echo "  done: $name.gif"
done

echo ""
echo "generated GIFs:"
ls -lh "$OUTPUT_DIR"/*.gif 2>/dev/null || echo "  (none)"
