import test from 'node:test';
import assert from 'node:assert/strict';

import { Myth } from '../../../src/domain/climate/Myth.js';

test('Myth keeps normalized folklore metadata', () => {
  const myth = new Myth({
    id: ' myth-aurora ',
    title: ' The Skyfire Returns ',
    category: 'omen',
    originEventIds: ['storm-001', ' storm-001 ', 'eclipse-002'],
    summary: ' A radiant omen seen before the floods ',
    credibility: 64,
    regions: ['north-coast', 'riverlands', 'north-coast'],
    tags: ['skyfire', ' flood ', 'skyfire'],
    createdAt: '2026-04-18T12:00:00.000Z',
  });

  assert.deepEqual(myth.toJSON(), {
    id: 'myth-aurora',
    title: 'The Skyfire Returns',
    category: 'omen',
    status: 'emerging',
    originEventIds: ['storm-001', 'eclipse-002'],
    summary: 'A radiant omen seen before the floods',
    credibility: 64,
    regions: ['north-coast', 'riverlands'],
    tags: ['flood', 'skyfire'],
    createdAt: '2026-04-18T12:00:00.000Z',
    canonizedAt: null,
  });

  assert.equal(myth.referencesEvent('eclipse-002'), true);
  assert.equal(myth.isCanonized, false);
});

test('Myth transitions through memory lifecycle immutably', () => {
  const myth = new Myth({
    id: 'myth-blizzard-king',
    title: 'The Blizzard King',
    category: 'catastrophe',
    originEventIds: ['blizzard-7'],
    summary: 'A tale born from the great white winter.',
    credibility: 40,
    createdAt: '2026-04-18T10:00:00.000Z',
  });

  const spread = myth.rememberInRegion('highlands').addTag('winter').withCredibility(71);
  const canonized = spread.canonize('2026-04-21T10:00:00.000Z');
  const forgotten = canonized.forget();

  assert.equal(myth.regions.length, 0);
  assert.deepEqual(spread.regions, ['highlands']);
  assert.deepEqual(spread.tags, ['winter']);
  assert.equal(spread.credibility, 71);
  assert.equal(canonized.status, 'canonized');
  assert.equal(canonized.isCanonized, true);
  assert.equal(canonized.canonizedAt?.toISOString(), '2026-04-21T10:00:00.000Z');
  assert.equal(forgotten.status, 'forgotten');
  assert.equal(forgotten.canonizedAt, null);
});

test('Myth rejects invalid values and impossible chronology', () => {
  assert.throws(
    () => new Myth({ id: '', title: 'Bad', category: 'omen', originEventIds: ['e1'], summary: 'Nope' }),
    /Myth id is required/,
  );

  assert.throws(
    () => new Myth({ id: 'm1', title: 'Bad', category: 'legend', originEventIds: ['e1'], summary: 'Nope' }),
    /Myth category must be one of/,
  );

  assert.throws(
    () => new Myth({ id: 'm1', title: 'Bad', category: 'omen', originEventIds: [], summary: 'Nope' }),
    /Myth origins must be a non-empty array/,
  );

  assert.throws(
    () => new Myth({ id: 'm1', title: 'Bad', category: 'omen', originEventIds: ['e1'], summary: 'Nope', status: 'canonized' }),
    /canonized status requires canonizedAt/,
  );

  assert.throws(
    () => new Myth({ id: 'm1', title: 'Bad', category: 'omen', originEventIds: ['e1'], summary: 'Nope', createdAt: '2026-04-18T12:00:00.000Z', canonizedAt: '2026-04-17T12:00:00.000Z' }),
    /canonizedAt cannot be earlier than createdAt/,
  );
});
