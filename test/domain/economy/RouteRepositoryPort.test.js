import test from 'node:test';
import assert from 'node:assert/strict';

import { RouteRepositoryPort } from '../../../src/domain/economy/RouteRepositoryPort.js';

test('RouteRepositoryPort validates identifiers before delegating to adapters', async () => {
  const repository = new RouteRepositoryPort();

  await assert.rejects(
    () => repository.getById(''),
    /RouteRepositoryPort routeId is required/,
  );

  await assert.rejects(
    () => repository.listByCity(''),
    /RouteRepositoryPort cityId is required/,
  );
});

test('RouteRepositoryPort validates route payloads before save', async () => {
  const repository = new RouteRepositoryPort();

  await assert.rejects(
    () => repository.save(null),
    /RouteRepositoryPort route must be an object/,
  );

  await assert.rejects(
    () => repository.save({ id: '   ' }),
    /RouteRepositoryPort route.id is required/,
  );
});

test('RouteRepositoryPort exposes explicit adapter implementation errors', async () => {
  const repository = new RouteRepositoryPort();

  await assert.rejects(
    () => repository.getById('route-river'),
    /RouteRepositoryPort.getById must be implemented by an adapter/,
  );

  await assert.rejects(
    () => repository.save({ id: 'route-river' }),
    /RouteRepositoryPort.save must be implemented by an adapter/,
  );

  await assert.rejects(
    () => repository.listByCity('city-harbor'),
    /RouteRepositoryPort.listByCity must be implemented by an adapter/,
  );
});
