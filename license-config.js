/**
 * Lemon Squeezy license configuration for SupaSlash.
 *
 * Dashboard setup (https://lemonsqueezy.com/):
 * 1. Create store + product "SupaSlash for macOS"
 * 2. Enable license keys on the variant (activation limit: 2 recommended)
 * 3. Copy checkout URL into LEMONSQUEEZY_CHECKOUT_URL (.env) or checkoutUrl below
 * 4. Replace storeId, productId, and variantIds with values from your dashboard/API
 */

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

const storeId = parsePositiveInt(process.env.LEMONSQUEEZY_STORE_ID) ?? 0;
const productId = parsePositiveInt(process.env.LEMONSQUEEZY_PRODUCT_ID) ?? 0;
const variantIdsFromEnv = (process.env.LEMONSQUEEZY_VARIANT_IDS || '')
  .split(',')
  .map((part) => parsePositiveInt(part.trim()))
  .filter(Boolean);

module.exports = {
  checkoutUrl: process.env.LEMONSQUEEZY_CHECKOUT_URL || '',
  storeId,
  productId,
  variantIds: variantIdsFromEnv.length ? variantIdsFromEnv : [0],
  offlineGraceDays: 7,
  revalidateIntervalHours: 24,
  licenseApiBaseUrl: 'https://api.lemonsqueezy.com/v1/licenses',
  // Local dev only (honored when running unpackaged via npm start)
  devLicenseKey: 'SUPASLASH-DEV-LOCAL-TEST',
};
