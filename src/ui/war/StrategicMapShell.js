import { Province } from '../../domain/war/Province.js';
import { renderProvince } from './ProvinceRenderer.js';

const DEFAULT_OVERLAY_SLOTS = Object.freeze([
  'climate-overlay',
  'culture-overlay',
  'economy-overlay',
  'intrigue-overlay',
]);

function requireOptions(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('StrategicMapShell options must be an object.');
  }

  return options;
}

function requireProvinceList(provinces) {
  if (!Array.isArray(provinces)) {
    throw new TypeError('StrategicMapShell provinces must be an array.');
  }

  return provinces.map((province) => {
    if (!(province instanceof Province)) {
      throw new TypeError('StrategicMapShell provinces must contain Province instances.');
    }

    return province;
  });
}

function normalizeTextMap(value, label) {
  if (value === undefined) {
    return {};
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function normalizeGeometryMap(value) {
  if (value === undefined) {
    return {};
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('StrategicMapShell provinceGeometryById must be an object.');
  }

  return value;
}

function normalizeOverlaySlots(overlaySlots) {
  if (overlaySlots === undefined) {
    return [...DEFAULT_OVERLAY_SLOTS];
  }

  if (!Array.isArray(overlaySlots)) {
    throw new TypeError('StrategicMapShell overlaySlots must be an array.');
  }

  return [...new Set(overlaySlots.map((slot) => String(slot).trim()).filter(Boolean))];
}

function normalizeCleanupInput(value, label) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return value.filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry));
}

function normalizeIntrigueMapEntries(value) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new TypeError('StrategicMapShell intrigueMapOverlay must be an array.');
  }

  return value.map((entry) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new TypeError('StrategicMapShell intrigueMapOverlay entries must be objects.');
    }

    const locationId = String(entry.locationId ?? '').trim();

    return {
      locationId,
      locationName: String(entry.locationName ?? locationId).trim() || locationId,
      presenceLevel: String(entry.presenceLevel ?? 'none').trim() || 'none',
      sabotageRiskLevel: String(entry.sabotageRiskLevel ?? 'none').trim() || 'none',
      sabotageRiskScore: Number.isFinite(entry.sabotageRiskScore) ? Math.max(0, Math.min(100, Math.round(entry.sabotageRiskScore))) : 0,
      celluleCount: Number.isFinite(entry.metrics?.celluleCount) ? Math.max(0, Math.round(entry.metrics.celluleCount)) : 0,
      sabotageOperationCount: Number.isFinite(entry.metrics?.sabotageOperationCount)
        ? Math.max(0, Math.round(entry.metrics.sabotageOperationCount))
        : 0,
    };
  }).filter((entry) => entry.locationId);
}

function getRiskLocationId(riskKey) {
  const [, locationId = null] = String(riskKey ?? '').split(':');

  return locationId && locationId.trim() ? locationId.trim() : null;
}

export function buildIntriguePresenceSabotageOverlay(provinces, intrigueMapOverlay = []) {
  const normalizedProvinces = requireProvinceList(provinces);
  const provinceById = new Map(normalizedProvinces.map((province) => [province.id, province]));
  const entries = normalizeIntrigueMapEntries(intrigueMapOverlay)
    .filter((entry) => provinceById.has(entry.locationId))
    .filter((entry) => entry.presenceLevel !== 'none' || entry.sabotageRiskLevel !== 'none' || entry.sabotageRiskScore > 0)
    .map((entry) => {
      const province = provinceById.get(entry.locationId);
      const tone = entry.sabotageRiskLevel === 'high'
        ? 'danger'
        : entry.sabotageRiskLevel === 'medium' || entry.presenceLevel === 'high'
          ? 'warning'
          : 'watch';
      const sortPriority = (entry.sabotageRiskScore * 10)
        + (entry.presenceLevel === 'high' ? 3 : entry.presenceLevel === 'medium' ? 2 : entry.presenceLevel === 'low' ? 1 : 0);

      return {
        provinceId: province.id,
        provinceName: province.name,
        locationId: entry.locationId,
        label: `${province.name}: présence ${entry.presenceLevel}, sabotage ${entry.sabotageRiskLevel} (${entry.sabotageRiskScore})`,
        tone,
        presence: {
          level: entry.presenceLevel,
          celluleCount: entry.celluleCount,
        },
        sabotageRisk: {
          level: entry.sabotageRiskLevel,
          score: entry.sabotageRiskScore,
          operationCount: entry.sabotageOperationCount,
        },
        sortPriority,
      };
    })
    .sort((left, right) => right.sortPriority - left.sortPriority || left.provinceId.localeCompare(right.provinceId))
    .map(({ sortPriority, ...entry }) => entry);

  return {
    overlayId: 'intrigue-presence-sabotage',
    slotId: 'intrigue-overlay',
    label: 'Présence intrigue et risque sabotage',
    markers: entries,
    summary: {
      markerCount: entries.length,
      highRiskCount: entries.filter((entry) => entry.sabotageRisk.level === 'high').length,
      activePresenceCount: entries.filter((entry) => entry.presence.level !== 'none').length,
    },
  };
}

export function buildFirstCleanupPayoff(cleanupOrders = [], residualRisks = []) {
  const normalizedOrders = normalizeCleanupInput(cleanupOrders, 'StrategicMapShell cleanupOrders');
  const normalizedRisks = normalizeCleanupInput(residualRisks, 'StrategicMapShell residualRisks');
  const firstOrder = normalizedOrders[0] ?? null;

  if (!firstOrder) {
    return null;
  }

  const residualRiskKey = String(firstOrder.residualRiskKey ?? '').trim();
  const targetedRisk = normalizedRisks.find((risk) => String(risk.key ?? '').trim() === residualRiskKey) ?? null;
  const remainingRisks = normalizedRisks
    .filter((risk) => String(risk.key ?? '').trim() !== residualRiskKey)
    .map((risk) => ({
      key: String(risk.key ?? '').trim(),
      label: String(risk.label ?? 'risque restant').trim() || 'risque restant',
      reason: String(risk.reason ?? '').trim() || null,
    }));

  return {
    cleanupOrderId: String(firstOrder.id ?? '').trim() || null,
    cleanupOrderLabel: String(firstOrder.label ?? 'Ordre de nettoyage').trim() || 'Ordre de nettoyage',
    residualRiskKey,
    targetId: getRiskLocationId(residualRiskKey),
    riskReduced: String(firstOrder.riskReduced ?? targetedRisk?.label ?? 'risque résiduel').trim() || 'risque résiduel',
    priorityReason: String(firstOrder.reason ?? targetedRisk?.reason ?? 'premier ordre recommandé').trim()
      || 'premier ordre recommandé',
    currentRiskReason: String(targetedRisk?.reason ?? '').trim() || null,
    expectedEffect: String(firstOrder.expectedEffect ?? `réduit ${firstOrder.riskReduced ?? targetedRisk?.label ?? 'le risque ciblé'}`).trim(),
    remainingRiskState: remainingRisks.length === 0 ? 'no-visible-risk' : 'residual-risk-remains',
    remainingRiskCount: remainingRisks.length,
    remainingRisks,
  };
}

export function buildFollowUpCleanupChoices(cleanupOrders = [], residualRisks = [], firstCleanupPayoff = null) {
  const normalizedOrders = normalizeCleanupInput(cleanupOrders, 'StrategicMapShell cleanupOrders');
  const normalizedRisks = normalizeCleanupInput(residualRisks, 'StrategicMapShell residualRisks');
  const skippedOrderId = String(firstCleanupPayoff?.cleanupOrderId ?? normalizedOrders[0]?.id ?? '').trim();
  const skippedRiskKey = String(firstCleanupPayoff?.residualRiskKey ?? normalizedOrders[0]?.residualRiskKey ?? '').trim();

  return normalizedOrders
    .filter((order) => {
      const orderId = String(order.id ?? '').trim();
      const residualRiskKey = String(order.residualRiskKey ?? '').trim();

      return orderId !== skippedOrderId && residualRiskKey !== skippedRiskKey;
    })
    .map((order) => {
      const residualRiskKey = String(order.residualRiskKey ?? '').trim();
      const matchingRisk = normalizedRisks.find((risk) => String(risk.key ?? '').trim() === residualRiskKey) ?? null;
      const riskCovered = String(order.riskReduced ?? matchingRisk?.label ?? 'risque résiduel').trim() || 'risque résiduel';

      return {
        rank: 0,
        cleanupOrderId: String(order.id ?? '').trim() || null,
        cleanupOrderLabel: String(order.label ?? 'Ordre de suivi').trim() || 'Ordre de suivi',
        residualRiskKey,
        targetId: getRiskLocationId(residualRiskKey),
        riskCovered,
        expectedBenefit: String(order.expectedBenefit ?? order.expectedEffect ?? `réduit ${riskCovered}`).trim(),
        rankReason: String(order.reason ?? matchingRisk?.reason ?? 'meilleur suivi restant').trim() || 'meilleur suivi restant',
        prerequisite: String(order.prerequisite ?? '').trim() || null,
        safetyScore: Number.isFinite(order.safetyScore) ? order.safetyScore : 0,
      };
    })
    .sort((left, right) => right.safetyScore - left.safetyScore
      || left.residualRiskKey.localeCompare(right.residualRiskKey)
      || String(left.cleanupOrderId ?? '').localeCompare(String(right.cleanupOrderId ?? '')))
    .slice(0, 3)
    .map((choice, index) => ({ ...choice, rank: index + 1 }));
}

