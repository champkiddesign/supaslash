#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

function loadLocalEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
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
}

loadLocalEnvFile();

const { buildMachineFingerprint } = require('../license-service');

function createMockApp(tempDir) {
  return {
    getPath() {
      return tempDir;
    },
  };
}

async function run() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'supaslash-license-test-'));
  const { createLicenseStore } = require('../license-store');
  const { createLicenseService } = require('../license-service');

  const app = createMockApp(tempDir);
  const licenseStore = createLicenseStore(app);
  const licenseService = createLicenseService(licenseStore, { allowDevLicense: true });

  assert.ok(buildMachineFingerprint().startsWith('SupaSlash-'), 'machine fingerprint should be stable and prefixed');

  const initialStatus = await licenseService.validateStoredLicense();
  assert.strictEqual(initialStatus.isLicensed, false, 'missing license should be unlicensed');

  const packagedLicenseService = createLicenseService(licenseStore, { allowDevLicense: false });
  const betaActivate = await packagedLicenseService.activateLicense({
    licenseKey: 'SUPASLASH-BETA-ACCESS',
    email: 'tester@example.com',
  });
  assert.strictEqual(betaActivate.ok, true, 'beta license should activate locally');
  assert.strictEqual(betaActivate.status.isLicensed, true, 'beta license should be licensed');
  assert.strictEqual(betaActivate.status.productName, 'SupaSlash (Beta)');

  const betaValidated = await packagedLicenseService.validateStoredLicense({ force: true });
  assert.strictEqual(betaValidated.isLicensed, true, 'beta license should validate offline');

  await packagedLicenseService.deactivateLicense();
  assert.strictEqual(licenseStore.loadLicense(), null, 'beta license should deactivate locally');

  const remoteResult = await licenseService.activateLicense({
    licenseKey: 'some-remote-key',
    email: 'buyer@example.com',
  });
  assert.strictEqual(remoteResult.ok, false, 'remote activation should be unavailable');
  assert.match(
    remoteResult.status.error || '',
    /not available yet/i,
    'remote activation should explain online licensing is unavailable',
  );

  const devActivate = await licenseService.activateLicense({
    licenseKey: 'SUPASLASH-DEV-LOCAL-TEST',
    email: 'dev@localhost',
  });
  assert.strictEqual(devActivate.ok, true, 'dev license should activate when allowed');
  assert.strictEqual(devActivate.status.isLicensed, true, 'dev license should be licensed');

  await licenseService.deactivateLicense();
  assert.strictEqual(licenseStore.loadLicense(), null, 'dev license should deactivate locally');

  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('License service smoke tests passed.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
