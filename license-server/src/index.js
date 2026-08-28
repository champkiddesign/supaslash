/**
 * SupaSlash license Worker — Paddle Billing webhooks + license API.
 */

const KEY_PREFIX = 'license:';
const SUB_PREFIX = 'sub:';
const TXN_PREFIX = 'txn:';
const EMAIL_PREFIX = 'email:';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function activationLimit(env) {
  const parsed = Number.parseInt(env.ACTIVATION_LIMIT || '2', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

async function parseBody(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return request.json();
  }
  if (
    contentType.includes('application/x-www-form-urlencoded')
    || contentType.includes('multipart/form-data')
  ) {
    const form = await request.formData();
    const out = {};
    for (const [key, value] of form.entries()) {
      out[key] = typeof value === 'string' ? value : String(value);
    }
    return out;
  }
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const params = new URLSearchParams(text);
    return Object.fromEntries(params.entries());
  }
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function hmacSha256Hex(secret, payload) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPaddleSignature(rawBody, signatureHeader, secret) {
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(';').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [key, rest.join('=')];
    }),
  );

  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const tsNum = Number.parseInt(ts, 10);
  if (!Number.isFinite(tsNum)) return false;
  // Reject timestamps older than 5 minutes (replay protection).
  if (Math.abs(Date.now() / 1000 - tsNum) > 300) return false;

  const expected = await hmacSha256Hex(secret, `${ts}:${rawBody}`);
  return timingSafeEqualHex(expected, h1.toLowerCase());
}

function requireLicenseAuth(request, env) {
  const secret = env.LICENSE_API_SECRET;
  if (!secret) return true;
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return !!match && match[1] === secret;
}

function generateLicenseKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

function generateInstanceId() {
  return crypto.randomUUID();
}

function isLicenseUsable(license) {
  if (!license) return false;
  if (license.status === 'disabled' || license.status === 'expired') return false;
  if (license.expiresAt) {
    const expires = Date.parse(license.expiresAt);
    if (Number.isFinite(expires) && expires <= Date.now()) return false;
  }
  return license.status === 'active' || license.status === 'inactive';
}

async function getLicense(env, key) {
  if (!key) return null;
  const raw = await env.LICENSES.get(`${KEY_PREFIX}${key}`);
  return raw ? JSON.parse(raw) : null;
}

async function saveLicense(env, license) {
  await env.LICENSES.put(`${KEY_PREFIX}${license.key}`, JSON.stringify(license));
  if (license.paddleSubscriptionId) {
    await env.LICENSES.put(`${SUB_PREFIX}${license.paddleSubscriptionId}`, license.key);
  }
  if (license.paddleTransactionId) {
    await env.LICENSES.put(`${TXN_PREFIX}${license.paddleTransactionId}`, license.key);
  }
  if (license.customerEmail) {
    await env.LICENSES.put(`${EMAIL_PREFIX}${normalizeEmail(license.customerEmail)}`, license.key);
  }
}

async function findKeyBySubscription(env, subscriptionId) {
  if (!subscriptionId) return null;
  return env.LICENSES.get(`${SUB_PREFIX}${subscriptionId}`);
}

async function findKeyByTransaction(env, transactionId) {
  if (!transactionId) return null;
  return env.LICENSES.get(`${TXN_PREFIX}${transactionId}`);
}

function licensePublicView(license, env) {
  const activations = license.activations || [];
  return {
    status: license.status,
    key: license.key,
    activation_limit: license.activationLimit || activationLimit(env),
    activation_usage: activations.length,
    created_at: license.createdAt || null,
    expires_at: license.expiresAt || null,
  };
}

function metaFromLicense(license) {
  return {
    customer_email: license.customerEmail || '',
    product_name: license.productName || 'SupaSlash',
    price_id: license.priceId || null,
    paddle_subscription_id: license.paddleSubscriptionId || null,
    paddle_transaction_id: license.paddleTransactionId || null,
  };
}

function extractCustomerEmail(data) {
  return (
    data?.customer?.email
    || data?.custom_data?.email
    || data?.details?.totals?.customer?.email
    || ''
  );
}

function extractPriceId(data) {
  const items = data?.items || data?.details?.line_items || [];
  const first = items[0];
  return first?.price?.id || first?.price_id || null;
}

function extractSubscriptionId(data) {
  if (data?.subscription_id) return data.subscription_id;
  if (typeof data?.id === 'string' && data.id.startsWith('sub_')) return data.id;
  return data?.subscription?.id || null;
}

function extractExpiresAt(data) {
  const period = data?.current_billing_period || data?.billing_period;
  if (period?.ends_at) return period.ends_at;
  if (data?.next_billed_at) return data.next_billed_at;
  return null;
}

