# SupaSlash

A minimal floating to-do timer for macOS, inspired by [Slash](https://getslash.co/).

Plan your tasks, hit **Start Slashing**, and the app keeps a timer running on your current task. When you mark a task done, the next one starts automatically — no friction, no decision fatigue.

## Features

- **Always on top** — floats above your other windows so your current task stays visible
- **Auto-advance** — completing a task immediately moves you to the next one
- **Start / pause timer** — control the clock anytime
- **Edit anytime** — go back to add, remove, reorder, or rename tasks
- **Drag to reorder** — prioritize by dragging tasks up or down
- **Dark mode** — follows your Mac's appearance setting
- **Persists** — your task list and progress are saved automatically

## Requirements

- macOS
- [Node.js](https://nodejs.org/) 18+

## Quick Start

```bash
npm install
npm start
```

The app opens as a small floating window. Drag it anywhere on screen — it stays on top of other apps. Use the traffic light buttons (top-left) to close or minimize.

## How to Use

1. **Add tasks** in the Today view
2. Click **Start Slashing** to enter focus mode
3. Work on the current task — the timer runs automatically
4. Click **Done ✓** when finished — the next task appears and the timer resets
5. Use **Pause / Resume** to stop the clock without finishing
6. Click **← Edit** to modify your task list

## Keyboard Tips

- **Enter** in the add-task field to quickly add tasks
- **Double-click** a task to rename it

## App Icon

Replace the app icon with your own artwork:

1. Save a **square PNG** as `assets/icon-source.png` (1024×1024 recommended)
2. Run `npm run build-icon` to generate `assets/icon.icns`
3. Run `npm run make` and reinstall from the new `.dmg`

For dev mode (`npm start`), the Dock icon updates from `assets/icon.icns` automatically after step 2.

**Tip:** Use a background color that contrasts with the macOS Dock (not pure black), so the icon stays visible in dark mode.

## Building a Standalone App

Package as a native `.app` and `.dmg` installer:

```bash
npm install
npm run make
```

The build outputs to `out/make/`:
- **`SupaSlash.dmg`** — drag to Applications to install
- **`SupaSlash-darwin-arm64-1.0.0.zip`** — zip of the `.app` bundle

For local testing, `npm run make` produces an unsigned build. For beta distribution, use the signed release build below so testers can open the app without Gatekeeper workarounds.

To rebuild after changes, run `npm run make` again.

## Release Build (Signed + Notarized)

Signed and notarized builds open normally on other Macs — no "damaged app" or right-click → Open workaround.

### One-time Apple setup

1. **Developer ID Application certificate**
   - Keychain Access → Certificate Assistant → Request a Certificate From a Certificate Authority (save the `.certSigningRequest`)
   - [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates) → **+** → **Developer ID Application** → upload CSR → download and install the `.cer`
2. **Team ID** — [Membership details](https://developer.apple.com/account) → copy your 10-character Team ID
3. **App-specific password** — [appleid.apple.com](https://appleid.apple.com) → App-Specific Passwords → create one (e.g. `SupaSlash Notarize`)
4. **Signing identity** — confirm with:
   ```bash
   security find-identity -v -p codesigning
   ```
   Copy the full `Developer ID Application: …` string.

### Configure credentials

```bash
cp .env.example .env
```

Edit `.env` with your Apple ID, app-specific password, Team ID, and signing identity. `.env` is gitignored — never commit it.

### Build for distribution

```bash
npm run make:release
```

Notarization takes a few minutes; Electron Forge waits automatically. Output is in `out/make/SupaSlash.dmg`.

### Verify before sending

```bash
codesign -dv --verbose=4 "out/SupaSlash-darwin-arm64/SupaSlash.app"
spctl -a -vv "out/SupaSlash-darwin-arm64/SupaSlash.app"
stapler validate "out/SupaSlash-darwin-arm64/SupaSlash.app"
```

Expect `Developer ID Application` authority, `accepted` from Gatekeeper, and a successful stapler validate.

Send **`out/make/SupaSlash.dmg`** to beta testers. They can double-click to install and launch normally.

## Automatic Updates

Installed builds check [GitHub Releases](https://github.com/champkiddesign/supaslash/releases) for updates on launch. Users are prompted before downloading or installing. Beta releases are published as **GitHub prereleases**.

Users can also choose **SupaSlash → Check for Updates…** from the macOS menu bar.

### Publishing an update

1. Merge changes to `main`
2. Bump `version` in `package.json` (e.g. `1.0.0` → `1.0.1`)
3. Commit and tag the release:
   ```bash
   git add package.json
   git commit -m "Release 1.0.1"
   git tag v1.0.1
   git push origin main --tags
   ```
4. Add `GH_TOKEN` to `.env` — a GitHub [personal access token](https://github.com/settings/tokens) with `repo` scope (for publishing releases)
5. Build, sign, notarize, and publish:
   ```bash
   npm run publish:release
   ```

This uploads the signed `.zip` (for auto-updates) and `.dmg` (for new installs) to GitHub Releases. Existing installs will pick up the new version on next launch.

### Release checklist

- [ ] Version bumped in `package.json`
- [ ] Tag pushed (`v1.0.1`)
- [ ] `npm run publish:release` completed
- [ ] GitHub Release shows `.zip` and `.dmg` assets
- [ ] Test update from previous installed version

### Test updates locally (no notarization)

Use this loop while debugging auto-updates. It uses unsigned builds and a local HTTP server instead of GitHub Releases.

**Terminal 1 — build an "old" app:**
```bash
# Temporarily set version to 1.0.0 in package.json
npm run make:local
open "out/SupaSlash-darwin-arm64/SupaSlash.app"
```

**Terminal 2 — build the "new" update and serve it:**
```bash
# Temporarily set version to 2.0.0 in package.json
npm run make:local
npm run prepare:local-update
npm run update-server
```

**Terminal 3 — launch the old app against the local feed:**
```bash
SUPASLASH_UPDATE_TEST_FEED=http://127.0.0.1:8765/ \
  "out/SupaSlash-darwin-arm64/SupaSlash.app/Contents/MacOS/SupaSlash"
```

The old app should offer version `2.0.0`, show a progress window while downloading, then prompt to restart.

Updater logs are written to `~/Library/Logs/SupaSlash/updater.log`.

When local testing passes, restore the real version in `package.json`, then use `npm run publish:release` for GitHub.
