import test from 'node:test';
import assert from 'node:assert/strict';

import { ClimateEventBusPort } from '../../../src/application/climate/ClimateEventBusPort.js';

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

test('ClimateEventBusPort normalizes harvest impact events before delegation', async () => {
  const eventBus = new RecordedClimateEventBus();

  const event = await eventBus.publishHarvestImpact({
    regionId: ' north-coast ',
    season: ' summer ',
    resourceId: ' grain ',
    impactLevel: -24,
    droughtIndex: 62,
    precipitationLevel: 18,
    anomaly: ' heatwave ',
    cause: ' seasonal-drought ',
  });

  assert.deepEqual(event, {
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
  });
});

test('ClimateEventBusPort normalizes unrest impact events before delegation', async () => {
  const eventBus = new RecordedClimateEventBus();

  const event = await eventBus.publishUnrestImpact({
    regionId: ' sunreach ',
    season: ' summer ',
    unrestDelta: 18,
    droughtIndex: 71,
    precipitationLevel: 9,
    anomaly: ' heatwave ',
    severity: ' high ',
    cause: ' harvest-failure ',
  });

  assert.deepEqual(event, {
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
  });
});

test('ClimateEventBusPort base publish method fails fast until implemented', async () => {
  const eventBus = new ClimateEventBusPort();

  await assert.rejects(
    () => eventBus.publishHarvestImpact({
      regionId: 'north-coast',
      season: 'summer',
      resourceId: 'grain',
      impactLevel: -10,
      droughtIndex: 40,
      precipitationLevel: 30,
    }),
    /publish must be implemented/,
  );

  await assert.rejects(
    () => eventBus.publishUnrestImpact({
      regionId: 'north-coast',
      season: 'summer',
      unrestDelta: 12,
      droughtIndex: 40,
      precipitationLevel: 30,
    }),
    /publish must be implemented/,
  );
});

test('ClimateEventBusPort rejects invalid climate impact payloads', async () => {
  const eventBus = new RecordedClimateEventBus();

  await assert.rejects(
    () => eventBus.publishHarvestImpact(null),
    /payload must be an object/,
  );

  await assert.rejects(
    () => eventBus.publishHarvestImpact({
      regionId: 'north-coast',
      season: 'summer',
      resourceId: 'grain',
      impactLevel: -101,
      droughtIndex: 40,
      precipitationLevel: 30,
    }),
    /impactLevel must be an integer between -100 and 100/,
  );

  await assert.rejects(
    () => eventBus.publishUnrestImpact({
      regionId: 'north-coast',
      season: 'summer',
      unrestDelta: 101,
      droughtIndex: 40,
      precipitationLevel: 30,
    }),
    /unrestDelta must be an integer between -100 and 100/,
  );
});
