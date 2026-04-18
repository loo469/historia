import test from 'node:test';
import assert from 'node:assert/strict';

import { TradeRoute } from '../../../src/domain/economy/TradeRoute.js';

test('TradeRoute normalizes route structure and capacities', () => {
  const route = new TradeRoute({
    id: ' route-north ',
    name: ' Northern Grain Road ',
    stopCityIds: [' city-harbor ', 'city-ford', 'city-capital'],
    distance: 18,
    capacityByResource: {
      ' grain ': 120,
      wood: 50,
    },
    transportMode: ' river ',
    riskLevel: 12,
    active: 1,
  });

  assert.deepEqual(route.toJSON(), {
    id: 'route-north',
    name: 'Northern Grain Road',
    stopCityIds: ['city-harbor', 'city-ford', 'city-capital'],
    distance: 18,
    capacityByResource: { grain: 120, wood: 50 },
    transportMode: 'river',
    riskLevel: 12,
    active: true,
  });

  assert.equal(route.originCityId, 'city-harbor');
  assert.equal(route.destinationCityId, 'city-capital');
  assert.equal(route.totalCapacity, 170);
  assert.equal(route.connects('city-ford'), true);
  assert.equal(route.connects('city-mine'), false);
});

test('TradeRoute supports immutable capacity and status updates', () => {
  const route = new TradeRoute({
    id: 'route-north',
    name: 'Northern Grain Road',
    stopCityIds: ['city-harbor', 'city-capital'],
    distance: 18,
    capacityByResource: {
      grain: 120,
    },
  });

  const expanded = route.withCapacity('wood', 40);
  const suspended = expanded.withActive(false);

  assert.notEqual(expanded, route);
  assert.notEqual(suspended, expanded);
  assert.deepEqual(route.capacityByResource, { grain: 120 });
  assert.deepEqual(expanded.capacityByResource, { grain: 120, wood: 40 });
  assert.equal(suspended.active, false);
});

test('TradeRoute rejects invalid topology and capacities', () => {
  assert.throws(
    () => new TradeRoute({ id: 'route', name: 'Road', stopCityIds: ['city-a'], distance: 10 }),
    /TradeRoute stopCityIds must contain at least two cities/,
  );

  assert.throws(
    () => new TradeRoute({ id: 'route', name: 'Road', stopCityIds: ['city-a', 'city-a'], distance: 10 }),
    /TradeRoute stopCityIds cannot contain duplicates/,
  );

  assert.throws(
    () => new TradeRoute({ id: 'route', name: 'Road', stopCityIds: ['city-a', 'city-b'], distance: 0 }),
    /TradeRoute distance must be an integer between 1 and/,
  );

  assert.throws(
    () => new TradeRoute({ id: 'route', name: 'Road', stopCityIds: ['city-a', 'city-b'], distance: 10, capacityByResource: { grain: -1 } }),
    /TradeRoute capacities must be integers greater than or equal to 0/,
  );
});
