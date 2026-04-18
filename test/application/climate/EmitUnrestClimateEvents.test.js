import test from 'node:test';
import assert from 'node:assert/strict';

import { ClimateEventBusPort } from '../../../src/application/climate/ClimateEventBusPort.js';
import { emitUnrestClimateEvents } from '../../../src/application/climate/EmitUnrestClimateEvents.js';
import { ClimateState } from '../../../src/domain/climate/ClimateState.js';

class RecordedClimateEventBus extends ClimateEventBusPort {
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

test('EmitUnrestClimateEvents publishes one normalized event for a non-zero unrest impact', async () => {
  const eventBus = new RecordedClimateEventBus();

  const events = await emitUnrestClimateEvents({
    eventBus,
    climateState: new ClimateState({
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: 31,
      precipitationLevel: 9,
      droughtIndex: 71,
      anomaly: 'heatwave',
    }),
    unrestDelta: 18,
    severity: 'high',
    cause: 'harvest-failure',
  });

  assert.deepEqual(events, [
    {
      eventName: 'climate.unrest-impact.detected',
      payload: {
        regionId: 'sunreach',
        season: 'summer',
        unrestDelta: 18,
        droughtIndex: 71,
        precipitationLevel: 9,
        anomaly: 'heatwave',
        severity: 'high',
        cause: 'harvest-failure',
      },
    },
  ]);
});

test('EmitUnrestClimateEvents accepts plain climate payloads and skips zero-impact events', async () => {
  const eventBus = new RecordedClimateEventBus();

  const events = await emitUnrestClimateEvents({
    eventBus,
    climateState: {
      regionId: 'riverlands',
      season: 'autumn',
      temperatureC: 14,
      precipitationLevel: 74,
      droughtIndex: 12,
    },
    unrestDelta: 0,
  });

  assert.deepEqual(events, []);
  assert.deepEqual(eventBus.events, []);
});

test('EmitUnrestClimateEvents rejects invalid event buses, climates, and unrest payloads', async () => {
  const climateState = {
    regionId: 'north-coast',
    season: 'summer',
    temperatureC: 29,
    precipitationLevel: 18,
    droughtIndex: 62,
  };

  await assert.rejects(
    () => emitUnrestClimateEvents({ eventBus: {}, climateState, unrestDelta: 10 }),
    /eventBus must expose publishUnrestImpact/,
  );

  await assert.rejects(
    () => emitUnrestClimateEvents({ eventBus: new RecordedClimateEventBus(), climateState: null, unrestDelta: 10 }),
    /climateState must be a ClimateState or plain object/,
  );

  await assert.rejects(
    () => emitUnrestClimateEvents({ eventBus: new RecordedClimateEventBus(), climateState, unrestDelta: 101 }),
    /unrestDelta must be an integer between -100 and 100/,
  );

  await assert.rejects(
    () => emitUnrestClimateEvents({ eventBus: new RecordedClimateEventBus(), climateState, unrestDelta: 10, severity: ' ' }),
    /severity is required/,
  );

  await assert.rejects(
    () => emitUnrestClimateEvents({ eventBus: new RecordedClimateEventBus(), climateState, unrestDelta: 10, cause: ' ' }),
    /cause is required/,
  );
});
