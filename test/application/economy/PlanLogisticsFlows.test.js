import test from 'node:test';
import assert from 'node:assert/strict';

import { planLogisticsFlows } from '../../../src/application/economy/PlanLogisticsFlows.js';

test('PlanLogisticsFlows moves stock from connected surplus cities to shortage cities', () => {
  const result = planLogisticsFlows({
    cities: [
      { id: 'city-granary', stockByResource: { grain: 20, wood: 2 } },
      { id: 'city-ford', stockByResource: { grain: 8 } },
      { id: 'city-harbor', stockByResource: { grain: 1 } },
    ],
    routes: [
      {
        id: 'route-river',
        stopCityIds: ['city-granary', 'city-ford', 'city-harbor'],
        capacityByResource: { grain: 6 },
        active: true,
      },
    ],
    shortageRequests: [
      { cityId: 'city-harbor', resourceId: 'grain', requestedQuantity: 5, priority: 90 },
    ],
    reserveByResource: { grain: 4 },
  });

  assert.deepEqual(result.transfers, [
    {
      routeId: 'route-river',
      sourceCityId: 'city-granary',
      destinationCityId: 'city-harbor',
      resourceId: 'grain',
      quantity: 5,
    },
  ]);
  assert.equal(result.fulfilledRequestCount, 1);
  assert.deepEqual(result.unresolvedRequests, []);
  assert.deepEqual(
    result.cities.find((city) => city.id === 'city-granary').stockByResource,
    { grain: 15, wood: 2 },
  );
  assert.deepEqual(
    result.cities.find((city) => city.id === 'city-harbor').stockByResource,
    { grain: 6 },
  );
});

test('PlanLogisticsFlows leaves unresolved quantities when routes are inactive or capacity is insufficient', () => {
  const result = planLogisticsFlows({
    cities: [
      { id: 'city-granary', stockByResource: { grain: 10 } },
      { id: 'city-harbor', stockByResource: { grain: 0 } },
    ],
    routes: [
      {
        id: 'route-closed',
        stopCityIds: ['city-granary', 'city-harbor'],
        capacityByResource: { grain: 3 },
        active: false,
      },
      {
        id: 'route-open',
        stopCityIds: ['city-granary', 'city-harbor'],
        capacityByResource: { grain: 2 },
        active: true,
      },
    ],
    shortageRequests: [
      { cityId: 'city-harbor', resourceId: 'grain', requestedQuantity: 5, priority: 90 },
    ],
    reserveByResource: { grain: 9 },
  });

  assert.deepEqual(result.transfers, [
    {
      routeId: 'route-open',
      sourceCityId: 'city-granary',
      destinationCityId: 'city-harbor',
      resourceId: 'grain',
      quantity: 1,
    },
  ]);
  assert.deepEqual(result.unresolvedRequests, [
    {
      cityId: 'city-harbor',
      resourceId: 'grain',
      requestedQuantity: 5,
      priority: 90,
      unresolvedQuantity: 4,
      reason: 'insufficient-capacity-or-stock',
    },
  ]);
  assert.equal(result.fulfilledRequestCount, 0);
});

test('PlanLogisticsFlows splits flows across multiple sources on the same route', () => {
  const result = planLogisticsFlows({
    cities: [
      { id: 'city-mill', stockByResource: { flour: 4 } },
      { id: 'city-granary', stockByResource: { flour: 7 } },
      { id: 'city-capital', stockByResource: { flour: 0 } },
    ],
    routes: [
      {
        id: 'route-road',
        stopCityIds: ['city-mill', 'city-granary', 'city-capital'],
        capacityByResource: { flour: 4 },
        active: true,
      },
    ],
    shortageRequests: [
      { cityId: 'city-capital', resourceId: 'flour', requestedQuantity: 6, priority: 80 },
    ],
    reserveByResource: { flour: 2 },
  });

  assert.deepEqual(result.transfers, [
    {
      routeId: 'route-road',
      sourceCityId: 'city-mill',
      destinationCityId: 'city-capital',
      resourceId: 'flour',
      quantity: 2,
    },
    {
      routeId: 'route-road',
      sourceCityId: 'city-granary',
      destinationCityId: 'city-capital',
      resourceId: 'flour',
      quantity: 4,
    },
  ]);
  assert.deepEqual(result.unresolvedRequests, []);
});

test('PlanLogisticsFlows rejects invalid city, route, and request payloads', () => {
  assert.throws(
    () => planLogisticsFlows({ cities: {}, routes: [], shortageRequests: [] }),
    /PlanLogisticsFlows cities must be an array/,
  );

  assert.throws(
    () => planLogisticsFlows({ cities: [], routes: {}, shortageRequests: [] }),
    /PlanLogisticsFlows routes must be an array/,
  );

  assert.throws(
    () => planLogisticsFlows({ cities: [], routes: [], shortageRequests: {} }),
    /PlanLogisticsFlows shortageRequests must be an array/,
  );

  assert.throws(
    () => planLogisticsFlows({
      cities: [{ id: 'city-a', stockByResource: {} }],
      routes: [{ id: 'route-a', stopCityIds: ['city-a'], capacityByResource: {} }],
      shortageRequests: [],
    }),
    /PlanLogisticsFlows routes\[0\]\.stopCityIds must contain at least two cities/,
  );
});
