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
tailscale serve --bg http://127.0.0.1:5173
tailscale funnel 443 on
tailscale serve status
```

Use the HTTPS Funnel URL with `?debug=1`:

```text
https://<your-funnel-host>/?debug=1
```

If Funnel is already configured, `tailscale serve status` should show the current public URL and target.

## Stop Funnel

```bash
tailscale funnel 443 off
tailscale serve reset
```
