# Issue 009: Audio Competition And Silence Detection

## Goal

Understand what happens when other Android apps compete for microphone/audio input, and make
recording failures visible rather than silent.

## Scope

- Test recording while another app or assistant may be using audio input.
- Detect obvious "recording produced silence/no useful audio" cases.
- Decide whether the app should warn after silent or near-silent recordings.
- Keep warnings calm and sparse.

## Acceptance Criteria

- [ ] Competing-app scenarios documented.
- [ ] Failure mode recorded: silence, bad transcript, permission error, or browser interruption.
- [ ] Threshold proposal for "probably silent recording" exists.
- [ ] Decision recorded on whether to add a visible warning.

## Out Of Scope

- Full voice activity detection engine.
- Rust/WASM implementation.
- Native Android audio focus handling.
- Notification system.
