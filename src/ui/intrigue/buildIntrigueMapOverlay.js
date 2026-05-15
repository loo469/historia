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



function buildMonitoringChecklist({ state, monitoringPreferred, marginalExposureAdded, expectedConfidenceGain }) {
  const exposure = clampPercent(marginalExposureAdded);
  const confidenceGain = clampPercent(expectedConfidenceGain);

  if (state === 'safe-action-available') {
    return [
      { signal: 'Fenêtre sûre', status: 'déclencheur potentiel', note: 'Relancer si elle reste stable.' },
      { signal: 'Heat', status: 'calme', note: 'Basculer en surveillance si le heat remonte.' },
      { signal: 'Gain confiance', status: 'déclencheur potentiel', note: `+${confidenceGain} attendu dépasse +${exposure} exposition.` },
    ];
  }

  if (state === 'await-fresh-signal') {
    return [
      { signal: 'Fraîcheur signal', status: 'à surveiller', note: 'Attendre un signal récent avant reprise.' },
      { signal: 'Fenêtre low-risk', status: 'à surveiller', note: 'Relancer seulement si un gap lisible réapparaît.' },
      { signal: 'Exposition', status: 'calme', note: `Rester sous +${Math.max(3, exposure)} exposition marginale.` },
    ];
  }

  if (state === 'heat-too-high') {
    return [
      { signal: 'Heat', status: 'à surveiller', note: 'Attendre une baisse nette avant reprise.' },
      { signal: 'Exposition', status: 'à surveiller', note: `+${exposure} marginal reste trop élevé.` },
      { signal: 'Gain confiance', status: 'calme', note: 'Aucun gain fiable ne justifie la relance.' },
    ];
  }

  if (state === 'wait-for-cooldown') {
    return [
      { signal: 'Cooldown heat', status: 'à surveiller', note: 'Relancer si la fenêtre refroidit.' },
      { signal: 'Gap visible', status: 'déclencheur potentiel', note: 'Reprendre si le gap reste lisible après cooldown.' },
      { signal: 'Exposition', status: 'à surveiller', note: `Comparer +${exposure} exposition au gain +${confidenceGain}.` },
    ];
  }

  if (state === 'low-confidence-gain') {
    return [
      { signal: 'Gain confiance', status: 'à surveiller', note: `Relancer si le gain dépasse +${confidenceGain}.` },
      { signal: 'Signaux frais', status: 'déclencheur potentiel', note: 'Deux signaux convergents peuvent rouvrir une sweep.' },
      { signal: 'Heat', status: 'calme', note: 'Surveillance suffisante tant que le heat reste contenu.' },
    ];
  }

  return [
    { signal: 'Nouveau gap', status: monitoringPreferred ? 'à surveiller' : 'calme', note: 'Relancer seulement avec un gap fog-safe lisible.' },
    { signal: 'Fraîcheur signal', status: 'à surveiller', note: 'Confirmer que le signal n’est pas périmé.' },
    { signal: 'Exposition', status: 'calme', note: 'Ne pas ajouter d’exposition sans gain concret.' },
  ];
}


function buildMonitoringChecklistFocus({ state }) {
  if (state === 'safe-action-available') {
    return {
      signal: 'Fenêtre sûre',
      state: 'earliest-fragile',
      reason: 'Seuil proche: si la fenêtre se ferme, la relance sûre disparaît en premier.',
    };
  }

  if (state === 'await-fresh-signal') {
    return {
      signal: 'Fraîcheur signal',
      state: 'earliest-fragile',
      reason: 'Durée restante: le signal périme avant que la fenêtre low-risk soit confirmée.',
    };
  }

  if (state === 'heat-too-high') {
    return {
      signal: 'Heat',
      state: 'earliest-fragile',
      reason: 'Pression: le heat est le seuil le plus proche de bloquer toute reprise.',
    };
  }

  if (state === 'wait-for-cooldown') {
    return {
      signal: 'Cooldown heat',
      state: 'earliest-fragile',
      reason: 'Durée restante: le cooldown conditionne la première fenêtre de reprise.',
    };
  }

  if (state === 'low-confidence-gain') {
    return {
      signal: 'Signaux frais',
      state: 'earliest-fragile',
      reason: 'Dépendance non sécurisée: sans signaux convergents, le gain reste marginal.',
    };
  }

  return {
    signal: null,
    state: 'stable-for-now',
    reason: 'Checklist stable pour l’instant: aucun item ne menace de tomber avant un nouveau signal.',
  };
}


function buildMonitoringDriftForecast({ state, marginalExposureAdded, expectedConfidenceGain }) {
  const exposure = clampPercent(marginalExposureAdded);
  const confidenceGain = clampPercent(expectedConfidenceGain);

  if (state === 'safe-action-available') {
    return {
      signal: 'Fenêtre sûre',
      state: 'drift-risk',
      direction: 'retards-next-sweep',
      reason: 'Si la fenêtre sûre se referme, le prochain sweep doit attendre un nouveau créneau low-risk.',
    };
  }

  if (state === 'await-fresh-signal') {
    return {
      signal: 'Fraîcheur signal',
      state: 'drift-risk',
      direction: 'retards-next-sweep',
      reason: 'Le signal risque de périmer avant confirmation, ce qui retarde la prochaine relance sûre.',
    };
  }

  if (state === 'heat-too-high') {
    return {
      signal: 'Heat',
      state: 'drift-risk',
      direction: 'retards-next-sweep',
      reason: `Un heat encore haut maintient +${exposure} exposition marginale hors fenêtre sûre.`,
    };
  }

  if (state === 'wait-for-cooldown') {
    return {
      signal: 'Gap visible',
      state: 'drift-risk',
      direction: 'advances-next-sweep',
      reason: 'Si le gap reste visible pendant le cooldown, la prochaine fenêtre sûre arrive plus tôt.',
    };
  }

  if (state === 'low-confidence-gain') {
    return {
      signal: 'Gain confiance',
      state: 'drift-risk',
      direction: 'advances-next-sweep',
      reason: `Des signaux frais peuvent faire passer le gain attendu au-dessus de +${confidenceGain}.`,
    };
  }

  return {
    signal: null,
    state: 'stable-for-now',
    direction: 'no-change',
    reason: 'Aucune dérive probable avant le prochain signal: le calendrier de sweep reste inchangé.',
  };
}


function buildMonitoringPreventiveAction({ state, driftForecast }) {
  if (driftForecast.state !== 'drift-risk') {
    return {
      action: 'hold-monitoring',
      targetSignal: null,
      windowEffect: 'maintains-safe-window',
      reason: 'Aucune micro-action requise: la checklist reste stable avant le prochain signal.',
    };
  }

  if (state === 'safe-action-available') {
    return {
      action: 'secure-exposure',
      targetSignal: driftForecast.signal,
      windowEffect: 'maintains-safe-window',
      reason: 'Sécuriser l’exposition maintenant garde la fenêtre sûre ouverte sans révéler de cible.',
    };
  }

  if (state === 'await-fresh-signal') {
    return {
      action: 'wait-fresh-signal',
      targetSignal: driftForecast.signal,
      windowEffect: 'delays-safe-window',
      reason: 'Attendre un signal frais évite de relancer sur une information qui dérive.',
    };
  }

  if (state === 'heat-too-high') {
    return {
      action: 'reduce-heat',
      targetSignal: driftForecast.signal,
      windowEffect: 'delays-safe-window',
      reason: 'Réduire le heat avant reprise protège la fenêtre sûre contre une exposition trop haute.',
    };
  }

  if (state === 'wait-for-cooldown') {
    return {
      action: 'secure-exposure',
      targetSignal: driftForecast.signal,
      windowEffect: 'advances-safe-window',
      reason: 'Sécuriser le gap visible pendant le cooldown peut avancer la prochaine reprise sûre.',
    };
  }

  if (state === 'low-confidence-gain') {
    return {
      action: 'wait-fresh-signal',
      targetSignal: driftForecast.signal,
      windowEffect: 'advances-safe-window',
      reason: 'Attendre des signaux frais peut transformer un gain marginal en reprise sûre.',
    };
  }

  return {
    action: 'delay-sweep',
    targetSignal: driftForecast.signal,
    windowEffect: 'delays-safe-window',
    reason: 'Retarder le sweep évite de casser la fenêtre sûre sur une dérive non stabilisée.',
  };
}


function buildPreventiveRecoveryState({ preventiveAction }) {
  if (preventiveAction.action === 'secure-exposure' && preventiveAction.windowEffect === 'maintains-safe-window') {
    return {
      state: 'sweep-safe-again',
      targetSignal: preventiveAction.targetSignal,
      nextDecision: 'resume-sweep',
      reason: 'L’exposition sécurisée maintient la fenêtre sûre: le sweep peut reprendre si le signal reste lisible.',
    };
  }

  if (preventiveAction.action === 'secure-exposure' && preventiveAction.windowEffect === 'advances-safe-window') {
    return {
      state: 'sweep-safe-again',
      targetSignal: preventiveAction.targetSignal,
      nextDecision: 'resume-sweep',
      reason: 'Le gap sécurisé pendant le cooldown avance assez la fenêtre pour reprendre prudemment.',
    };
  }

  if (preventiveAction.action === 'wait-fresh-signal') {
    return {
      state: 'monitor-only',
      targetSignal: preventiveAction.targetSignal,
      nextDecision: 'wait-fresh-signal',
      reason: 'La reprise reste surveillable seulement: attendre un signal frais avant tout sweep.',
    };
  }

  if (preventiveAction.action === 'reduce-heat') {
    return {
      state: 'still-too-risky',
      targetSignal: preventiveAction.targetSignal,
      nextDecision: 'reduce-heat',
      reason: 'Le heat reste le point bloquant: réduire la pression avant de rouvrir le sweep.',
    };
  }

  if (preventiveAction.action === 'delay-sweep') {
    return {
      state: 'still-too-risky',
      targetSignal: preventiveAction.targetSignal,
      nextDecision: 'continue-monitoring',
      reason: 'La fenêtre n’est pas assez protégée: retarder le sweep et surveiller encore.',
    };
  }

  return {
    state: 'monitor-only',
    targetSignal: preventiveAction.targetSignal,
    nextDecision: 'continue-monitoring',
    reason: 'La checklist reste stable: maintenir le monitoring sans nouvelle exposition.',
  };
}


