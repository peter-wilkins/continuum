# 048: LWS Markdown Validation Before Publish

Status: planned

## Type

AFK implementation slice.

## Parent

`046-lws-markdown-scheme-authoring-workflow.md`

## What To Build

Add validation for Living Water Systems scheme Markdown so GitHub PRs can fail
fast with human-readable errors.

Validation should keep Markdown pleasant to write while making published/exported
levels reliable enough for JobDone import.

## Acceptance Criteria

- [ ] Validation checks required frontmatter fields.
- [ ] Validation checks required level body headings.
- [ ] Validation catches duplicate `scheme + level + version` identifiers.
- [ ] Validation enforces basic `status` values such as `draft` and `published`.
- [ ] Validation catches obvious version/status mistakes for published levels.
- [ ] Validation confirms a JobDone export payload can be generated.
- [ ] Validation output is readable by non-technical contributors.

## Blocked By

- `047-lws-markdown-scheme-file-structure-and-template.md`
