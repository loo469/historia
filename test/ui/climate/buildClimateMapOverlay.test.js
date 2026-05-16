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

  const { mapLayers, climateTimeline, ...stableOverlay } = overlay;

  assert.equal(climateTimeline.mode, 'static-current-climate');
  assert.equal(climateTimeline.control.enabled, false);
  assert.equal(climateTimeline.clarity.copy, 'Fallback statique: aucune donnée de prévision fournie.');

  assert.deepEqual(mapLayers.climateLabels.map((label) => ({
    regionId: label.regionId,
    text: label.text,
    tone: label.tone,
    badgeKinds: label.badges.map((badge) => badge.kind),
  })), [
    {
      regionId: 'north-coast',
      text: 'Printemps',
      tone: 'danger',
      badgeKinds: ['season', 'catastrophe'],
    },
    {
      regionId: 'sunreach',
      text: 'Été',
      tone: 'danger',
      badgeKinds: ['season', 'anomaly', 'catastrophe'],
    },
  ]);
  assert.deepEqual(mapLayers.anomalyMarkers.map((marker) => marker.layerId), [
    'sunreach:climate-anomaly-marker:heatwave',
  ]);
  assert.deepEqual(mapLayers.disasterRings.map((ring) => ring.layerId), [
    'north-coast:climate-disaster-ring:storm-1',
    'sunreach:climate-disaster-ring:storm-1',
  ]);
  assert.deepEqual(mapLayers.seasonSurfaces.map((surface) => ({
    regionId: surface.regionId,
    season: surface.season,
    riskLevel: surface.riskLevel,
  })), [
    { regionId: 'north-coast', season: 'spring', riskLevel: 'critical' },
    { regionId: 'sunreach', season: 'summer', riskLevel: 'critical' },
  ]);

  assert.deepEqual(stableOverlay, {
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
          opacity: 0.52,
        },
        fill: {
          color: 'orange',
          opacity: 0.18000000000000002,
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
    selectedClimateImpactComparison: {
      state: 'no-selection',
      compact: true,
      copy: 'Sélectionnez une province pour comparer son climat.',
    },
    selectedClimateTimingRecommendation: {
      state: 'no-selection',
      compact: true,
      relevant: false,
      copy: 'Sélectionnez une province pour afficher le timing climat.',
    },
    selectedClimateMitigationChoices: {
      state: 'no-selection',
      compact: true,
      choices: [],
      copy: 'Sélectionnez une province pour afficher les réponses climat.',
    },
    selectedClimateRecoveryForecast: {
      state: 'no-selection',
      compact: true,
      forecasts: [],
      copy: 'Sélectionnez une province pour voir la récupération climat.',
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
  assert.throws(() => buildClimateMapOverlay([], { regionGeometryById: [] }), /regionGeometryById must be an object/);
  assert.throws(() => buildClimateMapOverlay([], { seasonPreview: [] }), /seasonPreview must be an object/);
  assert.throws(() => buildClimateMapOverlay([], { seasonPreview: {} }), /seasonPreview.season is required/);
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
        opacity: 0.68,
        placement: {
          anchor: 'province-edge',
          avoid: ['province-label', 'province-marker'],
          priority: 'secondary',
        },
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
        density: 'measured',
        color: 'amber',
        opacity: 0.38,
        labelSafe: true,
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
        opacity: 0.48000000000000004,
        fillOpacity: 0.08,
        labelSafe: true,
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
        opacity: 0.16,
        labelSafe: true,
      },
    },
  ]);
});

test('buildClimateMapOverlay reduces climate effects when another overlay is selected', () => {
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
    visualEffects: true,
    selectedOverlayId: 'culture-overlay',
  });

  assert.deepEqual(overlay.reducedState, {
    reason: 'climate-overlay-inactive',
    density: 'reduced',
    preservedSignals: ['critical-catastrophe-rings', 'edge-pinned-anomaly-dots'],
  });
  assert.equal(overlay.visualEffects.find((effect) => effect.kind === 'season-wash').vector.opacity, 0.1);
  assert.equal(overlay.visualEffects.find((effect) => effect.kind === 'anomaly-glyph').vector.opacity, 0.46);
  assert.equal(overlay.visualEffects.find((effect) => effect.kind === 'anomaly-glyph').vector.animation, 'none');
  assert.deepEqual(overlay.visualEffects.find((effect) => effect.kind === 'anomaly-glyph').vector.placement, {
    anchor: 'province-edge',
    avoid: ['province-label', 'province-marker'],
    priority: 'secondary',
  });
  assert.equal(overlay.visualEffects.find((effect) => effect.kind === 'atmospheric-signal').vector.density, 'sparse');
});

test('buildClimateMapOverlay exposes lightweight season preview controls and edge-safe effects', () => {
  const overlay = buildClimateMapOverlay([
    {
      regionId: 'delta',
      season: 'winter',
      temperatureC: 2,
      precipitationLevel: 40,
      droughtIndex: 9,
    },
  ], {
    visualEffects: true,
    seasonLabels: { winter: 'Hiver', spring: 'Printemps' },
    seasonPreview: { season: 'spring' },
  });

  assert.deepEqual(overlay.seasonPreview, {
    mode: 'season-preview',
    active: true,
    currentSeasonLabels: ['Hiver'],
    previewSeason: 'spring',
    previewLabel: 'Printemps',
    changedRegionCount: 1,
    control: {
      controlId: 'climate-season-preview',
      label: 'Aperçu saison suivante: Printemps',
      tone: 'renewal',
      icon: '✿',
      placement: 'hud-compact',
      obscuresMap: false,
    },
    copy: 'Printemps preview on 1/1 regions',
  });
  assert.deepEqual(overlay.legend.items[1], {
    key: 'season-preview:spring',
    kind: 'season-preview',
    season: 'spring',
    label: 'Printemps',
    tone: 'renewal',
    icon: '✿',
    accent: 'green',
    description: 'Aperçu saisonnier projeté en halo léger sans couvrir les provinces.',
  });
  assert.deepEqual(overlay.visualEffects.find((effect) => effect.kind === 'season-preview'), {
    effectId: 'delta:season-preview:spring',
    regionId: 'delta',
    kind: 'season-preview',
    layer: 'atmosphere-preview',
    currentSeason: 'winter',
    previewSeason: 'spring',
    tone: 'renewal',
    accent: 'green',
    vector: {
      primitive: 'thin-edge-halo',
      blendMode: 'screen',
      opacity: 0.28,
      strokeDasharray: '1.2 1.8',
      labelSafe: true,
      placement: {
        anchor: 'province-edge',
        avoid: ['province-label', 'province-marker', 'province-border'],
        priority: 'tertiary',
      },
    },
    summary: 'Hiver → Printemps',
  });
});

test('buildClimateMapOverlay compares selected province current and preview climate impact compactly', () => {
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
    selectedRegionId: 'sunreach',
    seasonLabels: { summer: 'Été', autumn: 'Automne' },
    seasonPreview: {
      season: 'autumn',
      impactsByRegion: {
        sunreach: {
          strategicImpact: 'strained',
          anomaly: null,
          summary: 'Automne: pression réduite, routes encore fragiles',
        },
      },
    },
  });

  assert.deepEqual(overlay.selectedClimateImpactComparison, {
    state: 'ready',
    compact: true,
    regionId: 'sunreach',
    current: {
      season: 'summer',
      label: 'Été',
      riskLevel: 'critical',
      anomaly: 'heatwave',
      summary: 'logistique elevated, stabilité moderate, récoltes moderate',
    },
    preview: {
      season: 'autumn',
      label: 'Automne',
      riskLevel: 'strained',
      anomaly: null,
      summary: 'Automne: pression réduite, routes encore fragiles',
      projected: true,
    },
    delta: {
      seasonChanged: true,
      riskChanged: true,
      anomalyChanged: true,
    },
    copy: 'Été critical → Automne strained',
  });
});

