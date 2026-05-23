# Issue 030: Render Bootstrap Thought Cards

Status: done

## Goal

Use the materialized public Continuum preview from `../continuum-core` as the app's main public MVP surface.

## Scope

- Serve the `extended thought through brain augmentation` materialized preview from the backend.
- Extend the shared public Continuum response with Source Paragraphs and Thought Cards.
- Render each Lens as an ordered Thought Card stream.
- Keep source provenance visible from each card.
- Keep Lens feedback attached to the active target.

## Acceptance Criteria

- [x] `/api/public-continuum/extended-thought` returns the materialized bootstrap preview.
- [x] `/public/extended-thought` renders three Lens card streams.
- [x] Cards show small thought chunks rather than whole document text.
- [x] Card provenance links back to public source URLs.
- [x] Existing Lens guide and feedback flows work for the active target.
- [x] Build and smoke checks pass.

## Out Of Scope

- Database persistence.
- Editing or approving review candidates.
- LLM-generated card rewriting.

## Verification

- API: 6 events, 58 Source Paragraphs, 174 Thought Cards.
- Each Lens output serves 58 Thought Cards.
- Headless Chrome rendered `/public/extended-thought` successfully.
