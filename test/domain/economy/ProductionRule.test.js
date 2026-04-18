import test from 'node:test';
import assert from 'node:assert/strict';

import { ProductionRule } from '../../../src/domain/economy/ProductionRule.js';

test('ProductionRule keeps a normalized production definition', () => {
  const rule = new ProductionRule({
    id: ' rule-granary ',
    cityId: ' city-001 ',
    resourceId: ' grain ',
    buildingType: ' granary ',
    laborRequired: 30,
    baseYield: 90,
    inputByResource: {
      water: 5,
      ' seed ': 10,
    },
    seasonModifiers: {
      winter: -20,
      ' autumn ': 15,
    },
    tags: [' staple ', 'food', 'staple'],
    active: 1,
    priority: 70,
  });

  assert.deepEqual(rule.toJSON(), {
    id: 'rule-granary',
    cityId: 'city-001',
    resourceId: 'grain',
    buildingType: 'granary',
    laborRequired: 30,
    baseYield: 90,
    inputByResource: {
      seed: 10,
      water: 5,
    },
    seasonModifiers: {
      autumn: 15,
      winter: -20,
    },
    tags: ['food', 'staple'],
    active: true,
    priority: 70,
  });

  assert.equal(rule.totalInputRequired, 15);
  assert.equal(rule.netBaseYield, 75);
  assert.equal(rule.hasInputs, true);
  assert.equal(rule.bestSeason, 'autumn');
});

test('ProductionRule supports immutable priority, activation, and season updates', () => {
  const rule = new ProductionRule({
    id: 'rule-lumberyard',
    cityId: 'city-forest',
    resourceId: 'wood',
    buildingType: 'lumberyard',
    laborRequired: 18,
    baseYield: 40,
  });

  const prioritizedRule = rule.withPriority(85);
  const pausedRule = prioritizedRule.withActive(false);
  const seasonalRule = pausedRule.withSeasonModifier('spring', 12);

  assert.notEqual(prioritizedRule, rule);
  assert.notEqual(pausedRule, prioritizedRule);
  assert.notEqual(seasonalRule, pausedRule);
  assert.equal(prioritizedRule.priority, 85);
  assert.equal(pausedRule.active, false);
  assert.deepEqual(seasonalRule.seasonModifiers, { spring: 12 });
  assert.equal(rule.priority, 50);
  assert.equal(rule.active, true);
  assert.deepEqual(rule.seasonModifiers, {});
});

test('ProductionRule handles rules without inputs or seasonal modifiers', () => {
  const rule = new ProductionRule({
    id: 'rule-well',
    cityId: 'city-001',
    resourceId: 'water',
    buildingType: 'well',
    laborRequired: 8,
    baseYield: 12,
  });

  assert.equal(rule.totalInputRequired, 0);
  assert.equal(rule.netBaseYield, 12);
  assert.equal(rule.hasInputs, false);
  assert.equal(rule.bestSeason, null);
});

test('ProductionRule rejects invalid identifiers and economic invariants', () => {
  assert.throws(
    () => new ProductionRule({ id: '', cityId: 'city-001', resourceId: 'grain', buildingType: 'granary', laborRequired: 10, baseYield: 20 }),
    /ProductionRule id is required/,
  );

  assert.throws(
    () => new ProductionRule({ id: 'rule', cityId: 'city-001', resourceId: 'grain', buildingType: 'granary', laborRequired: -1, baseYield: 20 }),
    /ProductionRule laborRequired must be an integer between 0 and/,
  );

  assert.throws(
    () => new ProductionRule({ id: 'rule', cityId: 'city-001', resourceId: 'grain', buildingType: 'granary', laborRequired: 10, baseYield: 20, inputByResource: [] }),
    /ProductionRule inputByResource must be an object/,
  );

  assert.throws(
    () => new ProductionRule({ id: 'rule', cityId: 'city-001', resourceId: 'grain', buildingType: 'granary', laborRequired: 10, baseYield: 20, seasonModifiers: { winter: 101 } }),
    /ProductionRule season modifier for winter must be an integer between -100 and 100/,
  );
});