test('buildClimateMapOverlay reports compact selected climate comparison empty states', () => {
  assert.deepEqual(buildClimateMapOverlay([], { selectedRegionId: 'missing' }).selectedClimateImpactComparison, {
    state: 'missing-climate-data',
    compact: true,
    regionId: 'missing',
    copy: 'Aucune donnée climat disponible pour cette province.',
  });

  assert.deepEqual(buildClimateMapOverlay([
    {
      regionId: 'delta',
      season: 'winter',
      temperatureC: 2,
      precipitationLevel: 40,
      droughtIndex: 9,
    },
  ], { selectedRegionId: 'delta' }).selectedClimateImpactComparison, {
    state: 'no-preview',
    compact: true,
    regionId: 'delta',
    current: {
      season: 'winter',
      label: 'winter',
      riskLevel: 'stable',
      anomaly: null,
      summary: 'logistique low, stabilité low, récoltes low',
    },
    copy: 'winter: stable',
  });
});

test('buildClimateMapOverlay recommends climate timing from selected preview risk changes', () => {
  const saferOverlay = buildClimateMapOverlay([
    {
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: 33,
      precipitationLevel: 11,
      droughtIndex: 74,
      anomaly: 'heatwave',
    },
  ], {
    selectedRegionId: 'sunreach',
    seasonLabels: { summer: 'Été', autumn: 'Automne' },
    seasonPreview: {
      season: 'autumn',
      impactsByRegion: {
        sunreach: { strategicImpact: 'strained', anomaly: null },
      },
    },
  });

  assert.deepEqual(saferOverlay.selectedClimateTimingRecommendation, {
    state: 'ready',
    compact: true,
    relevant: true,
    regionId: 'sunreach',
    currentSeason: 'summer',
    previewSeason: 'autumn',
    currentRiskLevel: 'critical',
    previewRiskLevel: 'strained',
    direction: 'safer',
    urgency: 'wait-for-preview',
    tone: 'positive',
    copy: 'Automne rend l’action plus sûre: risque critical → strained.',
  });

  const riskierOverlay = buildClimateMapOverlay([
    {
      regionId: 'delta',
      season: 'spring',
      temperatureC: 18,
      precipitationLevel: 42,
      droughtIndex: 12,
    },
  ], {
    selectedRegionId: 'delta',
    seasonLabels: { spring: 'Printemps', summer: 'Été' },
    seasonPreview: {
      season: 'summer',
      impactsByRegion: {
        delta: { riskLevel: 'critical', anomaly: 'drought' },
      },
    },
  });

  assert.equal(riskierOverlay.selectedClimateTimingRecommendation.direction, 'riskier');
  assert.equal(riskierOverlay.selectedClimateTimingRecommendation.urgency, 'act-before-preview');
  assert.equal(riskierOverlay.selectedClimateTimingRecommendation.copy, 'Été augmente le risque: agir avant la bascule saisonnière si possible.');
});

test('buildClimateMapOverlay provides climate timing fallback recommendations', () => {
  assert.deepEqual(buildClimateMapOverlay([], { selectedRegionId: 'missing' }).selectedClimateTimingRecommendation, {
    state: 'missing-climate-data',
    compact: true,
    relevant: false,
    regionId: 'missing',
    copy: 'Pas de recommandation climat: données indisponibles pour cette province.',
  });

  assert.deepEqual(buildClimateMapOverlay([
    {
      regionId: 'delta',
      season: 'winter',
      temperatureC: 2,
      precipitationLevel: 40,
      droughtIndex: 9,
    },
  ], { selectedRegionId: 'delta' }).selectedClimateTimingRecommendation, {
    state: 'current-only',
    compact: true,
    relevant: false,
    regionId: 'delta',
    direction: 'steady',
    urgency: 'normal',
    tone: 'neutral',
    copy: 'Timing climat normal: aucune contrainte notable pour cette province.',
  });
});

test('buildClimateMapOverlay offers compact mitigation choices for selected at-risk provinces', () => {
  const overlay = buildClimateMapOverlay([
    {
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: 34,
      precipitationLevel: 10,
      droughtIndex: 76,
      anomaly: 'heatwave',
    },
  ], {
    selectedRegionId: 'sunreach',
    seasonLabels: { summer: 'Été', autumn: 'Automne' },
    seasonPreview: {
      season: 'autumn',
      impactsByRegion: {
        sunreach: { strategicImpact: 'critical', anomaly: 'drought' },
      },
    },
  });

  assert.deepEqual(overlay.selectedClimateMitigationChoices, {
    state: 'ready',
    compact: true,
    regionId: 'sunreach',
    choices: [
      {
        choiceId: 'evacuate-risk-zones',
        label: 'Évacuer les zones exposées',
        effect: 'Réduit les pertes civiles et l’instabilité si le risque culmine.',
        timing: 'Automne: priorité immédiate avant aggravation saisonnière.',
        tone: 'danger',
        compact: true,
        placement: 'province-panel-compact',
        obscuresMap: false,
        linkedSignals: {
          legendKeys: ['season:summer', 'season-preview:autumn', 'anomaly:drought'],
          previewSeason: 'autumn',
          timingDirection: 'time-sensitive',
        },
      },
      {
        choiceId: 'irrigate-reserves',
        label: 'Irriguer et rationner',
        effect: 'Protège les récoltes et limite la pression logistique.',
        timing: 'Automne: utile avant le pic de sécheresse/chaleur.',
        tone: 'warning',
        compact: true,
        placement: 'province-panel-compact',
        obscuresMap: false,
        linkedSignals: {
          legendKeys: ['season:summer', 'season-preview:autumn', 'anomaly:drought'],
          previewSeason: 'autumn',
          timingDirection: 'time-sensitive',
        },
      },
      {
        choiceId: 'fortify-routes',
        label: 'Fortifier routes et abris',
        effect: 'Réduit les ruptures de circulation et sécurise les marqueurs clés.',
        timing: 'Automne: préparer avant les perturbations visibles sur la carte.',
        tone: 'warning',
        compact: true,
        placement: 'province-panel-compact',
        obscuresMap: false,
        linkedSignals: {
          legendKeys: ['season:summer', 'season-preview:autumn', 'anomaly:drought'],
          previewSeason: 'autumn',
          timingDirection: 'time-sensitive',
        },
      },
    ],
    copy: 'Évacuer les zones exposées · Irriguer et rationner · Fortifier routes et abris',
  });
});

