function normalizeText(value, fallback = '') {
  return String(value ?? fallback).trim() || fallback;
}

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

const RISK_SCORE = Object.freeze({ stable: 0, strained: 1, critical: 2 });

function getRiskScore(riskLevel) {
  return RISK_SCORE[normalizeText(riskLevel, 'strained')] ?? 1;
}

function getSelectedRisk(climateOverlay, regionId) {
  const comparison = climateOverlay?.selectedClimateImpactComparison;

  if (comparison?.current?.riskLevel) {
    return comparison.current.riskLevel;
  }

  const region = (climateOverlay?.regions ?? []).find((candidate) => candidate.regionId === regionId);
  return region?.strategicImpact ?? null;
}

function getSelectedAnomaly(climateOverlay, regionId) {
  const comparison = climateOverlay?.selectedClimateImpactComparison;

  if (comparison?.current) {
    return comparison.current.anomaly ?? null;
  }

  const region = (climateOverlay?.regions ?? []).find((candidate) => candidate.regionId === regionId);
  return region?.anomaly ?? null;
}

function buildDelta(delta) {
  return {
    deltaId: delta.deltaId,
    tone: delta.tone,
    label: delta.label,
    value: delta.value,
    reason: delta.reason,
    regionId: delta.regionId,
    forecast: delta.forecast ?? null,
    realized: delta.realized ?? null,
  };
}

function buildRiskDelta({ regionId, currentRisk, previousRisk, currentAnomaly, previousAnomaly }) {
  if (!currentRisk && !previousRisk) {
    return null;
  }

  const currentScore = getRiskScore(currentRisk ?? previousRisk);
  const previousScore = getRiskScore(previousRisk ?? currentRisk);
  const riskDelta = currentScore - previousScore;

  if (riskDelta !== 0) {
    return buildDelta({
      deltaId: `${regionId}:climate:risk`,
      tone: riskDelta < 0 ? 'improved' : 'worse',
      label: riskDelta < 0 ? 'Risque climat réduit' : 'Risque climat accru',
      value: `${previousRisk ?? 'inconnu'} → ${currentRisk ?? 'inconnu'}`,
      reason: riskDelta < 0
        ? 'Le dernier tour a fait baisser la pression climat visible.'
        : 'Le dernier tour a renforcé la pression climat ou catastrophe.',
      regionId,
      realized: { previousRiskLevel: previousRisk ?? null, currentRiskLevel: currentRisk ?? null },
    });
  }

  if ((currentAnomaly ?? null) !== (previousAnomaly ?? null)) {
    return buildDelta({
      deltaId: `${regionId}:climate:anomaly`,
      tone: currentAnomaly ? 'worse' : 'improved',
      label: currentAnomaly ? 'Anomalie apparue' : 'Anomalie résorbée',
      value: currentAnomaly ? `${currentAnomaly}` : `${previousAnomaly} terminée`,
      reason: currentAnomaly
        ? 'Un signal météo impose de relire les choix de mitigation.'
        : 'Le signal météo précédent ne pèse plus sur la province.',
      regionId,
      realized: { previousAnomaly: previousAnomaly ?? null, currentAnomaly: currentAnomaly ?? null },
    });
  }

  return buildDelta({
    deltaId: `${regionId}:climate:stable`,
    tone: 'neutral',
    label: 'Climat stable',
    value: currentRisk ?? 'stable',
    reason: 'Aucun changement de risque climat notable ce tour.',
    regionId,
    realized: { previousRiskLevel: previousRisk ?? null, currentRiskLevel: currentRisk ?? null },
  });
}

function buildRecoveryDelta(regionId, previousForecast, realizedRecoveryByChoiceId) {
  const forecasts = previousForecast?.forecasts ?? [];

  if (forecasts.length === 0) {
    return null;
  }

  const expected = forecasts[0];
  const realized = realizedRecoveryByChoiceId?.[expected.choiceId] ?? null;
  const realizedWindowDays = realized?.recoveryWindowDays ?? expected.recoveryWindowDays;
  const deltaDays = realizedWindowDays - expected.recoveryWindowDays;

  return buildDelta({
    deltaId: `${regionId}:climate:recovery:${expected.choiceId}`,
    tone: deltaDays <= 0 ? 'improved' : deltaDays <= 4 ? 'partial' : 'worse',
    label: deltaDays <= 0 ? 'Récupération engagée' : deltaDays <= 4 ? 'Récupération partielle' : 'Récupération retardée',
    value: `${expected.label} · prévu ${expected.recoveryWindowDays}j / réalisé ${realizedWindowDays}j`,
    reason: realized?.summary ?? expected.summary,
    regionId,
    forecast: {
      choiceId: expected.choiceId,
      recoveryWindowDays: expected.recoveryWindowDays,
      relapseRisk: expected.relapseRisk,
      nextCriticalSeason: expected.nextCriticalSeason,
    },
    realized: {
      recoveryWindowDays: realizedWindowDays,
      relapseRisk: realized?.relapseRisk ?? expected.relapseRisk,
      status: realized?.status ?? (deltaDays <= 0 ? 'on-track' : 'partial'),
    },
  });
}

