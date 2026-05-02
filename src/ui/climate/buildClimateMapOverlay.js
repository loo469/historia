import { ClimateState } from '../../domain/climate/ClimateState.js';
import { buildCatastropheMapOverlay } from './buildCatastropheMapOverlay.js';

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return value;
}

function normalizeClimateState(climateState) {
  if (climateState instanceof ClimateState) {
    return climateState;
  }

  if (climateState === null || typeof climateState !== 'object' || Array.isArray(climateState)) {
    throw new TypeError('ClimateMapOverlay climateStates must contain ClimateState instances or plain objects.');
  }

  return new ClimateState(climateState);
}

const DEFAULT_SEASON_STYLE_BY_TYPE = Object.freeze({
  spring: { icon: '✿', tone: 'renewal', accent: 'green' },
  summer: { icon: '☀', tone: 'bright', accent: 'gold' },
  autumn: { icon: '❋', tone: 'harvest', accent: 'amber' },
  winter: { icon: '❄', tone: 'cold', accent: 'cyan' },
  default: { icon: '◐', tone: 'info', accent: 'slate' },
});

function normalizeSeasonStyle(styleByType, season) {
  const seasonType = String(season ?? '').trim().toLowerCase();
  const style = styleByType[seasonType] ?? styleByType.default ?? DEFAULT_SEASON_STYLE_BY_TYPE.default;

  return {
    icon: String(style.icon ?? DEFAULT_SEASON_STYLE_BY_TYPE[seasonType]?.icon ?? '◐').trim() || '◐',
    tone: String(style.tone ?? DEFAULT_SEASON_STYLE_BY_TYPE[seasonType]?.tone ?? 'info').trim() || 'info',
    accent: String(style.accent ?? DEFAULT_SEASON_STYLE_BY_TYPE[seasonType]?.accent ?? 'slate').trim() || 'slate',
  };
}

function buildSeasonEntry(state, seasonLabels, seasonStyleByType) {
  const badge = normalizeSeasonStyle(seasonStyleByType, state.season);

  return {
    overlayId: `${state.regionId}:season`,
    regionId: state.regionId,
    kind: 'season',
    label: seasonLabels[state.season] ?? state.season,
    season: state.season,
    tone: badge.tone,
    badge,
  };
}

const DEFAULT_ANOMALY_STYLE_BY_TYPE = Object.freeze({
  heatwave: { icon: '☀', tone: 'danger', accent: 'amber' },
  drought: { icon: '♨', tone: 'danger', accent: 'ochre' },
  storm: { icon: '☈', tone: 'warning', accent: 'blue' },
  flood: { icon: '≈', tone: 'warning', accent: 'teal' },
  frost: { icon: '❄', tone: 'warning', accent: 'cyan' },
  default: { icon: '◌', tone: 'warning', accent: 'slate' },
});

function normalizeAnomalyType(anomaly) {
  return String(anomaly ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
}

function normalizeAnomalyStyle(styleByType, anomaly) {
  const anomalyType = normalizeAnomalyType(anomaly);
  const style = styleByType[anomalyType] ?? styleByType.default ?? DEFAULT_ANOMALY_STYLE_BY_TYPE.default;

  return {
    icon: String(style.icon ?? DEFAULT_ANOMALY_STYLE_BY_TYPE[anomalyType]?.icon ?? '◌').trim() || '◌',
    tone: String(style.tone ?? DEFAULT_ANOMALY_STYLE_BY_TYPE[anomalyType]?.tone ?? 'warning').trim() || 'warning',
    accent: String(style.accent ?? DEFAULT_ANOMALY_STYLE_BY_TYPE[anomalyType]?.accent ?? 'slate').trim() || 'slate',
  };
}

function buildAnomalyEntry(state, anomalyStyleByType) {
  if (!state.hasAnomaly()) {
    return null;
  }

  const marker = normalizeAnomalyStyle(anomalyStyleByType, state.anomaly);

  return {
    overlayId: `${state.regionId}:anomaly:${state.anomaly}`,
    regionId: state.regionId,
    kind: 'anomaly',
    label: state.anomaly,
    season: state.season,
    tone: marker.tone,
    marker,
  };
}

function buildStrategicImpact(state, catastropheEntries) {
  if (catastropheEntries.length > 0 || state.droughtIndex >= 60) {
    return 'critical';
  }

  if (state.hasAnomaly() || state.precipitationLevel < 20) {
    return 'strained';
  }

  return 'stable';
}

function buildStrategicSignals(state, catastropheEntries) {
  const logisticsRisk = catastropheEntries.length > 0
    ? 'severe'
    : state.precipitationLevel < 20 || state.droughtIndex >= 55
      ? 'elevated'
      : 'low';

  const stabilityRisk = catastropheEntries.some((entry) => entry.impact.unrest > 0)
    ? 'high'
    : state.hasAnomaly() || state.droughtIndex >= 45
      ? 'moderate'
      : 'low';

  const harvestRisk = catastropheEntries.some((entry) => entry.impact.harvest < 0)
    ? 'high'
    : state.precipitationLevel < 25 || state.droughtIndex >= 50
      ? 'moderate'
      : 'low';

  return {
    logisticsRisk,
    stabilityRisk,
    harvestRisk,
    summary: `logistique ${logisticsRisk}, stabilité ${stabilityRisk}, récoltes ${harvestRisk}`,
  };
}

function buildSeasonSummary(states, seasonLabels, seasonStyleByType) {
  const countsBySeason = Object.create(null);

  for (const state of states) {
    countsBySeason[state.season] = (countsBySeason[state.season] ?? 0) + 1;
  }

  const seasons = Object.entries(countsBySeason)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([season, regionCount]) => ({
      season,
      label: seasonLabels[season] ?? season,
      regionCount,
      badge: normalizeSeasonStyle(seasonStyleByType, season),
    }));

  const dominantSeason = seasons
    .slice()
    .sort((left, right) => {
      if (right.regionCount !== left.regionCount) {
        return right.regionCount - left.regionCount;
      }

      return left.season.localeCompare(right.season);
    })[0] ?? null;

  return {
    title: 'Situation saisonnière',
    summary: seasons.map((entry) => `${entry.label}: ${entry.regionCount}`).join(', '),
    dominantSeason,
    seasons,
  };
}

