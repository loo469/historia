import test from 'node:test';
import assert from 'node:assert/strict';

import { EconomyEventBusPort } from '../../../src/application/economy/EconomyEventBusPort.js';
import { emitSurplusEvents } from '../../../src/application/economy/EmitSurplusEvents.js';

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

test('EmitSurplusEvents publishes one normalized event per surplus', async () => {
  const eventBus = new RecordedEconomyEventBus();

  const events = await emitSurplusEvents({
    eventBus,
    city: { id: ' city-harbor ' },
    surplusesByResource: {
      fish: 7,
      grain: 4,
    },
    desiredByResource: {
      fish: 3,
      grain: 6,
    },
    availableByResource: {
      fish: 10,
      grain: 10,
    },
    cause: 'trade-window',
  });

  assert.deepEqual(events, [
    {
      eventName: 'economy.surplus.detected',
      payload: {
        cityId: 'city-harbor',
        resourceId: 'fish',
        surplusQuantity: 7,
        availableQuantity: 10,
        desiredQuantity: 3,
        cause: 'trade-window',
      },
    },
    {
      eventName: 'economy.surplus.detected',
      payload: {
        cityId: 'city-harbor',
        resourceId: 'grain',
        surplusQuantity: 4,
        availableQuantity: 10,
        desiredQuantity: 6,
        cause: 'trade-window',
      },
    },
  ]);
});

test('EmitSurplusEvents skips empty surplus maps', async () => {
  const eventBus = new RecordedEconomyEventBus();

  const events = await emitSurplusEvents({
    eventBus,
    city: { id: 'city-harbor' },
    surplusesByResource: {},
  });

  assert.deepEqual(events, []);
  assert.deepEqual(eventBus.events, []);
});

test('EmitSurplusEvents rejects invalid event buses, cities, and resource maps', async () => {
  await assert.rejects(
    () => emitSurplusEvents({ eventBus: {}, city: { id: 'city-harbor' }, surplusesByResource: {} }),
    /eventBus must expose publishSurplus/,
  );

  await assert.rejects(
    () => emitSurplusEvents({ eventBus: new RecordedEconomyEventBus(), city: {}, surplusesByResource: {} }),
    /city.id is required/,
  );

  await assert.rejects(
    () => emitSurplusEvents({ eventBus: new RecordedEconomyEventBus(), city: { id: 'city-harbor' }, surplusesByResource: { grain: -1 } }),
    /surplusesByResource quantities must be integers greater than or equal to 0/,
  );
});
