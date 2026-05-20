# Issue 002: Google OAuth Login Gate

## Goal

Require login before Continuum performs any meaningful behaviour.

## Scope

- Use Supabase Google OAuth.
- Show login screen when logged out.
- Show capture/log view only when logged in.
- Send Supabase JWT to backend API requests.
- Do not use magic links.
- Do not support anonymous usage in the Continuum MVP.

## Acceptance Criteria

- [x] Logged-out user sees only Google login.
- [x] Logged-in user can access the transcript log.
- [x] Capture, transcription, AI calls, and sync are unavailable before login.
- [x] Backend rejects unauthenticated event writes/transcription requests.

## Verification

- [x] TypeScript production build passes.
- [x] Backend starts with local Supabase env.
- [x] Backend rejects unauthenticated event fetches with `401`.
- [ ] Google OAuth has been configured and tested in Supabase.
- [ ] Backend authenticated event fetch has been tested with a real Supabase session.

## Out Of Scope

- Password auth.
- Magic links.
- Anonymous users.
- User profile/settings UI.
- Account management.
