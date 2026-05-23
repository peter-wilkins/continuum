# Local Testing

## Run the app

Run these in separate terminals:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Open:

```text
http://localhost:5173/public/extended-thought
```

The frontend uses same-origin `/api` calls. In local dev, Vite proxies `/api` to the backend on `127.0.0.1:3000`, so the same setup works through Tailscale Funnel.

## Public MVP Checks

Open:

```text
http://localhost:5173/
http://localhost:5173/public/extended-thought
http://localhost:5173/public/lenses
```

Run:

```bash
npm run build --workspace shared
npm run smoke:public-continuum --workspace backend
```

The public extended-thought page should show `Git <hash>` near the guide page. If the hash is stale in local dev, restart the frontend server.

## Supabase Google OAuth

Configure Supabase Auth with one callback URL for each origin you use:

```text
http://localhost:5173/auth/callback
https://<your-funnel-host>/auth/callback
continuum://auth-callback
```

The frontend sends all web sign-ins through `/auth/callback`, so adding a new lab page or
prototype route does not require another Supabase redirect URL. The interrupted route is stored
locally before redirect; the app rejects cross-origin return URLs.

The logged-out app should show only `Continue with Google`.

## Tailscale Funnel

Once both local servers are running, expose the frontend:

```bash
tailscale funnel --bg --https=443 localhost:5173
tailscale funnel status
```

Use the HTTPS Funnel URL:

```text
https://<your-funnel-host>/public/extended-thought
```

If Funnel is already configured, `tailscale funnel status` should show the current public URL and target.

## Stop Funnel

```bash
tailscale funnel --https=443 localhost:5173 off
tailscale funnel reset
```

For tailnet-only sharing instead of public internet sharing, use Serve:

```bash
tailscale serve --bg --https=443 localhost:5173
tailscale serve status
```

Stop Serve with:

```bash
tailscale serve --https=443 localhost:5173 off
tailscale serve reset
```
