import test from 'node:test';
import assert from 'node:assert/strict';

import { CityRepositoryPort } from '../../../src/domain/economy/CityRepositoryPort.js';

test('CityRepositoryPort validates identifiers before delegating to adapters', async () => {
  const port = new CityRepositoryPort();

  await assert.rejects(() => port.getById(''), /CityRepositoryPort cityId is required/);
  await assert.rejects(() => port.listByRegion('   '), /CityRepositoryPort regionId is required/);
});

test('CityRepositoryPort validates city payloads before save', async () => {
  const port = new CityRepositoryPort();

  await assert.rejects(() => port.save(null), /CityRepositoryPort city must be an object/);
  await assert.rejects(() => port.save({ id: ' ' }), /CityRepositoryPort city.id is required/);
});

test('CityRepositoryPort exposes explicit adapter implementation errors', async () => {
  const port = new CityRepositoryPort();
  const city = { id: 'city-harbor', regionId: 'coast-west' };

  await assert.rejects(
    () => port.getById('city-harbor'),
    /CityRepositoryPort\.getById must be implemented by an adapter/,
  );
  await assert.rejects(
    () => port.save(city),
    /CityRepositoryPort\.save must be implemented by an adapter/,
  );
  await assert.rejects(
    () => port.listByRegion('coast-west'),
    /CityRepositoryPort\.listByRegion must be implemented by an adapter/,
  );
});