test('buildClimateMapOverlay keeps mitigation fallback deterministic for low or missing climate risk', () => {
  assert.deepEqual(buildClimateMapOverlay([], { selectedRegionId: 'missing' }).selectedClimateMitigationChoices, {
    state: 'missing-climate-data',
    compact: true,
    regionId: 'missing',
    choices: [],
    copy: 'Aucune mitigation climat proposée: données indisponibles.',
  });

  assert.deepEqual(buildClimateMapOverlay([
    {
      regionId: 'delta',
      season: 'winter',
      temperatureC: 2,
      precipitationLevel: 40,
      droughtIndex: 9,
    },
  ], { selectedRegionId: 'delta' }).selectedClimateMitigationChoices, {
    state: 'not-needed',
    compact: true,
    regionId: 'delta',
    choices: [
      {
        choiceId: 'wait-monitor',
        label: 'Attendre et surveiller',
        effect: 'Conserve les ressources tant que le risque reste bas.',
        timing: 'winter: pas de mitigation active nécessaire.',
        tone: 'neutral',
        compact: true,
        placement: 'province-panel-compact',
        obscuresMap: false,
        linkedSignals: {
          legendKeys: ['season:winter'],
          previewSeason: null,
          timingDirection: 'steady',
        },
      },
    ],
    copy: 'Risque climat bas: surveiller sans mobiliser.',
  });
});

test('buildClimateMapOverlay forecasts recovery for dry anomaly mitigation choices sorted by recovery window', () => {
  const overlay = buildClimateMapOverlay([
    {
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: 35,
      precipitationLevel: 8,
      droughtIndex: 78,
      anomaly: 'heatwave',
    },
  ], {
    selectedRegionId: 'sunreach',
    seasonLabels: { summer: 'Été', autumn: 'Automne' },
    seasonPreview: {
      season: 'autumn',
      impactsByRegion: {
        sunreach: { strategicImpact: 'critical', anomaly: 'drought' },
      },
    },
  });

  assert.deepEqual(overlay.selectedClimateRecoveryForecast, {
    state: 'ready',
    compact: true,
    regionId: 'sunreach',
    confidence: 'medium',
    summary: {
      bestMitigation: 'evacuate-risk-zones',
      prudentOption: 'fortify-routes',
      riskyOption: 'fortify-routes',
      confidence: 'medium',
    },
    forecasts: [
      {
        choiceId: 'evacuate-risk-zones',
        label: 'Évacuer les zones exposées',
        recoveryWindowDays: 20,
        expectedStability: 'guarded',
        harvestImpact: 'récoltes ralenties',
        logisticsImpact: 'mobilité civile sécurisée',
        relapseRisk: 'medium',
        nextCriticalSeason: 'Automne',
        confidence: 'high',
        summary: 'Évacuer les zones exposées: récupération ~20j, rechute medium avant Automne.',
      },
      {
        choiceId: 'irrigate-reserves',
        label: 'Irriguer et rationner',
        recoveryWindowDays: 24,
        expectedStability: 'improving',
        harvestImpact: 'récoltes protégées',
        logisticsImpact: 'ravitaillement sous tension',
        relapseRisk: 'medium',
        nextCriticalSeason: 'Automne',
        confidence: 'high',
        summary: 'Irriguer et rationner: récupération ~24j, rechute medium avant Automne.',
      },
      {
        choiceId: 'fortify-routes',
        label: 'Fortifier routes et abris',
        recoveryWindowDays: 28,
        expectedStability: 'guarded',
        harvestImpact: 'récoltes exposées',
        logisticsImpact: 'routes stabilisées',
        relapseRisk: 'medium',
        nextCriticalSeason: 'Automne',
        confidence: 'high',
        summary: 'Fortifier routes et abris: récupération ~28j, rechute medium avant Automne.',
      },
    ],
    copy: 'Récupération estimée: Évacuer les zones exposées en ~20j.',
  });
});

test('buildClimateMapOverlay forecasts wet/catastrophe recovery with route fortification available', () => {
  const overlay = buildClimateMapOverlay([
    {
      regionId: 'delta',
      season: 'spring',
      temperatureC: 18,
      precipitationLevel: 88,
      droughtIndex: 4,
      anomaly: 'flood',
    },
  ], {
    selectedRegionId: 'delta',
    seasonLabels: { spring: 'Printemps' },
    catastrophes: [
      {
        id: 'flood-1',
        regionIds: ['delta'],
        type: 'flood',
        severity: 'major',
        status: 'active',
        startedAt: '2026-05-11T00:00:00.000Z',
        impact: { logistics: -8 },
      },
    ],
  });

  assert.equal(overlay.selectedClimateMitigationChoices.choices.some((choice) => choice.choiceId === 'fortify-routes'), true);
  assert.deepEqual(overlay.selectedClimateRecoveryForecast.forecasts.map((forecast) => forecast.choiceId), [
    'evacuate-risk-zones',
    'irrigate-reserves',
    'fortify-routes',
  ]);
  assert.equal(overlay.selectedClimateRecoveryForecast.forecasts.find((forecast) => forecast.choiceId === 'fortify-routes').logisticsImpact, 'routes stabilisées');
  assert.equal(overlay.selectedClimateRecoveryForecast.forecasts.find((forecast) => forecast.choiceId === 'fortify-routes').nextCriticalSeason, 'Printemps');
});

test('buildClimateMapOverlay keeps recovery forecast graceful for stable and missing climate data', () => {
  assert.deepEqual(buildClimateMapOverlay([], { selectedRegionId: 'missing' }).selectedClimateRecoveryForecast, {
    state: 'missing-climate-data',
    compact: true,
    regionId: 'missing',
    forecasts: [],
    copy: 'Forecast indisponible: données climat manquantes.',
  });

  const stableForecast = buildClimateMapOverlay([
    {
      regionId: 'plain',
      season: 'winter',
      temperatureC: 5,
      precipitationLevel: 44,
      droughtIndex: 8,
    },
  ], { selectedRegionId: 'plain' }).selectedClimateRecoveryForecast;

  assert.equal(stableForecast.state, 'stable');
  assert.equal(stableForecast.confidence, 'high');
  assert.deepEqual(stableForecast.summary, {
    bestMitigation: 'wait-monitor',
    prudentOption: 'wait-monitor',
    riskyOption: 'wait-monitor',
    confidence: 'high',
  });
  assert.deepEqual(stableForecast.forecasts, [
    {
      choiceId: 'wait-monitor',
      label: 'Attendre et surveiller',
      recoveryWindowDays: 7,
      expectedStability: 'stable',
      harvestImpact: 'neutre',
      logisticsImpact: 'neutre',
      relapseRisk: 'low',
      nextCriticalSeason: 'winter',
      confidence: 'high',
      summary: 'Attendre et surveiller: récupération ~7j, rechute low avant winter.',
    },
  ]);
});

test('buildClimateMapOverlay places climate map layers on province geometry', () => {
  const overlay = buildClimateMapOverlay([
    {
      regionId: 'delta',
      season: 'autumn',
      temperatureC: 18,
      precipitationLevel: 48,
      droughtIndex: 29,
      anomaly: 'storm',
    },
  ], {
    provinceGeometryById: {
      delta: {
        center: { x: 42, y: 24 },
        shape: 'polygon(40% 20%, 44% 20%, 44% 28%, 40% 28%)',
        polygon: '40,20 44,20 44,28 40,28',
      },
    },
    catastrophes: [
      {
        id: 'flood-1',
        type: 'flood',
        severity: 'critical',
        status: 'active',
        regionIds: ['delta'],
        startedAt: '2026-04-19T00:00:00.000Z',
        impact: { unrest: 2 },
      },
    ],
  });

  assert.deepEqual(overlay.mapLayers.seasonSurfaces[0].geometry, {
    center: { x: 42, y: 24 },
    shape: 'polygon(40% 20%, 44% 20%, 44% 28%, 40% 28%)',
    polygon: '40,20 44,20 44,28 40,28',
  });
  assert.equal(overlay.mapLayers.climateLabels[0].x, 42);
  assert.equal(overlay.mapLayers.climateLabels[0].placement.anchor, 'region-center');
  assert.equal(overlay.mapLayers.anomalyMarkers[0].y, 24);
  assert.deepEqual(overlay.mapLayers.disasterRings[0].geometry.center, { x: 42, y: 24 });
});