export function buildTopFollowUpReadiness(followUpCleanupChoices = [], residualRisks = []) {
  const normalizedChoices = normalizeCleanupInput(followUpCleanupChoices, 'StrategicMapShell followUpCleanupChoices');
  const normalizedRisks = normalizeCleanupInput(residualRisks, 'StrategicMapShell residualRisks');
  const topChoice = normalizedChoices[0] ?? null;

  if (!topChoice) {
    return {
      state: 'no-safe-followup',
      tone: 'neutral',
      label: 'Aucun suivi sûr',
      blocker: 'aucun cleanup de suivi exploitable',
      action: null,
      targetId: null,
      residualRiskKey: null,
    };
  }

  const riskKey = String(topChoice.residualRiskKey ?? '').trim();
  const riskType = riskKey.split(':')[0];
  const matchingRisk = normalizedRisks.find((risk) => String(risk.key ?? '').trim() === riskKey) ?? null;
  const prerequisite = String(topChoice.prerequisite ?? '').trim();
  const riskReason = String(matchingRisk?.reason ?? topChoice.rankReason ?? '').trim();

  if (riskType === 'route-exposure' || /éclaireur|détour|route|axe|corridor/i.test(`${prerequisite} ${riskReason}`)) {
    return {
      state: 'needs-logistics',
      tone: 'warning',
      label: 'Logistique à vérifier',
      blocker: prerequisite || 'axe ou détour encore exposé',
      action: 'sécuriser le corridor court avant exécution',
      targetId: topChoice.targetId,
      residualRiskKey: riskKey,
    };
  }

  if (riskType === 'low-loyalty' || riskType === 'contested-occupation' || /loyauté|occupation|patrouille|émissaire|disputée/i.test(`${prerequisite} ${riskReason}`)) {
    return {
      state: 'stabilize-control',
      tone: 'warning',
      label: 'Contrôle local à stabiliser',
      blocker: prerequisite || 'loyauté ou occupation encore fragile',
      action: 'stabiliser la province avant le suivi',
      targetId: topChoice.targetId,
      residualRiskKey: riskKey,
    };
  }

  if (riskType === 'supply-pressure' || /ravitaillement|convoi|approvisionnement/i.test(`${prerequisite} ${riskReason}`)) {
    return {
      state: 'supply-pressure',
      tone: 'danger',
      label: 'Ravitaillement sous pression',
      blocker: prerequisite || 'pression ravitaillement visible',
      action: 'ouvrir le convoi court avant de confirmer',
      targetId: topChoice.targetId,
      residualRiskKey: riskKey,
    };
  }

  return {
    state: 'ready-now',
    tone: 'ready',
    label: 'Prêt maintenant',
    blocker: prerequisite || 'aucun bloqueur visible',
    action: topChoice.cleanupOrderLabel,
    targetId: topChoice.targetId,
    residualRiskKey: riskKey,
  };
}

function summarizeUntreatedRisk(residualRisks, treatedRiskKey) {
  const untreatedRisk = residualRisks.find((risk) => String(risk.key ?? '').trim() !== treatedRiskKey) ?? null;

  return untreatedRisk
    ? String(untreatedRisk.label ?? 'risque restant').trim() || 'risque restant'
    : 'aucun risque visible';
}

export function buildFollowUpCleanupMiniPlan(followUpCleanupChoices = [], residualRisks = [], topFollowUpReadiness = null) {
  const normalizedChoices = normalizeCleanupInput(followUpCleanupChoices, 'StrategicMapShell followUpCleanupChoices');
  const normalizedRisks = normalizeCleanupInput(residualRisks, 'StrategicMapShell residualRisks');
  const topChoice = normalizedChoices[0] ?? null;

  if (!topChoice || topFollowUpReadiness?.state === 'no-safe-followup') {
    return {
      empty: true,
      reason: 'aucun cleanup suivi sûr',
      targetId: null,
      steps: [],
    };
  }

  const treatedRiskKey = String(topChoice.residualRiskKey ?? '').trim();
  const readinessStep = topFollowUpReadiness?.state !== 'ready-now'
    ? {
      stepId: `followup-readiness:${treatedRiskKey || 'unknown'}`,
      order: 1,
      label: topFollowUpReadiness?.action ?? 'Lever bloqueur visible',
      prerequisite: topFollowUpReadiness?.blocker ?? 'donnée manquante',
      riskReduced: 'bloqueur readiness',
      untreatedRisk: String(topChoice.riskCovered ?? 'risque ciblé').trim() || 'risque ciblé',
      state: topFollowUpReadiness?.state ?? 'unknown',
    }
    : null;
  const cleanupStepOrder = readinessStep ? 2 : 1;
  const cleanupStep = {
    stepId: `followup-cleanup:${treatedRiskKey || 'unknown'}`,
    order: cleanupStepOrder,
    label: topChoice.cleanupOrderLabel ?? 'Exécuter cleanup suivi',
    prerequisite: topChoice.prerequisite ?? topFollowUpReadiness?.blocker ?? 'aucun prérequis visible',
    riskReduced: topChoice.riskCovered ?? 'risque ciblé',
    untreatedRisk: summarizeUntreatedRisk(normalizedRisks, treatedRiskKey),
    state: 'execute-cleanup',
  };
  const remainingStep = normalizedChoices[1]
    ? {
      stepId: `followup-next:${normalizedChoices[1].residualRiskKey || 'unknown'}`,
      order: cleanupStepOrder + 1,
      label: normalizedChoices[1].cleanupOrderLabel ?? 'Préparer suivi restant',
      prerequisite: normalizedChoices[1].prerequisite ?? 'donnée manquante',
      riskReduced: normalizedChoices[1].riskCovered ?? 'risque suivant',
      untreatedRisk: summarizeUntreatedRisk(normalizedRisks, String(normalizedChoices[1].residualRiskKey ?? '').trim()),
      state: 'next-followup',
    }
    : null;

  return {
    empty: false,
    reason: topFollowUpReadiness?.label ?? 'suivi prêt',
    targetId: topChoice.targetId ?? null,
    steps: [readinessStep, cleanupStep, remainingStep].filter(Boolean).slice(0, 3)
      .map((step, index) => ({ ...step, order: index + 1 })),
  };
}

function getMiniPlanConflictProfile(risk) {
  const riskKey = String(risk.key ?? '').trim();
  const riskType = riskKey.split(':')[0];
  const reason = String(risk.reason ?? risk.label ?? '').trim();

  if (riskType === 'supply-pressure' || /ravitaillement|approvisionnement|convoi/i.test(reason)) {
    return {
      severity: 'blocking',
      label: 'Convoi partagé',
      mitigation: 'réserver le convoi court avant le mini-plan',
    };
  }

  if (riskType === 'neighbor-front' || /front voisin|priorité|ordre/i.test(reason)) {
    return {
      severity: 'blocking',
      label: 'Priorité voisine',
      mitigation: 'caler une couverture voisine minimale',
    };
  }

  if (riskType === 'contested-occupation' || /occupation|disput/i.test(reason)) {
    return {
      severity: 'watchable',
      label: 'Occupation fragile',
      mitigation: 'garder patrouille locale en réserve',
    };
  }

  if (riskType === 'low-loyalty' || /loyaut|émissaire/i.test(reason)) {
    return {
      severity: 'watchable',
      label: 'Loyauté à suivre',
      mitigation: 'envoyer liaison si le plan dure',
    };
  }

  if (riskType === 'route-exposure' || /route|axe|détour|corridor/i.test(reason)) {
    return {
      severity: 'watchable',
      label: 'Axe partagé',
      mitigation: 'surveiller le détour pendant exécution',
    };
  }

  return {
    severity: 'watchable',
    label: 'Dépendance visible',
    mitigation: 'surveiller avant confirmation',
  };
}

export function buildMiniPlanDependencyConflicts(followUpCleanupMiniPlan = null, residualRisks = [], topFollowUpReadiness = null) {
  const normalizedRisks = normalizeCleanupInput(residualRisks, 'StrategicMapShell residualRisks');

  if (!followUpCleanupMiniPlan || followUpCleanupMiniPlan.empty) return [];

  const plannedRiskLabels = new Set((followUpCleanupMiniPlan.steps ?? [])
    .map((step) => String(step.riskReduced ?? '').trim())
    .filter(Boolean));
  const readinessRiskKey = String(topFollowUpReadiness?.residualRiskKey ?? '').trim();

  return normalizedRisks
    .filter((risk) => {
      const riskKey = String(risk.key ?? '').trim();
      const label = String(risk.label ?? '').trim();

      return riskKey !== readinessRiskKey && !plannedRiskLabels.has(label);
    })
    .map((risk) => {
      const riskKey = String(risk.key ?? '').trim();
      const profile = getMiniPlanConflictProfile(risk);

      return {
        conflictId: `mini-plan-conflict:${riskKey || 'unknown'}`,
        severity: profile.severity,
        label: profile.label,
        reason: String(risk.reason ?? risk.label ?? 'donnée incertaine').trim() || 'donnée incertaine',
        mitigation: profile.mitigation,
        residualRiskKey: riskKey,
        targetId: getRiskLocationId(riskKey),
      };
    })
    .sort((left, right) => {
      const severityRank = { blocking: 0, watchable: 1 };
      return (severityRank[left.severity] ?? 2) - (severityRank[right.severity] ?? 2)
        || left.residualRiskKey.localeCompare(right.residualRiskKey);
    })
    .slice(0, 3);
}

export function buildMiniPlanConflictTradeoffs(followUpCleanupMiniPlan = null, miniPlanDependencyConflicts = []) {
  const normalizedConflicts = normalizeCleanupInput(
    miniPlanDependencyConflicts,
    'StrategicMapShell miniPlanDependencyConflicts',
  );

  if (!followUpCleanupMiniPlan || followUpCleanupMiniPlan.empty || normalizedConflicts.length === 0) return [];

  const firstPlanStep = (followUpCleanupMiniPlan.steps ?? []).find((step) => step?.state === 'execute-cleanup')
    ?? followUpCleanupMiniPlan.steps?.[0]
    ?? null;
  const miniPlanAction = String(firstPlanStep?.label ?? 'exécuter mini-plan').trim() || 'exécuter mini-plan';

  return normalizedConflicts
    .map((conflict, index) => {
      const severity = String(conflict.severity ?? 'watchable').trim() || 'watchable';
      const blocking = severity === 'blocking';
      const mitigation = String(conflict.mitigation ?? 'surveiller avant confirmation').trim() || 'surveiller avant confirmation';
      const label = String(conflict.label ?? 'Dépendance visible').trim() || 'Dépendance visible';

      return {
        tradeoffId: `mini-plan-tradeoff:${conflict.residualRiskKey ?? index + 1}`,
        conflictId: conflict.conflictId ?? null,
        severity,
        reason: String(conflict.reason ?? 'donnée incertaine').trim() || 'donnée incertaine',
        recommendedChoice: blocking ? mitigation : miniPlanAction,
        rejectedChoice: blocking ? miniPlanAction : mitigation,
        rejectedCost: blocking ? `retarde ${miniPlanAction}` : `laisse ${label.toLowerCase()} sous surveillance`,
        label: blocking ? `prioriser ${label.toLowerCase()}` : `continuer malgré ${label.toLowerCase()}`,
        targetId: conflict.targetId ?? null,
      };
    })
    .slice(0, 3);
}

