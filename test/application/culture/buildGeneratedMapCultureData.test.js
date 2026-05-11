import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCultureMapSeeds,
  buildGeneratedMapCultureData,
  buildRegionIdsByCulture,
} from '../../../src/application/culture/buildGeneratedMapCultureData.js';

test('buildRegionIdsByCulture derives map regions from culture map hints', () => {
  assert.deepEqual(buildRegionIdsByCulture([
    { id: 'river-culture', regionIds: ['river-gate', 'crown-heart', 'river-gate'] },
    { id: 'southern-culture', provinceIds: ['southern-reach'] },
    { id: 'nomad-culture', homeRegionId: 'iron-plain' },
  ]), {
    'nomad-culture': ['iron-plain'],
    'river-culture': ['crown-heart', 'river-gate'],
    'southern-culture': ['southern-reach'],
  });
});

test('buildGeneratedMapCultureData composes culture overlay, panel and seed metadata', () => {
  const culturePayload = {
    cultures: [
      {
        id: 'culture-aurora',
        name: 'Aurora Compact',
        archetype: 'mercantile',
        primaryLanguage: 'trade-speech',
        valueIds: ['craft'],
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
  };

  const cultureData = buildGeneratedMapCultureData(culturePayload, { selectedRegionId: 'crown-heart' });

  assert.deepEqual(cultureData.regionIdsByCulture, {
    'culture-aurora': ['crown-heart', 'north-watch'],
  });
  assert.deepEqual(cultureData.seeds, [
    {
      cultureId: 'culture-aurora',
      cultureName: 'Aurora Compact',
      regionIds: ['crown-heart', 'north-watch'],
      discoveryIds: ['public-catalogue', 'tidal-ledgers'],
      researchStateIds: ['research-star-ledgers'],
      historicalEventIds: ['event-harbor-archives'],
    },
  ]);
  assert.deepEqual(cultureData.overlay.map((entry) => entry.regionId), ['crown-heart', 'north-watch']);
  assert.deepEqual(cultureData.overlay[0].discoveries, ['public-catalogue', 'tidal-ledgers']);
  assert.equal(cultureData.panel.focus.cultureId, 'culture-aurora');
  assert.equal(cultureData.panel.focus.discoveriesPanel.summary, '2 concepts, 1 recherches, 1 événements');
});

test('buildCultureMapSeeds keeps only cultures attached to generated regions', () => {
  const seeds = buildCultureMapSeeds(
    [
      { id: 'attached', name: 'Attached Culture' },
      { id: 'floating', name: 'Floating Culture' },
    ],
    { attached: ['north-watch'] },
    {
      attached: [
        { id: 'research-attached', discoveredConceptIds: ['surveying'] },
      ],
    },
    {
      attached: [
        { id: 'event-attached', discoveryIds: ['marker-language'] },
      ],
    },
  );

  assert.deepEqual(seeds, [
    {
      cultureId: 'attached',
      cultureName: 'Attached Culture',
      regionIds: ['north-watch'],
      discoveryIds: ['marker-language', 'surveying'],
      researchStateIds: ['research-attached'],
      historicalEventIds: ['event-attached'],
    },
  ]);
});

test('buildGeneratedMapCultureData validates map culture inputs', () => {
  assert.throws(() => buildRegionIdsByCulture(null), /cultures must be an array/);
  assert.throws(
    () => buildGeneratedMapCultureData({ cultures: null }),
    /culturePayload.cultures must be an array/,
  );
  assert.throws(
    () => buildGeneratedMapCultureData({}, { regionIdsByCulture: [] }),
    /regionIdsByCulture must be an object/,
  );
});
