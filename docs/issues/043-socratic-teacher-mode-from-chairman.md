# 043: Socratic Teacher Mode From Chairman

Status: prototype

## Type

Product idea.

## Context

Chairman mode already manages a thought journey: it keeps the current line in focus, tracks progress, holds side branches, and asks the next useful question.

That same structure can switch into a Socratic teacher mode. Instead of only facilitating progress toward an agreement or decision, the Chairman can teach by asking carefully sequenced questions that help the user discover the answer.

## Idea

Add a mode switch for Chairman-style journeys:

- **Chairman mode**: keep the meeting/thought journey moving.
- **Socratic teacher mode**: teach by asking guided questions.

## Differentiator From A Chatbot

A chatbot is usually an open-ended conversation box. The user carries the structure in their head.

Socratic Teacher mode should add structure the user does not have to hold:

- a visible learning path
- one current question
- explicit progress
- remembered branches
- answer interpretation
- source-backed repair when the user is confused or challenges the answer
- a clear next move instead of an endless transcript

The product value is not "the model can ask questions." ChatGPT can do that. The value is that Continuum turns those questions into a continuable learning journey with state, provenance, feedback, and low-friction return after distraction.

The UI should therefore avoid looking like a chat transcript. Freeform answers are allowed, but the screen should keep showing the journey state, not a scroll of messages.

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

- [x] Capture mode as explicit journey framing, not a separate document/page type.
- [x] Preserve the same non-document screen constraints from issue 042.
- [x] Keep the user in control; teacher mode should not patronize or over-explain.
- [x] Prefer questions over lectures.

## Prototype

Added as `?variant=teacher` on:

```text
/prototype/thought-screen
```

The prototype teaches extended thought one question at a time. It shows one large teaching question, tiny clue steps, understanding progress, and a "Give me a smaller question" escape hatch for distracted/tired attention.

## Related

- `042-non-document-thought-screen-prototypes.md`
- `041-phone-concierge-thought-journey-v0.md`