export function buildMiniPlanTradeoffActionPreview(followUpCleanupMiniPlan = null, miniPlanConflictTradeoffs = []) {
  const normalizedTradeoffs = normalizeCleanupInput(
    miniPlanConflictTradeoffs,
    'StrategicMapShell miniPlanConflictTradeoffs',
  );
  const chosenTradeoff = normalizedTradeoffs[0] ?? null;

  if (!chosenTradeoff || !followUpCleanupMiniPlan || followUpCleanupMiniPlan.empty) {
    return {
      empty: true,
      reason: 'aucun arbitrage actionnable',
      tradeoffId: null,
      targetId: null,
      action: null,
      prerequisite: null,
      expectedBenefit: null,
    };
  }

  const firstPlanStep = (followUpCleanupMiniPlan.steps ?? []).find((step) => step?.state === 'execute-cleanup')
    ?? followUpCleanupMiniPlan.steps?.[0]
    ?? null;
  const action = String(chosenTradeoff.recommendedChoice ?? firstPlanStep?.label ?? 'confirmer arbitrage').trim()
    || 'confirmer arbitrage';
  const riskReduced = String(firstPlanStep?.riskReduced ?? '').trim();
  const expectedBenefit = chosenTradeoff.severity === 'blocking'
    ? `débloque ${chosenTradeoff.rejectedChoice ?? 'le mini-plan'}`
    : (riskReduced ? `réduit ${riskReduced}` : `confirme ${action}`);

  return {
    empty: false,
    reason: chosenTradeoff.reason ?? 'donnée incertaine',
    tradeoffId: chosenTradeoff.tradeoffId ?? null,
    targetId: chosenTradeoff.targetId ?? followUpCleanupMiniPlan.targetId ?? null,
    action,
    prerequisite: chosenTradeoff.reason ?? firstPlanStep?.prerequisite ?? 'donnée incertaine',
    expectedBenefit,
  };
}

function describeRivalResponse(reason, action) {
  const text = `${reason} ${action}`;

  if (/convoi|ravitaillement|approvisionnement/i.test(text)) return 'coupure du convoi partagé';
  if (/front voisin|priorité|couverture/i.test(text)) return 'contre-poussée du front voisin';
  if (/loyaut|émissaire|liaison/i.test(text)) return 'agitation locale avant liaison';
  if (/route|axe|détour|corridor|éclaireur/i.test(text)) return 'interception du détour';
  if (/occupation|patrouille|disput/i.test(text)) return 'reprise de zone disputée';

  return 'réponse adverse imprévue';
}

export function buildMiniPlanRivalResponseRisk(miniPlanTradeoffActionPreview = null, miniPlanConflictTradeoffs = []) {
  const normalizedTradeoffs = normalizeCleanupInput(
    miniPlanConflictTradeoffs,
    'StrategicMapShell miniPlanConflictTradeoffs',
  );
  const chosenTradeoff = normalizedTradeoffs.find(
    (tradeoff) => tradeoff.tradeoffId === miniPlanTradeoffActionPreview?.tradeoffId,
  ) ?? normalizedTradeoffs[0] ?? null;

  if (!miniPlanTradeoffActionPreview || miniPlanTradeoffActionPreview.empty || !chosenTradeoff) {
    return {
      empty: true,
      level: 'low',
      label: 'Risque faible',
      response: 'aucune réponse adverse lisible',
      watch: null,
      tradeoffId: null,
      targetId: null,
    };
  }

  const reason = String(chosenTradeoff.reason ?? miniPlanTradeoffActionPreview.reason ?? 'donnée incertaine').trim()
    || 'donnée incertaine';
  const action = String(miniPlanTradeoffActionPreview.action ?? chosenTradeoff.recommendedChoice ?? '').trim();
  const level = chosenTradeoff.severity === 'blocking'
    ? 'high'
    : (/loyaut|route|axe|occupation|disput/i.test(reason) ? 'medium' : 'low');
  const labelByLevel = {
    high: 'Risque élevé',
    medium: 'Risque moyen',
    low: 'Risque faible',
  };

  return {
    empty: false,
    level,
    label: labelByLevel[level],
    response: describeRivalResponse(reason, action),
    watch: `À surveiller: ${reason}`,
    tradeoffId: chosenTradeoff.tradeoffId ?? null,
    targetId: miniPlanTradeoffActionPreview.targetId ?? chosenTradeoff.targetId ?? null,
  };
}

function compareRivalRiskLevel(level) {
  return ({ low: 1, medium: 2, high: 3 }[level] ?? 1);
}

export function buildMiniPlanRivalResponseComparison(followUpCleanupMiniPlan = null, miniPlanConflictTradeoffs = []) {
  const normalizedTradeoffs = normalizeCleanupInput(
    miniPlanConflictTradeoffs,
    'StrategicMapShell miniPlanConflictTradeoffs',
  );

  if (!followUpCleanupMiniPlan || followUpCleanupMiniPlan.empty || normalizedTradeoffs.length === 0) {
    return {
      empty: true,
      recommendedTradeoffId: null,
      recommendationChanged: false,
      reason: 'aucune branche à comparer',
      branches: [],
    };
  }

  const branches = normalizedTradeoffs.slice(0, 3).map((tradeoff, index) => {
    const preview = buildMiniPlanTradeoffActionPreview(followUpCleanupMiniPlan, [tradeoff]);
    const risk = buildMiniPlanRivalResponseRisk(preview, [tradeoff]);

    return {
      branchId: `mini-plan-branch:${index + 1}:${tradeoff.tradeoffId ?? 'unknown'}`,
      tradeoffId: tradeoff.tradeoffId ?? null,
      recommended: index === 0,
      action: preview.action,
      rivalResponse: risk.response,
      riskLevel: risk.level,
      reason: risk.watch ?? tradeoff.reason ?? 'donnée incertaine',
      targetId: preview.targetId ?? tradeoff.targetId ?? null,
    };
  });
  const initialBranch = branches[0];
  const saferBranch = branches
    .slice()
    .sort((left, right) => compareRivalRiskLevel(left.riskLevel) - compareRivalRiskLevel(right.riskLevel)
      || left.branchId.localeCompare(right.branchId))[0] ?? initialBranch;
  const recommendationChanged = Boolean(
    initialBranch && saferBranch && compareRivalRiskLevel(saferBranch.riskLevel) < compareRivalRiskLevel(initialBranch.riskLevel),
  );

  return {
    empty: false,
    recommendedTradeoffId: recommendationChanged ? saferBranch.tradeoffId : initialBranch?.tradeoffId ?? null,
    recommendationChanged,
    reason: recommendationChanged
      ? `${initialBranch.rivalResponse} rend la branche initiale trop risquée`
      : 'branche recommandée robuste face aux réponses listées',
    branches: branches.map((branch) => ({
      ...branch,
      recommended: recommendationChanged
        ? branch.tradeoffId === saferBranch.tradeoffId
        : branch.tradeoffId === initialBranch?.tradeoffId,
    })),
  };
}

function describeFallbackCost(fallbackBranch, initialBranch) {
  if (!fallbackBranch || !initialBranch) return 'coût incertain';
  if (fallbackBranch.targetId && initialBranch.targetId && fallbackBranch.targetId !== initialBranch.targetId) {
    return `cible moins prioritaire: ${fallbackBranch.targetId}`;
  }
  if (fallbackBranch.riskLevel === initialBranch.riskLevel) return 'bénéfice moindre mais risque équivalent';
  return `délai avant ${initialBranch.action ?? 'branche initiale'}`;
}

export function buildMiniPlanRivalResponseFallback(miniPlanRivalResponseComparison = null) {
  if (!miniPlanRivalResponseComparison || miniPlanRivalResponseComparison.empty) {
    return {
      empty: true,
      fallbackBranchId: null,
      action: null,
      reason: 'aucun fallback requis',
      cost: null,
      targetId: null,
    };
  }

  const branches = normalizeCleanupInput(
    miniPlanRivalResponseComparison.branches ?? [],
    'StrategicMapShell miniPlanRivalResponseComparison.branches',
  );
  const initialBranch = branches[0] ?? null;
  const fallbackBranch = branches.find((branch) => branch.recommended && branch.branchId !== initialBranch?.branchId)
    ?? branches
      .filter((branch) => branch.branchId !== initialBranch?.branchId)
      .sort((left, right) => compareRivalRiskLevel(left.riskLevel) - compareRivalRiskLevel(right.riskLevel)
        || left.branchId.localeCompare(right.branchId))[0]
    ?? null;

  if (!fallbackBranch || !initialBranch || compareRivalRiskLevel(initialBranch.riskLevel) < 3) {
    return {
      empty: true,
      fallbackBranchId: null,
      action: null,
      reason: 'branche recommandée encore sûre',
      cost: null,
      targetId: null,
    };
  }

  return {
    empty: false,
    fallbackBranchId: fallbackBranch.branchId,
    action: fallbackBranch.action,
    reason: `${fallbackBranch.rivalResponse} reste ${fallbackBranch.riskLevel}, contre ${initialBranch.rivalResponse}`,
    cost: describeFallbackCost(fallbackBranch, initialBranch),
    targetId: fallbackBranch.targetId ?? null,
  };
}

function describeFallbackReturnCondition(initialBranch, fallbackBranch, fallback) {
  const rivalResponse = initialBranch?.rivalResponse ?? 'réponse rivale';
  const cost = fallback?.cost ?? '';
  if (String(cost).startsWith('cible moins prioritaire')) return `revenir quand ${initialBranch?.targetId ?? 'la cible initiale'} devient moins exposée`;
  if (String(cost).startsWith('délai')) return 'revenir quand le délai rival est absorbé';
  if (String(rivalResponse).includes('convoi') || String(rivalResponse).includes('coupure')) return 'revenir quand le prérequis logistique est sécurisé';
  if (String(rivalResponse).includes('agitation')) return 'revenir quand la réponse rivale se dissipe';
  return 'revenir quand la réponse rivale baisse';
}

export function buildMiniPlanFallbackReturnCue(
  miniPlanRivalResponseFallback = null,
  miniPlanRivalResponseComparison = null,
) {
  if (!miniPlanRivalResponseFallback || miniPlanRivalResponseFallback.empty
    || !miniPlanRivalResponseComparison || miniPlanRivalResponseComparison.empty) {
    return {
      empty: true,
      decision: 'none',
      condition: 'aucun retour à arbitrer',
      switchCost: null,
      reason: null,
      initialBranchId: null,
      fallbackBranchId: null,
    };
  }

  const branches = normalizeCleanupInput(
    miniPlanRivalResponseComparison.branches ?? [],
    'StrategicMapShell miniPlanRivalResponseComparison.branches',
  );
  const initialBranch = branches[0] ?? null;
  const fallbackBranch = branches.find((branch) => branch.branchId === miniPlanRivalResponseFallback.fallbackBranchId) ?? null;
  if (!initialBranch || !fallbackBranch) {
    return {
      empty: true,
      decision: 'none',
      condition: 'fallback incomplet',
      switchCost: null,
      reason: null,
      initialBranchId: null,
      fallbackBranchId: miniPlanRivalResponseFallback.fallbackBranchId ?? null,
    };
  }

  const initialRisk = compareRivalRiskLevel(initialBranch.riskLevel);
  const fallbackRisk = compareRivalRiskLevel(fallbackBranch.riskLevel);
  const shouldKeepFallback = initialRisk > fallbackRisk;

  return {
    empty: false,
    decision: shouldKeepFallback ? 'keep-fallback' : 'return-initial',
    condition: describeFallbackReturnCondition(initialBranch, fallbackBranch, miniPlanRivalResponseFallback),
    switchCost: `changer encore consomme ${miniPlanRivalResponseFallback.cost ?? 'un tempo de coordination'}`,
    reason: shouldKeepFallback
      ? `garder le fallback tant que ${initialBranch.rivalResponse} reste ${initialBranch.riskLevel}`
      : `revenir à la branche initiale si son risque retombe au niveau ${fallbackBranch.riskLevel}`,
    initialBranchId: initialBranch.branchId,
    fallbackBranchId: fallbackBranch.branchId,
  };
}