test('buildClimateMapOverlay exposes timeline scrubber decision-changing forecast clarity', () => {
  const overlay = buildClimateMapOverlay([
    {
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: 33,
      precipitationLevel: 11,
      droughtIndex: 74,
      anomaly: 'heatwave',
    },
    {
      regionId: 'delta',
      season: 'summer',
      temperatureC: 20,
      precipitationLevel: 48,
      droughtIndex: 20,
    },
  ], {
    seasonLabels: { summer: 'Été', autumn: 'Automne' },
    seasonPreview: {
      season: 'autumn',
      impactsByRegion: {
        sunreach: { strategicImpact: 'strained', anomaly: null },
        delta: { strategicImpact: 'critical', anomaly: 'storm' },
      },
    },
  });

  assert.deepEqual(overlay.climateTimeline.control, {
    controlId: 'climate-timeline-scrubber',
    label: 'Maintenant → Automne',
    enabled: true,
    steps: [
      { frameId: 'now', label: 'Maintenant', projected: false },
      { frameId: 'next-season', label: 'Automne', projected: true },
    ],
    fallback: null,
  });
  assert.deepEqual(overlay.climateTimeline.decisionChangingRegions.map((region) => ({
    regionId: region.regionId,
    confidenceBand: region.confidenceBand,
    urgencyRank: region.urgencyRank,
    microAction: region.microAction,
    timeWindow: region.timeWindow,
    changeType: region.changeType,
    tone: region.tone,
  })), [
    {
      regionId: 'delta',
      confidenceBand: 'extreme',
      urgencyRank: 1,
      microAction: 'déplacer priorité',
      timeWindow: 'maintenant → Automne',
      changeType: 'risk-increases',
      tone: 'warning',
    },
    {
      regionId: 'sunreach',
      confidenceBand: 'uncertain',
      urgencyRank: 3,
      microAction: 'attendre confirmation',
      timeWindow: 'maintenant → Automne',
      changeType: 'risk-decreases',
      tone: 'positive',
    },
  ]);
  assert.equal(overlay.climateTimeline.clarity.copy, '2 province(s) changent assez pour peser sur une décision.');
  assert.equal(overlay.climateTimeline.clarity.disasterLevels[2].decisionWeight, 'priorité stratégique');
  assert.deepEqual(overlay.climateTimeline.clarity.confidenceBands.map((band) => band.band), [
    'probable',
    'uncertain',
    'extreme',
  ]);
});

test('buildClimateMapOverlay exposes deterministic confidence bands and anomaly tooltips', () => {
  const overlay = buildClimateMapOverlay([
    {
      regionId: 'ridge',
      season: 'spring',
      temperatureC: 17,
      precipitationLevel: 32,
      droughtIndex: 42,
      anomaly: 'storm',
    },
    {
      regionId: 'basin',
      season: 'spring',
      temperatureC: 26,
      precipitationLevel: 14,
      droughtIndex: 61,
      anomaly: 'drought',
    },
    {
      regionId: 'coast',
      season: 'spring',
      temperatureC: 20,
      precipitationLevel: 44,
      droughtIndex: 18,
    },
  ], {
    seasonPreview: {
      season: 'summer',
      impactsByRegion: {
        ridge: { strategicImpact: 'critical', anomaly: 'storm', confidenceBand: 'probable' },
        basin: { strategicImpact: 'stable', anomaly: null, confidence: 0.35 },
        coast: { strategicImpact: 'critical', anomaly: 'flood' },
      },
    },
    anomalyTooltipByRegion: {
      ridge: {
        cause: 'cellule orageuse confirmée par les guetteurs',
        window: '2 tours',
        playerImpact: 'retarder les routes exposées',
      },
    },
  });

  assert.deepEqual(overlay.climateTimeline.decisionChangingRegions.map((region) => ({
    regionId: region.regionId,
    confidenceBand: region.confidenceBand,
  })), [
    { regionId: 'coast', confidenceBand: 'extreme' },
    { regionId: 'ridge', confidenceBand: 'probable' },
    { regionId: 'basin', confidenceBand: 'uncertain' },
  ]);
  assert.deepEqual(overlay.mapLayers.anomalyMarkers.find((marker) => marker.regionId === 'ridge').tooltip, {
    title: 'Anomalie: storm',
    cause: 'cellule orageuse confirmée par les guetteurs',
    window: '2 tours',
    playerImpact: 'retarder les routes exposées',
    riskLevel: 'strained',
  });
  assert.equal(
    overlay.mapLayers.anomalyMarkers.find((marker) => marker.regionId === 'basin').tooltip.playerImpact,
    'réserves et récoltes sous pression, attendre ou irriguer avant dépense',
  );
});

test('buildClimateMapOverlay ranks climate alerts by urgency and keeps static fallback', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'citadel', season: 'spring', temperatureC: 18, precipitationLevel: 40, droughtIndex: 20 },
    { regionId: 'granary', season: 'spring', temperatureC: 20, precipitationLevel: 35, droughtIndex: 25 },
    { regionId: 'watch', season: 'spring', temperatureC: 21, precipitationLevel: 30, droughtIndex: 30 },
    { regionId: 'quiet', season: 'spring', temperatureC: 19, precipitationLevel: 32, droughtIndex: 22 },
  ], {
    seasonPreview: {
      season: 'summer',
      impactsByRegion: {
        citadel: {
          strategicImpact: 'critical',
          anomaly: 'storm',
          confidenceBand: 'extreme',
          timeWindow: 'tour actuel',
          playerImpact: 'priorité capitale et route fragile',
        },
        granary: {
          strategicImpact: 'strained',
          anomaly: null,
          confidenceBand: 'probable',
          timeWindow: '2 tours',
          playerImpact: 'réserve de grains à préparer',
        },
        watch: {
          strategicImpact: 'stable',
          anomaly: 'frost',
          confidenceBand: 'uncertain',
          timeWindow: 'fin de saison',
          playerImpact: 'signal à confirmer avant dépense',
        },
        quiet: {
          strategicImpact: 'stable',
          anomaly: null,
          confidenceBand: 'probable',
          timeWindow: 'fin de saison',
          playerImpact: 'aucun changement majeur',
        },
      },
    },
  });

  assert.deepEqual(overlay.climateTimeline.climateAlerts.map((alert) => ({
    regionId: alert.regionId,
    urgencyRank: alert.urgencyRank,
    microAction: alert.microAction,
    confidenceBand: alert.confidenceBand,
    timeWindow: alert.timeWindow,
    playerImpact: alert.playerImpact,
  })), [
    {
      regionId: 'citadel',
      urgencyRank: 1,
      microAction: 'déplacer priorité',
      confidenceBand: 'extreme',
      timeWindow: 'tour actuel',
      playerImpact: 'priorité capitale et route fragile',
    },
    {
      regionId: 'granary',
      urgencyRank: 2,
      microAction: 'préparer réserve',
      confidenceBand: 'probable',
      timeWindow: '2 tours',
      playerImpact: 'réserve de grains à préparer',
    },
    {
      regionId: 'watch',
      urgencyRank: 3,
      microAction: 'attendre confirmation',
      confidenceBand: 'uncertain',
      timeWindow: 'fin de saison',
      playerImpact: 'signal à confirmer avant dépense',
    },
    {
      regionId: 'quiet',
      urgencyRank: 4,
      microAction: 'conserver plan',
      confidenceBand: 'probable',
      timeWindow: 'fin de saison',
      playerImpact: 'aucun changement majeur',
    },
  ]);
  assert.deepEqual(overlay.climateTimeline.alertSummary.buckets.map((bucket) => bucket.microAction), [
    'déplacer priorité',
    'préparer réserve',
    'attendre confirmation',
    'conserver plan',
  ]);

  const staticOverlay = buildClimateMapOverlay([
    { regionId: 'quiet', season: 'spring', temperatureC: 19, precipitationLevel: 32, droughtIndex: 22 },
  ]);

  assert.deepEqual(staticOverlay.climateTimeline.climateAlerts, []);
  assert.equal(
    staticOverlay.climateTimeline.alertSummary.fallback,
    'Fallback statique: aucune prévision exploitable pour classer les alertes.',
  );
});

