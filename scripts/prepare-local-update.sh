#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FIXTURES="$ROOT/local-update-fixtures"
VERSION="$(node -p "require('./package.json').version")"
ZIP="$(find "$ROOT/out/make/zip/darwin/arm64" -name "SupaSlash-darwin-arm64-${VERSION}.zip" 2>/dev/null | head -1)"

if [[ -z "$ZIP" ]]; then
  ZIP="$(ls -t "$ROOT/out/make/zip/darwin/arm64"/*.zip 2>/dev/null | head -1)"
fi

if [[ -z "$ZIP" ]]; then
  echo "No darwin zip found. Run: npm run make:local"
  exit 1
fi

mkdir -p "$FIXTURES"

node "$ROOT/scripts/generate-latest-mac-yml.js" "$ZIP" "$VERSION" "$FIXTURES/latest-mac.yml"
cp "$ZIP" "$FIXTURES/$(basename "$ZIP")"

echo "Prepared local update fixture for version $VERSION"
echo "  $FIXTURES/latest-mac.yml"
echo "  $FIXTURES/$(basename "$ZIP")"
