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

- Frontend can upload a captured audio chunk to backend.
- Backend transcribes it with OpenAI.
- Backend returns transcript text.
- Failed transcription leaves recent audio available for retry while cache exists.
- No OpenAI secret is present in frontend code or committed files.

## Out Of Scope

- User-supplied API keys.
- Multi-provider transcription.
- Transcript correction UI.
- Long-term audio archive.
