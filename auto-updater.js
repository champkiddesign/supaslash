const { app, dialog, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');

const GITHUB_OWNER = 'champkiddesign';
const GITHUB_REPO = 'supaslash';
const LOCAL_UPDATE_FEED = process.env.SUPASLASH_UPDATE_TEST_FEED;

let quittingForUpdate = false;
let manualCheckPending = false;
let isDownloading = false;
let downloadPromptOpen = false;
let progressWindow = null;
let pendingUpdateCheck = null;
let updaterLogPath = null;

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

function getParentWindow() {
  return BrowserWindow.getAllWindows().find((window) => !window.isDestroyed() && window !== progressWindow) || null;
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

function closeProgressWindow() {
  if (progressWindow && !progressWindow.isDestroyed()) {
    progressWindow.close();
  }
  progressWindow = null;
}

function openProgressWindow() {
  closeProgressWindow();

  progressWindow = new BrowserWindow({
    width: 360,
    height: 140,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'Downloading Update',
    show: false,
    parent: getParentWindow() || undefined,
    modal: Boolean(getParentWindow()),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font: 13px -apple-system, BlinkMacSystemFont, sans-serif;
        margin: 24px;
        color: #111;
      }
      .bar {
        height: 10px;
        background: #e5e5e5;
        border-radius: 5px;
        overflow: hidden;
      }
      .fill {
        height: 100%;
        width: 0;
        background: #007aff;
        transition: width 0.2s ease;
      }
      p {
        margin: 0 0 12px;
      }
    </style>
  </head>
  <body>
    <p>Downloading update…</p>
    <div class="bar"><div class="fill" id="fill"></div></div>
    <p id="status">Starting…</p>
  </body>
</html>`;

  progressWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  progressWindow.once('ready-to-show', () => {
    if (progressWindow && !progressWindow.isDestroyed()) {
      progressWindow.show();
    }
  });
}

function updateProgressWindow(percent) {
  if (!progressWindow || progressWindow.isDestroyed()) return;
  const rounded = Math.max(0, Math.min(100, Math.round(percent)));
  progressWindow.webContents.executeJavaScript(
    `document.getElementById('fill').style.width='${rounded}%';document.getElementById('status').textContent='${rounded}% complete';`
  ).catch(() => {});
}

async function showDownloadError(err) {
  closeProgressWindow();
  clearDockBadge();
  isDownloading = false;

  writeUpdaterLog(`Download failed: ${err?.message || err}`);

  await dialog.showMessageBox(getParentWindow() ?? undefined, {
    type: 'error',
    title: 'Download Failed',
    message: 'Could not download the update.',
    detail: `${err?.message || String(err)}\n\nLog: ${updaterLogPath || 'console'}`,
  });
}

async function promptDownload(info) {
  const { response } = await dialog.showMessageBox(getParentWindow() ?? undefined, {
    type: 'info',
    title: 'Update Available',
    message: `SupaSlash ${info.version} is available.`,
    detail: 'You are on version ' + app.getVersion() + '. Download and install the update now?',
    buttons: ['Download', 'Later'],
    defaultId: 0,
    cancelId: 1,
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

async function promptInstall(info) {
  closeProgressWindow();
  clearDockBadge();
  isDownloading = false;
  pendingUpdateCheck = null;

  writeUpdaterLog(`Update downloaded: ${info.version}`);

  const { response } = await dialog.showMessageBox(getParentWindow() ?? undefined, {
    type: 'info',
    title: 'Update Ready',
    message: `SupaSlash ${info.version} has been downloaded.`,
    detail: 'Restart now to install the update?',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
    cancelId: 1,
  });

  if (response === 0) {
    quittingForUpdate = true;
    writeUpdaterLog('Restarting to install update');
    autoUpdater.quitAndInstall();
  }
}

async function showNoUpdatesDialog() {
  await dialog.showMessageBox(getParentWindow() ?? undefined, {
    type: 'info',
    title: 'No Updates',
    message: 'You are on the latest version.',
    detail: `SupaSlash ${app.getVersion()} is up to date.`,
  });
}

async function checkForUpdates({ manual = false } = {}) {
  if (!app.isPackaged) {
    if (manual) {
      await dialog.showMessageBox(getParentWindow() ?? undefined, {
        type: 'info',
        title: 'Check for Updates',
        message: 'Updates are only checked in installed builds.',
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
      await dialog.showMessageBox(getParentWindow() ?? undefined, {
        type: 'error',
        title: 'Update Check Failed',
        message: 'Could not check for updates.',
        detail: err.message,
      });
    }
    return null;
  }
}

function setupAutoUpdater() {
  if (!app.isPackaged) return;

  try {
    updaterLogPath = path.join(app.getPath('logs'), 'updater.log');
    fs.mkdirSync(path.dirname(updaterLogPath), { recursive: true });
  } catch (err) {
    console.error('Failed to initialize updater log path:', err);
  }

  configureUpdaterLogging();
  configureFeedURL();
  writeUpdaterLog(`Auto-updater ready for version ${app.getVersion()}`);

  autoUpdater.on('checking-for-update', () => {
    writeUpdaterLog('checking-for-update');
  });

  autoUpdater.on('update-available', (info) => {
    manualCheckPending = false;
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
