const { app, BrowserWindow, ipcMain, screen, nativeImage, dialog, shell, Menu, globalShortcut } = require('electron');
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

if (process.platform === 'darwin' && !app.isPackaged) {
  app.setName('SupaSlash');
}

const { createDataStore } = require('./data-store');
const { createAttachmentStore } = require('./attachment-store');
const { createLicenseStore } = require('./license-store');
const { createLicenseService } = require('./license-service');
const {
  setupAutoUpdater,
  checkForUpdates,
  isQuittingForUpdate,
  isUpdateReadyToInstall,
  isUpdateDownloading,
  waitForInitialUpdateCheck,
} = require('./auto-updater');

const CELEBRATION_DURATION_MS = 3500;

const FOCUS_WIDTH_MARGIN = 40;
const FOCUS_BAR_HEIGHT = 56;
const DESIGN_SPRINT_BAR_HEIGHT = 30;
const DESIGN_SPRINT_SHORTCUT = 'Control+Alt+S';
const DESIGN_SPRINT_FULLSCREEN_SHORTCUT = 'Control+Alt+F';
const FOCUS_DRAWER_GAP = 6;
const FOCUS_DRAWER_BRIDGE = 14;
const FOCUS_DRAWER_SLOT = 180 + 16 + 6 + 8 + 44;
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
let focusWindowDesignSprintActive = false;
let designSprintClickThrough = false;
let designSprintForwardMouse = false;
let designSprintToastCapture = false;
let designSprintShortcutWanted = false;
let timerHideShortcutWanted = false;
let registeredShortcutOwner = null;
let designSprintFullscreenShortcutRegistered = false;
let suppressFocusMoveEvent = false;

const dataStore = createDataStore(app);
const attachmentStore = createAttachmentStore(() => app.getPath('userData'));

const linkPreviewCache = new Map();
const LINK_PREVIEW_TIMEOUT_MS = 5000;
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

function restoreSprintApproachGlowLayer({ force = false } = {}) {
  if (overlayMode !== 'approach' || !isLiveWindow(overlayWindow)) return;
  const overlay = overlayWindow;
  const bounds = getMainDisplay().bounds;
  const current = overlay.getBounds();
  const boundsDiffer = Math.abs(current.x - bounds.x) > 1
    || Math.abs(current.y - bounds.y) > 1
    || Math.abs(current.width - bounds.width) > 1
    || Math.abs(current.height - bounds.height) > 1;
  if (boundsDiffer) overlay.setBounds(bounds);
  overlay.setAlwaysOnTop(true, 'screen-saver');
  if (force || !overlay.isVisible()) overlay.showInactive();
  if (!isLiveWindow(mainWindow) || !isFloatingMode(currentWindowMode)) return;
  // Stay one level above the glow so the bar remains clickable, without
  // dropping back to floating — that reorder hides the glow on macOS.
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  if (force) mainWindow.moveTop();
}

function applyMainWindowStacking() {
  if (!isLiveWindow(mainWindow)) return;
  if (!isFloatingMode(currentWindowMode)) {
    mainWindow.setAlwaysOnTop(false);
    return;
  }
  if (overlayMode === 'approach') {
    restoreSprintApproachGlowLayer();
    return;
  }
  if (focusWindowFullscreen) {
    // screen-saver sits above the menu bar and Dock, so the window can cover both.
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    return;
  }
  mainWindow.setAlwaysOnTop(true, 'floating');
}

function fitFocusWindowToDisplay() {
  if (!isLiveWindow(mainWindow)) return;
  const { x, y, width, height } = getMainDisplay().bounds;
  // Keep focusBarHeight as the timer bar height. Storing the display height
  // here makes the next bar width scale off the screen and crash the GPU.
  mainWindow.setMinimumSize(200, 200);
  mainWindow.setMaximumSize(width, height);
  mainWindow.setResizable(false);
  suppressFocusMoveEvent = true;
  mainWindow.setBounds({ x, y, width, height }, false);
  suppressFocusMoveEvent = false;
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
  if (overlayMode === 'approach') {
    restoreSprintApproachGlowLayer();
    return;
  }
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
    applyMainWindowStacking();
  }
}

