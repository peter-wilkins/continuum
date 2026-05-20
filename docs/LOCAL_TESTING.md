# Local Testing

## Run the app

Run these in separate terminals:

```bash
npm run start --workspace backend
```

```bash
npm run dev --workspace frontend
```

Open:

```text
http://localhost:5173/?debug=1
```

The frontend uses same-origin `/api` calls. In local dev, Vite proxies `/api` to the backend on `127.0.0.1:3000`, so the same setup works through Tailscale Funnel.

## Supabase Google OAuth

Configure Supabase Auth with redirect URLs for each origin you use:

```text
http://localhost:5173
https://<your-funnel-host>
```

The logged-out app should show only `Continue with Google`.

## Tailscale Funnel

Once both local servers are running, expose the frontend:

```bash
tailscale funnel --bg --https=443 localhost:5173
tailscale funnel status
```

Use the HTTPS Funnel URL with `?debug=1`:

```text
https://<your-funnel-host>/?debug=1
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
