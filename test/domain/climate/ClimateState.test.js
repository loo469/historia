import test from 'node:test';
import assert from 'node:assert/strict';

import { ClimateState } from '../../../src/domain/climate/ClimateState.js';

test('creates a climate state for a region', () => {
  const state = new ClimateState({
    regionId: 'region-north',
    season: 'spring',
    temperatureC: 13,
    precipitationLevel: 57,
    droughtIndex: 18,
  });

  assert.deepEqual(state.toJSON(), {
    regionId: 'region-north',
    season: 'spring',
    temperatureC: 13,
    precipitationLevel: 57,
    droughtIndex: 18,
    anomaly: null,
    activeCatastropheIds: [],
    updatedAt: state.updatedAt,
  });
  assert.equal(state.isStable(), true);
});

test('updates seasonal readings immutably', () => {
  const original = new ClimateState({
    regionId: 'region-delta',
    season: 'summer',
    temperatureC: 28,
    precipitationLevel: 44,
    droughtIndex: 31,
  });

  const updated = original
    .withSeason('autumn', '2026-04-18T12:00:00.000Z')
    .withReadings({ precipitationLevel: 61, anomaly: 'cold-front' }, '2026-04-19T12:00:00.000Z');

  assert.equal(original.season, 'summer');
  assert.equal(updated.season, 'autumn');
  assert.equal(updated.precipitationLevel, 61);
  assert.equal(updated.anomaly, 'cold-front');
  assert.equal(updated.updatedAt, '2026-04-19T12:00:00.000Z');
  assert.equal(updated.isStable(), false);
});

test('tracks active catastrophes without duplicates', () => {
  const base = new ClimateState({
    regionId: 'region-ash',
    season: 'winter',
    temperatureC: -4,
    precipitationLevel: 80,
    droughtIndex: 5,
  });

  const active = base
    .activateCatastrophe('blizzard', '2026-04-20T10:00:00.000Z')
    .activateCatastrophe('blizzard', '2026-04-20T11:00:00.000Z')
    .activateCatastrophe('famine', '2026-04-20T12:00:00.000Z');

  assert.deepEqual(active.activeCatastropheIds, ['blizzard', 'famine']);

  const resolved = active.resolveCatastrophe('blizzard', '2026-04-21T10:00:00.000Z');
  assert.deepEqual(resolved.activeCatastropheIds, ['famine']);
});

test('rejects invalid climate values', () => {
  assert.throws(() => new ClimateState({
    regionId: '',
    season: 'spring',
    temperatureC: 10,
    precipitationLevel: 50,
  }), /regionId/);

  assert.throws(() => new ClimateState({
    regionId: 'region-bad',
    season: 'spring',
    temperatureC: Number.NaN,
    precipitationLevel: 50,
  }), /temperatureC/);

  assert.throws(() => new ClimateState({
    regionId: 'region-bad',
    season: 'spring',
    temperatureC: 10,
    precipitationLevel: 101,
  }), /precipitationLevel/);
});