function hideSprintApproachGlow({ restoreMainWindow = true } = {}) {
  if (overlayMode !== 'approach') return;
  overlayMode = 'none';
  if (isLiveWindow(overlayWindow)) {
    overlayWindow.webContents.send('overlay-approach-hide');
    overlayWindow.hide();
  }
  if (restoreMainWindow && isLiveWindow(mainWindow) && isFloatingMode(currentWindowMode)) {
    applyMainWindowStacking();
  }
}

function updateSprintApproachGlow(payload) {
  if (!payload || typeof payload !== 'object') {
    hideSprintApproachGlow();
    return;
  }
  const opacity = Number(payload.opacity);
  const tone = payload.tone === 'break' ? 'break' : 'task';
  if (!Number.isFinite(opacity) || opacity <= 0) {
    hideSprintApproachGlow();
    return;
  }
  if (overlayMode === 'expired' || overlayMode === 'celebration') return;

  const overlay = createOverlayWindow();
  overlayMode = 'approach';
  runWhenOverlayReady(overlay, () => {
    if (overlay.isDestroyed() || overlayMode !== 'approach') return;
    overlay.webContents.send('overlay-approach-show', { opacity, tone });
    // Re-assert after every update. A later bar resize used to leave the
    // window "visible" but ordered off screen, so the fade never continued.
    restoreSprintApproachGlowLayer();
  });
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
    applyMainWindowStacking();
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
    if (mode === 'approach') overlayWindow.webContents.send('overlay-approach-hide');
    overlayWindow.hide();
  }
  if (restoreMainWindow && isLiveWindow(mainWindow) && isFloatingMode(currentWindowMode)) {
    applyMainWindowStacking();
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
  if (overlayMode === 'approach') {
    overlay.webContents.send('overlay-approach-hide');
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
    if (suppressFocusMoveEvent || currentWindowMode !== 'focus' || focusWindowDesignSprintActive) return;
    focusPositionCustomized = true;
    notifyFocusPositionChanged();
  });
}

function setDrawerOverlayKeyboardCapture(enabled) {
  const overlay = drawerOverlayWindow;
  if (!isLiveWindow(overlay)) return;

  if (enabled) {
    overlay.setFocusable(true);
    // Bring the tray forward so typing goes here instead of the app behind it.
    if (process.platform === 'darwin') {
      app.focus({ steal: true });
    }
    overlay.show();
    overlay.focus();
    overlay.webContents.focus();
    overlay.webContents.send('drawer-keyboard-ready');
  } else {
    overlay.setFocusable(false);
    // Keep the tray visible without holding keyboard focus.
    if (overlay.isVisible()) {
      overlay.showInactive();
    }
  }
}

