# 038: Public MVP Entry Copy And Surprise Me

Status: done

Type: AFK

## What to build

Make the public MVP boundary explicit before users start exploring.

The MVP is not a full personal Continuum yet. It knows one bounded topic: extending thought and brain augmentation. The entry/guide surface should say that plainly, then offer a low-friction discovery action.

Use this copy direction:

- Title: `Extend the Mind`
- Setup: `This demo knows one topic: how people use tools, machines, and ideas to think beyond the brain.`
- Primary action: `Surprise me`
- Voice prompt: `Ask out loud about tools for thought`

`Surprise me` should choose from a tiny curated list of seeded questions and open the current public extended-thought Continuum. It should not select random Wikipedia chunks.

Initial seed questions:

- `What tools have people used to extend thought?`
- `When does a tool become part of thinking?`
- `How have computers changed the shape of thought?`
- `What is brain augmentation trying to solve?`

For the MVP, the selected seed may initially reuse the current public Continuum data. The product direction is answer-first: show a synthesized answer, keep Lens/Thought Cards available as evidence, then ask one Line of Inquiry.

The entry surface should not make typing feel like the primary path. The user should be able to speak their own query. If a text fallback exists, it is secondary and should not become the main UX.

Scope split: this issue owns the public entry copy, topic boundary, and `Surprise me`. Actual browser speech recognition belongs to `039-voice-first-public-query-entry.md`.

For MVP, spoken or fallback text questions are topic-bounded: they should be treated as questions about tools for thought, extended thought, or brain augmentation.

If a question falls outside the loaded topic, the UX should explain the product boundary rather than pretending the full future Continuum exists. Copy direction:

`This MVP only has one topic loaded: tools, machines, and ideas that extend thought. In a full Continuum, your question should be valid. For now, try asking it through that lens.`

## Acceptance criteria

- [x] The public MVP entry surface uses `Extend the Mind` as the first clear product/topic signal.
- [x] The entry copy explains the one-topic boundary before the user explores.
- [x] A `Surprise me` action selects one curated seed question and takes the user into the public extended-thought Continuum.
- [x] The seeded question is visible in the Continuum surface so the user knows what they are exploring.
- [x] `Surprise me` does not pick raw source chunks directly.
- [x] The entry copy positions custom queries as voice-first and uses `Ask out loud about tools for thought` as its prompt.
- [x] Actual browser speech recognition is not implemented in this issue; it is left for issue 039.
- [x] No visible text query field is shown in this issue; text fallback belongs to issue 039.
- [x] `Surprise me` seed questions stay inside the loaded MVP topic boundary.
- [x] Off-topic custom query handling is left to issue 039 because this issue does not accept arbitrary questions.
- [x] The issue leaves room for the answer-first flow: synthesized answer first, evidence/cards second, Line of Inquiry after.
- [x] The copy avoids implying this is a complete personal Continuum.
- [x] Mobile layout has no new wide controls; manual 360px visual QA remains part of the next phone/browser pass.
- [x] Public Continuum smoke checks still pass: `npm run smoke:public-continuum --workspace backend`.

## Blocked by

None - can start immediately.
