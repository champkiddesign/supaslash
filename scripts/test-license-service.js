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
  const licenseService = createLicenseService(licenseStore);

  assert.ok(buildMachineFingerprint().startsWith('SupaSlash-'), 'machine fingerprint should be stable and prefixed');

  const initialStatus = await licenseService.validateStoredLicense();
  assert.strictEqual(initialStatus.isLicensed, false, 'missing license should be unlicensed');

  const packagedLicenseService = createLicenseService(licenseStore, { allowDevLicense: false });
  const betaActivate = await packagedLicenseService.activateLicense({
    licenseKey: 'SUPASLASH-BETA-ACCESS',
    email: 'tester@example.com',
  });
  assert.strictEqual(betaActivate.ok, true, 'beta license should activate without Lemon Squeezy');
  assert.strictEqual(betaActivate.status.isLicensed, true, 'beta license should be licensed');
  assert.strictEqual(betaActivate.status.productName, 'SupaSlash (Beta)');

  const betaValidated = await packagedLicenseService.validateStoredLicense({ force: true });
  assert.strictEqual(betaValidated.isLicensed, true, 'beta license should validate offline');

  await packagedLicenseService.deactivateLicense();
  assert.strictEqual(licenseStore.loadLicense(), null, 'beta license should deactivate locally');

  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.match(String(url), /\/v1\/licenses\/activate$/);
    assert.strictEqual(options.method, 'POST');
    return {
      ok: true,
      async json() {
        return {
          activated: true,
          error: null,
          license_key: {
            id: 1,
            status: 'active',
            key: 'test-license-key',
            activation_limit: 2,
            activation_usage: 1,
            created_at: '2026-01-01T00:00:00.000000Z',
            expires_at: null,
          },
          instance: {
            id: 'test-instance-id',
            name: 'Test Mac',
            created_at: '2026-01-01T00:00:00.000000Z',
          },
          meta: {
            store_id: 1,
            product_id: 2,
            variant_id: 3,
            product_name: 'SupaSlash',
            customer_email: 'buyer@example.com',
          },
        };
      },
    };
  };

  try {
    const activateResult = await licenseService.activateLicense({
      licenseKey: 'test-license-key',
      email: 'buyer@example.com',
    });
    assert.strictEqual(activateResult.ok, true, 'activation should succeed with mocked API');
    assert.strictEqual(activateResult.status.isLicensed, true, 'activated license should be licensed');

    const saved = licenseStore.loadLicense();
    assert.strictEqual(saved.licenseKey, 'test-license-key');
    assert.strictEqual(saved.instanceId, 'test-instance-id');

    global.fetch = async (url) => {
      assert.match(String(url), /\/v1\/licenses\/validate$/);
      return {
        ok: true,
        async json() {
          return {
            valid: true,
            error: null,
            license_key: {
              status: 'active',
              expires_at: null,
            },
            instance: { id: saved.instanceId, name: saved.instanceName, created_at: saved.lastValidatedAt },
            meta: {
              store_id: 1,
              product_id: 2,
              variant_id: 3,
              product_name: 'SupaSlash',
              customer_email: 'buyer@example.com',
            },
          };
        },
      };
    };

    const validated = await licenseService.validateStoredLicense({ force: true });
    assert.strictEqual(validated.isLicensed, true, 'stored license should validate');

    global.fetch = async (url) => {
      assert.match(String(url), /\/v1\/licenses\/deactivate$/);
      return {
        ok: true,
        async json() {
          return { deactivated: true, error: null, license_key: { status: 'active' }, meta: {} };
        },
      };
    };

    const deactivateResult = await licenseService.deactivateLicense();
    assert.strictEqual(deactivateResult.ok, true, 'deactivation should succeed');
    assert.strictEqual(licenseStore.loadLicense(), null, 'license file should be cleared');
  } finally {
    global.fetch = originalFetch;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log('License service smoke tests passed.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