function buildPostRecoverySafetyMargin({ preventiveRecoveryState, preventiveAction, driftForecast }) {
  if (driftForecast.signal === null) {
    return {
      level: 'insufficient-data',
      fastestConsumingSignal: null,
      nextAction: 'reinforce-monitoring',
      reason: 'Données de dérive insuffisantes: renforcer le monitoring avant de mesurer une vraie marge.',
    };
  }

  if (preventiveRecoveryState.state === 'sweep-safe-again' && preventiveAction.windowEffect === 'maintains-safe-window') {
    return {
      level: 'comfortable',
      fastestConsumingSignal: driftForecast.signal,
      nextAction: 'launch-sweep',
      reason: `${driftForecast.signal} consomme encore la marge, mais la fenêtre reste assez protégée pour lancer le sweep.`,
    };
  }

  if (preventiveRecoveryState.state === 'sweep-safe-again') {
    return {
      level: 'narrow',
      fastestConsumingSignal: driftForecast.signal,
      nextAction: 'wait-confirmation',
      reason: `${driftForecast.signal} consomme vite la marge: attendre une confirmation courte avant reprise.`,
    };
  }

  if (preventiveRecoveryState.state === 'monitor-only') {
    return {
      level: 'narrow',
      fastestConsumingSignal: driftForecast.signal,
      nextAction: 'wait-confirmation',
      reason: `${driftForecast.signal} laisse une marge surveillable mais pas suffisante pour lancer tout de suite.`,
    };
  }

  return {
    level: 'absent',
    fastestConsumingSignal: driftForecast.signal,
    nextAction: 'reinforce-monitoring',
    reason: `${driftForecast.signal} consomme toute la marge: renforcer le monitoring avant tout sweep.`,
  };
}


function buildPostRecoveryMarginDecay({ postRecoverySafetyMargin, driftForecast }) {
  if (postRecoverySafetyMargin.level === 'insufficient-data' || driftForecast.signal === null) {
    return {
      state: 'insufficient-data',
      responsibleSignal: null,
      trend: 'unknown',
      recommendedAction: 'postpone',
      reason: 'Dérive insuffisamment lisible: reporter le sweep et garder le monitoring actif.',
    };
  }

  if (postRecoverySafetyMargin.level === 'comfortable') {
    return {
      state: 'comfortable-stable',
      responsibleSignal: driftForecast.signal,
      trend: 'holds-until-next-sweep',
      recommendedAction: 'launch-now',
      reason: `${driftForecast.signal} peut encore peser, mais la marge devrait tenir jusqu’au prochain sweep sûr.`,
    };
  }

  if (postRecoverySafetyMargin.level === 'narrow' && driftForecast.direction === 'retards-next-sweep') {
    const recommendedAction = driftForecast.signal === 'Fraîcheur signal' ? 'refresh-signal' : 'launch-now';
    return {
      state: 'expiring-before-next-sweep',
      responsibleSignal: driftForecast.signal,
      trend: 'decays-before-next-sweep',
      recommendedAction,
      reason: `${driftForecast.signal} peut dégrader la marge avant la prochaine fenêtre: agir sans révéler de cible cachée.`,
    };
  }

  if (postRecoverySafetyMargin.level === 'narrow') {
    return {
      state: 'narrow-watch',
      responsibleSignal: driftForecast.signal,
      trend: 'needs-confirmation',
      recommendedAction: 'refresh-signal',
      reason: `${driftForecast.signal} garde une marge étroite: rafraîchir le signal avant de relancer.`,
    };
  }

  if (driftForecast.signal === 'Heat') {
    return {
      state: 'expiring-before-next-sweep',
      responsibleSignal: driftForecast.signal,
      trend: 'decays-before-next-sweep',
      recommendedAction: 'reduce-heat',
      reason: 'Le heat consomme la marge avant la prochaine fenêtre sûre: réduire la pression visible.',
    };
  }

  return {
    state: 'expiring-before-next-sweep',
    responsibleSignal: driftForecast.signal,
    trend: 'decays-before-next-sweep',
    recommendedAction: 'postpone',
    reason: `${driftForecast.signal} laisse une marge absente: reporter jusqu’à une dérive stabilisée.`,
  };
}


function buildMonitoringMarginResponsePriority({ postRecoveryMarginDecay, postRecoverySafetyMargin }) {
  if (postRecoveryMarginDecay.recommendedAction === 'launch-now') {
    return {
      response: 'launch-now',
      priorityFactor: postRecoveryMarginDecay.responsibleSignal ?? 'Fenêtre de sweep',
      label: 'Priorité: lancer maintenant.',
      reason: 'Fenêtre de sweep encore lisible; ne pas laisser la marge se fermer.',
    };
  }

  if (postRecoveryMarginDecay.recommendedAction === 'refresh-signal') {
    return {
      response: 'refresh-signal',
      priorityFactor: postRecoveryMarginDecay.responsibleSignal ?? 'Qualité du signal',
      label: 'Priorité: rafraîchir le signal.',
      reason: 'Qualité du signal fragile; confirmer avant toute relance.',
    };
  }

  if (postRecoveryMarginDecay.recommendedAction === 'reduce-heat') {
    return {
      response: 'reduce-heat',
      priorityFactor: 'Heat',
      label: 'Priorité: réduire heat.',
      reason: 'Heat visible trop haut; baisser la pression avant reprise.',
    };
  }

  return {
    response: 'postpone-neutral',
    priorityFactor: postRecoverySafetyMargin.level === 'insufficient-data' ? 'Données insuffisantes' : 'Marge restante',
    label: 'Priorité: reporter sans urgence.',
    reason: 'Marge non exploitable maintenant; maintenir le monitoring sans révéler de cible.',
  };
}


function buildMonitoringSafeCadence({ monitoringMarginResponsePriority }) {
  if (monitoringMarginResponsePriority.response === 'launch-now') {
    return {
      cadence: 'sweep-now',
      cadenceFactor: monitoringMarginResponsePriority.priorityFactor,
      label: 'Cadence: sweep maintenant.',
      reason: 'Fenêtre visible encore ouverte: lancer avant le prochain tick de dérive.',
    };
  }

  if (monitoringMarginResponsePriority.response === 'refresh-signal') {
    return {
      cadence: 'refresh-then-sweep',
      cadenceFactor: monitoringMarginResponsePriority.priorityFactor,
      label: 'Cadence: rafraîchir puis sweep.',
      reason: 'Qualité du signal pilote le tempo: confirmer, puis relancer court.',
    };
  }

  if (monitoringMarginResponsePriority.response === 'reduce-heat') {
    return {
      cadence: 'space-for-heat',
      cadenceFactor: 'Heat',
      label: 'Cadence: espacer pour heat.',
      reason: 'Espacer les sweeps laisse la pression visible retomber avant reprise.',
    };
  }

  return {
    cadence: 'wait-no-urgency',
    cadenceFactor: monitoringMarginResponsePriority.priorityFactor,
    label: 'Cadence: attendre sans urgence.',
    reason: 'Aucune fenêtre sûre immédiate: maintenir la surveillance sans forcer le rythme.',
  };
}


function buildMonitoringMinimalResumeSignal({ monitoringSafeCadence }) {
  if (monitoringSafeCadence.cadence === 'sweep-now') {
    return {
      prerequisite: 'already-safe',
      visibleFactor: monitoringSafeCadence.cadenceFactor,
      action: 'resume-sweep',
      label: 'Signal minimal: reprise sûre.',
      reason: 'La fenêtre visible suffit déjà: reprendre sans ajouter de révélation cachée.',
    };
  }

  if (monitoringSafeCadence.cadence === 'refresh-then-sweep') {
    return {
      prerequisite: 'fresh-signal-required',
      visibleFactor: monitoringSafeCadence.cadenceFactor,
      action: 'wait-signal',
      label: 'Signal minimal: donnée fraîche.',
      reason: 'Attendre une confirmation fraîche avant de reprendre le sweep contraint.',
    };
  }

  if (monitoringSafeCadence.cadence === 'space-for-heat') {
    return {
      prerequisite: 'heat-reduction-required',
      visibleFactor: 'Heat',
      action: 'reduce-heat',
      label: 'Signal minimal: heat réduit.',
      reason: 'Réduire le heat visible avant toute reprise de sweep.',
    };
  }

  return {
    prerequisite: 'sufficient-margin',
    visibleFactor: monitoringSafeCadence.cadenceFactor,
    action: 'maintain-surveillance',
    label: 'Signal minimal: marge suffisante.',
    reason: 'Maintenir la surveillance jusqu’à une marge lisible, sans forcer la reprise.',
  };
}


