# Issue 003: Explicit Record Capture

## Goal

Make the app record only while the user explicitly holds the capture flow open with a mic button.

The original day-one idea was automatic foreground capture. Real testing showed that constant
capture is too noisy for the MVP: it can interfere with dictation, burn CPU, and make it unclear
when API calls are happening.

## Scope

- Show one simple record button in the logged-in transcript view.
- Start microphone capture only when the button is pressed.
- Stop capture when the button is pressed again.
- Upload one recorded clip for transcription after stop.
- Keep a volatile recent-audio cache for debugging and retrying failed transcription.
- Do not add a pause/resume button.

## Acceptance Criteria

- [x] Logged-out users see only the login screen.
- [x] Logged-in users see the reverse-chronological transcript log.
- [x] Press record -> microphone capture starts.
- [x] Press again -> capture stops and the audio is sent for transcription.
- [x] Short accidental taps are discarded locally.
- [x] Successful transcription appears at the top of the log.

## Verification

- [x] TypeScript production build passes.
- [ ] Real-device microphone capture has been tested in mobile browser/PWA.

## Out Of Scope

- Background or lock-screen recording.
- Hardware button capture.
- Native app shortcuts.
- Permanent audio storage.
- Complex voice activity tuning.
