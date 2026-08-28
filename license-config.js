/**
 * License configuration for SupaSlash.
 *
 * Checkout: Paddle payment link (opened in the browser).
 * Online keys: Cloudflare Worker license API (see license-server/).
 * Local keys: dev (unpackaged) and beta (packaged) still work offline.
 */

function parsePriceIds(value) {
  return (value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

module.exports = {
  // Paddle payment link (Buy SupaSlash button)
  checkoutUrl: process.env.SUPASLASH_CHECKOUT_URL || '',
  // Worker base URL, e.g. https://supaslash-license.your-subdomain.workers.dev
  licenseApiBaseUrl: (process.env.SUPASLASH_LICENSE_API_URL || '').replace(/\/+$/, ''),
  // Optional shared secret — must match Worker LICENSE_API_SECRET when set
  licenseApiSecret: process.env.SUPASLASH_LICENSE_API_SECRET || '',
  // Comma-separated Paddle price IDs (pri_...) allowed for this app
  paddlePriceIds: parsePriceIds(process.env.SUPASLASH_PADDLE_PRICE_IDS),
  offlineGraceDays: 7,
  revalidateIntervalHours: 24,
  // Local dev only (honored when running unpackaged via npm start)
  devLicenseKey: 'SUPASLASH-DEV-LOCAL-TEST',
  // Beta testers (works in signed/packaged releases; override via SUPASLASH_BETA_LICENSE_KEY)
  betaLicenseKey: process.env.SUPASLASH_BETA_LICENSE_KEY || 'SUPASLASH-BETA-ACCESS',
};
