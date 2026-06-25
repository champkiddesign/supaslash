const path = require('path');
const fs = require('fs');

const BACKUP_COUNT = 5;
const DOCUMENTS_BACKUP_DEBOUNCE_MS = 60000;
const DATA_FILENAME = 'slash-it-data.json';

function getDefaultData() {
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

function isValidData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (Array.isArray(data.sessionTasks)) return true;
  if (Array.isArray(data.tasks)) return true;
  if (Array.isArray(data.plannedSessions)) return true;
  return false;
}

function parseDataContent(content) {
  try {
    const data = JSON.parse(content);
    return isValidData(data) ? data : null;
  } catch {
    return null;
  }
}

function createDataStore(app) {
  let lastDocumentsBackupAt = null;
  let pendingDocumentsContent = null;
  let documentsBackupTimer = null;

  function getPrimaryPath() {
    return path.join(app.getPath('userData'), DATA_FILENAME);
  }

  function getBackupsDir() {
    return path.join(app.getPath('userData'), 'backups');
  }

  function getBackupPath(index) {
    return path.join(getBackupsDir(), `slash-it-data.bak.${index}.json`);
  }

  function getDocumentsDir() {
    return path.join(app.getPath('documents'), 'Slash It');
  }

  function getDocumentsDataPath() {
    return path.join(getDocumentsDir(), DATA_FILENAME);
  }

  function atomicWriteSync(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.tmp.${process.pid}`;
    fs.writeFileSync(tempPath, content, 'utf8');
    fs.renameSync(tempPath, filePath);
  }

  async function atomicWrite(filePath, content) {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.tmp.${process.pid}`;
    await fs.promises.writeFile(tempPath, content, 'utf8');
    await fs.promises.rename(tempPath, filePath);
  }

  function rotateBackups(primaryPath) {
    const backupsDir = getBackupsDir();
    fs.mkdirSync(backupsDir, { recursive: true });

    const oldestBackup = getBackupPath(BACKUP_COUNT);
    if (fs.existsSync(oldestBackup)) {
      fs.unlinkSync(oldestBackup);
    }

    for (let index = BACKUP_COUNT - 1; index >= 1; index -= 1) {
      const fromPath = getBackupPath(index);
      const toPath = getBackupPath(index + 1);
      if (fs.existsSync(fromPath)) {
        fs.renameSync(fromPath, toPath);
      }
    }

    if (fs.existsSync(primaryPath)) {
      fs.copyFileSync(primaryPath, getBackupPath(1));
    }
  }

  function readDataFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try {
      return parseDataContent(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return null;
    }
  }

  function loadDataWithFallback() {
    const candidates = [
      { source: 'primary', path: getPrimaryPath() },
      ...Array.from({ length: BACKUP_COUNT }, (_, index) => ({
        source: `backup.${index + 1}`,
        path: getBackupPath(index + 1),
      })),
      { source: 'documents', path: getDocumentsDataPath() },
    ];

    for (const candidate of candidates) {
      const data = readDataFile(candidate.path);
      if (data) {
        return { data, source: candidate.source };
      }
    }

    return { data: getDefaultData(), source: 'default' };
  }

  function loadData() {
    return loadDataWithFallback().data;
  }

  async function writeDocumentsBackup(content) {
    const documentsPath = getDocumentsDataPath();
    await atomicWrite(documentsPath, content);
    lastDocumentsBackupAt = Date.now();
    pendingDocumentsContent = null;
    return lastDocumentsBackupAt;
  }

  function scheduleDocumentsBackup(content) {
    pendingDocumentsContent = content;
    if (documentsBackupTimer) clearTimeout(documentsBackupTimer);
    documentsBackupTimer = setTimeout(() => {
      documentsBackupTimer = null;
      writeDocumentsBackup(pendingDocumentsContent).catch((err) => {
        console.error('Failed to write Documents backup:', err);
      });
    }, DOCUMENTS_BACKUP_DEBOUNCE_MS);
  }

  async function flushDocumentsBackup() {
    if (documentsBackupTimer) {
      clearTimeout(documentsBackupTimer);
      documentsBackupTimer = null;
    }

    let content = pendingDocumentsContent;
    if (!content) {
      const primaryPath = getPrimaryPath();
      if (fs.existsSync(primaryPath)) {
        content = await fs.promises.readFile(primaryPath, 'utf8');
      }
    }

    if (!content) return lastDocumentsBackupAt;

    try {
      return await writeDocumentsBackup(content);
    } catch (err) {
      console.error('Failed to flush Documents backup:', err);
      return lastDocumentsBackupAt;
    }
  }

  function savePrimarySync(data) {
    const content = JSON.stringify(data, null, 2);
    const primaryPath = getPrimaryPath();
    rotateBackups(primaryPath);
    atomicWriteSync(primaryPath, content);
    scheduleDocumentsBackup(content);
    return content;
  }

  async function saveDataPipeline(data) {
    savePrimarySync(data);
  }

  function saveDataAsync(data) {
    try {
      savePrimarySync(data);
    } catch (err) {
      console.error('Failed to save data:', err);
    }
  }

  async function backupDocumentsNow() {
    const primaryPath = getPrimaryPath();
    if (!fs.existsSync(primaryPath)) {
      return lastDocumentsBackupAt;
    }
    const content = await fs.promises.readFile(primaryPath, 'utf8');
    if (!parseDataContent(content)) {
      throw new Error('Primary data file is invalid');
    }
    return writeDocumentsBackup(content);
  }

  function getDocumentsBackupTimestamp() {
    if (lastDocumentsBackupAt) return lastDocumentsBackupAt;
    const documentsPath = getDocumentsDataPath();
    if (!fs.existsSync(documentsPath)) return null;
    try {
      return fs.statSync(documentsPath).mtimeMs;
    } catch {
      return null;
    }
  }

  function getDataInfo() {
    return {
      primaryPath: getPrimaryPath(),
      documentsPath: getDocumentsDataPath(),
      documentsDir: getDocumentsDir(),
      lastDocumentsBackupAt: getDocumentsBackupTimestamp(),
    };
  }

  return {
    loadData,
    loadDataWithFallback,
    saveDataPipeline,
    saveDataAsync,
    savePrimarySync,
    flushDocumentsBackup,
    backupDocumentsNow,
    getDataInfo,
    getDocumentsDir,
    parseDataContent,
    isValidData,
    getDefaultData,
  };
}

module.exports = { createDataStore, getDefaultData, isValidData, parseDataContent };
