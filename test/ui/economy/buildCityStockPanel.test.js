import test from 'node:test';
import assert from 'node:assert/strict';

import { City } from '../../../src/domain/economy/City.js';
import { buildCityStockPanel } from '../../../src/ui/economy/buildCityStockPanel.js';

test('buildCityStockPanel derives stock rows and summary for a city', () => {
  const panel = buildCityStockPanel(new City({
    id: 'city-harbor',
    name: 'Harbor',
    regionId: 'region-coast',
    population: 120,
    stockByResource: {
      fish: 14,
      grain: 3,
      wood: 6,
    },
  }), {
    desiredStockByResource: {
      fish: 10,
      grain: 8,
      wood: 6,
    },
  });

  assert.deepEqual(panel, {
    cityId: 'city-harbor',
    cityName: 'Harbor',
    title: 'Stocks de Harbor',
    summary: '3 ressources, 1 en manque, 1 en surplus',
    rows: [
      {
        resourceId: 'fish',
        currentQuantity: 14,
        desiredQuantity: 10,
        delta: 4,
        status: 'surplus',
        tone: 'positive',
        label: 'fish: 14/10',
        detail: 'Surplus de 4',
      },
      {
        resourceId: 'grain',
        currentQuantity: 3,
        desiredQuantity: 8,
        delta: -5,
        status: 'shortage',
        tone: 'warning',
        label: 'grain: 3/8',
        detail: 'Manque de 5',
      },
      {
        resourceId: 'wood',
        currentQuantity: 6,
        desiredQuantity: 6,
        delta: 0,
        status: 'balanced',
        tone: 'neutral',
        label: 'wood: 6/6',
        detail: 'Objectif atteint',
      },
    ],
    metrics: {
      resourceCount: 3,
      shortageCount: 1,
      surplusCount: 1,
    },
  });
});

test('buildCityStockPanel includes desired-only resources and plain city payloads', () => {
  const panel = buildCityStockPanel({
    id: 'city-mill',
    name: 'Mill',
    regionId: 'region-river',
    population: 90,
    stockByResource: {
      flour: 5,
    },
  }, {
    desiredStockByResource: {
      flour: 5,
      grain: 7,
    },
  });

  assert.deepEqual(panel.rows, [
    {
      resourceId: 'flour',
      currentQuantity: 5,
      desiredQuantity: 5,
      delta: 0,
      status: 'balanced',
      tone: 'neutral',
      label: 'flour: 5/5',
      detail: 'Objectif atteint',
    },
    {
      resourceId: 'grain',
      currentQuantity: 0,
      desiredQuantity: 7,
      delta: -7,
      status: 'shortage',
      tone: 'warning',
      label: 'grain: 0/7',
      detail: 'Manque de 7',
    },
  ]);
  assert.deepEqual(panel.metrics, {
    resourceCount: 2,
    shortageCount: 1,
    surplusCount: 0,
  });
});

test('buildCityStockPanel rejects invalid options and desired stock maps', () => {
  assert.throws(() => buildCityStockPanel({
    id: 'city-a',
    name: 'A',
    regionId: 'region-a',
    population: 1,
  }, null), /CityStockPanel options must be an object/);

  assert.throws(() => buildCityStockPanel({
    id: 'city-a',
    name: 'A',
    regionId: 'region-a',
    population: 1,
  }, {
    desiredStockByResource: { ' ': 1 },
  }), /CityStockPanel desiredStockByResource cannot contain an empty resource id/);

  assert.throws(() => buildCityStockPanel({
    id: 'city-a',
    name: 'A',
    regionId: 'region-a',
    population: 1,
  }, {
    desiredStockByResource: { grain: -1 },
  }), /CityStockPanel desired stock grain must be an integer greater than or equal to 0/);
});
