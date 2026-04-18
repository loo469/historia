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

test('ConsumeNeeds clamps prosperity and stability when scarcity would drop them below zero', () => {
  const result = consumeNeeds({
    city: {
      prosperity: 4,
      stability: 6,
      stockByResource: {
        grain: 0,
      },
    },
    needsByResource: {
      grain: 9,
    },
  });

  assert.deepEqual(result, {
    fullySatisfied: false,
    satisfactionRatio: 0,
    nextStockByResource: {
      grain: 0,
    },
    consumedByResource: {
      grain: 0,
    },
    shortagesByResource: {
      grain: 9,
    },
    prosperityDelta: -12,
    stabilityDelta: -18,
    nextProsperity: 0,
    nextStability: 0,
  });
});

test('ConsumeNeeds treats zero-quantity needs as fully satisfied without penalties', () => {
  const result = consumeNeeds({
    city: {
      prosperity: 58,
      stability: 63,
      stockByResource: {
        grain: 5,
        water: 2,
      },
    },
    needsByResource: {
      grain: 0,
      water: 0,
    },
  });

  assert.deepEqual(result, {
    fullySatisfied: true,
    satisfactionRatio: 1,
    nextStockByResource: {
      grain: 5,
      water: 2,
    },
    consumedByResource: {
      grain: 0,
      water: 0,
    },
    shortagesByResource: {},
    prosperityDelta: 0,
    stabilityDelta: 0,
    nextProsperity: 58,
    nextStability: 63,
  });
});

test('ConsumeNeeds uses the explicit stock snapshot instead of mutating the city stock reference', () => {
  const cityStock = {
    grain: 12,
    water: 8,
  };
  const explicitStock = {
    grain: 3,
    water: 6,
  };

  const result = consumeNeeds({
    city: {
      prosperity: 70,
      stability: 72,
      stockByResource: cityStock,
    },
    stockByResource: explicitStock,
    needsByResource: {
      grain: 4,
      water: 2,
    },
  });

  assert.deepEqual(result.nextStockByResource, {
    grain: 0,
    water: 4,
  });
  assert.deepEqual(result.consumedByResource, {
    grain: 3,
    water: 2,
  });
  assert.deepEqual(result.shortagesByResource, {
    grain: 1,
  });
  assert.deepEqual(cityStock, {
    grain: 12,
    water: 8,
  });
  assert.deepEqual(explicitStock, {
    grain: 3,
    water: 6,
  });
});