function buildResumedConstrainedSweepResult({ monitoringMinimalResumeSignal }) {
  if (monitoringMinimalResumeSignal.prerequisite === 'already-safe') {
    return {
      result: 'margin-restored',
      visibleFactor: monitoringMinimalResumeSignal.visibleFactor,
      action: 'chain-sweep',
      label: 'Résultat: marge restaurée.',
      reason: 'La reprise laisse une marge lisible: enchaîner seulement si la fenêtre reste visible.',
    };
  }

  if (monitoringMinimalResumeSignal.prerequisite === 'heat-reduction-required') {
    return {
      result: 'threat-confirmed',
      visibleFactor: 'Heat',
      action: 'reduce-heat',
      label: 'Résultat: menace confirmée.',
      reason: 'Le heat visible confirme une pression à traiter avant tout enchaînement.',
    };
  }

  if (monitoringMinimalResumeSignal.prerequisite === 'fresh-signal-required') {
    return {
      result: 'fragile-resume',
      visibleFactor: monitoringMinimalResumeSignal.visibleFactor,
      action: 'maintain-surveillance',
      label: 'Résultat: reprise fragile.',
      reason: 'La qualité du signal suffit à reprendre, mais pas à enchaîner sans surveillance.',
    };
  }

  return {
    result: 'fragile-resume',
    visibleFactor: monitoringMinimalResumeSignal.visibleFactor,
    action: 'maintain-surveillance',
    label: 'Résultat: reprise fragile.',
    reason: 'La marge reste trop peu lisible: maintenir la surveillance avant une nouvelle passe.',
  };
}


function buildFollowUpHeatDebt({ resumedConstrainedSweepResult }) {
  if (resumedConstrainedSweepResult.result === 'margin-restored') {
    return {
      debt: 'heat-stable',
      visibleFactor: resumedConstrainedSweepResult.visibleFactor,
      action: 'chain-sweep',
      label: 'Dette heat: stable.',
      reason: 'La fenêtre de sweep reste lisible: enchaîner seulement si le heat visible ne remonte pas.',
    };
  }

  if (resumedConstrainedSweepResult.result === 'threat-confirmed') {
    return {
      debt: 'next-follow-up-blocked',
      visibleFactor: 'Heat',
      action: 'reduce-heat',
      label: 'Dette heat: suivi bloqué.',
      reason: 'Le heat visible bloque le prochain suivi: absorber la pression avant une nouvelle passe.',
    };
  }

  if (resumedConstrainedSweepResult.visibleFactor === 'Fraîcheur signal' || resumedConstrainedSweepResult.visibleFactor === 'Gain confiance') {
    return {
      debt: 'heat-to-absorb',
      visibleFactor: resumedConstrainedSweepResult.visibleFactor,
      action: 'refresh-signal',
      label: 'Dette heat: à absorber.',
      reason: 'Le suivi reste possible, mais dépend d’un signal rafraîchi avant d’ajouter du heat.',
    };
  }

  return {
    debt: 'next-follow-up-blocked',
    visibleFactor: 'Marge restante',
    action: 'maintain-surveillance',
    label: 'Dette heat: suivi bloqué.',
    reason: 'Marge restante trop peu lisible: maintenir la surveillance avant d’ajouter du heat.',
  };
}


function buildFollowUpCoolingWindow({ followUpHeatDebt }) {
  if (followUpHeatDebt.debt === 'heat-stable') {
    return {
      window: 'cooling-not-needed',
      visibleFactor: followUpHeatDebt.visibleFactor,
      action: 'chain-sweep',
      label: 'Refroidissement: inutile.',
      reason: 'La fenêtre de sweep reste ouverte: aucun tour de refroidissement requis tant que le heat reste stable.',
    };
  }

  if (followUpHeatDebt.debt === 'heat-to-absorb') {
    return {
      window: 'short-pause-sufficient',
      visibleFactor: followUpHeatDebt.visibleFactor,
      action: 'wait-one-turn',
      label: 'Refroidissement: pause courte.',
      reason: 'Une pause courte suffit à stabiliser le suivi avant de rafraîchir le signal visible.',
    };
  }

  if (followUpHeatDebt.visibleFactor === 'Heat') {
    return {
      window: 'mandatory-cooling',
      visibleFactor: 'Heat',
      action: 'reduce-heat',
      label: 'Refroidissement: obligatoire.',
      reason: 'Le heat visible bloque la fenêtre: réduire la pression avant toute reprise de suivi.',
    };
  }

  return {
    window: 'mandatory-cooling',
    visibleFactor: followUpHeatDebt.visibleFactor,
    action: 'refresh-signal',
    label: 'Refroidissement: obligatoire.',
    reason: 'La fenêtre reste illisible: rafraîchir le signal visible avant le prochain suivi.',
  };
}


function buildActiveObservationResumeSignal({ followUpCoolingWindow }) {
  if (followUpCoolingWindow.window === 'cooling-not-needed') {
    return {
      timing: 'resume-now',
      visibleFactor: followUpCoolingWindow.visibleFactor,
      action: 'resume-observation',
      label: 'Observation: reprendre maintenant.',
      reason: 'La fenêtre visible reste ouverte: reprendre l’observation active sans attendre un refroidissement caché.',
    };
  }

  if (followUpCoolingWindow.window === 'short-pause-sufficient') {
    return {
      timing: 'wait-before-resume',
      visibleFactor: followUpCoolingWindow.visibleFactor,
      action: 'wait-one-turn',
      label: 'Observation: attendre un tour.',
      reason: 'La pause courte stabilise le signal visible avant de rouvrir l’observation active.',
    };
  }

  if (followUpCoolingWindow.visibleFactor === 'Heat') {
    return {
      timing: 'wait-before-resume',
      visibleFactor: 'Heat',
      action: 'reduce-heat',
      label: 'Observation: attendre heat.',
      reason: 'Le heat visible doit baisser avant une observation active sûre.',
    };
  }

  return {
    timing: 'resume-later-information-risk',
    visibleFactor: followUpCoolingWindow.visibleFactor,
    action: 'refresh-signal',
    label: 'Observation: reprendre plus tard.',
    reason: 'Attendre protège la fenêtre, mais le signal peut perdre en fraîcheur: rafraîchir avant reprise.',
  };
}


function buildFirstSafeObservationTarget({ activeObservationResumeSignal }) {
  if (activeObservationResumeSignal.timing === 'resume-now') {
    return {
      target: 'primary-safe',
      visibleFactor: 'Couverture partielle',
      action: 'observe-primary',
      label: 'Cible observation: principale sûre.',
      reason: 'La reprise active peut viser la cible principale sans élargir le sweep au-delà de la couverture lisible.',
    };
  }

  if (activeObservationResumeSignal.timing === 'wait-before-resume' && activeObservationResumeSignal.visibleFactor === 'Heat') {
    return {
      target: 'no-safe-target',
      visibleFactor: 'Heat restant',
      action: 'reduce-heat',
      label: 'Cible observation: aucune sûre.',
      reason: 'Le heat restant rend toute cible trop risquée: réduire la pression avant de choisir où reprendre.',
    };
  }

  if (activeObservationResumeSignal.timing === 'wait-before-resume') {
    return {
      target: 'limited-recommended',
      visibleFactor: 'Couverture partielle',
      action: 'observe-limited',
      label: 'Cible observation: limitée recommandée.',
      reason: 'Commencer par une cible limitée évite de rouvrir trop large pendant la stabilisation visible.',
    };
  }

  return {
    target: 'no-safe-target',
    visibleFactor: 'Zone brouillée',
    action: 'refresh-signal',
    label: 'Cible observation: aucune sûre.',
    reason: 'La zone reste brouillée: rafraîchir le signal avant de choisir une première cible active.',
  };
}


function buildObservationBroadeningSignal({ firstSafeObservationTarget }) {
  if (firstSafeObservationTarget.target === 'primary-safe') {
    return {
      broadening: 'primary-coverage-safe',
      visibleConstraint: 'Menace confirmée',
      action: 'broaden-main-coverage',
      label: 'Élargissement: couverture principale sûre.',
      reason: 'La première cible confirme une menace lisible: élargir vers la couverture principale sans ouvrir de zone brouillée.',
    };
  }

  if (firstSafeObservationTarget.target === 'limited-recommended') {
    return {
      broadening: 'cautious-broadening-possible',
      visibleConstraint: 'Dette d’observation',
      action: 'broaden-one-step',
      label: 'Élargissement: prudent possible.',
      reason: 'La cible limitée absorbe la dette d’observation: élargir d’un cran seulement tant que la couverture partielle tient.',
    };
  }

  if (firstSafeObservationTarget.visibleFactor === 'Heat restant') {
    return {
      broadening: 'stay-limited-target',
      visibleConstraint: 'Heat restant',
      action: 'reduce-heat',
      label: 'Élargissement: rester limité.',
      reason: 'Le heat restant bloque l’extension: garder la cible initiale fermée jusqu’à baisse visible.',
    };
  }

  return {
    broadening: 'stay-limited-target',
    visibleConstraint: 'Zone brouillée',
    action: 'refresh-signal',
    label: 'Élargissement: rester limité.',
    reason: 'La zone brouillée rend l’extension trop large: rafraîchir le signal avant tout élargissement.',
  };
}


function buildObservationBroadeningTradeoff({ observationBroadeningSignal }) {
  if (observationBroadeningSignal.broadening === 'primary-coverage-safe') {
    return {
      tradeoff: 'coverage-justifies-broadening',
      visibleFactor: observationBroadeningSignal.visibleConstraint,
      action: 'broaden-main-coverage',
      label: 'Compromis: couverture utile.',
      message: 'La couverture principale vaut l’exposition ajoutée: élargir sans ouvrir de zone brouillée.',
    };
  }

  if (observationBroadeningSignal.broadening === 'cautious-broadening-possible') {
    return {
      tradeoff: 'coverage-justifies-broadening',
      visibleFactor: observationBroadeningSignal.visibleConstraint,
      action: 'broaden-one-step',
      label: 'Compromis: élargissement utile.',
      message: 'Le gain de couverture justifie un cran d’observation, pas une extension complète.',
    };
  }

  if (observationBroadeningSignal.visibleConstraint === 'Heat restant') {
    return {
      tradeoff: 'exposure-too-high',
      visibleFactor: 'Heat restant',
      action: 'stay-focused',
      label: 'Compromis: exposition trop haute.',
      message: 'Rester focalisé: le heat restant rend l’exposition d’un élargissement trop chère.',
    };
  }

  return {
    tradeoff: 'exposure-too-high',
    visibleFactor: observationBroadeningSignal.visibleConstraint,
    action: 'wait-for-clearer-coverage',
    label: 'Compromis: attendre.',
    message: 'Attendre: la zone brouillée ajouterait de l’exposition sans couverture fiable.',
  };
}

