import test from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryWarEventBus } from '../../../src/adapters/war/InMemoryWarEventBus.js';
import { WarEventBusPort } from '../../../src/application/war/WarEventBusPort.js';

test('InMemoryWarEventBus extends the port and records normalized front change events', async () => {
  const eventBus = new InMemoryWarEventBus();

  const event = await eventBus.publishFrontChange('front.collapsed', {
    frontId: 'front-south',
    changeType: 'collapsed',
    attackerFactionId: 'faction-a',
    defenderFactionId: 'faction-b',
    pressureDelta: -18,
  });

  assert.equal(eventBus instanceof WarEventBusPort, true);
  assert.deepEqual(event, {
    eventName: 'front.collapsed',
    payload: {
      frontId: 'front-south',
      changeType: 'collapsed',
      attackerFactionId: 'faction-a',
      defenderFactionId: 'faction-b',
      pressureDelta: -18,
    },
  });
  assert.deepEqual(eventBus.snapshot(), [event]);
});

test('InMemoryWarEventBus seeds historical events and keeps insertion order', async () => {
  const eventBus = new InMemoryWarEventBus([
    {
      eventName: 'front.created',
      payload: {
        frontId: 'front-east',
        changeType: 'created',
        attackerFactionId: 'faction-c',
        defenderFactionId: 'faction-d',
        pressureDelta: 9,
      },
    },
  ]);

  await eventBus.publishFrontChange('front.updated', {
    frontId: 'front-east',
    changeType: 'pressure-spike',
    attackerFactionId: 'faction-c',
    defenderFactionId: 'faction-d',
    pressureDelta: 4,
  });

  assert.deepEqual(eventBus.snapshot(), [
    {
      eventName: 'front.created',
      payload: {
        frontId: 'front-east',
        changeType: 'created',
        attackerFactionId: 'faction-c',
        defenderFactionId: 'faction-d',
        pressureDelta: 9,
      },
    },
    {
      eventName: 'front.updated',
      payload: {
        frontId: 'front-east',
        changeType: 'pressure-spike',
        attackerFactionId: 'faction-c',
        defenderFactionId: 'faction-d',
        pressureDelta: 4,
      },
    },
  ]);
});

test('InMemoryWarEventBus rejects invalid seed payloads', () => {
  assert.throws(() => new InMemoryWarEventBus(null), /events must be an array/);
  assert.throws(() => new InMemoryWarEventBus([null]), /event must be an object/);
  assert.throws(() => new InMemoryWarEventBus([{ eventName: 'front.created', payload: null }]), /payload must be an object/);
});
