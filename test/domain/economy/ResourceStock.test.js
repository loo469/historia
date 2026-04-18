import test from 'node:test';
import assert from 'node:assert/strict';

import { ResourceStock } from '../../../src/domain/economy/ResourceStock.js';

test('ResourceStock keeps normalized stock fields and exposes derived values', () => {
  const stock = new ResourceStock({
    resourceId: ' grain ',
    quantity: 120,
    capacity: 300,
    reserved: 25,
    reorderPoint: 40,
    spoilageRisk: 12,
  });

  assert.deepEqual(stock.toJSON(), {
    resourceId: 'grain',
    quantity: 120,
    capacity: 300,
    reserved: 25,
    reorderPoint: 40,
    spoilageRisk: 12,
  });
  assert.equal(stock.availableQuantity, 95);
  assert.equal(stock.isScarce, false);
  assert.equal(stock.fillRatio, 120 / 300);
});

test('ResourceStock supports immutable quantity, reservation, and capacity updates', () => {
  const stock = new ResourceStock({
    resourceId: 'wood',
    quantity: 80,
    capacity: 100,
    reserved: 20,
    reorderPoint: 30,
  });

  const reducedStock = stock.withQuantity(10);
  const reservedStock = reducedStock.withReservation(5);
  const resizedStock = reservedStock.withCapacity(8);

  assert.notEqual(reducedStock, stock);
  assert.notEqual(reservedStock, reducedStock);
  assert.notEqual(resizedStock, reservedStock);
  assert.equal(reducedStock.quantity, 10);
  assert.equal(reducedStock.reserved, 10);
  assert.equal(reservedStock.availableQuantity, 5);
  assert.equal(resizedStock.capacity, 8);
  assert.equal(resizedStock.quantity, 8);
  assert.equal(resizedStock.reserved, 5);
  assert.equal(resizedStock.reorderPoint, 8);
  assert.equal(stock.quantity, 80);
  assert.equal(stock.reserved, 20);
  assert.equal(stock.capacity, 100);
});

test('ResourceStock reports scarcity and handles zero-capacity ratios safely', () => {
  const scarceStock = new ResourceStock({
    resourceId: 'salt',
    quantity: 0,
    capacity: 0,
    reorderPoint: 0,
  });

  assert.equal(scarceStock.isScarce, true);
  assert.equal(scarceStock.fillRatio, 0);
  assert.equal(scarceStock.availableQuantity, 0);
});

test('ResourceStock rejects invalid identifiers and stock invariants', () => {
  assert.throws(
    () => new ResourceStock({ resourceId: '', quantity: 1, capacity: 10 }),
    /ResourceStock resourceId is required/,
  );

  assert.throws(
    () => new ResourceStock({ resourceId: 'grain', quantity: 11, capacity: 10 }),
    /ResourceStock quantity must be an integer between 0 and 10/,
  );

  assert.throws(
    () => new ResourceStock({ resourceId: 'grain', quantity: 10, capacity: 10, reserved: 11 }),
    /ResourceStock reserved must be an integer between 0 and 10/,
  );

  assert.throws(
    () => new ResourceStock({ resourceId: 'grain', quantity: 10, capacity: 10, spoilageRisk: 101 }),
    /ResourceStock spoilageRisk must be an integer between 0 and 100/,
  );
});
