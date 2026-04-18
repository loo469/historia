import test from 'node:test';
import assert from 'node:assert/strict';

import { TradeRoute } from '../../../src/domain/economy/TradeRoute.js';

test('TradeRoute keeps a normalized logistics definition', () => {
  const route = new TradeRoute({
    id: ' route-river-01 ',
    sourceCityId: ' city-a ',
    destinationCityId: ' city-b ',
    transportType: ' river barge ',
    distance: 180,
    capacity: 90,
    travelTime: 6,
    maintenanceCost: 14,
    riskLevel: 35,
    active: 1,
    blocked: 0,
    tags: [' river ', 'bulk', 'river'],
  });

  assert.deepEqual(route.toJSON(), {
    id: 'route-river-01',
    sourceCityId: 'city-a',
    destinationCityId: 'city-b',
    transportType: 'river barge',
    distance: 180,
    capacity: 90,
    travelTime: 6,
    maintenanceCost: 14,
    riskLevel: 35,
    active: true,
    blocked: false,
    tags: ['bulk', 'river'],
  });

  assert.equal(route.isOperational, true);
  assert.equal(route.throughputPerDay, 15);
  assert.equal(route.pressureLevel, 'stable');
});

test('TradeRoute supports immutable capacity, risk, activity, and blockage updates', () => {
  const route = new TradeRoute({
    id: 'route-pass',
    sourceCityId: 'city-a',
    destinationCityId: 'city-b',
    transportType: 'mountain road',
    distance: 80,
    capacity: 40,
    travelTime: 4,
  });

  const expandedRoute = route.withCapacity(60);
  const strainedRoute = expandedRoute.withRiskLevel(75);
  const blockedRoute = strainedRoute.withBlocked(true);
  const inactiveRoute = blockedRoute.withActive(false);

  assert.notEqual(expandedRoute, route);
  assert.notEqual(strainedRoute, expandedRoute);
  assert.notEqual(blockedRoute, strainedRoute);
  assert.notEqual(inactiveRoute, blockedRoute);
  assert.equal(expandedRoute.capacity, 60);
  assert.equal(strainedRoute.pressureLevel, 'critical');
  assert.equal(blockedRoute.isOperational, false);
  assert.equal(blockedRoute.pressureLevel, 'blocked');
  assert.equal(inactiveRoute.active, false);
  assert.equal(route.capacity, 40);
  assert.equal(route.riskLevel, 0);
  assert.equal(route.blocked, false);
});

test('TradeRoute surfaces strained routes and zero-capacity disruptions', () => {
  const strainedRoute = new TradeRoute({
    id: 'route-desert',
    sourceCityId: 'city-oasis',
    destinationCityId: 'city-port',
    transportType: 'caravan',
    distance: 220,
    capacity: 0,
    travelTime: 11,
    riskLevel: 55,
  });

  assert.equal(strainedRoute.isOperational, false);
  assert.equal(strainedRoute.pressureLevel, 'blocked');
  assert.equal(strainedRoute.throughputPerDay, 0);
});

test('TradeRoute rejects invalid city pairs and logistics invariants', () => {
  assert.throws(
    () => new TradeRoute({ id: '', sourceCityId: 'city-a', destinationCityId: 'city-b', transportType: 'road', distance: 10, capacity: 5, travelTime: 1 }),
    /TradeRoute id is required/,
  );

  assert.throws(
    () => new TradeRoute({ id: 'route', sourceCityId: 'city-a', destinationCityId: 'city-a', transportType: 'road', distance: 10, capacity: 5, travelTime: 1 }),
    /TradeRoute cities must be different/,
  );

  assert.throws(
    () => new TradeRoute({ id: 'route', sourceCityId: 'city-a', destinationCityId: 'city-b', transportType: 'road', distance: 0, capacity: 5, travelTime: 1 }),
    /TradeRoute distance must be an integer between 1 and/,
  );

  assert.throws(
    () => new TradeRoute({ id: 'route', sourceCityId: 'city-a', destinationCityId: 'city-b', transportType: 'road', distance: 10, capacity: 5, travelTime: 1, riskLevel: 101 }),
    /TradeRoute riskLevel must be an integer between 0 and 100/,
  );
});
