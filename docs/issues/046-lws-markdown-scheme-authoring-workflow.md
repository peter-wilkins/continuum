# 046: LWS Markdown Scheme Authoring Workflow

Status: planned

## Type

Epic / product infrastructure.

## Context

Living Water Systems needs a way to define learning schemes, levels, challenges,
evidence suggestions, and reviewer notes before JobDone can import them.

GitHub is the first editor. Markdown files, pull requests, review permissions,
commit history, and CI are enough for the first authoring workflow. Do not build
a custom CMS until GitHub editing proves too painful.

This epic blocks the JobDone integration epic.

## What To Build

Create a Markdown-first authoring workflow where contributors can write and
review Living Water Systems schemes in GitHub.

The workflow should support:

- one scheme folder with one file per level
- required frontmatter for machine-readable IDs and versioning
- human-readable level body sections
- validation before publish
- public handbook rendering
- a scaffold tool for creating a new level without remembering file paths
- export readiness for JobDone `.lws.md` import payloads

## Product Decisions

- GitHub is the first editor and permission system.
- Contributors edit Markdown and use pull requests.
- Published levels are versioned; learners are grandfathered onto the version
  they start.
- Draft content can change freely.
- Published content should only get typo fixes in place; meaningful changes
  create a new version.

## Acceptance Criteria

- [ ] Scheme and level Markdown file structure exists.
- [ ] Level template documents required frontmatter and sections.
- [ ] Validation catches missing IDs, missing sections, duplicate IDs, and
      version/status mistakes.
- [ ] Public handbook pages render from Markdown.
- [ ] A contributor can scaffold a new valid level.
- [ ] JobDone export payload can be generated from a level.

## Child Issues

- `047-lws-markdown-scheme-file-structure-and-template.md`
- `048-lws-markdown-validation-before-publish.md`
- `049-render-lws-markdown-handbook-pages.md`
- `050-lws-new-level-scaffold-tool.md`
- `051-generate-jobdone-import-payload-from-lws-markdown.md`
- `052-lws-pr-ci-and-safe-auto-merge.md`

## Blocked By

None - can start immediately.
