const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');
const licenseConfig = require('./license-config');

const ACTIVE_STATUSES = new Set(['active', 'inactive']);

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

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

function isConfigReady() {
  return licenseConfig.storeId > 0
    && licenseConfig.productId > 0
    && licenseConfig.variantIds.some((id) => id > 0);
}

function matchesConfiguredProduct(meta = {}) {
  if (!isConfigReady()) return true;

  if (licenseConfig.storeId > 0 && Number(meta.store_id) !== licenseConfig.storeId) {
    return false;
  }
  if (licenseConfig.productId > 0 && Number(meta.product_id) !== licenseConfig.productId) {
    return false;
  }
  if (licenseConfig.variantIds.some((id) => id > 0)) {
    const variantId = Number(meta.variant_id);
    if (!licenseConfig.variantIds.includes(variantId)) return false;
  }
  return true;
}

function emailMatchesPurchase(email, meta = {}) {
  const expected = normalizeEmail(meta.customer_email);
  const provided = normalizeEmail(email);
  if (!expected || !provided) return true;
  return expected === provided;
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
    configReady: isConfigReady(),
    checkoutConfigured: !!licenseConfig.checkoutUrl,
  };
}

async function postLicenseEndpoint(endpoint, params) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') body.append(key, String(value));
  });

  const response = await fetch(`${licenseConfig.licenseApiBaseUrl}/${endpoint}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Could not read a response from Lemon Squeezy.');
  }

  if (!response.ok) {
    throw new Error(payload?.error || 'Lemon Squeezy license request failed.');
  }

  return payload;
}

function mapActivationError(payload) {
  if (payload?.activated) return null;
  return payload?.error || 'Could not activate this license key.';
}

function mapValidationError(payload) {
  if (payload?.valid) return null;
  return payload?.error || 'This license is not valid.';
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

  function shouldRevalidate(record) {
    if (!record?.lastValidatedAt) return true;
    const lastValidatedAt = Date.parse(record.lastValidatedAt);
    if (!Number.isFinite(lastValidatedAt)) return true;
    const intervalMs = licenseConfig.revalidateIntervalHours * 60 * 60 * 1000;
    return Date.now() - lastValidatedAt >= intervalMs;
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

    const instanceName = getMachineFingerprint();
    let payload;
    try {
      payload = await postLicenseEndpoint('activate', {
        license_key: trimmedKey,
        instance_name: instanceName,
      });
    } catch (err) {
      return { ok: false, status: buildStatus({ error: err.message }) };
    }

    const activationError = mapActivationError(payload);
    if (activationError) {
      return { ok: false, status: buildStatus({ error: activationError }) };
    }

    if (!matchesConfiguredProduct(payload.meta)) {
      return { ok: false, status: buildStatus({ error: 'This license key is not for SupaSlash.' }) };
    }

    if (!emailMatchesPurchase(email, payload.meta)) {
      return {
        ok: false,
        status: buildStatus({ error: 'That email does not match the purchase receipt.' }),
      };
    }

    const record = buildLicenseRecord({
      licenseKey: payload.license_key?.key || trimmedKey,
      instanceId: payload.instance?.id,
      instanceName,
      customerEmail: email || payload.meta?.customer_email || '',
      status: payload.license_key?.status || 'active',
      expiresAt: payload.license_key?.expires_at || null,
      productName: payload.meta?.product_name || 'SupaSlash',
      lastValidatedAt: new Date().toISOString(),
    });

    await licenseStore.saveLicense(record);
    cachedStatus = buildStatus({
      isLicensed: isLicenseKeyUsable(payload.license_key),
      status: record.status,
      expiresAt: record.expiresAt,
      customerEmail: record.customerEmail,
      productName: record.productName,
      lastValidatedAt: record.lastValidatedAt,
      activationUsage: payload.license_key?.activation_usage ?? null,
      activationLimit: payload.license_key?.activation_limit ?? null,
    });

    return { ok: true, status: cachedStatus };
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

    if (!force && !shouldRevalidate(record)) {
      cachedStatus = statusFromRecord(record);
      return cachedStatus;
    }

    let payload;
    try {
      payload = await postLicenseEndpoint('validate', {
        license_key: record.licenseKey,
        instance_id: record.instanceId,
      });
    } catch (err) {
      if (isWithinOfflineGrace(record) && isLicenseKeyUsable({ status: record.status, expires_at: record.expiresAt })) {
        cachedStatus = statusFromRecord(record, { offlineGrace: true, error: err.message });
        return cachedStatus;
      }
      cachedStatus = buildStatus({ error: err.message });
      return cachedStatus;
    }

    const validationError = mapValidationError(payload);
    if (validationError) {
      cachedStatus = buildStatus({ error: validationError, status: payload.license_key?.status || 'invalid' });
      return cachedStatus;
    }

    if (!matchesConfiguredProduct(payload.meta)) {
      cachedStatus = buildStatus({ error: 'This license key is not for SupaSlash.', status: 'invalid' });
      return cachedStatus;
    }

    const updatedRecord = buildLicenseRecord({
      licenseKey: record.licenseKey,
      instanceId: record.instanceId,
      instanceName: record.instanceName,
      customerEmail: record.customerEmail || payload.meta?.customer_email || '',
      status: payload.license_key?.status || record.status,
      expiresAt: payload.license_key?.expires_at || record.expiresAt,
      productName: payload.meta?.product_name || record.productName,
      lastValidatedAt: new Date().toISOString(),
    });

    await licenseStore.saveLicense(updatedRecord);

    cachedStatus = buildStatus({
      isLicensed: isLicenseKeyUsable(payload.license_key),
      status: updatedRecord.status,
      expiresAt: updatedRecord.expiresAt,
      customerEmail: updatedRecord.customerEmail,
      productName: updatedRecord.productName,
      lastValidatedAt: updatedRecord.lastValidatedAt,
      activationUsage: payload.license_key?.activation_usage ?? null,
      activationLimit: payload.license_key?.activation_limit ?? null,
    });

    return cachedStatus;
  }

  async function deactivateLicense() {
    const record = licenseStore.loadLicense();
    if (!record) {
      cachedStatus = buildStatus();
      return { ok: true, status: cachedStatus };
    }

    if (isLocalLicenseKey(record.licenseKey)) {
      await licenseStore.clearLicense();
      cachedStatus = buildStatus();
      return { ok: true, status: cachedStatus };
    }

    try {
      const payload = await postLicenseEndpoint('deactivate', {
        license_key: record.licenseKey,
        instance_id: record.instanceId,
      });
      if (!payload?.deactivated) {
        return {
          ok: false,
          status: buildStatus({ error: payload?.error || 'Could not deactivate this device.' }),
        };
      }
    } catch (err) {
      return { ok: false, status: buildStatus({ error: err.message }) };
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
