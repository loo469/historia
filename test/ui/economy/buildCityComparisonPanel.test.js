import test from 'node:test';
import assert from 'node:assert/strict';

import { City } from '../../../src/domain/economy/City.js';
import { buildCityComparisonPanel } from '../../../src/ui/economy/buildCityComparisonPanel.js';

test('buildCityComparisonPanel compares stock pressure across cities', () => {
  const panel = buildCityComparisonPanel([
    new City({
      id: 'city-harbor',
      name: 'Harbor',
      regionId: 'coast',
      population: 120,
      prosperity: 74,
      stability: 61,
      stockByResource: { fish: 14, wood: 6 },
    }),
    new City({
      id: 'city-mill',
      name: 'Mill',
      regionId: 'riverlands',
      population: 80,
      prosperity: 52,
      stability: 38,
      stockByResource: { grain: 4, flour: 2 },
    }),
  ], {
    desiredStockByCityId: {
      'city-harbor': { fish: 10, wood: 4 },
      'city-mill': { grain: 10, flour: 6 },
    },
  });

  assert.equal(panel.summary, '2 villes suivies, 1 sous tension');
  assert.deepEqual(panel.rows, [
    {
      cityId: 'city-harbor',
      cityName: 'Harbor',
      regionId: 'coast',
      population: 120,
      prosperity: 74,
      stability: 61,
      totalStock: 20,
      scarcityRatio: 0.17,
      shortageCount: 0,
      surplusCount: 2,
      tensionScore: 0,
      tensionLevel: 'low',
      label: 'Harbor, stock 20, tension low',
    },
    {
      cityId: 'city-mill',
      cityName: 'Mill',
      regionId: 'riverlands',
      population: 80,
      prosperity: 52,
      stability: 38,
      totalStock: 6,
      scarcityRatio: 0.07,
      shortageCount: 2,
      surplusCount: 0,
      tensionScore: 10,
      tensionLevel: 'high',
      label: 'Mill, stock 6, tension high',
    },
  ]);
  assert.deepEqual(panel.highlights, {
    highestScarcityCityId: 'city-harbor',
    highestTensionCityId: 'city-mill',
  });
  assert.deepEqual(panel.metrics, {
    cityCount: 2,
    totalPopulation: 200,
    totalStock: 26,
    highTensionCount: 1,
  });
});

test('buildCityComparisonPanel supports plain payloads and validates inputs', () => {
  const panel = buildCityComparisonPanel([
    {
      id: 'city-delta',
      name: 'Delta',
      regionId: 'delta',
      population: 50,
      stockByResource: { salt: 3 },
    },
  ]);

  assert.equal(panel.rows[0].tensionLevel, 'low');
  assert.throws(() => buildCityComparisonPanel(null), /cities must be an array/);
  assert.throws(() => buildCityComparisonPanel([null]), /City instances or plain objects/);
  assert.throws(() => buildCityComparisonPanel([], null), /options must be an object/);
  assert.throws(() => buildCityComparisonPanel([], { desiredStockByCityId: [] }), /desiredStockByCityId must be an object/);
});
