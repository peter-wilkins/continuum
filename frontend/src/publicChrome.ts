export type PublicChromeMenuInput = {
  canInstall: boolean;
  installing: boolean;
  installed: boolean;
  loggedIn: boolean;
  gitHash: string;
};

export type PublicChromeMenuEntry =
  | { kind: 'action'; id: 'reload' | 'guide' | 'lens_compare' | 'feedback'; label: string }
  | { kind: 'install'; label: string; disabled: boolean }
  | { kind: 'sign_out'; label: string }
  | { kind: 'note'; label: string };

export function derivePublicChromeMenu(input: PublicChromeMenuInput): PublicChromeMenuEntry[] {
  const entries: PublicChromeMenuEntry[] = [
    { kind: 'action', id: 'reload', label: 'Reload' },
    { kind: 'action', id: 'guide', label: 'Guide' },
    { kind: 'action', id: 'lens_compare', label: 'Lens Compare' },
    { kind: 'action', id: 'feedback', label: 'Feedback' },
  ];

  if (input.canInstall) {
    entries.push({
      kind: 'install',
      label: input.installing ? 'Installing' : 'Install',
      disabled: input.installing,
    });
  }

  if (input.installed) {
    entries.push({ kind: 'note', label: 'Installed' });
  }

  if (input.loggedIn) {
    entries.push({ kind: 'sign_out', label: 'Sign out' });
  }

  entries.push({ kind: 'note', label: `Git ${input.gitHash}` });

  return entries;
}