function showSessionDrawerOverlay({ drawerWidth, drawerHeight, tasks, sessionTitle, sessionDurationText, addFormOpen, trayAddEnabled }) {
  const bar = getTimerBarBounds();
  if (!bar) return;

  const overlay = createDrawerOverlayWindow();
  const x = bar.x + Math.round((bar.width - drawerWidth) / 2);
  const y = bar.y - drawerHeight - FOCUS_DRAWER_GAP - FOCUS_DRAWER_BRIDGE;
  const height = drawerHeight + FOCUS_DRAWER_BRIDGE;

  const present = () => {
    if (overlay.isDestroyed()) return;
    overlay.setBounds({ x, y, width: drawerWidth, height });
    overlay.webContents.send('drawer-data', {
      tasks,
      sessionTitle,
      sessionDurationText,
      addFormOpen: !!addFormOpen,
      trayAddEnabled: !!trayAddEnabled,
    });
    if (addFormOpen) {
      setDrawerOverlayKeyboardCapture(true);
    } else {
      overlay.setFocusable(false);
      overlay.showInactive();
    }
    overlay.setAlwaysOnTop(true, 'floating', 2);
    if (isLiveWindow(mainWindow) && !focusWindowFullscreen) {
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
  setDrawerOverlayKeyboardCapture(false);
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
  if (saved.mode === 'focus' && incomplete.length > 0) {
    if (saved.designSprintMode) return 'edit';
    return 'focus';
  }
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

function focusMainWindowForDesignSprint() {
  if (!isLiveWindow(mainWindow)) return;
  designSprintClickThrough = false;
  designSprintForwardMouse = false;
  designSprintToastCapture = false;
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.show();
  mainWindow.moveTop();
  if (process.platform === 'darwin') app.focus({ steal: true });
  mainWindow.focus();
}

function syncDesignSprintFullscreenShortcut() {
  const shouldRegister = !!designSprintShortcutWanted;
  if (shouldRegister === designSprintFullscreenShortcutRegistered) return;
  if (designSprintFullscreenShortcutRegistered) {
    globalShortcut.unregister(DESIGN_SPRINT_FULLSCREEN_SHORTCUT);
    designSprintFullscreenShortcutRegistered = false;
  }
  if (!shouldRegister) return;
  const registered = globalShortcut.register(DESIGN_SPRINT_FULLSCREEN_SHORTCUT, () => {
    if (!isLiveWindow(mainWindow)) return;
    focusMainWindowForDesignSprint();
    mainWindow.webContents.send('design-sprint-fullscreen-shortcut');
  });
  if (!registered) {
    console.error('Failed to register shortcut', DESIGN_SPRINT_FULLSCREEN_SHORTCUT);
    return;
  }
  designSprintFullscreenShortcutRegistered = true;
}

function syncAppShortcut() {
  syncDesignSprintFullscreenShortcut();
  const owner = designSprintShortcutWanted ? 'sprint' : timerHideShortcutWanted ? 'hide' : null;
  if (owner === registeredShortcutOwner) return true;
  if (registeredShortcutOwner) {
    globalShortcut.unregister(DESIGN_SPRINT_SHORTCUT);
    registeredShortcutOwner = null;
  }
  if (!owner) return true;
  const registered = globalShortcut.register(DESIGN_SPRINT_SHORTCUT, () => {
    if (!isLiveWindow(mainWindow)) return;
    if (registeredShortcutOwner === 'hide') {
      mainWindow.webContents.send('focus-window-restore-request');
      return;
    }
    focusMainWindowForDesignSprint();
    mainWindow.webContents.send('design-sprint-shortcut');
  });
  if (!registered) {
    console.error('Failed to register shortcut', DESIGN_SPRINT_SHORTCUT, owner);
    return false;
  }
  registeredShortcutOwner = owner;
  return true;
}

function setDesignSprintShortcutEnabled(enabled) {
  designSprintShortcutWanted = !!enabled;
  return syncAppShortcut();
}

function setTimerHideShortcutEnabled(enabled) {
  timerHideShortcutWanted = !!enabled;
  return syncAppShortcut();
}

function clearAppShortcuts() {
  designSprintShortcutWanted = false;
  timerHideShortcutWanted = false;
  syncAppShortcut();
}

function syncDesignSprintMouseIgnore() {
  if (!isLiveWindow(mainWindow)) return;
  if (!designSprintClickThrough || designSprintToastCapture) {
    mainWindow.setIgnoreMouseEvents(false);
    return;
  }
  if (designSprintForwardMouse) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    return;
  }
  mainWindow.setIgnoreMouseEvents(true);
}

function applyDesignSprintInteraction({
  clickThrough = false,
  shortcut = false,
  forwardMouse = false,
  blurIfFocused = false,
} = {}) {
  const shortcutReady = setDesignSprintShortcutEnabled(!!shortcut);
  const passClicks = !!clickThrough;
  const forward = passClicks && !!forwardMouse;
  const wasPassing = designSprintClickThrough;

  if (!passClicks || !forward) designSprintToastCapture = false;
  designSprintClickThrough = passClicks;
  designSprintForwardMouse = forward;

  if (!isLiveWindow(mainWindow)) return shortcutReady;

  if (!passClicks) {
    if (wasPassing) focusMainWindowForDesignSprint();
    else mainWindow.setIgnoreMouseEvents(false);
    designSprintClickThrough = false;
    designSprintForwardMouse = false;
    designSprintToastCapture = false;
    return shortcutReady;
  }

  syncDesignSprintMouseIgnore();
  if (!wasPassing || (blurIfFocused && mainWindow.isFocused())) mainWindow.blur();
  return shortcutReady;
}

function setDesignSprintToastCapture(capturing) {
  if (!isLiveWindow(mainWindow)) return;
  const next = !!capturing && designSprintClickThrough && designSprintForwardMouse;
  if (next === designSprintToastCapture) return;
  designSprintToastCapture = next;
  syncDesignSprintMouseIgnore();
}

function applyFocusWindowChrome({ designSprint = false } = {}) {
  if (!isLiveWindow(mainWindow) || process.platform !== 'darwin') return;
  if (typeof mainWindow.setHasShadow === 'function') {
    mainWindow.setHasShadow(!designSprint);
  }
  if (typeof mainWindow.setRoundedCorners === 'function') {
    mainWindow.setRoundedCorners(!designSprint);
  }
}

function resizeFocusWindow({
  width: contentWidth,
  height: contentHeight,
  x,
  y,
  preservePosition,
  fullscreen,
  designSprint,
  edge,
  overlay,
} = {}) {
  if (!isLiveWindow(mainWindow) || currentWindowMode !== 'focus') return;

  if (designSprint && fullscreen) {
    focusWindowDesignSprintActive = true;
    applyFocusWindowChrome({ designSprint: true });
    focusWindowFullscreen = true;
    focusPositionCustomized = false;
    // Leave the native window transparent. An opaque black background sticks
    // on macOS until the next click, which hides the docked bar's fade.
    mainWindow.setBackgroundColor('rgba(0, 0, 0, 0)');
    applyMainWindowStacking();
    fitFocusWindowToDisplay();
    mainWindow.show();
    restoreSprintApproachGlowLayer({ force: true });
    return;
  }

  if (designSprint) {
    focusWindowDesignSprintActive = true;
    applyFocusWindowChrome({ designSprint: true });
    focusWindowFullscreen = false;
    applyMainWindowStacking();
    const display = getMainDisplay();
    const { x: areaX, y: areaY, width: areaWidth, height: areaHeight } = display.workArea;
    const dock = edge === 'top' || edge === 'left' || edge === 'right' ? edge : 'bottom';
    const vertical = !overlay && (dock === 'left' || dock === 'right');
    const extent = Math.max(DESIGN_SPRINT_BAR_HEIGHT, Math.ceil(contentHeight || DESIGN_SPRINT_BAR_HEIGHT));
    focusPositionCustomized = false;
    mainWindow.setResizable(false);
    mainWindow.setBackgroundColor('rgba(0, 0, 0, 0)');
    // Unlock the previous edge's max before the bounds change axes.
    mainWindow.setMinimumSize(1, 1);
    mainWindow.setMaximumSize(Math.max(areaWidth, extent), Math.max(areaHeight, extent));
    suppressFocusMoveEvent = true;
    if (vertical) {
      const width = Math.min(extent, areaWidth);
      focusBarHeight = DESIGN_SPRINT_BAR_HEIGHT;
      mainWindow.setBounds({
        x: dock === 'left' ? areaX : areaX + areaWidth - width,
        y: areaY,
        width,
        height: areaHeight,
      }, false);
      mainWindow.setMinimumSize(width, 200);
      mainWindow.setMaximumSize(width, areaHeight);
    } else {
      const height = overlay ? extent : Math.min(extent, areaHeight);
      focusBarHeight = height;
      const originY = !overlay && dock === 'top' ? areaY : areaY + areaHeight - height;
      mainWindow.setBounds({
        x: areaX,
        y: originY,
        width: areaWidth,
        height,
      }, false);
      mainWindow.setMinimumSize(400, height);
      mainWindow.setMaximumSize(areaWidth, height);
    }
    suppressFocusMoveEvent = false;
    mainWindow.webContents.invalidate();
    mainWindow.show();
    restoreSprintApproachGlowLayer({ force: true });
    return;
  }

  focusWindowDesignSprintActive = false;
  applyFocusWindowChrome({ designSprint: false });

  if (fullscreen) {
    focusWindowFullscreen = true;
    focusPositionCustomized = false;
    mainWindow.setBackgroundColor('#00000000');
    applyMainWindowStacking();
    fitFocusWindowToDisplay();
    restoreSprintApproachGlowLayer({ force: true });
    return;
  }

  focusWindowFullscreen = false;
  applyMainWindowStacking();
  const height = Math.max(1, Math.ceil(contentHeight || focusBarHeight));
  focusBarHeight = height;
  const minWidth = getFocusMinWidth();
  const maxWidth = getFocusMaxWidth();
  const width = Math.max(minWidth, Math.min(Math.ceil(contentWidth || minWidth), maxWidth));
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
  restoreSprintApproachGlowLayer({ force: true });
}

function isFloatingMode(mode) {
  return mode === 'focus' || mode === 'done';
}

function applyWindowPresentation(mode) {
  if (!isLiveWindow(mainWindow)) return;
  const floating = isFloatingMode(mode);

  mainWindow.setVisibleOnAllWorkspaces(floating, floating ? VISIBLE_ON_ALL_WORKSPACES_OPTS : undefined);
  applyMainWindowStacking();

  if (process.platform === 'darwin') {
    mainWindow.setWindowButtonVisibility(!floating);
  }
  mainWindow.setMaximizable(false);

  // setVisibleOnAllWorkspaces can drop the window back into the work area.
  if (mode === 'focus' && focusWindowFullscreen) {
    fitFocusWindowToDisplay();
  }
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
    if (options.designSprint) {
      resizeFocusWindow({
        designSprint: true,
        fullscreen: !!options.fullscreen,
        height: options.height || DESIGN_SPRINT_BAR_HEIGHT,
        edge: options.edge,
        overlay: !!options.overlay,
      });
    } else if (options.fullscreen) {
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
    focusWindowFullscreen = false;
    focusWindowDesignSprintActive = false;
    applyFocusWindowChrome({ designSprint: false });
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
        {
          label: "What's New",
          click: () => {
            if (isLiveWindow(mainWindow)) {
              mainWindow.webContents.send('open-whats-new');
            }
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
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
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
    roundedCorners: false,
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
      backgroundThrottling: false,
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
    clearAppShortcuts();
    designSprintClickThrough = false;
    designSprintForwardMouse = false;
    designSprintToastCapture = false;
    destroyOverlayWindow();
    destroyDrawerOverlayWindow();
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setDockIcon();
  setupAppMenu();
  createWindow();
  setupAutoUpdater({
    notifyRenderer: (channel) => {
      if (isLiveWindow(mainWindow)) {
        mainWindow.webContents.send(channel);
      }
    },
  });
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
function requestRendererTimerFlush() {
  if (!isLiveWindow(mainWindow)) return Promise.resolve();
  return new Promise((resolve) => {
    const onFlushed = () => {
      clearTimeout(timeout);
      resolve();
    };
    const timeout = setTimeout(() => {
      ipcMain.removeListener('timer-progress-flushed', onFlushed);
      resolve();
    }, 1500);
    ipcMain.once('timer-progress-flushed', onFlushed);
    try {
      mainWindow.webContents.send('flush-timer-progress');
    } catch {
      clearTimeout(timeout);
      ipcMain.removeListener('timer-progress-flushed', onFlushed);
      resolve();
    }
  });
}

app.on('before-quit', (event) => {
  clearAppShortcuts();
  if (isQuitting || isQuittingForUpdate()) return;
  event.preventDefault();
  isQuitting = true;
  requestRendererTimerFlush()
    .catch(() => {})
    .then(() => dataStore.flushDocumentsBackup())
    .catch((err) => {
      console.error('Failed to flush Documents backup on quit:', err);
    })
    .finally(() => {
      app.quit();
    });
});

ipcMain.handle('check-for-updates', () => checkForUpdates({ manual: true }));

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('is-packaged', () => app.isPackaged);

ipcMain.handle('is-update-ready-to-install', () => isUpdateReadyToInstall());

ipcMain.handle('is-update-downloading', () => isUpdateDownloading());

ipcMain.handle('wait-for-initial-update-check', () => waitForInitialUpdateCheck());

ipcMain.handle('set-window-mode', (_event, mode, options = {}) => {
  applyWindowSize(mode, options);
  return true;
});

ipcMain.handle('set-window-buttons-visible', (_event, visible) => {
  if (process.platform !== 'darwin' || !isLiveWindow(mainWindow)) return false;
  // Floating focus/done modes always keep traffic lights hidden.
  if (isFloatingMode(currentWindowMode)) {
    mainWindow.setWindowButtonVisibility(false);
    return false;
  }
  mainWindow.setWindowButtonVisibility(!!visible);
  return !!visible;
});

ipcMain.handle('set-focus-width', (_event, contentWidth) => {
  resizeFocusWindow({ width: contentWidth, height: focusBarHeight, preservePosition: focusPositionCustomized });
  return true;
});

ipcMain.handle('set-design-sprint-interaction', (_event, payload = {}) => (
  applyDesignSprintInteraction(payload)
));

ipcMain.on('set-design-sprint-toast-capture', (_event, capturing) => {
  setDesignSprintToastCapture(capturing);
});

ipcMain.handle('get-cursor-in-window', () => {
  if (!isLiveWindow(mainWindow)) return null;
  const point = screen.getCursorScreenPoint();
  const bounds = mainWindow.getContentBounds();
  return {
    x: point.x - bounds.x,
    y: point.y - bounds.y,
  };
});

ipcMain.handle('set-focus-dimensions', (_event, dimensions = {}) => {
  if (dimensions.designSprint) {
    focusPositionCustomized = false;
    resizeFocusWindow({
      designSprint: true,
      fullscreen: !!dimensions.fullscreen,
      height: dimensions.height,
      edge: dimensions.edge,
      overlay: !!dimensions.overlay,
    });
    return true;
  }
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
    designSprint: false,
  });
  return true;
});

ipcMain.handle('set-timer-bar-hide-shortcut', (_event, enabled) => (
  setTimerHideShortcutEnabled(enabled)
));

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
  applyMainWindowStacking();
  if (focusWindowFullscreen) fitFocusWindowToDisplay();
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
      addFormOpen: !!payload.addFormOpen,
      trayAddEnabled: !!payload.trayAddEnabled,
    });
    if (payload.drawerWidth && payload.drawerHeight) {
      const bar = getTimerBarBounds();
      if (bar) {
        const x = bar.x + Math.round((bar.width - payload.drawerWidth) / 2);
        const y = bar.y - payload.drawerHeight - FOCUS_DRAWER_GAP - FOCUS_DRAWER_BRIDGE;
        const height = payload.drawerHeight + FOCUS_DRAWER_BRIDGE;
        drawerOverlayWindow.setBounds({ x, y, width: payload.drawerWidth, height });
      }
    }
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

ipcMain.on('drawer-add-task', (_event, payload) => {
  if (isLiveWindow(mainWindow)) mainWindow.webContents.send('drawer-add-task', payload);
});

ipcMain.on('drawer-add-form-open', (_event, open) => {
  setDrawerOverlayKeyboardCapture(!!open);
  if (isLiveWindow(mainWindow)) mainWindow.webContents.send('drawer-add-form-open', open);
});

ipcMain.handle('set-screen-overlay', (_event, visible) => {
  if (visible) showScreenOverlay();
  else hideScreenOverlay();
  return true;
});

ipcMain.handle('set-sprint-approach-glow', (_event, payload) => {
  updateSprintApproachGlow(payload);
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
ipcMain.handle('save-data', (_event, data, options) => {
  dataStore.saveDataAsync(data, options);
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

ipcMain.handle('export-text-file', async (event, { content, defaultFileName, dialogTitle, filters } = {}) => {
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(parentWindow, {
      title: dialogTitle || 'Export',
      defaultPath: defaultFileName || 'export.txt',
      filters: Array.isArray(filters) && filters.length
        ? filters
        : [{ name: 'Text', extensions: ['txt'] }],
    });

    if (canceled || !filePath) {
      return { canceled: true };
    }

    await fs.promises.writeFile(filePath, content ?? '', 'utf8');
    return { canceled: false, filePath };
  } catch (err) {
    console.error('Failed to export text file:', err);
    return { canceled: false, error: 'Could not export the file.' };
  }
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
    const restored = dataStore.importRestoredData(data, filePaths[0]);
    return { canceled: false, data: restored };
  } catch (err) {
    console.error('Failed to restore data:', err);
    return { canceled: false, error: 'Could not restore from that backup file.' };
  }
});

ipcMain.handle('pick-task-attachments', async (event) => {
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(parentWindow, {
    title: 'Add attachments',
    properties: ['openFile', 'multiSelections'],
  });
  if (canceled || !filePaths?.length) {
    return { canceled: true, attachments: [] };
  }
  try {
    const attachments = await attachmentStore.pickAndCopyFiles(filePaths);
    return { canceled: false, attachments };
  } catch (err) {
    console.error('Failed to pick task attachments:', err);
    return { canceled: false, error: 'Could not add attachments.', attachments: [] };
  }
});

ipcMain.handle('open-task-attachment', async (_event, attachment) => {
  if (!attachment?.id || !attachment?.storedName) {
    return { error: 'Invalid attachment.' };
  }
  const filePath = attachmentStore.getAttachmentPath(attachment);
  if (!fs.existsSync(filePath)) {
    return { error: 'Attachment file not found.' };
  }
  const result = await shell.openPath(filePath);
  return result ? { error: result } : { ok: true };
});

ipcMain.handle('remove-task-attachment-file', async (_event, attachment) => {
  if (!attachment?.id) return { ok: true };
  await attachmentStore.removeAttachmentFile(attachment);
  return { ok: true };
});

ipcMain.handle('copy-task-attachments', async (_event, attachments) => {
  try {
    const copies = await attachmentStore.copyAttachments(attachments || []);
    return { attachments: copies };
  } catch (err) {
    console.error('Failed to copy task attachments:', err);
    return { error: 'Could not copy attachments.', attachments: [] };
  }
});

ipcMain.handle('copy-attachments-for-template', async (_event, attachments) => {
  try {
    const copies = await attachmentStore.copyAttachmentsForTemplate(attachments || []);
    return { attachments: copies };
  } catch (err) {
    console.error('Failed to copy template attachments:', err);
    return { error: 'Could not copy attachments for template.', attachments: [] };
  }
});

ipcMain.handle('clone-template-attachments', async (_event, attachments) => {
  try {
    const copies = await attachmentStore.cloneTemplateAttachments(attachments || []);
    return { attachments: copies };
  } catch (err) {
    console.error('Failed to clone template attachments:', err);
    return { error: 'Could not clone template attachments.', attachments: [] };
  }
});

ipcMain.handle('open-external-url', async (_event, url) => {
  if (!url || typeof url !== 'string') return { error: 'Invalid URL.' };
  try {
    await shell.openExternal(url);
    return { ok: true };
  } catch (err) {
    console.error('Failed to open external URL:', err);
    return { error: 'Could not open link.' };
  }
});

function parseLinkPreviewMeta(html, url) {
  const getMeta = (property) => {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
      new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    return '';
  };

  const title = getMeta('og:title')
    || getMeta('twitter:title')
    || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim();
  const description = getMeta('og:description') || getMeta('twitter:description') || getMeta('description');
  let image = getMeta('og:image') || getMeta('twitter:image');
  if (image && !/^https?:\/\//i.test(image)) {
    try {
      image = new URL(image, url).href;
    } catch {
      image = '';
    }
  }

  return {
    url,
    title: title || url,
    description,
    image,
  };
}

ipcMain.handle('fetch-link-preview', async (_event, url) => {
  if (!url || typeof url !== 'string') {
    return { url, error: 'Invalid URL.' };
  }
  if (linkPreviewCache.has(url)) {
    return linkPreviewCache.get(url);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LINK_PREVIEW_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SupaSlash/1.0 LinkPreview' },
      redirect: 'follow',
    });
    if (!response.ok) {
      const result = { url, error: 'Could not load preview.' };
      linkPreviewCache.set(url, result);
      return result;
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      const result = { url, title: url, description: '', image: '' };
      linkPreviewCache.set(url, result);
      return result;
    }
    const html = await response.text();
    const result = parseLinkPreviewMeta(html.slice(0, 200000), url);
    linkPreviewCache.set(url, result);
    return result;
  } catch (err) {
    const result = { url, error: 'Could not load preview.' };
    linkPreviewCache.set(url, result);
    return result;
  } finally {
    clearTimeout(timeout);
  }
});
