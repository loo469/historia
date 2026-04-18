import test from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryCityRepository } from '../../../src/adapters/economy/InMemoryCityRepository.js';
import { City } from '../../../src/domain/economy/City.js';

test('InMemoryCityRepository loads cities and returns defensive copies', async () => {
  const repository = new InMemoryCityRepository({
    cities: [
      {
        id: 'city-harbor',
        name: 'Harbor',
        regionId: 'coast-west',
        population: 100,
        stockByResource: { grain: 12 },
      },
    ],
  });

  const city = await repository.getById('city-harbor');

  assert.ok(city instanceof City);
  assert.equal(city.id, 'city-harbor');
  assert.deepEqual(city.stockByResource, { grain: 12 });

  city.stockByResource.grain = 0;

  const reloadedCity = await repository.getById('city-harbor');
  assert.deepEqual(reloadedCity.stockByResource, { grain: 12 });
  assert.equal(await repository.getById('unknown-city'), null);
});

test('InMemoryCityRepository saves cities and filters them by region', async () => {
  const repository = new InMemoryCityRepository();

  await repository.save({
    id: 'city-harbor',
    name: 'Harbor',
    regionId: 'coast-west',
    population: 100,
    stockByResource: { grain: 12 },
  });

  await repository.save(
    new City({
      id: 'city-granary',
      name: 'Granary',
      regionId: 'coast-west',
      population: 80,
      stockByResource: { grain: 40 },
    }),
  );

  await repository.save({
    id: 'city-hillfort',
    name: 'Hillfort',
    regionId: 'highlands',
    population: 60,
    stockByResource: { stone: 15 },
  });

  const coastCities = await repository.listByRegion('coast-west');

  assert.deepEqual(
    coastCities.map((city) => city.id),
    ['city-granary', 'city-harbor'],
  );
  assert.ok(coastCities.every((city) => city instanceof City));
});

test('InMemoryCityRepository rejects malformed constructor and save payloads', async () => {
  assert.throws(
    () => new InMemoryCityRepository({ cities: {} }),
    /InMemoryCityRepository cities must be an array/,
  );

  const repository = new InMemoryCityRepository();

  await assert.rejects(
    () => repository.save(null),
    /CityRepositoryPort city must be an object/,
  );
});