function buildMonitoringRestartPlan({ state, monitoringPreferred, marginalExposureAdded, expectedConfidenceGain }) {
  const normalizedExposure = clampPercent(marginalExposureAdded);
  const normalizedGain = clampPercent(expectedConfidenceGain);

  if (state === 'safe-action-available') {
    return {
      monitoringDurationTurns: 0,
      restartTriggers: [
        'Relancer maintenant si la fenêtre reste sûre.',
        'Basculer en surveillance si le heat remonte avant l’ordre.',
      ],
      sweepRestartComparison: `Relancer bat la surveillance: +${normalizedGain} confiance attendue pour +${normalizedExposure} exposition.`,
    };
  }

  if (state === 'await-fresh-signal') {
    return {
      monitoringDurationTurns: 2,
      restartTriggers: [
        'Relancer si un signal frais confirme un gap low-risk.',
        'Continuer à surveiller si la fraîcheur reste insuffisante.',
      ],
      sweepRestartComparison: 'Surveiller bat la relance: le signal est trop ancien pour justifier une nouvelle exposition.',
    };
  }

  if (state === 'heat-too-high') {
    return {
      monitoringDurationTurns: 3,
      restartTriggers: [
        'Relancer seulement si le heat retombe sous une fenêtre sûre.',
        'Continuer à surveiller si l’exposition marginale reste haute.',
      ],
      sweepRestartComparison: `Surveiller bat la relance: +${normalizedExposure} exposition marginale pour aucun gain fiable.`,
    };
  }

  if (state === 'wait-for-cooldown') {
    return {
      monitoringDurationTurns: 2,
      restartTriggers: [
        'Relancer si le heat baisse et que le gap reste visible.',
        'Continuer à surveiller si le coût d’exposition ne descend pas.',
      ],
      sweepRestartComparison: `Surveiller bat encore la relance: +${normalizedGain} confiance ne compense pas +${normalizedExposure} exposition.`,
    };
  }

  if (state === 'low-confidence-gain') {
    return {
      monitoringDurationTurns: 2,
      restartTriggers: [
        'Relancer si deux signaux frais augmentent le gain attendu.',
        'Continuer à surveiller tant que le gain reste marginal.',
      ],
      sweepRestartComparison: `Surveiller bat la relance: +${normalizedGain} confiance attendue reste trop faible pour +${normalizedExposure} exposition.`,
    };
  }

  return {
    monitoringDurationTurns: monitoringPreferred ? 1 : 0,
    restartTriggers: [
      'Relancer si un signal frais rouvre une fenêtre sûre.',
      'Continuer à surveiller sans nouveau gap lisible.',
    ],
    sweepRestartComparison: 'Surveiller reste préférable tant qu’aucun gain de confiance concret n’apparaît.',
  };
}

