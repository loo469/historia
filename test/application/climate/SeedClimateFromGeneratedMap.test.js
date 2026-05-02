import assert from 'node:assert/strict';
import test from 'node:test';

import { SeedClimateFromGeneratedMap } from '../../../src/application/climate/SeedClimateFromGeneratedMap.js';
import { Catastrophe } from '../../../src/domain/climate/Catastrophe.js';
import { ClimateState } from '../../../src/domain/climate/ClimateState.js';
import { Myth } from '../../../src/domain/climate/Myth.js';
import { RegionClimateProfile } from '../../../src/domain/climate/RegionClimateProfile.js';

test('SeedClimateFromGeneratedMap derives regional profiles, seasons and anomalies from generated provinces', () => {
  const result = new SeedClimateFromGeneratedMap().execute({
    season: 'summer',
    seededAt: '1200-06-01T00:00:00.000Z',
    generatedMap: {
      provinces: [
        {
          id: 'red-dunes',
          biome: 'arid',
          aridity: 88,
          hazards: [{ type: 'drought', riskLevel: 'extreme' }],
          tags: ['salt-road'],
        },
        {
          id: 'mist-coast',
          biome: 'coastal',
          coastal: true,
          moisture: 84,
          hazards: ['storm'],
          season: 'autumn',
        },
      ],
    },
  });

  assert.equal(result.summary, '2 régions climatiques, 2 anomalies, 4 catastrophes semées');
  assert.ok(result.profiles.every((profile) => profile instanceof RegionClimateProfile));
  assert.ok(result.regionalStates.every((state) => state instanceof ClimateState));

  const dunesProfile = result.profiles.find((profile) => profile.regionId === 'red-dunes');
  assert.equal(dunesProfile.biome, 'arid');
  assert.equal(dunesProfile.riskLevelFor('drought'), 'extreme');
  assert.deepEqual(dunesProfile.tags, ['arid', 'salt-road']);

  const dunesState = result.regionalStates.find((state) => state.regionId === 'red-dunes');
  assert.equal(dunesState.season, 'summer');
  assert.equal(dunesState.anomaly, 'drought-watch');
  assert.equal(dunesState.updatedAt, '1200-06-01T00:00:00.000Z');
  assert.ok(dunesState.droughtIndex > 80);

  const coastState = result.regionalStates.find((state) => state.regionId === 'mist-coast');
  assert.equal(coastState.season, 'autumn');
  assert.equal(coastState.anomaly, 'flood-surge');
  assert.ok(coastState.activeCatastropheIds.some((id) => id.includes('storm')));
});

test('SeedClimateFromGeneratedMap groups high risks into catastrophes and matching seed myths', () => {
  const result = new SeedClimateFromGeneratedMap().execute({
    seededAt: '1200-01-03T00:00:00.000Z',
    generatedMap: {
      regions: [
        { id: 'upper-pass', biome: 'highland', altitudeMeters: 1800, hazards: [{ type: 'blizzard', riskLevel: 'high' }] },
        { id: 'ice-fjord', biome: 'polar', coastal: true, hazards: [{ type: 'blizzard', riskLevel: 'extreme' }] },
      ],
    },
  });

  assert.ok(result.catastrophes.every((catastrophe) => catastrophe instanceof Catastrophe));
  assert.ok(result.myths.every((myth) => myth instanceof Myth));

  const blizzard = result.catastrophes.find((catastrophe) => catastrophe.type === 'blizzard');
  assert.equal(blizzard.severity, 'critical');
  assert.equal(blizzard.status, 'active');
  assert.deepEqual(blizzard.regionIds, ['ice-fjord', 'upper-pass']);
  assert.equal(blizzard.impact.mobilityDelta, -32);

  const blizzardMyth = result.myths.find((myth) => myth.referencesEvent(blizzard.id));
  assert.equal(blizzardMyth.title, 'Présage de blizzard');
  assert.equal(blizzardMyth.category, 'omen');
  assert.deepEqual(blizzardMyth.regions, ['ice-fjord', 'upper-pass']);
});

test('SeedClimateFromGeneratedMap validates generated map input and season overrides', () => {
  const useCase = new SeedClimateFromGeneratedMap();

  assert.throws(() => useCase.execute({ generatedMap: null }), /generatedMap must be an object/);
  assert.throws(() => useCase.execute({ generatedMap: { regions: {} } }), /generatedMap.regions must be an array/);
  assert.throws(() => useCase.execute({ generatedMap: { regions: [{ id: 'north', season: 'monsoon' }] } }), /region season must be one of/);
  assert.throws(() => useCase.execute({ generatedMap: { regions: [{ biome: 'arid' }] } }), /region id is required/);
});