function protectionDecisionForRisk(initialRisk, fallbackRisk) {
  if (initialRisk <= Math.max(1, fallbackRisk - 1)) return 'return-now';
  if (initialRisk <= fallbackRisk) return 'wait-signal';
  return 'confirm-fallback';
}

export function buildMiniPlanReturnProtectionStatus(
  miniPlanFallbackReturnCue = null,
  miniPlanRivalResponseFallback = null,
  miniPlanRivalResponseComparison = null,
) {
  if (!miniPlanFallbackReturnCue || miniPlanFallbackReturnCue.empty
    || !miniPlanRivalResponseFallback || miniPlanRivalResponseFallback.empty
    || !miniPlanRivalResponseComparison || miniPlanRivalResponseComparison.empty) {
    return {
      empty: true,
      state: 'none',
      label: 'protection non évaluée',
      constraint: null,
      nextDecision: null,
      reason: null,
    };
  }

  const branches = normalizeCleanupInput(
    miniPlanRivalResponseComparison.branches ?? [],
    'StrategicMapShell miniPlanRivalResponseComparison.branches',
  );
  const initialBranch = branches.find((branch) => branch.branchId === miniPlanFallbackReturnCue.initialBranchId)
    ?? branches[0]
    ?? null;
  const fallbackBranch = branches.find((branch) => branch.branchId === miniPlanRivalResponseFallback.fallbackBranchId)
    ?? null;
  if (!initialBranch || !fallbackBranch) {
    return {
      empty: true,
      state: 'none',
      label: 'protection non évaluée',
      constraint: null,
      nextDecision: null,
      reason: null,
    };
  }

  const initialRisk = compareRivalRiskLevel(initialBranch.riskLevel);
  const fallbackRisk = compareRivalRiskLevel(fallbackBranch.riskLevel);
  const nextDecision = protectionDecisionForRisk(initialRisk, fallbackRisk);
  const state = nextDecision === 'return-now'
    ? 'kept'
    : nextDecision === 'wait-signal'
      ? 'partial'
      : 'lost';

  return {
    empty: false,
    state,
    label: state === 'kept'
      ? 'protection conservée'
      : state === 'partial'
        ? 'protection partielle'
        : 'protection perdue',
    constraint: initialBranch.rivalResponse ?? fallbackBranch.rivalResponse ?? 'réponse rivale',
    nextDecision,
    reason: nextDecision === 'return-now'
      ? 'revenir maintenant: le risque initial ne dépasse plus le fallback'
      : nextDecision === 'wait-signal'
        ? `attendre un signal: ${miniPlanFallbackReturnCue.condition}`
        : `confirmer le fallback: ${initialBranch.rivalResponse} reste plus dangereux`,
  };
}

export function buildMiniPlanConfidenceSignalCue(
  miniPlanReturnProtectionStatus = null,
  miniPlanFallbackReturnCue = null,
  miniPlanRivalResponseFallback = null,
) {
  if (!miniPlanReturnProtectionStatus || miniPlanReturnProtectionStatus.empty) {
    return {
      empty: true,
      decision: 'none',
      label: 'confiance non évaluée',
      signal: null,
      waitCost: null,
    };
  }

  const decision = miniPlanReturnProtectionStatus.nextDecision === 'return-now'
    ? 'return-confirmed'
    : miniPlanReturnProtectionStatus.nextDecision === 'confirm-fallback'
      ? 'hold-fallback'
      : 'wait-confidence';
  const signal = decision === 'return-confirmed'
    ? 'risque initial revenu sous le fallback'
    : decision === 'hold-fallback'
      ? `${miniPlanReturnProtectionStatus.constraint} encore actif`
      : miniPlanFallbackReturnCue?.condition ?? `signal sur ${miniPlanReturnProtectionStatus.constraint}`;

  return {
    empty: false,
    decision,
    label: decision === 'return-confirmed'
      ? 'retour confirmé'
      : decision === 'hold-fallback'
        ? 'tenir fallback'
        : 'attendre signal confiance',
    signal,
    waitCost: `attendre trop longtemps coûte ${miniPlanRivalResponseFallback?.cost ?? 'un tempo de coordination'}`,
  };
}

function extractReversibilityConstraint(miniPlanRivalResponseFallback) {
  const cost = String(miniPlanRivalResponseFallback?.cost ?? '').trim();
  if (cost.includes('cible moins prioritaire')) return 'position moins prioritaire';
  if (cost.includes('délai')) return 'tempo rival';
  if (cost.includes('bénéfice moindre')) return 'coût d’opportunité';
  return 'fenêtre d’ordre';
}

export function buildMiniPlanDecisionReversibilityCue(
  miniPlanConfidenceSignalCue = null,
  miniPlanRivalResponseFallback = null,
) {
  if (!miniPlanConfidenceSignalCue || miniPlanConfidenceSignalCue.empty) {
    return {
      empty: true,
      state: 'none',
      label: 'réversibilité non évaluée',
      constraint: null,
      nextStep: null,
    };
  }

  const state = miniPlanConfidenceSignalCue.decision === 'wait-confidence'
    ? 'reversible'
    : miniPlanConfidenceSignalCue.decision === 'return-confirmed'
      ? 'costly'
      : 'locked';

  return {
    empty: false,
    state,
    label: state === 'reversible'
      ? 'réversible'
      : state === 'costly'
        ? 'correction coûteuse'
        : 'quasi verrouillée',
    constraint: extractReversibilityConstraint(miniPlanRivalResponseFallback),
    nextStep: state === 'reversible'
      ? 'garder un ordre court en réserve'
      : state === 'costly'
        ? 'préserver un tempo de correction'
        : null,
  };
}

export function buildMiniPlanLastSafeCorrectionCue(miniPlanDecisionReversibilityCue = null) {
  if (!miniPlanDecisionReversibilityCue || miniPlanDecisionReversibilityCue.empty) {
    return {
      empty: true,
      state: 'none',
      label: 'fenêtre correction inconnue',
      constraint: null,
      nextStep: null,
    };
  }

  const state = miniPlanDecisionReversibilityCue.state === 'reversible'
    ? 'safe-correction'
    : miniPlanDecisionReversibilityCue.state === 'costly'
      ? 'last-correction-turn'
      : 'locked-commitment';

  return {
    empty: false,
    state,
    label: state === 'safe-correction'
      ? 'correction encore sûre'
      : state === 'last-correction-turn'
        ? 'dernier tour de correction'
        : 'engagement verrouillé',
    constraint: miniPlanDecisionReversibilityCue.constraint ?? 'fenêtre d’ordre',
    nextStep: state === 'safe-correction'
      ? 'préparer correction courte'
      : state === 'last-correction-turn'
        ? 'corriger maintenant ou assumer'
        : null,
  };
}

function describeLateCorrectionLoss(constraint) {
  const normalized = String(constraint ?? '').toLowerCase();
  if (normalized.includes('tempo')) return 'tempo';
  if (normalized.includes('position')) return 'position';
  if (normalized.includes('opportunité')) return 'opportunité rivale';
  if (normalized.includes('ordre')) return 'ordre engagé';
  return 'appui';
}

export function buildMiniPlanLateCorrectionExitCost(miniPlanLastSafeCorrectionCue = null) {
  if (!miniPlanLastSafeCorrectionCue || miniPlanLastSafeCorrectionCue.empty) {
    return {
      empty: true,
      severity: 'none',
      label: 'coût de sortie inconnu',
      loss: null,
      decision: null,
    };
  }

  const severity = miniPlanLastSafeCorrectionCue.state === 'safe-correction'
    ? 'light'
    : miniPlanLastSafeCorrectionCue.state === 'last-correction-turn'
      ? 'costly'
      : 'deterrent';

  return {
    empty: false,
    severity,
    label: severity === 'light'
      ? 'coût léger'
      : severity === 'costly'
        ? 'coûteux mais possible'
        : 'coût dissuasif',
    loss: describeLateCorrectionLoss(miniPlanLastSafeCorrectionCue.constraint),
    decision: severity === 'light'
      ? 'corriger maintenant'
      : severity === 'costly'
        ? 'assumer le plan'
        : 'attendre sans nouvelle correction',
  };
}

function followThroughSupportForLoss(loss) {
  if (loss === 'tempo') return 'tempo';
  if (loss === 'position') return 'position';
  if (loss === 'opportunité rivale') return 'opportunité rivale';
  if (loss === 'ordre engagé') return 'ordre engagé';
  return 'appui allié';
}

export function buildMiniPlanMinimalFollowThrough(miniPlanLateCorrectionExitCost = null) {
  if (!miniPlanLateCorrectionExitCost || miniPlanLateCorrectionExitCost.empty) {
    return {
      empty: true,
      level: 'none',
      label: 'aucun suivi critique',
      support: null,
      action: null,
    };
  }

  const level = miniPlanLateCorrectionExitCost.severity === 'deterrent'
    ? 'urgent'
    : miniPlanLateCorrectionExitCost.severity === 'costly'
      ? 'advised'
      : 'none';
  const support = followThroughSupportForLoss(miniPlanLateCorrectionExitCost.loss);

  return {
    empty: false,
    level,
    label: level === 'urgent'
      ? 'suivi urgent'
      : level === 'advised'
        ? 'suivi conseillé'
        : 'aucun suivi critique',
    support,
    action: support === 'tempo'
      ? 'consolider'
      : support === 'position'
        ? 'protéger position'
        : support === 'ordre engagé'
          ? 'confirmer ordre'
          : support === 'opportunité rivale'
            ? 'surveiller'
            : 'économiser fatigue',
  };
}

export function buildMiniPlanFollowThroughOpportunityTradeoff(miniPlanMinimalFollowThrough = null) {
  if (!miniPlanMinimalFollowThrough || miniPlanMinimalFollowThrough.empty) {
    return {
      empty: true,
      state: 'no-conflict',
      label: 'suivi sans conflit',
      constraint: null,
      action: null,
    };
  }

  const state = miniPlanMinimalFollowThrough.level === 'urgent'
    ? 'opportunity-threatened'
    : miniPlanMinimalFollowThrough.level === 'advised'
      ? 'manageable-conflict'
      : 'no-conflict';
  const constraint = miniPlanMinimalFollowThrough.support ?? 'appui allié';

  return {
    empty: false,
    state,
    label: state === 'opportunity-threatened'
      ? 'opportunité menacée'
      : state === 'manageable-conflict'
        ? 'conflit gérable'
        : 'suivi sans conflit',
    constraint,
    action: state === 'opportunity-threatened'
      ? 'reporter l’opportunité'
      : state === 'manageable-conflict'
        ? (constraint === 'tempo' ? 'limiter l’engagement' : 'sécuriser puis exploiter')
        : 'suivre maintenant',
  };
}