function withMonitoringRestartPlan(rationale, marginalExposureAdded, expectedConfidenceGain) {
  return {
    ...rationale,
    ...buildMonitoringRestartPlan({
      state: rationale.state,
      monitoringPreferred: rationale.monitoringPreferred,
      marginalExposureAdded,
      expectedConfidenceGain,
    }),
    monitoringChecklist: buildMonitoringChecklist({
      state: rationale.state,
      monitoringPreferred: rationale.monitoringPreferred,
      marginalExposureAdded,
      expectedConfidenceGain,
    }),
    monitoringChecklistFocus: buildMonitoringChecklistFocus({ state: rationale.state }),
    monitoringDriftForecast: buildMonitoringDriftForecast({
      state: rationale.state,
      marginalExposureAdded,
      expectedConfidenceGain,
    }),
    preventiveAction: buildMonitoringPreventiveAction({
      state: rationale.state,
      driftForecast: buildMonitoringDriftForecast({
        state: rationale.state,
        marginalExposureAdded,
        expectedConfidenceGain,
      }),
    }),
    preventiveRecoveryState: buildPreventiveRecoveryState({
      preventiveAction: buildMonitoringPreventiveAction({
        state: rationale.state,
        driftForecast: buildMonitoringDriftForecast({
          state: rationale.state,
          marginalExposureAdded,
          expectedConfidenceGain,
        }),
      }),
    }),
    postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
      preventiveRecoveryState: buildPreventiveRecoveryState({
        preventiveAction: buildMonitoringPreventiveAction({
          state: rationale.state,
          driftForecast: buildMonitoringDriftForecast({
            state: rationale.state,
            marginalExposureAdded,
            expectedConfidenceGain,
          }),
        }),
      }),
      preventiveAction: buildMonitoringPreventiveAction({
        state: rationale.state,
        driftForecast: buildMonitoringDriftForecast({
          state: rationale.state,
          marginalExposureAdded,
          expectedConfidenceGain,
        }),
      }),
      driftForecast: buildMonitoringDriftForecast({
        state: rationale.state,
        marginalExposureAdded,
        expectedConfidenceGain,
      }),
    }),
    postRecoveryMarginDecay: buildPostRecoveryMarginDecay({
      postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
        preventiveRecoveryState: buildPreventiveRecoveryState({
          preventiveAction: buildMonitoringPreventiveAction({
            state: rationale.state,
            driftForecast: buildMonitoringDriftForecast({
              state: rationale.state,
              marginalExposureAdded,
              expectedConfidenceGain,
            }),
          }),
        }),
        preventiveAction: buildMonitoringPreventiveAction({
          state: rationale.state,
          driftForecast: buildMonitoringDriftForecast({
            state: rationale.state,
            marginalExposureAdded,
            expectedConfidenceGain,
          }),
        }),
        driftForecast: buildMonitoringDriftForecast({
          state: rationale.state,
          marginalExposureAdded,
          expectedConfidenceGain,
        }),
      }),
      driftForecast: buildMonitoringDriftForecast({
        state: rationale.state,
        marginalExposureAdded,
        expectedConfidenceGain,
      }),
    }),
    monitoringMarginResponsePriority: buildMonitoringMarginResponsePriority({
      postRecoveryMarginDecay: buildPostRecoveryMarginDecay({
        postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
          preventiveRecoveryState: buildPreventiveRecoveryState({
            preventiveAction: buildMonitoringPreventiveAction({
              state: rationale.state,
              driftForecast: buildMonitoringDriftForecast({
                state: rationale.state,
                marginalExposureAdded,
                expectedConfidenceGain,
              }),
            }),
          }),
          preventiveAction: buildMonitoringPreventiveAction({
            state: rationale.state,
            driftForecast: buildMonitoringDriftForecast({
              state: rationale.state,
              marginalExposureAdded,
              expectedConfidenceGain,
            }),
          }),
          driftForecast: buildMonitoringDriftForecast({
            state: rationale.state,
            marginalExposureAdded,
            expectedConfidenceGain,
          }),
        }),
        driftForecast: buildMonitoringDriftForecast({
          state: rationale.state,
          marginalExposureAdded,
          expectedConfidenceGain,
        }),
      }),
      postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
        preventiveRecoveryState: buildPreventiveRecoveryState({
          preventiveAction: buildMonitoringPreventiveAction({
            state: rationale.state,
            driftForecast: buildMonitoringDriftForecast({
              state: rationale.state,
              marginalExposureAdded,
              expectedConfidenceGain,
            }),
          }),
        }),
        preventiveAction: buildMonitoringPreventiveAction({
          state: rationale.state,
          driftForecast: buildMonitoringDriftForecast({
            state: rationale.state,
            marginalExposureAdded,
            expectedConfidenceGain,
          }),
        }),
        driftForecast: buildMonitoringDriftForecast({
          state: rationale.state,
          marginalExposureAdded,
          expectedConfidenceGain,
        }),
      }),
    }),
    monitoringSafeCadence: buildMonitoringSafeCadence({
      monitoringMarginResponsePriority: buildMonitoringMarginResponsePriority({
        postRecoveryMarginDecay: buildPostRecoveryMarginDecay({
          postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
            preventiveRecoveryState: buildPreventiveRecoveryState({
              preventiveAction: buildMonitoringPreventiveAction({
                state: rationale.state,
                driftForecast: buildMonitoringDriftForecast({
                  state: rationale.state,
                  marginalExposureAdded,
                  expectedConfidenceGain,
                }),
              }),
            }),
            preventiveAction: buildMonitoringPreventiveAction({
              state: rationale.state,
              driftForecast: buildMonitoringDriftForecast({
                state: rationale.state,
                marginalExposureAdded,
                expectedConfidenceGain,
              }),
            }),
            driftForecast: buildMonitoringDriftForecast({
              state: rationale.state,
              marginalExposureAdded,
              expectedConfidenceGain,
            }),
          }),
          driftForecast: buildMonitoringDriftForecast({
            state: rationale.state,
            marginalExposureAdded,
            expectedConfidenceGain,
          }),
        }),
        postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
          preventiveRecoveryState: buildPreventiveRecoveryState({
            preventiveAction: buildMonitoringPreventiveAction({
              state: rationale.state,
              driftForecast: buildMonitoringDriftForecast({
                state: rationale.state,
                marginalExposureAdded,
                expectedConfidenceGain,
              }),
            }),
          }),
          preventiveAction: buildMonitoringPreventiveAction({
            state: rationale.state,
            driftForecast: buildMonitoringDriftForecast({
              state: rationale.state,
              marginalExposureAdded,
              expectedConfidenceGain,
            }),
          }),
          driftForecast: buildMonitoringDriftForecast({
            state: rationale.state,
            marginalExposureAdded,
            expectedConfidenceGain,
          }),
        }),
      }),
    }),
    monitoringMinimalResumeSignal: buildMonitoringMinimalResumeSignal({
      monitoringSafeCadence: buildMonitoringSafeCadence({
        monitoringMarginResponsePriority: buildMonitoringMarginResponsePriority({
          postRecoveryMarginDecay: buildPostRecoveryMarginDecay({
            postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
              preventiveRecoveryState: buildPreventiveRecoveryState({
                preventiveAction: buildMonitoringPreventiveAction({
                  state: rationale.state,
                  driftForecast: buildMonitoringDriftForecast({
                    state: rationale.state,
                    marginalExposureAdded,
                    expectedConfidenceGain,
                  }),
                }),
              }),
              preventiveAction: buildMonitoringPreventiveAction({
                state: rationale.state,
                driftForecast: buildMonitoringDriftForecast({
                  state: rationale.state,
                  marginalExposureAdded,
                  expectedConfidenceGain,
                }),
              }),
              driftForecast: buildMonitoringDriftForecast({
                state: rationale.state,
                marginalExposureAdded,
                expectedConfidenceGain,
              }),
            }),
            driftForecast: buildMonitoringDriftForecast({
              state: rationale.state,
              marginalExposureAdded,
              expectedConfidenceGain,
            }),
          }),
          postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
            preventiveRecoveryState: buildPreventiveRecoveryState({
              preventiveAction: buildMonitoringPreventiveAction({
                state: rationale.state,
                driftForecast: buildMonitoringDriftForecast({
                  state: rationale.state,
                  marginalExposureAdded,
                  expectedConfidenceGain,
                }),
              }),
            }),
            preventiveAction: buildMonitoringPreventiveAction({
              state: rationale.state,
              driftForecast: buildMonitoringDriftForecast({
                state: rationale.state,
                marginalExposureAdded,
                expectedConfidenceGain,
              }),
            }),
            driftForecast: buildMonitoringDriftForecast({
              state: rationale.state,
              marginalExposureAdded,
              expectedConfidenceGain,
            }),
          }),
        }),
      }),
    }),
    resumedConstrainedSweepResult: buildResumedConstrainedSweepResult({
      monitoringMinimalResumeSignal: buildMonitoringMinimalResumeSignal({
        monitoringSafeCadence: buildMonitoringSafeCadence({
          monitoringMarginResponsePriority: buildMonitoringMarginResponsePriority({
            postRecoveryMarginDecay: buildPostRecoveryMarginDecay({
              postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                preventiveRecoveryState: buildPreventiveRecoveryState({
                  preventiveAction: buildMonitoringPreventiveAction({
                    state: rationale.state,
                    driftForecast: buildMonitoringDriftForecast({
                      state: rationale.state,
                      marginalExposureAdded,
                      expectedConfidenceGain,
                    }),
                  }),
                }),
                preventiveAction: buildMonitoringPreventiveAction({
                  state: rationale.state,
                  driftForecast: buildMonitoringDriftForecast({
                    state: rationale.state,
                    marginalExposureAdded,
                    expectedConfidenceGain,
                  }),
                }),
                driftForecast: buildMonitoringDriftForecast({
                  state: rationale.state,
                  marginalExposureAdded,
                  expectedConfidenceGain,
                }),
              }),
              driftForecast: buildMonitoringDriftForecast({
                state: rationale.state,
                marginalExposureAdded,
                expectedConfidenceGain,
              }),
            }),
            postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
              preventiveRecoveryState: buildPreventiveRecoveryState({
                preventiveAction: buildMonitoringPreventiveAction({
                  state: rationale.state,
                  driftForecast: buildMonitoringDriftForecast({
                    state: rationale.state,
                    marginalExposureAdded,
                    expectedConfidenceGain,
                  }),
                }),
              }),
              preventiveAction: buildMonitoringPreventiveAction({
                state: rationale.state,
                driftForecast: buildMonitoringDriftForecast({
                  state: rationale.state,
                  marginalExposureAdded,
                  expectedConfidenceGain,
                }),
              }),
              driftForecast: buildMonitoringDriftForecast({
                state: rationale.state,
                marginalExposureAdded,
                expectedConfidenceGain,
              }),
            }),
          }),
        }),
      }),
    }),
    followUpHeatDebt: buildFollowUpHeatDebt({
      resumedConstrainedSweepResult: buildResumedConstrainedSweepResult({
        monitoringMinimalResumeSignal: buildMonitoringMinimalResumeSignal({
          monitoringSafeCadence: buildMonitoringSafeCadence({
            monitoringMarginResponsePriority: buildMonitoringMarginResponsePriority({
              postRecoveryMarginDecay: buildPostRecoveryMarginDecay({
                postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                  preventiveRecoveryState: buildPreventiveRecoveryState({
                    preventiveAction: buildMonitoringPreventiveAction({
                      state: rationale.state,
                      driftForecast: buildMonitoringDriftForecast({
                        state: rationale.state,
                        marginalExposureAdded,
                        expectedConfidenceGain,
                      }),
                    }),
                  }),
                  preventiveAction: buildMonitoringPreventiveAction({
                    state: rationale.state,
                    driftForecast: buildMonitoringDriftForecast({
                      state: rationale.state,
                      marginalExposureAdded,
                      expectedConfidenceGain,
                    }),
                  }),
                  driftForecast: buildMonitoringDriftForecast({
                    state: rationale.state,
                    marginalExposureAdded,
                    expectedConfidenceGain,
                  }),
                }),
                driftForecast: buildMonitoringDriftForecast({
                  state: rationale.state,
                  marginalExposureAdded,
                  expectedConfidenceGain,
                }),
              }),
              postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                preventiveRecoveryState: buildPreventiveRecoveryState({
                  preventiveAction: buildMonitoringPreventiveAction({
                    state: rationale.state,
                    driftForecast: buildMonitoringDriftForecast({
                      state: rationale.state,
                      marginalExposureAdded,
                      expectedConfidenceGain,
                    }),
                  }),
                }),
                preventiveAction: buildMonitoringPreventiveAction({
                  state: rationale.state,
                  driftForecast: buildMonitoringDriftForecast({
                    state: rationale.state,
                    marginalExposureAdded,
                    expectedConfidenceGain,
                  }),
                }),
                driftForecast: buildMonitoringDriftForecast({
                  state: rationale.state,
                  marginalExposureAdded,
                  expectedConfidenceGain,
                }),
              }),
            }),
          }),
        }),
      }),
    }),
    followUpCoolingWindow: buildFollowUpCoolingWindow({
      followUpHeatDebt: buildFollowUpHeatDebt({
        resumedConstrainedSweepResult: buildResumedConstrainedSweepResult({
          monitoringMinimalResumeSignal: buildMonitoringMinimalResumeSignal({
            monitoringSafeCadence: buildMonitoringSafeCadence({
              monitoringMarginResponsePriority: buildMonitoringMarginResponsePriority({
                postRecoveryMarginDecay: buildPostRecoveryMarginDecay({
                  postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                    preventiveRecoveryState: buildPreventiveRecoveryState({
                      preventiveAction: buildMonitoringPreventiveAction({
                        state: rationale.state,
                        driftForecast: buildMonitoringDriftForecast({
                          state: rationale.state,
                          marginalExposureAdded,
                          expectedConfidenceGain,
                        }),
                      }),
                    }),
                    preventiveAction: buildMonitoringPreventiveAction({
                      state: rationale.state,
                      driftForecast: buildMonitoringDriftForecast({
                        state: rationale.state,
                        marginalExposureAdded,
                        expectedConfidenceGain,
                      }),
                    }),
                    driftForecast: buildMonitoringDriftForecast({
                      state: rationale.state,
                      marginalExposureAdded,
                      expectedConfidenceGain,
                    }),
                  }),
                  driftForecast: buildMonitoringDriftForecast({
                    state: rationale.state,
                    marginalExposureAdded,
                    expectedConfidenceGain,
                  }),
                }),
                postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                  preventiveRecoveryState: buildPreventiveRecoveryState({
                    preventiveAction: buildMonitoringPreventiveAction({
                      state: rationale.state,
                      driftForecast: buildMonitoringDriftForecast({
                        state: rationale.state,
                        marginalExposureAdded,
                        expectedConfidenceGain,
                      }),
                    }),
                  }),
                  preventiveAction: buildMonitoringPreventiveAction({
                    state: rationale.state,
                    driftForecast: buildMonitoringDriftForecast({
                      state: rationale.state,
                      marginalExposureAdded,
                      expectedConfidenceGain,
                    }),
                  }),
                  driftForecast: buildMonitoringDriftForecast({
                    state: rationale.state,
                    marginalExposureAdded,
                    expectedConfidenceGain,
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
    activeObservationResumeSignal: buildActiveObservationResumeSignal({
      followUpCoolingWindow: buildFollowUpCoolingWindow({
        followUpHeatDebt: buildFollowUpHeatDebt({
          resumedConstrainedSweepResult: buildResumedConstrainedSweepResult({
            monitoringMinimalResumeSignal: buildMonitoringMinimalResumeSignal({
              monitoringSafeCadence: buildMonitoringSafeCadence({
                monitoringMarginResponsePriority: buildMonitoringMarginResponsePriority({
                  postRecoveryMarginDecay: buildPostRecoveryMarginDecay({
                    postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                      preventiveRecoveryState: buildPreventiveRecoveryState({
                        preventiveAction: buildMonitoringPreventiveAction({
                          state: rationale.state,
                          driftForecast: buildMonitoringDriftForecast({
                            state: rationale.state,
                            marginalExposureAdded,
                            expectedConfidenceGain,
                          }),
                        }),
                      }),
                      preventiveAction: buildMonitoringPreventiveAction({
                        state: rationale.state,
                        driftForecast: buildMonitoringDriftForecast({
                          state: rationale.state,
                          marginalExposureAdded,
                          expectedConfidenceGain,
                        }),
                      }),
                      driftForecast: buildMonitoringDriftForecast({
                        state: rationale.state,
                        marginalExposureAdded,
                        expectedConfidenceGain,
                      }),
                    }),
                    driftForecast: buildMonitoringDriftForecast({
                      state: rationale.state,
                      marginalExposureAdded,
                      expectedConfidenceGain,
                    }),
                  }),
                  postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                    preventiveRecoveryState: buildPreventiveRecoveryState({
                      preventiveAction: buildMonitoringPreventiveAction({
                        state: rationale.state,
                        driftForecast: buildMonitoringDriftForecast({
                          state: rationale.state,
                          marginalExposureAdded,
                          expectedConfidenceGain,
                        }),
                      }),
                    }),
                    preventiveAction: buildMonitoringPreventiveAction({
                      state: rationale.state,
                      driftForecast: buildMonitoringDriftForecast({
                        state: rationale.state,
                        marginalExposureAdded,
                        expectedConfidenceGain,
                      }),
                    }),
                    driftForecast: buildMonitoringDriftForecast({
                      state: rationale.state,
                      marginalExposureAdded,
                      expectedConfidenceGain,
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
    firstSafeObservationTarget: buildFirstSafeObservationTarget({
      activeObservationResumeSignal: buildActiveObservationResumeSignal({
        followUpCoolingWindow: buildFollowUpCoolingWindow({
          followUpHeatDebt: buildFollowUpHeatDebt({
            resumedConstrainedSweepResult: buildResumedConstrainedSweepResult({
              monitoringMinimalResumeSignal: buildMonitoringMinimalResumeSignal({
                monitoringSafeCadence: buildMonitoringSafeCadence({
                  monitoringMarginResponsePriority: buildMonitoringMarginResponsePriority({
                    postRecoveryMarginDecay: buildPostRecoveryMarginDecay({
                      postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                        preventiveRecoveryState: buildPreventiveRecoveryState({
                          preventiveAction: buildMonitoringPreventiveAction({
                            state: rationale.state,
                            driftForecast: buildMonitoringDriftForecast({
                              state: rationale.state,
                              marginalExposureAdded,
                              expectedConfidenceGain,
                            }),
                          }),
                        }),
                        preventiveAction: buildMonitoringPreventiveAction({
                          state: rationale.state,
                          driftForecast: buildMonitoringDriftForecast({
                            state: rationale.state,
                            marginalExposureAdded,
                            expectedConfidenceGain,
                          }),
                        }),
                        driftForecast: buildMonitoringDriftForecast({
                          state: rationale.state,
                          marginalExposureAdded,
                          expectedConfidenceGain,
                        }),
                      }),
                      driftForecast: buildMonitoringDriftForecast({
                        state: rationale.state,
                        marginalExposureAdded,
                        expectedConfidenceGain,
                      }),
                    }),
                    postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                      preventiveRecoveryState: buildPreventiveRecoveryState({
                        preventiveAction: buildMonitoringPreventiveAction({
                          state: rationale.state,
                          driftForecast: buildMonitoringDriftForecast({
                            state: rationale.state,
                            marginalExposureAdded,
                            expectedConfidenceGain,
                          }),
                        }),
                      }),
                      preventiveAction: buildMonitoringPreventiveAction({
                        state: rationale.state,
                        driftForecast: buildMonitoringDriftForecast({
                          state: rationale.state,
                          marginalExposureAdded,
                          expectedConfidenceGain,
                        }),
                      }),
                      driftForecast: buildMonitoringDriftForecast({
                        state: rationale.state,
                        marginalExposureAdded,
                        expectedConfidenceGain,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
    observationBroadeningSignal: buildObservationBroadeningSignal({
      firstSafeObservationTarget: buildFirstSafeObservationTarget({
        activeObservationResumeSignal: buildActiveObservationResumeSignal({
          followUpCoolingWindow: buildFollowUpCoolingWindow({
            followUpHeatDebt: buildFollowUpHeatDebt({
              resumedConstrainedSweepResult: buildResumedConstrainedSweepResult({
                monitoringMinimalResumeSignal: buildMonitoringMinimalResumeSignal({
                  monitoringSafeCadence: buildMonitoringSafeCadence({
                    monitoringMarginResponsePriority: buildMonitoringMarginResponsePriority({
                      postRecoveryMarginDecay: buildPostRecoveryMarginDecay({
                        postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                          preventiveRecoveryState: buildPreventiveRecoveryState({
                            preventiveAction: buildMonitoringPreventiveAction({
                              state: rationale.state,
                              driftForecast: buildMonitoringDriftForecast({
                                state: rationale.state,
                                marginalExposureAdded,
                                expectedConfidenceGain,
                              }),
                            }),
                          }),
                          preventiveAction: buildMonitoringPreventiveAction({
                            state: rationale.state,
                            driftForecast: buildMonitoringDriftForecast({
                              state: rationale.state,
                              marginalExposureAdded,
                              expectedConfidenceGain,
                            }),
                          }),
                          driftForecast: buildMonitoringDriftForecast({
                            state: rationale.state,
                            marginalExposureAdded,
                            expectedConfidenceGain,
                          }),
                        }),
                        driftForecast: buildMonitoringDriftForecast({
                          state: rationale.state,
                          marginalExposureAdded,
                          expectedConfidenceGain,
                        }),
                      }),
                      postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                        preventiveRecoveryState: buildPreventiveRecoveryState({
                          preventiveAction: buildMonitoringPreventiveAction({
                            state: rationale.state,
                            driftForecast: buildMonitoringDriftForecast({
                              state: rationale.state,
                              marginalExposureAdded,
                              expectedConfidenceGain,
                            }),
                          }),
                        }),
                        preventiveAction: buildMonitoringPreventiveAction({
                          state: rationale.state,
                          driftForecast: buildMonitoringDriftForecast({
                            state: rationale.state,
                            marginalExposureAdded,
                            expectedConfidenceGain,
                          }),
                        }),
                        driftForecast: buildMonitoringDriftForecast({
                          state: rationale.state,
                          marginalExposureAdded,
                          expectedConfidenceGain,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
    observationBroadeningTradeoff: buildObservationBroadeningTradeoff({
      observationBroadeningSignal: buildObservationBroadeningSignal({
      firstSafeObservationTarget: buildFirstSafeObservationTarget({
        activeObservationResumeSignal: buildActiveObservationResumeSignal({
          followUpCoolingWindow: buildFollowUpCoolingWindow({
            followUpHeatDebt: buildFollowUpHeatDebt({
              resumedConstrainedSweepResult: buildResumedConstrainedSweepResult({
                monitoringMinimalResumeSignal: buildMonitoringMinimalResumeSignal({
                  monitoringSafeCadence: buildMonitoringSafeCadence({
                    monitoringMarginResponsePriority: buildMonitoringMarginResponsePriority({
                      postRecoveryMarginDecay: buildPostRecoveryMarginDecay({
                        postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                          preventiveRecoveryState: buildPreventiveRecoveryState({
                            preventiveAction: buildMonitoringPreventiveAction({
                              state: rationale.state,
                              driftForecast: buildMonitoringDriftForecast({
                                state: rationale.state,
                                marginalExposureAdded,
                                expectedConfidenceGain,
                              }),
                            }),
                          }),
                          preventiveAction: buildMonitoringPreventiveAction({
                            state: rationale.state,
                            driftForecast: buildMonitoringDriftForecast({
                              state: rationale.state,
                              marginalExposureAdded,
                              expectedConfidenceGain,
                            }),
                          }),
                          driftForecast: buildMonitoringDriftForecast({
                            state: rationale.state,
                            marginalExposureAdded,
                            expectedConfidenceGain,
                          }),
                        }),
                        driftForecast: buildMonitoringDriftForecast({
                          state: rationale.state,
                          marginalExposureAdded,
                          expectedConfidenceGain,
                        }),
                      }),
                      postRecoverySafetyMargin: buildPostRecoverySafetyMargin({
                        preventiveRecoveryState: buildPreventiveRecoveryState({
                          preventiveAction: buildMonitoringPreventiveAction({
                            state: rationale.state,
                            driftForecast: buildMonitoringDriftForecast({
                              state: rationale.state,
                              marginalExposureAdded,
                              expectedConfidenceGain,
                            }),
                          }),
                        }),
                        preventiveAction: buildMonitoringPreventiveAction({
                          state: rationale.state,
                          driftForecast: buildMonitoringDriftForecast({
                            state: rationale.state,
                            marginalExposureAdded,
                            expectedConfidenceGain,
                          }),
                        }),
                        driftForecast: buildMonitoringDriftForecast({
                          state: rationale.state,
                          marginalExposureAdded,
                          expectedConfidenceGain,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
      }),
    }),
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
      monitoringRationale: withMonitoringRestartPlan({
        state: 'surveillance-active-sufficient',
        monitoringPreferred: true,
        signalFreshness: 'insufficient',
        heatState: 'stable',
        tradeoff: 'Aucun gain de confiance attendu ne compense une nouvelle exposition.',
      }, 0, 0),
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
      monitoringRationale: withMonitoringRestartPlan({
        state: 'heat-too-high',
        monitoringPreferred: true,
        signalFreshness: 'stale',
        heatState: 'too-hot',
        tradeoff: 'Le heat/exposition marginal dépasse le gain de confiance attendu.',
      }, clampPercent(nextSafeSweep.estimatedExposureAdded + 3), 0),
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
      monitoringRationale: withMonitoringRestartPlan({
        state: 'await-fresh-signal',
        monitoringPreferred: true,
        signalFreshness: 'needs-refresh',
        heatState: 'contained',
        tradeoff: 'Sans signal frais, une nouvelle sweep ajouterait de l’exposition sans gain fiable.',
      }, clampPercent(Math.max(3, nextSafeSweep.estimatedExposureAdded - 1)), 0),
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
      monitoringRationale: withMonitoringRestartPlan({
        state: 'wait-for-cooldown',
        monitoringPreferred: true,
        signalFreshness: 'usable-later',
        heatState: 'cooling-required',
        tradeoff: 'Attendre réduit le coût d’exposition avant toute nouvelle sweep.',
      }, clampPercent(nextSafeSweep.estimatedExposureAdded), clampPercent(Math.min(8, unknownsRemaining * 3))),
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
      monitoringRationale: withMonitoringRestartPlan({
        state: 'safe-action-available',
        monitoringPreferred: false,
        signalFreshness: 'fresh-enough',
        heatState: 'contained',
        tradeoff: 'Le gain de confiance attendu dépasse l’exposition marginale; ne pas rester inactif.',
      }, marginalExposureAdded, expectedConfidenceGain),
      rationale: `Préparer une troisième passe prudente: ${unknownsRemaining} inconnues resteraient et le gain de confiance attendu dépasse l’exposition marginale.`,
    };
  }

  return {
    state: 'stop-after-second',
    action: 'stop',
    prepareThirdSweep: false,
    marginalExposureAdded: clampPercent(nextSafeSweep.estimatedExposureAdded + 1),
    expectedConfidenceGain: clampPercent(Math.min(5, unknownsRemaining * 3)),
    monitoringRationale: withMonitoringRestartPlan({
      state: 'low-confidence-gain',
      monitoringPreferred: true,
      signalFreshness: 'weak',
      heatState: 'contained',
      tradeoff: 'Le gain de confiance restant est inférieur au coût d’exposition marginal.',
    }, clampPercent(nextSafeSweep.estimatedExposureAdded + 1), clampPercent(Math.min(5, unknownsRemaining * 3))),
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

function buildSuspicionHeatDecayPlayback({ locationCellules, locationOperations, sabotageRiskScore }) {
  const currentHeat = clampPercent(Math.max(
    sabotageRiskScore,
    ...locationOperations.map((operation) => operation.heat),
    ...locationCellules.map((cellule) => cellule.exposure),
    0,
  ));
  const decayStep = locationOperations.length > 0 ? 12 : locationCellules.some((cellule) => cellule.isExposed) ? 9 : 7;
  const floor = locationOperations.some((operation) => operation.phase === 'execution') ? 25 : 0;
  const frames = [0, 1, 2, 3].map((turnOffset) => {
    const projectedHeat = clampPercent(Math.max(floor, currentHeat - (decayStep * turnOffset)));
    const state = currentHeat === 0
      ? 'masked'
      : turnOffset === 0 && projectedHeat >= 70
        ? 'active-risk'
        : projectedHeat > floor && projectedHeat > 0
          ? 'decaying-risk'
          : projectedHeat === 0
            ? 'masked'
            : 'decaying-risk';

    return {
      turnOffset,
      projectedHeat,
      state,
      label: state === 'active-risk'
        ? `T+${turnOffset}: risque actif`
        : state === 'decaying-risk'
          ? `T+${turnOffset}: chaleur en décroissance`
          : `T+${turnOffset}: information masquée`,
    };
  });

  return {
    state: frames[0].state,
    currentHeat,
    decayStep,
    frames,
    summary: currentHeat > 0
      ? `Chaleur ${currentHeat}, décroissance sûre estimée -${decayStep}/tour sans révéler la source.`
      : 'Aucune chaleur confirmée: information gardée masquée en mode sûr.',
  };
}

function buildFogSafeConfidenceState({ locationCellules, locationOperations, presenceLevel, riskLevel, sabotageRiskScore, exposedCellCount }) {
  const activeOperation = locationOperations.some((operation) => operation.phase === 'execution' || operation.heat >= 70);
  const hasVisibleExposure = exposedCellCount > 0;
  const hasProbableSignal = sabotageRiskScore > 0 || ['medium', 'high'].includes(presenceLevel) || locationOperations.length > 0;
  const hasOldSignal = locationCellules.some((cellule) => cellule.exposure > 0 || cellule.status === 'dormant');
  const state = hasVisibleExposure || riskLevel === 'high' || activeOperation
    ? 'confirmed'
    : hasProbableSignal
      ? 'suspected'
      : hasOldSignal
        ? 'stale'
        : 'masked';

  const copyByState = {
    confirmed: 'Confiance confirmée: pression visible, détails sensibles encore expurgés.',
    suspected: 'Confiance suspecte: signal probable à vérifier, danger réel non confirmé.',
    stale: 'Confiance ancienne: indice à revérifier, ne pas lire comme danger faible.',
    masked: 'Confiance masquée: données absentes ou confidentielles, ne pas inférer un danger faible.',
  };

  return {
    state,
    label: state === 'confirmed'
      ? 'Confirmé'
      : state === 'suspected'
        ? 'Suspect'
        : state === 'stale'
          ? 'Ancien'
          : 'Masqué',
    dangerInterpretation: state === 'masked' || state === 'stale'
      ? 'incertitude élevée, pas danger faible'
      : riskLevel === 'none'
        ? 'danger non confirmé'
        : `danger ${riskLevel}`,
    safeCopy: copyByState[state],
  };
}

function buildSafeVerificationHint({ confidenceState, safeMapMasking }) {
  const hintByState = {
    confirmed: {
      action: 'observe-locally',
      label: 'Observer localement',
      reason: 'Confirmer la tendance visible sans nommer cellule, relais, cible ou cause.',
    },
    suspected: {
      action: 'limit-coverage',
      label: 'Limiter couverture',
      reason: 'Réduire le rayon de vérification pour éviter une exposition inutile sur un signal probable.',
    },
    stale: {
      action: 'wait',
      label: 'Attendre un signal frais',
      reason: 'Indice ancien: attendre ou revérifier avant toute action directe.',
    },
    masked: {
      action: 'ignore',
      label: 'Ignorer pour l’instant',
      reason: 'Information masquée ou confidentielle: ne pas transformer l’absence de données en faux signal rassurant.',
    },
  };
  const hint = hintByState[confidenceState.state] ?? hintByState.masked;

  return {
    ...hint,
    safeMapLabel: `${hint.label}: ${safeMapMasking.redactedLabel.toLowerCase()}, ${confidenceState.dangerInterpretation}.`,
  };
}

function buildVerificationPathPreviews({ confidenceState, safeVerificationHint, suspicionHeatDecayPlayback, safeMapMasking }) {
  const currentHeat = suspicionHeatDecayPlayback.currentHeat;
  const nextCoolerFrame = suspicionHeatDecayPlayback.frames.find((frame) => frame.turnOffset > 0 && frame.projectedHeat < currentHeat) ?? null;
  const heatDecayContext = currentHeat >= 70
    ? 'Chaleur active: éviter les vérifications larges avant refroidissement.'
    : nextCoolerFrame
      ? `${nextCoolerFrame.label}: coût réduit si la vérification attend ce palier.`
      : 'Aucune décroissance exploitable: rester sur une vérification minimale.';
  const pathByState = {
    confirmed: {
      pathId: 'observe-local-confirmation',
      label: 'Confirmer par observation locale',
      exposureCost: currentHeat >= 70 ? 8 : 4,
      confidenceAfter: 'confirmed-stable',
      evidenceNeeded: 'un second indice visible sur la même province, sans nommer source ni cible',
    },
    suspected: {
      pathId: 'limited-coverage-check',
      label: 'Vérifier en couverture limitée',
      exposureCost: currentHeat >= 45 ? 9 : 6,
      confidenceAfter: 'suspected-or-confirmed',
      evidenceNeeded: 'une convergence de niveau de risque ou de fraîcheur, pas une identité cachée',
    },
    stale: {
      pathId: 'wait-fresh-signal',
      label: 'Attendre un signal frais',
      exposureCost: 1,
      confidenceAfter: 'stale-or-suspected',
      evidenceNeeded: 'fraîcheur visible renouvelée avant toute action directe',
    },
    masked: {
      pathId: 'ignore-masked-signal',
      label: 'Ignorer tant que masqué',
      exposureCost: 0,
      confidenceAfter: 'masked-safe',
      evidenceNeeded: 'donnée visible non confidentielle; l’absence de signal ne prouve pas un danger faible',
    },
  };
  const recommended = pathByState[confidenceState.state] ?? pathByState.masked;
  const unsafeBroadening = currentHeat >= 70 || safeMapMasking.state === 'active-risk'
    ? [{
      pathId: 'broad-coverage-now',
      label: 'Élargir la couverture maintenant',
      recommended: false,
      unsafe: true,
      exposureCost: clampPercent(Math.max(14, currentHeat - 50)),
      costCue: 'trop coûteux',
      confidenceAfter: 'uncertain-with-exposure',
      evidenceNeeded: 'non recommandé: coûterait de l’exposition sans preuve fog-safe supplémentaire',
      heatDecayContext,
      fogSafeCopy: 'Chemin bloqué: la carte ne révèle aucun relais, cellule ou cible pour justifier cet élargissement.',
      saferFallbackAction: safeVerificationHint.action,
    }]
    : [];

  return [
    {
      ...recommended,
      recommended: true,
      unsafe: false,
      costCue: recommended.exposureCost >= 8 ? 'coût modéré' : recommended.exposureCost > 0 ? 'coût bas' : 'sans coût',
      heatDecayContext,
      fogSafeCopy: `${recommended.label}: ${confidenceState.safeCopy} Prochaine preuve requise: ${recommended.evidenceNeeded}.`,
      saferFallbackAction: null,
    },
    ...unsafeBroadening,
  ];
}

function buildIntrigueIncidentReplay({ confidenceState, suspicionHeatDecayPlayback, safeMapMasking }) {
  const frameByState = {
    confirmed: {
      incidentType: 'confirmed-trail',
      label: 'Piste confirmée',
      confidenceTrend: 'up',
      reason: 'La pression visible confirme la piste sans révéler cellule, relais ou cible.',
    },
    suspected: {
      incidentType: 'suspected-sabotage',
      label: 'Sabotage suspecté',
      confidenceTrend: 'up',
      reason: 'Un signal probable augmente la vigilance, mais la preuve reste non nominative.',
    },
    stale: {
      incidentType: 'verification-in-progress',
      label: 'Vérification en cours',
      confidenceTrend: 'down',
      reason: 'Le signal vieillit; la confiance baisse jusqu’à une nouvelle preuve visible.',
    },
    masked: {
      incidentType: 'false-alert-or-masked',
      label: 'Fausse alerte possible',
      confidenceTrend: 'masked',
      reason: 'Le mode sûr masque ou généralise l’incident faute de donnée autorisée.',
    },
  };
  const current = frameByState[confidenceState.state] ?? frameByState.masked;
  const heatFrame = suspicionHeatDecayPlayback.frames[1] ?? suspicionHeatDecayPlayback.frames[0];

  return {
    state: current.incidentType,
    summary: `${current.label}: ${current.reason}`,
    frames: [
      {
        turnOffset: -2,
        incidentType: safeMapMasking.state === 'masked-information' ? 'false-alert-or-masked' : 'verification-in-progress',
        label: safeMapMasking.state === 'masked-information' ? 'Signal généralisé' : 'Vérification en cours',
        confidenceTrend: 'masked',
        safeCopy: 'Historique expurgé: aucune source, cible ou cause cachée affichée.',
      },
      {
        turnOffset: -1,
        incidentType: heatFrame.state === 'decaying-risk' ? 'verification-in-progress' : current.incidentType,
        label: heatFrame.state === 'decaying-risk' ? 'Chaleur en baisse' : current.label,
        confidenceTrend: heatFrame.state === 'decaying-risk' ? 'down' : current.confidenceTrend,
        safeCopy: `${heatFrame.label}; la confiance suit seulement les signaux visibles.`,
      },
      {
        turnOffset: 0,
        incidentType: current.incidentType,
        label: current.label,
        confidenceTrend: current.confidenceTrend,
        safeCopy: current.reason,
      },
    ],
  };
}

function buildEvidenceTrailMarkers({ locationId, locationName, confidenceState, safeMapMasking, locationOperations, relatedLocationIds }) {
  if (safeMapMasking.state === 'masked-information' || confidenceState.state === 'masked') {
    return [{
      markerId: `evidence:${locationId}:masked`,
      state: 'masked',
      fromLocationId: locationId,
      toLocationId: null,
      label: `${locationName}: piste masquée`,
      reason: 'Mode sûr: lien de preuve non affiché car les données sont absentes ou confidentielles.',
    }];
  }

  const targetLocationId = relatedLocationIds.find((candidate) => candidate !== locationId) ?? null;
  const markerState = confidenceState.state === 'confirmed'
    ? 'confirmed-evidence'
    : confidenceState.state === 'suspected'
      ? 'suspected-evidence'
      : 'stale-evidence';

  return [{
    markerId: `evidence:${locationId}:${targetLocationId ?? 'local'}`,
    state: markerState,
    fromLocationId: locationId,
    toLocationId: targetLocationId,
    label: targetLocationId === null
      ? `${locationName}: preuve locale ${confidenceState.label.toLowerCase()}`
      : `${locationName}: piste ${confidenceState.label.toLowerCase()} reliée à une zone autorisée`,
    reason: locationOperations.length > 0
      ? 'Lien autorisé par signaux visibles seulement; relais, cellule et objectif restent masqués.'
      : 'Piste locale sans détail sensible; le marqueur indique la confiance, pas la vérité cachée.',
  }];
}

function buildIntelligenceProvenancePanel({ confidenceState, safeVerificationHint, verificationPathPreviews, incidentReplay, evidenceTrailMarkers, safeMapMasking, locationOperations, exposedCellCount }) {
  const provenanceType = confidenceState.state === 'confirmed'
    ? 'observed'
    : confidenceState.state === 'suspected'
      ? 'inferred'
      : confidenceState.state === 'stale'
        ? 'rumor'
        : 'unknown';
  const sourceLabelByType = {
    observed: 'Observation directe expurgée',
    inferred: 'Déduction par signaux visibles',
    rumor: 'Rumeur ou indice ancien',
    unknown: 'Source inconnue ou confidentielle',
  };
  const methodByType = {
    observed: exposedCellCount > 0 ? 'exposition visible confirmée' : 'pression active confirmée',
    inferred: locationOperations.length > 0 ? 'corrélation chaleur/progression visible' : 'corrélation de présence locale',
    rumor: 'ancien signal à revérifier avant action',
    unknown: 'aucune méthode affichable en mode sûr',
  };
  const recommendedPath = verificationPathPreviews.find((path) => path.recommended) ?? verificationPathPreviews[0] ?? null;
  const evidenceStates = [...new Set(evidenceTrailMarkers.map((marker) => marker.state))];

  return {
    provenanceType,
    sourceLabel: sourceLabelByType[provenanceType],
    confirmationMethod: methodByType[provenanceType],
    credibility: confidenceState.label,
    credibilityReason: confidenceState.safeCopy,
    evidenceStates,
    nextVerificationStep: recommendedPath ? {
      action: safeVerificationHint.action,
      label: safeVerificationHint.label,
      costCue: recommendedPath.costCue,
      exposureCost: recommendedPath.exposureCost,
      evidenceNeeded: recommendedPath.evidenceNeeded,
    } : null,
    safeMapSummary: safeMapMasking.state === 'masked-information'
      ? 'Provenance généralisée: les détails non autorisés restent masqués.'
      : `${safeMapMasking.redactedLabel}: provenance limitée aux signaux visibles.`,
    hiddenDetailPolicy: 'Ne révèle jamais cellule, relais, cible, objectif précis ou cause cachée.',
    incidentSummary: incidentReplay.summary,
  };
}

function buildSafeMapMasking({ presenceLevel, riskLevel, sabotageRiskScore, exposedCellCount, locationOperations }) {
  const activeRisk = riskLevel === 'high' || locationOperations.some((operation) => operation.phase === 'execution');
  const decayingRisk = !activeRisk && sabotageRiskScore > 0;
  const state = activeRisk
    ? 'active-risk'
    : decayingRisk
      ? 'decaying-risk'
      : 'masked-information';

  return {
    state,
    redactedLabel: state === 'active-risk'
      ? 'Risque actif visible'
      : state === 'decaying-risk'
        ? 'Risque en décroissance'
        : 'Information masquée',
    safeLabel: state === 'masked-information'
      ? 'Indice intrigue masqué: données absentes ou confidentielles.'
      : `Indice intrigue ${presenceLevel}, risque ${riskLevel}: détails sensibles expurgés.`,
    maskedDetails: [
      exposedCellCount === 0 ? 'identité cellule' : null,
      'relais opérationnel',
      'objectif précis',
      state === 'masked-information' ? 'cause du signal' : null,
    ].filter(Boolean),
    reason: state === 'active-risk'
      ? 'La carte montre seulement le niveau de pression actif, pas la source.'
      : state === 'decaying-risk'
        ? 'La pression baisse; le mode sûr masque encore les routes et relais.'
        : 'Aucun signal confirmé ne justifie de révéler une route ou cible.',
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
      const relatedLocationIds = [...locationIds].sort((left, right) => left.localeCompare(right));

      const lowExposureSweepConfidencePreview = buildLowExposureSweepConfidencePreview({
        celluleCount: locationCellules.length,
        exposedCellCount,
        sleeperCellCount,
        sabotageRiskScore,
      });
      const suspicionHeatDecayPlayback = buildSuspicionHeatDecayPlayback({
        locationCellules,
        locationOperations,
        sabotageRiskScore,
      });
      const safeMapMasking = buildSafeMapMasking({
        presenceLevel,
        riskLevel,
        sabotageRiskScore,
        exposedCellCount,
        locationOperations,
      });
      const confidenceState = buildFogSafeConfidenceState({
        locationCellules,
        locationOperations,
        presenceLevel,
        riskLevel,
        sabotageRiskScore,
        exposedCellCount,
      });
      const safeVerificationHint = buildSafeVerificationHint({ confidenceState, safeMapMasking });
      const verificationPathPreviews = buildVerificationPathPreviews({
        confidenceState,
        safeVerificationHint,
        suspicionHeatDecayPlayback,
        safeMapMasking,
      });
      const incidentReplay = buildIntrigueIncidentReplay({
        confidenceState,
        suspicionHeatDecayPlayback,
        safeMapMasking,
      });
      const evidenceTrailMarkers = buildEvidenceTrailMarkers({
        locationId,
        locationName,
        confidenceState,
        safeMapMasking,
        locationOperations,
        relatedLocationIds,
      });
      const intelligenceProvenancePanel = buildIntelligenceProvenancePanel({
        confidenceState,
        safeVerificationHint,
        verificationPathPreviews,
        incidentReplay,
        evidenceTrailMarkers,
        safeMapMasking,
        locationOperations,
        exposedCellCount,
      });
      const safeMapSignals = normalizedOptions.includeSuspicionPlayback || normalizedOptions.safeMapMode
        ? {
          suspicionHeatDecayPlayback,
          safeMapMasking,
          confidenceState,
          safeVerificationHint,
          verificationPathPreviews,
          incidentReplay,
          evidenceTrailMarkers,
          intelligenceProvenancePanel,
        }
        : {};

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
        ...safeMapSignals,
        style: {
          presence: normalizeStyle(styleByPresence, presenceLevel, DEFAULT_STYLE_BY_PRESENCE),
          risk: normalizeStyle(styleByRisk, riskLevel, DEFAULT_STYLE_BY_RISK),
        },
      };
    });
}
