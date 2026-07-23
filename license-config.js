/**
 * License configuration for SupaSlash.
 * Online licensing (Paddle) will plug in here later.
 * Until then, only local dev/beta keys activate.
 */

module.exports = {
  // Purchase link in the License modal (disabled when empty)
  checkoutUrl: process.env.SUPASLASH_CHECKOUT_URL || '',
  offlineGraceDays: 7,
  revalidateIntervalHours: 24,
  // Local dev only (honored when running unpackaged via npm start)
  devLicenseKey: 'SUPASLASH-DEV-LOCAL-TEST',
  // Beta testers (works in signed/packaged releases; override via SUPASLASH_BETA_LICENSE_KEY)
  betaLicenseKey: process.env.SUPASLASH_BETA_LICENSE_KEY || 'SUPASLASH-BETA-ACCESS',
};