test('buildClimateMapOverlay adds mitigation previews for urgent climate alerts', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'citadel', season: 'spring', temperatureC: 18, precipitationLevel: 40, droughtIndex: 20 },
    { regionId: 'granary', season: 'spring', temperatureC: 20, precipitationLevel: 35, droughtIndex: 25 },
    { regionId: 'watch', season: 'spring', temperatureC: 21, precipitationLevel: 30, droughtIndex: 30 },
  ], {
    seasonPreview: {
      season: 'summer',
      impactsByRegion: {
        citadel: {
          strategicImpact: 'critical',
          anomaly: 'storm',
          confidenceBand: 'extreme',
          timeWindow: 'tour actuel',
          playerImpact: 'priorité capitale et route fragile',
        },
        granary: {
          strategicImpact: 'strained',
          anomaly: null,
          confidenceBand: 'probable',
          timeWindow: '2 tours',
          playerImpact: 'réserve de grains à préparer',
        },
        watch: {
          strategicImpact: 'stable',
          anomaly: 'frost',
          confidenceBand: 'uncertain',
          timeWindow: 'fin de saison',
          playerImpact: 'signal à confirmer avant dépense',
        },
      },
    },
  });

  const urgentAlert = overlay.climateTimeline.climateAlerts.find((alert) => alert.regionId === 'citadel');
  assert.deepEqual(urgentAlert.mitigationPreviews.map((preview) => ({
    mode: preview.mode,
    expectedTiming: preview.expectedTiming,
    riskImpact: preview.riskImpact,
    confidenceBand: preview.confidenceBand,
    urgencyRank: preview.urgencyRank,
    collateralCost: preview.collateralCost,
  })), [
    {
      mode: 'immediate-mitigation',
      expectedTiming: 'tour actuel',
      riskImpact: 'réduit le risque critique vers tendu',
      confidenceBand: 'extreme',
      urgencyRank: 1,
      collateralCost: 'high',
    },
    {
      mode: 'delayed-mitigation',
      expectedTiming: 'prochain tour',
      riskImpact: 'réduction partielle si la fenêtre reste ouverte',
      confidenceBand: 'uncertain',
      urgencyRank: 2,
      collateralCost: 'medium',
    },
    {
      mode: 'no-action',
      expectedTiming: 'tour actuel',
      riskImpact: 'aucune réduction: risque inchangé ou aggravé',
      confidenceBand: 'extreme',
      urgencyRank: 4,
      collateralCost: 'none',
    },
  ]);

  const delayedAlert = overlay.climateTimeline.climateAlerts.find((alert) => alert.regionId === 'granary');
  assert.deepEqual(delayedAlert.mitigationPreviews.map((preview) => preview.mode), [
    'reserve-prep',
    'no-action',
  ]);
  assert.equal(delayedAlert.mitigationPreviews[0].riskImpact, 'réduit le risque attendu sans déplacer toute la priorité');

  const monitorAlert = overlay.climateTimeline.climateAlerts.find((alert) => alert.regionId === 'watch');
  assert.deepEqual(monitorAlert.mitigationPreviews.map((preview) => ({
    mode: preview.mode,
    collateralCost: preview.collateralCost,
    confidenceBand: preview.confidenceBand,
  })), [
    { mode: 'confirm-first', collateralCost: 'low', confidenceBand: 'uncertain' },
  ]);
});

test('buildClimateMapOverlay preserves explicit mitigation previews without merging confidence urgency and cost', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'delta', season: 'spring', temperatureC: 18, precipitationLevel: 40, droughtIndex: 20 },
  ], {
    seasonPreview: {
      season: 'summer',
      impactsByRegion: {
        delta: {
          strategicImpact: 'critical',
          anomaly: 'flood',
          confidenceBand: 'probable',
          timeWindow: '2 tours',
          playerImpact: 'route et récolte exposées',
          mitigationPreviews: [
            {
              mode: 'raise-dikes',
              label: 'renforcer digues',
              expectedTiming: 'avant crue',
              riskImpact: 'réduit inondation vers risque tendu',
              confidenceBand: 'probable',
              collateralCost: 'medium',
              playerImpact: 'mobilise ouvriers mais protège la route',
            },
          ],
        },
      },
    },
  });

  assert.deepEqual(overlay.climateTimeline.climateAlerts[0].mitigationPreviews, [
    {
      previewId: 'delta:mitigation:raise-dikes',
      mode: 'raise-dikes',
      label: 'renforcer digues',
      expectedTiming: 'avant crue',
      riskImpact: 'réduit inondation vers risque tendu',
      confidenceBand: 'probable',
      urgencyRank: 1,
      collateralCost: 'medium',
      playerImpact: 'mobilise ouvriers mais protège la route',
    },
  ]);
});

