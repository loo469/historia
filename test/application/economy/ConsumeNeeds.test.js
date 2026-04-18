import test from 'node:test';
import assert from 'node:assert/strict';

import { consumeNeeds } from '../../../src/application/economy/ConsumeNeeds.js';

test('ConsumeNeeds deducts required stock when the city can satisfy all needs', () => {
  const result = consumeNeeds({
    city: {
      prosperity: 64,
      stability: 71,
      stockByResource: {
        grain: 20,
        water: 12,
      },
    },
    needsByResource: {
      grain: 8,
      water: 6,
    },
  });

  assert.deepEqual(result, {
    fullySatisfied: true,
    satisfactionRatio: 1,
    nextStockByResource: {
      grain: 12,
      water: 6,
    },
    consumedByResource: {
      grain: 8,
      water: 6,
    },
    shortagesByResource: {},
    prosperityDelta: 0,
    stabilityDelta: 0,
    nextProsperity: 64,
    nextStability: 71,
  });
});

test('ConsumeNeeds reports shortages and applies prosperity and stability penalties', () => {
  const result = consumeNeeds({
    city: {
      prosperity: 50,
      stability: 44,
      stockByResource: {
        grain: 3,
        water: 1,
      },
    },
    needsByResource: {
      grain: 8,
      water: 4,
    },
  });

  assert.equal(result.fullySatisfied, false);
  assert.equal(result.satisfactionRatio, 4 / 12);
  assert.deepEqual(result.nextStockByResource, {
    grain: 0,
    water: 0,
  });
  assert.deepEqual(result.consumedByResource, {
    grain: 3,
    water: 1,
  });
  assert.deepEqual(result.shortagesByResource, {
    grain: 5,
    water: 3,
  });
  assert.equal(result.prosperityDelta, -8);
  assert.equal(result.stabilityDelta, -13);
  assert.equal(result.nextProsperity, 42);
  assert.equal(result.nextStability, 31);
});

test('ConsumeNeeds rejects invalid city state and malformed resource maps', () => {
  assert.throws(
    () => consumeNeeds({ city: null, needsByResource: {} }),
    /ConsumeNeeds city must be an object/,
  );

  assert.throws(
    () => consumeNeeds({ city: { prosperity: 101, stability: 50 }, needsByResource: {} }),
    /ConsumeNeeds city prosperity must be an integer between 0 and 100/,
  );

  assert.throws(
    () => consumeNeeds({ city: { prosperity: 50, stability: 50 }, needsByResource: { ' ': 1 } }),
    /ConsumeNeeds needsByResource cannot contain an empty resource id/,
  );

  assert.throws(
    () => consumeNeeds({ city: { prosperity: 50, stability: 50 }, needsByResource: { grain: 1 }, stockByResource: { grain: -1 } }),
    /ConsumeNeeds stockByResource quantities must be integers greater than or equal to 0/,
  );
});
