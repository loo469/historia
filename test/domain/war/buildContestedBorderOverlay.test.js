import test from 'node:test';
import assert from 'node:assert/strict';

import { BorderSegment } from '../../../src/domain/war/BorderSegment.js';
import { buildContestedBorderOverlay } from '../../../src/domain/war/buildContestedBorderOverlay.js';

function createSegment(overrides = {}) {
  return new BorderSegment({
    provinceAId: 'prov-a',
    provinceBId: 'prov-b',
    terrainType: 'plain',
    pressure: 0,
    contested: false,
    ...overrides,
  });
}

test('buildContestedBorderOverlay keeps only contested borders and derives stable overlay entries', () => {
  const overlay = buildContestedBorderOverlay([
    createSegment({ provinceAId: 'prov-c', provinceBId: 'prov-d', contested: true, pressure: -8, terrainType: 'river' }),
    createSegment({ provinceAId: 'prov-a', provinceBId: 'prov-b', contested: false, pressure: 0 }),
    createSegment({ provinceAId: 'prov-e', provinceBId: 'prov-f', contested: true, pressure: 14, chokepoint: true }),
  ]);

  assert.deepEqual(overlay, [
    {
      segmentId: 'prov-c::prov-d',
      provinces: ['prov-c', 'prov-d'],
      pressure: -8,
      dominantProvinceId: 'prov-d',
      terrainType: 'river',
      chokepoint: false,
      style: {
        stroke: 'amber',
        width: 2,
        pattern: 'solid',
      },
    },
    {
      segmentId: 'prov-e::prov-f',
      provinces: ['prov-e', 'prov-f'],
      pressure: 14,
      dominantProvinceId: 'prov-e',
      terrainType: 'plain',
      chokepoint: true,
      style: {
        stroke: 'amber',
        width: 2,
        pattern: 'solid',
      },
    },
  ]);
});

test('buildContestedBorderOverlay applies terrain-specific style overrides', () => {
  const overlay = buildContestedBorderOverlay(
    [createSegment({ contested: true, terrainType: 'river', pressure: 9 })],
    {
      river: { stroke: 'blue', width: 3, pattern: 'dashed' },
      default: { stroke: 'red', width: 1, pattern: 'solid' },
    },
  );

  assert.deepEqual(overlay[0].style, {
    stroke: 'blue',
    width: 3,
    pattern: 'dashed',
  });
});

test('buildContestedBorderOverlay rejects invalid inputs', () => {
  assert.throws(() => buildContestedBorderOverlay(null), /segments must be an array/);
  assert.throws(() => buildContestedBorderOverlay([{}]), /segments must be BorderSegment instances/);
  assert.throws(() => buildContestedBorderOverlay([], []), /styleByTerrain must be an object/);
});