test('buildClimateMapOverlay exposes climate aftermath recap and resilience markers', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'delta', season: 'spring', temperatureC: 18, precipitationLevel: 70, droughtIndex: 12 },
    { regionId: 'ridge', season: 'spring', temperatureC: 29, precipitationLevel: 18, droughtIndex: 68, anomaly: 'drought' },
  ], {
    regionGeometryById: {
      delta: { center: { x: 24, y: 12 } },
      ridge: { center: { x: 44, y: 18 } },
    },
    seasonPreview: {
      season: 'summer',
      impactsByRegion: {
        delta: {
          strategicImpact: 'critical',
          anomaly: 'flood',
          confidenceBand: 'extreme',
          timeWindow: 'tour actuel',
          playerImpact: 'route fluviale et récolte touchées',
        },
      },
    },
    climateAftermathEvents: [
      {
        eventId: 'flood-aftermath',
        affectedRegionIds: ['delta', 'ridge'],
        observedImpact: 'récoltes basses et route coupée',
        severity: 'major',
        appliedMitigation: 'digues renforcées',
        confidenceBand: 'probable',
        resilienceState: 'recovering',
      },
    ],
  });

  assert.deepEqual(overlay.climateAftermathRecap.events, [
    {
      eventId: 'flood-aftermath',
      observedImpact: 'récoltes basses et route coupée',
      severity: 'major',
      affectedRegionIds: ['delta', 'ridge'],
      appliedMitigation: 'digues renforcées',
      missingMitigation: null,
      confidenceBand: 'probable',
      sourceAlertId: 'delta',
      resilienceState: 'recovering',
    },
  ]);
  assert.deepEqual(overlay.mapLayers.resilienceMarkers.map((marker) => ({
    regionId: marker.regionId,
    resilienceState: marker.resilienceState,
    severity: marker.severity,
    confidenceBand: marker.confidenceBand,
    x: marker.x,
    y: marker.y,
    tooltip: marker.tooltip,
  })), [
    {
      regionId: 'delta',
      resilienceState: 'recovering',
      severity: 'major',
      confidenceBand: 'probable',
      x: 24,
      y: 12,
      tooltip: {
        observedImpact: 'récoltes basses et route coupée',
        mitigation: 'mitigation appliquée: digues renforcées',
        confidenceBand: 'probable',
      },
    },
    {
      regionId: 'ridge',
      resilienceState: 'recovering',
      severity: 'major',
      confidenceBand: 'probable',
      x: 44,
      y: 18,
      tooltip: {
        observedImpact: 'récoltes basses et route coupée',
        mitigation: 'mitigation appliquée: digues renforcées',
        confidenceBand: 'probable',
      },
    },
  ]);
});

test('buildClimateMapOverlay links urgent alerts to default aftermath when no explicit recap exists', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'citadel', season: 'spring', temperatureC: 18, precipitationLevel: 40, droughtIndex: 20 },
  ], {
    seasonPreview: {
      season: 'summer',
      impactsByRegion: {
        citadel: {
          strategicImpact: 'critical',
          anomaly: 'storm',
          confidenceBand: 'extreme',
          timeWindow: 'tour actuel',
          playerImpact: 'priorité capitale et route fragile',
        },
      },
    },
  });

  assert.equal(overlay.climateAftermathRecap.events[0].sourceAlertId, 'citadel');
  assert.equal(overlay.climateAftermathRecap.events[0].appliedMitigation, 'mitiger maintenant');
  assert.equal(overlay.climateAftermathRecap.events[0].missingMitigation, 'ne rien changer');
  assert.deepEqual(overlay.mapLayers.resilienceMarkers.map((marker) => ({
    regionId: marker.regionId,
    resilienceState: marker.resilienceState,
    label: marker.label,
  })), [
    { regionId: 'citadel', resilienceState: 'recovering', label: 'récupération en cours' },
  ]);
});

test('buildClimateMapOverlay builds a safe climate window calendar from aftermath and resilience', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'delta', season: 'spring', temperatureC: 18, precipitationLevel: 70, droughtIndex: 12 },
  ], {
    seasonPreview: {
      season: 'summer',
      impactsByRegion: {
        delta: {
          strategicImpact: 'critical',
          anomaly: 'flood',
          confidenceBand: 'extreme',
          timeWindow: 'tour actuel',
          playerImpact: 'route fluviale et récolte touchées',
        },
      },
    },
    climateAftermathEvents: [
      {
        eventId: 'flood-aftermath',
        affectedRegionIds: ['delta'],
        observedImpact: 'route coupée',
        severity: 'major',
        appliedMitigation: 'digues renforcées',
        confidenceBand: 'probable',
        resilienceState: 'recovering',
      },
    ],
  });

  assert.deepEqual(overlay.climateSafeWindowCalendar.windows.map((window) => ({
    label: window.label,
    state: window.state,
    affectedRegionIds: window.affectedRegionIds,
    aftermathEventId: window.aftermathEventId,
    confidenceBand: window.confidenceBand,
    recommendation: window.actionTradeoff.recommendation,
  })), [
    {
      label: 'tour actuel',
      state: 'critical',
      affectedRegionIds: ['delta'],
      aftermathEventId: 'flood-aftermath',
      confidenceBand: 'probable',
      recommendation: 'renforcer d’abord',
    },
    {
      label: 'prochain tour',
      state: 'risky',
      affectedRegionIds: ['delta'],
      aftermathEventId: 'flood-aftermath',
      confidenceBand: 'probable',
      recommendation: 'attendre',
    },
    {
      label: 'saison suivante',
      state: 'safe',
      affectedRegionIds: ['delta'],
      aftermathEventId: 'flood-aftermath',
      confidenceBand: 'probable',
      recommendation: 'agir maintenant',
    },
  ]);
});

test('buildClimateMapOverlay accepts explicit uncertain safe climate windows', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'ridge', season: 'spring', temperatureC: 29, precipitationLevel: 18, droughtIndex: 68, anomaly: 'drought' },
  ], {
    climateAftermathEvents: [
      {
        eventId: 'dry-aftermath',
        regionId: 'ridge',
        observedImpact: 'sols fragiles',
        severity: 'moderate',
        missingMitigation: 'réservoir non renforcé',
        confidenceBand: 'uncertain',
        resilienceState: 'strained',
      },
    ],
    climateSafeWindows: [
      {
        aftermathEventId: 'dry-aftermath',
        windowId: 'dry-aftermath:wait',
        label: 'attendre pluie confirmée',
        state: 'risky',
        affectedRegionIds: ['ridge'],
        confidenceBand: 'uncertain',
        actionTradeoff: {
          recommendation: 'attendre',
          reinforceFirst: 'réservoir avant reprise agricole',
        },
      },
    ],
  });

  assert.deepEqual(overlay.climateSafeWindowCalendar.windows, [
    {
      windowId: 'dry-aftermath:wait',
      label: 'attendre pluie confirmée',
      state: 'risky',
      affectedRegionIds: ['ridge'],
      resilienceMarkerIds: ['dry-aftermath:ridge'],
      aftermathEventId: 'dry-aftermath',
      confidenceBand: 'uncertain',
      actionTradeoff: {
        now: 'possible mais avec coût ou rechute probable',
        wait: 'attendre améliore la lisibilité de la reprise',
        reinforceFirst: 'réservoir avant reprise agricole',
        recommendation: 'attendre',
      },
    },
  ]);
});

