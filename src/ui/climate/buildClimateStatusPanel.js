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

function buildTacticalPanelStyle(climateState, riskLevel) {
  const accent = riskLevel === 'critical'
    ? 'amber-danger'
    : riskLevel === 'watched'
      ? 'cyan-warning'
      : 'cyan-calm';

  return {
    visualMode: 'tactical-dark',
    className: `climate-status-panel climate-status-panel--${riskLevel}`,
    surface: {
      background: 'rgba(3, 10, 22, 0.72)',
      border: riskLevel === 'critical' ? 'rgba(251, 191, 36, 0.42)' : 'rgba(125, 211, 252, 0.24)',
      backdropFilter: 'blur(18px) saturate(1.18)',
      coordinateGrid: true,
    },
    accent,
    readoutMode: 'compact-hud',
    glyphRail: climateState.activeCatastropheIds.length > 0 ? 'alert-stack' : climateState.hasAnomaly() ? 'anomaly-watch' : 'season-only',
  };
}

function buildRiskSummary(climateState) {
  const logistics = climateState.activeCatastropheIds.length > 0
    ? 'élevé'
    : climateState.precipitationLevel < 20 || climateState.droughtIndex >= 55
      ? 'surveillé'
      : 'faible';

  const harvest = climateState.precipitationLevel < 25 || climateState.droughtIndex >= 50
    ? 'fragile'
    : 'soutenu';

  const vigilance = climateState.hasAnomaly() || climateState.activeCatastropheIds.length > 0
    ? 'renforcée'
    : 'normale';

  return {
    logistics,
    harvest,
    vigilance,
    summary: `logistique ${logistics}, récoltes ${harvest}, vigilance ${vigilance}`,
  };
}

export function buildClimateStatusPanel(climateState, options = {}) {
  const normalizedClimateState = normalizeClimateState(climateState);
  const normalizedOptions = requireObject(options, 'ClimateStatusPanel options');
  const turnProgression = normalizedOptions.turnProgression === undefined
    ? null
    : requireObject(normalizedOptions.turnProgression, 'ClimateStatusPanel turnProgression');
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
  const riskSummary = buildRiskSummary(normalizedClimateState);
  const riskLevel = normalizedClimateState.isStable() && !normalizedClimateState.hasAnomaly() && normalizedClimateState.activeCatastropheIds.length === 0
    ? 'stable'
    : normalizedClimateState.activeCatastropheIds.length > 0 || normalizedClimateState.droughtIndex >= 60
      ? 'critical'
      : 'watched';
  const tacticalHud = Boolean(normalizedOptions.tacticalHud);

  return {
    regionId: normalizedClimateState.regionId,
    regionName,
    title: `Climat de ${regionName}`,
    summary: `${seasonLabel}, ${anomalySummary}, ${riskSummary.summary}`,
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
    highlights: [
      {
        key: 'temperature',
        label: 'Température',
        value: `${normalizedClimateState.temperatureC}°C`,
      },
      {
        key: 'precipitation',
        label: 'Précipitations',
        value: `${normalizedClimateState.precipitationLevel}/100`,
      },
      {
        key: 'drought',
        label: 'Sécheresse',
        value: `${normalizedClimateState.droughtIndex}/100`,
      },
    ],
    turnProgression: turnProgression === null
      ? null
      : {
        seasonChanged: Boolean(turnProgression.seasonChanged),
        temperatureDelta: Number(turnProgression.temperatureDelta ?? 0),
        precipitationDelta: Number(turnProgression.precipitationDelta ?? 0),
        droughtDelta: Number(turnProgression.droughtDelta ?? 0),
        summary: requireText(turnProgression.summary ?? '', 'ClimateStatusPanel turnProgression summary'),
      },
    anomalies,
    risks: riskSummary,
    ...(tacticalHud ? { panelStyle: buildTacticalPanelStyle(normalizedClimateState, riskLevel) } : {}),
    metrics: {
      anomalyCount: anomalies.length,
      activeCatastropheCount: normalizedClimateState.activeCatastropheIds.length,
      hasAnomaly: normalizedClimateState.hasAnomaly(),
      riskLevel,
    },
  };
}
