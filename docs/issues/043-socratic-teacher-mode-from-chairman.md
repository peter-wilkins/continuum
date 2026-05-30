# 043: Socratic Teacher Mode From Chairman

Status: backlog

## Type

Product idea.

## Context

Chairman mode already manages a thought journey: it keeps the current line in focus, tracks progress, holds side branches, and asks the next useful question.

That same structure can switch into a Socratic teacher mode. Instead of only facilitating progress toward an agreement or decision, the Chairman can teach by asking carefully sequenced questions that help the user discover the answer.

## Idea

Add a mode switch for Chairman-style journeys:

- **Chairman mode**: keep the meeting/thought journey moving.
- **Socratic teacher mode**: teach by asking guided questions.

The underlying state can stay similar:

- current question
- current claim or misconception
- evidence/source chips
- progress through the line
- side branches
- agreements or learned points

## MVP Shape

Do not build a full education system yet.

First slice could be a prototype variant that changes only the prompt framing and copy:

- active question becomes a teaching question
- progress means "understanding built" rather than "meeting completed"
- feedback asks whether the question helped understanding
- sources remain hidden behind `Why this?`

## Acceptance Notes

- [ ] Capture mode as explicit journey framing, not a separate document/page type.
- [ ] Preserve the same non-document screen constraints from issue 042.
- [ ] Keep the user in control; teacher mode should not patronize or over-explain.
- [ ] Prefer questions over lectures.

## Related

- `042-non-document-thought-screen-prototypes.md`
- `041-phone-concierge-thought-journey-v0.md`

