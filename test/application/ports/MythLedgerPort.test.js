import test from 'node:test';
import assert from 'node:assert/strict';

import { MythLedgerPort } from '../../../src/application/ports/MythLedgerPort.js';
import { Myth } from '../../../src/domain/climate/Myth.js';

class InMemoryMythLedger extends MythLedgerPort {
  constructor(seed = []) {
    super();
    this.mythsByOrigin = new Map();

    for (const myth of seed) {
      for (const originEventId of myth.originEventIds) {
        this.mythsByOrigin.set(originEventId, myth);
      }
    }
  }

  record(myth) {
    for (const originEventId of myth.originEventIds) {
      this.mythsByOrigin.set(originEventId, myth);
    }

    return myth;
  }

  findByOriginEventId(originEventId) {
    return this.mythsByOrigin.get(originEventId) ?? null;
  }
}

test('MythLedgerPort provides batch helpers around myth recording and lookup', () => {
  const ledger = new InMemoryMythLedger([
    new Myth({
      id: 'myth-storm-001',
      title: 'The Skyfire Returns',
      category: 'omen',
      originEventIds: ['storm-001'],
      summary: 'A radiant omen seen before the floods.',
    }),
  ]);

  const found = ledger.findManyByOriginEventIds(['storm-001', 'quake-004']);

  assert.equal(found[0].id, 'myth-storm-001');
  assert.equal(found[1], null);

  const recorded = ledger.recordMany([
    {
      id: 'myth-flood-002',
      title: 'The River Without Mercy',
      category: 'catastrophe',
      originEventIds: ['flood-002'],
      summary: 'A tale born from the great flood.',
      tags: ['flood'],
    },
  ]);

  assert.equal(recorded[0].id, 'myth-flood-002');
  assert.equal(ledger.findByOriginEventId('flood-002').title, 'The River Without Mercy');
});

test('MythLedgerPort exposes clear errors for missing implementations and invalid batches', () => {
  const ledger = new MythLedgerPort();

  assert.throws(
    () => ledger.record(new Myth({
      id: 'myth-storm-001',
      title: 'The Skyfire Returns',
      category: 'omen',
      originEventIds: ['storm-001'],
      summary: 'A radiant omen seen before the floods.',
    })),
    /record must be implemented/,
  );

  assert.throws(
    () => ledger.findByOriginEventId('storm-001'),
    /findByOriginEventId must be implemented/,
  );

  assert.throws(
    () => ledger.recordMany(null),
    /myths must be an array/,
  );

  assert.throws(
    () => ledger.findManyByOriginEventIds(null),
    /originEventIds must be an array/,
  );
});
