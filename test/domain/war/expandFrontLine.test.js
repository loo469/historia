import test from 'node:test';
import assert from 'node:assert/strict';

import { Province } from '../../../src/domain/war/Province.js';
import { expandFrontLine } from '../../../src/domain/war/expandFrontLine.js';

function createProvince(overrides = {}) {
  return new Province({
    id: 'prov-target',
    name: 'Target Province',
    ownerFactionId: 'faction-b',
    controllingFactionId: 'faction-b',
    supplyLevel: 'strained',
    contested: false,
    neighborIds: ['prov-origin'],
    ...overrides,
  });
}

test('expandFrontLine captures a hostile province when pressure is positive', () => {
  const province = createProvince();

  const result = expandFrontLine({
    attackerFactionId: 'faction-a',
    targetProvince: province,
    segment: { provinceAId: 'prov-origin', provinceBId: 'prov-target' },
    pressureDelta: 12,
  });

  assert.equal(result.expanded, true);
  assert.equal(result.reason, 'expanded');
  assert.equal(result.province.controllingFactionId, 'faction-a');
  assert.equal(result.province.contested, true);
  assert.equal(province.controllingFactionId, 'faction-b');
});

test('expandFrontLine refuses expansion when pressure is missing or control is already secured', () => {
  const occupiedProvince = createProvince({ controllingFactionId: 'faction-a', contested: true });
  const hostileProvince = createProvince();

  const noPressureResult = expandFrontLine({
    attackerFactionId: 'faction-a',
    targetProvince: hostileProvince,
    segment: { provinceAId: 'prov-origin', provinceBId: 'prov-target' },
    pressureDelta: 0,
  });
  const alreadyControlledResult = expandFrontLine({
    attackerFactionId: 'faction-a',
    targetProvince: occupiedProvince,
    segment: { provinceAId: 'prov-origin', provinceBId: 'prov-target' },
    pressureDelta: 8,
  });

  assert.equal(noPressureResult.expanded, false);
  assert.equal(noPressureResult.reason, 'insufficient-pressure');
  assert.equal(alreadyControlledResult.expanded, false);
  assert.equal(alreadyControlledResult.reason, 'already-controlled');
});

test('expandFrontLine rejects invalid inputs', () => {
  const province = createProvince();

  assert.throws(
    () => expandFrontLine({ attackerFactionId: '', targetProvince: province, segment: { provinceAId: 'a', provinceBId: 'b' }, pressureDelta: 1 }),
    /attackerFactionId is required/,
  );
  assert.throws(
    () => expandFrontLine({ attackerFactionId: 'faction-a', targetProvince: {}, segment: { provinceAId: 'a', provinceBId: 'b' }, pressureDelta: 1 }),
    /province must be a Province instance/,
  );
  assert.throws(
    () => expandFrontLine({ attackerFactionId: 'faction-a', targetProvince: province, segment: null, pressureDelta: 1 }),
    /segment must be an object/,
  );
  assert.throws(
    () => expandFrontLine({ attackerFactionId: 'faction-a', targetProvince: province, segment: { provinceAId: 'a', provinceBId: 'b' }, pressureDelta: 1.5 }),
    /pressureDelta must be an integer/,
  );
});
