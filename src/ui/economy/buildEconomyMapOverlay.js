import { City } from '../../domain/economy/City.js';
import { TradeRoute } from '../../domain/economy/TradeRoute.js';

const DEFAULT_CITY_MARKER = Object.freeze({
  icon: 'city',
  tone: 'neutral',
  size: 1,
});

const DEFAULT_ROUTE_STYLE_BY_MODE = Object.freeze({
  land: { stroke: 'ochre', width: 2, pattern: 'solid', opacity: 0.85 },
  river: { stroke: 'blue', width: 2, pattern: 'wave', opacity: 0.85 },
  sea: { stroke: 'navy', width: 3, pattern: 'solid', opacity: 0.85 },
  default: { stroke: 'slate', width: 2, pattern: 'solid', opacity: 0.85 },
  inactive: { stroke: 'slate', width: 1, pattern: 'dashed', opacity: 0.45 },
});

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

function normalizeCity(city) {
  if (city instanceof City) {
    return city;
  }

  if (city === null || typeof city !== 'object' || Array.isArray(city)) {
    throw new TypeError('EconomyMapOverlay cities must be City instances or plain objects.');
  }

  return new City(city);
}

function normalizeRoute(route) {
  if (route instanceof TradeRoute) {
    return route;
  }

  if (route === null || typeof route !== 'object' || Array.isArray(route)) {
    throw new TypeError('EconomyMapOverlay routes must be TradeRoute instances or plain objects.');
  }

  return new TradeRoute(route);
}

function buildResourceSummary(stockByResource) {
  const entries = Object.entries(stockByResource)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([resourceId, quantity]) => ({ resourceId, quantity }));

  const totalStock = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const primaryResourceId = entries[0]?.resourceId ?? null;
  const primaryResourceQuantity = entries[0]?.quantity ?? 0;

  return {
    entries,
    totalStock,
    resourceCount: entries.length,
    primaryResourceId,
    primaryResourceQuantity,
  };
}

function normalizeMarker(marker) {
  return {
    icon: String(marker.icon ?? DEFAULT_CITY_MARKER.icon).trim() || DEFAULT_CITY_MARKER.icon,
    tone: String(marker.tone ?? DEFAULT_CITY_MARKER.tone).trim() || DEFAULT_CITY_MARKER.tone,
    size: Number.isFinite(marker.size) && marker.size > 0 ? marker.size : DEFAULT_CITY_MARKER.size,
  };
}

function buildCityMarker(city, cityPositionById) {
  const position = cityPositionById[city.id] ?? null;
  const tone = city.prosperity >= 70 ? 'positive' : city.stability < 40 ? 'warning' : 'neutral';
  const size = city.capital ? 2 : 1;

  return {
    ...normalizeMarker({ tone, size }),
    position,
  };
}

