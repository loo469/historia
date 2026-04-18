import test from 'node:test';
import assert from 'node:assert/strict';

import { ClimateEventBusPort } from '../../../src/application/climate/ClimateEventBusPort.js';
import { emitHarvestClimateEvents } from '../../../src/application/climate/EmitHarvestClimateEvents.js';
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

test('EmitHarvestClimateEvents publishes one normalized event per non-zero harvest impact', async () => {
  const eventBus = new RecordedClimateEventBus();

  const events = await emitHarvestClimateEvents({
    eventBus,
    climateState: new ClimateState({
      regionId: 'north-coast',
      season: 'summer',
      temperatureC: 29,
      precipitationLevel: 18,
      droughtIndex: 62,
      anomaly: 'heatwave',
    }),
    impactsByResource: {
      grain: -24,
      olives: -10,
      grapes: 0,
    },
    cause: 'seasonal-drought',
  });

  assert.deepEqual(events, [
    {
      eventName: 'climate.harvest-impact.detected',
      payload: {
        regionId: 'north-coast',
        season: 'summer',
        resourceId: 'grain',
        impactLevel: -24,
        droughtIndex: 62,
        precipitationLevel: 18,
        anomaly: 'heatwave',
        cause: 'seasonal-drought',
      },
    },
    {
      eventName: 'climate.harvest-impact.detected',
      payload: {
        regionId: 'north-coast',
        season: 'summer',
        resourceId: 'olives',
        impactLevel: -10,
        droughtIndex: 62,
        precipitationLevel: 18,
        anomaly: 'heatwave',
        cause: 'seasonal-drought',
      },
    },
  ]);
});

test('EmitHarvestClimateEvents accepts plain climate payloads and skips empty impacts', async () => {
  const eventBus = new RecordedClimateEventBus();

  const events = await emitHarvestClimateEvents({
    eventBus,
    climateState: {
      regionId: 'riverlands',
      season: 'autumn',
      temperatureC: 14,
      precipitationLevel: 74,
      droughtIndex: 12,
    },
    impactsByResource: {
      grain: 0,
    },
  });

  assert.deepEqual(events, []);
  assert.deepEqual(eventBus.events, []);
});

test('EmitHarvestClimateEvents rejects invalid event buses, climates, and impact maps', async () => {
  const climateState = {
    regionId: 'north-coast',
    season: 'summer',
    temperatureC: 29,
    precipitationLevel: 18,
    droughtIndex: 62,
  };

  await assert.rejects(
    () => emitHarvestClimateEvents({ eventBus: {}, climateState, impactsByResource: {} }),
    /eventBus must expose publishHarvestImpact/,
  );

  await assert.rejects(
    () => emitHarvestClimateEvents({ eventBus: new RecordedClimateEventBus(), climateState: null, impactsByResource: {} }),
    /climateState must be a ClimateState or plain object/,
  );

  await assert.rejects(
    () => emitHarvestClimateEvents({ eventBus: new RecordedClimateEventBus(), climateState, impactsByResource: { grain: -101 } }),
    /impact levels must be integers between -100 and 100/,
  );

  await assert.rejects(
    () => emitHarvestClimateEvents({ eventBus: new RecordedClimateEventBus(), climateState, impactsByResource: {}, cause: ' ' }),
    /cause is required/,
  );
});
