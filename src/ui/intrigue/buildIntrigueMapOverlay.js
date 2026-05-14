import { Cellule } from '../../domain/intrigue/Cellule.js';
import { OperationClandestine } from '../../domain/intrigue/OperationClandestine.js';

const DEFAULT_STYLE_BY_PRESENCE = Object.freeze({
  none: { marker: '○', color: '#6B7280', opacity: 0.2 },
  low: { marker: '◔', color: '#2563EB', opacity: 0.35 },
  medium: { marker: '◑', color: '#7C3AED', opacity: 0.5 },
  high: { marker: '●', color: '#DC2626', opacity: 0.65 },
});

const DEFAULT_STYLE_BY_RISK = Object.freeze({
  none: { stroke: '#6B7280', fill: '#6B7280', emphasis: 'low' },
  low: { stroke: '#2563EB', fill: '#93C5FD', emphasis: 'normal' },
  medium: { stroke: '#D97706', fill: '#FCD34D', emphasis: 'elevated' },
  high: { stroke: '#DC2626', fill: '#FCA5A5', emphasis: 'high' },
});

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function normalizeCellule(cellule) {
  if (cellule instanceof Cellule) {
    return cellule;
  }

  if (cellule === null || typeof cellule !== 'object' || Array.isArray(cellule)) {
    throw new TypeError('IntrigueMapOverlay cellules must be Cellule instances or plain objects.');
  }

  return new Cellule(cellule);
}

function normalizeOperation(operation) {
  if (operation instanceof OperationClandestine) {
    return operation;
  }

  if (operation === null || typeof operation !== 'object' || Array.isArray(operation)) {
    throw new TypeError('IntrigueMapOverlay operations must be OperationClandestine instances or plain objects.');
  }

  return new OperationClandestine(operation);
}