function normalizeCapacitySpendPlan(plan, routeId) {
  if (plan === undefined || plan === null) {
    return {
      routeId,
      capacityMobilized: 0,
      mobilizedByResource: {},
      limitingResourceId: null,
    };
  }

  const normalizedPlan = requireObject(plan, `EconomyMapOverlay capacity spend preview ${routeId}`);
  const mobilizedByResource = Object.fromEntries(
    Object.entries(requireObject(normalizedPlan.mobilizedByResource ?? {}, `EconomyMapOverlay mobilizedByResource ${routeId}`))
      .map(([resourceId, capacity]) => {
        const normalizedResourceId = String(resourceId).trim();

        if (!normalizedResourceId) {
          throw new RangeError('EconomyMapOverlay mobilizedByResource cannot contain an empty resource id.');
        }

        if (!Number.isInteger(capacity) || capacity < 0) {
          throw new RangeError('EconomyMapOverlay mobilized capacity must be an integer greater than or equal to 0.');
        }

        return [normalizedResourceId, capacity];
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );
  const mobilizedTotal = Object.values(mobilizedByResource).reduce((sum, capacity) => sum + capacity, 0);
  const fallbackMobilized = normalizedPlan.capacityMobilized ?? mobilizedTotal;

  if (!Number.isInteger(fallbackMobilized) || fallbackMobilized < 0) {
    throw new RangeError('EconomyMapOverlay capacityMobilized must be an integer greater than or equal to 0.');
  }

  return {
    routeId,
    capacityMobilized: mobilizedTotal > 0 ? mobilizedTotal : fallbackMobilized,
    mobilizedByResource,
    limitingResourceId: normalizedPlan.limitingResourceId === undefined || normalizedPlan.limitingResourceId === null
      ? null
      : String(normalizedPlan.limitingResourceId).trim() || null,
  };
}

function buildPreparationOptions(nextResource, resourceRows, routeRiskLevel) {
  if (nextResource === null || nextResource.capacityRemaining > 1) {
    return [];
  }

  const bottleneckResourceId = nextResource.resourceId;
  const missingMargin = nextResource.capacityRemaining === 0 ? 2 : 1;
  const spareResource = resourceRows
    .filter((row) => row.resourceId !== bottleneckResourceId && row.capacityRemaining > missingMargin)
    .sort((left, right) => right.capacityRemaining - left.capacityRemaining || left.resourceId.localeCompare(right.resourceId))[0] ?? null;
  const options = [
    {
      id: `${bottleneckResourceId}:reserve-buffer`,
      action: nextResource.capacityRemaining === 0 ? 'free-route-capacity' : 'reserve-capacity-buffer',
      label: nextResource.capacityRemaining === 0
        ? `Libérer 1 capacité ${bottleneckResourceId}`
        : `Réserver 1 capacité tampon ${bottleneckResourceId}`,
      effort: {
        type: 'capacity',
        amount: 1,
        unit: bottleneckResourceId,
      },
      expectedEffect: {
        marginGain: 1,
        description: nextResource.capacityRemaining === 0
          ? 'Rouvre une marge minimale sur le goulot principal.'
          : 'Transforme la marge critique en tampon exploitable.',
      },
      riskIfIgnored: nextResource.capacityRemaining === 0
        ? 'Blocage probable dès la prochaine dépense sur ce corridor.'
        : 'La prochaine dépense peut épuiser la marge restante.',
      safety: 'safe',
    },
  ];

  if (spareResource !== null) {
    const marginGain = Math.min(2, spareResource.capacityRemaining - 1);

    options.push({
      id: `${bottleneckResourceId}:shift-to-${spareResource.resourceId}`,
      action: 'shift-load-to-spare-resource',
      label: `Reporter une partie du flux vers ${spareResource.resourceId}`,
      effort: {
        type: 'coordination',
        amount: 2,
        unit: 'turns',
      },
      expectedEffect: {
        marginGain,
        description: `Préserve ${bottleneckResourceId} en utilisant la marge ${spareResource.resourceId}.`,
      },
      riskIfIgnored: `La ressource ${bottleneckResourceId} reste le point de rupture malgré la marge ${spareResource.resourceId}.`,
      safety: 'safe',
    });
  }

  if (routeRiskLevel >= 35 || nextResource.capacityRemaining === 0) {
    options.push({
      id: `${bottleneckResourceId}:priority-window`,
      action: 'open-priority-window',
      label: `Ouvrir une fenêtre prioritaire ${bottleneckResourceId}`,
      effort: {
        type: 'operations',
        amount: 3,
        unit: 'orders',
      },
      expectedEffect: {
        marginGain: 2,
        description: 'Gagne une marge temporaire mais expose le corridor à un report de risque.',
      },
      riskIfIgnored: 'Le risque de corridor peut transformer le goulot en rupture opérationnelle.',
      safety: routeRiskLevel >= 50 ? 'risky' : 'conditional',
    });
  }

  return options
    .sort((left, right) => {
      const safetyRank = { safe: 0, conditional: 1, risky: 2 };

      return left.effort.amount - right.effort.amount
        || safetyRank[left.safety] - safetyRank[right.safety]
        || right.expectedEffect.marginGain - left.expectedEffect.marginGain
        || left.id.localeCompare(right.id);
    })
    .slice(0, 3);
}

function scorePreparationOption(option, routeValue, routeRiskLevel) {
  const safetyWeight = { safe: 2, conditional: 1, risky: 0 };
  const riskAvoided = option.safety === 'risky'
    ? Math.ceil(routeRiskLevel / 25)
    : option.safety === 'conditional'
      ? Math.ceil(routeRiskLevel / 35)
      : 1;

  return (option.expectedEffect.marginGain * routeValue)
    + riskAvoided
    + (safetyWeight[option.safety] ?? 0)
    - option.effort.amount;
}

function buildPreparationSequence(bestOption, cheaperAcceptable, estimatedValueProtected) {
  const sequence = [
    {
      id: `${bestOption.id}:now`,
      timing: 'now',
      optionId: bestOption.id,
      action: bestOption.action,
      label: bestOption.label,
      reason: `Sécurise ${estimatedValueProtected} valeur corridor avant dépense.`,
    },
    {
      id: `${bestOption.id}:next`,
      timing: 'next',
      optionId: bestOption.id,
      action: 'spend-capacity-after-preparation',
      label: 'Dépenser la capacité après marge confirmée',
      reason: `Engage la dépense seulement après +${bestOption.expectedEffect.marginGain} marge préparée.`,
    },
  ];

  if (cheaperAcceptable !== null) {
    sequence.push({
      id: `${cheaperAcceptable.optionId}:defer`,
      timing: 'defer',
      optionId: cheaperAcceptable.optionId,
      action: 'keep-cheaper-fallback',
      label: 'Garder l’option moins chère en repli',
      reason: cheaperAcceptable.condition,
    });
  }

  return sequence;
}

function buildOpportunityCostComparison(bestOption, alternativeOption, estimatedValueProtected, alternativeValueProtected, routeRiskLevel) {
  if (alternativeOption === null) {
    return null;
  }

  const marginDelta = bestOption.expectedEffect.marginGain - alternativeOption.expectedEffect.marginGain;
  const effortDelta = bestOption.effort.amount - alternativeOption.effort.amount;
  const valueDelta = estimatedValueProtected - alternativeValueProtected;

  return {
    id: `opportunity-cost:${bestOption.id}:vs:${alternativeOption.id}`,
    recommendedOptionId: bestOption.id,
    alternativeOptionId: alternativeOption.id,
    summary: valueDelta >= 0
      ? `Meilleure maintenant: +${valueDelta} valeur protégée contre ${alternativeOption.label}.`
      : `Option prudente: protège moins de valeur mais réduit le coût immédiat face à ${alternativeOption.label}.`,
    gained: {
      protectedValue: Math.max(0, valueDelta),
      margin: Math.max(0, marginDelta),
      reason: `${bestOption.label} protège davantage le corridor avant la dépense.`,
    },
    deferred: {
      effort: Math.max(0, effortDelta),
      unit: bestOption.effort.unit,
      reason: effortDelta > 0
        ? `${alternativeOption.label} reste moins coûteuse si le coût immédiat devient prioritaire.`
        : 'Aucun effort additionnel net par rapport à l’alternative.',
    },
    aggravated: {
      risk: bestOption.safety === 'risky' && alternativeOption.safety !== 'risky' ? 'higher-sequence-risk' : 'none',
      reason: bestOption.safety === 'risky' && alternativeOption.safety !== 'risky'
        ? 'La séquence recommandée protège plus de valeur mais expose davantage le corridor.'
        : 'Aucune aggravation nette détectée par rapport à l’alternative comparée.',
    },
    reconsiderWhen: routeRiskLevel >= 50
      ? 'Reconsidérer si le risque corridor augmente encore ou si la capacité opérationnelle manque.'
      : 'Reconsidérer si la marge disponible, le risque corridor ou le coût immédiat change.',
  };
}

function buildPreparationBreakEven(opportunityCostComparison, capacityMobilized) {
  if (opportunityCostComparison === null) {
    return null;
  }

  const capacityCost = Math.max(1, capacityMobilized);
  const protectedValue = opportunityCostComparison.gained.protectedValue;
  const marginValue = opportunityCostComparison.gained.margin * capacityCost;
  const deferredCost = opportunityCostComparison.deferred.effort;
  const riskPenalty = opportunityCostComparison.aggravated.risk === 'higher-sequence-risk' ? capacityCost : 0;
  const netValue = protectedValue + marginValue - deferredCost - riskPenalty;

  if (netValue <= 0) {
    return {
      id: `break-even:${opportunityCostComparison.recommendedOptionId}`,
      status: 'not-profitable-current-data',
      window: 'not-now',
      turnLimit: null,
      netValue,
      reason: 'La valeur protégée ne couvre pas le coût différé et le risque estimé.',
    };
  }

  if (riskPenalty === 0 && netValue >= capacityCost) {
    return {
      id: `break-even:${opportunityCostComparison.recommendedOptionId}`,
      status: 'profitable-now',
      window: 'now',
      turnLimit: 0,
      netValue,
      reason: `Rentable maintenant: ${protectedValue} valeur protégée et ${marginValue} marge couvrent ${deferredCost} effort différé.`,
    };
  }

  const turnLimit = Math.max(1, Math.ceil(netValue / capacityCost));

  return {
    id: `break-even:${opportunityCostComparison.recommendedOptionId}`,
    status: 'profitable-before-window-closes',
    window: `before-${turnLimit}-turns`,
    turnLimit,
    netValue,
    reason: `Rentable si exécuté avant ${turnLimit} tour(s), avant que le risque différé absorbe la valeur protégée.`,
  };
}

function buildFlipActionability(flipScenario, opportunityCostComparison, capacityCost) {
  if (flipScenario === null) {
    return {
      threshold: null,
      consequence: 'continuer la séquence recommandée',
      advice: 'Action stable: continuer la séquence recommandée tant que la marge de break-even reste positive.',
    };
  }

  const thresholdByCause = {
    delay: 'dès 1 tour de retard',
    capacity: `si la marge disponible perd ${Math.max(1, opportunityCostComparison.gained.margin)} capacité`,
    cost: 'si le coût augmente d’au moins 1 ordre',
    saturation: `si le goulot consomme ${capacityCost} capacité avant préparation`,
  };
  const consequenceByCause = {
    delay: 'inverser la priorité avant d’attendre',
    capacity: 'sécuriser une marge avant d’agir',
    cost: 'attendre une option moins coûteuse',
    saturation: 'sécuriser le goulot avant toute nouvelle dépense',
  };

  return {
    threshold: thresholdByCause[flipScenario.cause] ?? `si ${flipScenario.assumption}`,
    consequence: consequenceByCause[flipScenario.cause] ?? 'inverser la priorité',
    advice: `${consequenceByCause[flipScenario.cause] ?? 'Inverser la priorité'}: basculer vers ${flipScenario.alternativeOptionId} ${thresholdByCause[flipScenario.cause] ?? `si ${flipScenario.assumption}`}.`,
  };
}

function buildPostSalvageDecisionComparison(postSalvageDecisionAlert, delayOpportunityCost) {
  if (postSalvageDecisionAlert.status === 'no-additional-decision') {
    return {
      status: 'neutral',
      confirmNow: 'continuer sans coût d’attente notable',
      wait: 'temporiser reste acceptable tant que la marge nette reste positive',
      recommendation: 'continue',
      dominantConstraint: postSalvageDecisionAlert.mainConstraint,
      waitTurnsDurableLoss: false,
      summary: 'Neutre: aucun coût d’attente notable tant que la marge reste positive.',
    };
  }

  const remainingCost = delayOpportunityCost.salvageAction?.remainingCost ?? delayOpportunityCost.cost;
  const waitCost = delayOpportunityCost.cost + remainingCost;
  const waitTurnsDurableLoss = postSalvageDecisionAlert.recommendation !== 'secure-minimal-investment';
  const confirmNowByRecommendation = {
    'abandon-sequence': 'abandonner ou inverser immédiatement pour éviter une perte durable',
    'invert-durably': `confirmer l’inversion vers ${delayOpportunityCost.salvageAction?.alternativeOptionId ?? 'l’alternative'}`,
    'secure-minimal-investment': 'confirmer le complément minimal avant nouvelle dépense',
  };
  const waitByRecommendation = {
    'abandon-sequence': `attendre ajoute ${waitCost} coût et fige la perte durable`,
    'invert-durably': `attendre ajoute ${waitCost} coût et rend l’alternative plus sûre durablement`,
    'secure-minimal-investment': `attendre ajoute ${waitCost} coût avant de retrouver une marge`,
  };

  return {
    status: waitTurnsDurableLoss ? 'wait-dangerous' : 'confirm-beneficial',
    confirmNow: confirmNowByRecommendation[postSalvageDecisionAlert.recommendation],
    wait: waitByRecommendation[postSalvageDecisionAlert.recommendation],
    recommendation: postSalvageDecisionAlert.recommendation,
    dominantConstraint: postSalvageDecisionAlert.mainConstraint,
    waitCost,
    waitTurnsDurableLoss,
    summary: waitTurnsDurableLoss
      ? `${confirmNowByRecommendation[postSalvageDecisionAlert.recommendation]}: temporiser transforme la décision en perte durable.`
      : `${confirmNowByRecommendation[postSalvageDecisionAlert.recommendation]}: temporiser augmente seulement le coût de reprise.`,
  };
}

function buildPostSalvageRobustness(postSalvageDecisionAlert, postSalvageDecisionComparison, delayOpportunityCost, scenarios) {
  const tightestScenario = scenarios
    .slice()
    .sort((left, right) => left.netValue - right.netValue || left.id.localeCompare(right.id))[0] ?? null;
  const dominantConstraint = postSalvageDecisionAlert.mainConstraint ?? tightestScenario?.cause ?? null;

  if (postSalvageDecisionAlert.status === 'no-additional-decision') {
    return {
      status: 'robust',
      dominantConstraint,
      nextGesture: 'surveiller',
      needsCapacityProtection: false,
      summary: dominantConstraint === null
        ? 'Robuste: aucun risque de robustesse notable après salvage.'
        : `Robuste: surveiller ${dominantConstraint}, la marge reste positive après salvage.`,
    };
  }

  const remainingCost = delayOpportunityCost.salvageAction?.remainingCost ?? 0;
  const isVulnerable = postSalvageDecisionComparison.waitTurnsDurableLoss && remainingCost > 2;
  const nextGestureByRecommendation = {
    'abandon-sequence': 'basculer vers alternative',
    'invert-durably': 'basculer vers alternative',
    'secure-minimal-investment': 'protéger la capacité',
  };
  const status = isVulnerable ? 'vulnerable' : 'fragile-usable';
  const nextGesture = nextGestureByRecommendation[postSalvageDecisionAlert.recommendation] ?? 'surveiller';

  return {
    status,
    dominantConstraint,
    nextGesture,
    needsCapacityProtection: dominantConstraint === 'capacity' || nextGesture === 'protéger la capacité',
    summary: status === 'vulnerable'
      ? `Vulnérable: ${dominantConstraint} menace une perte durable; ${nextGesture}.`
      : `Fragile mais utilisable: ${dominantConstraint} reste serré; ${nextGesture}.`,
  };
}

function buildPostSalvageStabilizer(postSalvageRobustness) {
  if (postSalvageRobustness.status === 'robust') {
    return {
      status: 'none-required',
      stabilizer: null,
      nextGesture: 'surveiller',
      benefit: 'Aucun stabilisateur requis: le corridor reste robuste après salvage.',
      summary: 'Stabilisateur neutre: surveiller sans action supplémentaire.',
    };
  }

  const stabilizerByConstraint = {
    capacity: 'capacité tampon',
    saturation: 'lissage de charge',
    delay: 'protection d’étape',
    cost: 'réserve transportée',
    'alternative-plus-sure': 'alternative de secours',
  };
  const benefitByStabilizer = {
    'capacité tampon': 'absorbe la prochaine contrainte de capacité avant rupture.',
    'lissage de charge': 'réduit la saturation du goulot sans changer la priorité.',
    'protection d’étape': 'garde la fenêtre active malgré le prochain délai.',
    'réserve transportée': 'couvre le coût restant sans relancer toute la séquence.',
    'alternative de secours': 'transforme l’inversion possible en flux fiable.',
  };
  const stabilizer = stabilizerByConstraint[postSalvageRobustness.dominantConstraint] ?? 'détour sécurisé';
  const isUrgent = postSalvageRobustness.status === 'vulnerable';

  return {
    status: isUrgent ? 'urgent-stabilization' : 'stabilizer-recommended',
    stabilizer,
    nextGesture: postSalvageRobustness.nextGesture,
    benefit: benefitByStabilizer[stabilizer] ?? 'sécurise un détour fiable avant la prochaine contrainte.',
    summary: isUrgent
      ? `Stabilisation urgente: ${stabilizer} pour éviter une perte durable.`
      : `Stabilisateur recommandé: ${stabilizer} pour fiabiliser le corridor fragile.`,
  };
}

function buildPostSalvageDecisionAlert(salvageAction) {
  if (salvageAction === null) {
    return {
      status: 'no-additional-decision',
      recommendation: 'continue',
      mainConstraint: null,
      summary: 'Aucune décision abandon/inversion requise: la séquence reste rentable après délai.',
    };
  }

  const restoration = salvageAction.restorationSummary;
  if (restoration.status === 'restores-priority') {
    return {
      status: 'no-additional-decision',
      recommendation: 'continue',
      mainConstraint: restoration.mainConstraint,
      summary: 'Salvage restauré: continuer la séquence prioritaire.',
    };
  }

  const recommendation = restoration.status === 'still-unprofitable'
    ? 'abandon-sequence'
    : restoration.nextDecision === 'switch-to-alternative'
      ? 'invert-durably'
      : 'secure-minimal-investment';
  const summaryByRecommendation = {
    'abandon-sequence': `Abandonner la séquence: ${restoration.mainConstraint} garde le coût restant trop élevé.`,
    'invert-durably': `Inverser durablement: ${salvageAction.alternativeOptionId} reste plus sûr malgré le salvage.`,
    'secure-minimal-investment': `Sécuriser un complément minimal: contrainte restante ${restoration.mainConstraint}.`,
  };

  return {
    status: 'decision-required',
    recommendation,
    mainConstraint: restoration.mainConstraint,
    summary: summaryByRecommendation[recommendation],
  };
}

function buildSalvageRestorationSummary(salvageAction, delayScenario) {
  if (salvageAction === null) {
    return null;
  }

  const mainConstraintByCause = {
    delay: 'alternative-plus-sure',
    capacity: 'capacity',
    cost: 'cost',
    saturation: 'saturation',
  };
  const microDecisionByAction = {
    'invert-priority-to-alternative': 'switch-to-alternative',
    'secure-capacity-margin': 'wait-for-margin',
    'reduce-preparation-cost': 'wait-for-lower-cost',
    'secure-bottleneck-capacity': 'wait-for-margin',
  };
  const status = salvageAction.remainingCost === 0
    ? 'restores-priority'
    : salvageAction.remainingCost <= 2
      ? 'partially-stabilized'
      : 'still-unprofitable';
  const nextDecision = status === 'restores-priority'
    ? 'continue'
    : (microDecisionByAction[salvageAction.action] ?? 'switch-to-alternative');

  return {
    status,
    mainConstraint: mainConstraintByCause[delayScenario.cause] ?? 'delay',
    nextDecision,
    summary: status === 'restores-priority'
      ? 'Salvage restaure la priorité: continuer la séquence dès que la marge est confirmée.'
      : status === 'partially-stabilized'
        ? `Salvage stabilise partiellement: ${salvageAction.label}; coût restant ${salvageAction.remainingCost}.`
        : `Salvage insuffisant: basculer vers ${salvageAction.alternativeOptionId} reste plus sûr.`,
  };
}

function buildDangerousDelaySalvage(opportunityCostComparison, delayScenario, flipWarning) {
  if (delayScenario === null || delayScenario.netValue > 0) {
    return null;
  }

  const actionByCause = {
    delay: 'invert-priority-to-alternative',
    capacity: 'secure-capacity-margin',
    cost: 'reduce-preparation-cost',
    saturation: 'secure-bottleneck-capacity',
  };
  const labelByCause = {
    delay: `Basculer vers ${flipWarning.alternativeOptionId}`,
    capacity: 'Sécuriser une capacité tampon avant reprise',
    cost: 'Réduire le coût avant de relancer la séquence',
    saturation: 'Sécuriser le goulot avant toute dépense',
  };
  const remainingCost = Math.abs(delayScenario.netValue);

  const salvageAction = {
    id: `salvage:${opportunityCostComparison.recommendedOptionId}:${delayScenario.id}`,
    trigger: delayScenario.id,
    action: actionByCause[delayScenario.cause] ?? 'switch-to-alternative',
    label: labelByCause[delayScenario.cause] ?? `Basculer vers ${flipWarning.alternativeOptionId}`,
    alternativeOptionId: flipWarning.alternativeOptionId,
    remainingCost,
    summary: `${labelByCause[delayScenario.cause] ?? `Basculer vers ${flipWarning.alternativeOptionId}`}: coût restant ${remainingCost} après délai dangereux.`,
  };

  return {
    ...salvageAction,
    restorationSummary: buildSalvageRestorationSummary(salvageAction, delayScenario),
  };
}

function buildDelayOpportunityCost(opportunityCostComparison, preparationBreakEven, delayScenario, flipWarning, capacityCost) {
  const delayedNetValue = delayScenario?.netValue ?? preparationBreakEven.netValue - capacityCost;
  const delayCost = Math.max(0, preparationBreakEven.netValue - delayedNetValue);
  const isDangerous = delayedNetValue <= 0;
  const salvageAction = buildDangerousDelaySalvage(opportunityCostComparison, delayScenario, flipWarning);

  return {
    id: `delay-cost:${opportunityCostComparison.recommendedOptionId}`,
    recommendedOptionId: opportunityCostComparison.recommendedOptionId,
    cost: delayCost,
    delayedNetValue,
    summary: isDangerous
      ? `Attendre coûte ${delayCost} valeur et rend le délai dangereux.`
      : `Attendre coûte ${delayCost} valeur mais garde ${delayedNetValue} marge nette.`,
    dangerThreshold: isDangerous
      ? (flipWarning.actionability.threshold ?? 'dès le prochain retard')
      : `danger si la marge nette tombe à 0; marge actuelle après délai: ${delayedNetValue}`,
    practicalConsequence: isDangerous
      ? flipWarning.actionability.consequence
      : 'suivre la séquence recommandée avant de dépenser davantage',
    reason: `Le délai retire ${delayCost} marge au bénéfice de ${opportunityCostComparison.recommendedOptionId}, dérivé de la comparaison actuelle.`,
    salvageAction,
  };
}

function buildTimingSensitivity(opportunityCostComparison, preparationBreakEven, capacityMobilized) {
  if (opportunityCostComparison === null || preparationBreakEven === null) {
    return null;
  }

  const capacityCost = Math.max(1, capacityMobilized);
  const scenarios = [
    {
      id: 'delay-one-turn',
      assumption: 'retard d’un tour',
      cause: 'delay',
      netValue: preparationBreakEven.netValue - capacityCost - (preparationBreakEven.netValue <= 0 ? capacityCost : 0),
    },
    {
      id: 'lower-capacity',
      assumption: 'capacité moindre',
      cause: 'capacity',
      netValue: preparationBreakEven.netValue - opportunityCostComparison.gained.margin,
    },
    {
      id: 'higher-effort-cost',
      assumption: 'coût légèrement plus élevé',
      cause: 'cost',
      netValue: preparationBreakEven.netValue - 1,
    },
    {
      id: 'bottleneck-saturation',
      assumption: 'saturation du goulot',
      cause: 'saturation',
      netValue: preparationBreakEven.netValue - capacityCost - Math.max(1, opportunityCostComparison.deferred.effort),
    },
  ].map((scenario) => ({
    ...scenario,
    recommendationStable: scenario.netValue > 0,
    outcome: scenario.netValue > 0 ? 'stable' : 'switch-to-alternative',
    alternativeOptionId: scenario.netValue > 0 ? null : opportunityCostComparison.alternativeOptionId,
  }));
  const flipScenario = scenarios.find((scenario) => !scenario.recommendationStable) ?? null;
  const actionability = buildFlipActionability(flipScenario, opportunityCostComparison, capacityCost);
  const flipWarning = flipScenario === null
    ? {
      status: 'stable',
      summary: 'stable',
      cause: null,
      scenarioId: null,
      alternativeOptionId: null,
      reason: `La marge de break-even reste positive dans ${scenarios.length} scénarios dérivés.`,
      actionability,
    }
    : {
      status: 'switch',
      summary: `bascule vers ${flipScenario.alternativeOptionId}`,
      cause: flipScenario.cause,
      scenarioId: flipScenario.id,
      alternativeOptionId: flipScenario.alternativeOptionId,
      reason: `La recommandation bascule vers ${flipScenario.alternativeOptionId} si ${flipScenario.assumption}.`,
      actionability,
    };
  const delayOpportunityCost = buildDelayOpportunityCost(
    opportunityCostComparison,
    preparationBreakEven,
    scenarios.find((scenario) => scenario.id === 'delay-one-turn') ?? null,
    flipWarning,
    capacityCost,
  );
  const postSalvageDecisionAlert = buildPostSalvageDecisionAlert(delayOpportunityCost.salvageAction);
  const postSalvageDecisionComparison = buildPostSalvageDecisionComparison(
    postSalvageDecisionAlert,
    delayOpportunityCost,
  );
  const postSalvageRobustness = buildPostSalvageRobustness(
    postSalvageDecisionAlert,
    postSalvageDecisionComparison,
    delayOpportunityCost,
    scenarios,
  );
  const postSalvageStabilizer = buildPostSalvageStabilizer(postSalvageRobustness);

  return {
    id: `timing-sensitivity:${opportunityCostComparison.recommendedOptionId}`,
    summary: flipScenario === null
      ? 'stable: recommandation robuste aux hypothèses testées.'
      : `bascule vers ${flipScenario.alternativeOptionId} si ${flipScenario.assumption}.`,
    status: flipScenario === null ? 'stable' : 'fragile',
    flipWarning,
    scenarios,
    reason: flipWarning.reason,
    actionableAdvice: actionability.advice,
    delayOpportunityCost,
    postSalvageDecisionAlert,
    postSalvageDecisionComparison,
    postSalvageRobustness,
    postSalvageStabilizer,
  };
}

function buildBestValuePreparation(preparationOptions, routeValue, routeRiskLevel, capacityMobilized) {
  if (preparationOptions.length < 2) {
    return null;
  }

  const scoredOptions = preparationOptions
    .map((option) => ({
      option,
      score: scorePreparationOption(option, routeValue, routeRiskLevel),
      estimatedValueProtected: option.expectedEffect.marginGain * routeValue,
    }))
    .sort((left, right) => right.score - left.score
      || right.estimatedValueProtected - left.estimatedValueProtected
      || left.option.effort.amount - right.option.effort.amount
      || left.option.id.localeCompare(right.option.id));
  const best = scoredOptions[0];
  const cheapest = preparationOptions
    .slice()
    .sort((left, right) => left.effort.amount - right.effort.amount || left.id.localeCompare(right.id))[0];
  const alternativeOption = cheapest.id === best.option.id
    ? (scoredOptions.find((entry) => entry.option.id !== best.option.id)?.option ?? null)
    : cheapest;
  const alternativeValueProtected = alternativeOption === null ? 0 : alternativeOption.expectedEffect.marginGain * routeValue;
  const cheaperAcceptable = cheapest.id === best.option.id
    ? null
    : {
      optionId: cheapest.id,
      condition: cheapest.expectedEffect.marginGain >= best.option.expectedEffect.marginGain
        ? 'acceptable si le risque corridor reste stable'
        : 'acceptable seulement si le coût immédiat prime sur la valeur protégée',
    };

  const opportunityCostComparison = buildOpportunityCostComparison(
    best.option,
    alternativeOption,
    best.estimatedValueProtected,
    alternativeValueProtected,
    routeRiskLevel,
  );
  const preparationBreakEven = buildPreparationBreakEven(opportunityCostComparison, capacityMobilized);

  return {
    id: `best-value:${best.option.id}`,
    optionId: best.option.id,
    action: best.option.action,
    estimatedValueProtected: best.estimatedValueProtected,
    marginGain: best.option.expectedEffect.marginGain,
    effort: { ...best.option.effort },
    reason: `Protège ${best.estimatedValueProtected} valeur corridor avec +${best.option.expectedEffect.marginGain} marge pour ${best.option.effort.amount} ${best.option.effort.unit}.`,
    cheaperAcceptable,
    sequence: buildPreparationSequence(best.option, cheaperAcceptable, best.estimatedValueProtected),
    opportunityCostComparison,
    preparationBreakEven,
    timingSensitivity: buildTimingSensitivity(opportunityCostComparison, preparationBreakEven, capacityMobilized),
  };
}

function buildNextBottleneck(resourceRows, capacityMobilized, limitingResourceId, routeRiskLevel, routeValue) {
  if (capacityMobilized === 0) {
    return null;
  }

  const spentResources = resourceRows
    .filter((row) => row.capacityMobilized > 0)
    .sort((left, right) => left.capacityRemaining - right.capacityRemaining || left.resourceId.localeCompare(right.resourceId));
  const nextResource = spentResources[0] ?? null;

  if (nextResource === null || nextResource.capacityRemaining > 1) {
    return null;
  }

  const preparationOptions = buildPreparationOptions(nextResource, resourceRows, routeRiskLevel);

  return {
    type: nextResource.capacityRemaining === 0 ? 'capacity-exhausted' : 'low-margin',
    resourceId: limitingResourceId ?? nextResource.resourceId,
    marginRemaining: nextResource.capacityRemaining,
    preparationAction: nextResource.capacityRemaining === 0 ? 'free-route-capacity' : 'reserve-capacity-buffer',
    preparationOptions,
    bestValuePreparation: buildBestValuePreparation(preparationOptions, routeValue, routeRiskLevel, capacityMobilized),
  };
}

function buildCapacitySpendPreview(route, spendPlan) {
  const currentCapacity = route.totalCapacity;
  const capacityMobilized = Math.min(spendPlan.capacityMobilized, currentCapacity);
  const capacityRemaining = Math.max(0, currentCapacity - capacityMobilized);
  const resourceRows = Object.entries(route.capacityByResource)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([resourceId, capacity]) => {
      const mobilized = Math.min(spendPlan.mobilizedByResource[resourceId] ?? 0, capacity);

      return {
        resourceId,
        currentCapacity: capacity,
        capacityMobilized: mobilized,
        capacityRemaining: capacity - mobilized,
      };
    });
  const computedLimitingResourceId = spendPlan.limitingResourceId
    ?? resourceRows
      .filter((row) => row.capacityMobilized > 0)
      .sort((left, right) => left.capacityRemaining - right.capacityRemaining || left.resourceId.localeCompare(right.resourceId))[0]?.resourceId
    ?? null;

  const nextBottleneck = buildNextBottleneck(
    resourceRows,
    capacityMobilized,
    computedLimitingResourceId,
    route.riskLevel,
    currentCapacity,
  );
  const bestValuePreparation = nextBottleneck?.bestValuePreparation ?? null;

  return {
    routeId: route.id,
    currentCapacity,
    capacityMobilized,
    capacityRemaining,
    limitingResourceId: computedLimitingResourceId,
    nextBottleneck,
    preparationOptions: nextBottleneck?.preparationOptions ?? [],
    bestValuePreparation,
    preparationSequence: bestValuePreparation?.sequence ?? [],
    opportunityCostComparison: bestValuePreparation?.opportunityCostComparison ?? null,
    preparationBreakEven: bestValuePreparation?.preparationBreakEven ?? null,
    timingSensitivity: bestValuePreparation?.timingSensitivity ?? null,
    state: capacityMobilized === 0
      ? 'no-spend'
      : capacityRemaining === 0
        ? 'fully-spent'
        : 'remaining-margin',
    resources: resourceRows,
  };
}

function normalizeRouteStyle(route, styleByTransportMode) {
  const style = route.active
    ? (styleByTransportMode[route.transportMode] ?? styleByTransportMode.default ?? DEFAULT_ROUTE_STYLE_BY_MODE.default)
    : (styleByTransportMode.inactive ?? DEFAULT_ROUTE_STYLE_BY_MODE.inactive);

  return {
    stroke: String(style.stroke ?? DEFAULT_ROUTE_STYLE_BY_MODE.default.stroke).trim() || DEFAULT_ROUTE_STYLE_BY_MODE.default.stroke,
    width: Number.isInteger(style.width) && style.width > 0 ? style.width : DEFAULT_ROUTE_STYLE_BY_MODE.default.width,
    pattern: String(style.pattern ?? DEFAULT_ROUTE_STYLE_BY_MODE.default.pattern).trim() || DEFAULT_ROUTE_STYLE_BY_MODE.default.pattern,
    opacity: Number.isFinite(style.opacity) ? Math.max(0, Math.min(1, style.opacity)) : DEFAULT_ROUTE_STYLE_BY_MODE.default.opacity,
  };
}

export function buildEconomyMapOverlay(cities, routes, options = {}) {
  const normalizedCities = requireArray(cities, 'EconomyMapOverlay cities').map(normalizeCity);
  const normalizedRoutes = requireArray(routes, 'EconomyMapOverlay routes').map(normalizeRoute);
  const normalizedOptions = requireObject(options, 'EconomyMapOverlay options');
  const cityPositionById = requireObject(normalizedOptions.cityPositionById ?? {}, 'EconomyMapOverlay cityPositionById');
  const styleByTransportMode = {
    ...DEFAULT_ROUTE_STYLE_BY_MODE,
    ...requireObject(normalizedOptions.styleByTransportMode ?? {}, 'EconomyMapOverlay styleByTransportMode'),
  };
  const recommendedUnlockByRouteId = requireObject(
    normalizedOptions.recommendedUnlockByRouteId ?? {},
    'EconomyMapOverlay recommendedUnlockByRouteId',
  );

  const cityOverlays = normalizedCities
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((city) => {
      const resources = buildResourceSummary(city.stockByResource);

      return {
        overlayId: `city:${city.id}`,
        type: 'city',
        cityId: city.id,
        cityName: city.name,
        regionId: city.regionId,
        population: city.population,
        prosperity: city.prosperity,
        stability: city.stability,
        capital: city.capital,
        label: city.capital ? `${city.name} ★` : city.name,
        resources,
        tradeRouteIds: [...city.tradeRouteIds],
        marker: buildCityMarker(city, cityPositionById),
      };
    });

  const routeOverlays = normalizedRoutes
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((route) => {
      const capacitySpendPlan = normalizeCapacitySpendPlan(recommendedUnlockByRouteId[route.id], route.id);

      return {
        overlayId: `route:${route.id}`,
        type: 'route',
        routeId: route.id,
        routeName: route.name,
        cityIds: [...route.stopCityIds],
        originCityId: route.originCityId,
        destinationCityId: route.destinationCityId,
        active: route.active,
        transportMode: route.transportMode,
        riskLevel: route.riskLevel,
        totalCapacity: route.totalCapacity,
        resources: Object.entries(route.capacityByResource)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([resourceId, capacity]) => ({ resourceId, capacity })),
        capacitySpendPreview: buildCapacitySpendPreview(route, capacitySpendPlan),
        label: `${route.name} (${route.transportMode})`,
        style: normalizeRouteStyle(route, styleByTransportMode),
      };
    });

  return {
    title: 'Carte économie et logistique',
    summary: `${cityOverlays.length} villes, ${routeOverlays.length} routes logistiques`,
    cities: cityOverlays,
    routes: routeOverlays,
    metrics: {
      cityCount: cityOverlays.length,
      capitalCount: cityOverlays.filter((city) => city.capital).length,
      routeCount: routeOverlays.length,
      activeRouteCount: routeOverlays.filter((route) => route.active).length,
      totalStock: cityOverlays.reduce((sum, city) => sum + city.resources.totalStock, 0),
      totalRouteCapacity: routeOverlays.reduce((sum, route) => sum + route.totalCapacity, 0),
    },
  };
}
