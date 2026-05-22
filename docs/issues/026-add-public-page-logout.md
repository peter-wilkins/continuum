# Issue 026: Add Public Page Logout

Status: done

## Goal

Make the public feedback sign-in flow repeatable during local and phone testing.

## Scope

- Add a visible sign-out action to the public Ada Continuum page when the user is signed in.
- Sign out only the current browser/device session.
- Clear any pending public feedback intent during sign-out.
- Preserve the existing sign-in-to-vote flow.

## Acceptance Criteria

- [x] Signed-in public users can sign out from `/public/ada-lovelace`.
- [x] Sign-out uses Supabase local scope, not global scope.
- [x] Pending public feedback intent is cleared on sign-out.
- [x] Existing public feedback smoke checks still pass.
