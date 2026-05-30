import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PublicContinuumResponse } from '@continuum/shared';

import { sourceLabel } from './PublicSourceLinks.js';

describe('Public source links', () => {
  it('labels a source paragraph for humans with one-based paragraph numbers', () => {
    const paragraph: PublicContinuumResponse['sourceParagraphs'][number] = {
      id: 'paragraph:1',
      canonicalEventId: 'event:1',
      title: 'Extended mind',
      sourceName: 'Wikipedia',
      sourceUrl: 'https://example.test/wiki',
      license: 'fixture',
      paragraphIndex: 0,
    };

    assert.equal(sourceLabel(paragraph), 'Wikipedia / Extended mind / paragraph 1');
  });
});
