#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$ROOT/assets"
SOURCE="$ASSETS/icon-source.png"
ICNS="$ASSETS/icon.icns"
ICONSET="$ASSETS/icon.iconset"
CONVERTED="$ASSETS/icon-source-converted.png"

if [[ ! -f "$SOURCE" ]]; then
  echo "Missing icon source file:"
  echo "  $SOURCE"
  echo ""
  echo "Add your icon as a square PNG (1024x1024 recommended), then run:"
  echo "  npm run build-icon"
  exit 1
fi

# Normalize JPEG uploads saved with a .png extension.
sips -s format png "$SOURCE" --out "$CONVERTED" >/dev/null
mv "$CONVERTED" "$SOURCE"

rm -rf "$ICONSET"
mkdir -p "$ICONSET"

sips -z 16 16     "$SOURCE" --out "$ICONSET/icon_16x16.png"      >/dev/null
sips -z 32 32     "$SOURCE" --out "$ICONSET/icon_16x16@2x.png"   >/dev/null
sips -z 32 32     "$SOURCE" --out "$ICONSET/icon_32x32.png"      >/dev/null
sips -z 64 64     "$SOURCE" --out "$ICONSET/icon_32x32@2x.png"   >/dev/null
sips -z 128 128   "$SOURCE" --out "$ICONSET/icon_128x128.png"     >/dev/null
sips -z 256 256   "$SOURCE" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
sips -z 256 256   "$SOURCE" --out "$ICONSET/icon_256x256.png"     >/dev/null
sips -z 512 512   "$SOURCE" --out "$ICONSET/icon_256x256@2x.png"  >/dev/null
sips -z 512 512   "$SOURCE" --out "$ICONSET/icon_512x512.png"     >/dev/null
sips -z 1024 1024 "$SOURCE" --out "$ICONSET/icon_512x512@2x.png" >/dev/null

iconutil -c icns "$ICONSET" -o "$ICNS"
rm -rf "$ICONSET"

echo "Built $ICNS"
