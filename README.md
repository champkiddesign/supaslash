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

On first launch, macOS may warn that the app is from an unidentified developer. Right-click the app → **Open** to allow it.

To rebuild after changes, run `npm run make` again.