function normalizeTacticalFallbackConstraint(constraint) {
  return constraint === 'opportunité rivale'
    ? 'fenêtre d’opportunité'
    : constraint;
}

export function buildMiniPlanSafestTacticalFallback(miniPlanFollowThroughOpportunityTradeoff = null) {
  if (!miniPlanFollowThroughOpportunityTradeoff || miniPlanFollowThroughOpportunityTradeoff.empty) {
    return {
      empty: true,
      state: 'unneeded',
      label: 'repli inutile',
      constraint: null,
      action: null,
    };
  }

  const constraint = normalizeTacticalFallbackConstraint(
    miniPlanFollowThroughOpportunityTradeoff.constraint ?? 'fenêtre d’opportunité',
  );
  const state = miniPlanFollowThroughOpportunityTradeoff.state === 'opportunity-threatened'
    ? 'urgent-save-opportunity'
    : miniPlanFollowThroughOpportunityTradeoff.state === 'manageable-conflict'
      ? 'value-advised'
      : 'unneeded';

  return {
    empty: false,
    state,
    label: state === 'urgent-save-opportunity'
      ? 'repli urgent pour sauver l’opportunité'
      : state === 'value-advised'
        ? 'repli de valeur conseillé'
        : 'repli inutile',
    constraint,
    action: state === 'urgent-save-opportunity'
      ? (constraint === 'ordre engagé' ? 'abandonner l’ouverture' : 'exploiter maintenant')
      : state === 'value-advised'
        ? (constraint === 'position' ? 'préserver position' : 'sécuriser puis exploiter')
        : 'exploiter maintenant',
  };
}

function holdPlanRiskForConstraint(constraint) {
  if (constraint === 'tempo') return 'tempo repris par le rival';
  if (constraint === 'fatigue') return 'fatigue transforme le repli en retard';
  if (constraint === 'position') return 'position se rouvre';
  if (constraint === 'appui allié') return 'appui allié se disperse';
  if (constraint === 'ordre engagé') return 'ordre engagé se verrouille';
  return 'fenêtre d’opportunité se referme';
}

export function buildMiniPlanNextTurnHoldPlan(miniPlanSafestTacticalFallback = null) {
  if (!miniPlanSafestTacticalFallback || miniPlanSafestTacticalFallback.empty) {
    return {
      empty: true,
      label: 'plan prochain tour non requis',
      action: null,
      constraint: null,
      riskIfIgnored: null,
    };
  }

  const constraint = miniPlanSafestTacticalFallback.constraint ?? 'fenêtre d’opportunité';
  const action = miniPlanSafestTacticalFallback.state === 'urgent-save-opportunity'
    ? (miniPlanSafestTacticalFallback.action === 'abandonner l’ouverture' ? 'tenir position engagée' : 'verrouiller exploitation')
    : miniPlanSafestTacticalFallback.state === 'value-advised'
      ? (constraint === 'position' ? 'ancrer position' : 'garder réserve courte')
      : 'maintenir tempo';

  return {
    empty: false,
    label: miniPlanSafestTacticalFallback.state === 'urgent-save-opportunity'
      ? 'tenir ouverture sauvée'
      : miniPlanSafestTacticalFallback.state === 'value-advised'
        ? 'tenir repli de valeur'
        : 'tenir exploitation simple',
    action,
    constraint,
    riskIfIgnored: holdPlanRiskForConstraint(constraint),
  };
}

function holdReleaseConstraintForPlan(nextTurnHoldPlan) {
  if (nextTurnHoldPlan.constraint === 'position') return 'front exposé';
  if (nextTurnHoldPlan.constraint === 'appui allié') return 'support absent';
  if (nextTurnHoldPlan.constraint === 'fenêtre d’opportunité') return 'opportunité encore fragile';
  return 'menace voisine';
}

function holdReleaseActionForConstraint(constraint) {
  if (constraint === 'front exposé') return 'tenir écran';
  if (constraint === 'support absent') return 'rappeler support';
  if (constraint === 'opportunité encore fragile') return 'confirmer ouverture';
  return 'surveiller voisin';
}

export function buildMiniPlanHoldReleaseCue(miniPlanNextTurnHoldPlan = null) {
  if (!miniPlanNextTurnHoldPlan || miniPlanNextTurnHoldPlan.empty) {
    return {
      empty: true,
      state: 'safe-release',
      label: 'relâchement sûr',
      constraint: null,
      action: null,
    };
  }

  const constraint = holdReleaseConstraintForPlan(miniPlanNextTurnHoldPlan);
  const state = miniPlanNextTurnHoldPlan.label === 'tenir ouverture sauvée'
    ? 'hold-required'
    : miniPlanNextTurnHoldPlan.label === 'tenir repli de valeur'
      ? 'cautious-release'
      : 'safe-release';

  return {
    empty: false,
    state,
    label: state === 'hold-required'
      ? 'maintien encore requis'
      : state === 'cautious-release'
        ? 'relâchement prudent possible'
        : 'relâchement sûr',
    constraint,
    action: state === 'safe-release' ? null : holdReleaseActionForConstraint(constraint),
  };
}

function reengagementConstraintForRelease(holdReleaseCue) {
  if (holdReleaseCue.constraint === 'front exposé') return 'front voisin instable';
  if (holdReleaseCue.constraint === 'support absent') return 'support incomplet';
  if (holdReleaseCue.constraint === 'opportunité encore fragile') return 'opportunité trop fragile';
  return 'menace non résolue';
}

export function buildMiniPlanFirstSafeReengagement(miniPlanHoldReleaseCue = null) {
  if (!miniPlanHoldReleaseCue || miniPlanHoldReleaseCue.empty) {
    return {
      empty: true,
      state: 'main-safe',
      label: 'réengagement principal sûr',
      constraint: null,
      action: null,
    };
  }

  const state = miniPlanHoldReleaseCue.state === 'hold-required'
    ? 'defensive-stance'
    : miniPlanHoldReleaseCue.state === 'cautious-release'
      ? 'limited-reengagement'
      : 'main-safe';
  const constraint = reengagementConstraintForRelease(miniPlanHoldReleaseCue);

  return {
    empty: false,
    state,
    label: state === 'defensive-stance'
      ? 'rester en posture défensive'
      : state === 'limited-reengagement'
        ? 'réengagement limité possible'
        : 'réengagement principal sûr',
    constraint,
    action: state === 'defensive-stance'
      ? 'garder écran'
      : state === 'limited-reengagement'
        ? 'tester avancée'
        : null,
  };
}

function prematureReengagementRiskForConstraint(constraint) {
  if (constraint === 'front voisin instable') return 'front repris à revers';
  if (constraint === 'support incomplet') return 'avance sans appui';
  if (constraint === 'menace non résolue') return 'menace convertie en blocage';
  return 'fenêtre cassée par précipitation';
}

export function buildMiniPlanPrematureReengagementRisk(miniPlanFirstSafeReengagement = null) {
  if (!miniPlanFirstSafeReengagement || miniPlanFirstSafeReengagement.empty) {
    return {
      empty: true,
      state: 'ready',
      label: 'fenêtre prête',
      risk: null,
      nextSafe: null,
    };
  }

  const state = miniPlanFirstSafeReengagement.state === 'main-safe'
    ? 'ready'
    : miniPlanFirstSafeReengagement.state === 'limited-reengagement'
      ? 'partial-window'
      : 'too-early';

  return {
    empty: false,
    state,
    label: state === 'ready'
      ? 'fenêtre prête'
      : state === 'partial-window'
        ? 'risque si poussée totale'
        : 'réengagement prématuré',
    risk: state === 'ready'
      ? 'risque contenu'
      : prematureReengagementRiskForConstraint(miniPlanFirstSafeReengagement.constraint),
    nextSafe: state === 'too-early'
      ? 'attendre test limité'
      : state === 'partial-window'
        ? 'attendre fenêtre principale'
        : 'pousser maintenant',
  };
}

function buildLegend(renderedProvinces, options) {
  const factionMetaById = normalizeTextMap(options.factionMetaById, 'StrategicMapShell factionMetaById');
  const paletteByFaction = normalizeTextMap(options.paletteByFaction, 'StrategicMapShell paletteByFaction');
  const controllingFactionIds = [...new Set(renderedProvinces.map((province) => province.controllingFactionId))].sort();

  return {
    factions: controllingFactionIds.map((factionId) => ({
      factionId,
      label: String(factionMetaById[factionId]?.label ?? factionId).trim() || factionId,
      color: String(paletteByFaction[factionId]?.fill ?? '#94A3B8').trim() || '#94A3B8',
      border: String(paletteByFaction[factionId]?.border ?? '#334155').trim() || '#334155',
    })),
    states: [
      { code: 'stable', label: 'Contrôle stable' },
      { code: 'occupied', label: 'Occupation' },
      { code: 'contested', label: 'Front contesté' },
    ],
  };
}

function getProvinceMilitaryPressure(province) {
  let score = 0;

  if (province.contested) score += 72;
  if (province.occupied) score += 48;
  if (province.supplyLevel === 'collapsed') score += 20;
  if (province.supplyLevel === 'disrupted') score += 14;
  if (province.supplyLevel === 'strained') score += 8;
  if (province.loyalty < 45) score += 10;
  score += Math.min(18, Math.max(0, province.strategicValue) * 2);

  const normalizedScore = Math.max(0, Math.min(100, score));

  return {
    score: normalizedScore,
    level: normalizedScore >= 75 ? 'critical' : normalizedScore >= 50 ? 'high' : normalizedScore >= 28 ? 'watch' : 'low',
    label: normalizedScore >= 75 ? 'pression critique' : normalizedScore >= 50 ? 'pression élevée' : normalizedScore >= 28 ? 'à surveiller' : 'pression basse',
  };
}

function buildDefaultProvinceAction(province, pressure) {
  if (province.contested) {
    return {
      code: 'reinforce-front',
      label: 'Renforcer le front',
      status: 'available',
      reason: 'front contesté et pression militaire visible',
    };
  }

  if (province.supplyLevel === 'collapsed' || province.supplyLevel === 'disrupted') {
    return {
      code: 'avoid-push',
      label: 'Reporter l’offensive',
      status: 'discouraged',
      reason: 'ravitaillement insuffisant pour une action sûre',
    };
  }

  if (province.occupied) {
    return {
      code: 'secure-occupation',
      label: 'Stabiliser l’occupation',
      status: 'available',
      reason: 'contrôle différent du propriétaire',
    };
  }

  if (pressure.level === 'low') {
    return {
      code: 'hold-reserve',
      label: 'Garder en réserve',
      status: 'idle',
      reason: 'aucune urgence militaire locale',
    };
  }

  return {
    code: 'probe-neighbor-fronts',
    label: 'Tester les fronts voisins',
    status: 'available',
    reason: 'pression locale exploitable',
  };
}

