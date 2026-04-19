import { ClimateState } from '../../domain/climate/ClimateState.js';

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeClimateState(climateState) {
  if (climateState instanceof ClimateState) {
    return climateState;
  }

  if (climateState === null || typeof climateState !== 'object' || Array.isArray(climateState)) {
    throw new TypeError('ClimateStatusPanel climateState must be a ClimateState or plain object.');
  }

  return new ClimateState(climateState);
}

function buildAnomalySummary(anomaly, activeCatastropheIds) {
  const anomalies = [];

  if (anomaly !== null) {
    anomalies.push({
      type: 'anomaly',
      id: anomaly,
      label: anomaly,
      tone: 'warning',
    });
  }

  for (const catastropheId of activeCatastropheIds) {
    anomalies.push({
      type: 'catastrophe',
      id: catastropheId,
      label: catastropheId,
      tone: 'danger',
    });
  }

  return anomalies;
}

export function buildClimateStatusPanel(climateState, options = {}) {
  const normalizedClimateState = normalizeClimateState(climateState);
  const normalizedOptions = requireObject(options, 'ClimateStatusPanel options');
  const regionName = requireText(
    normalizedOptions.regionName ?? normalizedClimateState.regionId,
    'ClimateStatusPanel regionName',
  );
  const seasonLabel = requireText(
    normalizedOptions.seasonLabels?.[normalizedClimateState.season] ?? normalizedClimateState.season,
    'ClimateStatusPanel season label',
  );
  const anomalies = buildAnomalySummary(
    normalizedClimateState.anomaly,
    [...normalizedClimateState.activeCatastropheIds].sort(),
  );
  const anomalySummary = anomalies.length === 0
    ? 'Aucune anomalie'
    : anomalies.map((entry) => entry.label).join(', ');

  return {
    regionId: normalizedClimateState.regionId,
    regionName,
    title: `Climat de ${regionName}`,
    summary: `${seasonLabel}, ${anomalySummary}`,
    season: {
      id: normalizedClimateState.season,
      label: seasonLabel,
    },
    readings: {
      temperatureC: normalizedClimateState.temperatureC,
      precipitationLevel: normalizedClimateState.precipitationLevel,
      droughtIndex: normalizedClimateState.droughtIndex,
      stability: normalizedClimateState.isStable() ? 'stable' : 'volatile',
    },
    anomalies,
    metrics: {
      anomalyCount: anomalies.length,
      activeCatastropheCount: normalizedClimateState.activeCatastropheIds.length,
      hasAnomaly: normalizedClimateState.hasAnomaly(),
    },
  };
}
