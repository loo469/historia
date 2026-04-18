import test from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryRouteRepository } from '../../../src/adapters/economy/InMemoryRouteRepository.js';
import { TradeRoute } from '../../../src/domain/economy/TradeRoute.js';

test('InMemoryRouteRepository loads routes and returns defensive copies', async () => {
  const repository = new InMemoryRouteRepository({
    routes: [
      {
        id: 'route-river',
        name: 'River Run',
        stopCityIds: ['city-harbor', 'city-granary'],
        distance: 4,
        capacityByResource: { grain: 12 },
      },
    ],
  });

  const route = await repository.getById('route-river');

  assert.ok(route instanceof TradeRoute);
  assert.equal(route.id, 'route-river');
  assert.deepEqual(route.capacityByResource, { grain: 12 });

  route.capacityByResource.grain = 0;

  const reloadedRoute = await repository.getById('route-river');
  assert.deepEqual(reloadedRoute.capacityByResource, { grain: 12 });
  assert.equal(await repository.getById('unknown-route'), null);
});

test('InMemoryRouteRepository saves routes and filters them by city', async () => {
  const repository = new InMemoryRouteRepository();

  await repository.save({
    id: 'route-river',
    name: 'River Run',
    stopCityIds: ['city-harbor', 'city-granary'],
    distance: 4,
    capacityByResource: { grain: 12 },
  });

  await repository.save(
    new TradeRoute({
      id: 'route-coastal',
      name: 'Coastal Link',
      stopCityIds: ['city-harbor', 'city-hillfort'],
      distance: 7,
      capacityByResource: { fish: 9 },
    }),
  );

  await repository.save({
    id: 'route-inland',
    name: 'Inland Way',
    stopCityIds: ['city-granary', 'city-forest'],
    distance: 6,
    capacityByResource: { wood: 15 },
  });

  const harborRoutes = await repository.listByCity('city-harbor');

  assert.deepEqual(
    harborRoutes.map((route) => route.id),
    ['route-coastal', 'route-river'],
  );
  assert.ok(harborRoutes.every((route) => route instanceof TradeRoute));
});

test('InMemoryRouteRepository rejects malformed constructor and save payloads', async () => {
  assert.throws(
    () => new InMemoryRouteRepository({ routes: {} }),
    /InMemoryRouteRepository routes must be an array/,
  );

  const repository = new InMemoryRouteRepository();

  await assert.rejects(
    () => repository.save(null),
    /RouteRepositoryPort route must be an object/,
  );
});
