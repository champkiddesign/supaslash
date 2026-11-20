#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_APP="$ROOT/node_modules/electron/dist/Electron.app"
ICON="$ROOT/assets/icon.icns"
KEY="$(printf '%s' "$ROOT" | shasum -a 256 | awk '{print $1}')"
CACHE_ROOT="${HOME}/Library/Caches/supaslash-dev-electron/${KEY}"
CACHE_APP="$CACHE_ROOT/dist/Electron.app"
VERSION_FILE="$CACHE_ROOT/electron-version"
PLIST="$CACHE_APP/Contents/Info.plist"
APP_ICON="$CACHE_APP/Contents/Resources/electron.icns"

if [[ ! -d "$SRC_APP" ]]; then
  echo "Electron is not installed. Run npm install." >&2
  exit 1
fi

if [[ ! -f "$ICON" ]]; then
  echo "Missing $ICON" >&2
  echo "Run npm run build-icon after adding assets/icon-source.png." >&2
  exit 1
fi

# Dropbox turns some framework symlinks into empty folders. Repair the copy
# so the dev app can be signed and show up as SupaSlash.
repair_frameworks() {
  local frameworks="$CACHE_APP/Contents/Frameworks"
  local fw base name
  for fw in "$frameworks"/*.framework; do
    base="$fw/Versions"
    [[ -d "$base/A" ]] || continue
    if [[ ! -L "$base/Current" ]]; then
      rm -rf "$base/Current"
      ln -s A "$base/Current"
    fi
    name="$(basename "$fw" .framework)"
    if [[ -e "$base/A/$name" && ! -L "$fw/$name" ]]; then
      rm -rf "$fw/$name"
      ln -s "Versions/Current/$name" "$fw/$name"
    fi
    if [[ -d "$base/A/Resources" && ! -L "$fw/Resources" ]]; then
      rm -rf "$fw/Resources"
      ln -s Versions/Current/Resources "$fw/Resources"
    fi
  done
}

refresh_app() {
  repair_frameworks
  plutil -replace CFBundleName -string "SupaSlash" "$PLIST"
  plutil -replace CFBundleDisplayName -string "SupaSlash" "$PLIST"
  plutil -replace CFBundleIdentifier -string "com.champkiddesign.supaslash.dev" "$PLIST"
  cp "$ICON" "$APP_ICON"
  xattr -cr "$CACHE_APP"
  codesign --force --deep --sign - "$CACHE_APP" >/dev/null
  touch "$CACHE_APP"
}

VERSION="$(node -p "require('$ROOT/node_modules/electron/package.json').version")"
NEED_COPY=0
if [[ ! -d "$CACHE_APP" ]]; then NEED_COPY=1; fi
if [[ ! -f "$VERSION_FILE" ]] || [[ "$(cat "$VERSION_FILE")" != "$VERSION" ]]; then NEED_COPY=1; fi

if [[ "$NEED_COPY" == 1 ]]; then
  rm -rf "$CACHE_ROOT/dist"
  mkdir -p "$CACHE_ROOT/dist"
  ditto "$SRC_APP" "$CACHE_APP"
  refresh_app
  printf '%s\n' "$VERSION" > "$VERSION_FILE"
elif [[ ! -f "$APP_ICON" || "$ICON" -nt "$APP_ICON" ]]; then
  refresh_app
fi

printf '%s\n' "$CACHE_ROOT/dist"