function normalizeProvinceAction(action, province, pressure) {
  const fallback = buildDefaultProvinceAction(province, pressure);

  if (action === undefined) {
    return fallback;
  }

  if (action === null || typeof action !== 'object' || Array.isArray(action)) {
    throw new TypeError('StrategicMapShell tacticalActionByProvinceId entries must be objects.');
  }

  const status = String(action.status ?? fallback.status).trim() || fallback.status;

  return {
    code: String(action.code ?? fallback.code).trim() || fallback.code,
    label: String(action.label ?? fallback.label).trim() || fallback.label,
    status: ['available', 'discouraged', 'idle', 'blocked'].includes(status) ? status : fallback.status,
    reason: String(action.reason ?? fallback.reason).trim() || fallback.reason,
  };
}

function buildProvinceTacticalHoverIntel(province, options) {
  const pressure = getProvinceMilitaryPressure(province);
  const tacticalActionByProvinceId = normalizeTextMap(
    options.tacticalActionByProvinceId,
    'StrategicMapShell tacticalActionByProvinceId',
  );
  const nextAction = normalizeProvinceAction(tacticalActionByProvinceId[province.provinceId], province, pressure);

  return {
    empty: false,
    title: province.label,
    control: {
      ownerFactionId: province.ownerFactionId,
      controllingFactionId: province.controllingFactionId,
      status: province.statusLabel,
    },
    militaryPressure: pressure,
    garrisonStatus: province.contested ? 'front actif' : province.occupied ? 'garnison d’occupation' : 'garnison stable',
    nextAction,
    summary: `${province.statusLabel} · ${pressure.label} · ${nextAction.label}`,
  };
}

function buildProvinceActionAffordance(tacticalHoverIntel) {
  const action = tacticalHoverIntel.nextAction;

  return {
    state: action.status,
    label: action.status === 'available'
      ? 'action disponible'
      : action.status === 'discouraged'
        ? 'action déconseillée'
        : action.status === 'blocked'
          ? 'action bloquée'
          : 'aucune action urgente',
    cssClass: `province-node--action-${action.status}`,
    reason: action.reason,
  };
}

function buildProvincePlannedActionPreview(province) {
  if (!province) {
    return {
      empty: true,
      targetProvinceId: null,
      targetLabel: 'Aucune province sélectionnée',
      actionLabel: 'Aucune action planifiée',
      risk: 'données indisponibles',
      expectedEffect: 'sélectionner ou focaliser une province pour afficher la première action recommandée',
      tacticalReason: 'aucun focus clavier actif',
    };
  }

  const action = province.tacticalHoverIntel.nextAction;
  const pressure = province.tacticalHoverIntel.militaryPressure;
  const risk = action.status === 'discouraged' || action.status === 'blocked'
    ? 'risque élevé'
    : pressure.level === 'critical'
      ? 'risque critique'
      : pressure.level === 'high'
        ? 'risque soutenu'
        : 'risque maîtrisé';

  return {
    empty: false,
    targetProvinceId: province.provinceId,
    targetLabel: province.label,
    actionCode: action.code,
    actionLabel: action.label,
    actionStatus: action.status,
    risk,
    expectedEffect: action.status === 'available'
      ? `améliorer ${province.tacticalHoverIntel.garrisonStatus} sur ${province.label}`
      : action.status === 'discouraged'
        ? `éviter une perte d'élan sur ${province.label}`
        : action.status === 'blocked'
          ? `attendre les prérequis avant d'agir sur ${province.label}`
          : `maintenir ${province.label} en réserve`,
    tacticalReason: action.reason,
  };
}

function normalizeProvinceActionQueue(value) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new TypeError('StrategicMapShell provinceActionQueue must be an array.');
  }

  return value.map((entry, index) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new TypeError('StrategicMapShell provinceActionQueue entries must be objects.');
    }

    return {
      queueId: String(entry.queueId ?? `queue-${index + 1}`).trim() || `queue-${index + 1}`,
      provinceId: String(entry.provinceId ?? '').trim(),
      actionCode: String(entry.actionCode ?? '').trim(),
      label: String(entry.label ?? '').trim(),
      requiresSupport: Boolean(entry.requiresSupport),
      invalidatedByPrevious: Boolean(entry.invalidatedByPrevious),
    };
  }).filter((entry) => entry.provinceId);
}

function getQueueConflictReason(entry, province, previousEntry, previousProvince) {
  if (!province) return 'cible inconnue';
  if (previousEntry && previousEntry.provinceId === entry.provinceId) return 'cible déjà engagée';
  if (entry.requiresSupport && ['disrupted', 'collapsed'].includes(province.supplyLevel)) return 'support manquant';
  if (province.neighborIds.includes(previousEntry?.provinceId) && previousProvince?.contested) return 'front voisin instable';
  if (entry.invalidatedByPrevious) return 'action rendue caduque';
  if (province.actionAffordance.state === 'blocked') return province.actionAffordance.reason;
  return null;
}

function queueStatusForProvince(province) {
  if (!province) return 'blocked';
  if (province.actionAffordance.state === 'blocked') return 'blocked';
  if (province.actionAffordance.state === 'discouraged') return 'risky';
  return 'ready';
}

function buildQueueActionConflictPreview({ entry, province, status, reason, action, previousEntry, previousProvince, safeReplacement }) {
  const blockers = status === 'blocked' || status === 'conflict'
    ? [reason]
    : status === 'risky'
      ? [province?.actionAffordance.reason ?? 'risque tactique à confirmer']
      : [];
  const mutuallyExclusiveWith = previousEntry && (
    previousEntry.provinceId === entry.provinceId
    || province?.neighborIds.includes(previousEntry.provinceId)
    || previousProvince?.neighborIds.includes(entry.provinceId)
  ) ? {
      queueId: previousEntry.queueId,
      provinceId: previousEntry.provinceId,
      reason: previousEntry.provinceId === entry.provinceId ? 'même cible' : 'fronts voisins liés',
    } : null;

  return {
    frontEffect: province
      ? action?.status === 'available'
        ? `stabilise ${province.tacticalHoverIntel.garrisonStatus} sur ${province.label}`
        : action?.status === 'discouraged'
          ? `évite une poussée fragile sur ${province.label}`
          : `maintient ${province.label} sans bascule de front`
      : 'aucun effet projetable sans cible valide',
    blockers,
    mutuallyExclusiveWith,
    safestAlternative: safeReplacement,
    confirmationHint: status === 'ready'
      ? 'confirmable maintenant'
      : status === 'risky'
        ? 'confirmation possible après lecture du risque'
        : 'corriger avant confirmation',
  };
}

function buildProvinceActionQueueValidation(renderedProvinces, options) {
  const queue = normalizeProvinceActionQueue(options.provinceActionQueue);
  const provinceById = new Map(renderedProvinces.map((province) => [province.provinceId, province]));
  const queueEntries = queue.map((entry, index) => {
    const province = provinceById.get(entry.provinceId) ?? null;
    const previousEntry = queue[index - 1] ?? null;
    const previousProvince = previousEntry ? provinceById.get(previousEntry.provinceId) ?? null : null;
    const conflictReason = getQueueConflictReason(entry, province, previousEntry, previousProvince);
    const baseStatus = queueStatusForProvince(province);
    const status = conflictReason ? (baseStatus === 'blocked' ? 'blocked' : 'conflict') : baseStatus;
    const action = province?.tacticalHoverIntel.nextAction ?? null;
    const reason = conflictReason ?? (status === 'ready' ? 'ordre prêt' : 'ordre risqué');
    const safeReplacement = status === 'ready' ? null : {
      actionCode: action?.status === 'available' ? action.code : 'hold-reserve',
      label: action?.status === 'available' ? action.label : 'Garder en réserve',
      reason: action?.status === 'available' ? action.reason : 'attendre résolution du blocage',
    };

    return {
      queueId: entry.queueId,
      provinceId: entry.provinceId,
      provinceLabel: province?.label ?? entry.provinceId,
      actionCode: entry.actionCode || action?.code || 'unknown-action',
      actionLabel: entry.label || action?.label || 'Action inconnue',
      status,
      reason,
      safeReplacement,
      conflictAwarePreview: buildQueueActionConflictPreview({
        entry,
        province,
        status,
        reason,
        action,
        previousEntry,
        previousProvince,
        safeReplacement,
      }),
    };
  });
  const firstBlocked = queueEntries.find((entry) => entry.status === 'blocked' || entry.status === 'conflict') ?? null;

  return {
    empty: queueEntries.length === 0,
    entries: queueEntries,
    summary: {
      readyCount: queueEntries.filter((entry) => entry.status === 'ready').length,
      riskyCount: queueEntries.filter((entry) => entry.status === 'risky').length,
      blockedCount: queueEntries.filter((entry) => entry.status === 'blocked').length,
      conflictCount: queueEntries.filter((entry) => entry.status === 'conflict').length,
    },
    nextSafeAction: firstBlocked?.safeReplacement ?? null,
  };
}


function normalizeResolvedProvinceOrders(value) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new TypeError('StrategicMapShell resolvedProvinceOrders must be an array.');
  }

  return value.map((entry, index) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new TypeError('StrategicMapShell resolvedProvinceOrders entries must be objects.');
    }

    const result = String(entry.result ?? entry.status ?? 'deferred').trim() || 'deferred';

    return {
      resolutionId: String(entry.resolutionId ?? entry.queueId ?? `resolved-${index + 1}`).trim() || `resolved-${index + 1}`,
      queueId: entry.queueId === undefined ? null : String(entry.queueId).trim() || null,
      provinceId: String(entry.provinceId ?? '').trim(),
      actionCode: String(entry.actionCode ?? '').trim(),
      label: String(entry.label ?? '').trim(),
      result,
      explanation: String(entry.explanation ?? '').trim(),
      affectedFront: String(entry.affectedFront ?? '').trim(),
    };
  }).filter((entry) => entry.provinceId);
}

