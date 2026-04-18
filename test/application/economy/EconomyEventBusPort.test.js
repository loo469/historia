import test from 'node:test';
import assert from 'node:assert/strict';

import { EconomyEventBusPort } from '../../../src/application/economy/EconomyEventBusPort.js';

class RecordedEconomyEventBus extends EconomyEventBusPort {
  constructor() {
    super();
    this.events = [];
  }

  async publish(eventName, payload) {
    const event = { eventName, payload };
    this.events.push(event);
    return event;
  }
}

test('EconomyEventBusPort normalizes shortage events before delegation', async () => {
  const eventBus = new RecordedEconomyEventBus();

  const event = await eventBus.publishShortage({
    cityId: ' city-harbor ',
    resourceId: ' grain ',
    shortageQuantity: 4,
    requiredQuantity: 10,
    availableQuantity: 6,
    cause: ' food-crisis ',
    note: 'ignored',
  });

  assert.deepEqual(event, {
    eventName: 'economy.shortage.detected',
    payload: {
      cityId: 'city-harbor',
      resourceId: 'grain',
      shortageQuantity: 4,
      requiredQuantity: 10,
      availableQuantity: 6,
      cause: 'food-crisis',
    },
  });
});

test('EconomyEventBusPort base publish method fails fast until implemented', async () => {
  const eventBus = new EconomyEventBusPort();

  await assert.rejects(
    () => eventBus.publish('economy.shortage.detected', { cityId: 'city-harbor' }),
    /must be implemented by an adapter/,
  );
});

test('EconomyEventBusPort normalizes surplus events before delegation', async () => {
  const eventBus = new RecordedEconomyEventBus();

  const event = await eventBus.publishSurplus({
    cityId: ' city-harbor ',
    resourceId: ' grain ',
    surplusQuantity: 9,
    availableQuantity: 14,
    desiredQuantity: 5,
    cause: ' export-ready ',
  });

  assert.deepEqual(event, {
    eventName: 'economy.surplus.detected',
    payload: {
      cityId: 'city-harbor',
      resourceId: 'grain',
      surplusQuantity: 9,
      availableQuantity: 14,
      desiredQuantity: 5,
      cause: 'export-ready',
    },
  });
});

test('EconomyEventBusPort rejects invalid shortage and surplus payloads', async () => {
  const eventBus = new RecordedEconomyEventBus();

  await assert.rejects(() => eventBus.publishShortage(null), /payload must be an object/);
  await assert.rejects(() => eventBus.publishShortage({ resourceId: 'grain', shortageQuantity: 1 }), /cityId is required/);
  await assert.rejects(() => eventBus.publishShortage({ cityId: 'city-harbor', shortageQuantity: 1 }), /resourceId is required/);
  await assert.rejects(
    () => eventBus.publishShortage({ cityId: 'city-harbor', resourceId: 'grain', shortageQuantity: 0 }),
    /shortageQuantity must be an integer between 1 and/,
  );

  await assert.rejects(() => eventBus.publishSurplus(null), /payload must be an object/);
  await assert.rejects(() => eventBus.publishSurplus({ resourceId: 'grain', surplusQuantity: 1 }), /cityId is required/);
  await assert.rejects(
    () => eventBus.publishSurplus({ cityId: 'city-harbor', resourceId: 'grain', surplusQuantity: 0 }),
    /surplusQuantity must be an integer between 1 and/,
  );
});