function buildCatastropheZones(catastropheEntries) {
  return [...new Map(catastropheEntries
    .map((entry) => [entry.catastropheId, entry]))
    .values()]
    .sort((left, right) => left.catastropheId.localeCompare(right.catastropheId))
    .map((entry) => {
      const regionIds = catastropheEntries
        .filter((candidate) => candidate.catastropheId === entry.catastropheId)
        .map((candidate) => candidate.regionId)
        .sort((left, right) => left.localeCompare(right));

      return {
        zoneId: `zone:${entry.catastropheId}`,
        catastropheId: entry.catastropheId,
        type: entry.type,
        severity: entry.severity,
        status: entry.status,
        label: entry.label,
        regionIds,
        outline: {
          stroke: entry.style.stroke,
          pattern: 'ring',
          opacity: Math.min(1, entry.style.opacity + 0.2),
        },
        fill: {
          color: entry.style.fill,
          opacity: Math.max(0.12, entry.style.opacity - 0.1),
        },
      };
    });
}

function buildTurnProgression(state, progressionByRegion) {
  const progression = progressionByRegion[state.regionId] ?? null;

  if (!progression) {
    return null;
  }

  return {
    seasonChanged: progression.seasonChanged,
    temperatureDelta: progression.temperatureDelta,
    precipitationDelta: progression.precipitationDelta,
    droughtDelta: progression.droughtDelta,
    summary: progression.summary,
  };
}

function buildTacticalClimateTheme(regions, catastropheEntries) {
  const criticalCount = regions.filter((region) => region.strategicImpact === 'critical').length;

  return {
    visualMode: 'tactical-dark',
    className: 'climate-hud climate-hud--pax-dark',
    palette: {
      background: '#020817',
      glass: 'rgba(3, 10, 22, 0.72)',
      border: 'rgba(125, 211, 252, 0.24)',
      accent: criticalCount > 0 ? '#f59e0b' : '#67e8f9',
      danger: '#fb7185',
      text: '#e2e8f0',
    },
    layers: {
      regionFill: 'low-opacity-season-wash',
      anomalyGlyphs: 'minimal-cyan-amber-markers',
      catastropheRings: catastropheEntries.length > 0 ? 'thin-glowing-alert-rings' : 'standby-grid',
      coordinateGrid: true,
    },
    panel: {
      surface: 'frosted-glass',
      density: 'compact',
      typography: 'technical-sans',
    },
  };
}


function buildSeasonVisualEffect(region, stateEntry) {
  return {
    effectId: `${region.regionId}:season-wash`,
    regionId: region.regionId,
    kind: 'season-wash',
    layer: 'atmosphere-base',
    season: region.season,
    tone: stateEntry?.tone ?? 'info',
    accent: stateEntry?.badge?.accent ?? 'slate',
    vector: {
      primitive: 'soft-gradient-field',
      blendMode: 'screen',
      opacity: region.strategicImpact === 'stable' ? 0.18 : 0.26,
    },
  };
}

