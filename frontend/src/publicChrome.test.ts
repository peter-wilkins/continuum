import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { derivePublicChromeMenu } from './publicChrome.js';

describe('Public app chrome', () => {
  it('shows base navigation and git hash for logged-out browser users', () => {
    const menu = derivePublicChromeMenu({
      canInstall: false,
      installing: false,
      installed: false,
      loggedIn: false,
      gitHash: 'abc1234',
    });

    assert.deepEqual(menu, [
      { kind: 'action', id: 'reload', label: 'Reload' },
      { kind: 'action', id: 'guide', label: 'Guide' },
      { kind: 'action', id: 'lens_compare', label: 'Lens Compare' },
      { kind: 'action', id: 'feedback', label: 'Feedback' },
      { kind: 'note', label: 'Git abc1234' },
    ]);
  });

  it('shows install state before sign out and git hash', () => {
    const menu = derivePublicChromeMenu({
      canInstall: true,
      installing: true,
      installed: true,
      loggedIn: true,
      gitHash: 'def5678',
    });

    assert.deepEqual(menu.slice(-4), [
      { kind: 'install', label: 'Installing', disabled: true },
      { kind: 'note', label: 'Installed' },
      { kind: 'sign_out', label: 'Sign out' },
      { kind: 'note', label: 'Git def5678' },
    ]);
  });
});
