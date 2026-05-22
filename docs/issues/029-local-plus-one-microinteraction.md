# Issue 029: Local +1 Feedback Microinteraction

Status: done

## Goal

Make a successful Lens preference feel acknowledged without adding noisy celebration or a global UI framework.

## Scope

- Keep the interaction local to the public Lens vote button.
- Use scoped React state and CSS animation only.
- Show a small `+1` pulse after feedback is recorded.
- Respect `prefers-reduced-motion`.
- Avoid confetti, toasts, and global UI frameworks.

## Acceptance Criteria

- [x] A recorded Lens preference emits a small local `+1` pulse.
- [x] The pulse removes itself after animation completes.
- [x] Reduced-motion users get a fade-only acknowledgement.
- [x] No new UI framework or animation dependency is added.
