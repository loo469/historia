import test from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryMythLedger } from '../../../src/adapters/climate/InMemoryMythLedger.js';
import { Myth } from '../../../src/domain/climate/Myth.js';

test('InMemoryMythLedger records myths and finds them from origin events', () => {
  const ledger = new InMemoryMythLedger([
    new Myth({
      id: 'myth-storm-001',
      title: 'The Skyfire Returns',
      category: 'omen',
      originEventIds: ['storm-001'],
      summary: 'A radiant omen seen before the floods.',
    }),
  ]);

  const recorded = ledger.record({
    id: 'myth-flood-002',
    title: 'The River Without Mercy',
    category: 'catastrophe',
    originEventIds: ['flood-002', 'storm-001'],
    summary: 'A tale born from the great flood.',
    tags: ['flood'],
  });

  assert.equal(recorded.id, 'myth-flood-002');
  assert.deepEqual(ledger.findByOriginEventId('flood-002').map((myth) => myth.id), ['myth-flood-002']);
  assert.deepEqual(ledger.findByOriginEventId('storm-001').map((myth) => myth.id), ['myth-storm-001', 'myth-flood-002']);
  assert.equal(ledger.findByMythId('myth-flood-002')?.title, 'The River Without Mercy');
});

test('InMemoryMythLedger returns defensive copies for recorded and loaded myths', () => {
  const ledger = new InMemoryMythLedger();

  const recorded = ledger.record({
    id: 'myth-solstice-003',
    title: 'The Burning Solstice',
    category: 'seasonal',
    originEventIds: ['solstice-003'],
    summary: 'A tale woven around the hottest summer on record.',
    tags: ['summer'],
  });

  recorded.title = 'Tampered title';

  const found = ledger.findByMythId('myth-solstice-003');
  found.tags.push('mutated');

  assert.equal(ledger.findByMythId('myth-solstice-003')?.title, 'The Burning Solstice');
  assert.deepEqual(ledger.findByMythId('myth-solstice-003')?.tags, ['summer']);
});

test('InMemoryMythLedger snapshots canonical myth data and validates identifiers', () => {
  const ledger = new InMemoryMythLedger([
    {
      id: 'myth-blizzard-king',
      title: 'The Blizzard King',
      category: 'catastrophe',
      originEventIds: ['blizzard-7'],
      summary: 'A tale born from the great white winter.',
      credibility: 40,
    },
  ]);

  assert.deepEqual(ledger.snapshot().map((myth) => myth.id), ['myth-blizzard-king']);
  assert.deepEqual(ledger.findByOriginEventId('unknown-event'), []);

  assert.throws(
    () => new InMemoryMythLedger({}),
    /seed must be an array/,
  );

  assert.throws(
    () => new InMemoryMythLedger([null]),
    /must be a Myth or plain object/,
  );

  assert.throws(
    () => ledger.findByOriginEventId(''),
    /originEventId is required/,
  );

  assert.throws(
    () => ledger.findByMythId('  '),
    /mythId is required/,
  );
});
