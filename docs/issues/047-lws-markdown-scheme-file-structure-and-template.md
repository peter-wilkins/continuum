# 047: LWS Markdown Scheme File Structure And Level Template

Status: planned

## Type

AFK implementation slice.

## Parent

`046-lws-markdown-scheme-authoring-workflow.md`

## What To Build

Create the initial Markdown file structure and templates for Living Water
Systems schemes.

Recommended shape:

```text
schemes/
  living-water-skills/
    scheme.md
    levels/
      level-1-observer.md
      level-2-pond.md
```

Each level should have required frontmatter for machine-readable fields and
standard human sections for contributors.

Example frontmatter:

```yaml
---
scheme: living-water-skills
level: level-2-pond
version: 2026-06-06
title: "Level 2: Pond Challenge"
status: draft
suggestedEvidence:
  - photo
  - observation-note
  - location
reviewerLevelRequired: level-3
---
```

Required sections:

```markdown
## What You Will Learn
## Challenges
## Evidence Suggestions
## Reviewer Notes
```

## Acceptance Criteria

- [ ] `scheme.md` exists for the starter Living Water Skills scheme.
- [ ] At least one starter level file exists.
- [ ] Level template includes required frontmatter and headings.
- [ ] Template is readable and editable directly in GitHub.
- [ ] The structure is documented for non-technical contributors.

## Blocked By

None - can start immediately.
