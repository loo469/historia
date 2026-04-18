import test from 'node:test';
import assert from 'node:assert/strict';

import { planLogisticsFlows } from '../../../src/application/economy/PlanLogisticsFlows.js';

test('PlanLogisticsFlows routes surplus resources toward downstream demand', () => {
  const result = planLogisticsFlows({
    cities: [
      {
        id: 'city-granary',
        stockByResource: { grain: 20, wood: 3 },
        desiredStockByResource: { grain: 8, wood: 3 },
      },
      {
        id: 'city-harbor',
        stockByResource: { grain: 2, wood: 0 },
        desiredStockByResource: { grain: 10, wood: 4 },
      },
      {
        id: 'city-mill',
        stockByResource: { grain: 7 },
        desiredStockByResource: { grain: 7 },
      },
    ],
    tradeRoutes: [
      {
        id: 'route-river',
        stopCityIds: ['city-granary', 'city-harbor', 'city-mill'],
        capacityByResource: { grain: 5, wood: 2 },
        riskLevel: 9,
      },
    ],
  });

  assert.deepEqual(result.plannedFlows, [
    {
      tradeRouteId: 'route-river',
      sourceCityId: 'city-granary',
      destinationCityId: 'city-harbor',
      resourceId: 'grain',
      quantity: 5,
      riskLevel: 9,
    },
  ]);

  assert.deepEqual(result.unmetDemandByCityId, {
    'city-granary': {},
    'city-harbor': { grain: 3, wood: 4 },
    'city-mill': {},
  });
  assert.deepEqual(result.remainingSurplusByCityId, {
    'city-granary': { grain: 7 },
    'city-harbor': {},
    'city-mill': {},
  });
});

test('PlanLogisticsFlows skips inactive routes and preserves unmatched demand', () => {
  const result = planLogisticsFlows({
    cities: [
      {
        id: 'city-mine',
        stockByResource: { iron: 12 },
        desiredStockByResource: { iron: 4 },
      },
      {
        id: 'city-capital',
        stockByResource: { iron: 1 },
        desiredStockByResource: { iron: 10 },
      },
    ],
    tradeRoutes: [
      {
        id: 'route-blocked',
        stopCityIds: ['city-mine', 'city-capital'],
        capacityByResource: { iron: 6 },
        active: false,
      },
    ],
  });

  assert.deepEqual(result.plannedFlows, []);
  assert.deepEqual(result.unmetDemandByCityId, {
    'city-capital': { iron: 9 },
    'city-mine': {},
  });
  assert.deepEqual(result.remainingSurplusByCityId, {
    'city-capital': {},
    'city-mine': { iron: 8 },
  });
});

test('PlanLogisticsFlows rejects malformed cities, routes, and unknown stops', () => {
  assert.throws(
    () => planLogisticsFlows({ cities: null, tradeRoutes: [] }),
    /PlanLogisticsFlows cities must be an array/,
  );

  assert.throws(
    () =>
      planLogisticsFlows({
        cities: [{ id: 'city-a', stockByResource: { grain: -1 }, desiredStockByResource: {} }],
        tradeRoutes: [],
      }),
    /PlanLogisticsFlows city stockByResource quantity must be an integer greater than or equal to 0/,
  );

  assert.throws(
    () =>
      planLogisticsFlows({
        cities: [{ id: 'city-a', stockByResource: {}, desiredStockByResource: {} }],
        tradeRoutes: [{ id: 'route-a', stopCityIds: ['city-a', 'city-b'], capacityByResource: { grain: 1 } }],
      }),
    /PlanLogisticsFlows tradeRoute destination city city-b is unknown/,
  );
});
