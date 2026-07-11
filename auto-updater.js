const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');

const GITHUB_OWNER = 'champkiddesign';
const GITHUB_REPO = 'supaslash';
const UPDATER_CACHE_DIR_NAME = 'supaslash-updater';
const LOCAL_UPDATE_FEED = process.env.SUPASLASH_UPDATE_TEST_FEED;

const UPDATE_WINDOW_SIZES = {
  prompt: { width: 400, height: 340 },
  promptCompact: { width: 400, height: 300 },
  progress: { width: 400, height: 240 },
};

let quittingForUpdate = false;
let manualCheckPending = false;
let isDownloading = false;
let downloadPromptOpen = false;
let installPromptOpen = false;
let updateReadyToInstall = false;
let updateUiWindow = null;
let pendingUpdateCheck = null;
let updaterLogPath = null;
let updateWindowIpcReady = false;
let pendingDialogResolve = null;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.allowPrerelease = true;

function writeUpdaterLog(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  if (!updaterLogPath) return;
  try {
    fs.appendFileSync(updaterLogPath, `${line}\n`);
  } catch (err) {
    console.error('Failed to write updater log:', err);
  }
}

function buildUpdateConfigYaml() {
  if (LOCAL_UPDATE_FEED) {
    return [
      'provider: generic',
      `url: ${LOCAL_UPDATE_FEED}`,
      `updaterCacheDirName: ${UPDATER_CACHE_DIR_NAME}`,
      '',
    ].join('\n');
  }

  return [
    'provider: github',
    `owner: ${GITHUB_OWNER}`,
    `repo: ${GITHUB_REPO}`,
    `updaterCacheDirName: ${UPDATER_CACHE_DIR_NAME}`,
    '',
  ].join('\n');
}

function ensureUpdateConfigOnDisk() {
  const bundledConfigPath = path.join(process.resourcesPath, 'app-update.yml');
  if (fs.existsSync(bundledConfigPath)) {
    autoUpdater.updateConfigPath = bundledConfigPath;
    writeUpdaterLog(`Using bundled update config: ${bundledConfigPath}`);
    return;
  }

  const fallbackConfigPath = path.join(app.getPath('userData'), 'app-update.yml');
  try {
    fs.mkdirSync(path.dirname(fallbackConfigPath), { recursive: true });
    fs.writeFileSync(fallbackConfigPath, buildUpdateConfigYaml());
    autoUpdater.updateConfigPath = fallbackConfigPath;
    writeUpdaterLog(`Created fallback update config: ${fallbackConfigPath}`);
  } catch (err) {
    writeUpdaterLog(`Failed to create fallback update config: ${err.message}`);
  }
}

function configureFeedURL() {
  if (LOCAL_UPDATE_FEED) {
    writeUpdaterLog(`Using local update feed: ${LOCAL_UPDATE_FEED}`);
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: LOCAL_UPDATE_FEED,
    });
    return;
  }

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
  });
}

function configureUpdaterLogging() {
  autoUpdater.logger = {
    info: (...args) => writeUpdaterLog(args.join(' ')),
    warn: (...args) => writeUpdaterLog(`WARN ${args.join(' ')}`),
    error: (...args) => writeUpdaterLog(`ERROR ${args.join(' ')}`),
    debug: (...args) => writeUpdaterLog(`DEBUG ${args.join(' ')}`),
  };
}

function isQuittingForUpdate() {
  return quittingForUpdate;
}

function clearDockBadge() {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setBadge('');
  }
}

function setDockBadge(text) {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setBadge(text);
  }
}

function ensureUpdateWindowIpc() {
  if (updateWindowIpcReady) return;
  updateWindowIpcReady = true;

  ipcMain.on('update-window:response', (event, buttonIndex) => {
    const resolve = pendingDialogResolve;
    pendingDialogResolve = null;
    if (typeof resolve === 'function') {
      resolve(buttonIndex);
    }

    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.close();
    }
  });
}

function getUpdateHtmlPath() {
  return path.join(__dirname, 'update-window.html');
}

function getUpdatePreloadPath() {
  return path.join(__dirname, 'update-preload.js');
}

function closeUpdateUiWindow() {
  if (updateUiWindow && !updateUiWindow.isDestroyed()) {
    updateUiWindow.close();
  }
  updateUiWindow = null;
  pendingDialogResolve = null;
}

