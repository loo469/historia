import test from 'node:test';
import assert from 'node:assert/strict';

import { UpdateRegionalClimate } from '../../../src/application/climate/UpdateRegionalClimate.js';
import { ClimateState } from '../../../src/domain/climate/ClimateState.js';

test('UpdateRegionalClimate applies default and regional drift immutably', () => {
  const useCase = new UpdateRegionalClimate();
  const regionalStates = [
    new ClimateState({
      regionId: 'north-coast',
      season: 'spring',
      temperatureC: 12,
      precipitationLevel: 66,
      droughtIndex: 18,
    }),
    new ClimateState({
      regionId: 'sunreach',
      season: 'spring',
      temperatureC: 23,
      precipitationLevel: 28,
      droughtIndex: 44,
      anomaly: 'heatwave',
    }),
  ];

  const result = useCase.execute({
    regionalStates,
    nextSeason: 'summer',
    defaultShift: {
      temperatureDelta: 2,
      precipitationDelta: -4,
      droughtDelta: 6,
    },
    shiftsByRegionId: {
      'north-coast': {
        temperatureDelta: -1,
        precipitationDelta: 6,
      },
      sunreach: {
        temperatureDelta: 3,
        droughtDelta: 8,
      },
    },
  });

  assert.equal(result.appliedShiftCount, 2);
  assert.deepEqual(result.progressionByRegion, {
    'north-coast': {
      regionId: 'north-coast',
      seasonChanged: true,
      temperatureDelta: 1,
      precipitationDelta: 2,
      droughtDelta: 6,
      summary: 'spring → summer, temp +1°C, précip +2, sécheresse +6',
    },
    sunreach: {
      regionId: 'sunreach',
      seasonChanged: true,
      temperatureDelta: 5,
      precipitationDelta: -4,
      droughtDelta: 14,
      summary: 'spring → summer, temp +5°C, précip -4, sécheresse +14',
    },
  });
  assert.deepEqual(
    result.updatedRegionalStates.map((state) => state.toJSON()),
    [
      {
        regionId: 'north-coast',
        season: 'summer',
        temperatureC: 13,
        precipitationLevel: 68,
        droughtIndex: 24,
        anomaly: null,
        activeCatastropheIds: [],
        updatedAt: result.updatedRegionalStates[0].updatedAt,
      },
      {
        regionId: 'sunreach',
        season: 'summer',
        temperatureC: 28,
        precipitationLevel: 24,
        droughtIndex: 58,
        anomaly: 'heatwave',
        activeCatastropheIds: [],
        updatedAt: result.updatedRegionalStates[1].updatedAt,
      },
    ],
  );

  assert.equal(regionalStates[0].season, 'spring');
  assert.equal(regionalStates[1].temperatureC, 23);
});

test('UpdateRegionalClimate clamps precipitation and drought indicators', () => {
  const useCase = new UpdateRegionalClimate();

  const result = useCase.execute({
    regionalStates: [
      {
        regionId: 'frostmarch',
        season: 'winter',
        temperatureC: -12,
        precipitationLevel: 2,
        droughtIndex: 99,
      },
    ],
    defaultShift: {
      precipitationDelta: -10,
      droughtDelta: 5,
    },
  });

  assert.equal(result.updatedRegionalStates[0].precipitationLevel, 0);
  assert.equal(result.updatedRegionalStates[0].droughtIndex, 100);
  assert.equal(result.updatedRegionalStates[0].season, 'winter');
  assert.deepEqual(result.progressionByRegion.frostmarch, {
    regionId: 'frostmarch',
    seasonChanged: false,
    temperatureDelta: 0,
    precipitationDelta: -2,
    droughtDelta: 1,
    summary: 'temp +0°C, précip -2, sécheresse +1',
  });
});

test('UpdateRegionalClimate supports season rollover while preserving active climate events', () => {
  const useCase = new UpdateRegionalClimate();

  const result = useCase.execute({
    regionalStates: [
      {
        regionId: 'ember-steppe',
        season: 'winter',
        temperatureC: 3,
        precipitationLevel: 35,
        droughtIndex: 41,
        anomaly: 'ashfall',
        activeCatastropheIds: ['locusts'],
        updatedAt: '2026-04-18T00:00:00.000Z',
      },
    ],
    nextSeason: 'spring',
    defaultShift: {
      temperatureDelta: 6,
      precipitationDelta: 12,
      droughtDelta: -9,
    },
  });

  assert.deepEqual(result.updatedRegionalStates[0].toJSON(), {
    regionId: 'ember-steppe',
    season: 'spring',
    temperatureC: 9,
    precipitationLevel: 47,
    droughtIndex: 32,
    anomaly: 'ashfall',
    activeCatastropheIds: ['locusts'],
    updatedAt: result.updatedRegionalStates[0].updatedAt,
  });
});

test('UpdateRegionalClimate rejects invalid regional state collections', () => {
  const useCase = new UpdateRegionalClimate();

  assert.throws(
    () => useCase.execute({ regionalStates: null }),
    /regionalStates must be an array/,
  );
});