async function createOrUpdateLicenseFromPurchase(env, {
  email,
  priceId,
  transactionId,
  subscriptionId,
  expiresAt,
  status = 'active',
}) {
  let existingKey = null;
  if (subscriptionId) existingKey = await findKeyBySubscription(env, subscriptionId);
  if (!existingKey && transactionId) existingKey = await findKeyByTransaction(env, transactionId);

  let license = existingKey ? await getLicense(env, existingKey) : null;

  if (!license) {
    const key = generateLicenseKey();
    license = {
      key,
      status,
      customerEmail: normalizeEmail(email),
      productName: env.PRODUCT_NAME || 'SupaSlash',
      priceId: priceId || null,
      paddleTransactionId: transactionId || null,
      paddleSubscriptionId: subscriptionId || null,
      activationLimit: activationLimit(env),
      activations: [],
      expiresAt: expiresAt || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log(`[fulfillment] created license ${key} for ${license.customerEmail || 'unknown'}`);
  } else {
    license.status = status;
    if (email) license.customerEmail = normalizeEmail(email);
    if (priceId) license.priceId = priceId;
    if (transactionId) license.paddleTransactionId = transactionId;
    if (subscriptionId) license.paddleSubscriptionId = subscriptionId;
    if (expiresAt) license.expiresAt = expiresAt;
    license.updatedAt = new Date().toISOString();
    console.log(`[fulfillment] updated license ${license.key} status=${status}`);
  }

  await saveLicense(env, license);
  return license;
}

async function handlePaddleWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get('paddle-signature') || '';
  const valid = await verifyPaddleSignature(rawBody, signature, env.PADDLE_WEBHOOK_SECRET);
  if (!valid) {
    return json({ error: 'Invalid Paddle signature.' }, 401);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const eventType = event.event_type || event.eventType;
  const data = event.data || {};

  try {
    switch (eventType) {
      case 'transaction.completed': {
        const status = data.status;
        if (status && status !== 'completed' && status !== 'billed') break;
        await createOrUpdateLicenseFromPurchase(env, {
          email: extractCustomerEmail(data),
          priceId: extractPriceId(data),
          transactionId: data.id,
          subscriptionId: extractSubscriptionId(data),
          expiresAt: null,
          status: 'active',
        });
        break;
      }
      case 'subscription.activated':
      case 'subscription.updated': {
        const subStatus = data.status;
        let licenseStatus = 'active';
        if (subStatus === 'canceled' || subStatus === 'paused') licenseStatus = 'expired';
        if (subStatus === 'past_due') licenseStatus = 'expired';
        await createOrUpdateLicenseFromPurchase(env, {
          email: extractCustomerEmail(data),
          priceId: extractPriceId(data),
          transactionId: null,
          subscriptionId: data.id,
          expiresAt: extractExpiresAt(data),
          status: licenseStatus,
        });
        break;
      }
      case 'subscription.canceled':
      case 'subscription.past_due': {
        const key = await findKeyBySubscription(env, data.id);
        if (key) {
          const license = await getLicense(env, key);
          if (license) {
            license.status = 'expired';
            license.expiresAt = extractExpiresAt(data) || license.expiresAt;
            license.updatedAt = new Date().toISOString();
            await saveLicense(env, license);
            console.log(`[fulfillment] expired license ${key} (${eventType})`);
          }
        }
        break;
      }
      case 'adjustment.created': {
        // Refunds / credits — disable related transaction license when action is refund.
        const action = data.action;
        if (action === 'refund' || action === 'chargeback') {
          const txnId = data.transaction_id;
          const key = await findKeyByTransaction(env, txnId);
          if (key) {
            const license = await getLicense(env, key);
            if (license) {
              license.status = 'disabled';
              license.updatedAt = new Date().toISOString();
              await saveLicense(env, license);
              console.log(`[fulfillment] disabled license ${key} (${action})`);
            }
          }
        }
        break;
      }
      default:
        console.log(`[webhook] ignored event ${eventType}`);
    }
  } catch (err) {
    console.error('[webhook] handler error:', err);
    return json({ error: 'Webhook handler failed.' }, 500);
  }

  return json({ received: true });
}

async function handleActivate(request, env) {
  if (!requireLicenseAuth(request, env)) {
    return json({ activated: false, error: 'Unauthorized.' }, 401);
  }

  const body = await parseBody(request);
  const licenseKey = (body.license_key || '').trim();
  const instanceName = (body.instance_name || '').trim();
  const email = normalizeEmail(body.email);

  if (!licenseKey) {
    return json({ activated: false, error: 'Enter a license key.', license_key: null, instance: null, meta: null });
  }
  if (!instanceName) {
    return json({ activated: false, error: 'Missing instance_name.', license_key: null, instance: null, meta: null });
  }

  const license = await getLicense(env, licenseKey);
  if (!license) {
    return json({ activated: false, error: 'License key not found.', license_key: null, instance: null, meta: null });
  }

  if (email && license.customerEmail && email !== license.customerEmail) {
    return json({
      activated: false,
      error: 'That email does not match the purchase receipt.',
      license_key: licensePublicView(license, env),
      instance: null,
      meta: metaFromLicense(license),
    });
  }

  if (!isLicenseUsable(license)) {
    return json({
      activated: false,
      error: 'This license is not valid.',
      license_key: licensePublicView(license, env),
      instance: null,
      meta: metaFromLicense(license),
    });
  }

  const activations = license.activations || [];
  const existing = activations.find((item) => item.name === instanceName);
  if (existing) {
    license.status = activations.length > 0 ? 'active' : 'inactive';
    license.updatedAt = new Date().toISOString();
    await saveLicense(env, license);
    return json({
      activated: true,
      error: null,
      license_key: licensePublicView(license, env),
      instance: { id: existing.id, name: existing.name, created_at: existing.createdAt },
      meta: metaFromLicense(license),
    });
  }

  const limit = license.activationLimit || activationLimit(env);
  if (activations.length >= limit) {
    return json({
      activated: false,
      error: 'Activation limit reached. Deactivate another Mac first.',
      license_key: licensePublicView(license, env),
      instance: null,
      meta: metaFromLicense(license),
    });
  }

  const instance = {
    id: generateInstanceId(),
    name: instanceName,
    createdAt: new Date().toISOString(),
  };
  activations.push(instance);
  license.activations = activations;
  license.status = 'active';
  license.updatedAt = new Date().toISOString();
  await saveLicense(env, license);

  return json({
    activated: true,
    error: null,
    license_key: licensePublicView(license, env),
    instance: { id: instance.id, name: instance.name, created_at: instance.createdAt },
    meta: metaFromLicense(license),
  });
}

async function handleValidate(request, env) {
  if (!requireLicenseAuth(request, env)) {
    return json({ valid: false, error: 'Unauthorized.' }, 401);
  }

  const body = await parseBody(request);
  const licenseKey = (body.license_key || '').trim();
  const instanceId = (body.instance_id || '').trim();

  if (!licenseKey) {
    return json({ valid: false, error: 'Enter a license key.', license_key: null, instance: null, meta: null });
  }

  const license = await getLicense(env, licenseKey);
  if (!license) {
    return json({ valid: false, error: 'License key not found.', license_key: null, instance: null, meta: null });
  }

  if (!isLicenseUsable(license)) {
    return json({
      valid: false,
      error: 'This license is not valid.',
      license_key: licensePublicView(license, env),
      instance: null,
      meta: metaFromLicense(license),
    });
  }

  let instance = null;
  if (instanceId) {
    instance = (license.activations || []).find((item) => item.id === instanceId) || null;
    if (!instance) {
      return json({
        valid: false,
        error: 'This device is not activated for this license.',
        license_key: licensePublicView(license, env),
        instance: null,
        meta: metaFromLicense(license),
      });
    }
  }

  return json({
    valid: true,
    error: null,
    license_key: licensePublicView(license, env),
    instance: instance
      ? { id: instance.id, name: instance.name, created_at: instance.createdAt }
      : null,
    meta: metaFromLicense(license),
  });
}

async function handleDeactivate(request, env) {
  if (!requireLicenseAuth(request, env)) {
    return json({ deactivated: false, error: 'Unauthorized.' }, 401);
  }

  const body = await parseBody(request);
  const licenseKey = (body.license_key || '').trim();
  const instanceId = (body.instance_id || '').trim();

  if (!licenseKey || !instanceId) {
    return json({ deactivated: false, error: 'license_key and instance_id are required.' });
  }

  const license = await getLicense(env, licenseKey);
  if (!license) {
    return json({ deactivated: false, error: 'License key not found.' });
  }

  const before = license.activations || [];
  const after = before.filter((item) => item.id !== instanceId);
  if (after.length === before.length) {
    return json({ deactivated: false, error: 'Activation instance not found.' });
  }

  license.activations = after;
  license.status = after.length > 0 ? 'active' : 'inactive';
  license.updatedAt = new Date().toISOString();
  await saveLicense(env, license);

  return json({
    deactivated: true,
    error: null,
    license_key: licensePublicView(license, env),
    meta: metaFromLicense(license),
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return json({ ok: true });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'GET' && path === '/') {
      return json({
        service: 'supaslash-license',
        ok: true,
        routes: [
          'POST /webhooks/paddle',
          'POST /v1/licenses/activate',
          'POST /v1/licenses/validate',
          'POST /v1/licenses/deactivate',
        ],
      });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405);
    }

    try {
      if (path === '/webhooks/paddle') {
        return await handlePaddleWebhook(request, env);
      }
      if (path === '/v1/licenses/activate') {
        return await handleActivate(request, env);
      }
      if (path === '/v1/licenses/validate') {
        return await handleValidate(request, env);
      }
      if (path === '/v1/licenses/deactivate') {
        return await handleDeactivate(request, env);
      }
      return json({ error: 'Not found.' }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: 'Internal server error.' }, 500);
    }
  },
};
