# Issue 013: Backend Audio Snippet Archive

## Goal

Persist recorded audio snippets on the backend so they can be reused as test and evaluation data
for later analysis work, such as sentiment, mood, tone, transcription quality, and audio-processing
experiments.

## Scope

- Store uploaded audio snippets after authenticated transcription requests.
- Associate each snippet with the authenticated user.
- Link snippets to the resulting `continuum.events` row where possible.
- Store useful metadata: duration, size, MIME type, model, language, transcription result, device
  diagnostics, upload timestamp, and queue/offline retry context.
- Make snippets available for internal evaluation workflows.
- Keep raw audio private and backend-controlled.

## Acceptance Criteria

- [ ] SQL migration exists for audio snippet metadata/storage references.
- [ ] Backend stores each successfully uploaded audio snippet or durable reference to it.
- [ ] Snippet metadata links to transcript event IDs where available.
- [ ] Access is restricted to the owning user and backend/service role.
- [ ] Raw audio is not exposed through public frontend routes.
- [ ] Test/evaluation use case is documented: sentiment, mood, tone, transcription quality.

## Security And Privacy Constraints

- Raw audio is more sensitive than transcript text.
- Do not expose raw audio in normal UI.
- Do not include raw audio in prompts unless explicitly needed for a controlled evaluation.
- Storage must support deletion/export decisions later, even in MVP mode.
- Avoid silent retention surprises: user-facing copy should eventually say raw snippets are stored.

## Open Questions

- Store audio in Supabase Storage, Postgres `bytea`, or another backend-controlled object store?
- Store every snippet forever, or only a labelled evaluation subset?
- Should failed/empty transcriptions be stored too? They may be especially useful test data.
- Should offline queued audio become backend snippets only after successful upload, or preserve
  failed uploads locally until explicit retry/delete?

## Out Of Scope

- Implementing sentiment or mood extraction.
- Building an audio review UI.
- Public audio sharing.
- Long-term retention policy beyond MVP test-data capture.
