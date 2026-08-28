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

// Force a Worker-shaped API base for online tests (does not hit the network — we mock fetch).
process.env.SUPASLASH_LICENSE_API_URL = 'https://license.test.workers.dev';
process.env.SUPASLASH_LICENSE_API_SECRET = 'test-secret';
process.env.SUPASLASH_PADDLE_PRICE_IDS = 'pri_test_price';
delete require.cache[require.resolve('../license-config')];
delete require.cache[require.resolve('../license-service')];

const { buildMachineFingerprint } = require('../license-service');

function createMockApp(tempDir) {
  return {
    getPath() {
      return tempDir;
    },
  };
}

function jsonResponse(payload, ok = true) {
  return {
    ok,
    status: ok ? 200 : 400,
    async json() {
      return payload;
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
  assert.strictEqual(initialStatus.configReady, true, 'configReady should be true when API URL is set');

  // --- Local beta key (packaged builds) ---
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

  // --- Local dev key ---
  const devActivate = await licenseService.activateLicense({
    licenseKey: 'SUPASLASH-DEV-LOCAL-TEST',
    email: 'dev@localhost',
  });
  assert.strictEqual(devActivate.ok, true, 'dev license should activate when allowed');
  assert.strictEqual(devActivate.status.isLicensed, true, 'dev license should be licensed');

  await licenseService.deactivateLicense();
  assert.strictEqual(licenseStore.loadLicense(), null, 'dev license should deactivate locally');

  // --- Online Worker API (mocked fetch) ---
  const originalFetch = global.fetch;
  let lastActivateBody = null;
  let lastValidateBody = null;
  let lastDeactivateBody = null;

  global.fetch = async (url, options = {}) => {
    const href = String(url);
    const auth = options.headers?.Authorization || options.headers?.authorization;
    assert.strictEqual(auth, 'Bearer test-secret', 'requests should send bearer secret');

    if (href.endsWith('/v1/licenses/activate')) {
      lastActivateBody = JSON.parse(options.body);
      assert.ok(lastActivateBody.license_key);
      assert.ok(lastActivateBody.instance_name);
      return jsonResponse({
        activated: true,
        error: null,
        license_key: {
          status: 'active',
          key: 'online-license-key',
          activation_limit: 2,
          activation_usage: 1,
          expires_at: null,
        },
        instance: {
          id: 'test-instance-id',
          name: lastActivateBody.instance_name,
          created_at: new Date().toISOString(),
        },
        meta: {
          customer_email: 'buyer@example.com',
          product_name: 'SupaSlash',
          price_id: 'pri_test_price',
        },
      });
    }

    if (href.endsWith('/v1/licenses/validate')) {
      lastValidateBody = JSON.parse(options.body);
      return jsonResponse({
        valid: true,
        error: null,
        license_key: {
          status: 'active',
          key: lastValidateBody.license_key,
          activation_limit: 2,
          activation_usage: 1,
          expires_at: null,
        },
        instance: {
          id: lastValidateBody.instance_id,
          name: 'Test',
          created_at: new Date().toISOString(),
        },
        meta: {
          customer_email: 'buyer@example.com',
          product_name: 'SupaSlash',
          price_id: 'pri_test_price',
        },
      });
    }

    if (href.endsWith('/v1/licenses/deactivate')) {
      lastDeactivateBody = JSON.parse(options.body);
      return jsonResponse({
        deactivated: true,
        error: null,
        license_key: {
          status: 'inactive',
          key: lastDeactivateBody.license_key,
          activation_limit: 2,
          activation_usage: 0,
          expires_at: null,
        },
        meta: {
          customer_email: 'buyer@example.com',
          product_name: 'SupaSlash',
          price_id: 'pri_test_price',
        },
      });
    }

    throw new Error(`Unexpected fetch URL: ${href}`);
  };

  try {
    const activateResult = await licenseService.activateLicense({
      licenseKey: 'online-license-key',
      email: 'buyer@example.com',
    });
    assert.strictEqual(activateResult.ok, true, 'online activation should succeed with mocked Worker');
    assert.strictEqual(activateResult.status.isLicensed, true, 'activated online license should be licensed');
    assert.strictEqual(lastActivateBody.email, 'buyer@example.com');

    const saved = licenseStore.loadLicense();
    assert.strictEqual(saved.licenseKey, 'online-license-key');
    assert.strictEqual(saved.instanceId, 'test-instance-id');

    const validated = await licenseService.validateStoredLicense({ force: true });
    assert.strictEqual(validated.isLicensed, true, 'stored online license should validate');
    assert.strictEqual(lastValidateBody.instance_id, 'test-instance-id');

    const deactivateResult = await licenseService.deactivateLicense();
    assert.strictEqual(deactivateResult.ok, true, 'online deactivation should succeed');
    assert.strictEqual(lastDeactivateBody.instance_id, 'test-instance-id');
    assert.strictEqual(licenseStore.loadLicense(), null, 'license file should be cleared');

    // Wrong price id should be rejected
    global.fetch = async () => jsonResponse({
      activated: true,
      error: null,
      license_key: {
        status: 'active',
        key: 'other-product-key',
        activation_limit: 2,
        activation_usage: 1,
        expires_at: null,
      },
      instance: { id: 'x', name: 'y', created_at: new Date().toISOString() },
      meta: {
        customer_email: 'buyer@example.com',
        product_name: 'Other App',
        price_id: 'pri_other',
      },
    });

    const wrongProduct = await licenseService.activateLicense({
      licenseKey: 'other-product-key',
      email: 'buyer@example.com',
    });
    assert.strictEqual(wrongProduct.ok, false, 'wrong price id should be rejected');
    assert.match(wrongProduct.status.error || '', /not for SupaSlash/i);
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