function createUpdateUiWindow(sizeKey = 'prompt') {
  const size = UPDATE_WINDOW_SIZES[sizeKey] || UPDATE_WINDOW_SIZES.prompt;

  const window = new BrowserWindow({
    width: size.width,
    height: size.height,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    frame: false,
    backgroundColor: '#0a0a0a',
    title: 'SupaSlash Update',
    ...(process.platform === 'darwin' ? {
      titleBarStyle: 'hidden',
    } : {}),
    webPreferences: {
      preload: getUpdatePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadFile(getUpdateHtmlPath());
  return window;
}

function sendUpdateWindowPayload(window, payload) {
  const deliver = () => {
    if (window.isDestroyed()) return;
    window.webContents.send('update-window:init', payload);
    window.show();
    window.focus();
  };

  if (window.webContents.isLoading()) {
    window.webContents.once('did-finish-load', deliver);
  } else {
    deliver();
  }
}

function showStyledPrompt({
  title,
  message,
  detail = '',
  buttons,
  sizeKey = 'prompt',
}) {
  ensureUpdateWindowIpc();
  closeUpdateUiWindow();

  return new Promise((resolve) => {
    const window = createUpdateUiWindow(sizeKey);
    updateUiWindow = window;

    pendingDialogResolve = (buttonIndex) => {
      resolve(buttonIndex);
    };

    window.on('closed', () => {
      if (pendingDialogResolve) {
        const cancelIndex = Math.max(0, buttons.findIndex((button) => button.cancel));
        pendingDialogResolve = null;
        resolve(cancelIndex >= 0 ? cancelIndex : -1);
      }
      if (updateUiWindow === window) {
        updateUiWindow = null;
      }
    });

    sendUpdateWindowPayload(window, {
      mode: 'prompt',
      title,
      message,
      detail,
      buttons,
    });
  });
}

function openProgressWindow() {
  ensureUpdateWindowIpc();
  closeUpdateUiWindow();

  const window = createUpdateUiWindow('progress');
  updateUiWindow = window;

  window.on('closed', () => {
    if (updateUiWindow === window) {
      updateUiWindow = null;
    }
  });

  sendUpdateWindowPayload(window, {
    mode: 'progress',
    percent: 0,
    status: 'Starting…',
  });
}

function updateProgressWindow(percent) {
  if (!updateUiWindow || updateUiWindow.isDestroyed()) return;
  const rounded = Math.max(0, Math.min(100, Math.round(percent)));
  updateUiWindow.webContents.send('update-window:progress', {
    percent: rounded,
    status: `${rounded}% complete`,
  });
}

async function showDownloadError(err) {
  closeUpdateUiWindow();
  clearDockBadge();
  isDownloading = false;

  writeUpdaterLog(`Download failed: ${err?.message || err}`);

  await showStyledPrompt({
    title: 'Download Failed',
    message: 'Could not download the update.',
    detail: `${err?.message || String(err)}\n\nLog: ${updaterLogPath || 'console'}`,
    buttons: [
      { label: 'OK', primary: true },
    ],
    sizeKey: 'prompt',
  });
}

async function promptDownload(info) {
  const response = await showStyledPrompt({
    title: 'Update Available',
    message: `SupaSlash ${info.version} is available.`,
    detail: `You are on version ${app.getVersion()}. Download and install the update now?`,
    buttons: [
      { label: 'Download', primary: true },
      { label: 'Later', cancel: true },
    ],
    sizeKey: 'promptCompact',
  });

  if (response !== 0) return;

  isDownloading = true;
  openProgressWindow();
  setDockBadge('…');
  if (process.platform === 'darwin' && app.dock) {
    app.dock.bounce('informational');
  }

  writeUpdaterLog(`Starting download for ${info.version}`);

  try {
    const cancellationToken = pendingUpdateCheck?.cancellationToken;
    if (cancellationToken) {
      await autoUpdater.downloadUpdate(cancellationToken);
    } else {
      await autoUpdater.downloadUpdate();
    }
    writeUpdaterLog('downloadUpdate promise resolved');
  } catch (err) {
    console.error('Failed to start update download:', err);
    await showDownloadError(err);
  }
}

async function runQuitAndInstall() {
  quittingForUpdate = true;
  writeUpdaterLog('Restarting to install update');

  setImmediate(() => {
    app.removeAllListeners('window-all-closed');

    BrowserWindow.getAllWindows().forEach((window) => {
      if (window.isDestroyed()) return;
      window.removeAllListeners('close');
      window.close();
    });

    autoUpdater.quitAndInstall(false, true);
  });
}

async function promptInstall(info) {
  if (installPromptOpen || quittingForUpdate) return;
  installPromptOpen = true;
  updateReadyToInstall = true;

  closeUpdateUiWindow();
  clearDockBadge();
  isDownloading = false;
  pendingUpdateCheck = null;

  writeUpdaterLog(`Update downloaded: ${info.version}`);

  await new Promise((resolve) => setTimeout(resolve, 150));

  try {
    const response = await showStyledPrompt({
      title: 'Update Ready',
      message: `SupaSlash ${info.version} has been downloaded.`,
      detail: 'Restart now to install the update?',
      buttons: [
        { label: 'Restart Now', primary: true },
        { label: 'Later', cancel: true },
      ],
      sizeKey: 'promptCompact',
    });

    if (response === 0) {
      await runQuitAndInstall();
    }
  } finally {
    installPromptOpen = false;
  }
}

async function showNoUpdatesDialog() {
  await showStyledPrompt({
    title: 'No Updates',
    message: 'You are on the latest version.',
    detail: `SupaSlash ${app.getVersion()} is up to date.`,
    buttons: [
      { label: 'OK', primary: true },
    ],
    sizeKey: 'promptCompact',
  });
}

async function checkForUpdates({ manual = false } = {}) {
  if (!app.isPackaged) {
    if (manual) {
      await showStyledPrompt({
        title: 'Check for Updates',
        message: 'Updates are only checked in installed builds.',
        buttons: [
          { label: 'OK', primary: true },
        ],
        sizeKey: 'promptCompact',
      });
    }
    return null;
  }

  manualCheckPending = manual;
  writeUpdaterLog(`Checking for updates (manual=${manual})`);

  try {
    const result = await autoUpdater.checkForUpdates();
    if (result?.isUpdateAvailable) {
      pendingUpdateCheck = result;
      writeUpdaterLog(`Update available: ${result.updateInfo.version}`);
    } else {
      pendingUpdateCheck = null;
      writeUpdaterLog('No update available');
    }
    return result;
  } catch (err) {
    pendingUpdateCheck = null;
    manualCheckPending = false;
    writeUpdaterLog(`Update check failed: ${err.message}`);
    if (manual) {
      await showStyledPrompt({
        title: 'Update Check Failed',
        message: 'Could not check for updates.',
        detail: err.message,
        buttons: [
          { label: 'OK', primary: true },
        ],
      });
    }
    return null;
  }
}

function setupAutoUpdater() {
  if (!app.isPackaged) return;

  ensureUpdateWindowIpc();

  try {
    updaterLogPath = path.join(app.getPath('logs'), 'updater.log');
    fs.mkdirSync(path.dirname(updaterLogPath), { recursive: true });
  } catch (err) {
    console.error('Failed to initialize updater log path:', err);
  }

  configureUpdaterLogging();
  ensureUpdateConfigOnDisk();
  configureFeedURL();
  writeUpdaterLog(`Auto-updater ready for version ${app.getVersion()}`);

  autoUpdater.on('checking-for-update', () => {
    writeUpdaterLog('checking-for-update');
  });

  autoUpdater.on('update-available', (info) => {
    manualCheckPending = false;
    if (updateReadyToInstall || quittingForUpdate) return;
    if (downloadPromptOpen || isDownloading) return;
    downloadPromptOpen = true;
    promptDownload(info)
      .catch((err) => {
        writeUpdaterLog(`Failed to prompt for update download: ${err.message}`);
      })
      .finally(() => {
        downloadPromptOpen = false;
      });
  });

  autoUpdater.on('update-not-available', () => {
    if (manualCheckPending) {
      manualCheckPending = false;
      showNoUpdatesDialog().catch((err) => {
        writeUpdaterLog(`Failed to show no-updates dialog: ${err.message}`);
      });
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    writeUpdaterLog(`download-progress ${Math.round(progress.percent)}%`);
    updateProgressWindow(progress.percent);
    setDockBadge(String(Math.round(progress.percent)));
  });

  autoUpdater.on('update-downloaded', (info) => {
    promptInstall(info).catch((err) => {
      writeUpdaterLog(`Failed to prompt for update install: ${err.message}`);
    });
  });

  autoUpdater.on('error', (err) => {
    writeUpdaterLog(`Auto-updater error: ${err.message || err}`);
    if (isDownloading) {
      showDownloadError(err).catch((dialogErr) => {
        writeUpdaterLog(`Failed to show download error dialog: ${dialogErr.message}`);
      });
    }
  });

  checkForUpdates().catch((err) => {
    writeUpdaterLog(`Initial update check failed: ${err.message}`);
  });
}

module.exports = {
  setupAutoUpdater,
  checkForUpdates,
  isQuittingForUpdate,
};
