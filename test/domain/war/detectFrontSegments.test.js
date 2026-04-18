import test from 'node:test';
import assert from 'node:assert/strict';

import { Province } from '../../../src/domain/war/Province.js';
import { detectFrontSegments } from '../../../src/domain/war/detectFrontSegments.js';

function createProvince(overrides = {}) {
  return new Province({
    id: 'prov-a',
    name: 'Province A',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-a',
    supplyLevel: 'stable',
    neighborIds: [],
    ...overrides,
  });
}

test('detectFrontSegments creates one border segment per hostile adjacency', () => {
  const provinces = [
    createProvince({ id: 'prov-a', neighborIds: ['prov-b', 'prov-c'] }),
    createProvince({ id: 'prov-b', controllingFactionId: 'faction-b', ownerFactionId: 'faction-b', neighborIds: ['prov-a'] }),
    createProvince({ id: 'prov-c', neighborIds: ['prov-a'] }),
  ];

  const segments = detectFrontSegments(provinces);

  assert.deepEqual(segments.map((segment) => segment.toJSON()), [
    {
      id: 'prov-a::prov-b',
      provinceAId: 'prov-a',
      provinceBId: 'prov-b',
      terrainType: 'plain',
      pressure: 0,
      contested: true,
      chokepoint: false,
      length: 1,
      position: 0,
    },
  ]);
});

test('detectFrontSegments supports per-pair options and ignores duplicate neighbor declarations', () => {
  const provinces = [
    createProvince({ id: 'prov-a', neighborIds: ['prov-b'] }),
    createProvince({
      id: 'prov-b',
      controllingFactionId: 'faction-b',
      ownerFactionId: 'faction-b',
      neighborIds: ['prov-a'],
    }),
  ];

  const segments = detectFrontSegments(provinces, {
    'prov-a::prov-b': {
      terrainType: 'river',
      pressure: 18,
      chokepoint: true,
      length: 2,
      position: 1,
    },
  });

  assert.equal(segments.length, 1);
  assert.deepEqual(segments[0].toJSON(), {
    id: 'prov-a::prov-b',
    provinceAId: 'prov-a',
    provinceBId: 'prov-b',
    terrainType: 'river',
    pressure: 18,
    contested: true,
    chokepoint: true,
    length: 2,
    position: 1,
  });
});

test('detectFrontSegments returns no segments for friendly or missing neighbors', () => {
  const provinces = [
    createProvince({ id: 'prov-a', neighborIds: ['prov-b', 'prov-missing'] }),
    createProvince({ id: 'prov-b', neighborIds: ['prov-a'] }),
  ];

  assert.deepEqual(detectFrontSegments(provinces), []);
});

test('detectFrontSegments rejects invalid inputs', () => {
  assert.throws(() => detectFrontSegments(null), /provinces must be an array/);
  assert.throws(() => detectFrontSegments([{}]), /provinces must be Province instances/);
  assert.throws(() => detectFrontSegments([], []), /segmentOptionsByPair must be an object/);
});
