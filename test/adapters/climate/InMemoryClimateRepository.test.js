import test from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryClimateRepository } from '../../../src/adapters/climate/InMemoryClimateRepository.js';
import { ClimateState } from '../../../src/domain/climate/ClimateState.js';

test('InMemoryClimateRepository loads and saves climate states by region', () => {
  const repository = new InMemoryClimateRepository([
    new ClimateState({
      regionId: 'north-coast',
      season: 'spring',
      temperatureC: 12,
      precipitationLevel: 66,
      droughtIndex: 18,
    }),
  ]);

  assert.equal(repository.loadByRegionId('north-coast')?.season, 'spring');
  assert.equal(repository.loadByRegionId('sunreach'), null);

  const saved = repository.save({
    regionId: 'sunreach',
    season: 'summer',
    temperatureC: 33,
    precipitationLevel: 24,
    droughtIndex: 58,
    anomaly: 'heatwave',
  });

  assert.equal(saved.regionId, 'sunreach');
  assert.equal(repository.loadByRegionId('sunreach')?.anomaly, 'heatwave');
  assert.deepEqual(repository.loadMany(['north-coast', 'sunreach']).map((state) => state?.regionId), ['north-coast', 'sunreach']);
});

test('InMemoryClimateRepository returns defensive copies for loaded and saved states', () => {
  const repository = new InMemoryClimateRepository();

  const saved = repository.save({
    regionId: 'delta-marsh',
    season: 'autumn',
    temperatureC: 17,
    precipitationLevel: 73,
    droughtIndex: 12,
  });

  saved.anomaly = 'tampered';

  const loaded = repository.loadByRegionId('delta-marsh');
  loaded.season = 'winter';

  assert.equal(repository.loadByRegionId('delta-marsh')?.anomaly, null);
  assert.equal(repository.loadByRegionId('delta-marsh')?.season, 'autumn');
});

test('InMemoryClimateRepository can delete and snapshot stored climate states', () => {
  const repository = new InMemoryClimateRepository([
    {
      regionId: 'north-coast',
      season: 'spring',
      temperatureC: 12,
      precipitationLevel: 66,
      droughtIndex: 18,
    },
    {
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: 31,
      precipitationLevel: 18,
      droughtIndex: 62,
    },
  ]);

  assert.equal(repository.deleteByRegionId('sunreach'), true);
  assert.equal(repository.deleteByRegionId('sunreach'), false);
  assert.deepEqual(repository.snapshot().map((state) => state.regionId), ['north-coast']);
});

test('InMemoryClimateRepository rejects invalid seed values and blank region identifiers', () => {
  assert.throws(
    () => new InMemoryClimateRepository({}),
    /seed must be an array/,
  );

  assert.throws(
    () => new InMemoryClimateRepository([null]),
    /must be a ClimateState or plain object/,
  );

  const repository = new InMemoryClimateRepository();

  assert.throws(
    () => repository.loadByRegionId('  '),
    /regionId is required/,
  );

  assert.throws(
    () => repository.deleteByRegionId(''),
    /regionId is required/,
  );
});
