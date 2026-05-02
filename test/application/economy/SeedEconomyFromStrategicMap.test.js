import test from 'node:test';
import assert from 'node:assert/strict';

import { City } from '../../../src/domain/economy/City.js';
import { TradeRoute } from '../../../src/domain/economy/TradeRoute.js';
import { seedEconomyFromStrategicMap } from '../../../src/application/economy/SeedEconomyFromStrategicMap.js';

function createGeneratedMap() {
  return {
    provincePositionById: {
      'crown-heart': { x: 50, y: 28 },
      'river-gate': { x: 35, y: 56 },
      'iron-plain': { x: 62, y: 55 },
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
        terrain: 'river',
        resourceIds: ['clay'],
        contested: true,
        neighborIds: ['crown-heart', 'iron-plain'],
      },
      {
        id: 'crown-heart',
        name: 'Coeur de Couronne',
        ownerFactionId: 'aurora',
        supplyLevel: 'stable',
        loyalty: 78,
        strategicValue: 9,
        terrain: 'coastal',
        resourceDeposits: { timber: 3 },
        capital: true,
        neighborIds: ['river-gate'],
      },
      {
        id: 'iron-plain',
        name: 'Plaine de Fer',
        ownerFactionId: 'ember',
        supplyLevel: 'strained',
        loyalty: 61,
        strategicValue: 4,
        terrain: 'plains',
        resourceIds: ['ore'],
        neighborIds: ['river-gate'],
      },
    ],
  };
}

test('seedEconomyFromStrategicMap derives stable cities, stock and logistics from generated provinces', () => {
  const result = seedEconomyFromStrategicMap(createGeneratedMap(), {
    cityIdByProvinceId: {
      'crown-heart': 'crown-port',
      'river-gate': 'river-gate-city',
      'iron-plain': 'iron-plain-city',
    },
    cityNameByProvinceId: {
      'crown-heart': 'Port de Couronne',
    },
    resourceHintsByProvinceId: {
      'iron-plain': { tools: 5 },
    },
  });

  assert.equal(result.cities.length, 3);
  assert.equal(result.routes.length, 2);
  assert.equal(result.metrics.provinceCount, 3);
  assert.deepEqual(result.metrics.stockedResourceIds, ['clay', 'fish', 'grain', 'horses', 'ore', 'salt', 'timber', 'tools']);

  const crown = result.cities.find((city) => city.id === 'crown-port');
  const river = result.cities.find((city) => city.id === 'river-gate-city');
  const iron = result.cities.find((city) => city.id === 'iron-plain-city');

  assert.equal(crown instanceof City, true);
  assert.equal(crown.name, 'Port de Couronne');
  assert.equal(crown.regionId, 'crown-heart');
  assert.equal(crown.capital, true);
  assert.equal(crown.prosperity, 83);
  assert.equal(crown.stability, 75);
  assert.equal(crown.stockByResource.fish > 0, true);
  assert.equal(crown.stockByResource.salt > 0, true);
  assert.equal(crown.stockByResource.timber, 3);

  assert.equal(river.capital, false);
  assert.equal(river.stability, 21);
  assert.equal(river.stockByResource.clay > 0, true);
  assert.equal(river.stockByResource.fish > 0, true);

  assert.equal(iron.stockByResource.grain > river.stockByResource.grain, true);
  assert.equal(iron.stockByResource.ore > 0, true);
  assert.equal(iron.stockByResource.tools, 5);

  assert.deepEqual(result.cityPositionById, {
    'crown-port': { x: 50, y: 28 },
    'iron-plain-city': { x: 62, y: 55 },
    'river-gate-city': { x: 35, y: 56 },
  });

  const crownRoute = result.routes.find((route) => route.id === 'route:crown-heart:river-gate');
  const ironRoute = result.routes.find((route) => route.id === 'route:iron-plain:river-gate');

  assert.equal(crownRoute instanceof TradeRoute, true);
  assert.deepEqual(crownRoute.stopCityIds, ['crown-port', 'river-gate-city']);
  assert.equal(crownRoute.transportMode, 'river');
  assert.equal(crownRoute.active, false);
  assert.equal(crownRoute.riskLevel, 64);
  assert.equal(crownRoute.capacityByResource.fish > 0, true);

  assert.equal(ironRoute.transportMode, 'river');
  assert.equal(ironRoute.active, false);
  assert.equal(ironRoute.capacityByResource.ore > 0, true);
  assert.deepEqual(river.tradeRouteIds, ['route:crown-heart:river-gate', 'route:iron-plain:river-gate']);
});

test('seedEconomyFromStrategicMap accepts explicit city positions and keeps generated route ids unique', () => {
  const result = seedEconomyFromStrategicMap(createGeneratedMap(), {
    cityPositionByProvinceId: {
      'river-gate': { x: 34, y: 58, labelDx: -5 },
    },
  });

  assert.equal(result.cities.every((city) => city instanceof City), true);
  assert.equal(result.routes.every((route) => route instanceof TradeRoute), true);
  assert.equal(new Set(result.routes.map((route) => route.id)).size, result.routes.length);
  assert.deepEqual(result.cityPositionById['city:river-gate'], { x: 34, y: 58, labelDx: -5 });
  assert.deepEqual(result.cities.map((city) => city.id), ['city:crown-heart', 'city:iron-plain', 'city:river-gate']);
});

test('seedEconomyFromStrategicMap rejects invalid generated map payloads', () => {
  assert.throws(() => seedEconomyFromStrategicMap(null), /generatedMap must be an object/);
  assert.throws(() => seedEconomyFromStrategicMap({ provinces: null }), /generatedMap.provinces must be an array/);
  assert.throws(
    () => seedEconomyFromStrategicMap({ provinces: [{ id: 'broken', name: 'Broken', ownerFactionId: 'aurora', supplyLevel: 'stable', neighborIds: null }] }),
    /province.neighborIds must be an array/,
  );
  assert.throws(
    () => seedEconomyFromStrategicMap({ provinces: [{ id: 'broken', name: 'Broken', ownerFactionId: 'aurora', supplyLevel: 'stable', neighborIds: [], resourceDeposits: { grain: -1 } }] }),
    /resourceDeposits quantities must be integers/,
  );
});
