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

function buildSeasonEntry(state, seasonLabels) {
  return {
    overlayId: `${state.regionId}:season`,
    regionId: state.regionId,
    kind: 'season',
    label: seasonLabels[state.season] ?? state.season,
    season: state.season,
    tone: 'info',
  };
}

function buildAnomalyEntry(state) {
  if (!state.hasAnomaly()) {
    return null;
  }

  return {
    overlayId: `${state.regionId}:anomaly:${state.anomaly}`,
    regionId: state.regionId,
    kind: 'anomaly',
    label: state.anomaly,
    season: state.season,
    tone: 'warning',
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

function buildSeasonSummary(states, seasonLabels) {
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
    }));

  return {
    title: 'Situation saisonnière',
    summary: seasons.map((entry) => `${entry.label}: ${entry.regionCount}`).join(', '),
    seasons,
  };
}

function buildLegend(stateEntries, catastropheEntries, seasonLabels) {
  const seasonLegend = [...new Set(stateEntries
    .filter((entry) => entry.kind === 'season')
    .map((entry) => entry.season))]
    .sort()
    .map((season) => ({
      key: `season:${season}`,
      kind: 'season',
      season,
      label: seasonLabels[season] ?? season,
      tone: 'info',
      description: 'Saison dominante affichée pour une région.',
    }));

  const anomalyLegend = [...new Set(stateEntries
    .filter((entry) => entry.kind === 'anomaly')
    .map((entry) => entry.label))]
    .sort((left, right) => left.localeCompare(right))
    .map((anomaly) => ({
      key: `anomaly:${anomaly}`,
      kind: 'anomaly',
      label: anomaly,
      tone: 'warning',
      description: 'Anomalie climatique active sur la région.',
    }));

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
      const entries = [buildSeasonEntry(state, seasonLabels)];
      const anomalyEntry = buildAnomalyEntry(state);

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
    seasonalPanel: buildSeasonSummary(states, seasonLabels),
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
