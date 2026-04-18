import test from 'node:test';
import assert from 'node:assert/strict';

import { EconomyEventBusPort } from '../../../src/application/economy/EconomyEventBusPort.js';
import { emitShortageEvents } from '../../../src/application/economy/EmitShortageEvents.js';

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

test('EmitShortageEvents publishes one normalized event per shortage', async () => {
  const eventBus = new RecordedEconomyEventBus();

  const events = await emitShortageEvents({
    eventBus,
    city: { id: ' city-harbor ' },
    shortagesByResource: {
      grain: 4,
      fish: 2,
    },
    requiredByResource: {
      grain: 10,
      fish: 5,
    },
    availableByResource: {
      grain: 6,
      fish: 3,
    },
    cause: 'civil-unrest',
  });

  assert.deepEqual(events, [
    {
      eventName: 'economy.shortage.detected',
      payload: {
        cityId: 'city-harbor',
        resourceId: 'fish',
        shortageQuantity: 2,
        requiredQuantity: 5,
        availableQuantity: 3,
        cause: 'civil-unrest',
      },
    },
    {
      eventName: 'economy.shortage.detected',
      payload: {
        cityId: 'city-harbor',
        resourceId: 'grain',
        shortageQuantity: 4,
        requiredQuantity: 10,
        availableQuantity: 6,
        cause: 'civil-unrest',
      },
    },
  ]);
});

test('EmitShortageEvents skips empty shortage maps', async () => {
  const eventBus = new RecordedEconomyEventBus();

  const events = await emitShortageEvents({
    eventBus,
    city: { id: 'city-harbor' },
    shortagesByResource: {},
  });

  assert.deepEqual(events, []);
  assert.deepEqual(eventBus.events, []);
});

test('EmitShortageEvents rejects invalid event buses, cities, and resource maps', async () => {
  await assert.rejects(
    () => emitShortageEvents({ eventBus: {}, city: { id: 'city-harbor' }, shortagesByResource: {} }),
    /eventBus must expose publishShortage/,
  );

  await assert.rejects(
    () => emitShortageEvents({ eventBus: new RecordedEconomyEventBus(), city: {}, shortagesByResource: {} }),
    /city.id is required/,
  );

  await assert.rejects(
    () => emitShortageEvents({ eventBus: new RecordedEconomyEventBus(), city: { id: 'city-harbor' }, shortagesByResource: { grain: -1 } }),
    /shortagesByResource quantities must be integers greater than or equal to 0/,
  );
});
