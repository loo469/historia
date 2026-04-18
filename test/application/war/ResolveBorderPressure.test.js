import test from 'node:test';
import assert from 'node:assert/strict';

import { ResolveBorderPressure } from '../../../src/application/war/ResolveBorderPressure.js';
import { Province } from '../../../src/domain/war/Province.js';

function createProvince(overrides) {
  return new Province({
    id: 'prov-a',
    name: 'Province',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-a',
    supplyLevel: 'stable',
    loyalty: 50,
    strategicValue: 1,
    neighborIds: [],
    ...overrides,
  });
}

test('ResolveBorderPressure computes dominant pressure across an active border', () => {
  const resolveBorderPressure = new ResolveBorderPressure();
  const leftProvince = createProvince({
    id: 'prov-a',
    loyalty: 80,
    strategicValue: 4,
    neighborIds: ['prov-b'],
  });
  const rightProvince = createProvince({
    id: 'prov-b',
    ownerFactionId: 'faction-b',
    controllingFactionId: 'faction-b',
    loyalty: 30,
    strategicValue: 1,
    neighborIds: ['prov-a'],
  });

  assert.deepEqual(resolveBorderPressure.execute({ leftProvince, rightProvince }), {
    borderActive: true,
    pressure: 65,
    dominantProvinceId: 'prov-a',
    contested: false,
  });
});

test('ResolveBorderPressure flags close fights as contested and neutralizes internal borders', () => {
  const resolveBorderPressure = new ResolveBorderPressure();
  const leftProvince = createProvince({
    id: 'prov-a',
    loyalty: 55,
    strategicValue: 2,
    contested: true,
    neighborIds: ['prov-b'],
  });
  const rightProvince = createProvince({
    id: 'prov-b',
    ownerFactionId: 'faction-b',
    controllingFactionId: 'faction-b',
    loyalty: 58,
    strategicValue: 2,
    contested: true,
    neighborIds: ['prov-a'],
  });

  assert.deepEqual(resolveBorderPressure.execute({ leftProvince, rightProvince }), {
    borderActive: true,
    pressure: -3,
    dominantProvinceId: 'prov-b',
    contested: true,
  });

  const alliedProvince = createProvince({ id: 'prov-c', neighborIds: ['prov-a'] });
  const alliedBorderProvince = createProvince({
    id: 'prov-a',
    loyalty: 55,
    strategicValue: 2,
    contested: true,
    neighborIds: ['prov-c'],
  });

  assert.deepEqual(resolveBorderPressure.execute({ leftProvince: alliedBorderProvince, rightProvince: alliedProvince }), {
    borderActive: false,
    pressure: 0,
    dominantProvinceId: null,
    contested: false,
  });
});

test('ResolveBorderPressure rejects missing, duplicate, or non-adjacent provinces', () => {
  const resolveBorderPressure = new ResolveBorderPressure();
  const leftProvince = createProvince({ id: 'prov-a', neighborIds: ['prov-b'] });
  const rightProvince = createProvince({
    id: 'prov-b',
    ownerFactionId: 'faction-b',
    controllingFactionId: 'faction-b',
    neighborIds: [],
  });

  assert.throws(
    () => resolveBorderPressure.execute({ leftProvince: null, rightProvince }),
    /requires both leftProvince and rightProvince/,
  );

  assert.throws(
    () => resolveBorderPressure.execute({ leftProvince, rightProvince: leftProvince }),
    /provinces must be different/,
  );

  assert.throws(
    () => resolveBorderPressure.execute({ leftProvince, rightProvince }),
    /provinces must be adjacent neighbors/,
  );
});
