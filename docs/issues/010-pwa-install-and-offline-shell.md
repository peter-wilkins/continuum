# Issue 010: PWA Install And Offline Shell

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

- [ ] Decision recorded: browser-only / installable PWA / defer.
- [ ] Offline shell value weighed against cache staleness risk.
- [ ] Installed Android behaviour tested if PWA is pursued.
- [ ] Manual test checklist exists for install, launch, login, record, offline retry.

## Out Of Scope

- Native Android app.
- Background recording.
- Push notifications.
- Production deployment hardening.