function buildAnomalyVisualEffect(entry) {
  return {
    effectId: `${entry.regionId}:anomaly-glyph:${entry.label}`,
    regionId: entry.regionId,
    kind: 'anomaly-glyph',
    layer: 'atmosphere-alerts',
    anomaly: entry.label,
    tone: entry.tone,
    accent: entry.marker.accent,
    vector: {
      primitive: 'minimal-orbital-glyph',
      icon: entry.marker.icon,
      stroke: entry.marker.accent,
      animation: 'slow-scan-pulse',
    },
  };
}

function buildCatastropheVisualEffect(entry) {
  return {
    effectId: `${entry.regionId}:catastrophe-ring:${entry.catastropheId}`,
    regionId: entry.regionId,
    kind: 'catastrophe-ring',
    layer: 'atmosphere-alerts',
    catastropheId: entry.catastropheId,
    severity: entry.severity,
    tone: entry.severity === 'critical' ? 'danger' : 'warning',
    vector: {
      primitive: entry.status === 'active' ? 'pulsing-contour-ring' : 'dashed-warning-contour',
      stroke: entry.style.stroke,
      fill: entry.style.fill,
      opacity: Math.min(1, entry.style.opacity + 0.18),
    },
  };
}

function buildAtmosphericSignal(region) {
  const intensity = region.strategicImpact === 'critical'
    ? 'high'
    : region.strategicImpact === 'strained'
      ? 'medium'
      : 'low';

  return {
    effectId: `${region.regionId}:atmospheric-signal`,
    regionId: region.regionId,
    kind: 'atmospheric-signal',
    layer: 'coordinate-grid',
    intensity,
    vector: {
      primitive: 'wind-line-field',
      density: intensity === 'high' ? 'dense' : intensity === 'medium' ? 'measured' : 'sparse',
      color: intensity === 'high' ? 'amber' : 'cyan',
    },
    summary: `${region.seasonLabel}, ${region.strategicImpact}`,
  };
}

function buildClimateVisualEffects(regions, stateEntries, catastropheEntries) {
  const seasonEntriesByRegion = new Map(stateEntries
    .filter((entry) => entry.kind === 'season')
    .map((entry) => [entry.regionId, entry]));

  return [
    ...regions.map((region) => buildSeasonVisualEffect(region, seasonEntriesByRegion.get(region.regionId))),
    ...stateEntries.filter((entry) => entry.kind === 'anomaly').map(buildAnomalyVisualEffect),
    ...catastropheEntries.map(buildCatastropheVisualEffect),
    ...regions.map(buildAtmosphericSignal),
  ].sort((left, right) => {
    const regionComparison = left.regionId.localeCompare(right.regionId);

    if (regionComparison !== 0) {
      return regionComparison;
    }

    return left.effectId.localeCompare(right.effectId);
  });
}

function buildRegionalRiskMode(regions) {
  return regions.map((region) => ({
    regionId: region.regionId,
    riskLevel: region.strategicImpact,
    anomaly: region.anomaly,
    activeCatastropheIds: region.activeCatastropheIds,
    signals: region.strategicSignals,
    highlight: {
      tone: region.strategicImpact === 'critical'
        ? 'danger'
        : region.strategicImpact === 'strained'
          ? 'warning'
          : 'calm',
      emphasis: region.strategicImpact === 'critical' ? 'strong' : 'soft',
    },
    summary: `${region.seasonLabel}, ${region.strategicSignals.summary}`,
  }));
}

function buildLegend(stateEntries, catastropheEntries, seasonLabels) {
  const seasonLegend = [...new Set(stateEntries
    .filter((entry) => entry.kind === 'season')
    .map((entry) => entry.season))]
    .sort()
    .map((season) => {
      const seasonEntry = stateEntries.find((entry) => entry.kind === 'season' && entry.season === season);

      return {
        key: `season:${season}`,
        kind: 'season',
        season,
        label: seasonLabels[season] ?? season,
        tone: seasonEntry?.tone ?? 'info',
        icon: seasonEntry?.badge?.icon ?? '◐',
        accent: seasonEntry?.badge?.accent ?? 'slate',
        description: 'Saison dominante affichée pour une région.',
      };
    });

  const anomalyLegend = [...new Map(stateEntries
    .filter((entry) => entry.kind === 'anomaly')
    .map((entry) => [entry.label, {
      key: `anomaly:${entry.label}`,
      kind: 'anomaly',
      label: entry.label,
      tone: entry.tone,
      icon: entry.marker.icon,
      accent: entry.marker.accent,
      description: 'Anomalie climatique active sur la région.',
    }]))
    .entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, legendEntry]) => legendEntry);

  const catastropheLegend = [...new Map(catastropheEntries
    .map((entry) => [entry.severity, {
      key: `catastrophe:${entry.severity}`,
      kind: 'catastrophe',
      severity: entry.severity,
      label: entry.severity,
      icon: entry.style.icon,
      color: entry.style.fill,
      description: 'Catastrophe active ou imminente visible sur la carte.',
    }]))
    .entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, legendEntry]) => legendEntry);

  return {
    title: 'Légende climat',
    compact: true,
    items: [
      ...seasonLegend,
      ...anomalyLegend,
      ...catastropheLegend,
    ],
  };
}

