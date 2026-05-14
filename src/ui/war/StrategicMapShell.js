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

function getRiskLocationId(riskKey) {
  const [, locationId = null] = String(riskKey ?? '').split(':');

  return locationId && locationId.trim() ? locationId.trim() : null;
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

function enhanceProvince(renderedProvince, options, provinceGeometryById) {
  const selectedProvinceId = String(options.selectedProvinceId ?? '').trim();
  const focusedProvinceId = String(options.focusedProvinceId ?? '').trim();
  const hoveredProvinceId = String(options.hoveredProvinceId ?? '').trim();
  const geometry = provinceGeometryById[renderedProvince.provinceId] ?? {};

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
    },
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

  return {
    title,
    subtitle,
    provinces: renderedProvinces,
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
    activeProvince: renderedProvinces.find(
      (province) => province.selectionState.selected || province.selectionState.focused || province.selectionState.hovered,
    ) ?? null,
  };
}
