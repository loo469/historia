import test from 'node:test';
import assert from 'node:assert/strict';

import { City } from '../../../src/domain/economy/City.js';

test('City keeps a normalized set of economic fields', () => {
  const city = new City({
    id: '  city-001 ',
    name: ' Port-aux-Brumes ',
    regionId: ' coast-west ',
    population: 1200,
    workforce: 450,
    prosperity: 61,
    stability: 74,
    stockByResource: {
      ' grain ': 240,
      wood: 90,
    },
    productionRuleIds: ['rule-smokehouse', ' rule-granary ', 'rule-smokehouse'],
    tradeRouteIds: ['route-north', ' route-east ', 'route-north'],
    tags: [' harbor ', 'market', 'harbor'],
    capital: 1,
  });

  assert.deepEqual(city.toJSON(), {
    id: 'city-001',
    name: 'Port-aux-Brumes',
    regionId: 'coast-west',
    population: 1200,
    workforce: 450,
    prosperity: 61,
    stability: 74,
    stockByResource: {
      grain: 240,
      wood: 90,
    },
    productionRuleIds: ['rule-granary', 'rule-smokehouse'],
    tradeRouteIds: ['route-east', 'route-north'],
    tags: ['harbor', 'market'],
    capital: true,
  });

  assert.equal(city.scarcityRatio, 330 / 1200);
});

test('City supports immutable stock and route updates', () => {
  const city = new City({
    id: 'city-001',
    name: 'Port-aux-Brumes',
    regionId: 'coast-west',
    population: 1200,
    stockByResource: {
      grain: 240,
    },
  });

  const restockedCity = city.withStock('wood', 60);
  const connectedCity = restockedCity.withTradeRoute('route-south');

  assert.notEqual(restockedCity, city);
  assert.notEqual(connectedCity, restockedCity);
  assert.deepEqual(restockedCity.stockByResource, { grain: 240, wood: 60 });
  assert.deepEqual(connectedCity.tradeRouteIds, ['route-south']);

  assert.deepEqual(city.stockByResource, { grain: 240 });
  assert.deepEqual(city.tradeRouteIds, []);
});

test('City rejects invalid economic invariants', () => {
  assert.throws(
    () =>
      new City({
        id: '',
        name: 'Port-aux-Brumes',
        regionId: 'coast-west',
        population: 1200,
      }),
    /City id is required/,
  );

  assert.throws(
    () =>
      new City({
        id: 'city-001',
        name: 'Port-aux-Brumes',
        regionId: 'coast-west',
        population: 1200,
        workforce: 1500,
      }),
    /City workforce must be an integer between 0 and 1200/,
  );

  assert.throws(
    () =>
      new City({
        id: 'city-001',
        name: 'Port-aux-Brumes',
        regionId: 'coast-west',
        population: 1200,
        stockByResource: {
          grain: -1,
        },
      }),
    /City stock quantities must be integers greater than or equal to 0/,
  );
});
