# Yazhsiv Conversion frontend

Angular client for browser-local image and PDF conversion. Media files are processed in Web Workers and are never sent to the API.

## Development

Run `npm.cmd start` from this directory, then open `http://localhost:4200`.

Run `npm.cmd test -- --watch=false` for unit tests and `npm.cmd run build` for the production build.

## Production configuration

1. Deploy the API first and set its Stripe secret with `wrangler secret put STRIPE_SECRET_KEY` in `backend`. Do not put that key in `wrangler.toml` or this frontend.
2. Set `ALLOWED_ORIGINS` in the Worker to the exact frontend origins.
3. Set `donationApiUrl` in [runtime-config.js](/D:/image/frontend/public/runtime-config.js) to the deployed API base URL, including `/api`.
4. If the API is on a different origin, add that exact HTTPS origin to the `connect-src` directive in both [firebase.json](/D:/image/frontend/firebase.json) and [public/_headers](/D:/image/frontend/public/_headers).
5. Deploy `dist/frontend/browser` after `npm.cmd run build`.
