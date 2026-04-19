import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCultureLayerPanel } from '../../../src/ui/culture/buildCultureLayerPanel.js';

test('buildCultureLayerPanel summarizes regions and exposes a readable focus panel', () => {
  const panel = buildCultureLayerPanel(
    [
      {
        overlayId: 'archipelago:culture-north',
        regionId: 'archipelago',
        cultureId: 'culture-north',
        cultureName: 'Northern League',
        label: 'Northern League (3 découvertes)',
        summary: '1 recherches actives, 1 événements, 3 repères culturels',
        influenceScore: 70,
        influenceTier: 'strong',
        discoveries: ['public-catalogue', 'star-maps', 'tidal-ledgers'],
        unlockedResearchIds: ['astrolabe'],
        eventIds: ['event-open-archives'],
        eventTitles: ['Open Archives'],
        identityTags: ['assemblies', 'navigation', 'trade'],
        highlights: ['assemblies', 'public-catalogue', 'star-maps'],
        markerType: 'innovation',
        primaryLanguage: 'north-tongue',
      },
      {
        overlayId: 'high-steppe:culture-steppe',
        regionId: 'high-steppe',
        cultureId: 'culture-steppe',
        cultureName: 'Steppe Houses',
        label: 'Steppe Houses (1 découvertes)',
        summary: '0 recherches actives, 0 événements, 2 repères culturels',
        influenceScore: 46,
        influenceTier: 'emerging',
        discoveries: ['stirrup-drill'],
        unlockedResearchIds: ['composite-saddles'],
        eventIds: [],
        eventTitles: [],
        identityTags: ['clan-oaths', 'honor'],
        highlights: ['honor', 'stirrup-drill'],
        markerType: 'traditional',
        primaryLanguage: 'horse-speech',
      },
    ],
    {
      selectedRegionId: 'archipelago',
      historicalEventsByCulture: {
        'culture-north': [
          {
            id: 'event-open-archives',
            title: 'Open Archives',
            discoveryIds: ['public-catalogue'],
            unlockedResearchIds: ['astrolabe'],
          },
        ],
      },
    },
  );

  assert.equal(panel.title, 'Couche culturelle');
  assert.equal(panel.summary, "2 marqueurs, 2 régions, 1 zones d'influence fortes");
  assert.deepEqual(panel.regions, [
    {
      regionId: 'archipelago',
      markerCount: 1,
      dominantCultureId: 'culture-north',
      dominantCultureName: 'Northern League',
      influenceTier: 'strong',
      influenceScore: 70,
      highlights: ['assemblies', 'public-catalogue', 'star-maps'],
      markerIds: ['archipelago:culture-north'],
    },
    {
      regionId: 'high-steppe',
      markerCount: 1,
      dominantCultureId: 'culture-steppe',
      dominantCultureName: 'Steppe Houses',
      influenceTier: 'emerging',
      influenceScore: 46,
      highlights: ['honor', 'stirrup-drill'],
      markerIds: ['high-steppe:culture-steppe'],
    },
  ]);
  assert.equal(panel.focus.cultureId, 'culture-north');
  assert.equal(panel.focus.discoveriesPanel.summary, '3 concepts, 1 recherches, 1 événements');
  assert.deepEqual(panel.metrics, {
    markerCount: 2,
    regionCount: 2,
    strongInfluenceRegionCount: 1,
    cultureCount: 2,
  });
});

test('buildCultureLayerPanel falls back to the first marker and validates inputs', () => {
  const panel = buildCultureLayerPanel([
    {
      overlayId: 'delta:culture-delta',
      regionId: 'delta',
      cultureId: 'culture-delta',
      cultureName: 'Delta Scribes',
      label: 'Delta Scribes (0 découvertes)',
      summary: '0 recherches actives, 0 événements, 1 repères culturels',
    },
  ]);

  assert.equal(panel.focus.cultureId, 'culture-delta');
  assert.throws(() => buildCultureLayerPanel(null), /entries must be an array/);
  assert.throws(() => buildCultureLayerPanel([null]), /entries\[0\] must be an object/);
  assert.throws(() => buildCultureLayerPanel([], null), /options must be an object/);
  assert.throws(() => buildCultureLayerPanel([], { historicalEventsByCulture: [] }), /historicalEventsByCulture must be an object/);
});
