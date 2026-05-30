import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PublicContinuumResponse } from '@continuum/shared';

import { activeLensOutputId, lensSnapIndex } from './publicLensStrip.js';

describe('Public Lens strip', () => {
  it('rounds scroll position to the nearest snap page', () => {
    assert.equal(lensSnapIndex({ scrollLeft: 0, clientWidth: 390 }), 0);
    assert.equal(lensSnapIndex({ scrollLeft: 390, clientWidth: 390 }), 1);
    assert.equal(lensSnapIndex({ scrollLeft: 585, clientWidth: 390 }), 2);
  });

  it('uses null for answer page and maps later snap pages to Lens outputs', () => {
    const displayedOutputs: PublicContinuumResponse['outputs'] = [
      {
        id: 'lens-output:atlas',
        lensId: 'atlas',
        lensVersion: '1.0.0',
        thoughtCardIds: [],
        sections: [],
      },
      {
        id: 'lens-output:loom',
        lensId: 'loom',
        lensVersion: '1.0.0',
        thoughtCardIds: [],
        sections: [],
      },
    ];

    assert.equal(activeLensOutputId({ activeSnapIndex: 0, displayedOutputs }), null);
    assert.equal(activeLensOutputId({ activeSnapIndex: 1, displayedOutputs }), 'lens-output:atlas');
    assert.equal(activeLensOutputId({ activeSnapIndex: 2, displayedOutputs }), 'lens-output:loom');
    assert.equal(activeLensOutputId({ activeSnapIndex: 3, displayedOutputs }), null);
  });
});
