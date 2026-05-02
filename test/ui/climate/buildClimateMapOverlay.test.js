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
    progressionByRegion: {
      'north-coast': {
        seasonChanged: true,
        temperatureDelta: 1,
        precipitationDelta: 2,
        droughtDelta: 6,
        summary: 'spring → summer, temp +1°C, précip +2, sécheresse +6',
      },
      sunreach: {
        seasonChanged: true,
        temperatureDelta: 5,
        precipitationDelta: -4,
        droughtDelta: 14,
        summary: 'spring → summer, temp +5°C, précip -4, sécheresse +14',
      },
    },
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
        tone: 'renewal',
        badge: {
          icon: '✿',
          tone: 'renewal',
          accent: 'green',
        },
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
        tone: 'danger',
        marker: {
          icon: '☀',
          tone: 'danger',
          accent: 'amber',
        },
      },
      {
        overlayId: 'sunreach:season',
        regionId: 'sunreach',
        kind: 'season',
        label: 'Été',
        season: 'summer',
        tone: 'bright',
        badge: {
          icon: '☀',
          tone: 'bright',
          accent: 'gold',
        },
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
        strategicSignals: {
          logisticsRisk: 'severe',
          stabilityRisk: 'low',
          harvestRisk: 'high',
          summary: 'logistique severe, stabilité low, récoltes high',
        },
        turnProgression: {
          seasonChanged: true,
          temperatureDelta: 1,
          precipitationDelta: 2,
          droughtDelta: 6,
          summary: 'spring → summer, temp +1°C, précip +2, sécheresse +6',
        },
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
        strategicSignals: {
          logisticsRisk: 'severe',
          stabilityRisk: 'moderate',
          harvestRisk: 'high',
          summary: 'logistique severe, stabilité moderate, récoltes high',
        },
        turnProgression: {
          seasonChanged: true,
          temperatureDelta: 5,
          precipitationDelta: -4,
          droughtDelta: 14,
          summary: 'spring → summer, temp +5°C, précip -4, sécheresse +14',
        },
        temperatureC: 33,
        precipitationLevel: 11,
        droughtIndex: 74,
      },
    ],
    seasonalPanel: {
      title: 'Situation saisonnière',
      summary: 'Printemps: 1, Été: 1',
      dominantSeason: {
        season: 'spring',
        label: 'Printemps',
        regionCount: 1,
        badge: {
          icon: '✿',
          tone: 'renewal',
          accent: 'green',
        },
      },
      seasons: [
        {
          season: 'spring',
          label: 'Printemps',
          regionCount: 1,
          badge: {
            icon: '✿',
            tone: 'renewal',
            accent: 'green',
          },
        },
        {
          season: 'summer',
          label: 'Été',
          regionCount: 1,
          badge: {
            icon: '☀',
            tone: 'bright',
            accent: 'gold',
          },
        },
      ],
    },
    catastropheZones: [
      {
        zoneId: 'zone:storm-1',
        catastropheId: 'storm-1',
        type: 'great-storm',
        severity: 'major',
        status: 'active',
        label: 'great-storm (major)',
        regionIds: ['north-coast', 'sunreach'],
        outline: {
          stroke: 'orange',
          pattern: 'ring',
          opacity: 0.6000000000000001,
        },
        fill: {
          color: 'orange',
          opacity: 0.30000000000000004,
        },
      },
    ],
    regionalRiskMode: [
      {
        regionId: 'north-coast',
        riskLevel: 'critical',
        anomaly: null,
        activeCatastropheIds: ['storm-1'],
        signals: {
          logisticsRisk: 'severe',
          stabilityRisk: 'low',
          harvestRisk: 'high',
          summary: 'logistique severe, stabilité low, récoltes high',
        },
        highlight: {
          tone: 'danger',
          emphasis: 'strong',
        },
        summary: 'Printemps, logistique severe, stabilité low, récoltes high',
      },
      {
        regionId: 'sunreach',
        riskLevel: 'critical',
        anomaly: 'heatwave',
        activeCatastropheIds: ['storm-1'],
        signals: {
          logisticsRisk: 'severe',
          stabilityRisk: 'moderate',
          harvestRisk: 'high',
          summary: 'logistique severe, stabilité moderate, récoltes high',
        },
        highlight: {
          tone: 'danger',
          emphasis: 'strong',
        },
        summary: 'Été, logistique severe, stabilité moderate, récoltes high',
      },
    ],
    legend: {
      title: 'Légende climat',
      compact: true,
      items: [
        {
          key: 'season:spring',
          kind: 'season',
          season: 'spring',
          label: 'Printemps',
          tone: 'renewal',
          icon: '✿',
          accent: 'green',
          description: 'Saison dominante affichée pour une région.',
        },
        {
          key: 'season:summer',
          kind: 'season',
          season: 'summer',
          label: 'Été',
          tone: 'bright',
          icon: '☀',
          accent: 'gold',
          description: 'Saison dominante affichée pour une région.',
        },
        {
          key: 'anomaly:heatwave',
          kind: 'anomaly',
          label: 'heatwave',
          tone: 'danger',
          icon: '☀',
          accent: 'amber',
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
      logisticsRiskRegionCount: 2,
      stabilityRiskRegionCount: 1,
      harvestRiskRegionCount: 2,
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
  assert.equal(overlay.metrics.logisticsRiskRegionCount, 0);
  assert.equal(overlay.metrics.stabilityRiskRegionCount, 0);
  assert.equal(overlay.metrics.harvestRiskRegionCount, 0);
  assert.equal(overlay.entries[0].overlayId, 'delta:season');
  assert.equal(overlay.seasonalPanel.summary, 'autumn: 1');
  assert.deepEqual(overlay.catastropheZones, []);
  assert.deepEqual(overlay.regionalRiskMode, [
    {
      regionId: 'delta',
      riskLevel: 'stable',
      anomaly: null,
      activeCatastropheIds: [],
      signals: {
        logisticsRisk: 'low',
        stabilityRisk: 'low',
        harvestRisk: 'low',
        summary: 'logistique low, stabilité low, récoltes low',
      },
      highlight: {
        tone: 'calm',
        emphasis: 'soft',
      },
      summary: 'autumn, logistique low, stabilité low, récoltes low',
    },
  ]);
  assert.deepEqual(overlay.legend, {
    title: 'Légende climat',
    compact: true,
    items: [
      {
        key: 'season:autumn',
        kind: 'season',
        season: 'autumn',
        label: 'autumn',
        tone: 'harvest',
        icon: '❋',
        accent: 'amber',
        description: 'Saison dominante affichée pour une région.',
      },
    ],
  });
  assert.deepEqual(overlay.seasonalPanel.dominantSeason, {
    season: 'autumn',
    label: 'autumn',
    regionCount: 1,
    badge: {
      icon: '❋',
      tone: 'harvest',
      accent: 'amber',
    },
  });
  assert.deepEqual(overlay.regions, [
    {
      regionId: 'delta',
      season: 'autumn',
      seasonLabel: 'autumn',
      anomaly: null,
      activeCatastropheIds: [],
      strategicImpact: 'stable',
      strategicSignals: {
        logisticsRisk: 'low',
        stabilityRisk: 'low',
        harvestRisk: 'low',
        summary: 'logistique low, stabilité low, récoltes low',
      },
      turnProgression: null,
      temperatureC: 18,
      precipitationLevel: 48,
      droughtIndex: 29,
    },
  ]);
});

test('buildClimateMapOverlay supports season badge overrides', () => {
  const overlay = buildClimateMapOverlay([
    {
      regionId: 'delta',
      season: 'winter',
      temperatureC: 2,
      precipitationLevel: 40,
      droughtIndex: 9,
    },
  ], {
    seasonStyleByType: {
      winter: { icon: '*', tone: 'still', accent: 'ice' },
    },
  });

  assert.deepEqual(overlay.entries[0], {
    overlayId: 'delta:season',
    regionId: 'delta',
    kind: 'season',
    label: 'winter',
    season: 'winter',
    tone: 'still',
    badge: {
      icon: '*',
      tone: 'still',
      accent: 'ice',
    },
  });
  assert.deepEqual(overlay.legend.items[0], {
    key: 'season:winter',
    kind: 'season',
    season: 'winter',
    label: 'winter',
    tone: 'still',
    icon: '*',
    accent: 'ice',
    description: 'Saison dominante affichée pour une région.',
  });
  assert.deepEqual(overlay.seasonalPanel.dominantSeason, {
    season: 'winter',
    label: 'winter',
    regionCount: 1,
    badge: {
      icon: '*',
      tone: 'still',
      accent: 'ice',
    },
  });
});

test('buildClimateMapOverlay supports anomaly marker overrides', () => {
  const overlay = buildClimateMapOverlay([
    {
      regionId: 'delta',
      season: 'winter',
      temperatureC: 2,
      precipitationLevel: 40,
      droughtIndex: 9,
      anomaly: 'frost',
    },
  ], {
    anomalyStyleByType: {
      frost: { icon: '*', tone: 'alert', accent: 'ice' },
    },
  });

  assert.deepEqual(overlay.entries[0], {
    overlayId: 'delta:anomaly:frost',
    regionId: 'delta',
    kind: 'anomaly',
    label: 'frost',
    season: 'winter',
    tone: 'alert',
    marker: {
      icon: '*',
      tone: 'alert',
      accent: 'ice',
    },
  });
  assert.deepEqual(overlay.legend.items[1], {
    key: 'anomaly:frost',
    kind: 'anomaly',
    label: 'frost',
    tone: 'alert',
    icon: '*',
    accent: 'ice',
    description: 'Anomalie climatique active sur la région.',
  });
});

test('buildClimateMapOverlay rejects invalid inputs', () => {
  assert.throws(() => buildClimateMapOverlay(null), /climateStates must be an array/);
  assert.throws(() => buildClimateMapOverlay([null]), /ClimateState instances or plain objects/);
  assert.throws(() => buildClimateMapOverlay([], null), /options must be an object/);
  assert.throws(() => buildClimateMapOverlay([], { seasonLabels: [] }), /seasonLabels must be an object/);
  assert.throws(() => buildClimateMapOverlay([], { seasonStyleByType: [] }), /seasonStyleByType must be an object/);
  assert.throws(() => buildClimateMapOverlay([], { anomalyStyleByType: [] }), /anomalyStyleByType must be an object/);
});

test('buildClimateMapOverlay can expose Pax Historia tactical dark styling tokens', () => {
  const overlay = buildClimateMapOverlay([
    {
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: 33,
      precipitationLevel: 11,
      droughtIndex: 74,
      anomaly: 'heatwave',
    },
  ], {
    tacticalHud: true,
    catastrophes: [
      {
        id: 'wildfire-1',
        type: 'wildfire',
        severity: 'major',
        status: 'active',
        regionIds: ['sunreach'],
        startedAt: '2026-04-19T00:00:00.000Z',
        impact: { harvest: -20 },
      },
    ],
  });

  assert.deepEqual(overlay.tacticalTheme, {
    visualMode: 'tactical-dark',
    className: 'climate-hud climate-hud--pax-dark',
    palette: {
      background: '#020817',
      glass: 'rgba(3, 10, 22, 0.72)',
      border: 'rgba(125, 211, 252, 0.24)',
      accent: '#f59e0b',
      danger: '#fb7185',
      text: '#e2e8f0',
    },
    layers: {
      regionFill: 'low-opacity-season-wash',
      anomalyGlyphs: 'minimal-cyan-amber-markers',
      catastropheRings: 'thin-glowing-alert-rings',
      coordinateGrid: true,
    },
    panel: {
      surface: 'frosted-glass',
      density: 'compact',
      typography: 'technical-sans',
    },
  });
  assert.equal(overlay.entries.find((entry) => entry.kind === 'catastrophe').hudStyle.visualMode, 'tactical-dark');
});

test('buildClimateMapOverlay can emit vector season anomaly and catastrophe visual effects', () => {
  const overlay = buildClimateMapOverlay([
    {
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: 33,
      precipitationLevel: 11,
      droughtIndex: 74,
      anomaly: 'heatwave',
    },
  ], {
    visualEffects: true,
    seasonLabels: { summer: 'Été' },
    catastrophes: [
      {
        id: 'wildfire-1',
        type: 'wildfire',
        severity: 'major',
        status: 'active',
        regionIds: ['sunreach'],
        startedAt: '2026-04-19T00:00:00.000Z',
        impact: { harvest: -20 },
      },
    ],
  });

  assert.deepEqual(overlay.visualEffects, [
    {
      effectId: 'sunreach:anomaly-glyph:heatwave',
      regionId: 'sunreach',
      kind: 'anomaly-glyph',
      layer: 'atmosphere-alerts',
      anomaly: 'heatwave',
      tone: 'danger',
      accent: 'amber',
      vector: {
        primitive: 'minimal-orbital-glyph',
        icon: '☀',
        stroke: 'amber',
        animation: 'slow-scan-pulse',
      },
    },
    {
      effectId: 'sunreach:atmospheric-signal',
      regionId: 'sunreach',
      kind: 'atmospheric-signal',
      layer: 'coordinate-grid',
      intensity: 'high',
      vector: {
        primitive: 'wind-line-field',
        density: 'dense',
        color: 'amber',
      },
      summary: 'Été, critical',
    },
    {
      effectId: 'sunreach:catastrophe-ring:wildfire-1',
      regionId: 'sunreach',
      kind: 'catastrophe-ring',
      layer: 'atmosphere-alerts',
      catastropheId: 'wildfire-1',
      severity: 'major',
      tone: 'warning',
      vector: {
        primitive: 'pulsing-contour-ring',
        stroke: 'orange',
        fill: 'orange',
        opacity: 0.5800000000000001,
      },
    },
    {
      effectId: 'sunreach:season-wash',
      regionId: 'sunreach',
      kind: 'season-wash',
      layer: 'atmosphere-base',
      season: 'summer',
      tone: 'bright',
      accent: 'gold',
      vector: {
        primitive: 'soft-gradient-field',
        blendMode: 'screen',
        opacity: 0.26,
      },
    },
  ]);
});