test('buildClimateMapOverlay recommends recovery readiness for safe climate windows', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'delta', season: 'spring', temperatureC: 18, precipitationLevel: 70, droughtIndex: 12 },
  ], {
    seasonPreview: {
      season: 'summer',
      impactsByRegion: {
        delta: {
          strategicImpact: 'critical',
          anomaly: 'flood',
          confidenceBand: 'extreme',
          timeWindow: 'tour actuel',
          playerImpact: 'route fluviale et récolte touchées',
        },
      },
    },
    climateAftermathEvents: [
      {
        eventId: 'flood-aftermath',
        affectedRegionIds: ['delta'],
        observedImpact: 'route coupée',
        severity: 'major',
        appliedMitigation: 'digues renforcées',
        confidenceBand: 'probable',
        resilienceState: 'recovering',
      },
    ],
  });

  assert.deepEqual(overlay.climateRecoveryReadiness.recommendations.map((recommendation) => ({
    windowId: recommendation.windowId,
    status: recommendation.status,
    confidenceBand: recommendation.confidenceBand,
    residualRisk: recommendation.prerequisites.residualRisk,
    mitigationActive: recommendation.prerequisites.mitigationActive,
    action: recommendation.action,
  })), [
    {
      windowId: 'flood-aftermath:window:1',
      status: 'discouraged',
      confidenceBand: 'probable',
      residualRisk: 'élevé',
      mitigationActive: 'active: digues renforcées',
      action: 'déconseillé: renforcer et attendre une fenêtre moins exposée',
    },
    {
      windowId: 'flood-aftermath:window:2',
      status: 'nearly-ready',
      confidenceBand: 'probable',
      residualRisk: 'élevé',
      mitigationActive: 'active: digues renforcées',
      action: 'compléter les prérequis avant d’engager l’action',
    },
    {
      windowId: 'flood-aftermath:window:3',
      status: 'ready',
      confidenceBand: 'probable',
      residualRisk: 'contenu',
      mitigationActive: 'active: digues renforcées',
      action: 'utiliser la fenêtre en gardant la réserve active',
    },
  ]);
});

test('buildClimateMapOverlay keeps uncertain readiness recommendations conservative and overrideable', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'ridge', season: 'spring', temperatureC: 29, precipitationLevel: 18, droughtIndex: 68, anomaly: 'drought' },
  ], {
    climateAftermathEvents: [
      {
        eventId: 'dry-aftermath',
        regionId: 'ridge',
        observedImpact: 'sols fragiles',
        severity: 'moderate',
        missingMitigation: 'réservoir non renforcé',
        confidenceBand: 'uncertain',
        resilienceState: 'strained',
      },
    ],
    climateSafeWindows: [
      {
        aftermathEventId: 'dry-aftermath',
        windowId: 'dry-aftermath:wait',
        label: 'attendre pluie confirmée',
        state: 'safe',
        affectedRegionIds: ['ridge'],
        confidenceBand: 'uncertain',
      },
    ],
    climateRecoveryReadiness: [
      {
        windowId: 'dry-aftermath:wait',
        status: 'nearly-ready',
        action: 'vérifier pluie puis remplir le réservoir',
        prerequisites: {
          reserve: 'réserve eau requise',
        },
      },
    ],
  });

  assert.deepEqual(overlay.climateRecoveryReadiness.recommendations, [
    {
      recommendationId: 'dry-aftermath:wait:readiness',
      windowId: 'dry-aftermath:wait',
      aftermathEventId: 'dry-aftermath',
      resilienceMarkerIds: ['dry-aftermath:ridge'],
      status: 'nearly-ready',
      confidenceBand: 'uncertain',
      prerequisites: {
        reserve: 'réserve eau requise',
        mitigationActive: 'manquante: réservoir non renforcé',
        localResilience: 'résilience locale à consolider',
        minimalDelay: 'fenêtre exploitable: attendre pluie confirmée',
        residualRisk: 'incertain à vérifier',
      },
      action: 'vérifier pluie puis remplir le réservoir',
    },
  ]);
});

test('buildClimateMapOverlay summarizes cross-region climate priorities from readiness windows', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'delta', season: 'spring', temperatureC: 18, precipitationLevel: 70, droughtIndex: 12 },
    { regionId: 'ridge', season: 'spring', temperatureC: 29, precipitationLevel: 18, droughtIndex: 68, anomaly: 'drought' },
  ], {
    climateAftermathEvents: [
      {
        eventId: 'delta-ready',
        regionId: 'delta',
        observedImpact: 'route stabilisée',
        severity: 'minor',
        appliedMitigation: 'digues inspectées',
        confidenceBand: 'probable',
        resilienceState: 'resilient',
      },
      {
        eventId: 'ridge-risk',
        regionId: 'ridge',
        observedImpact: 'sols fragiles',
        severity: 'moderate',
        missingMitigation: 'réservoir non renforcé',
        confidenceBand: 'uncertain',
        resilienceState: 'strained',
      },
    ],
    climateSafeWindows: [
      {
        aftermathEventId: 'delta-ready',
        windowId: 'delta-ready:now',
        label: 'tour actuel',
        state: 'safe',
        affectedRegionIds: ['delta'],
        confidenceBand: 'probable',
      },
      {
        aftermathEventId: 'ridge-risk',
        windowId: 'ridge-risk:later',
        label: 'prochain tour',
        state: 'safe',
        affectedRegionIds: ['ridge'],
        confidenceBand: 'uncertain',
      },
    ],
  });

  assert.deepEqual(overlay.climatePrioritySummary.priorities.map((priority) => ({
    regionIds: priority.regionIds,
    priority: priority.priority,
    windowId: priority.windowId,
    readinessRecommendationId: priority.readinessRecommendationId,
    confidenceBand: priority.confidenceBand,
    resourceConflicts: priority.resourceConflicts,
    reason: priority.reason,
  })), [
    {
      regionIds: ['delta'],
      priority: 'act-now',
      windowId: 'delta-ready:now',
      readinessRecommendationId: 'delta-ready:now:readiness',
      confidenceBand: 'probable',
      resourceConflicts: [],
      reason: 'fenêtre exploitable avec prérequis readiness validés',
    },
    {
      regionIds: ['ridge'],
      priority: 'prepare-first',
      windowId: 'ridge-risk:later',
      readinessRecommendationId: 'ridge-risk:later:readiness',
      confidenceBand: 'uncertain',
      resourceConflicts: ['mitigation', 'local-resilience', 'residual-risk'],
      reason: 'prévision incertaine: confirmer et renforcer avant engagement',
    },
  ]);
  assert.equal(overlay.climatePrioritySummary.summary, '1 à agir, 1 à préparer, 0 à reporter, 0 à éviter.');
});

test('buildClimateMapOverlay keeps cross-region climate priority overrides conservative', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'delta', season: 'spring', temperatureC: 18, precipitationLevel: 70, droughtIndex: 12 },
  ], {
    climateAftermathEvents: [
      {
        eventId: 'delta-risk',
        regionId: 'delta',
        observedImpact: 'route encore instable',
        severity: 'major',
        missingMitigation: 'réserve absente',
        confidenceBand: 'probable',
        resilienceState: 'strained',
      },
    ],
    climateSafeWindows: [
      {
        aftermathEventId: 'delta-risk',
        windowId: 'delta-risk:now',
        label: 'tour actuel',
        state: 'risky',
        affectedRegionIds: ['delta'],
        confidenceBand: 'probable',
      },
    ],
    climatePrioritySummary: [
      {
        windowId: 'delta-risk:now',
        priority: 'defer',
        resourceConflicts: ['reserve', 'window-timing'],
        reason: 'réserve partagée avec une autre région plus prête',
      },
    ],
  });

  assert.deepEqual(overlay.climatePrioritySummary.priorities, [
    {
      priorityId: 'delta-risk:now:readiness:priority',
      regionIds: ['delta'],
      priority: 'defer',
      windowId: 'delta-risk:now',
      readinessRecommendationId: 'delta-risk:now:readiness',
      confidenceBand: 'probable',
      resourceConflicts: ['reserve', 'window-timing'],
      reason: 'réserve partagée avec une autre région plus prête',
    },
  ]);
});

