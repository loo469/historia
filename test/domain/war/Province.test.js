import test from 'node:test';
import assert from 'node:assert/strict';

import { Province } from '../../../src/domain/war/Province.js';

test('Province keeps a normalized set of core territory fields', () => {
  const province = new Province({
    id: '  prov-001 ',
    name: ' Marches of Dawn ',
    ownerFactionId: ' faction-a ',
    supplyLevel: 'stable',
    loyalty: 72,
    strategicValue: 4,
    neighborIds: ['prov-003', ' prov-002 ', 'prov-003'],
  });

  assert.deepEqual(province.toJSON(), {
    id: 'prov-001',
    name: 'Marches of Dawn',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-a',
    supplyLevel: 'stable',
    loyalty: 72,
    strategicValue: 4,
    neighborIds: ['prov-002', 'prov-003'],
    contested: false,
    capturedAt: null,
  });

  assert.equal(province.isOccupied, false);
});

test('Province can transition to occupation while preserving immutable semantics', () => {
  const province = new Province({
    id: 'prov-001',
    name: 'Marches of Dawn',
    ownerFactionId: 'faction-a',
    supplyLevel: 'stable',
  });
  const capturedAt = new Date('2026-04-18T10:15:00.000Z');

  const occupiedProvince = province.withControllingFaction('faction-b', capturedAt);

  assert.notEqual(occupiedProvince, province);
  assert.equal(occupiedProvince.controllingFactionId, 'faction-b');
  assert.equal(occupiedProvince.contested, true);
  assert.equal(occupiedProvince.isOccupied, true);
  assert.equal(occupiedProvince.capturedAt?.toISOString(), capturedAt.toISOString());

  assert.equal(province.controllingFactionId, 'faction-a');
  assert.equal(province.contested, false);
  assert.equal(province.capturedAt, null);
});

test('Province rejects invalid identifiers and scores', () => {
  assert.throws(
    () =>
      new Province({
        id: '',
        name: 'Marches of Dawn',
        ownerFactionId: 'faction-a',
        supplyLevel: 'stable',
      }),
    /Province id is required/,
  );

  assert.throws(
    () =>
      new Province({
        id: 'prov-001',
        name: 'Marches of Dawn',
        ownerFactionId: 'faction-a',
        supplyLevel: 'stable',
        loyalty: 200,
      }),
    /Province loyalty must be an integer between 0 and 100/,
  );

  assert.throws(
    () =>
      new Province({
        id: 'prov-001',
        name: 'Marches of Dawn',
        ownerFactionId: 'faction-a',
        supplyLevel: 'stable',
        strategicValue: 0,
      }),
    /Province strategicValue must be an integer between 1 and 10/,
  );
});
