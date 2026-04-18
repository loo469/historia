import test from 'node:test';
import assert from 'node:assert/strict';

import { consumeNeeds } from '../../../src/application/economy/consumeNeeds.js';

test('consumeNeeds subtracts fulfilled needs from city stock without mutating the input city', () => {
  const city = {
    id: 'city-granary',
    population: 120,
    prosperity: 62,
    stability: 71,
    stockByResource: {
      grain: 40,
      water: 25,
    },
  };

  const result = consumeNeeds(city, [
    { resourceId: 'grain', requiredQuantity: 12, shortagePenalty: 8, priority: 90, affects: 'stability' },
    { resourceId: 'water', requiredQuantity: 10, shortagePenalty: 4, priority: 80, affects: 'prosperity' },
  ]);

  assert.deepEqual(result.city.stockByResource, {
    grain: 28,
    water: 15,
  });
  assert.deepEqual(result.consumption, [
    { resourceId: 'grain', requiredQuantity: 12, consumedQuantity: 12 },
    { resourceId: 'water', requiredQuantity: 10, consumedQuantity: 10 },
  ]);
  assert.deepEqual(result.shortages, []);
  assert.equal(result.fulfilledNeedCount, 2);
  assert.equal(result.shortageCount, 0);
  assert.deepEqual(city.stockByResource, { grain: 40, water: 25 });
});

test('consumeNeeds records shortages and applies penalties to the targeted city metric', () => {
  const result = consumeNeeds(
    {
      id: 'city-siege',
      population: 80,
      prosperity: 55,
      stability: 48,
      stockByResource: {
        grain: 3,
        water: 1,
        medicine: 0,
      },
    },
    [
      { resourceId: 'grain', requiredQuantity: 6, shortagePenalty: 10, priority: 90, affects: 'stability' },
      { resourceId: 'water', requiredQuantity: 4, shortagePenalty: 7, priority: 80, affects: 'prosperity' },
      { resourceId: 'medicine', requiredQuantity: 2, shortagePenalty: 5, priority: 70, affects: 'population' },
    ],
  );

  assert.deepEqual(result.city.stockByResource, {
    grain: 0,
    water: 0,
    medicine: 0,
  });
  assert.deepEqual(result.shortages, [
    { resourceId: 'grain', shortageQuantity: 3, affects: 'stability', penaltyApplied: 10 },
    { resourceId: 'water', shortageQuantity: 3, affects: 'prosperity', penaltyApplied: 7 },
    { resourceId: 'medicine', shortageQuantity: 2, affects: 'population', penaltyApplied: 5 },
  ]);
  assert.equal(result.city.stability, 38);
  assert.equal(result.city.prosperity, 48);
  assert.equal(result.city.population, 75);
  assert.equal(result.fulfilledNeedCount, 0);
  assert.equal(result.shortageCount, 3);
});

test('consumeNeeds applies needs in priority order before lower-priority consumption', () => {
  const result = consumeNeeds(
    {
      id: 'city-market',
      population: 60,
      prosperity: 50,
      stability: 50,
      stockByResource: {
        grain: 5,
      },
    },
    [
      { resourceId: 'grain', requiredQuantity: 4, shortagePenalty: 4, priority: 10, affects: 'prosperity' },
      { resourceId: 'grain', requiredQuantity: 4, shortagePenalty: 6, priority: 90, affects: 'stability' },
    ],
  );

  assert.deepEqual(result.consumption, [
    { resourceId: 'grain', requiredQuantity: 4, consumedQuantity: 4 },
    { resourceId: 'grain', requiredQuantity: 4, consumedQuantity: 1 },
  ]);
  assert.deepEqual(result.shortages, [
    { resourceId: 'grain', shortageQuantity: 3, affects: 'prosperity', penaltyApplied: 4 },
  ]);
  assert.equal(result.city.stability, 50);
  assert.equal(result.city.prosperity, 46);
});

test('consumeNeeds rejects invalid city and need payloads', () => {
  assert.throws(() => consumeNeeds(null, []), /consumeNeeds city must be an object/);
  assert.throws(
    () => consumeNeeds({ id: 'city-a', population: 10, prosperity: 50, stability: 50, stockByResource: {} }, {}),
    /consumeNeeds needs must be an array/,
  );
  assert.throws(
    () => consumeNeeds(
      { id: 'city-a', population: 10, prosperity: 50, stability: 50, stockByResource: {} },
      [{ resourceId: '', requiredQuantity: 1 }],
    ),
    /consumeNeeds needs\[0\]\.resourceId is required/,
  );
  assert.throws(
    () => consumeNeeds(
      { id: 'city-a', population: 10, prosperity: 50, stability: 50, stockByResource: {} },
      [{ resourceId: 'grain', requiredQuantity: -1 }],
    ),
    /consumeNeeds needs\[0\]\.requiredQuantity must be an integer between 0 and/,
  );
});
