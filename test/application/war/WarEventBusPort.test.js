import test from 'node:test';
import assert from 'node:assert/strict';

import { WarEventBusPort } from '../../../src/application/war/WarEventBusPort.js';

class RecordedWarEventBus extends WarEventBusPort {
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

test('WarEventBusPort normalizes front change events before delegation', async () => {
  const eventBus = new RecordedWarEventBus();

  const event = await eventBus.publishFrontChange(' front.created ', {
    frontId: ' front-north ',
    changeType: ' pressure-spike ',
    attackerFactionId: ' faction-a ',
    defenderFactionId: ' faction-b ',
    pressureDelta: 12,
    note: 'breakthrough',
  });

  assert.deepEqual(event, {
    eventName: 'front.created',
    payload: {
      frontId: 'front-north',
      changeType: 'pressure-spike',
      attackerFactionId: 'faction-a',
      defenderFactionId: 'faction-b',
      pressureDelta: 12,
    },
  });
});

test('WarEventBusPort base method fails fast until implemented', async () => {
  const eventBus = new WarEventBusPort();

  await assert.rejects(
    () => eventBus.publish('front.created', { frontId: 'front-north' }),
    /must be implemented by an adapter/,
  );
});

test('WarEventBusPort rejects invalid front change payloads', async () => {
  const eventBus = new RecordedWarEventBus();

  await assert.rejects(() => eventBus.publishFrontChange('', {}), /eventName is required/);
  await assert.rejects(() => eventBus.publishFrontChange('front.created', null), /payload must be an object/);
  await assert.rejects(
    () => eventBus.publishFrontChange('front.created', { changeType: 'created', attackerFactionId: 'a', defenderFactionId: 'b', pressureDelta: 1 }),
    /frontId is required/,
  );
  await assert.rejects(
    () => eventBus.publishFrontChange('front.created', { frontId: 'front', attackerFactionId: 'a', defenderFactionId: 'b', pressureDelta: 1 }),
    /changeType is required/,
  );
  await assert.rejects(
    () => eventBus.publishFrontChange('front.created', { frontId: 'front', changeType: 'created', defenderFactionId: 'b', pressureDelta: 1 }),
    /attackerFactionId is required/,
  );
  await assert.rejects(
    () => eventBus.publishFrontChange('front.created', { frontId: 'front', changeType: 'created', attackerFactionId: 'a', pressureDelta: 1 }),
    /defenderFactionId is required/,
  );
  await assert.rejects(
    () => eventBus.publishFrontChange('front.created', { frontId: 'front', changeType: 'created', attackerFactionId: 'a', defenderFactionId: 'b', pressureDelta: 1.5 }),
    /pressureDelta must be an integer/,
  );
});
