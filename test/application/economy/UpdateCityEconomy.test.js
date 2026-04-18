import test from 'node:test';
import assert from 'node:assert/strict';

import { updateCityEconomy } from '../../../src/application/economy/UpdateCityEconomy.js';

test('UpdateCityEconomy runs production before consumption and returns the next city state', () => {
  const result = updateCityEconomy({
    city: {
      id: 'city-harbor',
      workforce: 30,
      prosperity: 60,
      stability: 58,
      stockByResource: {
        fish: 18,
        wood: 6,
        grain: 5,
      },
    },
    productionRule: {
      id: 'rule-smokehouse',
      workforceRequired: 20,
      inputByResource: {
        fish: 12,
        wood: 4,
      },
      outputByResource: {
        'smoked-fish': 10,
      },
    },
    needsByResource: {
      grain: 4,
      'smoked-fish': 6,
    },
  });

  assert.equal(result.cityId, 'city-harbor');
  assert.equal(result.production.executed, true);
  assert.deepEqual(result.production.nextStockByResource, {
    fish: 6,
    grain: 5,
    wood: 2,
    'smoked-fish': 10,
  });
  assert.equal(result.consumption.fullySatisfied, true);
  assert.deepEqual(result.nextCityState, {
    id: 'city-harbor',
    workforce: 30,
    prosperity: 60,
    stability: 58,
    stockByResource: {
      fish: 6,
      grain: 1,
      wood: 2,
      'smoked-fish': 4,
    },
  });
});

test('UpdateCityEconomy applies shortages when production is blocked or absent', () => {
  const result = updateCityEconomy({
    city: {
      id: 'city-hillfort',
      workforce: 8,
      prosperity: 48,
      stability: 40,
      stockByResource: {
        grain: 2,
      },
    },
    productionRule: {
      id: 'rule-bakery',
      workforceRequired: 10,
      inputByResource: {
        grain: 4,
      },
      outputByResource: {
        bread: 3,
      },
    },
    needsByResource: {
      grain: 5,
      bread: 2,
    },
  });

  assert.equal(result.production.executed, false);
  assert.equal(result.production.reason, 'insufficient-workforce');
  assert.equal(result.consumption.fullySatisfied, false);
  assert.deepEqual(result.consumption.shortagesByResource, {
    bread: 2,
    grain: 3,
  });
  assert.equal(result.nextCityState.prosperity, 39);
  assert.equal(result.nextCityState.stability, 27);
});

test('UpdateCityEconomy rejects invalid city state and malformed production rules', () => {
  assert.throws(
    () => updateCityEconomy({ city: null }),
    /UpdateCityEconomy city must be an object/,
  );

  assert.throws(
    () => updateCityEconomy({ city: { workforce: -1, prosperity: 50, stability: 50, stockByResource: {} } }),
    /UpdateCityEconomy city workforce must be an integer greater than or equal to 0/,
  );

  assert.throws(
    () =>
      updateCityEconomy({
        city: { workforce: 1, prosperity: 50, stability: 50, stockByResource: {} },
        productionRule: { workforceRequired: 1, outputByResource: {} },
      }),
    /UpdateCityEconomy productionRule outputByResource must define at least one produced resource/,
  );
});
