import test from 'node:test';
import assert from 'node:assert/strict';

import { produceResources } from '../../../src/application/economy/produceResources.js';

test('produceResources executes active rules in priority order and updates city stock', () => {
  const city = {
    id: 'city-harbor',
    workforce: 20,
    stockByResource: {
      grain: 10,
      wood: 4,
    },
  };

  const result = produceResources(
    city,
    [
      {
        id: 'rule-mill',
        cityId: 'city-harbor',
        resourceId: 'flour',
        laborRequired: 8,
        baseYield: 12,
        priority: 60,
        inputByResource: { grain: 5 },
        seasonModifiers: { autumn: 25 },
        active: true,
      },
      {
        id: 'rule-sawmill',
        cityId: 'city-harbor',
        resourceId: 'planks',
        laborRequired: 6,
        baseYield: 6,
        priority: 80,
        inputByResource: { wood: 2 },
        active: true,
      },
    ],
    { season: 'autumn' },
  );

  assert.deepEqual(result.city.stockByResource, {
    grain: 5,
    wood: 2,
    planks: 6,
    flour: 15,
  });
  assert.deepEqual(result.producedByResource, {
    planks: 6,
    flour: 15,
  });
  assert.deepEqual(result.executedRules.map((entry) => entry.ruleId), ['rule-sawmill', 'rule-mill']);
  assert.equal(result.workforceUsed, 14);
  assert.equal(result.workforceRemaining, 6);
  assert.deepEqual(city.stockByResource, { grain: 10, wood: 4 });
});

test('produceResources skips rules when workforce or inputs are missing', () => {
  const result = produceResources(
    {
      id: 'city-steppe',
      workforce: 5,
      stockByResource: {
        grain: 1,
      },
    },
    [
      {
        id: 'rule-bakery',
        cityId: 'city-steppe',
        resourceId: 'bread',
        laborRequired: 4,
        baseYield: 4,
        inputByResource: { grain: 2 },
        priority: 70,
      },
      {
        id: 'rule-stonemason',
        cityId: 'city-steppe',
        resourceId: 'brick',
        laborRequired: 8,
        baseYield: 3,
        priority: 60,
      },
      {
        id: 'rule-idle',
        cityId: 'city-steppe',
        resourceId: 'cloth',
        laborRequired: 1,
        baseYield: 2,
        active: false,
        priority: 50,
      },
    ],
  );

  assert.deepEqual(result.executedRules, []);
  assert.deepEqual(result.skippedRules, [
    { ruleId: 'rule-bakery', reason: 'missing-inputs' },
    { ruleId: 'rule-stonemason', reason: 'insufficient-workforce' },
    { ruleId: 'rule-idle', reason: 'inactive' },
  ]);
  assert.equal(result.workforceUsed, 0);
  assert.equal(result.workforceRemaining, 5);
  assert.deepEqual(result.city.stockByResource, { grain: 1 });
});

test('produceResources applies negative seasonal modifiers without dropping below zero', () => {
  const result = produceResources(
    {
      id: 'city-north',
      workforce: 10,
      stockByResource: {},
    },
    [
      {
        id: 'rule-herbs',
        cityId: 'city-north',
        resourceId: 'herbs',
        laborRequired: 2,
        baseYield: 3,
        seasonModifiers: { winter: -80 },
      },
    ],
    { season: 'winter' },
  );

  assert.equal(result.city.stockByResource.herbs, 0);
  assert.deepEqual(result.producedByResource, { herbs: 0 });
});

test('produceResources rejects invalid city, rule, and context data', () => {
  assert.throws(
    () => produceResources(null, []),
    /produceResources city must be an object/,
  );

  assert.throws(
    () => produceResources({ id: 'city-a', workforce: 3, stockByResource: {} }, {}),
    /produceResources productionRules must be an array/,
  );

  assert.throws(
    () => produceResources(
      { id: 'city-a', workforce: 3, stockByResource: {} },
      [{ id: 'rule-a', cityId: 'city-b', resourceId: 'grain', laborRequired: 1, baseYield: 2 }],
    ),
    /produceResources productionRules\[0\]\.cityId must match city city-a/,
  );

  assert.throws(
    () => produceResources(
      { id: 'city-a', workforce: 3, stockByResource: {} },
      [{ id: 'rule-a', cityId: 'city-a', resourceId: 'grain', laborRequired: 1, baseYield: 2 }],
      { season: '' },
    ),
    /produceResources context.season is required/,
  );
});
