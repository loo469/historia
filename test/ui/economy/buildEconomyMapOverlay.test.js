import test from 'node:test';
import assert from 'node:assert/strict';

import { City } from '../../../src/domain/economy/City.js';
import { TradeRoute } from '../../../src/domain/economy/TradeRoute.js';
import { buildEconomyMapOverlay } from '../../../src/ui/economy/buildEconomyMapOverlay.js';

test('buildEconomyMapOverlay builds stable city and route overlays', () => {
  const overlay = buildEconomyMapOverlay([
    new City({
      id: 'city-harbor',
      name: 'Harbor',
      regionId: 'coast',
      population: 120,
      prosperity: 74,
      stability: 61,
      stockByResource: {
        fish: 14,
        wood: 6,
      },
      tradeRouteIds: ['route-river'],
      capital: true,
    }),
    new City({
      id: 'city-mill',
      name: 'Mill',
      regionId: 'riverlands',
      population: 80,
      prosperity: 55,
      stability: 33,
      stockByResource: {
        grain: 10,
      },
      tradeRouteIds: ['route-river', 'route-coast'],
    }),
  ], [
    new TradeRoute({
      id: 'route-river',
      name: 'River Run',
      stopCityIds: ['city-harbor', 'city-mill'],
      distance: 5,
      capacityByResource: {
        fish: 4,
        grain: 7,
      },
      transportMode: 'river',
      riskLevel: 18,
      active: true,
    }),
    new TradeRoute({
      id: 'route-coast',
      name: 'Coast Caravan',
      stopCityIds: ['city-mill', 'city-harbor'],
      distance: 8,
      capacityByResource: {
        wood: 3,
      },
      transportMode: 'land',
      riskLevel: 41,
      active: false,
    }),
  ], {
    cityPositionById: {
      'city-harbor': { x: 10, y: 4 },
      'city-mill': { x: 14, y: 9 },
    },
  });

  assert.equal(overlay.title, 'Carte économie et logistique');
  assert.equal(overlay.summary, '2 villes, 2 routes logistiques');
  assert.deepEqual(overlay.cities, [
    {
      overlayId: 'city:city-harbor',
      type: 'city',
      cityId: 'city-harbor',
      cityName: 'Harbor',
      regionId: 'coast',
      population: 120,
      prosperity: 74,
      stability: 61,
      capital: true,
      label: 'Harbor ★',
      resources: {
        entries: [
          { resourceId: 'fish', quantity: 14 },
          { resourceId: 'wood', quantity: 6 },
        ],
        totalStock: 20,
        resourceCount: 2,
        primaryResourceId: 'fish',
        primaryResourceQuantity: 14,
      },
      tradeRouteIds: ['route-river'],
      marker: {
        icon: 'city',
        tone: 'positive',
        size: 2,
        position: { x: 10, y: 4 },
      },
    },
    {
      overlayId: 'city:city-mill',
      type: 'city',
      cityId: 'city-mill',
      cityName: 'Mill',
      regionId: 'riverlands',
      population: 80,
      prosperity: 55,
      stability: 33,
      capital: false,
      label: 'Mill',
      resources: {
        entries: [
          { resourceId: 'grain', quantity: 10 },
        ],
        totalStock: 10,
        resourceCount: 1,
        primaryResourceId: 'grain',
        primaryResourceQuantity: 10,
      },
      tradeRouteIds: ['route-coast', 'route-river'],
      marker: {
        icon: 'city',
        tone: 'warning',
        size: 1,
        position: { x: 14, y: 9 },
      },
    },
  ]);

  assert.deepEqual(overlay.routes, [
    {
      overlayId: 'route:route-coast',
      type: 'route',
      routeId: 'route-coast',
      routeName: 'Coast Caravan',
      cityIds: ['city-mill', 'city-harbor'],
      originCityId: 'city-mill',
      destinationCityId: 'city-harbor',
      active: false,
      transportMode: 'land',
      riskLevel: 41,
      totalCapacity: 3,
      resources: [
        { resourceId: 'wood', capacity: 3 },
      ],
      label: 'Coast Caravan (land)',
      style: {
        stroke: 'slate',
        width: 1,
        pattern: 'dashed',
        opacity: 0.45,
      },
    },
    {
      overlayId: 'route:route-river',
      type: 'route',
      routeId: 'route-river',
      routeName: 'River Run',
      cityIds: ['city-harbor', 'city-mill'],
      originCityId: 'city-harbor',
      destinationCityId: 'city-mill',
      active: true,
      transportMode: 'river',
      riskLevel: 18,
      totalCapacity: 11,
      resources: [
        { resourceId: 'fish', capacity: 4 },
        { resourceId: 'grain', capacity: 7 },
      ],
      label: 'River Run (river)',
      style: {
        stroke: 'blue',
        width: 2,
        pattern: 'wave',
        opacity: 0.85,
      },
    },
  ]);

  assert.deepEqual(overlay.metrics, {
    cityCount: 2,
    capitalCount: 1,
    routeCount: 2,
    activeRouteCount: 1,
    totalStock: 30,
    totalRouteCapacity: 14,
  });
});

test('buildEconomyMapOverlay supports plain payloads and style overrides', () => {
  const overlay = buildEconomyMapOverlay([
    {
      id: 'city-delta',
      name: 'Delta',
      regionId: 'delta',
      population: 40,
      stockByResource: { salt: 5 },
    },
  ], [
    {
      id: 'route-sea',
      name: 'Sea Lane',
      stopCityIds: ['city-delta', 'city-port'],
      distance: 12,
      capacityByResource: { salt: 9 },
      transportMode: 'sea',
      riskLevel: 12,
    },
  ], {
    styleByTransportMode: {
      sea: { stroke: 'teal', width: 4, pattern: 'current', opacity: 0.7 },
    },
  });

  assert.deepEqual(overlay.routes[0].style, {
    stroke: 'teal',
    width: 4,
    pattern: 'current',
    opacity: 0.7,
  });
  assert.equal(overlay.cities[0].resources.primaryResourceId, 'salt');
});

test('buildEconomyMapOverlay rejects invalid inputs', () => {
  assert.throws(() => buildEconomyMapOverlay(null, []), /EconomyMapOverlay cities must be an array/);
  assert.throws(() => buildEconomyMapOverlay([], null), /EconomyMapOverlay routes must be an array/);
  assert.throws(() => buildEconomyMapOverlay([null], []), /City instances or plain objects/);
  assert.throws(() => buildEconomyMapOverlay([], [null]), /TradeRoute instances or plain objects/);
  assert.throws(() => buildEconomyMapOverlay([], [], null), /EconomyMapOverlay options must be an object/);
  assert.throws(() => buildEconomyMapOverlay([], [], { cityPositionById: [] }), /cityPositionById must be an object/);
  assert.throws(() => buildEconomyMapOverlay([], [], { styleByTransportMode: [] }), /styleByTransportMode must be an object/);
});
