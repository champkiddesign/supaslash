# Slash It

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

## Building a Standalone App (optional)

To package as a native `.app` you can launch from the Dock:

```bash
npm install --save-dev @electron-forge/cli
npx electron-forge import
npm run make
```
