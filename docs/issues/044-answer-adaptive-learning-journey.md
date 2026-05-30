# 044: Answer-Adaptive Learning Journey

Status: backlog

## Type

Product/domain design.

## Context

The Learning Journey and Socratic Teacher prototypes ask the user for an answer. That answer should not be a dead-end form submission.

The interesting product question is how the journey evolves based on what the user says.

## Idea

Treat each answer as a signal that can change the journey path:

- correct or useful answer -> advance to the next question
- partial answer -> ask a smaller clarifying question
- surprising answer -> create or follow a side branch
- confused answer -> change teaching strategy
- source challenge -> reveal evidence or ask a source-grounded repair question
- off-topic answer -> park as a branch, then return to the current step

## Domain Shape

The journey should probably be an append-only state machine:

- question asked
- user answer
- interpretation of answer
- next journey move
- reason for the move
- links to source/evidence

The interpretation is not truth. It is model output or deterministic feedback that should remain inspectable.

## MVP Slice

Prototype the smallest answer loop:

1. User taps `I have an answer`.
2. UI opens a freeform answer box or speech capture.
3. User submits answer.
4. System chooses one of three visible next moves:
   - `advance`
   - `clarify`
   - `branch`
5. UI updates the Learning Journey progress/path without becoming a chat transcript.

## Product Decision

Learning Journey should use freeform answers, not multiple choice. Multiple choice feels too much like a test and removes the signal needed for adaptive journey evolution.

## Open Questions

- Should the user see the system's interpretation of their answer before the journey path changes?
- Is the path chosen by deterministic rules first, an LLM, or both with a debug comparison?
- How do we keep answer adaptation low-friction enough for modern distracted attention?

## Related

- `042-non-document-thought-screen-prototypes.md`
- `043-socratic-teacher-mode-from-chairman.md`
