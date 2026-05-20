# Issue 007: Android Bluetooth Capture Reliability

## Goal

Find out whether the current PWA/browser implementation can reliably capture intelligible speech
on Android with a Bluetooth headset connected.

This is a learning issue, not a feature-build issue.

## Scope

- Test Android phone in Chrome through Tailscale Funnel.
- Test with Bluetooth headset connected.
- Record whether Chrome appears to use headset mic or phone mic.
- Use the debug mic diagnostics panel to inspect available `audioinput` devices.
- Test reconnect behaviour.
- Test offline queue behaviour after recording.
- Capture observed transcript quality, latency, and failure modes.

## Acceptance Criteria

- [ ] Test run recorded with phone model, Android version, Chrome version, and headset model.
- [ ] Debug panel output captured for connected and disconnected headset states.
- [ ] At least three short recordings tested through headset-connected state.
- [ ] At least one offline/reconnect scenario tested.
- [ ] Decision recorded: PWA capture reliability is acceptable / unacceptable / uncertain.

## Out Of Scope

- Headset button control.
- Native Android implementation.
- Background or lock-screen recording.
- Voice activation.
- Rust/WASM audio processing.
