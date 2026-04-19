import test from 'node:test';
import assert from 'node:assert/strict';

import { buildClimateMapOverlay } from '../../../src/ui/climate/buildClimateMapOverlay.js';
import { ClimateState } from '../../../src/domain/climate/ClimateState.js';

test('buildClimateMapOverlay combines seasons, anomalies, and catastrophes into stable regional entries', () => {
  const overlay = buildClimateMapOverlay([
    new ClimateState({
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: 33,
      precipitationLevel: 11,
      droughtIndex: 74,
      anomaly: 'heatwave',
    }),
    {
      regionId: 'north-coast',
      season: 'spring',
      temperatureC: 12,
      precipitationLevel: 63,
      droughtIndex: 18,
    },
  ], {
    seasonLabels: {
      spring: 'Printemps',
      summer: 'Été',
    },
    catastrophes: [
      {
        id: 'storm-1',
        type: 'great-storm',
        severity: 'major',
        status: 'active',
        regionIds: ['north-coast', 'sunreach'],
        startedAt: '2026-04-19T00:00:00.000Z',
        impact: { harvest: -12 },
      },
    ],
  });

  assert.deepEqual(overlay, {
    title: 'Carte climat et catastrophes',
    summary: '2 régions, 2 catastrophes visibles, 1 anomalies',
    entries: [
      {
        overlayId: 'north-coast:season',
        regionId: 'north-coast',
        kind: 'season',
        label: 'Printemps',
        season: 'spring',
        tone: 'info',
      },
      {
        overlayId: 'north-coast:storm-1',
        regionId: 'north-coast',
        catastropheId: 'storm-1',
        kind: 'catastrophe',
        type: 'great-storm',
        severity: 'major',
        status: 'active',
        label: 'great-storm (major)',
        description: null,
        impact: { harvest: -12 },
        style: {
          stroke: 'orange',
          fill: 'orange',
          opacity: 0.4,
          icon: '▲',
        },
      },
      {
        overlayId: 'sunreach:anomaly:heatwave',
        regionId: 'sunreach',
        kind: 'anomaly',
        label: 'heatwave',
        season: 'summer',
        tone: 'warning',
      },
      {
        overlayId: 'sunreach:season',
        regionId: 'sunreach',
        kind: 'season',
        label: 'Été',
        season: 'summer',
        tone: 'info',
      },
      {
        overlayId: 'sunreach:storm-1',
        regionId: 'sunreach',
        catastropheId: 'storm-1',
        kind: 'catastrophe',
        type: 'great-storm',
        severity: 'major',
        status: 'active',
        label: 'great-storm (major)',
        description: null,
        impact: { harvest: -12 },
        style: {
          stroke: 'orange',
          fill: 'orange',
          opacity: 0.4,
          icon: '▲',
        },
      },
    ],
    regions: [
      {
        regionId: 'north-coast',
        season: 'spring',
        seasonLabel: 'Printemps',
        anomaly: null,
        activeCatastropheIds: ['storm-1'],
        strategicImpact: 'critical',
        temperatureC: 12,
        precipitationLevel: 63,
        droughtIndex: 18,
      },
      {
        regionId: 'sunreach',
        season: 'summer',
        seasonLabel: 'Été',
        anomaly: 'heatwave',
        activeCatastropheIds: ['storm-1'],
        strategicImpact: 'critical',
        temperatureC: 33,
        precipitationLevel: 11,
        droughtIndex: 74,
      },
    ],
    seasonalPanel: {
      title: 'Situation saisonnière',
      summary: 'Printemps: 1, Été: 1',
      seasons: [
        {
          season: 'spring',
          label: 'Printemps',
          regionCount: 1,
        },
        {
          season: 'summer',
          label: 'Été',
          regionCount: 1,
        },
      ],
    },
    legend: {
      title: 'Légende climat',
      compact: true,
      items: [
        {
          key: 'season:spring',
          kind: 'season',
          season: 'spring',
          label: 'Printemps',
          tone: 'info',
          description: 'Saison dominante affichée pour une région.',
        },
        {
          key: 'season:summer',
          kind: 'season',
          season: 'summer',
          label: 'Été',
          tone: 'info',
          description: 'Saison dominante affichée pour une région.',
        },
        {
          key: 'anomaly:heatwave',
          kind: 'anomaly',
          label: 'heatwave',
          tone: 'warning',
          description: 'Anomalie climatique active sur la région.',
        },
        {
          key: 'catastrophe:major',
          kind: 'catastrophe',
          severity: 'major',
          label: 'major',
          icon: '▲',
          color: 'orange',
          description: 'Catastrophe active ou imminente visible sur la carte.',
        },
      ],
    },
    metrics: {
      regionCount: 2,
      seasonCount: 2,
      anomalyCount: 1,
      catastropheCount: 2,
      criticalRegionCount: 2,
    },
  });
});

test('buildClimateMapOverlay supports empty catastrophes and validated options', () => {
  const overlay = buildClimateMapOverlay([
    {
      regionId: 'delta',
      season: 'autumn',
      temperatureC: 18,
      precipitationLevel: 48,
      droughtIndex: 29,
    },
  ], {
    catastrophes: [],
  });

  assert.equal(overlay.entries.length, 1);
  assert.equal(overlay.metrics.catastropheCount, 0);
  assert.equal(overlay.metrics.criticalRegionCount, 0);
  assert.equal(overlay.entries[0].overlayId, 'delta:season');
  assert.equal(overlay.seasonalPanel.summary, 'autumn: 1');
  assert.deepEqual(overlay.legend, {
    title: 'Légende climat',
    compact: true,
    items: [
      {
        key: 'season:autumn',
        kind: 'season',
        season: 'autumn',
        label: 'autumn',
        tone: 'info',
        description: 'Saison dominante affichée pour une région.',
      },
    ],
  });
  assert.deepEqual(overlay.regions, [
    {
      regionId: 'delta',
      season: 'autumn',
      seasonLabel: 'autumn',
      anomaly: null,
      activeCatastropheIds: [],
      strategicImpact: 'stable',
      temperatureC: 18,
      precipitationLevel: 48,
      droughtIndex: 29,
    },
  ]);
});

test('buildClimateMapOverlay rejects invalid inputs', () => {
  assert.throws(() => buildClimateMapOverlay(null), /climateStates must be an array/);
  assert.throws(() => buildClimateMapOverlay([null]), /ClimateState instances or plain objects/);
  assert.throws(() => buildClimateMapOverlay([], null), /options must be an object/);
  assert.throws(() => buildClimateMapOverlay([], { seasonLabels: [] }), /seasonLabels must be an object/);
});
