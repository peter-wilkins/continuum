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

- Open/focus app while logged in -> listening starts.
- Speak in a quiet place -> a speech chunk is captured.
- Silence is not sent for transcription.
- Hide/blur app -> microphone capture stops.
- Refocus app -> listening resumes.

## Out Of Scope

- Background or lock-screen recording.
- Hardware button capture.
- Native app shortcuts.
- Permanent audio storage.
- Complex voice activity tuning.
