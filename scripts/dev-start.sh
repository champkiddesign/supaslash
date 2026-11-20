#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$(bash "$ROOT/scripts/prepare-dev-app.sh")"
cd "$ROOT"
export ELECTRON_OVERRIDE_DIST_PATH="$DIST"
unset ELECTRON_RUN_AS_NODE
exec electron-forge start "$@"
