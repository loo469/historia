import test from 'node:test';
import assert from 'node:assert/strict';

import { MarketRepository } from '../../../src/application/economy/MarketRepository.js';

test('MarketRepository validates city, resource, and price inputs before adapter delegation', () => {
  const repository = new MarketRepository();

  assert.throws(
    () => repository.getPrice({ cityId: '', resourceId: 'grain' }),
    /MarketRepository getPrice cityId is required/,
  );

  assert.throws(
    () => repository.getPrice({ cityId: 'city-a', resourceId: '' }),
    /MarketRepository getPrice resourceId is required/,
  );

  assert.throws(
    () => repository.setPrice({ cityId: 'city-a', resourceId: 'grain', price: -1 }),
    /MarketRepository setPrice price must be an integer between 0 and/,
  );

  assert.throws(
    () => repository.listPricesByCity(''),
    /MarketRepository listPricesByCity cityId is required/,
  );
});

test('MarketRepository exposes explicit adapter implementation errors', () => {
  const repository = new MarketRepository();

  assert.throws(
    () => repository.getPrice({ cityId: 'city-a', resourceId: 'grain' }),
    /MarketRepository.getPrice must be implemented by an adapter/,
  );

  assert.throws(
    () => repository.setPrice({ cityId: 'city-a', resourceId: 'grain', price: 12 }),
    /MarketRepository.setPrice must be implemented by an adapter/,
  );

  assert.throws(
    () => repository.listPricesByCity('city-a'),
    /MarketRepository.listPricesByCity must be implemented by an adapter/,
  );
});
