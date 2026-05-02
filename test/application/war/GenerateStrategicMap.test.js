import test from 'node:test';
import assert from 'node:assert/strict';

import { GenerateStrategicMap } from '../../../src/application/war/GenerateStrategicMap.js';
import { Province } from '../../../src/domain/war/Province.js';

test('GenerateStrategicMap returns deterministic strategic provinces and UI business metadata', () => {
  const generator = new GenerateStrategicMap();
  const map = generator.execute();
  const repeated = generator.execute();

  assert.equal(map.seed, 'historia-alpha-strategic-map-v1');
  assert.equal(map.width, 100);
  assert.equal(map.height, 100);
  assert.deepEqual(map.provinces.map((province) => province.id), [
    'crown-heart',
    'iron-plain',
    'north-watch',
    'red-ridge',
    'river-gate',
    'southern-reach',
  ]);
  assert.ok(map.provinces.every((province) => province instanceof Province));
  assert.deepEqual(map.provinces.map((province) => province.toJSON()), repeated.provinces.map((province) => province.toJSON()));

  const riverGate = map.provinces.find((province) => province.id === 'river-gate');
  assert.equal(riverGate.ownerFactionId, 'aurora');
  assert.equal(riverGate.controllingFactionId, 'ember');
  assert.equal(riverGate.contested, true);
  assert.deepEqual(riverGate.neighborIds, ['crown-heart', 'iron-plain', 'north-watch', 'southern-reach']);

  assert.deepEqual(map.factionMetaById.aurora, { label: 'Alliance d’Aurora' });
  assert.deepEqual(map.paletteByFaction.ember, { fill: '#E8572A', border: '#FFB394' });
  assert.deepEqual(map.provinceLayouts['crown-heart'], { x: 38, y: 18, w: 23, h: 20 });
  assert.equal(map.provincePolygons['red-ridge'], '58,16 73,10 88,18 90,34 80,44 64,42 54,32 52,22');
  assert.deepEqual(map.overlays.culture, []);
  assert.equal(map.panels.culture.focus, null);
  assert.deepEqual(map.businessData.cultureSeeds, []);
});

test('GenerateStrategicMap composes culture overlays and seed data from the generated map contract', () => {
  const generator = new GenerateStrategicMap();
  const map = generator.execute({
    selectedRegionId: 'crown-heart',
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
          regionIds: ['crown-heart', 'north-watch'],
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
  });

  assert.deepEqual(map.businessData.regionIdsByCulture, {
    'culture-aurora': ['crown-heart', 'north-watch'],
  });
  assert.deepEqual(map.businessData.cultureSeeds, [
    {
      cultureId: 'culture-aurora',
      cultureName: 'Aurora Compact',
      regionIds: ['crown-heart', 'north-watch'],
      discoveryIds: ['public-catalogue', 'tidal-ledgers'],
      researchStateIds: ['research-star-ledgers'],
      historicalEventIds: ['event-harbor-archives'],
    },
  ]);
  assert.deepEqual(map.overlays.culture.map((entry) => entry.regionId), ['crown-heart', 'north-watch']);
  assert.deepEqual(map.overlays.culture[0].discoveries, ['public-catalogue', 'tidal-ledgers']);
  assert.equal(map.panels.culture.focus.cultureId, 'culture-aurora');
  assert.equal(map.panels.culture.focus.discoveriesPanel.summary, '2 concepts, 1 recherches, 1 événements');
});

test('GenerateStrategicMap can derive province ownership from faction home columns and seeded jitter', () => {
  const generator = new GenerateStrategicMap();
  const map = generator.execute({
    seed: 'custom-front',
    loyaltyJitter: 3,
    strategicValueJitter: 1,
    factions: [
      { id: 'west', label: 'West', homeColumn: 0, fill: '#111111', border: '#222222' },
      { id: 'east', label: 'East', homeColumn: 1, fill: '#333333', border: '#444444' },
    ],
    provinceBlueprints: [
      { id: 'a', name: 'A', grid: { col: 0, row: 0 }, supplyLevel: 'stable', loyalty: 50, strategicValue: 4 },
      { id: 'b', name: 'B', grid: { col: 1, row: 0 }, supplyLevel: 'strained', loyalty: 50, strategicValue: 4, contested: true },
    ],
    links: [['a', 'b']],
  });

  assert.deepEqual(map.provinces.map((province) => ({
    id: province.id,
    ownerFactionId: province.ownerFactionId,
    neighborIds: province.neighborIds,
    contested: province.contested,
  })), [
    { id: 'a', ownerFactionId: 'west', neighborIds: ['b'], contested: false },
    { id: 'b', ownerFactionId: 'east', neighborIds: ['a'], contested: true },
  ]);
  assert.notDeepEqual(map.provinces.map((province) => province.loyalty), [50, 50]);
});

test('GenerateStrategicMap validates options, factions, blueprints and links', () => {
  const generator = new GenerateStrategicMap();

  assert.throws(() => generator.execute(null), /options must be an object/);
  assert.throws(() => generator.execute({ factions: null }), /factions must be an array/);
  assert.throws(() => generator.execute({ factions: [{}] }), /faction id is required/);
  assert.throws(() => generator.execute({ provinceBlueprints: null }), /provinceBlueprints must be an array/);
  assert.throws(() => generator.execute({ provinceBlueprints: [{}] }), /province id is required/);
  assert.throws(() => generator.execute({ provinceBlueprints: [{ id: 'a', name: 'A' }], links: [['a', 'missing']] }), /links must reference generated provinces/);
});
