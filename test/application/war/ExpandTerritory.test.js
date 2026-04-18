import test from 'node:test';
import assert from 'node:assert/strict';

import { ExpandTerritory } from '../../../src/application/war/ExpandTerritory.js';
import { Province } from '../../../src/domain/war/Province.js';

function createProvince(overrides) {
  return new Province({
    id: 'prov-a',
    name: 'Province',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-a',
    supplyLevel: 'stable',
    neighborIds: [],
    ...overrides,
  });
}

test('ExpandTerritory captures an adjacent enemy province', () => {
  const expandTerritory = new ExpandTerritory();
  const capturedAt = new Date('2026-04-18T12:25:00.000Z');
  const provinces = [
    createProvince({ id: 'prov-a', neighborIds: ['prov-b'] }),
    createProvince({
      id: 'prov-b',
      ownerFactionId: 'faction-b',
      controllingFactionId: 'faction-b',
      neighborIds: ['prov-a'],
    }),
  ];

  const result = expandTerritory.execute({
    factionId: 'faction-a',
    sourceProvinceId: 'prov-a',
    targetProvinceId: 'prov-b',
    provinces,
    capturedAt,
  });

  assert.equal(result.expanded, true);
  assert.equal(result.reason, 'captured');
  assert.equal(result.province.controllingFactionId, 'faction-a');
  assert.equal(result.province.contested, true);
  assert.equal(result.province.capturedAt?.toISOString(), capturedAt.toISOString());

  assert.equal(provinces[1].controllingFactionId, 'faction-b');
  assert.equal(provinces[1].capturedAt, null);
});

test('ExpandTerritory returns a no-op when the target is already controlled', () => {
  const expandTerritory = new ExpandTerritory();
  const provinces = [
    createProvince({ id: 'prov-a', neighborIds: ['prov-b'] }),
    createProvince({ id: 'prov-b', neighborIds: ['prov-a'] }),
  ];

  const result = expandTerritory.execute({
    factionId: 'faction-a',
    sourceProvinceId: 'prov-a',
    targetProvinceId: 'prov-b',
    provinces,
  });

  assert.equal(result.expanded, false);
  assert.equal(result.reason, 'already-controlled');
  assert.equal(result.province, provinces[1]);
});

test('ExpandTerritory rejects invalid province references and expansion attempts', () => {
  const expandTerritory = new ExpandTerritory();
  const provinces = [
    createProvince({ id: 'prov-a', neighborIds: ['prov-b'] }),
    createProvince({
      id: 'prov-b',
      ownerFactionId: 'faction-b',
      controllingFactionId: 'faction-b',
      neighborIds: ['prov-c'],
    }),
  ];

  assert.throws(
    () =>
      expandTerritory.execute({
        factionId: 'faction-c',
        sourceProvinceId: 'prov-a',
        targetProvinceId: 'prov-b',
        provinces,
      }),
    /source province must be controlled by the expanding faction/,
  );

  assert.throws(
    () =>
      expandTerritory.execute({
        factionId: 'faction-a',
        sourceProvinceId: 'prov-a',
        targetProvinceId: 'prov-b',
        provinces: [provinces[0]],
      }),
    /targetProvinceId must reference an existing province/,
  );

  assert.throws(
    () =>
      expandTerritory.execute({
        factionId: 'faction-a',
        sourceProvinceId: 'prov-a',
        targetProvinceId: 'prov-b',
        provinces,
      }),
    /target province must be adjacent to the source province/,
  );
});
