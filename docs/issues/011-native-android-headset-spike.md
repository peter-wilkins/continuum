# Issue 011: Native Android Headset Spike

## Goal

Decide whether the long-term Bluetooth headset continuity interface needs native Android rather
than a PWA.

## Current Evidence

- Android Chrome can record through the in-app button.
- Android Chrome does not appear to receive AeroFit 2 headset taps through the web Media Session
  experiment.
- Desktop Bluetooth behaviour is no longer part of this decision; desktop can use the system mic or
  a custom local setup.
- Next experiment: a minimal Android shell owns headset media-button events natively, then calls the
  Continuum web UI through a tiny JavaScript bridge.

## Scope

- Identify native capabilities needed for headset-first UX.
- Consider audio focus, foreground services, lock-screen behaviour, headset buttons, and mic route
  visibility/control.
- Compare native spike cost against continued PWA iteration.
- Keep PWA as learning rig unless evidence says it blocks the target product.
- Test whether Android native `MediaSession` receives AeroFit 2 play/pause taps reliably enough to
  toggle Continuum capture.
- Keep the product as one app: if the shell wins, it becomes the recommended Android surface while
  still loading the web UI.

## Proposed Spike

Build the smallest Android shell that:

- opens the Continuum URL in a locked-down `WebView`;
- creates an active Android `MediaSession`;
- listens for Bluetooth headset media-button callbacks;
- injects `window.ContinuumNativeBridge.mediaButton("play-pause")` into the WebView;
- shows a tiny native diagnostic line: media-button count, last key code, last timestamp;
- does not implement native transcription, sync, auth, or storage.

## Acceptance Criteria

- [ ] Native-only requirements listed.
- [ ] PWA limitations observed in real tests are linked to this issue.
- [ ] Spike scope proposed if native path is justified.
- [ ] Web app exposes and displays a native-shell bridge event counter.
- [ ] Android shell test result recorded: headset taps received / not received / unreliable.
- [ ] Decision recorded: no native spike yet / native shell now / revisit later.

## Out Of Scope

- Full native app.
- Rust/WASM audio processing.
- Full production mobile architecture.
