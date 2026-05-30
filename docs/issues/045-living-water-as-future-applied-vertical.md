# 045: Living Water As Future Applied Continuum Vertical

Status: parked

## Type

Product/domain design.

## Context

Workflow Manager generated a Living Water Skills Scheme prototype:

```text
http://100.112.20.26:8899/artifacts/living-water-skills/
```

It is an RYA-inspired learning pathway, logbook, and story system for water-cycle restoration and nature repair.

## Decision

Do not integrate the Living Water app into Continuum now.

Treat it as a future applied Continuum vertical. Reuse concepts only, unless a later MVP decision makes this directly useful.

## Reusable Concepts

- learning path and progress model
- evidence logbook
- review states such as `needs_review`, signed off, and public-safe
- private/public story membrane
- role-scoped sign-off
- learn, capture, reflect, review, share safely loop

## Continuum Mapping

Living Water maps strongly to existing Continuum concepts:

- Learning Journey
- Thought Cards
- source-backed evidence
- membranes
- feedback and review loops

## Guardrail

Whole-app integration is a side quest for the current public MVP.

The only useful action now is to keep Living Water as a concrete example when designing reusable journey, evidence, membrane, and review Interfaces.

## Suggested Later Slice

When Continuum has a stable Learning Journey and evidence/review model, build a tiny Living Water demo as a vertical:

1. one fake site
2. one learner path
3. a few evidence items
4. one private story card
5. one public-safe story card
6. no real certification claims
