import test from 'node:test';
import assert from 'node:assert/strict';

import { RegionClimateProfile } from '../../../src/domain/climate/RegionClimateProfile.js';

test('RegionClimateProfile keeps normalized regional climate baselines', () => {
  const profile = new RegionClimateProfile({
    regionId: ' north-coast ',
    biome: 'coastal',
    altitudeMeters: 12,
    coastal: true,
    seasonalAverages: {
      spring: { averageTemperatureC: 12, averagePrecipitationLevel: 68 },
      summer: { averageTemperatureC: 21, averagePrecipitationLevel: 44 },
      autumn: { averageTemperatureC: 14, averagePrecipitationLevel: 71 },
      winter: { averageTemperatureC: 5, averagePrecipitationLevel: 80 },
    },
    catastropheRisks: {
      stormSurge: 'high',
      drought: 'moderate',
    },
    tags: ['maritime', ' fog ', 'maritime'],
  });

  assert.deepEqual(profile.toJSON(), {
    regionId: 'north-coast',
    biome: 'coastal',
    altitudeMeters: 12,
    coastal: true,
    seasonalAverages: {
      spring: { averageTemperatureC: 12, averagePrecipitationLevel: 68 },
      summer: { averageTemperatureC: 21, averagePrecipitationLevel: 44 },
      autumn: { averageTemperatureC: 14, averagePrecipitationLevel: 71 },
      winter: { averageTemperatureC: 5, averagePrecipitationLevel: 80 },
    },
    catastropheRisks: {
      stormSurge: 'high',
      drought: 'moderate',
    },
    tags: ['fog', 'maritime'],
  });

  assert.deepEqual(profile.averageForSeason('summer'), {
    averageTemperatureC: 21,
    averagePrecipitationLevel: 44,
  });
  assert.equal(profile.riskLevelFor('stormSurge'), 'high');
  assert.equal(profile.riskLevelFor('wildfire'), 'low');
});

test('RegionClimateProfile supports immutable risk and tag updates', () => {
  const profile = new RegionClimateProfile({
    regionId: 'highlands',
    biome: 'highland',
    altitudeMeters: 1400,
    seasonalAverages: {
      winter: { averageTemperatureC: -6, averagePrecipitationLevel: 76 },
    },
  });

  const updated = profile.withRisk('avalanche', 'extreme').addTag('snowbound');

  assert.notEqual(updated, profile);
  assert.equal(profile.riskLevelFor('avalanche'), 'low');
  assert.equal(updated.riskLevelFor('avalanche'), 'extreme');
  assert.deepEqual(updated.tags, ['snowbound']);
});

test('RegionClimateProfile rejects invalid configuration', () => {
  assert.throws(
    () => new RegionClimateProfile({ regionId: '', biome: 'coastal', seasonalAverages: { spring: { averageTemperatureC: 10, averagePrecipitationLevel: 50 } } }),
    /regionId is required/,
  );

  assert.throws(
    () => new RegionClimateProfile({ regionId: 'north', biome: 'unknown', seasonalAverages: { spring: { averageTemperatureC: 10, averagePrecipitationLevel: 50 } } }),
    /biome must be one of/,
  );

  assert.throws(
    () => new RegionClimateProfile({ regionId: 'north', biome: 'coastal', seasonalAverages: {} }),
    /seasonalAverages cannot be empty/,
  );

  assert.throws(
    () => new RegionClimateProfile({ regionId: 'north', biome: 'coastal', seasonalAverages: { monsoon: { averageTemperatureC: 10, averagePrecipitationLevel: 50 } } }),
    /seasonalAverages season must be one of/,
  );

  assert.throws(
    () => new RegionClimateProfile({ regionId: 'north', biome: 'coastal', seasonalAverages: { spring: { averageTemperatureC: 10, averagePrecipitationLevel: 150 } } }),
    /averagePrecipitationLevel must be a finite number between 0 and 100/,
  );
});
