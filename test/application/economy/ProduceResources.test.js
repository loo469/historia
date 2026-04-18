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

test('ProduceResources preserves stock state when blocked by insufficient workforce', () => {
  const result = produceResources({
    city: {
      id: 'city-smithy',
      workforce: 3,
      stockByResource: {
        iron: 8,
        coal: 5,
      },
    },
    rule: {
      id: 'rule-forge-tools',
      workforceRequired: 6,
      inputByResource: {
        coal: 2,
        iron: 4,
      },
      outputByResource: {
        tools: 2,
      },
    },
  });

  assert.deepEqual(result, {
    executed: false,
    reason: 'insufficient-workforce',
    nextStockByResource: {
      coal: 5,
      iron: 8,
    },
    consumedByResource: {},
    producedByResource: {},
    workforceUsed: 0,
  });
});

test('ProduceResources can run recipes without inputs and accumulates outputs onto existing stock', () => {
  const result = produceResources({
    city: {
      id: 'city-windmill',
      workforce: 12,
      stockByResource: {
        grain: 9,
        flour: 4,
      },
    },
    rule: {
      id: 'rule-bake-flour',
      workforceRequired: 5,
      outputByResource: {
        flour: 7,
      },
    },
  });

  assert.deepEqual(result, {
    executed: true,
    reason: 'produced',
    nextStockByResource: {
      flour: 11,
      grain: 9,
    },
    consumedByResource: {},
    producedByResource: {
      flour: 7,
    },
    workforceUsed: 5,
  });
});

test('ProduceResources reports every missing requirement while leaving stock untouched', () => {
  const result = produceResources({
    city: {
      id: 'city-foundry',
      workforce: 20,
      stockByResource: {
        coal: 1,
        iron: 2,
      },
    },
    rule: {
      id: 'rule-cast-cannon',
      workforceRequired: 10,
      inputByResource: {
        coal: 3,
        iron: 6,
        wood: 2,
      },
      outputByResource: {
        cannon: 1,
      },
    },
  });

  assert.equal(result.executed, false);
  assert.equal(result.reason, 'insufficient-inputs');
  assert.deepEqual(result.nextStockByResource, {
    coal: 1,
    iron: 2,
  });
  assert.deepEqual(result.missingRequirements, [
    { resourceId: 'coal', required: 3, available: 1 },
    { resourceId: 'iron', required: 6, available: 2 },
    { resourceId: 'wood', required: 2, available: 0 },
  ]);
});
