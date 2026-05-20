# Issue 005: Immutable Event Log UI

## Goal

Show spoken transcript events as a live reverse-chronological log.

## Scope

- Logged-out state shows only login.
- Logged-in state shows transcript log.
- Newest transcript events appear at the top.
- Show transcript and timestamp.
- Hide metadata by default.
- Show metadata/debug detail behind a URL flag such as `?debug=1`.

## Acceptance Criteria

- [x] After speech is transcribed and saved, transcript appears at top of screen.
- [x] Older transcript events remain visible below newer ones.
- [x] Metadata is hidden in normal mode.
- [x] Debug URL flag exposes stored metadata for inspection.
- [ ] Main view contains no auth/user chrome and no capture controls.

## Out Of Scope

- Thread views.
- Search UI.
- Summaries.
- Chat interface.
- Dashboard layout.
- Manual tagging or folders.