function clampPercent(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolvePresenceLevel(cellCount) {
  if (cellCount <= 0) {
    return 'none';
  }

  if (cellCount === 1) {
    return 'low';
  }

  if (cellCount === 2) {
    return 'medium';
  }

  return 'high';
}

function resolveRiskLevel(score) {
  if (score <= 0) {
    return 'none';
  }

  if (score < 35) {
    return 'low';
  }

  if (score < 70) {
    return 'medium';
  }

  return 'high';
}

function buildSabotageThreatScore(operation) {
  return clampPercent((operation.progress + operation.heat + (100 - operation.detectionRisk)) / 3);
}

function buildPostSweepGaps({ sleeperCellCount, sabotageRiskScore, unknownsRemaining }) {
  if (unknownsRemaining <= 0 && sabotageRiskScore < 70) {
    return [];
  }

  return [
    unknownsRemaining > 0 ? {
      key: 'unconfirmed-presence',
      label: 'Présence non confirmée',
      reason: `${unknownsRemaining} signal${unknownsRemaining > 1 ? 'aux' : ''} rester${unknownsRemaining > 1 ? 'ont' : 'a'} à qualifier après le sweep.`,
    } : null,
    sleeperCellCount > 0 && unknownsRemaining > 0 ? {
      key: 'sleeper-uncertainty',
      label: 'Dormance encore possible',
      reason: 'Le sweep bas-risque peut confirmer la zone sans lever toute ambiguïté dormante.',
    } : null,
    sabotageRiskScore >= 70 ? {
      key: 'residual-sabotage-pressure',
      label: 'Pression sabotage résiduelle',
      reason: 'Le risque visible reste élevé; éviter toute attribution ou cible cachée après la passe.',
    } : null,
  ].filter(Boolean);
}

function buildSecondSweepCandidateInputs({ postSweepGaps, unknownsRemaining, sleeperCellCount, sabotageRiskScore, exposureAdded }) {
  const gapByKey = new Map(postSweepGaps.map((gap) => [gap.key, gap]));

  return [
    gapByKey.has('unconfirmed-presence') ? {
      gapKey: 'unconfirmed-presence',
      coverageValue: Math.max(1, unknownsRemaining),
      estimatedExposureAdded: Math.max(3, exposureAdded - 2),
      reason: `Qualifie ${Math.max(1, unknownsRemaining)} signal${unknownsRemaining > 1 ? 'aux' : ''} restant${unknownsRemaining > 1 ? 's' : ''} sans élargir la fenêtre d'exposition.`,
    } : null,
    gapByKey.has('sleeper-uncertainty') ? {
      gapKey: 'sleeper-uncertainty',
      coverageValue: Math.max(1, sleeperCellCount),
      estimatedExposureAdded: Math.max(2, exposureAdded - 4),
      reason: 'Passe courte centrée sur la dormance: couverture limitée mais exposition minimale.',
    } : null,
    gapByKey.has('residual-sabotage-pressure') ? {
      gapKey: 'residual-sabotage-pressure',
      coverageValue: sabotageRiskScore >= 85 ? 2 : 1,
      estimatedExposureAdded: Math.max(4, exposureAdded),
      reason: 'Vérifie la pression sabotage visible sans attribuer de cible cachée.',
    } : null,
  ].filter(Boolean);
}

function buildNextSafeSweep({ postSweepGaps, unknownsRemaining, sleeperCellCount, sabotageRiskScore, exposureAdded }) {
  if (postSweepGaps.length === 0) {
    return null;
  }

  const gapByKey = new Map(postSweepGaps.map((gap) => [gap.key, gap]));
  const safest = buildSecondSweepCandidateInputs({
    postSweepGaps,
    unknownsRemaining,
    sleeperCellCount,
    sabotageRiskScore,
    exposureAdded,
  })
    .sort((left, right) => (
      left.estimatedExposureAdded - right.estimatedExposureAdded
      || right.coverageValue - left.coverageValue
      || left.gapKey.localeCompare(right.gapKey)
    ))[0];
  const gap = gapByKey.get(safest.gapKey);

  return {
    targetGapKey: gap.key,
    targetGapLabel: gap.label,
    coverageValue: safest.coverageValue,
    estimatedExposureAdded: clampPercent(safest.estimatedExposureAdded),
    estimatedHeat: clampPercent(Math.ceil(safest.estimatedExposureAdded * 1.5)),
    safetyReason: safest.reason,
  };
}

function buildSecondSweepCandidates({ postSweepGaps, unknownsRemaining, sleeperCellCount, sabotageRiskScore, exposureAdded, nextSafeSweep }) {
  if (postSweepGaps.length < 2 || nextSafeSweep === null) {
    return [];
  }

  const gapByKey = new Map(postSweepGaps.map((gap) => [gap.key, gap]));

  return buildSecondSweepCandidateInputs({
    postSweepGaps,
    unknownsRemaining,
    sleeperCellCount,
    sabotageRiskScore,
    exposureAdded,
  })
    .map((candidate) => {
      const gap = gapByKey.get(candidate.gapKey);
      const estimatedExposureAdded = clampPercent(candidate.estimatedExposureAdded);
      const estimatedHeat = clampPercent(Math.ceil(candidate.estimatedExposureAdded * 1.5));
      const exposureCost = Math.max(1, estimatedExposureAdded + estimatedHeat);
      const coveragePerExposureScore = Number(((candidate.coverageValue * 100) / exposureCost).toFixed(1));

      return {
        targetGapKey: gap.key,
        targetGapLabel: gap.label,
        coverageValue: candidate.coverageValue,
        estimatedExposureAdded,
        estimatedHeat,
        coveragePerExposureScore,
        recommended: gap.key === nextSafeSweep.targetGapKey,
        reason: candidate.reason,
      };
    })
    .sort((left, right) => (
      right.coveragePerExposureScore - left.coveragePerExposureScore
      || left.estimatedExposureAdded - right.estimatedExposureAdded
      || left.targetGapKey.localeCompare(right.targetGapKey)
    ))
    .slice(0, 3);
}

function buildSecondSweepStopCondition({ nextSafeSweep, unknownsRemaining, sabotageRiskScore }) {
  if (nextSafeSweep === null) {
    return {
      state: 'no-safe-sweep',
      action: 'stop',
      continueNow: false,
      stopSignal: 'Aucun second sweep sûr n’est disponible dans la fenêtre actuelle.',
      explanation: 'Ne pas enchaîner: attendre un signal lisible avant de rouvrir la zone.',
    };
  }

  const exposure = nextSafeSweep.estimatedExposureAdded;
  const heat = nextSafeSweep.estimatedHeat;

  if (exposure >= 14 || heat >= 21) {
    return {
      state: 'exposure-too-high',
      action: 'stop',
      continueNow: false,
      stopSignal: `Stop si le second sweep ajoute ${exposure} exposition ou ${heat} heat.`,
      explanation: 'La limite de sécurité serait dépassée; garder la zone froide avant toute nouvelle passe.',
    };
  }

  if (unknownsRemaining <= 0 && nextSafeSweep.targetGapKey === 'residual-sabotage-pressure') {
    return {
      state: 'needs-fresh-signal',
      action: 'wait-for-signal',
      continueNow: false,
      stopSignal: 'Stop tant qu’aucun nouveau signal bas-risque ne justifie de rouvrir la pression sabotage.',
      explanation: 'La couverture utile est déjà lisible; attendre un signal frais évite une exposition gratuite.',
    };
  }

  if (sabotageRiskScore >= 90 && heat >= 18) {
    return {
      state: 'wait-cooler-window',
      action: 'wait',
      continueNow: false,
      stopSignal: `Attendre si le heat estimé reste à ${heat} dans une zone déjà chaude.`,
      explanation: 'La prochaine passe reste plausible, mais une fenêtre plus froide protège mieux le réseau.',
    };
  }

  if (exposure <= 8 && heat <= 12) {
    return {
      state: 'continue-now',
      action: 'continue',
      continueNow: true,
      stopSignal: `Continuer tant que l’exposition ajoutée reste ≤ 8 et le heat ≤ 12.`,
      explanation: 'Le second sweep recommandé couvre le gap prioritaire avec une exposition contenue.',
    };
  }

  return {
    state: 'wait-cooler-window',
    action: 'wait',
    continueNow: false,
    stopSignal: `Attendre une fenêtre plus froide si l’exposition reste à ${exposure} ou le heat à ${heat}.`,
    explanation: 'La recommandation reste valable, mais le coût d’exposition mérite une pause avant enchaînement.',
  };
}

function buildThirdSweepRecommendation({ secondSweepStopCondition, nextSafeSweep, unknownsRemaining, sabotageRiskScore }) {
  if (nextSafeSweep === null || secondSweepStopCondition.state === 'no-safe-sweep') {
    return {
      state: 'do-nothing',
      action: 'none',
      prepareThirdSweep: false,
      marginalExposureAdded: 0,
      expectedConfidenceGain: 0,
      rationale: 'Aucun troisième sweep à préparer: la seconde passe n’a pas de fenêtre sûre.',
    };
  }

  if (secondSweepStopCondition.state === 'exposure-too-high') {
    return {
      state: 'stop-after-second',
      action: 'stop',
      prepareThirdSweep: false,
      marginalExposureAdded: clampPercent(nextSafeSweep.estimatedExposureAdded + 3),
      expectedConfidenceGain: 0,
      rationale: 'Arrêter: une troisième passe ajouterait trop d’exposition marginale après une seconde déjà chaude.',
    };
  }

  if (secondSweepStopCondition.state === 'needs-fresh-signal') {
    return {
      state: 'monitor-only',
      action: 'monitor',
      prepareThirdSweep: false,
      marginalExposureAdded: clampPercent(Math.max(3, nextSafeSweep.estimatedExposureAdded - 1)),
      expectedConfidenceGain: 0,
      rationale: 'Surveiller seulement: attendre un signal frais avant de préparer une troisième passe.',
    };
  }

  if (secondSweepStopCondition.state === 'wait-cooler-window') {
    return {
      state: 'monitor-cooldown',
      action: 'monitor',
      prepareThirdSweep: false,
      marginalExposureAdded: clampPercent(nextSafeSweep.estimatedExposureAdded),
      expectedConfidenceGain: clampPercent(Math.min(8, unknownsRemaining * 3)),
      rationale: 'Surveiller: le gain attendu ne justifie pas encore le coût tant que la fenêtre ne refroidit pas.',
    };
  }

  if (unknownsRemaining >= 2 && nextSafeSweep.estimatedExposureAdded <= 8 && sabotageRiskScore < 90) {
    const marginalExposureAdded = clampPercent(nextSafeSweep.estimatedExposureAdded + 2);
    const expectedConfidenceGain = clampPercent(Math.min(18, 6 + unknownsRemaining * 4));

    return {
      state: 'prepare-third-safe-sweep',
      action: 'prepare',
      prepareThirdSweep: true,
      marginalExposureAdded,
      expectedConfidenceGain,
      rationale: `Préparer une troisième passe prudente: ${unknownsRemaining} inconnues resteraient et le gain de confiance attendu dépasse l’exposition marginale.`,
    };
  }

  return {
    state: 'stop-after-second',
    action: 'stop',
    prepareThirdSweep: false,
    marginalExposureAdded: clampPercent(nextSafeSweep.estimatedExposureAdded + 1),
    expectedConfidenceGain: clampPercent(Math.min(5, unknownsRemaining * 3)),
    rationale: 'Arrêter après la seconde passe: le gain restant serait trop faible par rapport à l’exposition marginale.',
  };
}

function buildLowExposureSweepConfidencePreview({ celluleCount, exposedCellCount, sleeperCellCount, sabotageRiskScore }) {
  if (celluleCount <= 0 || sabotageRiskScore <= 0 || exposedCellCount >= celluleCount) {
    return {
      state: 'neutral',
      recommended: false,
      coverageBefore: 0,
      coverageAfter: 0,
      confidenceDelta: 0,
      exposureAdded: 0,
      unknownsRemaining: Math.max(0, celluleCount - exposedCellCount),
      postSweepGaps: [],
      nextSafeSweep: null,
      secondSweepCandidates: [],
      secondSweepStopCondition: buildSecondSweepStopCondition({
        nextSafeSweep: null,
        unknownsRemaining: Math.max(0, celluleCount - exposedCellCount),
        sabotageRiskScore,
      }),
      thirdSweepRecommendation: buildThirdSweepRecommendation({
        secondSweepStopCondition: buildSecondSweepStopCondition({
          nextSafeSweep: null,
          unknownsRemaining: Math.max(0, celluleCount - exposedCellCount),
          sabotageRiskScore,
        }),
        nextSafeSweep: null,
        unknownsRemaining: Math.max(0, celluleCount - exposedCellCount),
        sabotageRiskScore,
      }),
      summary: 'Aucun sweep low-exposure recommandé: signal insuffisant ou couverture déjà lisible.',
    };
  }

  const coverageBefore = clampPercent((exposedCellCount / celluleCount) * 100);
  const safeGain = sleeperCellCount > 0 ? 18 : 28;
  const riskAdjustment = sabotageRiskScore >= 70 ? 8 : sabotageRiskScore >= 35 ? 5 : 3;
  const coverageAfter = clampPercent(Math.min(95, coverageBefore + safeGain + riskAdjustment));
  const confidenceDelta = Math.max(0, coverageAfter - coverageBefore);
  const exposureAdded = clampPercent(4 + sleeperCellCount * 3 + (sabotageRiskScore >= 70 ? 5 : sabotageRiskScore >= 35 ? 3 : 1));
  const unknownsRemaining = Math.max(0, celluleCount - exposedCellCount - (confidenceDelta >= 30 ? 2 : 1));
  const postSweepGaps = buildPostSweepGaps({ sleeperCellCount, sabotageRiskScore, unknownsRemaining });
  const nextSafeSweep = buildNextSafeSweep({
    postSweepGaps,
    unknownsRemaining,
    sleeperCellCount,
    sabotageRiskScore,
    exposureAdded,
  });
  const secondSweepCandidates = buildSecondSweepCandidates({
    postSweepGaps,
    unknownsRemaining,
    sleeperCellCount,
    sabotageRiskScore,
    exposureAdded,
    nextSafeSweep,
  });
  const secondSweepStopCondition = buildSecondSweepStopCondition({
    nextSafeSweep,
    unknownsRemaining,
    sabotageRiskScore,
  });
  const thirdSweepRecommendation = buildThirdSweepRecommendation({
    secondSweepStopCondition,
    nextSafeSweep,
    unknownsRemaining,
    sabotageRiskScore,
  });
  const state = exposureAdded <= 8
    ? 'low-exposure-positive'
    : exposureAdded < 12
      ? 'guarded-positive'
      : 'watch-exposure';

  return {
    state,
    recommended: true,
    coverageBefore,
    coverageAfter,
    confidenceDelta,
    exposureAdded,
    unknownsRemaining,
    postSweepGaps,
    nextSafeSweep,
    secondSweepCandidates,
    secondSweepStopCondition,
    thirdSweepRecommendation,
    summary: `Confiance +${confidenceDelta} pts pour +${exposureAdded} exposition; ${unknownsRemaining} inconnue${unknownsRemaining > 1 ? 's' : ''} restante${unknownsRemaining > 1 ? 's' : ''}.`,
  };
}

function normalizeStyle(styleMap, key, defaults) {
  const style = styleMap[key] ?? styleMap.default ?? defaults[key] ?? defaults.none;
  const fallback = defaults[key] ?? defaults.none;

  return Object.fromEntries(
    Object.entries({ ...fallback, ...style }).map(([styleKey, styleValue]) => [
      styleKey,
      typeof fallback[styleKey] === 'number'
        ? Number.isFinite(styleValue) ? styleValue : fallback[styleKey]
        : String(styleValue ?? fallback[styleKey]).trim() || fallback[styleKey],
    ]),
  );
}

export function buildIntrigueMapOverlay(cellules, operations = [], options = {}) {
  if (!Array.isArray(cellules)) {
    throw new TypeError('IntrigueMapOverlay cellules must be an array.');
  }

  if (!Array.isArray(operations)) {
    throw new TypeError('IntrigueMapOverlay operations must be an array.');
  }

  const normalizedOptions = requireObject(options, 'IntrigueMapOverlay options');
  const styleByPresence = {
    ...DEFAULT_STYLE_BY_PRESENCE,
    ...requireObject(normalizedOptions.styleByPresence ?? {}, 'IntrigueMapOverlay styleByPresence'),
  };
  const styleByRisk = {
    ...DEFAULT_STYLE_BY_RISK,
    ...requireObject(normalizedOptions.styleByRisk ?? {}, 'IntrigueMapOverlay styleByRisk'),
  };
  const locationNames = requireObject(normalizedOptions.locationNames ?? {}, 'IntrigueMapOverlay locationNames');

  const normalizedCellules = cellules
    .map(normalizeCellule)
    .filter((cellule) => cellule.status !== 'dismantled');
  const normalizedOperations = operations
    .map(normalizeOperation)
    .filter((operation) => operation.type === 'sabotage' && !operation.isResolved);

  const locationIds = new Set([
    ...normalizedCellules.map((cellule) => cellule.locationId),
    ...normalizedOperations.map((operation) => operation.theaterId),
  ]);

  return [...locationIds]
    .sort((left, right) => left.localeCompare(right))
    .map((locationId) => {
      const locationCellules = normalizedCellules
        .filter((cellule) => cellule.locationId === locationId)
        .sort((left, right) => left.id.localeCompare(right.id));
      const locationOperations = normalizedOperations
        .filter((operation) => operation.theaterId === locationId)
        .sort((left, right) => left.id.localeCompare(right.id));
      const sabotageRiskScore = locationOperations.length === 0
        ? 0
        : Math.max(...locationOperations.map(buildSabotageThreatScore));
      const presenceLevel = resolvePresenceLevel(locationCellules.length);
      const riskLevel = resolveRiskLevel(sabotageRiskScore);
      const exposedCellCount = locationCellules.filter((cellule) => cellule.isExposed).length;
      const sleeperCellCount = locationCellules.filter((cellule) => cellule.sleeper).length;
      const locationName = String(locationNames[locationId] ?? locationId).trim() || locationId;

      const lowExposureSweepConfidencePreview = buildLowExposureSweepConfidencePreview({
        celluleCount: locationCellules.length,
        exposedCellCount,
        sleeperCellCount,
        sabotageRiskScore,
      });

      return {
        overlayId: `intrigue:${locationId}`,
        locationId,
        locationName,
        label: `${locationName}, présence ${presenceLevel}, risque sabotage ${riskLevel}`,
        presenceLevel,
        sabotageRiskLevel: riskLevel,
        sabotageRiskScore,
        celluleIds: locationCellules.map((cellule) => cellule.id),
        operationIds: locationOperations.map((operation) => operation.id),
        metrics: {
          celluleCount: locationCellules.length,
          exposedCellCount,
          sleeperCellCount,
          sabotageOperationCount: locationOperations.length,
        },
        lowExposureSweepConfidencePreview,
        style: {
          presence: normalizeStyle(styleByPresence, presenceLevel, DEFAULT_STYLE_BY_PRESENCE),
          risk: normalizeStyle(styleByRisk, riskLevel, DEFAULT_STYLE_BY_RISK),
        },
      };
    });
}
