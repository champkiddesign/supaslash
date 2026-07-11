const { app, BrowserWindow, ipcMain, screen, nativeImage, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

function loadLocalEnvFile() {
  const envPath = path.join(__dirname, '.env');
  try {
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) return;
      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    });
  } catch (err) {
    console.error('Failed to load .env file:', err);
  }
}

loadLocalEnvFile();

const { createDataStore } = require('./data-store');
const { createLicenseStore } = require('./license-store');
const { createLicenseService } = require('./license-service');
const { setupAutoUpdater, checkForUpdates, isQuittingForUpdate } = require('./auto-updater');

const CELEBRATION_DURATION_MS = 3500;

const FOCUS_WIDTH_MARGIN = 40;
const FOCUS_BAR_HEIGHT = 56;
const FOCUS_DRAWER_GAP = 6;
const FOCUS_DRAWER_BRIDGE = 14;
const FOCUS_DRAWER_SLOT = 180 + 16 + 6 + 8;
const FOCUS_SHELL_HEIGHT = FOCUS_BAR_HEIGHT + FOCUS_DRAWER_SLOT;
const FOCUS_DRAWER_OPEN_ANIM_MS = 220;
const FOCUS_DRAWER_CLOSE_ANIM_MS = 160;

const VISIBLE_ON_ALL_WORKSPACES_OPTS = {
  visibleOnFullScreen: true,
  skipTransformProcessType: true,
};

const WINDOW_SIZES = {
  edit: { width: 649, height: 768, minWidth: 510, minHeight: 425, resizable: true },
  focus: { width: 360, height: FOCUS_BAR_HEIGHT, minWidth: 300, minHeight: FOCUS_BAR_HEIGHT, maxHeight: FOCUS_BAR_HEIGHT, resizable: false },
  done: { width: 500, height: 680, minWidth: 420, minHeight: 620, resizable: true },
};

let mainWindow;
let overlayWindow;
let drawerOverlayWindow;
let overlayMode = 'none';
let celebrationHideTimer = null;
let currentWindowMode = 'edit';
let focusPositionCustomized = false;
let focusBarHeight = FOCUS_BAR_HEIGHT;
let focusWindowFullscreen = false;
let focusWindowHiddenByUser = false;
let suppressFocusMoveEvent = false;

const dataStore = createDataStore(app);
const licenseStore = createLicenseStore(app);
const licenseService = createLicenseService(licenseStore, { allowDevLicense: !app.isPackaged });

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
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  };
}

function clampFocusBounds(x, y, width, height) {
  const display = screen.getDisplayNearestPoint({ x: x + width / 2, y: y + height / 2 });
  const { x: areaX, y: areaY, width: areaWidth, height: areaHeight } = display.workArea;
  const maxX = areaX + areaWidth - width;
  const maxY = areaY + areaHeight - height;
  return {
    x: Math.round(Math.max(areaX, Math.min(x, maxX))),
    y: Math.round(Math.max(areaY, Math.min(y, maxY))),
  };
}

function isFocusPositionOnScreen(x, y, width, height) {
  const displays = screen.getAllDisplays();
  return displays.some((display) => {
    const { x: areaX, y: areaY, width: areaWidth, height: areaHeight } = display.workArea;
    const right = x + width;
    const bottom = y + height;
    return right > areaX && x < areaX + areaWidth && bottom > areaY && y < areaY + areaHeight;
  });
}

function notifyFocusPositionChanged() {
  if (!isLiveWindow(mainWindow)) return;
  const bounds = mainWindow.getBounds();
  mainWindow.webContents.send('focus-position-changed', { x: bounds.x, y: bounds.y });
}

function attachFocusMoveListener() {
  if (!isLiveWindow(mainWindow)) return;
  mainWindow.removeAllListeners('moved');
  mainWindow.on('moved', () => {
    if (suppressFocusMoveEvent || currentWindowMode !== 'focus') return;
    focusPositionCustomized = true;
    notifyFocusPositionChanged();
  });
}

