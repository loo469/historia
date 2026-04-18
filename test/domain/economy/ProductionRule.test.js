import test from 'node:test';
import assert from 'node:assert/strict';

import { ProductionRule } from '../../../src/domain/economy/ProductionRule.js';

test('ProductionRule normalizes production requirements and impacts', () => {
  const rule = new ProductionRule({
    id: ' rule-smokehouse ',
    name: ' Smokehouse ',
    workforceRequired: 25,
    inputByResource: {
      ' fish ': 30,
      wood: 5,
    },
    outputByResource: {
      ' smoked-fish ': 20,
    },
    requiredBuildingTags: [' artisan ', 'food', 'artisan'],
    requiredCityTags: [' coastal ', 'market', 'coastal'],
    prosperityImpact: 4,
    stabilityImpact: 2,
    enabled: 1,
  });

  assert.deepEqual(rule.toJSON(), {
    id: 'rule-smokehouse',
    name: 'Smokehouse',
    workforceRequired: 25,
    inputByResource: { fish: 30, wood: 5 },
    outputByResource: { 'smoked-fish': 20 },
    requiredBuildingTags: ['artisan', 'food'],
    requiredCityTags: ['coastal', 'market'],
    prosperityImpact: 4,
    stabilityImpact: 2,
    enabled: true,
  });

  assert.equal(rule.isTransformative, true);
});

test('ProductionRule can evaluate runtime conditions immutably', () => {
  const rule = new ProductionRule({
    id: 'rule-quarry',
    name: 'Quarry',
    workforceRequired: 40,
    outputByResource: {
      stone: 60,
    },
    requiredBuildingTags: ['industry'],
    requiredCityTags: ['hills'],
  });

  assert.equal(
    rule.canRun({ workforceAvailable: 45, buildingTags: ['industry'], cityTags: ['hills', 'fortified'] }),
    true,
  );
  assert.equal(
    rule.canRun({ workforceAvailable: 39, buildingTags: ['industry'], cityTags: ['hills'] }),
    false,
  );
  assert.equal(rule.withEnabled(false).canRun({ workforceAvailable: 60, buildingTags: ['industry'], cityTags: ['hills'] }), false);
});

test('ProductionRule rejects invalid fields and ranges', () => {
  assert.throws(
    () => new ProductionRule({ id: '', name: 'Quarry', workforceRequired: 10, outputByResource: { stone: 5 } }),
    /ProductionRule id is required/,
  );

  assert.throws(
    () => new ProductionRule({ id: 'rule', name: 'Quarry', workforceRequired: -1, outputByResource: { stone: 5 } }),
    /ProductionRule workforceRequired must be an integer between 0 and/,
  );

  assert.throws(
    () => new ProductionRule({ id: 'rule', name: 'Quarry', workforceRequired: 10, outputByResource: { ' ': 5 } }),
    /ProductionRule outputByResource cannot contain an empty resource id/,
  );

  assert.throws(
    () => new ProductionRule({ id: 'rule', name: 'Quarry', workforceRequired: 10, outputByResource: { stone: 5 }, prosperityImpact: 101 }),
    /ProductionRule prosperityImpact must be an integer between -100 and 100/,
  );
});
