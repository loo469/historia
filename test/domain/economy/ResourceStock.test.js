import test from 'node:test';
import assert from 'node:assert/strict';

import { ResourceStock } from '../../../src/domain/economy/ResourceStock.js';

test('ResourceStock normalizes and exposes resource quantities', () => {
  const stock = new ResourceStock({
    ' grain ': 120,
    wood: 45,
    stone: 0,
  });

  assert.deepEqual(stock.toJSON(), {
    grain: 120,
    stone: 0,
    wood: 45,
  });
  assert.equal(stock.get('grain'), 120);
  assert.equal(stock.get('iron'), 0);
  assert.equal(stock.totalQuantity, 165);
  assert.equal(stock.has('wood', 40), true);
  assert.equal(stock.has('wood', 46), false);
});

test('ResourceStock supports immutable updates and merging', () => {
  const stock = new ResourceStock({ grain: 120, wood: 45 });

  const replenished = stock.add('grain', 30);
  const consumed = replenished.subtract('wood', 20);
  const merged = consumed.merge({ stone: 10, wood: 5 });

  assert.notEqual(replenished, stock);
  assert.notEqual(consumed, replenished);
  assert.notEqual(merged, consumed);

  assert.deepEqual(stock.toJSON(), { grain: 120, wood: 45 });
  assert.deepEqual(replenished.toJSON(), { grain: 150, wood: 45 });
  assert.deepEqual(consumed.toJSON(), { grain: 150, wood: 25 });
  assert.deepEqual(merged.toJSON(), { grain: 150, stone: 10, wood: 30 });
});

test('ResourceStock rejects invalid resource ids and quantities', () => {
  assert.throws(() => new ResourceStock(null), /ResourceStock entries must be an object/);

  assert.throws(
    () => new ResourceStock({ ' ': 1 }),
    /ResourceStock cannot contain an empty resource id/,
  );

  assert.throws(
    () => new ResourceStock({ grain: -1 }),
    /ResourceStock quantities must be integers greater than or equal to 0/,
  );

  const stock = new ResourceStock({ grain: 5 });

  assert.throws(
    () => stock.subtract('grain', 6),
    /ResourceStock cannot subtract more than the available quantity/,
  );
});
