import test from 'node:test';
import assert from 'node:assert/strict';

import { StabilizeCapturedProvince } from '../../../src/application/war/StabilizeCapturedProvince.js';
import { Province } from '../../../src/domain/war/Province.js';

function createProvince(overrides) {
  return new Province({
    id: 'prov-1',
    name: 'Province',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-b',
    supplyLevel: 'disrupted',
    loyalty: 35,
    contested: true,
    neighborIds: [],
    capturedAt: '2026-04-18T12:00:00.000Z',
    ...overrides,
  });
}

test('StabilizeCapturedProvince calms a captured province and improves local supply', () => {
  const stabilizeCapturedProvince = new StabilizeCapturedProvince();
  const province = createProvince();

  const result = stabilizeCapturedProvince.execute({ province, loyaltyGain: 12 });

  assert.equal(result.stabilized, true);
  assert.equal(result.reason, 'stabilized');
  assert.notEqual(result.province, province);
  assert.equal(result.province.loyalty, 47);
  assert.equal(result.province.contested, false);
  assert.equal(result.province.supplyLevel, 'strained');
  assert.equal(result.province.capturedAt?.toISOString(), '2026-04-18T12:00:00.000Z');

  assert.equal(province.loyalty, 35);
  assert.equal(province.contested, true);
  assert.equal(province.supplyLevel, 'disrupted');
});

test('StabilizeCapturedProvince is a no-op for provinces that are not occupied', () => {
  const stabilizeCapturedProvince = new StabilizeCapturedProvince();
  const province = createProvince({
    controllingFactionId: 'faction-a',
    contested: false,
    supplyLevel: 'stable',
  });

  const result = stabilizeCapturedProvince.execute({ province, loyaltyGain: 20 });

  assert.equal(result.stabilized, false);
  assert.equal(result.reason, 'not-occupied');
  assert.equal(result.province, province);
});

test('StabilizeCapturedProvince rejects invalid inputs and clamps loyalty growth', () => {
  const stabilizeCapturedProvince = new StabilizeCapturedProvince();
  const province = createProvince({ loyalty: 95, supplyLevel: 'secure' });

  assert.throws(
    () => stabilizeCapturedProvince.execute({ province: null }),
    /province must be a Province instance/,
  );

  assert.throws(
    () => stabilizeCapturedProvince.execute({ province, loyaltyGain: -1 }),
    /loyaltyGain must be a non-negative integer/,
  );

  const result = stabilizeCapturedProvince.execute({ province, loyaltyGain: 20, supplyRecovery: false });

  assert.equal(result.province.loyalty, 100);
  assert.equal(result.province.supplyLevel, 'secure');
});
