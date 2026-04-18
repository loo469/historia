import test from 'node:test';
import assert from 'node:assert/strict';

import { DetectFronts } from '../../../src/application/war/DetectFronts.js';
import { Province } from '../../../src/domain/war/Province.js';

function createProvince(overrides) {
  return new Province({
    id: 'prov-1',
    name: 'Province',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-a',
    supplyLevel: 'stable',
    neighborIds: [],
    ...overrides,
  });
}

test('DetectFronts groups hostile neighboring provinces into fronts', () => {
  const detectFronts = new DetectFronts();
  const provinces = [
    createProvince({ id: 'a-1', neighborIds: ['b-1'], contested: true }),
    createProvince({
      id: 'b-1',
      ownerFactionId: 'faction-b',
      controllingFactionId: 'faction-b',
      neighborIds: ['a-1', 'a-2'],
      contested: true,
    }),
    createProvince({ id: 'a-2', neighborIds: ['b-1'] }),
  ];

  assert.deepEqual(detectFronts.execute({ provinces }), [
    {
      id: 'faction-a::faction-b',
      factionIds: ['faction-a', 'faction-b'],
      provinceIds: ['a-1', 'a-2', 'b-1'],
      segmentIds: ['a-1::b-1', 'a-2::b-1'],
      contestedProvinceIds: ['a-1', 'b-1'],
      pressure: 2,
    },
  ]);
});

test('DetectFronts ignores internal borders, missing neighbors, and duplicate segments', () => {
  const detectFronts = new DetectFronts();
  const provinces = [
    createProvince({ id: 'a-1', neighborIds: ['a-2', 'b-1', 'missing'] }),
    createProvince({ id: 'a-2', neighborIds: ['a-1', 'b-1'] }),
    createProvince({
      id: 'b-1',
      ownerFactionId: 'faction-b',
      controllingFactionId: 'faction-b',
      neighborIds: ['a-1', 'a-2'],
    }),
  ];

  assert.deepEqual(detectFronts.execute({ provinces }), [
    {
      id: 'faction-a::faction-b',
      factionIds: ['faction-a', 'faction-b'],
      provinceIds: ['a-1', 'a-2', 'b-1'],
      segmentIds: ['a-1::b-1', 'a-2::b-1'],
      contestedProvinceIds: [],
      pressure: 0,
    },
  ]);
});

test('DetectFronts rejects invalid inputs', () => {
  const detectFronts = new DetectFronts();

  assert.throws(() => detectFronts.execute({ provinces: null }), /DetectFronts provinces must be an array/);
});
