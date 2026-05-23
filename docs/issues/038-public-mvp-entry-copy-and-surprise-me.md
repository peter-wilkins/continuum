# 038: Public MVP Entry Copy And Surprise Me

Status: ready

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

- [ ] The public MVP entry surface uses `Extend the Mind` as the first clear product/topic signal.
- [ ] The entry copy explains the one-topic boundary before the user explores.
- [ ] A `Surprise me` action selects one curated seed question and takes the user into the public extended-thought Continuum.
- [ ] The seeded question is visible in the Continuum surface so the user knows what they are exploring.
- [ ] `Surprise me` does not pick raw source chunks directly.
- [ ] The entry copy positions custom queries as voice-first and uses `Ask out loud about tools for thought` as its prompt.
- [ ] Actual browser speech recognition is not implemented in this issue; it is left for issue 039.
- [ ] Any visible text query field is clearly a fallback, not the primary interaction.
- [ ] Spoken or fallback text questions are accepted only inside the loaded MVP topic boundary.
- [ ] Off-topic questions show a clear MVP-boundary explanation and do not pretend to answer from missing data.
- [ ] The issue leaves room for the answer-first flow: synthesized answer first, evidence/cards second, Line of Inquiry after.
- [ ] The copy avoids implying this is a complete personal Continuum.
- [ ] Mobile layout at 360px keeps the title, setup, and action readable.
- [ ] Public Continuum smoke checks still pass: `npm run smoke:public-continuum --workspace backend`.

## Blocked by

None - can start immediately.