export function buildClimateMapOverlay(climateStates, options = {}) {
  const states = requireArray(climateStates, 'ClimateMapOverlay climateStates').map(normalizeClimateState);
  const normalizedOptions = requireObject(options, 'ClimateMapOverlay options');
  const seasonLabels = requireObject(normalizedOptions.seasonLabels ?? {}, 'ClimateMapOverlay seasonLabels');
  const seasonStyleByType = {
    ...DEFAULT_SEASON_STYLE_BY_TYPE,
    ...requireObject(normalizedOptions.seasonStyleByType ?? {}, 'ClimateMapOverlay seasonStyleByType'),
  };
  const anomalyStyleByType = {
    ...DEFAULT_ANOMALY_STYLE_BY_TYPE,
    ...requireObject(normalizedOptions.anomalyStyleByType ?? {}, 'ClimateMapOverlay anomalyStyleByType'),
  };
  const progressionByRegion = requireObject(normalizedOptions.progressionByRegion ?? {}, 'ClimateMapOverlay progressionByRegion');
  const tacticalHud = Boolean(normalizedOptions.tacticalHud);
  const visualEffects = Boolean(normalizedOptions.visualEffects);
  const catastropheEntries = buildCatastropheMapOverlay(
    normalizedOptions.catastrophes ?? [],
    { styleBySeverity: normalizedOptions.styleBySeverity ?? {}, tacticalHud },
  ).map((entry) => ({
    ...entry,
    kind: 'catastrophe',
  }));

  const stateEntries = states
    .slice()
    .sort((left, right) => left.regionId.localeCompare(right.regionId))
    .flatMap((state) => {
      const entries = [buildSeasonEntry(state, seasonLabels, seasonStyleByType)];
      const anomalyEntry = buildAnomalyEntry(state, anomalyStyleByType);

      if (anomalyEntry) {
        entries.push(anomalyEntry);
      }

      return entries;
    });

  const regions = states
    .slice()
    .sort((left, right) => left.regionId.localeCompare(right.regionId))
    .map((state) => {
      const regionalCatastrophes = catastropheEntries.filter((entry) => entry.regionId === state.regionId);

      const strategicSignals = buildStrategicSignals(state, regionalCatastrophes);

      return {
        regionId: state.regionId,
        season: state.season,
        seasonLabel: seasonLabels[state.season] ?? state.season,
        anomaly: state.anomaly,
        activeCatastropheIds: regionalCatastrophes.map((entry) => entry.catastropheId),
        strategicImpact: buildStrategicImpact(state, regionalCatastrophes),
        strategicSignals,
        turnProgression: buildTurnProgression(state, progressionByRegion),
        temperatureC: state.temperatureC,
        precipitationLevel: state.precipitationLevel,
        droughtIndex: state.droughtIndex,
      };
    });

  return {
    title: 'Carte climat et catastrophes',
    summary: `${states.length} régions, ${catastropheEntries.length} catastrophes visibles, ${regions.filter((region) => region.anomaly !== null).length} anomalies`,
    entries: [...stateEntries, ...catastropheEntries].sort((left, right) => {
      const regionComparison = left.regionId.localeCompare(right.regionId);

      if (regionComparison !== 0) {
        return regionComparison;
      }

      return left.overlayId.localeCompare(right.overlayId);
    }),
    regions,
    seasonalPanel: buildSeasonSummary(states, seasonLabels, seasonStyleByType),
    catastropheZones: buildCatastropheZones(catastropheEntries),
    regionalRiskMode: buildRegionalRiskMode(regions),
    legend: buildLegend(stateEntries, catastropheEntries, seasonLabels),
    ...(tacticalHud ? { tacticalTheme: buildTacticalClimateTheme(regions, catastropheEntries) } : {}),
    ...(visualEffects ? { visualEffects: buildClimateVisualEffects(regions, stateEntries, catastropheEntries) } : {}),
    metrics: {
      regionCount: states.length,
      seasonCount: states.length,
      anomalyCount: stateEntries.filter((entry) => entry.kind === 'anomaly').length,
      catastropheCount: catastropheEntries.length,
      criticalRegionCount: regions.filter((region) => region.strategicImpact === 'critical').length,
      logisticsRiskRegionCount: regions.filter((region) => region.strategicSignals.logisticsRisk !== 'low').length,
      stabilityRiskRegionCount: regions.filter((region) => region.strategicSignals.stabilityRisk !== 'low').length,
      harvestRiskRegionCount: regions.filter((region) => region.strategicSignals.harvestRisk !== 'low').length,
    },
  };
}
