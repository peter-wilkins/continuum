# 050: LWS New Level Scaffold Tool

Status: planned

## Type

AFK implementation slice.

## Parent

`046-lws-markdown-scheme-authoring-workflow.md`

## Context

GitHub is a good first editor until a contributor needs to create a brand-new
page or level. The first tooling improvement should remove that cliff without
building a full CMS.

## What To Build

Add a small scaffold tool that asks a few questions and generates a valid level
Markdown file from the template.

The first version can be CLI or private-workbench style. It does not need a
public editor.

## Acceptance Criteria

- [ ] Tool asks for scheme, level name/number, title, and short purpose.
- [ ] Tool generates a slug/id, version date, and valid Markdown file.
- [ ] Tool prevents duplicate level IDs.
- [ ] Tool runs or points to validation after generation.
- [ ] Generated file is easy to continue editing in GitHub.

## Blocked By

- `047-lws-markdown-scheme-file-structure-and-template.md`
- `048-lws-markdown-validation-before-publish.md`
