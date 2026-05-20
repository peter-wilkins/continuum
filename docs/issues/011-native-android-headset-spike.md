# Issue 011: Native Android Headset Spike

## Goal

Decide whether the long-term Bluetooth headset continuity interface needs native Android rather
than a PWA.

## Scope

- Identify native capabilities needed for headset-first UX.
- Consider audio focus, foreground services, lock-screen behaviour, headset buttons, and mic route
  visibility/control.
- Compare native spike cost against continued PWA iteration.
- Keep PWA as learning rig unless evidence says it blocks the target product.

## Acceptance Criteria

- [ ] Native-only requirements listed.
- [ ] PWA limitations observed in real tests are linked to this issue.
- [ ] Spike scope proposed if native path is justified.
- [ ] Decision recorded: no native spike yet / native spike now / revisit later.

## Out Of Scope

- Building the native app.
- Choosing Android framework.
- Rust/WASM audio processing.
- Full production mobile architecture.
