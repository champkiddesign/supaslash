const path = require('path');
const fs = require('fs');

const LICENSE_FILENAME = 'license.json';

function createLicenseStore(app) {
  function getLicensePath() {
    return path.join(app.getPath('userData'), LICENSE_FILENAME);
  }

  function getDefaultLicense() {
    return null;
  }

  function isValidLicenseRecord(record) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
    if (typeof record.licenseKey !== 'string' || !record.licenseKey.trim()) return false;
    if (typeof record.instanceId !== 'string' || !record.instanceId.trim()) return false;
    return true;
  }

  function loadLicense() {
    const licensePath = getLicensePath();
    try {
      const content = fs.readFileSync(licensePath, 'utf8');
      const record = JSON.parse(content);
      return isValidLicenseRecord(record) ? record : getDefaultLicense();
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Failed to load license file:', err);
      }
      return getDefaultLicense();
    }
  }

  async function saveLicense(record) {
    const licensePath = getLicensePath();
    await fs.promises.mkdir(path.dirname(licensePath), { recursive: true });
    await fs.promises.writeFile(licensePath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  }

  async function clearLicense() {
    const licensePath = getLicensePath();
    try {
      await fs.promises.unlink(licensePath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  return {
    getLicensePath,
    loadLicense,
    saveLicense,
    clearLicense,
  };
}

module.exports = { createLicenseStore };