function showSessionDrawerOverlay({ drawerWidth, drawerHeight, tasks, sessionTitle, sessionDurationText }) {
  const bar = getTimerBarBounds();
  if (!bar) return;

  const overlay = createDrawerOverlayWindow();
  const x = bar.x + Math.round((bar.width - drawerWidth) / 2);
  const y = bar.y - drawerHeight - FOCUS_DRAWER_GAP - FOCUS_DRAWER_BRIDGE;
  const height = drawerHeight + FOCUS_DRAWER_BRIDGE;

  const present = () => {
    if (overlay.isDestroyed()) return;
    overlay.setBounds({ x, y, width: drawerWidth, height });
    overlay.webContents.send('drawer-data', { tasks, sessionTitle, sessionDurationText });
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

function hideSessionDrawerOverlay({ immediate = false } = {}) {
  const overlay = drawerOverlayWindow;
  if (!isLiveWindow(overlay) || !overlay.isVisible()) return;
  overlay.webContents.send('drawer-close');
  if (immediate) {
    overlay.hide();
    return;
  }
  setTimeout(() => {
    if (isLiveWindow(overlay)) overlay.hide();
  }, FOCUS_DRAWER_CLOSE_ANIM_MS);
}

function destroyDrawerOverlayWindow() {
  if (isLiveWindow(drawerOverlayWindow)) drawerOverlayWindow.close();
  drawerOverlayWindow = null;
}

function getInitialWindowMode() {
  const saved = dataStore.loadData();
  const sessionTasks = saved.sessionTasks || saved.tasks || [];
  const incomplete = sessionTasks.filter((t) => !t.completed);
  if (saved.mode === 'focus' && incomplete.length > 0) return 'focus';
  if (saved.mode === 'done' && incomplete.length === 0 && sessionTasks.length > 0) return 'done';
  return 'edit';
}

function positionWindow(mode, { focusPosition = null, focusPositionCustomized: customized = false } = {}) {
  if (!isLiveWindow(mainWindow)) return;

  const bounds = mainWindow.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
  const { x: areaX, y: areaY, width: areaWidth, height: areaHeight } = display.workArea;
  const [width, height] = mainWindow.getSize();

  if (mode === 'focus' && customized && focusPosition && isFocusPositionOnScreen(focusPosition.x, focusPosition.y, width, height)) {
    const clamped = clampFocusBounds(focusPosition.x, focusPosition.y, width, height);
    suppressFocusMoveEvent = true;
    mainWindow.setPosition(clamped.x, clamped.y, true);
    suppressFocusMoveEvent = false;
    focusPositionCustomized = true;
    return;
  }

  const x = Math.round(areaX + (areaWidth - width) / 2);
  let y;

  if (mode === 'focus') {
    const bottomMargin = 20;
    y = Math.round(areaY + areaHeight - height - bottomMargin);
    focusPositionCustomized = false;
  } else {
    y = Math.round(areaY + (areaHeight - height) / 2);
  }

  suppressFocusMoveEvent = true;
  mainWindow.setPosition(x, y, true);
  suppressFocusMoveEvent = false;
}

function getFocusMinWidth() {
  return Math.round(300 * (focusBarHeight / FOCUS_BAR_HEIGHT));
}

function getFocusMaxWidth() {
  const { width: areaWidth } = getMainDisplay().workArea;
  return Math.max(getFocusMinWidth(), areaWidth - FOCUS_WIDTH_MARGIN);
}

function resizeFocusWindow({ width: contentWidth, height: contentHeight, x, y, preservePosition, fullscreen } = {}) {
  if (!isLiveWindow(mainWindow) || currentWindowMode !== 'focus') return;

  if (fullscreen) {
    focusWindowFullscreen = true;
    const display = getMainDisplay();
    const { x: areaX, y: areaY, width: areaWidth, height: areaHeight } = display.workArea;
    focusPositionCustomized = false;
    mainWindow.setMinimumSize(200, 200);
    mainWindow.setMaximumSize(areaWidth, areaHeight);
    mainWindow.setResizable(WINDOW_SIZES.focus.resizable);
    mainWindow.setBackgroundColor('#00000000');
    suppressFocusMoveEvent = true;
    mainWindow.setBounds({ x: areaX, y: areaY, width: areaWidth, height: areaHeight }, false);
    suppressFocusMoveEvent = false;
    return;
  }

  focusWindowFullscreen = false;
  const minWidth = getFocusMinWidth();
  const maxWidth = getFocusMaxWidth();
  const width = Math.max(minWidth, Math.min(Math.ceil(contentWidth || minWidth), maxWidth));
  const height = Math.max(1, Math.ceil(contentHeight || focusBarHeight));
  focusBarHeight = height;
  const boundsBefore = mainWindow.getBounds();
  const useCustomPosition = preservePosition || focusPositionCustomized;

  mainWindow.setMinimumSize(minWidth, height);
  mainWindow.setMaximumSize(maxWidth, height);
  mainWindow.setResizable(WINDOW_SIZES.focus.resizable);
  mainWindow.setBackgroundColor('#00000000');

  let nextX;
  let nextY;

  if (useCustomPosition) {
    const anchorX = Number.isFinite(x) ? x : boundsBefore.x;
    const anchorY = Number.isFinite(y) ? y : boundsBefore.y;
    const clamped = clampFocusBounds(anchorX, anchorY, width, height);
    nextX = clamped.x;
    nextY = clamped.y;
    focusPositionCustomized = true;
  } else {
    const bottom = boundsBefore.y + boundsBefore.height;
    nextX = Math.round(boundsBefore.x + (boundsBefore.width - width) / 2);
    nextY = bottom - height;
    const clamped = clampFocusBounds(nextX, nextY, width, height);
    nextX = clamped.x;
    nextY = clamped.y;
  }

  suppressFocusMoveEvent = true;
  mainWindow.setBounds({ x: nextX, y: nextY, width, height }, false);
  suppressFocusMoveEvent = false;
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

function applyWindowSize(mode, options = {}) {
  if (!isLiveWindow(mainWindow)) return;
  currentWindowMode = mode;
  const size = WINDOW_SIZES[mode] || WINDOW_SIZES.edit;
  const display = getMainDisplay();
  const { x: areaX, y: areaY, width: areaWidth, height: areaHeight } = display.workArea;

  if (mode !== 'focus') {
    focusWindowHiddenByUser = false;
    if (!mainWindow.isVisible()) mainWindow.show();
  }

  if (mode === 'focus') {
    if (options.fullscreen) {
      resizeFocusWindow({ fullscreen: true });
    } else {
      focusWindowFullscreen = false;
      const barHeight = Math.max(1, Math.round(options.height || FOCUS_BAR_HEIGHT));
      focusBarHeight = barHeight;
      const minWidth = getFocusMinWidth();
      mainWindow.setMinimumSize(minWidth, barHeight);
      mainWindow.setMaximumSize(getFocusMaxWidth(), barHeight);
      mainWindow.setResizable(size.resizable);
      mainWindow.setBackgroundColor('#00000000');
      mainWindow.setSize(size.width, barHeight, false);
      focusPositionCustomized = !!options.focusPositionCustomized;
      positionWindow(mode, {
        focusPosition: options.focusPosition || null,
        focusPositionCustomized: focusPositionCustomized,
      });
    }
  } else {
    focusPositionCustomized = false;
    focusBarHeight = FOCUS_BAR_HEIGHT;
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

function setupAppMenu() {
  if (process.platform !== 'darwin') return;

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Check for Updates…',
          click: () => {
            checkForUpdates({ manual: true }).catch((err) => {
              console.error('Manual update check failed:', err);
            });
          },
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
      ],
    },
  ]));
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
    if (currentWindowMode === 'focus' && focusWindowHiddenByUser) {
      mainWindow.webContents.send('focus-window-restore-request');
    }
  });

  attachFocusMoveListener();

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
  setupAppMenu();
  createWindow();
  setupAutoUpdater();
  licenseService.validateStoredLicense().catch((err) => {
    console.error('Failed to validate license on startup:', err);
  });

  app.on('activate', () => {
    if (isQuittingForUpdate()) return;
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      return;
    }
    if (isLiveWindow(mainWindow) && currentWindowMode === 'focus' && focusWindowHiddenByUser) {
      mainWindow.webContents.send('focus-window-restore-request');
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

let isQuitting = false;
app.on('before-quit-for-update', () => {
  isQuitting = true;
});
app.on('before-quit', (event) => {
  if (isQuitting || isQuittingForUpdate()) return;
  event.preventDefault();
  isQuitting = true;
  dataStore.flushDocumentsBackup()
    .catch((err) => {
      console.error('Failed to flush Documents backup on quit:', err);
    })
    .finally(() => {
      app.quit();
    });
});

ipcMain.handle('check-for-updates', () => checkForUpdates({ manual: true }));

ipcMain.handle('set-window-mode', (_event, mode, options = {}) => {
  applyWindowSize(mode, options);
  return true;
});

ipcMain.handle('set-focus-width', (_event, contentWidth) => {
  resizeFocusWindow({ width: contentWidth, height: focusBarHeight, preservePosition: focusPositionCustomized });
  return true;
});

ipcMain.handle('set-focus-dimensions', (_event, dimensions = {}) => {
  if (dimensions.fullscreen) {
    focusPositionCustomized = false;
    resizeFocusWindow({ fullscreen: true });
    return true;
  }
  if (typeof dimensions.focusPositionCustomized === 'boolean') {
    focusPositionCustomized = dimensions.focusPositionCustomized;
  }
  resizeFocusWindow({
    width: dimensions.width,
    height: dimensions.height,
    x: dimensions.x,
    y: dimensions.y,
    preservePosition: dimensions.preservePosition ?? focusPositionCustomized,
    fullscreen: false,
  });
  return true;
});

ipcMain.handle('hide-focus-window', () => {
  if (!isLiveWindow(mainWindow) || currentWindowMode !== 'focus') return false;
  focusWindowHiddenByUser = true;
  hideSessionDrawerOverlay({ immediate: true });
  mainWindow.hide();
  return true;
});

ipcMain.handle('show-focus-window', () => {
  if (!isLiveWindow(mainWindow) || currentWindowMode !== 'focus') return false;
  focusWindowHiddenByUser = false;
  mainWindow.showInactive();
  mainWindow.setAlwaysOnTop(true, 'floating');
  return true;
});

ipcMain.handle('show-session-drawer', (_event, payload) => {
  showSessionDrawerOverlay(payload);
  return true;
});

ipcMain.handle('hide-session-drawer', (_event, immediate = false) => {
  hideSessionDrawerOverlay({ immediate: !!immediate });
  return true;
});

ipcMain.handle('update-session-drawer', (_event, payload) => {
  if (isLiveWindow(drawerOverlayWindow) && drawerOverlayWindow.isVisible()) {
    drawerOverlayWindow.webContents.send('drawer-data', {
      tasks: payload.tasks,
      sessionTitle: payload.sessionTitle,
      sessionDurationText: payload.sessionDurationText,
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

ipcMain.handle('license:get-cached-status', () => licenseService.getStatus());

ipcMain.handle('license:get-status', async () => {
  try {
    return await licenseService.validateStoredLicense();
  } catch (err) {
    console.error('Failed to get license status:', err);
    return licenseService.getStatus();
  }
});

ipcMain.handle('license:activate', async (_event, payload = {}) => {
  try {
    return await licenseService.activateLicense(payload);
  } catch (err) {
    console.error('Failed to activate license:', err);
    return { ok: false, status: { isLicensed: false, error: err.message } };
  }
});

ipcMain.handle('license:deactivate', async () => {
  try {
    return await licenseService.deactivateLicense();
  } catch (err) {
    console.error('Failed to deactivate license:', err);
    return { ok: false, status: { isLicensed: false, error: err.message } };
  }
});

ipcMain.handle('license:open-checkout', async () => {
  const checkoutUrl = licenseService.getCheckoutUrl();
  if (!checkoutUrl) {
    return { ok: false, error: 'Checkout link is not configured yet.' };
  }
  await shell.openExternal(checkoutUrl);
  return { ok: true };
});

ipcMain.handle('load-data', () => dataStore.loadData());
ipcMain.handle('save-data', (_event, data) => {
  dataStore.saveDataAsync(data);
  return true;
});

ipcMain.handle('get-data-info', () => dataStore.getDataInfo());

ipcMain.handle('backup-data-now', async () => {
  const lastDocumentsBackupAt = await dataStore.backupDocumentsNow();
  return { lastDocumentsBackupAt };
});

ipcMain.handle('open-documents-data-folder', async () => {
  const documentsDir = dataStore.getDocumentsDir();
  await fs.promises.mkdir(documentsDir, { recursive: true });
  const errorMessage = await shell.openPath(documentsDir);
  return { ok: !errorMessage, errorMessage };
});

ipcMain.handle('export-earnings-report-pdf', async (event, { html, defaultFileName, dialogTitle }) => {
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  let reportWindow;

  try {
    reportWindow = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await reportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, 500);
      reportWindow.webContents.once('did-finish-load', () => {
        clearTimeout(timeout);
        resolve();
      });
      reportWindow.webContents.once('did-fail-load', (_event, _code, description) => {
        clearTimeout(timeout);
        reject(new Error(description));
      });
    });

    const pdfBuffer = await reportWindow.webContents.printToPDF({
      printBackground: true,
      marginsType: 1,
      pageSize: 'Letter',
    });

    const { canceled, filePath } = await dialog.showSaveDialog(parentWindow, {
      title: dialogTitle || 'Create report',
      defaultPath: defaultFileName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) {
      return { canceled: true };
    }

    await fs.promises.writeFile(filePath, pdfBuffer);
    return { canceled: false, filePath };
  } catch (err) {
    console.error('Failed to export earnings report PDF:', err);
    return { canceled: false, error: 'Could not export the earnings report.' };
  } finally {
    if (reportWindow && !reportWindow.isDestroyed()) {
      reportWindow.destroy();
    }
  }
});

ipcMain.handle('restore-data-from-file', async (event) => {
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(parentWindow, {
    title: 'Restore from backup',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });

  if (canceled || !filePaths?.length) {
    return { canceled: true };
  }

  try {
    const content = await fs.promises.readFile(filePaths[0], 'utf8');
    const data = dataStore.parseDataContent(content);
    if (!data) {
      return { canceled: false, error: 'That file is not a valid SupaSlash backup.' };
    }
    await dataStore.saveDataPipeline(data);
    return { canceled: false, data };
  } catch (err) {
    console.error('Failed to restore data:', err);
    return { canceled: false, error: 'Could not restore from that backup file.' };
  }
});
