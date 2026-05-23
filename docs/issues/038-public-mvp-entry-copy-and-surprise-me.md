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
- Question placeholder: `Ask about tools for thought`

`Surprise me` should choose from a tiny curated list of seeded questions and open the current public extended-thought Continuum. It should not select random Wikipedia chunks.

Initial seed questions:

- `What tools have people used to extend thought?`
- `When does a tool become part of thinking?`
- `How have computers changed the shape of thought?`
- `What is brain augmentation trying to solve?`

For the MVP, the selected seed can render the same Lens carousel. Later, each surprise can generate a Line of Inquiry.

The entry surface may also let the user type their own question. For MVP, custom questions are topic-bounded: they should be treated as questions about tools for thought, extended thought, or brain augmentation.

If a question falls outside the loaded topic, the UX should explain the product boundary rather than pretending the full future Continuum exists. Copy direction:

`This MVP only has one topic loaded: tools, machines, and ideas that extend thought. In a full Continuum, your question should be valid. For now, try asking it through that lens.`

## Acceptance criteria

- [ ] The public MVP entry surface uses `Extend the Mind` as the first clear product/topic signal.
- [ ] The entry copy explains the one-topic boundary before the user explores.
- [ ] A `Surprise me` action selects one curated seed question and takes the user into the public extended-thought Continuum.
- [ ] The seeded question is visible in the Continuum surface so the user knows what they are exploring.
- [ ] `Surprise me` does not pick raw source chunks directly.
- [ ] Any question input placeholder uses `Ask about tools for thought` if a question input exists in this slice.
- [ ] Custom questions are accepted only inside the loaded MVP topic boundary.
- [ ] Off-topic questions show a clear MVP-boundary explanation and do not pretend to answer from missing data.
- [ ] The copy avoids implying this is a complete personal Continuum.
- [ ] Mobile layout at 360px keeps the title, setup, and action readable.
- [ ] Public Continuum smoke checks still pass.

## Blocked by

None - can start immediately.
