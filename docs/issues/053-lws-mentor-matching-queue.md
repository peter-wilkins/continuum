# 053: LWS Mentor Matching Queue

Status: parked

## Type

HITL product design / later implementation.

## Context

The moment where a learner asks for evidence review is fragile and important.
JobDone should keep evidence private by default. A JobDone Share Pack is an
intentional disclosure object: the learner chooses to share it with a reviewer
or anyone who has the link.

Living Water Systems should own mentor matching and reviewer eligibility.
JobDone should own evidence capture and Share Pack creation.

## What To Build

Later, add a mentor queue to Living Water Systems.

Learners can mark themselves as looking for a mentor for a specific
`scheme + level + version`. Qualified mentors can see only review requests for
levels they are qualified to review. Reviewers open the learner's JobDone Share
Pack link to inspect evidence, then record the outcome in LWS.

## Acceptance Criteria

- [ ] Learner can opt into looking for mentor review for a level/version.
- [ ] Mentor visibility is filtered by reviewer qualification.
- [ ] Evidence is not copied into LWS automatically.
- [ ] Review request can include a JobDone Share Pack link.
- [ ] Review outcome is recorded in LWS.

## Blocked By

- `046-lws-markdown-scheme-authoring-workflow.md`
- JobDone Share Pack evidence flow for imported LWS levels.
