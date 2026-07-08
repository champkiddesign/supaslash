const { app, dialog, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');

const GITHUB_OWNER = 'champkiddesign';
const GITHUB_REPO = 'supaslash';

let quittingForUpdate = false;
let manualCheckPending = false;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowPrerelease = true;

autoUpdater.setFeedURL({
  provider: 'github',
  owner: GITHUB_OWNER,
  repo: GITHUB_REPO,
});

function getParentWindow() {
  return BrowserWindow.getAllWindows().find((window) => !window.isDestroyed()) || null;
}

function isQuittingForUpdate() {
  return quittingForUpdate;
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

  if (response === 0) {
    await autoUpdater.downloadUpdate();
  }
}

async function promptInstall(info) {
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

  try {
    return await autoUpdater.checkForUpdates();
  } catch (err) {
    manualCheckPending = false;
    console.error('Failed to check for updates:', err);
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

  autoUpdater.on('update-available', (info) => {
    manualCheckPending = false;
    promptDownload(info).catch((err) => {
      console.error('Failed to prompt for update download:', err);
    });
  });

  autoUpdater.on('update-not-available', () => {
    if (manualCheckPending) {
      manualCheckPending = false;
      showNoUpdatesDialog().catch((err) => {
        console.error('Failed to show no-updates dialog:', err);
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    promptInstall(info).catch((err) => {
      console.error('Failed to prompt for update install:', err);
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
  });

  checkForUpdates().catch((err) => {
    console.error('Initial update check failed:', err);
  });
}

module.exports = {
  setupAutoUpdater,
  checkForUpdates,
  isQuittingForUpdate,
};
