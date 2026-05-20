# Issue 003: Auto Foreground Capture

## Goal

Make the app listen automatically when logged in and focused.

## Scope

- Start microphone capture after login when the app is visible/focused.
- Stop capture when the app is hidden or blurred.
- Resume automatically when focused again.
- Add local silence filtering / speech chunking.
- Keep a volatile recent-audio cache for retrying failed transcription.
- Do not add a record button.
- Do not add a pause/resume button.

## Acceptance Criteria

- [x] Open/focus app while logged in -> listening starts.
- [x] Speak in a quiet place -> a speech chunk is captured.
- [x] Silence is not sent for transcription.
- [x] Hide/blur app -> microphone capture stops.
- [x] Refocus app -> listening resumes.

## Verification

- [x] TypeScript production build passes.
- [ ] Real-device microphone capture has been tested in mobile browser/PWA.

## Out Of Scope

- Background or lock-screen recording.
- Hardware button capture.
- Native app shortcuts.
- Permanent audio storage.
- Complex voice activity tuning.
