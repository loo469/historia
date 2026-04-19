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
        cultureMetrics: {
          openness: 72,
          cohesion: 61,
          researchDrive: 77,
        },
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
        cultureMetrics: {
          openness: 35,
          cohesion: 67,
          researchDrive: 40,
        },
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
      researchStatesByCulture: {
        'culture-north': [
          {
            id: 'research-astrolabe',
            cultureId: 'culture-north',
            topicId: 'astrolabe',
            status: 'active',
            progress: 65,
            currentTier: 2,
            discoveredConceptIds: ['star-maps', 'tidal-ledgers'],
          },
          {
            id: 'research-navigation-codes',
            cultureId: 'culture-north',
            topicId: 'navigation-codes',
            status: 'completed',
            progress: 100,
            currentTier: 3,
            completedAt: '2026-04-18T08:00:00.000Z',
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
  assert.equal(panel.focus.activeFilter, 'all');
  assert.deepEqual(panel.focus.availableFilters, ['all', 'discoveries', 'research', 'events']);
  assert.equal(panel.focus.discoveriesPanel.summary, '3 concepts, 1 recherches, 1 événements');
  assert.equal(panel.focus.researchProgressPanel.summary, '1 actives, 0 bloquées, 1 terminées');
  assert.equal(panel.focus.researchProgressPanel.rows[0].progressLabel, '65% en cours');
  assert.deepEqual(panel.comparison, {
    title: 'Comparaison régionale',
    summary: '2 cultures visibles comparées',
    rows: [
      {
        cultureId: 'culture-north',
        cultureName: 'Northern League',
        regionId: 'archipelago',
        influenceScore: 70,
        influenceTier: 'strong',
        openness: 72,
        cohesion: 61,
        researchDrive: 77,
        label: 'Northern League · archipelago',
      },
      {
        cultureId: 'culture-steppe',
        cultureName: 'Steppe Houses',
        regionId: 'high-steppe',
        influenceScore: 46,
        influenceTier: 'emerging',
        openness: 35,
        cohesion: 67,
        researchDrive: 40,
        label: 'Steppe Houses · high-steppe',
      },
    ],
  });
  assert.deepEqual(panel.metrics, {
    markerCount: 2,
    regionCount: 2,
    strongInfluenceRegionCount: 1,
    cultureCount: 2,
  });
});

test('buildCultureLayerPanel can isolate discoveries, research, or events via activeFilter', () => {
  const baseEntries = [
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
      cultureMetrics: {
        openness: 72,
        cohesion: 61,
        researchDrive: 77,
      },
    },
  ];
  const options = {
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
    researchStatesByCulture: {
      'culture-north': [
        {
          id: 'research-astrolabe',
          cultureId: 'culture-north',
          topicId: 'astrolabe',
          status: 'active',
          progress: 65,
          currentTier: 2,
          discoveredConceptIds: ['star-maps', 'tidal-ledgers'],
        },
        {
          id: 'research-navigation-codes',
          cultureId: 'culture-north',
          topicId: 'navigation-codes',
          status: 'completed',
          progress: 100,
          currentTier: 3,
          completedAt: '2026-04-18T08:00:00.000Z',
        },
      ],
    },
  };

  const discoveriesPanel = buildCultureLayerPanel(baseEntries, { ...options, activeFilter: 'discoveries' });
  const researchPanel = buildCultureLayerPanel(baseEntries, { ...options, activeFilter: 'research' });
  const eventsPanel = buildCultureLayerPanel(baseEntries, { ...options, activeFilter: 'events' });

  assert.equal(discoveriesPanel.focus.discoveriesPanel.summary, '3 concepts, 1 recherches, 1 événements');
  assert.equal(researchPanel.focus.discoveriesPanel.summary, '0 concepts, 1 recherches, 0 événements');
  assert.equal(researchPanel.focus.researchProgressPanel.statusFilter, 'active');
  assert.equal(researchPanel.focus.researchProgressPanel.rows.length, 1);
  assert.equal(eventsPanel.focus.discoveriesPanel.summary, '3 concepts, 0 recherches, 1 événements');
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
      cultureMetrics: {},
    },
  ]);

  assert.equal(panel.focus.cultureId, 'culture-delta');
  assert.throws(() => buildCultureLayerPanel(null), /entries must be an array/);
  assert.throws(() => buildCultureLayerPanel([null]), /entries\[0\] must be an object/);
  assert.throws(() => buildCultureLayerPanel([], null), /options must be an object/);
  assert.throws(() => buildCultureLayerPanel([], { historicalEventsByCulture: [] }), /historicalEventsByCulture must be an object/);
  assert.throws(() => buildCultureLayerPanel([], { researchStatesByCulture: [] }), /researchStatesByCulture must be an object/);
  assert.throws(() => buildCultureLayerPanel([], { activeFilter: [] }), /activeFilter is required/);
  assert.throws(() => buildCultureLayerPanel([{ overlayId: 'x', regionId: 'r', cultureId: 'c', cultureName: 'n', label: 'l', cultureMetrics: [] }]), /cultureMetrics must be an object/);
});
