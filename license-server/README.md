# SupaSlash License Server

Cloudflare Worker that fulfills Paddle Billing purchases and exposes desktop license activate / validate / deactivate APIs.

Paddle Billing handles checkout, tax, and subscriptions. It does **not** provide Lemon Squeezy–style license APIs, so this Worker mints and validates keys for the Electron app.

## Paddle dashboard setup

Do this in [Paddle sandbox](https://sandbox-vendors.paddle.com/) first, then repeat for live.

1. **Create a product** named `SupaSlash` with subscription price(s) (monthly and/or yearly).
2. **Default payment link** — set a payment link / approved checkout domain. Copy the link into the Electron app as `SUPASLASH_CHECKOUT_URL` (Buy opens it with `shell.openExternal`).
3. **Notifications** — Developer tools → Notifications → New destination:
   - URL: `https://<your-worker>.workers.dev/webhooks/paddle`
   - Secret key: save as Worker secret `PADDLE_WEBHOOK_SECRET`
   - Subscribe to:
     - `transaction.completed`
     - `subscription.activated`
     - `subscription.updated`
     - `subscription.canceled`
     - `subscription.past_due`
     - `adjustment.created`
4. Copy **price IDs** (`pri_...`) into the Electron app env as `SUPASLASH_PADDLE_PRICE_IDS` (comma-separated) so the app can reject keys from other products.
5. Keep the Paddle **API key** on the Worker only (`PADDLE_API_KEY`) — never ship it in the Electron binary.

## Worker secrets

```bash
cd license-server
npx wrangler secret put PADDLE_WEBHOOK_SECRET
npx wrangler secret put LICENSE_API_SECRET
# optional — for subscription lookups if webhook payload is sparse
npx wrangler secret put PADDLE_API_KEY
```

Also set `ACTIVATION_LIMIT` (default `2`) via `wrangler.toml` vars if needed.

## Deploy

```bash
cd license-server
npm install
npx wrangler login
npx wrangler kv namespace create LICENSES
# put the returned id into wrangler.toml under [[kv_namespaces]]
npx wrangler deploy
```

Point Paddle’s notification destination at:

`https://<worker-subdomain>.workers.dev/webhooks/paddle`

## Electron app env

In the repo root `.env`:

```env
SUPASLASH_CHECKOUT_URL=https://pay.paddle.com/...   # or sandbox payment link
SUPASLASH_LICENSE_API_URL=https://supaslash-license.<you>.workers.dev
SUPASLASH_LICENSE_API_SECRET=<same as LICENSE_API_SECRET>
SUPASLASH_PADDLE_PRICE_IDS=pri_xxx,pri_yyy
```

## API

All license routes accept JSON (or form-urlencoded) and optional `Authorization: Bearer <LICENSE_API_SECRET>`.

| Method | Path | Body |
|--------|------|------|
| POST | `/v1/licenses/activate` | `license_key`, `instance_name`, optional `email` |
| POST | `/v1/licenses/validate` | `license_key`, `instance_id` |
| POST | `/v1/licenses/deactivate` | `license_key`, `instance_id` |
| POST | `/webhooks/paddle` | Paddle event (signature required) |

### Activate response (success)

```json
{
  "activated": true,
  "error": null,
  "license_key": {
    "status": "active",
    "key": "...",
    "activation_limit": 2,
    "activation_usage": 1,
    "expires_at": "2026-08-26T00:00:00.000Z"
  },
  "instance": { "id": "uuid", "name": "SupaSlash-..." },
  "meta": {
    "customer_email": "buyer@example.com",
    "product_name": "SupaSlash",
    "price_id": "pri_..."
  }
}
```

## License delivery

On `transaction.completed` / subscription activation the Worker generates a key and stores it in KV. The key is returned in the Worker logs (`console.log`) for sandbox testing. Production email delivery (Resend/Postmark) can be added later — customers also get a Paddle receipt; you can include the key in a custom email once you wire a mailer.

## Local / beta keys (app-only)

The Electron app still supports `SUPASLASH-DEV-LOCAL-TEST` and beta keys without calling this Worker.