function fallbackResolutionExplanation(result, province, matchingValidation) {
  if (matchingValidation?.conflictAwarePreview?.blockers?.length > 0) {
    return matchingValidation.conflictAwarePreview.blockers.join(', ');
  }

  if (matchingValidation?.conflictAwarePreview?.frontEffect) {
    return matchingValidation.conflictAwarePreview.frontEffect;
  }

  const provinceLabel = province?.label ?? 'la province ciblée';
  if (result === 'success') return `${provinceLabel} applique l'ordre et met à jour le front local.`;
  if (result === 'blocked') return `${provinceLabel} attend encore un prérequis avant résolution.`;
  if (result === 'conflict') return `${provinceLabel} a été stoppée par un ordre incompatible.`;
  if (result === 'cancelled') return `${provinceLabel} annule l'ordre sans effet de front.`;
  return `${provinceLabel} reporte l'ordre au prochain créneau sûr.`;
}

function resultTone(result) {
  if (result === 'success') return 'positive';
  if (result === 'blocked' || result === 'conflict') return 'warning';
  if (result === 'cancelled') return 'muted';
  return 'neutral';
}

function buildAfterActionMapRecap(renderedProvinces, keyboardActionPlanner, options) {
  const resolvedOrders = normalizeResolvedProvinceOrders(options.resolvedProvinceOrders);
  const provinceById = new Map(renderedProvinces.map((province) => [province.provinceId, province]));
  const validationByQueueId = new Map(
    keyboardActionPlanner.actionQueueValidation.entries.map((entry) => [entry.queueId, entry]),
  );

  const entries = resolvedOrders.map((entry) => {
    const province = provinceById.get(entry.provinceId) ?? null;
    const matchingValidation = entry.queueId ? validationByQueueId.get(entry.queueId) ?? null : null;
    const actionLabel = entry.label || matchingValidation?.actionLabel || province?.tacticalHoverIntel.nextAction.label || 'Ordre province';
    const frontEffect = matchingValidation?.conflictAwarePreview?.frontEffect
      ?? (province ? `met à jour ${province.tacticalHoverIntel.garrisonStatus} sur ${province.label}` : 'effet de front non projetable');

    return {
      resolutionId: entry.resolutionId,
      queueId: entry.queueId,
      provinceId: entry.provinceId,
      provinceLabel: province?.label ?? entry.provinceId,
      actionCode: entry.actionCode || matchingValidation?.actionCode || province?.tacticalHoverIntel.nextAction.code || 'unknown-action',
      actionLabel,
      result: entry.result,
      tone: resultTone(entry.result),
      explanation: entry.explanation || fallbackResolutionExplanation(entry.result, province, matchingValidation),
      frontEffect,
      affectedFront: entry.affectedFront || (province?.contested ? 'front local contesté' : province?.occupied ? 'zone occupée' : 'contrôle local'),
      highlight: {
        provinceId: entry.provinceId,
        frontIds: [entry.affectedFront || province?.provinceId || entry.provinceId].filter(Boolean),
      },
    };
  });

  return {
    empty: entries.length === 0,
    entries,
    affectedProvinceIds: [...new Set(entries.map((entry) => entry.provinceId))],
    affectedFronts: [...new Set(entries.map((entry) => entry.affectedFront))],
    summary: entries.length === 0
      ? 'Aucune résolution récente à récapituler.'
      : `${entries.length} ordre${entries.length > 1 ? 's' : ''} résolu${entries.length > 1 ? 's' : ''}: ${entries.filter((entry) => entry.result === 'success').length} succès · ${entries.filter((entry) => entry.result === 'blocked').length} blocage · ${entries.filter((entry) => entry.result === 'conflict').length} conflit · ${entries.filter((entry) => entry.result === 'cancelled').length} annulation · ${entries.filter((entry) => entry.result === 'deferred').length} report`,
  };
}


function normalizePressureLevel(value, fallback = 'stable') {
  const level = String(value ?? fallback).trim() || fallback;
  if (['low', 'stable', 'guarded', 'high', 'critical'].includes(level)) return level;
  return fallback;
}

function pressureScore(level) {
  return {
    low: 0,
    stable: 1,
    guarded: 2,
    high: 3,
    critical: 4,
  }[level] ?? 1;
}

function pressureChangeLabel(delta) {
  if (delta > 0) return `+${delta} pression`;
  if (delta < 0) return `${delta} pression`;
  return 'pression stable';
}

function markerTone(marker) {
  if (marker === 'gain') return 'positive';
  if (marker === 'loss') return 'negative';
  if (marker === 'blocked') return 'warning';
  return 'neutral';
}

function markerLabel(marker) {
  if (marker === 'gain') return 'gain';
  if (marker === 'loss') return 'perte';
  if (marker === 'blocked') return 'blocage';
  return 'pression adjacente';
}

function inferMarker(previousPressure, pressure, result) {
  if (result === 'blocked' || result === 'conflict') return 'blocked';
  const delta = pressureScore(pressure) - pressureScore(previousPressure);
  if (delta < 0) return 'gain';
  if (delta > 0) return 'loss';
  return 'adjacent-pressure';
}

function normalizeFrontPressureTimeline(value) {
  if (value === undefined) return [];

  if (!Array.isArray(value)) {
    throw new TypeError('StrategicMapShell frontPressureTimeline must be an array.');
  }

  return value.map((entry, index) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new TypeError('StrategicMapShell frontPressureTimeline entries must be objects.');
    }

    const pressure = normalizePressureLevel(entry.pressure, 'stable');
    const previousPressure = normalizePressureLevel(entry.previousPressure, pressure);
    const result = String(entry.result ?? '').trim();
    const marker = String(entry.marker ?? inferMarker(previousPressure, pressure, result)).trim() || 'adjacent-pressure';
    const adjacentPressure = Array.isArray(entry.adjacentPressure) ? entry.adjacentPressure : [];

    return {
      frameId: String(entry.frameId ?? `front-frame-${index + 1}`).trim() || `front-frame-${index + 1}`,
      provinceId: String(entry.provinceId ?? '').trim(),
      turnLabel: String(entry.turnLabel ?? `État ${index + 1}`).trim() || `État ${index + 1}`,
      pressure,
      previousPressure,
      result,
      marker,
      reason: String(entry.reason ?? '').trim(),
      adjacentPressure: adjacentPressure.map((adjacent, adjacentIndex) => ({
        provinceId: String(adjacent?.provinceId ?? `adjacent-${adjacentIndex + 1}`).trim() || `adjacent-${adjacentIndex + 1}`,
        label: String(adjacent?.label ?? adjacent?.provinceId ?? `Voisin ${adjacentIndex + 1}`).trim() || `Voisin ${adjacentIndex + 1}`,
        pressure: normalizePressureLevel(adjacent?.pressure, 'stable'),
      })),
    };
  }).filter((entry) => entry.provinceId).slice(-4);
}

function buildFrontPressureTimelineReplay(renderedProvinces, options) {
  const timeline = normalizeFrontPressureTimeline(options.frontPressureTimeline);
  const provinceById = new Map(renderedProvinces.map((province) => [province.provinceId, province]));
  const frames = timeline.map((entry, index) => {
    const province = provinceById.get(entry.provinceId) ?? null;
    const delta = pressureScore(entry.pressure) - pressureScore(entry.previousPressure);
    const reason = entry.reason || (
      entry.marker === 'blocked'
        ? 'un blocage empêche le front de bouger'
        : delta < 0
          ? 'les ordres récents relâchent la pression locale'
          : delta > 0
            ? 'les pressions voisines renforcent le front adverse'
            : 'aucun basculement net entre les deux états'
    );

    return {
      frameId: entry.frameId,
      frameIndex: index,
      provinceId: entry.provinceId,
      provinceLabel: province?.label ?? entry.provinceId,
      turnLabel: entry.turnLabel,
      previousPressure: entry.previousPressure,
      pressure: entry.pressure,
      pressureDelta: delta,
      changeLabel: pressureChangeLabel(delta),
      marker: {
        type: entry.marker,
        label: markerLabel(entry.marker),
        tone: markerTone(entry.marker),
      },
      adjacentPressure: entry.adjacentPressure,
      summary: `${pressureChangeLabel(delta)} — ${reason}`,
      reason,
    };
  });

  const requestedIndex = Number.isInteger(options.frontPressureReplayIndex) ? options.frontPressureReplayIndex : frames.length - 1;
  const currentIndex = frames.length === 0 ? -1 : Math.min(Math.max(requestedIndex, 0), frames.length - 1);
  const activeFrame = currentIndex === -1 ? null : frames[currentIndex];
  const firstFrame = frames[0] ?? null;

  return {
    empty: frames.length === 0,
    incomplete: frames.length > 0 && frames.length < 2,
    frameCount: frames.length,
    currentIndex,
    controls: frames.length === 0 ? null : {
      type: 'scrub',
      min: 0,
      max: frames.length - 1,
      step: 1,
      label: 'Rejouer la pression du front',
    },
    beforeAfter: activeFrame && firstFrame ? {
      provinceId: activeFrame.provinceId,
      provinceLabel: activeFrame.provinceLabel,
      before: firstFrame.previousPressure,
      after: activeFrame.pressure,
      changeLabel: activeFrame.changeLabel,
    } : null,
    frames,
    activeFrame,
    fallbackMessage: frames.length === 0
      ? 'Aucun historique de pression disponible pour le replay.'
      : frames.length < 2
        ? 'Historique incomplet: un seul état disponible pour ce front.'
        : null,
  };
}

function buildKeyboardActionPlanner(renderedProvinces, options) {
  const activeProvince = renderedProvinces.find(
    (province) => province.selectionState.selected || province.selectionState.focused || province.selectionState.hovered,
  ) ?? renderedProvinces[0] ?? null;

  return {
    mode: 'keyboard-first',
    focusOrder: renderedProvinces.map((province, index) => ({
      provinceId: province.provinceId,
      label: province.label,
      tabIndex: index === 0 ? 0 : -1,
      selected: province.selectionState.selected,
      focused: province.selectionState.focused,
      queued: province.selectionState.queued,
      actionState: province.actionAffordance.state,
    })),
    activeProvinceId: activeProvince?.provinceId ?? null,
    plannedActionPreview: buildProvincePlannedActionPreview(activeProvince),
    actionQueueValidation: buildProvinceActionQueueValidation(renderedProvinces, options),
    emptyState: renderedProvinces.length === 0 ? 'Aucune province disponible pour le planificateur clavier.' : null,
  };
}

function enhanceProvince(renderedProvince, options, provinceGeometryById) {
  const selectedProvinceId = String(options.selectedProvinceId ?? '').trim();
  const focusedProvinceId = String(options.focusedProvinceId ?? '').trim();
  const hoveredProvinceId = String(options.hoveredProvinceId ?? '').trim();
  const queuedProvinceId = String(options.queuedProvinceId ?? '').trim();
  const geometry = provinceGeometryById[renderedProvince.provinceId] ?? {};
  const tacticalHoverIntel = buildProvinceTacticalHoverIntel(renderedProvince, options);

  return {
    ...renderedProvince,
    geometry: {
      layout: geometry.layout ?? null,
      center: geometry.center ?? null,
      polygon: geometry.polygon ?? null,
      shape: geometry.shape ?? null,
      labelLayout: geometry.labelLayout ?? null,
    },
    selectionState: {
      selected: renderedProvince.provinceId === selectedProvinceId,
      focused: renderedProvince.provinceId === focusedProvinceId,
      hovered: renderedProvince.provinceId === hoveredProvinceId,
      queued: renderedProvince.provinceId === queuedProvinceId,
    },
    tacticalHoverIntel,
    actionAffordance: buildProvinceActionAffordance(tacticalHoverIntel),
  };
}

