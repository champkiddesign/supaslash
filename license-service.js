const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');
const licenseConfig = require('./license-config');

const ACTIVE_STATUSES = new Set(['active', 'inactive']);
const ONLINE_LICENSE_UNAVAILABLE =
  'Online licensing is not available yet. Use a development or beta key for now.';

function getMacHardwareUuid() {
  if (process.platform !== 'darwin') return null;
  try {
    const output = execSync('ioreg -rd1 -c IOPlatformExpertDevice', {
      encoding: 'utf8',
      timeout: 3000,
    });
    const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

function buildMachineFingerprint() {
  const hardwareUuid = getMacHardwareUuid();
  if (hardwareUuid) return `SupaSlash-${hardwareUuid}`;

  const seed = `${os.hostname()}|${os.userInfo().username}|${os.homedir()}`;
  const hash = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 16);
  return `SupaSlash-${hash}`;
}

function parseTimestamp(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isLicenseKeyUsable(licenseKey = {}) {
  if (!licenseKey || typeof licenseKey !== 'object') return false;
  if (licenseKey.status === 'disabled' || licenseKey.status === 'expired') return false;

  const expiresAt = parseTimestamp(licenseKey.expires_at);
  if (expiresAt != null && expiresAt <= Date.now()) return false;

  return ACTIVE_STATUSES.has(licenseKey.status);
}

function buildLicenseRecord({
  licenseKey,
  instanceId,
  instanceName,
  customerEmail,
  status,
  expiresAt,
  productName,
  lastValidatedAt,
}) {
  return {
    licenseKey,
    instanceId,
    instanceName,
    customerEmail: customerEmail || '',
    status: status || 'active',
    expiresAt: expiresAt || null,
    productName: productName || 'SupaSlash',
    lastValidatedAt: lastValidatedAt || new Date().toISOString(),
  };
}

function buildStatus({
  isLicensed = false,
  status = 'unlicensed',
  expiresAt = null,
  customerEmail = '',
  productName = '',
  offlineGrace = false,
  error = null,
  lastValidatedAt = null,
  activationUsage = null,
  activationLimit = null,
} = {}) {
  return {
    isLicensed,
    status,
    expiresAt,
    customerEmail,
    productName,
    offlineGrace,
    error,
    lastValidatedAt,
    activationUsage,
    activationLimit,
    configReady: false,
    checkoutConfigured: !!licenseConfig.checkoutUrl,
  };
}

function createLicenseService(licenseStore, { allowDevLicense = false } = {}) {
  let cachedStatus = buildStatus();
  let machineFingerprint = null;

  const storedRecord = licenseStore.loadLicense();
  if (storedRecord) {
    cachedStatus = statusFromRecord(storedRecord);
  }

  function isDevLicenseKey(licenseKey) {
    return allowDevLicense && licenseKey === licenseConfig.devLicenseKey;
  }

  function isBetaLicenseKey(licenseKey) {
    const betaKey = licenseConfig.betaLicenseKey;
    return typeof betaKey === 'string' && betaKey.length > 0 && licenseKey === betaKey;
  }

  function isLocalLicenseKey(licenseKey) {
    return isDevLicenseKey(licenseKey) || isBetaLicenseKey(licenseKey);
  }

  async function activateLocalLicense({ licenseKey, email, productName, instanceId }) {
    const record = buildLicenseRecord({
      licenseKey,
      instanceId,
      instanceName: getMachineFingerprint(),
      customerEmail: email || 'beta@localhost',
      status: 'active',
      expiresAt: null,
      productName,
      lastValidatedAt: new Date().toISOString(),
    });
    await licenseStore.saveLicense(record);
    cachedStatus = statusFromRecord(record);
    return { ok: true, status: cachedStatus };
  }

  function getMachineFingerprint(storedInstanceName) {
    if (storedInstanceName) return storedInstanceName;
    if (!machineFingerprint) machineFingerprint = buildMachineFingerprint();
    return machineFingerprint;
  }

  function isWithinOfflineGrace(record) {
    if (!record?.lastValidatedAt) return false;
    const lastValidatedAt = Date.parse(record.lastValidatedAt);
    if (!Number.isFinite(lastValidatedAt)) return false;
    const graceMs = licenseConfig.offlineGraceDays * 24 * 60 * 60 * 1000;
    return Date.now() - lastValidatedAt <= graceMs;
  }

  function statusFromRecord(record, { offlineGrace = false, error = null } = {}) {
    const isLicensed = isLicenseKeyUsable({ status: record.status, expires_at: record.expiresAt });
    return buildStatus({
      isLicensed,
      status: record.status || (isLicensed ? 'active' : 'unlicensed'),
      expiresAt: record.expiresAt,
      customerEmail: record.customerEmail || '',
      productName: record.productName || '',
      offlineGrace,
      error,
      lastValidatedAt: record.lastValidatedAt || null,
    });
  }

  async function activateLicense({ licenseKey, email }) {
    const trimmedKey = (licenseKey || '').trim();
    if (!trimmedKey) {
      return { ok: false, status: buildStatus({ error: 'Enter a license key.' }) };
    }

    if (isDevLicenseKey(trimmedKey)) {
      return activateLocalLicense({
        licenseKey: trimmedKey,
        email,
        productName: 'SupaSlash (Dev)',
        instanceId: 'dev-local',
      });
    }

    if (isBetaLicenseKey(trimmedKey)) {
      return activateLocalLicense({
        licenseKey: trimmedKey,
        email,
        productName: 'SupaSlash (Beta)',
        instanceId: 'beta-local',
      });
    }

    return {
      ok: false,
      status: buildStatus({ error: ONLINE_LICENSE_UNAVAILABLE }),
    };
  }

  async function validateStoredLicense({ force = false } = {}) {
    const record = licenseStore.loadLicense();
    if (!record) {
      cachedStatus = buildStatus();
      return cachedStatus;
    }

    if (isLocalLicenseKey(record.licenseKey)) {
      cachedStatus = statusFromRecord(record);
      return cachedStatus;
    }

    // Previously online-activated licenses remain trusted from the local record
    // until online licensing (Paddle) is wired up.
    if (isLicenseKeyUsable({ status: record.status, expires_at: record.expiresAt })) {
      const withinGrace = isWithinOfflineGrace(record);
      cachedStatus = statusFromRecord(record, {
        offlineGrace: !withinGrace,
        error: force ? ONLINE_LICENSE_UNAVAILABLE : null,
      });
      return cachedStatus;
    }

    cachedStatus = buildStatus({
      status: record.status || 'invalid',
      expiresAt: record.expiresAt,
      customerEmail: record.customerEmail || '',
      productName: record.productName || '',
      lastValidatedAt: record.lastValidatedAt || null,
      error: 'This license is not valid.',
    });
    return cachedStatus;
  }

  async function deactivateLicense() {
    const record = licenseStore.loadLicense();
    if (!record) {
      cachedStatus = buildStatus();
      return { ok: true, status: cachedStatus };
    }

    await licenseStore.clearLicense();
    cachedStatus = buildStatus();
    return { ok: true, status: cachedStatus };
  }

  function getStatus() {
    return cachedStatus;
  }

  function getCheckoutUrl() {
    return licenseConfig.checkoutUrl;
  }

  return {
    activateLicense,
    validateStoredLicense,
    deactivateLicense,
    getStatus,
    getCheckoutUrl,
  };
}

module.exports = { createLicenseService, buildMachineFingerprint };
