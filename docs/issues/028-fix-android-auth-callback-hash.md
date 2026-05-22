# Issue 028: Fix Android Auth Callback Hash

Status: done

## Goal

Make phone Google sign-in finish after Supabase redirects back with implicit OAuth tokens.

## Problem

Android Chrome reached `/auth/callback#access_token=...`, but the app kept showing
`Sign-in did not finish. Please try again.` Supabase's automatic URL detection did not consume the
hash into persisted session storage in that browser tab.

## Scope

- Explicitly parse `access_token` and `refresh_token` from the callback hash.
- Validate the returned access token against Supabase Auth.
- Store the validated session in the same browser storage slot Supabase uses.
- Clear the token hash from the visible URL once stored.
- Preserve the existing stored return path and pending feedback intent.
- Submit the pending feedback intent once when returning from OAuth.
- Disable Supabase's automatic URL-hash detection so the callback route is the single owner of
  implicit OAuth redirects.
- Disable Supabase's browser Web Lock path for this MVP client because Android Chrome was hanging
  inside session reads after callback.

## Acceptance Criteria

- [x] Callback can complete when the hash contains implicit OAuth tokens.
- [x] Callback still falls back to existing session detection when no hash tokens are present.
- [x] Callback reports Supabase query/hash errors.
- [x] Token hash is removed from the URL after session storage succeeds.
- [x] Supabase client no longer auto-detects sessions from every app URL.
- [x] Supabase session reads do not depend on browser Web Locks.
- [x] React StrictMode does not double-submit the stored feedback intent.