function buildProvinceCssClasses(province) {
  return [
    'province-node',
    province.contested ? 'province-node--contested' : null,
    province.occupied ? 'province-node--occupied' : null,
    `province-node--supply-${province.supplyLevel}`,
    province.actionAffordance.cssClass,
    province.selectionState.selected ? 'is-selected' : null,
    province.selectionState.focused ? 'is-focused' : null,
    province.selectionState.hovered ? 'is-hovered' : null,
    province.selectionState.queued ? 'is-queued' : null,
  ].filter(Boolean);
}

function buildProvinceLabelNode(province) {
  const center = province.geometry.center;
  const labelLayout = province.geometry.labelLayout ?? center;

  if (!center || !labelLayout) {
    return null;
  }

  const align = String(labelLayout.align ?? 'middle').trim() || 'middle';
  const x = Number.isFinite(labelLayout.x) ? labelLayout.x : center.x;
  const y = Number.isFinite(labelLayout.y) ? labelLayout.y : center.y;
  const leaderLine = Math.abs(x - center.x) > 4 || Math.abs(y - center.y) > 4
    ? { from: { ...center }, to: { x, y } }
    : null;

  return {
    provinceId: province.provinceId,
    text: province.label,
    meta: province.statusLabel,
    x,
    y,
    align,
    tone: String(labelLayout.tone ?? province.supplyTone ?? 'standard').trim() || 'standard',
    leaderLine,
  };
}

function buildProvinceMapLayers(renderedProvinces) {
  return {
    provinceSurfaces: renderedProvinces.map((province) => ({
      provinceId: province.provinceId,
      label: province.label,
      ariaLabel: province.ariaLabel,
      cssClasses: buildProvinceCssClasses(province),
      data: {
        provinceId: province.provinceId,
        ownerFactionId: province.ownerFactionId,
        controllingFactionId: province.controllingFactionId,
        supplyLevel: province.supplyLevel,
        supplyTone: province.supplyTone,
        status: province.contested ? 'contested' : province.occupied ? 'occupied' : 'stable',
        actionState: province.actionAffordance.state,
        keyboardSelectable: true,
        queued: province.selectionState.queued,
      },
      tacticalHoverIntel: province.tacticalHoverIntel,
      actionAffordance: province.actionAffordance,
      geometry: {
        polygon: province.geometry.polygon,
        shape: province.geometry.shape,
        center: province.geometry.center,
      },
      style: { ...province.style },
    })),
    provinceLabels: renderedProvinces.map(buildProvinceLabelNode).filter(Boolean),
  };
}

export function buildStrategicMapShell(provinces, options = {}) {
  const normalizedProvinces = requireProvinceList(provinces);
  const normalizedOptions = requireOptions(options);
  const title = String(normalizedOptions.title ?? 'Carte stratégique').trim() || 'Carte stratégique';
  const subtitle = String(normalizedOptions.subtitle ?? 'Vue d’ensemble des provinces et lignes de front').trim()
    || 'Vue d’ensemble des provinces et lignes de front';
  const overlaySlots = normalizeOverlaySlots(normalizedOptions.overlaySlots);
  const provinceGeometryById = normalizeGeometryMap(normalizedOptions.provinceGeometryById);
  const intriguePresenceSabotageOverlay = buildIntriguePresenceSabotageOverlay(
    normalizedProvinces,
    normalizedOptions.intrigueMapOverlay,
  );
  const firstCleanupPayoff = buildFirstCleanupPayoff(normalizedOptions.cleanupOrders, normalizedOptions.residualRisks);
  const followUpCleanupChoices = buildFollowUpCleanupChoices(
    normalizedOptions.cleanupOrders,
    normalizedOptions.residualRisks,
    firstCleanupPayoff,
  );
  const topFollowUpReadiness = buildTopFollowUpReadiness(followUpCleanupChoices, normalizedOptions.residualRisks);
  const followUpCleanupMiniPlan = buildFollowUpCleanupMiniPlan(
    followUpCleanupChoices,
    normalizedOptions.residualRisks,
    topFollowUpReadiness,
  );
  const miniPlanDependencyConflicts = buildMiniPlanDependencyConflicts(
    followUpCleanupMiniPlan,
    normalizedOptions.residualRisks,
    topFollowUpReadiness,
  );
  const miniPlanConflictTradeoffs = buildMiniPlanConflictTradeoffs(
    followUpCleanupMiniPlan,
    miniPlanDependencyConflicts,
  );
  const miniPlanTradeoffActionPreview = buildMiniPlanTradeoffActionPreview(
    followUpCleanupMiniPlan,
    miniPlanConflictTradeoffs,
  );
  const miniPlanRivalResponseRisk = buildMiniPlanRivalResponseRisk(
    miniPlanTradeoffActionPreview,
    miniPlanConflictTradeoffs,
  );
  const miniPlanRivalResponseComparison = buildMiniPlanRivalResponseComparison(
    followUpCleanupMiniPlan,
    miniPlanConflictTradeoffs,
  );
  const miniPlanRivalResponseFallback = buildMiniPlanRivalResponseFallback(miniPlanRivalResponseComparison);
  const miniPlanFallbackReturnCue = buildMiniPlanFallbackReturnCue(
    miniPlanRivalResponseFallback,
    miniPlanRivalResponseComparison,
  );
  const miniPlanReturnProtectionStatus = buildMiniPlanReturnProtectionStatus(
    miniPlanFallbackReturnCue,
    miniPlanRivalResponseFallback,
    miniPlanRivalResponseComparison,
  );
  const miniPlanConfidenceSignalCue = buildMiniPlanConfidenceSignalCue(
    miniPlanReturnProtectionStatus,
    miniPlanFallbackReturnCue,
    miniPlanRivalResponseFallback,
  );
  const miniPlanDecisionReversibilityCue = buildMiniPlanDecisionReversibilityCue(
    miniPlanConfidenceSignalCue,
    miniPlanRivalResponseFallback,
  );
  const miniPlanLastSafeCorrectionCue = buildMiniPlanLastSafeCorrectionCue(miniPlanDecisionReversibilityCue);
  const miniPlanLateCorrectionExitCost = buildMiniPlanLateCorrectionExitCost(miniPlanLastSafeCorrectionCue);
  const miniPlanMinimalFollowThrough = buildMiniPlanMinimalFollowThrough(miniPlanLateCorrectionExitCost);
  const miniPlanFollowThroughOpportunityTradeoff = buildMiniPlanFollowThroughOpportunityTradeoff(
    miniPlanMinimalFollowThrough,
  );
  const miniPlanSafestTacticalFallback = buildMiniPlanSafestTacticalFallback(
    miniPlanFollowThroughOpportunityTradeoff,
  );
  const miniPlanNextTurnHoldPlan = buildMiniPlanNextTurnHoldPlan(
    miniPlanSafestTacticalFallback,
  );
  const miniPlanHoldReleaseCue = buildMiniPlanHoldReleaseCue(
    miniPlanNextTurnHoldPlan,
  );
  const miniPlanFirstSafeReengagement = buildMiniPlanFirstSafeReengagement(
    miniPlanHoldReleaseCue,
  );
  const miniPlanPrematureReengagementRisk = buildMiniPlanPrematureReengagementRisk(
    miniPlanFirstSafeReengagement,
  );

  const renderedProvinces = normalizedProvinces
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((province) => enhanceProvince(renderProvince(province, normalizedOptions), normalizedOptions, provinceGeometryById));

  const stats = renderedProvinces.reduce(
    (summary, province) => ({
      provinceCount: summary.provinceCount + 1,
      contestedCount: summary.contestedCount + (province.contested ? 1 : 0),
      occupiedCount: summary.occupiedCount + (province.occupied ? 1 : 0),
      averageLoyalty: summary.averageLoyalty + province.loyalty,
    }),
    {
      provinceCount: 0,
      contestedCount: 0,
      occupiedCount: 0,
      averageLoyalty: 0,
    },
  );

  const keyboardActionPlanner = buildKeyboardActionPlanner(renderedProvinces, normalizedOptions);
  const afterActionMapRecap = buildAfterActionMapRecap(renderedProvinces, keyboardActionPlanner, normalizedOptions);
  const frontPressureReplay = buildFrontPressureTimelineReplay(renderedProvinces, normalizedOptions);

  return {
    title,
    subtitle,
    provinces: renderedProvinces,
    mapLayers: buildProvinceMapLayers(renderedProvinces),
    keyboardActionPlanner,
    afterActionMapRecap,
    frontPressureReplay,
    stats: {
      provinceCount: stats.provinceCount,
      contestedCount: stats.contestedCount,
      occupiedCount: stats.occupiedCount,
      averageLoyalty: stats.provinceCount === 0 ? 0 : Math.round(stats.averageLoyalty / stats.provinceCount),
    },
    legend: buildLegend(renderedProvinces, normalizedOptions),
    overlays: {
      slots: overlaySlots.map((slotId) => ({
        slotId,
        label: slotId.replace(/-/g, ' '),
        enabled: true,
      })),
      intrigue: intriguePresenceSabotageOverlay,
    },
    firstCleanupPayoff,
    followUpCleanupChoices,
    topFollowUpReadiness,
    followUpCleanupMiniPlan,
    miniPlanDependencyConflicts,
    miniPlanConflictTradeoffs,
    miniPlanTradeoffActionPreview,
    miniPlanRivalResponseRisk,
    miniPlanRivalResponseComparison,
    miniPlanRivalResponseFallback,
    miniPlanFallbackReturnCue,
    miniPlanReturnProtectionStatus,
    miniPlanConfidenceSignalCue,
    miniPlanDecisionReversibilityCue,
    miniPlanLastSafeCorrectionCue,
    miniPlanLateCorrectionExitCost,
    miniPlanMinimalFollowThrough,
    miniPlanFollowThroughOpportunityTradeoff,
    miniPlanSafestTacticalFallback,
    miniPlanNextTurnHoldPlan,
    miniPlanHoldReleaseCue,
    miniPlanFirstSafeReengagement,
    miniPlanPrematureReengagementRisk,
    activeProvince: renderedProvinces.find(
      (province) => province.selectionState.selected || province.selectionState.focused || province.selectionState.hovered,
    ) ?? null,
  };
}
