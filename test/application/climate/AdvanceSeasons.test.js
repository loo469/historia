import test from 'node:test';
import assert from 'node:assert/strict';

import { AdvanceSeasons } from '../../../src/application/climate/AdvanceSeasons.js';
import { ClimateState } from '../../../src/domain/climate/ClimateState.js';
import { SeasonCycle } from '../../../src/domain/climate/SeasonCycle.js';

test('AdvanceSeasons rolls the global cycle forward and updates each region season', () => {
  const useCase = new AdvanceSeasons();
  const seasonCycle = new SeasonCycle({
    currentSeason: 'spring',
    year: 4,
    dayOfSeason: 30,
    seasonLengthDays: 30,
  });
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
    }),
  ];

  const result = useCase.execute({ seasonCycle, regionalStates });

  assert.equal(result.previousCycle, seasonCycle);
  assert.equal(result.nextCycle.currentSeason, 'summer');
  assert.equal(result.nextCycle.year, 4);
  assert.deepEqual(
    result.updatedRegionalStates.map((state) => state.toJSON()),
    [
      {
        regionId: 'north-coast',
        season: 'summer',
        temperatureC: 18,
        precipitationLevel: 58,
        droughtIndex: 28,
        anomaly: null,
        activeCatastropheIds: [],
        updatedAt: result.updatedRegionalStates[0].updatedAt,
      },
      {
        regionId: 'sunreach',
        season: 'summer',
        temperatureC: 29,
        precipitationLevel: 20,
        droughtIndex: 54,
        anomaly: null,
        activeCatastropheIds: [],
        updatedAt: result.updatedRegionalStates[1].updatedAt,
      },
    ],
  );

  assert.equal(regionalStates[0].season, 'spring');
  assert.equal(regionalStates[1].temperatureC, 23);
});

test('AdvanceSeasons handles year rollover and clamps climate indicators', () => {
  const useCase = new AdvanceSeasons();

  const result = useCase.execute({
    seasonCycle: {
      currentSeason: 'winter',
      year: 7,
      dayOfSeason: 10,
      seasonLengthDays: 10,
    },
    regionalStates: [
      {
        regionId: 'frostmarch',
        season: 'winter',
        temperatureC: -12,
        precipitationLevel: 2,
        droughtIndex: 99,
        anomaly: 'aurora',
      },
    ],
  });

  assert.equal(result.nextCycle.currentSeason, 'spring');
  assert.equal(result.nextCycle.year, 8);
  assert.equal(result.updatedRegionalStates[0].temperatureC, -4);
  assert.equal(result.updatedRegionalStates[0].precipitationLevel, 0);
  assert.equal(result.updatedRegionalStates[0].droughtIndex, 100);
  assert.equal(result.updatedRegionalStates[0].anomaly, 'aurora');
});

test('AdvanceSeasons rejects invalid regional state collections', () => {
  const useCase = new AdvanceSeasons();

  assert.throws(
    () => useCase.execute({
      seasonCycle: { currentSeason: 'spring', seasonLengthDays: 30 },
      regionalStates: null,
    }),
    /regionalStates must be an array/,
  );
});
