import test from 'node:test';
import assert from 'node:assert/strict';

import { produceResources } from '../../../src/application/economy/ProduceResources.js';

test('ProduceResources consumes inputs and adds outputs when requirements are met', () => {
  const result = produceResources({
    city: {
      id: 'city-harbor',
      workforce: 45,
      stockByResource: {
        fish: 30,
        wood: 10,
      },
    },
    rule: {
      id: 'rule-smokehouse',
      workforceRequired: 20,
      inputByResource: {
        fish: 18,
        wood: 4,
      },
      outputByResource: {
        'smoked-fish': 12,
      },
    },
  });

  assert.deepEqual(result, {
    executed: true,
    reason: 'produced',
    nextStockByResource: {
      fish: 12,
      wood: 6,
      'smoked-fish': 12,
    },
    consumedByResource: {
      fish: 18,
      wood: 4,
    },
    producedByResource: {
      'smoked-fish': 12,
    },
    workforceUsed: 20,
  });
});

test('ProduceResources reports blocked execution for disabled rules or missing requirements', () => {
  const disabledResult = produceResources({
    city: { workforce: 45, stockByResource: { grain: 20 } },
    rule: {
      workforceRequired: 10,
      outputByResource: { flour: 8 },
      enabled: false,
    },
  });

  assert.deepEqual(disabledResult, {
    executed: false,
    reason: 'rule-disabled',
    nextStockByResource: { grain: 20 },
    consumedByResource: {},
    producedByResource: {},
    workforceUsed: 0,
  });

  const missingInputsResult = produceResources({
    city: { workforce: 45, stockByResource: { grain: 4 } },
    rule: {
      workforceRequired: 10,
      inputByResource: { grain: 8, water: 2 },
      outputByResource: { flour: 6 },
    },
  });

  assert.equal(missingInputsResult.executed, false);
  assert.equal(missingInputsResult.reason, 'insufficient-inputs');
  assert.deepEqual(missingInputsResult.missingRequirements, [
    { resourceId: 'grain', required: 8, available: 4 },
    { resourceId: 'water', required: 2, available: 0 },
  ]);
});

test('ProduceResources rejects invalid workforce and output definitions', () => {
  assert.throws(
    () => produceResources({ city: null, rule: {} }),
    /ProduceResources city must be an object/,
  );

  assert.throws(
    () => produceResources({ city: { workforce: -1 }, rule: { outputByResource: { grain: 1 } } }),
    /ProduceResources city workforce must be an integer greater than or equal to 0/,
  );

  assert.throws(
    () => produceResources({ city: { workforce: 1 }, rule: { workforceRequired: 1, outputByResource: {} } }),
    /ProduceResources rule outputByResource must define at least one produced resource/,
  );
});
