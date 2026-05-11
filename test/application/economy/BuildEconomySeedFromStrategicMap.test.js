import test from 'node:test';
import assert from 'node:assert/strict';

import { buildEconomySeedFromStrategicMap, buildProvincePositionById } from '../../../src/application/economy/BuildEconomySeedFromStrategicMap.js';

function createStrategicMap() {
  return {
    provinceLayouts: {
      'crown-heart': { x: 40, y: 20, w: 20, h: 10 },
      'river-gate': { x: 20, y: 50, w: 30, h: 12 },
    },
    provinces: [
      {
        id: 'river-gate',
        name: 'Porte du Fleuve',
        ownerFactionId: 'aurora',
        controllingFactionId: 'ember',
        supplyLevel: 'disrupted',
        loyalty: 39,
        strategicValue: 7,
        contested: true,
        neighborIds: ['crown-heart'],
      },
      {
        id: 'crown-heart',
        name: 'Coeur de Couronne',
        ownerFactionId: 'aurora',
        supplyLevel: 'stable',
        loyalty: 78,
        strategicValue: 9,
        capital: true,
        neighborIds: ['river-gate'],
      },
    ],
  };
}

test('buildProvincePositionById derives province centers from strategic map layouts', () => {
  assert.deepEqual(buildProvincePositionById(createStrategicMap()), {
    'crown-heart': { x: 50, y: 25 },
    'river-gate': { x: 35, y: 56 },
  });
});

test('buildEconomySeedFromStrategicMap wires generated positions into seeded city layouts', () => {
  const seed = buildEconomySeedFromStrategicMap(createStrategicMap(), {
    cityIdByProvinceId: {
      'crown-heart': 'crown-port',
      'river-gate': 'river-gate-city',
    },
    cityPositionByProvinceId: {
      'river-gate': { x: 34, y: 58, labelDx: -5 },
    },
    resourceHintsByProvinceId: {
      'crown-heart': { fish: 8 },
      'river-gate': { tools: 2 },
    },
  });

  assert.deepEqual(seed.cityPositionById, {
    'crown-port': { x: 50, y: 25 },
    'river-gate-city': { x: 34, y: 58, labelDx: -5 },
  });
  assert.deepEqual(seed.cities.map((city) => city.id), ['crown-port', 'river-gate-city']);
  assert.deepEqual(seed.routes.map((route) => route.id), ['route:crown-heart:river-gate']);
  assert.equal(seed.metrics.cityCount, 2);
  assert.equal(seed.metrics.routeCount, 1);
});

test('buildEconomySeedFromStrategicMap rejects malformed layout coordinates', () => {
  assert.throws(
    () => buildEconomySeedFromStrategicMap({ provinces: [{ id: 'broken' }], provinceLayouts: { broken: { x: 1, y: 2, w: 'bad', h: 4 } } }),
    /provinceLayouts.broken must expose finite x, y, w and h coordinates/,
  );
});
