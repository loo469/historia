import test from 'node:test';
import assert from 'node:assert/strict';

import { updateCityEconomy } from '../../../src/application/economy/UpdateCityEconomy.js';

test('UpdateCityEconomy orchestrates production before consumption for one city tick', () => {
  const result = updateCityEconomy({
    city: {
      id: 'city-harbor',
      population: 90,
      workforce: 20,
      prosperity: 60,
      stability: 65,
      stockByResource: {
        grain: 10,
        wood: 3,
      },
    },
    productionRules: [
      {
        id: 'rule-mill',
        workforceRequired: 8,
        inputByResource: { grain: 6 },
        outputByResource: { flour: 9 },
      },
      {
        id: 'rule-lumber',
        workforceRequired: 4,
        inputByResource: { wood: 1 },
        outputByResource: { planks: 2 },
      },
    ],
    needs: [
      { resourceId: 'flour', requiredQuantity: 5, shortagePenalty: 8, priority: 90, affects: 'stability' },
      { resourceId: 'grain', requiredQuantity: 2, shortagePenalty: 5, priority: 80, affects: 'prosperity' },
    ],
  });

  assert.deepEqual(result.city.stockByResource, {
    grain: 2,
    wood: 2,
    flour: 4,
    planks: 2,
  });
  assert.deepEqual(result.producedByResource, { flour: 9, planks: 2 });
  assert.deepEqual(result.consumedByResource, { flour: 5, grain: 2 });
  assert.equal(result.workforceUsed, 12);
  assert.equal(result.workforceRemaining, 8);
  assert.equal(result.executedProductionRuleCount, 2);
  assert.equal(result.shortageCount, 0);
});

test('UpdateCityEconomy carries forward blocked production and resulting shortages', () => {
  const result = updateCityEconomy({
    city: {
      id: 'city-siege',
      population: 70,
      workforce: 5,
      prosperity: 55,
      stability: 52,
      stockByResource: {
        grain: 1,
      },
    },
    productionRules: [
      {
        id: 'rule-bakery',
        workforceRequired: 6,
        inputByResource: { grain: 2 },
        outputByResource: { bread: 4 },
      },
    ],
    needs: [
      { resourceId: 'bread', requiredQuantity: 3, shortagePenalty: 9, priority: 90, affects: 'stability' },
    ],
  });

  assert.equal(result.productionResults[0].executed, false);
  assert.equal(result.productionResults[0].reason, 'insufficient-workforce');
  assert.deepEqual(result.shortages, [
    { resourceId: 'bread', shortageQuantity: 3, affects: 'stability', penaltyApplied: 9 },
  ]);
  assert.equal(result.city.stability, 43);
  assert.equal(result.workforceUsed, 0);
  assert.equal(result.workforceRemaining, 5);
});

test('UpdateCityEconomy validates its top-level inputs', () => {
  assert.throws(
    () => updateCityEconomy({ city: null }),
    /UpdateCityEconomy city must be an object/,
  );

  assert.throws(
    () => updateCityEconomy({ city: { id: 'city-a', stockByResource: {} }, productionRules: {} }),
    /UpdateCityEconomy productionRules must be an array/,
  );

  assert.throws(
    () => updateCityEconomy({ city: { id: 'city-a', stockByResource: {} }, needs: {} }),
    /UpdateCityEconomy needs must be an array/,
  );
});