test('buildClimateMapOverlay groups climate priorities into prudent action bundles', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'delta', season: 'spring', temperatureC: 18, precipitationLevel: 70, droughtIndex: 12 },
    { regionId: 'ridge', season: 'spring', temperatureC: 29, precipitationLevel: 18, droughtIndex: 68, anomaly: 'drought' },
  ], {
    climateAftermathEvents: [
      {
        eventId: 'delta-ready',
        regionId: 'delta',
        observedImpact: 'route stabilisée',
        severity: 'minor',
        appliedMitigation: 'digues inspectées',
        confidenceBand: 'probable',
        resilienceState: 'resilient',
      },
      {
        eventId: 'ridge-risk',
        regionId: 'ridge',
        observedImpact: 'sols fragiles',
        severity: 'moderate',
        missingMitigation: 'réservoir non renforcé',
        confidenceBand: 'uncertain',
        resilienceState: 'strained',
      },
    ],
    climateSafeWindows: [
      {
        aftermathEventId: 'delta-ready',
        windowId: 'delta-ready:now',
        label: 'tour actuel',
        state: 'safe',
        affectedRegionIds: ['delta'],
        confidenceBand: 'probable',
      },
      {
        aftermathEventId: 'ridge-risk',
        windowId: 'ridge-risk:later',
        label: 'prochain tour',
        state: 'safe',
        affectedRegionIds: ['ridge'],
        confidenceBand: 'uncertain',
      },
    ],
  });

  assert.deepEqual(overlay.climateActionBundleAssistant.bundles.map((bundle) => ({
    kind: bundle.kind,
    priorityIds: bundle.priorityIds,
    regionIds: bundle.regionIds,
    viability: bundle.viability,
    resourceConflicts: bundle.resourceConflicts,
    confidenceNote: bundle.confidenceNote,
  })), [
    {
      kind: 'secure-now',
      priorityIds: ['delta-ready:now:readiness:priority'],
      regionIds: ['delta'],
      viability: 'viable',
      resourceConflicts: [],
      confidenceNote: 'confiance cohérente avec les prévisions disponibles',
    },
    {
      kind: 'prepare',
      priorityIds: ['ridge-risk:later:readiness:priority'],
      regionIds: ['ridge'],
      viability: 'fragile',
      resourceConflicts: ['mitigation', 'local-resilience', 'residual-risk'],
      confidenceNote: 'prudence: au moins une prévision reste incertaine',
    },
  ]);
  assert.equal(overlay.climateActionBundleAssistant.summary, '1 bundle(s) viable(s), 1 fragile(s), 0 déconseillé(s).');
});

test('buildClimateMapOverlay supports explicit prudent climate bundle overrides', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'delta', season: 'spring', temperatureC: 18, precipitationLevel: 70, droughtIndex: 12 },
  ], {
    climateAftermathEvents: [
      {
        eventId: 'delta-risk',
        regionId: 'delta',
        observedImpact: 'route encore instable',
        severity: 'major',
        missingMitigation: 'réserve absente',
        confidenceBand: 'probable',
        resilienceState: 'strained',
      },
    ],
    climateSafeWindows: [
      {
        aftermathEventId: 'delta-risk',
        windowId: 'delta-risk:now',
        label: 'tour actuel',
        state: 'risky',
        affectedRegionIds: ['delta'],
        confidenceBand: 'probable',
      },
    ],
    climatePrioritySummary: [
      {
        windowId: 'delta-risk:now',
        priority: 'avoid',
        resourceConflicts: ['reserve', 'window-timing', 'residual-risk'],
        reason: 'fenêtre trop exposée',
      },
    ],
    climateActionBundles: [
      {
        kind: 'postpone',
        viability: 'discouraged',
        reason: 'ne pas combiner avec une reprise agricole ce tour',
        confidenceNote: 'prudence maintenue malgré confiance probable',
      },
    ],
  });

  assert.deepEqual(overlay.climateActionBundleAssistant.bundles, [
    {
      bundleId: 'climate-bundle:postpone',
      kind: 'postpone',
      priorityIds: ['delta-risk:now:readiness:priority'],
      regionIds: ['delta'],
      viability: 'discouraged',
      resourceConflicts: ['reserve', 'window-timing', 'residual-risk'],
      reason: 'ne pas combiner avec une reprise agricole ce tour',
      confidenceNote: 'prudence maintenue malgré confiance probable',
      afterActionPreview: {
        expectedEffect: 'intervention différée: évite de verrouiller une fenêtre trop contradictoire',
        coolingOffTurns: 3,
        coolingOffState: 'do-not-reintervene',
        reboundRisk: 'high',
        reboundRegionIds: ['delta'],
        minimalAction: 'ne rien empiler: attendre une fenêtre moins contradictoire',
        summary: '3 tour(s) de cooling-off; rebond probable sur delta.',
      },
    },
  ]);
});

test('buildClimateMapOverlay previews rebound and cooling-off after prudent climate bundles', () => {
  const overlay = buildClimateMapOverlay([
    { regionId: 'delta', season: 'spring', temperatureC: 18, precipitationLevel: 70, droughtIndex: 12 },
    { regionId: 'ridge', season: 'spring', temperatureC: 29, precipitationLevel: 18, droughtIndex: 68, anomaly: 'drought' },
  ], {
    climateAftermathEvents: [
      {
        eventId: 'delta-ready',
        regionId: 'delta',
        observedImpact: 'route stabilisée',
        severity: 'minor',
        appliedMitigation: 'digues inspectées',
        confidenceBand: 'probable',
        resilienceState: 'resilient',
      },
      {
        eventId: 'ridge-risk',
        regionId: 'ridge',
        observedImpact: 'sols fragiles',
        severity: 'moderate',
        missingMitigation: 'réservoir non renforcé',
        confidenceBand: 'uncertain',
        resilienceState: 'strained',
      },
    ],
    climateSafeWindows: [
      {
        aftermathEventId: 'delta-ready',
        windowId: 'delta-ready:now',
        label: 'tour actuel',
        state: 'safe',
        affectedRegionIds: ['delta'],
        confidenceBand: 'probable',
      },
      {
        aftermathEventId: 'ridge-risk',
        windowId: 'ridge-risk:later',
        label: 'prochain tour',
        state: 'safe',
        affectedRegionIds: ['ridge'],
        confidenceBand: 'uncertain',
      },
    ],
  });

  const [secureNowBundle, prepareBundle] = overlay.climateActionBundleAssistant.bundles;

  assert.deepEqual(secureNowBundle.afterActionPreview, {
    expectedEffect: 'pression climatique abaissée immédiatement sans rouvrir de conflit majeur',
    coolingOffTurns: 1,
    coolingOffState: 'observe-next-turn',
    reboundRisk: 'low',
    reboundRegionIds: [],
    minimalAction: 'garder une réserve locale et relire les marqueurs de rebond au tour suivant',
    summary: '1 tour(s) de cooling-off; aucun rebond régional probable si la réserve reste disponible.',
  });
  assert.deepEqual(prepareBundle.afterActionPreview, {
    expectedEffect: 'readiness renforcée avant engagement direct, sans répéter le calendrier saisonnier',
    coolingOffTurns: 2,
    coolingOffState: 'verify-before-reintervention',
    reboundRisk: 'probable',
    reboundRegionIds: ['ridge'],
    minimalAction: 'sécuriser une readiness minimale avant toute mitigation supplémentaire',
    summary: '2 tour(s) de cooling-off; rebond probable sur ridge.',
  });
});
