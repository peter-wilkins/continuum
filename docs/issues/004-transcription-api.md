# Issue 004: OpenAI Transcription API

## Goal

Transcribe captured speech chunks through a backend-only OpenAI integration.

## Scope

- Add backend endpoint for audio chunk upload.
- Store `OPENAI_API_KEY` only in backend/local environment configuration.
- Use a separate Continuum OpenAI key, not the JobDone key.
- Return transcript plus useful audio/transcription metadata.
- Do not expose OpenAI key to frontend or Supabase.

## Acceptance Criteria

- [x] Frontend can upload a captured audio chunk to backend.
- [x] Backend transcribes it with OpenAI.
- [x] Backend returns transcript text.
- [x] Failed transcription leaves recent audio available for retry while cache exists.
- [x] No OpenAI secret is present in frontend code or committed files.

## Verification

- [x] TypeScript production build passes.
- [ ] Real-device transcription has been tested through the app.
- [ ] Backend transcription endpoint has been tested with a real Supabase session and audio chunk.

## Out Of Scope

- User-supplied API keys.
- Multi-provider transcription.
- Transcript correction UI.
- Long-term audio archive.
