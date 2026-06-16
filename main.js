const { app, BrowserWindow, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let overlayWindow;
let drawerOverlayWindow;
let overlayMode = 'none';
let celebrationHideTimer = null;

const CELEBRATION_DURATION_MS = 3500;

const FOCUS_WIDTH_MARGIN = 40;
const FOCUS_BAR_HEIGHT = 56;
const FOCUS_DRAWER_SLOT = 180 + 16 + 6 + 8;
const FOCUS_SHELL_HEIGHT = FOCUS_BAR_HEIGHT + FOCUS_DRAWER_SLOT;
const FOCUS_DRAWER_ANIM_MS = 350;

const VISIBLE_ON_ALL_WORKSPACES_OPTS = {
  visibleOnFullScreen: true,
  skipTransformProcessType: true,
};

const WINDOW_SIZES = {
  edit: { width: 649, height: 768, minWidth: 510, minHeight: 425, resizable: true },
  focus: { width: 360, height: FOCUS_BAR_HEIGHT, minWidth: 200, minHeight: FOCUS_BAR_HEIGHT, maxHeight: FOCUS_BAR_HEIGHT, resizable: false },
  done: { width: 500, height: 620, minWidth: 420, minHeight: 560, resizable: true },
};

function getDataFile() {
  return path.join(app.getPath('userData'), 'slash-it-data.json');
}

function loadData() {
  try {
    const dataFile = getDataFile();
    if (fs.existsSync(dataFile)) {
      return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
  } catch {
    // ignore corrupt data
  }
  return {
    tasks: [],
    plannedSessions: [],
    expandedSessionId: null,
    currentIndex: 0,
    focusTaskIndex: 0,
    elapsedMs: 0,
    isRunning: false,
    mode: 'edit',
  };
}

function saveData(data) {
  fs.writeFileSync(getDataFile(), JSON.stringify(data, null, 2));
}

function getMainDisplay() {
  if (!isLiveWindow(mainWindow)) return screen.getPrimaryDisplay();
  const bounds = mainWindow.getBounds();
  return screen.getDisplayNearestPoint({
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  });
}

function createOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) return overlayWindow;

  overlayWindow = new BrowserWindow({
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    show: false,
    fullscreenable: false,
    backgroundColor: '#00000000',
    ...(process.platform === 'darwin' ? { type: 'panel' } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'overlay-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setVisibleOnAllWorkspaces(true, VISIBLE_ON_ALL_WORKSPACES_OPTS);
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');

  overlayWindow.loadFile('overlay.html');

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

function presentOverlayWindow(overlay) {
  if (overlay.isDestroyed()) return;
  overlay.showInactive();
  overlay.setAlwaysOnTop(true, 'screen-saver');
  if (isLiveWindow(mainWindow)) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    mainWindow.moveTop();
  }
}

function runWhenOverlayReady(overlay, callback) {
  if (overlay.webContents.isLoading()) {
    overlay.webContents.once('did-finish-load', callback);
  } else {
    callback();
  }
}

function showScreenOverlay() {
  const overlay = createOverlayWindow();
  const display = getMainDisplay();
  overlay.setBounds(display.bounds);
  overlayMode = 'expired';

  runWhenOverlayReady(overlay, () => {
    if (overlay.isDestroyed()) return;
    overlay.webContents.send('overlay-expired-show');
    presentOverlayWindow(overlay);
  });
}

function hideScreenOverlay({ restoreMainWindow = true } = {}) {
  if (overlayMode !== 'expired') return;
  overlayMode = 'none';
  if (isLiveWindow(overlayWindow)) {
    overlayWindow.webContents.send('overlay-expired-hide');
    overlayWindow.hide();
  }
  if (restoreMainWindow && isLiveWindow(mainWindow) && isFloatingMode(currentWindowMode)) {
    mainWindow.setAlwaysOnTop(true, 'floating');
  }
}

function hideCelebrationOverlay({ restoreMainWindow = true } = {}) {
  if (overlayMode !== 'celebration') return;
  overlayMode = 'none';
  if (celebrationHideTimer) {
    clearTimeout(celebrationHideTimer);
    celebrationHideTimer = null;
  }
  if (isLiveWindow(overlayWindow)) {
    overlayWindow.webContents.send('celebration-stop');
    overlayWindow.hide();
  }
  if (restoreMainWindow && isLiveWindow(mainWindow) && isFloatingMode(currentWindowMode)) {
    mainWindow.setAlwaysOnTop(true, 'floating');
  }
}

function hideAllOverlays({ restoreMainWindow = true } = {}) {
  if (celebrationHideTimer) {
    clearTimeout(celebrationHideTimer);
    celebrationHideTimer = null;
  }
  const mode = overlayMode;
  overlayMode = 'none';
  if (isLiveWindow(overlayWindow)) {
    if (mode === 'celebration') overlayWindow.webContents.send('celebration-stop');
    if (mode === 'expired') overlayWindow.webContents.send('overlay-expired-hide');
    overlayWindow.hide();
  }
  if (restoreMainWindow && isLiveWindow(mainWindow) && isFloatingMode(currentWindowMode)) {
    mainWindow.setAlwaysOnTop(true, 'floating');
  }
}

function showCelebrationOverlay() {
  const overlay = createOverlayWindow();
  const display = getMainDisplay();
  overlay.setBounds(display.bounds);

  if (celebrationHideTimer) {
    clearTimeout(celebrationHideTimer);
    celebrationHideTimer = null;
  }

  if (overlayMode === 'expired') {
    overlay.webContents.send('overlay-expired-hide');
  }

  overlayMode = 'celebration';

  runWhenOverlayReady(overlay, () => {
    if (overlay.isDestroyed()) return;
    overlay.webContents.send('celebration-start');
    presentOverlayWindow(overlay);
    celebrationHideTimer = setTimeout(() => {
      hideCelebrationOverlay();
    }, CELEBRATION_DURATION_MS);
  });
}

function isLiveWindow(win) {
  return win && !win.isDestroyed();
}

function destroyOverlayWindow() {
  if (isLiveWindow(overlayWindow)) {
    overlayWindow.close();
  }
  overlayWindow = null;
}

function createDrawerOverlayWindow() {
  if (drawerOverlayWindow && !drawerOverlayWindow.isDestroyed()) return drawerOverlayWindow;

  drawerOverlayWindow = new BrowserWindow({
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    show: false,
    fullscreenable: false,
    backgroundColor: '#00000000',
    ...(process.platform === 'darwin' ? { type: 'panel' } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'drawer-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  drawerOverlayWindow.setVisibleOnAllWorkspaces(true, VISIBLE_ON_ALL_WORKSPACES_OPTS);
  drawerOverlayWindow.setAlwaysOnTop(true, 'floating', 2);
  drawerOverlayWindow.loadFile('drawer-overlay.html');

  drawerOverlayWindow.on('closed', () => {
    drawerOverlayWindow = null;
  });

  return drawerOverlayWindow;
}

function getTimerBarBounds() {
  if (!isLiveWindow(mainWindow)) return null;
  const bounds = mainWindow.getBounds();
  return {
    x: bounds.x,
    y: bounds.y + bounds.height - FOCUS_BAR_HEIGHT,
    width: bounds.width,
    height: FOCUS_BAR_HEIGHT,
  };
}

function showSessionDrawerOverlay({ drawerWidth, drawerHeight, tasks, sessionTitle }) {
  const bar = getTimerBarBounds();
  if (!bar) return;

  const overlay = createDrawerOverlayWindow();
  const x = bar.x + Math.round((bar.width - drawerWidth) / 2);
  const y = bar.y - drawerHeight - 6;

  const present = () => {
    if (overlay.isDestroyed()) return;
    overlay.setBounds({ x, y, width: drawerWidth, height: drawerHeight });
    overlay.webContents.send('drawer-data', { tasks, sessionTitle });
    overlay.showInactive();
    overlay.setAlwaysOnTop(true, 'floating', 2);
    if (isLiveWindow(mainWindow)) {
      mainWindow.setAlwaysOnTop(true, 'floating', 1);
      mainWindow.moveTop();
    }
    setTimeout(() => {
      if (!overlay.isDestroyed()) overlay.webContents.send('drawer-open');
    }, 16);
  };

  if (overlay.webContents.isLoading()) {
    overlay.webContents.once('did-finish-load', present);
  } else {
    present();
  }
}

function hideSessionDrawerOverlay() {
  const overlay = drawerOverlayWindow;
  if (!isLiveWindow(overlay) || !overlay.isVisible()) return;
  overlay.webContents.send('drawer-close');
  setTimeout(() => {
    if (isLiveWindow(overlay)) overlay.hide();
  }, FOCUS_DRAWER_ANIM_MS);
}

function destroyDrawerOverlayWindow() {
  if (isLiveWindow(drawerOverlayWindow)) drawerOverlayWindow.close();
  drawerOverlayWindow = null;
}

function getInitialWindowMode() {
  const saved = loadData();
  const sessionTasks = saved.sessionTasks || saved.tasks || [];
  const incomplete = sessionTasks.filter((t) => !t.completed);
  if (saved.mode === 'focus' && incomplete.length > 0) return 'focus';
  if (saved.mode === 'done' && incomplete.length === 0 && sessionTasks.length > 0) return 'done';
  return 'edit';
}

function positionWindow(mode) {
  if (!isLiveWindow(mainWindow)) return;

  const bounds = mainWindow.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
  const { x: areaX, y: areaY, width: areaWidth, height: areaHeight } = display.workArea;
  const [width, height] = mainWindow.getSize();

  const x = Math.round(areaX + (areaWidth - width) / 2);
  let y;

  if (mode === 'focus') {
    const bottomMargin = 20;
    y = Math.round(areaY + areaHeight - height - bottomMargin);
  } else {
    y = Math.round(areaY + (areaHeight - height) / 2);
  }

  mainWindow.setPosition(x, y, true);
}

function getFocusMaxWidth() {
  const { width: areaWidth } = getMainDisplay().workArea;
  return Math.max(WINDOW_SIZES.focus.minWidth, areaWidth - FOCUS_WIDTH_MARGIN);
}

function isFloatingMode(mode) {
  return mode === 'focus' || mode === 'done';
}

function applyWindowPresentation(mode) {
  if (!isLiveWindow(mainWindow)) return;
  const floating = isFloatingMode(mode);

  mainWindow.setVisibleOnAllWorkspaces(floating, floating ? VISIBLE_ON_ALL_WORKSPACES_OPTS : undefined);
  mainWindow.setAlwaysOnTop(floating, floating ? 'floating' : 'normal');

  if (process.platform === 'darwin') {
    mainWindow.setWindowButtonVisibility(!floating);
  }
  mainWindow.setMaximizable(false);
}

function resizeFocusWindow({ width: contentWidth } = {}) {
  if (!isLiveWindow(mainWindow) || currentWindowMode !== 'focus') return;
  const size = WINDOW_SIZES.focus;
  const maxWidth = getFocusMaxWidth();
  const width = Math.max(size.minWidth, Math.min(Math.ceil(contentWidth), maxWidth));
  const height = FOCUS_BAR_HEIGHT;
  const boundsBefore = mainWindow.getBounds();
  mainWindow.setMinimumSize(size.minWidth, size.minHeight);
  mainWindow.setMaximumSize(maxWidth, size.maxHeight);
  mainWindow.setResizable(size.resizable);
  mainWindow.setBackgroundColor('#00000000');
  const bottom = boundsBefore.y + boundsBefore.height;
  const x = Math.round(boundsBefore.x + (boundsBefore.width - width) / 2);
  mainWindow.setBounds({ x, y: bottom - height, width, height }, false);
}

function applyWindowSize(mode) {
  if (!isLiveWindow(mainWindow)) return;
  currentWindowMode = mode;
  const size = WINDOW_SIZES[mode] || WINDOW_SIZES.edit;
  const display = getMainDisplay();
  const { x: areaX, y: areaY, width: areaWidth, height: areaHeight } = display.workArea;

  if (mode === 'focus') {
    mainWindow.setMinimumSize(size.minWidth, size.minHeight);
    mainWindow.setMaximumSize(getFocusMaxWidth(), size.maxHeight);
    mainWindow.setResizable(size.resizable);
    mainWindow.setBackgroundColor('#00000000');
    mainWindow.setSize(size.width, size.height, false);
    positionWindow(mode);
  } else {
    mainWindow.setMaximumSize(10000, 10000);
    mainWindow.setMinimumSize(size.minWidth, size.minHeight);
    mainWindow.setResizable(size.resizable);
    mainWindow.setBackgroundColor('#00000000');
    const width = size.width;
    const height = size.height;
    const x = Math.round(areaX + (areaWidth - width) / 2);
    const y = Math.round(areaY + (areaHeight - height) / 2);
    mainWindow.setBounds({ x, y, width, height }, false);
  }

  applyWindowPresentation(mode);

  if (mode !== 'focus') {
    hideAllOverlays();
    hideSessionDrawerOverlay();
  }
}

function setDockIcon() {
  if (process.platform !== 'darwin' || !app.dock) return;

  app.setActivationPolicy('regular');

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'electron.icns')
    : path.join(__dirname, 'assets', 'icon.icns');

  if (!fs.existsSync(iconPath)) return;
  app.dock.setIcon(nativeImage.createFromPath(iconPath));
  app.dock.show();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_SIZES.edit.width,
    height: WINDOW_SIZES.edit.height,
    minWidth: WINDOW_SIZES.edit.minWidth,
    minHeight: WINDOW_SIZES.edit.minHeight,
    alwaysOnTop: false,
    frame: false,
    transparent: true,
    resizable: true,
    maximizable: false,
    backgroundColor: '#00000000',
    ...(process.platform === 'darwin' ? {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 12, y: 14 },
    } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('focus', () => {
    if (process.platform === 'darwin') {
      app.focus({ steal: true });
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.webContents.once('did-finish-load', () => {
    applyWindowSize(getInitialWindowMode());
    setDockIcon();
  });

  mainWindow.on('closed', () => {
    destroyOverlayWindow();
    destroyDrawerOverlayWindow();
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setDockIcon();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('set-window-mode', (_event, mode) => {
  applyWindowSize(mode);
  return true;
});

ipcMain.handle('set-focus-width', (_event, contentWidth) => {
  resizeFocusWindow({ width: contentWidth });
  return true;
});

ipcMain.handle('set-focus-dimensions', (_event, dimensions) => {
  resizeFocusWindow({ width: dimensions.width });
  return true;
});

ipcMain.handle('show-session-drawer', (_event, payload) => {
  showSessionDrawerOverlay(payload);
  return true;
});

ipcMain.handle('hide-session-drawer', () => {
  hideSessionDrawerOverlay();
  return true;
});

ipcMain.handle('update-session-drawer', (_event, payload) => {
  if (isLiveWindow(drawerOverlayWindow) && drawerOverlayWindow.isVisible()) {
    drawerOverlayWindow.webContents.send('drawer-data', {
      tasks: payload.tasks,
      sessionTitle: payload.sessionTitle,
    });
  }
  return true;
});

ipcMain.on('drawer-pointer-enter', () => {
  if (isLiveWindow(mainWindow)) mainWindow.webContents.send('drawer-pointer-enter');
});

ipcMain.on('drawer-pointer-leave', () => {
  if (isLiveWindow(mainWindow)) mainWindow.webContents.send('drawer-pointer-leave');
});

ipcMain.on('drawer-select-task', (_event, index) => {
  if (isLiveWindow(mainWindow)) mainWindow.webContents.send('drawer-select-task', index);
});

ipcMain.handle('set-screen-overlay', (_event, visible) => {
  if (visible) showScreenOverlay();
  else hideScreenOverlay();
  return true;
});

ipcMain.handle('trigger-celebration', () => {
  showCelebrationOverlay();
  return true;
});

ipcMain.handle('stop-celebration', () => {
  hideCelebrationOverlay();
  return true;
});

ipcMain.handle('load-data', () => loadData());
ipcMain.handle('save-data', (_event, data) => {
  saveData(data);
  return true;
});
