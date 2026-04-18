import test from 'node:test';
import assert from 'node:assert/strict';

import { Front } from '../../../src/domain/war/Front.js';

test('Front keeps a normalized aggregate view of a war line', () => {
  const front = new Front({
    attackerFactionId: ' faction-a ',
    defenderFactionId: ' faction-b ',
    segmentIds: ['seg-02', ' seg-01 ', 'seg-02'],
    pressure: 18,
    momentum: 3,
    status: 'active',
  });

  assert.deepEqual(front.toJSON(), {
    id: 'faction-a::faction-b',
    attackerFactionId: 'faction-a',
    defenderFactionId: 'faction-b',
    segmentIds: ['seg-01', 'seg-02'],
    pressure: 18,
    momentum: 3,
    status: 'active',
    active: true,
    updatedAt: null,
  });

  assert.equal(front.dominantFactionId, 'faction-a');
});

test('Front supports immutable pressure, reinforcement, and conclusion transitions', () => {
  const front = new Front({
    id: 'front-north',
    attackerFactionId: 'faction-a',
    defenderFactionId: 'faction-b',
    segmentIds: ['seg-01'],
  });
  const pressureAt = new Date('2026-04-18T12:00:00.000Z');
  const reinforceAt = new Date('2026-04-18T12:05:00.000Z');
  const resolvedAt = new Date('2026-04-18T12:10:00.000Z');

  const pressuredFront = front.withPressure(-22, pressureAt);
  const reinforcedFront = pressuredFront.reinforce('seg-02', 4, reinforceAt);
  const resolvedFront = reinforcedFront.conclude(resolvedAt);

  assert.notEqual(pressuredFront, front);
  assert.equal(pressuredFront.status, 'active');
  assert.equal(pressuredFront.dominantFactionId, 'faction-b');
  assert.equal(pressuredFront.updatedAt?.toISOString(), pressureAt.toISOString());

  assert.deepEqual(reinforcedFront.segmentIds, ['seg-01', 'seg-02']);
  assert.equal(reinforcedFront.momentum, 4);
  assert.equal(reinforcedFront.updatedAt?.toISOString(), reinforceAt.toISOString());

  assert.equal(resolvedFront.active, false);
  assert.equal(resolvedFront.status, 'resolved');
  assert.equal(resolvedFront.updatedAt?.toISOString(), resolvedAt.toISOString());

  assert.equal(front.status, 'stalled');
  assert.equal(front.updatedAt, null);
});

test('Front rejects invalid faction pairs and invalid combat metrics', () => {
  assert.throws(
    () =>
      new Front({
        attackerFactionId: 'faction-a',
        defenderFactionId: 'faction-a',
        segmentIds: ['seg-01'],
      }),
    /Front factions must be different/,
  );

  assert.throws(
    () =>
      new Front({
        attackerFactionId: 'faction-a',
        defenderFactionId: 'faction-b',
        segmentIds: [],
      }),
    /Front segmentIds must be a non-empty array/,
  );

  assert.throws(
    () =>
      new Front({
        attackerFactionId: 'faction-a',
        defenderFactionId: 'faction-b',
        segmentIds: ['seg-01'],
        momentum: 11,
      }),
    /Front momentum must be an integer between 0 and 10/,
  );
});
