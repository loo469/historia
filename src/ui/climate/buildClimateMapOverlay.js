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
  const catastropheEntries = buildCatastropheMapOverlay(
    normalizedOptions.catastrophes ?? [],
    { styleBySeverity: normalizedOptions.styleBySeverity ?? {} },
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

      return {
        regionId: state.regionId,
        season: state.season,
        seasonLabel: seasonLabels[state.season] ?? state.season,
        anomaly: state.anomaly,
        activeCatastropheIds: regionalCatastrophes.map((entry) => entry.catastropheId),
        strategicImpact: buildStrategicImpact(state, regionalCatastrophes),
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
    legend: buildLegend(stateEntries, catastropheEntries, seasonLabels),
    metrics: {
      regionCount: states.length,
      seasonCount: states.length,
      anomalyCount: stateEntries.filter((entry) => entry.kind === 'anomaly').length,
      catastropheCount: catastropheEntries.length,
      criticalRegionCount: regions.filter((region) => region.strategicImpact === 'critical').length,
    },
  };
}
