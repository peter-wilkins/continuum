# 051: Generate JobDone Import Payload From LWS Markdown

Status: planned

## Type

AFK implementation slice.

## Parent

`046-lws-markdown-scheme-authoring-workflow.md`

## What To Build

Generate a JobDone-friendly `.lws.md` payload from a Living Water Systems level.

The payload should be human-readable Markdown with enough structured frontmatter
for JobDone to import it into a team backlog.

Example shape:

```markdown
---
source: living-water-systems
scheme: living-water-skills
level: level-2-pond
version: 2026-06-06
teamName: Living Water Skills
---

# Level 2: Pond Challenge

## Backlog items

- Confirm pond holds water after rain
- Add native aquatic plants
- Record wildlife observations
- Photograph pond edge improvements
```

## Acceptance Criteria

- [ ] Export includes `source`, `scheme`, `level`, `version`, title, and team
      suggestion.
- [ ] Export includes backlog/checklist items derived from the level challenges.
- [ ] Export preserves suggested evidence and reviewer rubric where practical.
- [ ] Export is readable if opened as plain Markdown.
- [ ] Re-exporting the same level/version is deterministic.

## Blocked By

- `047-lws-markdown-scheme-file-structure-and-template.md`
- `048-lws-markdown-validation-before-publish.md`
