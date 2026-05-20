# Issue 008: Low-Friction Capture Activation

## Goal

Explore how close Continuum can get to `thought -> capture` without making the user fiddle with
the phone.

## Scope

- Compare current on-screen record button with lower-friction options.
- Consider headset button, browser/PWA shortcuts, Android gestures, and voice phrase activation.
- Identify which options are possible in PWA and which require native Android.
- Keep trust model intact: no silent capture, no silent data loss.

## Acceptance Criteria

- [ ] Activation options listed with feasibility: PWA now, PWA maybe, native required.
- [ ] Recommended next activation experiment chosen.
- [ ] UX risk recorded for accidental capture and missed capture.
- [ ] Decision recorded on whether explicit record button remains the MVP default.

## Out Of Scope

- Implementing headset button capture.
- Implementing wake-word or voice activation.
- Background recording.
- Native app spike.
