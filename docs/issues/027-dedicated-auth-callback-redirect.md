# Issue 027: Dedicated Auth Callback Redirect

Status: done

## Goal

Stop adding a new Supabase redirect URL every time a lab route or prototype path is added.

## Scope

- Route web Google sign-ins through `/auth/callback`.
- Preserve the interrupted user intent with a stored relative return path.
- Reject cross-origin or recursive callback return paths.
- Keep the native shell `continuum://auth-callback` redirect unchanged.
- Document the small set of Supabase redirect URLs to keep configured.

## Acceptance Criteria

- [x] Public feedback sign-in redirects via `/auth/callback`, then returns to `/public/ada-lovelace`.
- [x] Capture prototype sign-in redirects via `/auth/callback`, then returns to `/continuum`.
- [x] Callback waits for the Supabase session before returning to the original path.
- [x] Callback does not accept external return URLs.
- [x] Local testing docs list callback URLs instead of per-prototype paths.
