import test from 'node:test';
import assert from 'node:assert/strict';

import { GenerateStrategicMap } from '../../../src/application/war/GenerateStrategicMap.js';
import { Province } from '../../../src/domain/war/Province.js';

function createProvince(overrides = {}) {
  return new Province({
    id: 'north-coast',
    name: 'North Coast',
    ownerFactionId: 'aurora',
    controllingFactionId: 'aurora',
    supplyLevel: 'stable',
    loyalty: 70,
    strategicValue: 4,
    neighborIds: [],
    ...overrides,
  });
}

test('GenerateStrategicMap wires strategic shell, culture overlay, and seeded business data', () => {
  const generatedMap = GenerateStrategicMap({
    provinces: [
      createProvince({ id: 'north-coast', name: 'North Coast', neighborIds: ['delta-ford'] }),
      createProvince({
        id: 'delta-ford',
        name: 'Delta Ford',
        ownerFactionId: 'ember',
        controllingFactionId: 'ember',
        supplyLevel: 'strained',
        loyalty: 52,
        neighborIds: ['north-coast'],
      }),
    ],
    culturePayload: {
      cultures: [
        {
          id: 'culture-aurora',
          name: 'Aurora Compact',
          archetype: 'mercantile',
          primaryLanguage: 'trade-speech',
          valueIds: ['craft', 'navigation'],
          traditionIds: ['harbor-moot'],
          openness: 72,
          cohesion: 61,
          researchDrive: 77,
          regionIds: ['north-coast'],
        },
      ],
      researchStates: [
        {
          id: 'research-star-ledgers',
          cultureId: 'culture-aurora',
          topicId: 'star-ledgers',
          status: 'active',
          progress: 65,
          discoveredConceptIds: ['tidal-ledgers'],
        },
      ],
      historicalEvents: [
        {
          id: 'event-harbor-archives',
          title: 'Harbor Archives',
          category: 'knowledge',
          summary: 'Dock scribes standardize voyage records.',
          era: 'early-sails',
          importance: 3,
          triggeredAt: '2026-04-19T00:00:00.000Z',
          affectedCultureIds: ['culture-aurora'],
          discoveryIds: ['public-catalogue'],
        },
      ],
    },
    options: {
      shell: {
        title: 'Carte générée',
        selectedProvinceId: 'north-coast',
      },
      selectedRegionId: 'north-coast',
    },
  });

  assert.equal(generatedMap.shell.title, 'Carte générée');
  assert.equal(generatedMap.shell.stats.provinceCount, 2);
  assert.deepEqual(generatedMap.businessData.regionIdsByCulture, {
    'culture-aurora': ['north-coast'],
  });
  assert.deepEqual(generatedMap.businessData.cultureSeeds, [
    {
      cultureId: 'culture-aurora',
      cultureName: 'Aurora Compact',
      regionIds: ['north-coast'],
      discoveryIds: ['public-catalogue', 'tidal-ledgers'],
      historicalEventIds: ['event-harbor-archives'],
      researchStateIds: ['research-star-ledgers'],
    },
  ]);
  assert.equal(generatedMap.overlays.culture.length, 1);
  assert.equal(generatedMap.overlays.culture[0].regionId, 'north-coast');
  assert.deepEqual(generatedMap.overlays.culture[0].discoveries, ['public-catalogue', 'tidal-ledgers']);
  assert.equal(generatedMap.panels.culture.focus.cultureId, 'culture-aurora');
  assert.equal(generatedMap.panels.culture.focus.discoveriesPanel.summary, '2 concepts, 1 recherches, 1 événements');
});

test('GenerateStrategicMap supports explicit culture-to-region mapping and validates inputs', () => {
  const generatedMap = GenerateStrategicMap({
    provinces: [createProvince()],
    culturePayload: {
      cultures: [
        {
          id: 'culture-steppe',
          name: 'Steppe Houses',
          archetype: 'nomadic',
          primaryLanguage: 'horse-speech',
          valueIds: ['honor'],
          traditionIds: ['clan-oaths'],
          openness: 35,
          cohesion: 67,
          researchDrive: 40,
        },
      ],
    },
    options: {
      regionIdsByCulture: {
        'culture-steppe': ['north-coast'],
      },
    },
  });

  assert.equal(generatedMap.overlays.culture[0].cultureId, 'culture-steppe');
  assert.deepEqual(generatedMap.businessData.cultureSeeds[0].regionIds, ['north-coast']);

  assert.throws(() => GenerateStrategicMap(), /GenerateStrategicMap provinces must be an array/);
  assert.throws(
    () => GenerateStrategicMap({ provinces: [createProvince()], culturePayload: null }),
    /GenerateStrategicMap culturePayload must be an object/,
  );
  assert.throws(
    () => GenerateStrategicMap({ provinces: [createProvince()], options: null }),
    /GenerateStrategicMap options must be an object/,
  );
});
