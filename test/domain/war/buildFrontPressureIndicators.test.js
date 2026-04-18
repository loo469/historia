import test from 'node:test';
import assert from 'node:assert/strict';

import { BorderSegment } from '../../../src/domain/war/BorderSegment.js';
import { buildFrontPressureIndicators } from '../../../src/domain/war/buildFrontPressureIndicators.js';

function createSegment(overrides = {}) {
  return new BorderSegment({
    provinceAId: 'prov-a',
    provinceBId: 'prov-b',
    terrainType: 'plain',
    pressure: 0,
    contested: false,
    length: 2,
    position: 1,
    ...overrides,
  });
}

test('buildFrontPressureIndicators derives stable indicators for pressured borders', () => {
  const indicators = buildFrontPressureIndicators([
    createSegment({ provinceAId: 'prov-c', provinceBId: 'prov-d', pressure: -12, position: 4, length: 3 }),
    createSegment({ provinceAId: 'prov-a', provinceBId: 'prov-b', pressure: 0 }),
    createSegment({ provinceAId: 'prov-e', provinceBId: 'prov-f', pressure: 71, chokepoint: true, position: 8, length: 1 }),
  ]);

  assert.deepEqual(indicators, [
    {
      segmentId: 'prov-c::prov-d',
      provinces: ['prov-c', 'prov-d'],
      dominantProvinceId: 'prov-d',
      pressure: -12,
      pressureValue: 12,
      intensity: 'low',
      anchor: {
        position: 4,
        length: 3,
      },
      appearance: {
        icon: 'pressure',
        color: 'amber',
        scale: 1,
      },
    },
    {
      segmentId: 'prov-e::prov-f',
      provinces: ['prov-e', 'prov-f'],
      dominantProvinceId: 'prov-e',
      pressure: 71,
      pressureValue: 71,
      intensity: 'high',
      anchor: {
        position: 8,
        length: 1,
      },
      appearance: {
        icon: 'pressure',
        color: 'amber',
        scale: 1,
      },
    },
  ]);
});

test('buildFrontPressureIndicators supports configurable thresholds and appearance', () => {
  const indicators = buildFrontPressureIndicators(
    [
      createSegment({ pressure: 18 }),
      createSegment({ provinceAId: 'prov-c', provinceBId: 'prov-d', pressure: 44 }),
    ],
    {
      mediumThreshold: 15,
      highThreshold: 40,
      appearanceByIntensity: {
        medium: { icon: 'chevrons', color: 'orange', scale: 2 },
        high: { icon: 'burst', color: 'red', scale: 3 },
      },
    },
  );

  assert.equal(indicators[0].intensity, 'medium');
  assert.deepEqual(indicators[0].appearance, {
    icon: 'chevrons',
    color: 'orange',
    scale: 2,
  });

  assert.equal(indicators[1].intensity, 'high');
  assert.deepEqual(indicators[1].appearance, {
    icon: 'burst',
    color: 'red',
    scale: 3,
  });
});

test('buildFrontPressureIndicators rejects invalid inputs', () => {
  assert.throws(() => buildFrontPressureIndicators(null), /segments must be an array/);
  assert.throws(() => buildFrontPressureIndicators([{}]), /segments must be BorderSegment instances/);
  assert.throws(() => buildFrontPressureIndicators([], []), /options must be an object/);
  assert.throws(() => buildFrontPressureIndicators([], { mediumThreshold: 0 }), /mediumThreshold must be an integer between 1 and 100/);
  assert.throws(() => buildFrontPressureIndicators([], { mediumThreshold: 50, highThreshold: 40 }), /mediumThreshold must be lower than highThreshold/);
});
