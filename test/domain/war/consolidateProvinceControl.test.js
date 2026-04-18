import test from 'node:test';
import assert from 'node:assert/strict';

import { Province } from '../../../src/domain/war/Province.js';
import { consolidateProvinceControl } from '../../../src/domain/war/consolidateProvinceControl.js';

function createOccupiedProvince(overrides = {}) {
  return new Province({
    id: 'prov-held',
    name: 'Held Province',
    ownerFactionId: 'faction-b',
    controllingFactionId: 'faction-a',
    supplyLevel: 'disrupted',
    loyalty: 35,
    contested: true,
    capturedAt: '2026-04-18T13:00:00.000Z',
    neighborIds: ['prov-origin'],
    ...overrides,
  });
}

test('consolidateProvinceControl clears contestation and increases loyalty for occupied provinces', () => {
  const province = createOccupiedProvince();

  const result = consolidateProvinceControl({
    province,
    loyaltyGain: 15,
    supplyLevel: 'stable',
  });

  assert.equal(result.consolidated, true);
  assert.equal(result.reason, 'consolidated');
  assert.equal(result.province.contested, false);
  assert.equal(result.province.loyalty, 50);
  assert.equal(result.province.supplyLevel, 'stable');
  assert.equal(province.contested, true);
  assert.equal(province.loyalty, 35);
});

test('consolidateProvinceControl leaves non-occupied provinces unchanged', () => {
  const province = new Province({
    id: 'prov-home',
    name: 'Home Province',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-a',
    supplyLevel: 'stable',
    loyalty: 80,
    neighborIds: [],
  });

  const result = consolidateProvinceControl({ province, loyaltyGain: 12 });

  assert.equal(result.consolidated, false);
  assert.equal(result.reason, 'not-occupied');
  assert.equal(result.province, province);
});

test('consolidateProvinceControl rejects invalid inputs', () => {
  const province = createOccupiedProvince();

  assert.throws(() => consolidateProvinceControl({ province: {} }), /province must be a Province instance/);
  assert.throws(
    () => consolidateProvinceControl({ province, loyaltyGain: -1 }),
    /loyaltyGain must be a non-negative integer/,
  );
  assert.throws(
    () => consolidateProvinceControl({ province, supplyLevel: '   ' }),
    /supplyLevel cannot be empty/,
  );
});