function buildUpcomingDelta(regionId, climateOverlay, upcomingSeason) {
  const timing = climateOverlay?.selectedClimateTimingRecommendation;
  const preview = climateOverlay?.seasonPreview;
  const label = normalizeText(upcomingSeason ?? preview?.previewLabel ?? timing?.previewSeason, 'saison suivante');

  if (!timing || timing.state === 'no-selection' || timing.state === 'missing-climate-data') {
    return null;
  }

  if (timing.direction === 'riskier' || timing.urgency === 'act-before-preview') {
    return buildDelta({
      deltaId: `${regionId}:climate:upcoming-risk`,
      tone: 'warning',
      label: 'Saison critique proche',
      value: label,
      reason: timing.copy,
      regionId,
      forecast: { direction: timing.direction, urgency: timing.urgency },
    });
  }

  if (timing.direction === 'safer') {
    return buildDelta({
      deltaId: `${regionId}:climate:upcoming-window`,
      tone: 'improved',
      label: 'Fenêtre météo favorable',
      value: label,
      reason: timing.copy,
      regionId,
      forecast: { direction: timing.direction, urgency: timing.urgency },
    });
  }

  return null;
}

function dedupeAndSort(deltas) {
  const toneRank = { worse: 6, warning: 5, partial: 4, improved: 3, neutral: 1 };

  const deltaPriority = (delta) => delta.deltaId.includes(':risk')
    ? 20
    : delta.deltaId.includes(':recovery')
      ? 15
      : delta.deltaId.includes(':upcoming')
        ? 10
        : 0;

  return [...new Map(deltas.filter(Boolean).map((delta) => [delta.deltaId, delta])).values()]
    .sort((left, right) => {
      const priorityComparison = deltaPriority(right) - deltaPriority(left);

      if (priorityComparison !== 0) {
        return priorityComparison;
      }

      return (toneRank[right.tone] ?? 0) - (toneRank[left.tone] ?? 0) || left.label.localeCompare(right.label);
    })
    .slice(0, 4);
}

export function buildClimateTurnReportDeltas({
  turn = 1,
  selectedRegionId,
  climateOverlay = null,
  previousClimateOverlay = null,
  previousRecoveryForecast = null,
  realizedRecoveryByChoiceId = {},
  upcomingSeason = null,
} = {}) {
  requireObject(realizedRecoveryByChoiceId, 'ClimateTurnReportDeltas realizedRecoveryByChoiceId');

  const regionId = normalizeText(selectedRegionId ?? climateOverlay?.selectedClimateImpactComparison?.regionId, 'province');
  const currentRisk = getSelectedRisk(climateOverlay, regionId);
  const previousRisk = getSelectedRisk(previousClimateOverlay, regionId) ?? previousRecoveryForecast?.summary?.currentRiskLevel ?? null;
  const currentAnomaly = getSelectedAnomaly(climateOverlay, regionId);
  const previousAnomaly = getSelectedAnomaly(previousClimateOverlay, regionId);
  const deltas = dedupeAndSort([
    buildRiskDelta({ regionId, currentRisk, previousRisk, currentAnomaly, previousAnomaly }),
    buildRecoveryDelta(regionId, previousRecoveryForecast ?? climateOverlay?.selectedClimateRecoveryForecast, realizedRecoveryByChoiceId),
    buildUpcomingDelta(regionId, climateOverlay, upcomingSeason),
  ]);

  if (deltas.length === 0) {
    return {
      state: 'quiet',
      turn,
      regionId,
      summary: 'Aucun delta climat/catastrophe visible ce tour.',
      deltas: [],
    };
  }

  const worseCount = deltas.filter((delta) => delta.tone === 'worse' || delta.tone === 'warning').length;
  const improvedCount = deltas.filter((delta) => delta.tone === 'improved').length;
  const state = worseCount > 0 ? 'risk' : improvedCount > 0 ? 'recovery' : 'stable';
  const lead = deltas[0];

  return {
    state,
    turn,
    regionId,
    summary: `Tour ${turn}: ${lead.label} — ${lead.value}.`,
    deltas,
  };
}
