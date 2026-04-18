import test from 'node:test';
import assert from 'node:assert/strict';

import { SupplyLevel, SUPPLY_LEVELS } from '../../../src/domain/war/SupplyLevel.js';

test('SupplyLevel exposes the ordered supply state machine', () => {
  assert.deepEqual(SupplyLevel.states(), [
    SUPPLY_LEVELS.SECURE,
    SUPPLY_LEVELS.STABLE,
    SUPPLY_LEVELS.STRAINED,
    SUPPLY_LEVELS.DISRUPTED,
    SUPPLY_LEVELS.COLLAPSED,
  ]);

  assert.equal(SupplyLevel.normalize(' Stable '), SUPPLY_LEVELS.STABLE);
  assert.equal(SupplyLevel.isValid('collapsed'), true);
  assert.equal(SupplyLevel.isValid('unknown'), false);
});

test('SupplyLevel can compare, degrade, and improve supply pressure', () => {
  assert.equal(SupplyLevel.compare('secure', 'stable') > 0, true);
  assert.equal(SupplyLevel.compare('collapsed', 'disrupted') < 0, true);
  assert.equal(SupplyLevel.degrade('secure'), SUPPLY_LEVELS.STABLE);
  assert.equal(SupplyLevel.degrade('collapsed'), SUPPLY_LEVELS.COLLAPSED);
  assert.equal(SupplyLevel.improve('disrupted'), SUPPLY_LEVELS.STRAINED);
  assert.equal(SupplyLevel.improve('secure'), SUPPLY_LEVELS.SECURE);
});

test('SupplyLevel rejects invalid states', () => {
  assert.throws(() => SupplyLevel.normalize(''), /SupplyLevel must be one of/);
  assert.throws(() => SupplyLevel.compare('stable', 'broken'), /SupplyLevel must be one of/);
});
