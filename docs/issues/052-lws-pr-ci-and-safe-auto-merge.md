# 052: LWS PR CI And Safe Auto-Merge

Status: planned

## Type

AFK implementation slice.

## Parent

`046-lws-markdown-scheme-authoring-workflow.md`

## What To Build

Add GitHub Actions for Living Water Systems content PRs.

CI should run automatically on pull requests and also be manually runnable from
GitHub. Draft-only content changes can have a safe auto-merge path after checks
pass. Publishing a level should require Peter or qualified mentor review.

## Acceptance Criteria

- [ ] CI runs on pull requests touching LWS scheme Markdown.
- [ ] Manual `workflow_dispatch` button exists.
- [ ] CI runs Markdown validation.
- [ ] CI builds/renders the handbook pages.
- [ ] CI checks JobDone export payload generation.
- [ ] Draft-only content can be configured for auto-merge after checks pass.
- [ ] `status: published` changes require human review.
- [ ] Failed validation explains what to fix clearly.

## Blocked By

- `048-lws-markdown-validation-before-publish.md`
- `049-render-lws-markdown-handbook-pages.md`
- `051-generate-jobdone-import-payload-from-lws-markdown.md`
