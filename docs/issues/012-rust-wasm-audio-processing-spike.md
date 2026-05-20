# Issue 012: Rust/WASM Audio Processing Spike

## Goal

Humour the Rust/WASM branch while keeping it honest: evaluate whether local audio processing would
help Continuum.

## Scope

- Identify audio processing jobs Rust/WASM might help with.
- Consider local voice activity detection, audio levels, compression/preprocessing, and feature
  extraction.
- Confirm what Rust/WASM cannot solve: Bluetooth routing, headset buttons, Android audio focus,
  background recording.
- Decide whether any processing need exists before adding this complexity.

## Acceptance Criteria

- [ ] Candidate Rust/WASM jobs listed with expected benefit.
- [ ] Browser-native alternatives listed.
- [ ] Complexity and bundle-size impact estimated.
- [ ] Decision recorded: spike / defer / reject.

## Out Of Scope

- Implementing Rust/WASM.
- Native Android integration.
- Wake-word model.
- Replacing browser microphone APIs.
