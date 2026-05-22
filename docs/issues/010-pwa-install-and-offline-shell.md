# Issue 010: PWA Install And Offline Shell

## Status

In progress: installable shell implemented; offline shell deliberately deferred.

## Goal

Decide whether Continuum should become installable as a PWA and whether the app shell should load
while offline.

## Scope

- Add or evaluate web app manifest requirements.
- Evaluate service worker/offline shell caching.
- Check auth redirect behaviour with installed PWA.
- Check IndexedDB pending-audio queue behaviour in installed vs browser modes.
- Keep "am I seeing stale code?" risk visible during MVP testing.

## Acceptance Criteria

- [x] Decision recorded: installable PWA for the public MVP surface.
- [x] Offline shell value weighed against cache staleness risk.
- [ ] Installed Android behaviour tested if PWA is pursued.
- [ ] Manual test checklist exists for install, launch, login, record, offline retry.

## Decision

Ship an installable PWA shell without a service worker for this MVP slice.

Reason: installability gives us the app-like viewport and launch behavior Peter wants for judging Lens
outputs. Offline caching can wait because stale cached code would make MVP feedback and git-hash sanity
checks less trustworthy.

## Implemented Slice

- Added a web app manifest and app icon.
- Added a native Chrome install prompt button when the browser exposes `beforeinstallprompt`.
- Changed the public Ada Continuum page to a full-screen, one-Lens-per-page snap carousel.
- Kept Lens names/descriptions off the judgement surface; the guide page remains the place for model
  detail.

## Out Of Scope

- Native Android app.
- Background recording.
- Push notifications.
- Production deployment hardening.
