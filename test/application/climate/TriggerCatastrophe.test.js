import test from 'node:test';
import assert from 'node:assert/strict';

import { TriggerCatastrophe } from '../../../src/application/climate/TriggerCatastrophe.js';
import { ClimateState } from '../../../src/domain/climate/ClimateState.js';

test('TriggerCatastrophe creates drought catastrophes for endangered regions', () => {
  const useCase = new TriggerCatastrophe();
  const regionalStates = [
    new ClimateState({
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: 37,
      precipitationLevel: 10,
      droughtIndex: 88,
      anomaly: 'heatwave',
    }),
    new ClimateState({
      regionId: 'north-coast',
      season: 'summer',
      temperatureC: 22,
      precipitationLevel: 44,
      droughtIndex: 24,
    }),
  ];

  const result = useCase.execute({
    regionalStates,
    triggeredAt: '2026-04-18T13:30:00.000Z',
  });

  assert.equal(result.triggeredCount, 1);
  assert.equal(result.catastrophes[0].type, 'drought');
  assert.equal(result.catastrophes[0].status, 'active');
  assert.deepEqual(result.catastrophes[0].regionIds, ['sunreach']);
  assert.match(result.catastrophes[0].id, /^sunreach-drought-summer$/);
  assert.deepEqual(result.updatedRegionalStates[0].activeCatastropheIds, ['sunreach-drought-summer']);
  assert.deepEqual(result.updatedRegionalStates[1].activeCatastropheIds, []);
  assert.equal(regionalStates[0].activeCatastropheIds.length, 0);
});

test('TriggerCatastrophe can create flood catastrophes and skips already active regions', () => {
  const useCase = new TriggerCatastrophe();

  const result = useCase.execute({
    regionalStates: [
      {
        regionId: 'riverlands',
        season: 'winter',
        temperatureC: 18,
        precipitationLevel: 96,
        droughtIndex: 10,
      },
      {
        regionId: 'ash-plains',
        season: 'summer',
        temperatureC: 39,
        precipitationLevel: 8,
        droughtIndex: 91,
        activeCatastropheIds: ['ash-plains-drought-summer'],
      },
    ],
    triggeredAt: '2026-04-18T14:00:00.000Z',
  });

  assert.equal(result.triggeredCount, 1);
  assert.equal(result.catastrophes[0].type, 'flood');
  assert.equal(result.updatedRegionalStates[1].activeCatastropheIds[0], 'ash-plains-drought-summer');
});

test('TriggerCatastrophe rejects invalid collections', () => {
  const useCase = new TriggerCatastrophe();

  assert.throws(
    () => useCase.execute({ regionalStates: null }),
    /regionalStates must be an array/,
  );
});
