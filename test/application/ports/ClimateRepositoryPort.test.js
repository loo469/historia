import test from 'node:test';
import assert from 'node:assert/strict';

import { ClimateRepositoryPort } from '../../../src/application/ports/ClimateRepositoryPort.js';
import { ClimateState } from '../../../src/domain/climate/ClimateState.js';

class InMemoryClimateRepository extends ClimateRepositoryPort {
  constructor(seed = []) {
    super();
    this.states = new Map(seed.map((state) => [state.regionId, state]));
  }

  loadByRegionId(regionId) {
    return this.states.get(regionId) ?? null;
  }

  save(climateState) {
    this.states.set(climateState.regionId, climateState);
    return climateState;
  }
}

test('ClimateRepositoryPort provides batch helpers around region-based operations', () => {
  const repository = new InMemoryClimateRepository([
    new ClimateState({
      regionId: 'north-coast',
      season: 'spring',
      temperatureC: 12,
      precipitationLevel: 66,
      droughtIndex: 18,
    }),
  ]);

  const loaded = repository.loadMany(['north-coast', 'sunreach']);

  assert.equal(loaded[0].regionId, 'north-coast');
  assert.equal(loaded[1], null);

  const saved = repository.saveMany([
    {
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: 33,
      precipitationLevel: 24,
      droughtIndex: 58,
      anomaly: 'heatwave',
    },
  ]);

  assert.equal(saved[0].regionId, 'sunreach');
  assert.equal(repository.loadByRegionId('sunreach').anomaly, 'heatwave');
});

test('ClimateRepositoryPort exposes clear errors for missing implementations and invalid batches', () => {
  const repository = new ClimateRepositoryPort();

  assert.throws(
    () => repository.loadByRegionId('north-coast'),
    /loadByRegionId must be implemented/,
  );

  assert.throws(
    () => repository.save(new ClimateState({
      regionId: 'north-coast',
      season: 'spring',
      temperatureC: 12,
      precipitationLevel: 66,
      droughtIndex: 18,
    })),
    /save must be implemented/,
  );

  assert.throws(
    () => repository.loadMany(null),
    /regionIds must be an array/,
  );

  assert.throws(
    () => repository.saveMany(null),
    /climateStates must be an array/,
  );
});
