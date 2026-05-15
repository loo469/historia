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

function buildPostStabilizerReliability(postSalvageStabilizer) {
  if (postSalvageStabilizer.status === 'none-required') {
    return {
      status: 'reliable-route',
      remainingConstraint: null,
      nextGesture: 'promouvoir',
      summary: 'Route fiable: promouvoir le corridor après stabilisateur neutre.',
    };
  }

  const remainingConstraintByStabilizer = {
    'capacité tampon': 'capacité tampon',
    'détour sécurisé': 'détour',
    'lissage de charge': 'charge',
    'protection d’étape': 'protection d’étape',
    'réserve transportée': 'saturation',
    'alternative de secours': 'alternative',
  };
  const remainingConstraint = remainingConstraintByStabilizer[postSalvageStabilizer.stabilizer] ?? 'détour';

  if (postSalvageStabilizer.status === 'urgent-stabilization') {
    return {
      status: 'reserve-corridor',
      remainingConstraint,
      nextGesture: remainingConstraint === 'alternative' ? 'garder comme secours' : 'renforcer encore',
      summary: `Corridor à garder en secours: ${remainingConstraint} reste trop fragile après stabilisateur.`,
    };
  }

  return {
    status: 'monitored-route',
    remainingConstraint,
    nextGesture: 'surveiller un tour',
    summary: `Route utilisable sous surveillance: contrôler ${remainingConstraint} après stabilisateur.`,
  };
}

function buildMonitoredCorridorPromotionRisk(postStabilizerReliability) {
  if (postStabilizerReliability.status === 'reliable-route') {
    return {
      status: 'safe-promotion',
      remainingConstraint: postStabilizerReliability.remainingConstraint,
      nextGesture: 'promouvoir',
      summary: 'Promotion sûre: le corridor peut devenir route principale.',
    };
  }

  if (postStabilizerReliability.status === 'reserve-corridor') {
    return {
      status: 'premature-promotion',
      remainingConstraint: postStabilizerReliability.remainingConstraint,
      nextGesture: postStabilizerReliability.nextGesture === 'garder comme secours' ? 'garder en secours' : 'renforcer d’abord',
      summary: `Promotion prématurée: ${postStabilizerReliability.remainingConstraint} expose encore le corridor principal.`,
    };
  }

  return {
    status: 'limited-promotion',
    remainingConstraint: postStabilizerReliability.remainingConstraint,
    nextGesture: 'plafonner le flux',
    summary: `Promotion sous limite: plafonner le flux tant que ${postStabilizerReliability.remainingConstraint} reste surveillé.`,
  };
}

function buildMonitoredCorridorRollbackGuard(monitoredCorridorPromotionRisk) {
  if (monitoredCorridorPromotionRisk.status === 'safe-promotion') {
    return {
      status: 'rollback-unneeded',
      constraint: monitoredCorridorPromotionRisk.remainingConstraint,
      nextGesture: 'promouvoir sans garde',
      summary: 'Rollback inutile: la promotion peut avancer sans garde dédiée.',
    };
  }

  if (monitoredCorridorPromotionRisk.status === 'limited-promotion') {
    return {
      status: 'guard-recommended',
      constraint: monitoredCorridorPromotionRisk.remainingConstraint,
      nextGesture: 'plafonner avec garde',
      summary: `Garde conseillée: plafonner le flux et surveiller ${monitoredCorridorPromotionRisk.remainingConstraint}.`,
    };
  }

  return {
    status: 'rollback-ready-required',
    constraint: monitoredCorridorPromotionRisk.remainingConstraint,
    nextGesture: monitoredCorridorPromotionRisk.nextGesture === 'garder en secours' ? 'revenir en secours' : 'préparer alternative',
    summary: `Rollback prêt requis: ${monitoredCorridorPromotionRisk.remainingConstraint} impose une alternative avant promotion.`,
  };
}

function buildRollbackGuardLoadMargin(monitoredCorridorRollbackGuard) {
  if (monitoredCorridorRollbackGuard.status === 'rollback-unneeded') {
    return {
      status: 'peak-absorbable',
      constraint: monitoredCorridorRollbackGuard.constraint,
      nextGesture: 'absorber',
      summary: 'Pic absorbable: la route principale garde assez de marge après garde.',
    };
  }

  if (monitoredCorridorRollbackGuard.status === 'guard-recommended') {
    return {
      status: 'peak-capped',
      constraint: monitoredCorridorRollbackGuard.constraint,
      nextGesture: 'plafonner le flux',
      summary: `Pic à plafonner: ${monitoredCorridorRollbackGuard.constraint} exige de garder la marge sous contrôle.`,
    };
  }

  return {
    status: 'overload-likely',
    constraint: monitoredCorridorRollbackGuard.constraint,
    nextGesture: monitoredCorridorRollbackGuard.nextGesture === 'revenir en secours' ? 'revenir en secours' : 'activer alternative',
    summary: `Surcharge probable: ${monitoredCorridorRollbackGuard.constraint} demande une alternative active.`,
  };
}

function buildGuardedCorridorLoadRelief(rollbackGuardLoadMargin) {
  if (rollbackGuardLoadMargin.status === 'peak-absorbable') {
    return {
      status: 'no-relief-needed',
      relief: null,
      protectedMargin: 'marge actuelle suffisante',
      nextGesture: 'absorber',
      summary: 'Aucun allègement utile: la marge absorbe le prochain pic visible.',
    };
  }

  if (rollbackGuardLoadMargin.status === 'peak-capped') {
    const reliefByConstraint = {
      'capacité tampon': 'réduire le pic de charge',
      saturation: 'lisser la saturation',
      détour: 'redistribuer par détour court',
      charge: 'lisser la charge',
      'protection d’étape': 'décaler une étape non critique',
      alternative: 'déporter vers alternative de secours',
    };
    const relief = reliefByConstraint[rollbackGuardLoadMargin.constraint] ?? 'redistribuer la charge';
    return {
      status: 'relief-recommended',
      relief,
      protectedMargin: rollbackGuardLoadMargin.constraint,
      nextGesture: 'plafonner le flux',
      summary: `Allègement utile: ${relief} protège la marge sans promettre une sécurité totale.`,
    };
  }

  return {
    status: 'urgent-relief',
    relief: 'activer alternative de secours',
    protectedMargin: rollbackGuardLoadMargin.constraint,
    nextGesture: rollbackGuardLoadMargin.nextGesture,
    summary: `Allègement urgent: ${rollbackGuardLoadMargin.constraint} surcharge la route, garder une alternative active.`,
  };
}

function describeNormalizationConstraint(guardedCorridorLoadRelief, rollbackGuardLoadMargin, monitoredCorridorRollbackGuard) {
  if (guardedCorridorLoadRelief.status === 'no-relief-needed') {
    return 'aucune contrainte visible';
  }

  if (monitoredCorridorRollbackGuard.status === 'rollback-ready-required') {
    return 'risque de rollback';
  }

  const constraint = rollbackGuardLoadMargin.constraint ?? guardedCorridorLoadRelief.protectedMargin;
  if (constraint === 'alternative' || constraint === 'alternative-plus-sure') {
    return 'alternative fragile';
  }

  if (constraint === 'capacité tampon' || constraint === 'protection d’étape') {
    return 'réserve logistique';
  }

  return 'pic de charge';
}

function buildGuardedCorridorNormalizationCheckpoint(
  guardedCorridorLoadRelief,
  rollbackGuardLoadMargin,
  monitoredCorridorRollbackGuard,
) {
  const remainingConstraint = describeNormalizationConstraint(
    guardedCorridorLoadRelief,
    rollbackGuardLoadMargin,
    monitoredCorridorRollbackGuard,
  );

  if (guardedCorridorLoadRelief.status === 'no-relief-needed') {
    return {
      status: 'corridor-normalized',
      remainingConstraint,
      action: 'normaliser sans promotion automatique',
      summary: 'Corridor normalisé: garder la lecture active sans promotion automatique.',
    };
  }

  if (guardedCorridorLoadRelief.status === 'relief-recommended') {
    return {
      status: 'monitored-normalization-possible',
      remainingConstraint,
      action: 'appliquer l’allègement puis surveiller un tour',
      summary: `Normalisation surveillée possible: vérifier ${remainingConstraint} après allègement.`,
    };
  }

  return {
    status: 'guard-still-required',
    remainingConstraint,
    action: 'stabiliser avant de normaliser',
    summary: `Garde toujours nécessaire: stabiliser ${remainingConstraint} avant normalisation.`,
  };
}

function buildPostNormalizationSurplusUse(guardedCorridorNormalizationCheckpoint) {
  if (guardedCorridorNormalizationCheckpoint.status === 'corridor-normalized') {
    return {
      status: 'invest-next-corridor',
      priority: 'investir dans le prochain corridor utile',
      guidingConstraint: 'charge voisine',
      microAction: 'attendre stabilité confirmée puis investir',
      summary: 'Surplus disponible: viser le prochain corridor utile après stabilité confirmée.',
    };
  }

  if (guardedCorridorNormalizationCheckpoint.status === 'monitored-normalization-possible') {
    return {
      status: 'reinforce-fragile-alternative',
      priority: 'renforcer une alternative fragile',
      guidingConstraint: 'alternative critique',
      microAction: 'renforcer avant de consommer le surplus',
      summary: 'Surplus prudent: renforcer l’alternative critique avant nouvel investissement.',
    };
  }

  return {
    status: 'keep-surplus-reserve',
    priority: 'garder le surplus en réserve',
    guidingConstraint: 'risque de rechute',
    microAction: 'conserver jusqu’à stabilité visible',
    summary: 'Surplus en réserve: attendre que le risque de rechute baisse avant dépense.',
  };
}

function buildSurplusStabilizationDecision(postNormalizationSurplusUse) {
  if (postNormalizationSurplusUse.status === 'invest-next-corridor') {
    return {
      status: 'fund-expansion',
      recommendation: 'financer l’expansion',
      corridorState: 'stable',
      decidingConstraint: postNormalizationSurplusUse.guidingConstraint,
      summary: 'Surplus libre: financer l’expansion après stabilité du corridor.',
    };
  }

  if (postNormalizationSurplusUse.status === 'reinforce-fragile-alternative') {
    return {
      status: 'stabilize-routes',
      recommendation: 'stabiliser les routes',
      corridorState: 'fragile',
      decidingConstraint: postNormalizationSurplusUse.guidingConstraint,
      summary: 'Surplus à stabiliser: sécuriser les routes avant expansion.',
    };
  }

  return {
    status: 'stabilize-routes',
    recommendation: 'stabiliser les routes',
    corridorState: 'chargé',
    decidingConstraint: postNormalizationSurplusUse.guidingConstraint,
    summary: 'Surplus à retenir: stabiliser le corridor chargé avant expansion.',
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
  const postStabilizerReliability = buildPostStabilizerReliability(postSalvageStabilizer);
  const monitoredCorridorPromotionRisk = buildMonitoredCorridorPromotionRisk(postStabilizerReliability);
  const monitoredCorridorRollbackGuard = buildMonitoredCorridorRollbackGuard(monitoredCorridorPromotionRisk);
  const rollbackGuardLoadMargin = buildRollbackGuardLoadMargin(monitoredCorridorRollbackGuard);
  const guardedCorridorLoadRelief = buildGuardedCorridorLoadRelief(rollbackGuardLoadMargin);
  const guardedCorridorNormalizationCheckpoint = buildGuardedCorridorNormalizationCheckpoint(
    guardedCorridorLoadRelief,
    rollbackGuardLoadMargin,
    monitoredCorridorRollbackGuard,
  );
  const postNormalizationSurplusUse = buildPostNormalizationSurplusUse(guardedCorridorNormalizationCheckpoint);
  const surplusStabilizationDecision = buildSurplusStabilizationDecision(postNormalizationSurplusUse);

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
    postStabilizerReliability,
    monitoredCorridorPromotionRisk,
    monitoredCorridorRollbackGuard,
    rollbackGuardLoadMargin,
    guardedCorridorLoadRelief,
    guardedCorridorNormalizationCheckpoint,
    postNormalizationSurplusUse,
    surplusStabilizationDecision,
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

function buildResourceLayer(cityOverlays) {
  const resourceFeatures = cityOverlays.flatMap((city) => city.resources.entries.map((resource) => ({
    featureId: `resource:${resource.resourceId}:${city.cityId}`,
    cityId: city.cityId,
    cityName: city.cityName,
    resourceId: resource.resourceId,
    quantity: resource.quantity,
    position: city.marker.position,
    intensity: resource.quantity === 0
      ? 'empty'
      : resource.quantity >= city.population / 5
        ? 'abundant'
        : 'available',
    label: `${resource.resourceId}: ${resource.quantity}`,
  })));
  const totalsByResource = Object.values(resourceFeatures.reduce((totals, feature) => {
    totals[feature.resourceId] ??= {
      resourceId: feature.resourceId,
      totalQuantity: 0,
      cityCount: 0,
    };
    totals[feature.resourceId].totalQuantity += feature.quantity;
    totals[feature.resourceId].cityCount += 1;

    return totals;
  }, {})).sort((left, right) => left.resourceId.localeCompare(right.resourceId));

  return {
    id: 'resources',
    title: 'Ressources stockées',
    visibleByDefault: true,
    features: resourceFeatures.sort((left, right) => left.resourceId.localeCompare(right.resourceId)
      || left.cityId.localeCompare(right.cityId)),
    totalsByResource,
    legend: [
      { key: 'abundant', label: 'Stock abondant', tone: 'positive' },
      { key: 'available', label: 'Stock disponible', tone: 'neutral' },
      { key: 'empty', label: 'Stock nul', tone: 'muted' },
    ],
  };
}

function buildCityDecisionCue(city) {
  const totalStock = city.resources.totalStock;
  const mainResource = city.resources.primaryResourceId ?? 'ressource';

  if (city.tradeRouteIds.length === 0) {
    return {
      factor: 'ville isolée',
      intensity: 'high',
      reason: `${city.cityName} n’est reliée à aucune route logistique active dans cette couche.`,
      tooltip: `Ville isolée: connecter ${city.cityName} avant de compter sur ses stocks.`,
    };
  }

  if (totalStock === 0) {
    return {
      factor: 'manque de ressource',
      intensity: 'critical',
      reason: `${city.cityName} ne dispose d’aucun stock visible.`,
      tooltip: `Manque de ressource: ${city.cityName} doit être ravitaillée en priorité.`,
    };
  }

  if (totalStock >= city.population / 4) {
    return {
      factor: 'surplus utile',
      intensity: 'positive',
      reason: `${city.cityName} peut alimenter les routes grâce à ${totalStock} stock total.`,
      tooltip: `Surplus utile: ${mainResource} peut soutenir une décision logistique.`,
    };
  }

  return {
    factor: 'stock limité',
    intensity: city.stability < 40 ? 'medium' : 'low',
    reason: `${city.cityName} garde une marge limitée avant tension économique.`,
    tooltip: `Stock limité: surveiller ${mainResource} avant d’ouvrir une nouvelle dépense.`,
  };
}

function buildRouteDecisionCue(route) {
  const bottleneck = route.capacitySpendPreview.nextBottleneck;

  if (!route.active) {
    return {
      factor: 'route inactive',
      intensity: 'muted',
      reason: `${route.routeName} ne transporte pas de capacité actuellement.`,
      tooltip: `Route inactive: aucun flux fiable entre ${route.originCityId} et ${route.destinationCityId}.`,
    };
  }

  if (bottleneck !== null) {
    const intensity = bottleneck.marginRemaining === 0 ? 'critical' : 'high';

    return {
      factor: 'route saturée',
      intensity,
      reason: `${bottleneck.resourceId} limite ${route.routeName} avec ${bottleneck.marginRemaining} marge restante.`,
      tooltip: `Goulet ${bottleneck.resourceId}: ${bottleneck.marginRemaining} capacité restante sur ${route.routeName}.`,
    };
  }

  if (route.riskLevel >= 50) {
    return {
      factor: 'tension logistique',
      intensity: 'medium',
      reason: `${route.routeName} reste risquée malgré une capacité disponible.`,
      tooltip: `Tension logistique: risque ${route.riskLevel}/100, prévoir une alternative.`,
    };
  }

  if (route.capacitySpendPreview.capacityMobilized > 0) {
    return {
      factor: 'surplus mobilisé',
      intensity: 'low',
      reason: `${route.routeName} conserve ${route.capacitySpendPreview.capacityRemaining} capacité après dépense.`,
      tooltip: `Surplus mobilisé: ${route.capacitySpendPreview.capacityRemaining} capacité reste disponible.`,
    };
  }

  return {
    factor: 'route disponible',
    intensity: 'low',
    reason: `${route.routeName} n’a pas de goulet visible.`,
    tooltip: `Route disponible: capacité ${route.totalCapacity}, aucun goulet prioritaire.`,
  };
}


function buildRouteWhatIfOptions(route, decisionCue) {
  const bottleneck = route.capacitySpendPreview.nextBottleneck;
  const capacityRemaining = route.capacitySpendPreview.capacityRemaining;
  const routeValue = Math.max(1, route.totalCapacity);

  if (!route.active) {
    return [{
      id: `${route.routeId}:stabilize`,
      filter: 'stabilization',
      label: 'Stabiliser la route',
      expectedImpact: 'Rouvre le flux avant toute priorisation convoi.',
      impactScore: Math.max(1, Math.ceil(routeValue / 3)),
      badge: 'reconnecter',
    }];
  }

  const options = [];

  if (bottleneck !== null || capacityRemaining <= 1) {
    const marginGain = bottleneck?.marginRemaining === 0 ? 2 : 1;

    options.push({
      id: `${route.routeId}:convoy-priority`,
      filter: 'convoy-priority',
      label: 'Priorité convoi',
      expectedImpact: bottleneck === null
        ? 'Protège la dernière marge disponible sur cette route.'
        : `Soulage le goulet ${bottleneck.resourceId} avant saturation.`,
      impactScore: routeValue + marginGain + Math.ceil(route.riskLevel / 25),
      badge: bottleneck?.marginRemaining === 0 ? 'priorité critique' : 'priorité haute',
    });
  }

  if (route.riskLevel >= 35 || decisionCue.intensity === 'critical') {
    options.push({
      id: `${route.routeId}:stabilization`,
      filter: 'stabilization',
      label: 'Stabilisation',
      expectedImpact: `Réduit le risque actuel (${route.riskLevel}/100) et sécurise les flux existants.`,
      impactScore: Math.ceil(route.riskLevel / 10) + Math.max(0, routeValue - capacityRemaining),
      badge: 'stabiliser',
    });
  }

  if (route.riskLevel < 50 && capacityRemaining >= Math.ceil(route.totalCapacity / 2)) {
    options.push({
      id: `${route.routeId}:expansion`,
      filter: 'expansion',
      label: 'Expansion',
      expectedImpact: `Exploite ${capacityRemaining} capacité restante pour étendre le réseau.`,
      impactScore: capacityRemaining + Math.max(0, 50 - route.riskLevel),
      badge: 'expansion sûre',
    });
  }

  return options
    .sort((left, right) => right.impactScore - left.impactScore || left.id.localeCompare(right.id))
    .slice(0, 3);
}

function buildRoutePriorityBadge(route, decisionCue, whatIfOptions) {
  const bestOption = whatIfOptions[0] ?? null;

  if (bestOption === null) {
    return {
      level: decisionCue.intensity,
      label: decisionCue.factor,
      recommendedFilter: null,
      downstreamEffect: decisionCue.reason,
    };
  }

  return {
    level: bestOption.impactScore >= route.totalCapacity + 4 ? 'critical' : decisionCue.intensity,
    label: bestOption.badge,
    recommendedFilter: bestOption.filter,
    downstreamEffect: bestOption.expectedImpact,
  };
}

function buildRouteStressFilters(logisticsFeatures) {
  const filterDefinitions = {
    'convoy-priority': 'Routes où une priorité convoi soulage vite un goulet.',
    stabilization: 'Routes à stabiliser avant d’étendre ou de déplacer les flux.',
    expansion: 'Routes avec marge suffisante pour soutenir une extension.',
  };

  return Object.entries(filterDefinitions).map(([filter, description]) => {
    const matchingRoutes = logisticsFeatures
      .filter((feature) => feature.whatIfOptions.some((option) => option.filter === filter))
      .sort((left, right) => (right.priorityBadge?.level === 'critical') - (left.priorityBadge?.level === 'critical')
        || right.riskLevel - left.riskLevel
        || left.routeId.localeCompare(right.routeId));

    return {
      filter,
      label: filter === 'convoy-priority'
        ? 'Priorité convoi'
        : filter === 'stabilization'
          ? 'Stabilisation'
          : 'Expansion',
      description,
      routeIds: matchingRoutes.map((route) => route.routeId),
      count: matchingRoutes.length,
    };
  });
}


function getIntensityScore(intensity) {
  return { critical: 5, high: 4, medium: 3, positive: 2, low: 1, muted: 0 }[intensity] ?? 0;
}

function buildRouteInterventionOptions(logisticsFeatures) {
  return logisticsFeatures.flatMap((route) => route.whatIfOptions.map((whatIfOption) => {
    const relativeCost = whatIfOption.filter === 'convoy-priority'
      ? 'moyen'
      : whatIfOption.filter === 'stabilization'
        ? 'élevé'
        : 'faible';
    const costScore = { faible: 1, moyen: 2, élevé: 3 }[relativeCost];
    const riskIfIgnored = route.decisionCue.intensity === 'critical'
      ? `Ignorer ${route.label} peut bloquer le goulet ${route.bottleneckResourceId ?? 'principal'}.`
      : route.riskLevel >= 50
        ? `Ignorer ${route.label} laisse un risque ${route.riskLevel}/100 sur les flux.`
        : `Ignorer ${route.label} retarde une amélioration économique disponible.`;

    return {
      id: `intervention:${whatIfOption.id}`,
      targetType: 'route',
      targetId: route.routeId,
      targetLabel: route.label,
      action: whatIfOption.filter,
      label: whatIfOption.label,
      relativeCost,
      costScore,
      expectedImpact: whatIfOption.expectedImpact,
      impactScore: whatIfOption.impactScore,
      riskIfIgnored,
      microcopy: `${whatIfOption.label}: coût ${relativeCost}, impact ${whatIfOption.impactScore}; ${riskIfIgnored}`,
      score: whatIfOption.impactScore + getIntensityScore(route.decisionCue.intensity) - costScore,
    };
  }));
}

function buildCityInterventionOptions(cityOverlays, cityFeatures) {
  return cityFeatures
    .map((feature) => {
      const city = cityOverlays.find((candidate) => candidate.cityId === feature.cityId);
      const totalStock = city?.resources.totalStock ?? 0;
      const relativeCost = feature.decisionCue.intensity === 'critical'
        ? 'élevé'
        : feature.decisionCue.intensity === 'high' || feature.decisionCue.intensity === 'medium'
          ? 'moyen'
          : 'faible';
      const costScore = { faible: 1, moyen: 2, élevé: 3 }[relativeCost];
      const action = feature.decisionCue.factor === 'surplus utile' ? 'reporter-expansion' : 'support-city';
      const label = action === 'reporter-expansion' ? 'Reporter expansion' : 'Soutenir cité';
      const impactScore = Math.max(1, Math.ceil((city?.population ?? 0) / 50) + getIntensityScore(feature.decisionCue.intensity));
      const expectedImpact = action === 'reporter-expansion'
        ? `Préserve ${totalStock} stock utile pour une route plus contrainte.`
        : feature.decisionCue.factor === 'ville isolée'
          ? `Reconnecte ${feature.label} aux décisions de route.`
          : `Réduit la tension économique de ${feature.label}.`;
      const riskIfIgnored = action === 'reporter-expansion'
        ? `Dépenser trop tôt peut disperser le surplus de ${feature.label}.`
        : feature.decisionCue.factor === 'manque de ressource'
          ? `${feature.label} peut rester sans stock exploitable.`
          : `${feature.label} garde une tension qui concurrence les routes prioritaires.`;

      return {
        id: `intervention:city:${feature.cityId}:${action}`,
        targetType: 'city',
        targetId: feature.cityId,
        targetLabel: feature.label,
        action,
        label,
        relativeCost,
        costScore,
        expectedImpact,
        impactScore,
        riskIfIgnored,
        microcopy: `${label}: coût ${relativeCost}, impact ${impactScore}; ${riskIfIgnored}`,
        score: impactScore + getIntensityScore(feature.decisionCue.intensity) - costScore,
      };
    })
    .filter((option) => option.action !== 'reporter-expansion' || option.impactScore >= 4);
}


function buildLogisticsImpactPreview(option) {
  const netImpact = option.impactScore - option.costScore;

  if (netImpact <= 0) {
    return {
      status: 'no-meaningful-improvement',
      timing: 'none',
      throughputDelta: 0,
      bottleneckPressure: 'unchanged',
      convoyPriority: 'unchanged',
      summary: `${option.label}: aucun gain net lisible avant engagement.`,
      condition: 'Revoir seulement si le coût baisse ou si la tension augmente.',
    };
  }

  if (option.action === 'convoy-priority') {
    return {
      status: 'improved',
      timing: 'immediate',
      throughputDelta: Math.min(3, Math.max(1, netImpact)),
      bottleneckPressure: 'reduced-now',
      convoyPriority: 'raised',
      summary: `${option.label}: soulagement immédiat, priorité convoi relevée avant saturation.`,
      condition: 'Bénéfice immédiat si la capacité convoi est disponible ce tour.',
    };
  }

  if (option.action === 'stabilization' || option.action === 'support-city') {
    return {
      status: 'conditional-benefit',
      timing: 'delayed',
      throughputDelta: Math.min(2, Math.max(1, Math.ceil(netImpact / 3))),
      bottleneckPressure: option.action === 'stabilization' ? 'reduced-after-stabilization' : 'indirectly-reduced',
      convoyPriority: 'unchanged-until-ready',
      summary: `${option.label}: bénéfice différé, la pression baisse après sécurisation.`,
      condition: 'Valable si la dépense peut être tenue sans retirer la priorité convoi existante.',
    };
  }

  return {
    status: 'conditional-benefit',
    timing: 'delayed',
    throughputDelta: Math.min(2, Math.max(1, Math.ceil(netImpact / 4))),
    bottleneckPressure: option.action === 'reporter-expansion' ? 'preserved' : 'unchanged-until-expanded',
    convoyPriority: 'unchanged',
    summary: `${option.label}: effet utile mais non immédiat sur le débit logistique.`,
    condition: 'À confirmer après résolution des goulets et tensions prioritaires.',
  };
}

function buildInterventionComparison(cityOverlays, layers) {
  const options = [
    ...buildRouteInterventionOptions(layers.logistics.features),
    ...buildCityInterventionOptions(cityOverlays, layers.cities.features),
  ]
    .sort((left, right) => right.score - left.score
      || right.impactScore - left.impactScore
      || left.costScore - right.costScore
      || left.id.localeCompare(right.id))
    .slice(0, 6)
    .map((option, index) => ({
      ...option,
      logisticsImpactPreview: buildLogisticsImpactPreview(option),
      recommended: index === 0,
      rank: index + 1,
    }));

  return {
    title: 'Comparateur interventions économie',
    summary: options.length === 0
      ? 'Aucune intervention économique prioritaire détectée.'
      : `${options.length} interventions comparées; recommandation: ${options[0].label} sur ${options[0].targetLabel}.`,
    options,
    recommendedOptionId: options[0]?.id ?? null,
    emptyPreview: options.length === 0 ? {
      status: 'no-meaningful-improvement',
      timing: 'none',
      throughputDelta: 0,
      bottleneckPressure: 'unchanged',
      convoyPriority: 'unchanged',
      summary: 'Aucune décision ne change le débit, les goulets ou la priorité convoi avec les données actuelles.',
      condition: 'Attendre un stress, une ressource manquante ou une route priorisable.',
    } : null,
    legend: [
      { key: 'relativeCost', label: 'Coût relatif', description: 'Charge locale estimée sans simulation globale.' },
      { key: 'expectedImpact', label: 'Effet aval attendu', description: 'Effet lisible dérivé des routes, stocks et priorités existantes.' },
      { key: 'riskIfIgnored', label: 'Risque si ignoré', description: 'Pourquoi laisser cette option de côté peut coûter un tour.' },
    ],
  };
}


function buildRouteDisruptionReplay(route, decisionCue, priorityBadge) {
  const bottleneck = route.nextBottleneck ?? null;
  const severityScore = getIntensityScore(decisionCue.intensity) + Math.ceil(route.riskLevel / 25);
  const severity = severityScore >= 7
    ? 'major'
    : severityScore >= 5
      ? 'moderate'
      : 'minor';
  const beforePressure = Math.min(100, route.riskLevel + (bottleneck === null ? 5 : 20));
  const afterPressure = Math.max(0, route.riskLevel - (priorityBadge.recommendedFilter === 'convoy-priority' ? 12 : 4));
  const trajectory = afterPressure < beforePressure - 8
    ? 'recovering'
    : afterPressure > beforePressure
      ? 'worsening'
      : 'stagnating';

  return {
    id: `replay:${route.routeId}`,
    routeId: route.routeId,
    before: {
      riskLevel: beforePressure,
      capacityRemaining: Math.max(0, route.capacityRemaining - (bottleneck === null ? 0 : 1)),
      bottleneckResourceId: bottleneck?.resourceId ?? null,
    },
    after: {
      riskLevel: afterPressure,
      capacityRemaining: route.capacityRemaining,
      bottleneckResourceId: route.bottleneckResourceId,
    },
    cause: bottleneck === null
      ? decisionCue.factor
      : `goulet ${bottleneck.resourceId}`,
    severity,
    trajectory,
    summary: `${route.label}: ${trajectory === 'recovering' ? 'récupération' : trajectory === 'worsening' ? 'dégradation' : 'stagnation'} après ${bottleneck === null ? decisionCue.factor : `goulet ${bottleneck.resourceId}`}.`,
  };
}

function buildRecoveryMarker(feature) {
  const replay = feature.disruptionReplay;
  const status = replay.trajectory === 'recovering'
    ? 'recovering'
    : replay.trajectory === 'worsening'
      ? 'worsening'
      : 'stagnating';

  return {
    markerId: `recovery:${feature.routeId}`,
    targetType: 'route',
    targetId: feature.routeId,
    status,
    badge: status === 'recovering'
      ? 'récupération'
      : status === 'worsening'
        ? 'empire'
        : 'stagne',
    severity: replay.severity,
    summary: replay.summary,
  };
}

function buildRecoveryMarkers(cityFeatures, resourceFeatures, logisticsFeatures) {
  const routeMarkers = logisticsFeatures.map(buildRecoveryMarker);
  const cityMarkers = cityFeatures
    .filter((city) => ['critical', 'high', 'medium', 'positive'].includes(city.decisionCue.intensity))
    .map((city) => ({
      markerId: `recovery:${city.cityId}`,
      targetType: 'city',
      targetId: city.cityId,
      status: city.decisionCue.intensity === 'positive' ? 'recovering' : 'stagnating',
      badge: city.decisionCue.intensity === 'positive' ? 'ressource utile' : 'à surveiller',
      severity: city.decisionCue.intensity === 'critical' ? 'major' : 'minor',
      summary: city.decisionCue.reason,
    }));
  const resourceMarkers = resourceFeatures
    .filter((resource) => resource.intensity !== 'available')
    .map((resource) => ({
      markerId: `recovery:resource:${resource.resourceId}:${resource.cityId}`,
      targetType: 'resource',
      targetId: `${resource.cityId}:${resource.resourceId}`,
      status: resource.intensity === 'abundant' ? 'recovering' : 'worsening',
      badge: resource.intensity === 'abundant' ? 'stock rétabli' : 'stock vide',
      severity: resource.intensity === 'empty' ? 'major' : 'minor',
      summary: `${resource.cityName}: ${resource.label}.`,
    }));

  return [...routeMarkers, ...cityMarkers, ...resourceMarkers]
    .sort((left, right) => {
      const statusRank = { worsening: 0, stagnating: 1, recovering: 2 };
      const severityRank = { major: 0, moderate: 1, minor: 2 };

      return statusRank[left.status] - statusRank[right.status]
        || severityRank[left.severity] - severityRank[right.severity]
        || left.markerId.localeCompare(right.markerId);
    });
}


function buildLogisticsRecoveryPlanner(routeFeature, cityFeatures, resourceFeatures) {
  const dependentCities = cityFeatures
    .filter((city) => routeFeature.cityIds.includes(city.cityId))
    .sort((left, right) => left.cityId.localeCompare(right.cityId));
  const dependentResources = resourceFeatures
    .filter((resource) => routeFeature.cityIds.includes(resource.cityId))
    .filter((resource) => routeFeature.bottleneckResourceId === null || resource.resourceId === routeFeature.bottleneckResourceId)
    .sort((left, right) => left.resourceId.localeCompare(right.resourceId) || left.cityId.localeCompare(right.cityId));
  const impactedCityIds = dependentCities.map((city) => city.cityId);
  const impactedResourceIds = [...new Set(dependentResources.map((resource) => resource.resourceId))];
  const bottleneckLabel = routeFeature.bottleneckResourceId ?? 'flux principal';
  const severityScore = { major: 3, moderate: 2, minor: 1 }[routeFeature.disruptionReplay.severity] ?? 1;
  const cityPressure = dependentCities.filter((city) => ['critical', 'high', 'medium'].includes(city.decisionCue.intensity)).length;
  const emptyStockPressure = dependentResources.filter((resource) => resource.intensity === 'empty').length;

  const options = [
    {
      id: `recovery:${routeFeature.routeId}:repair`,
      action: 'repair',
      label: 'Réparer la route',
      badge: 'plan:réparer',
      relativeCost: routeFeature.disruptionReplay.severity === 'major' ? 'élevé' : 'moyen',
      costScore: routeFeature.disruptionReplay.severity === 'major' ? 3 : 2,
      estimatedDelayTurns: routeFeature.active ? 2 : 3,
      reDisruptionRisk: routeFeature.riskLevel >= 60 ? 'high' : routeFeature.riskLevel >= 35 ? 'medium' : 'low',
      impact: `Restaure la capacité de ${routeFeature.label} pour ${impactedCityIds.length || 'les'} villes dépendantes.`,
      impactScore: routeFeature.totalCapacity + severityScore + cityPressure,
      affectedCityIds: impactedCityIds,
      affectedResourceIds: impactedResourceIds,
      reason: 'Réduit durablement la cause visible du replay sans changer les badges de récupération.',
    },
    {
      id: `recovery:${routeFeature.routeId}:reroute`,
      action: 'reroute',
      label: 'Rerouter temporairement',
      badge: 'plan:rerouter',
      relativeCost: 'moyen',
      costScore: 2,
      estimatedDelayTurns: 1,
      reDisruptionRisk: routeFeature.riskLevel >= 50 ? 'medium' : 'low',
      impact: `Contourne ${bottleneckLabel} pour garder un flux minimal vers ${impactedCityIds.length || 'les'} villes liées.`,
      impactScore: Math.max(2, Math.ceil(routeFeature.totalCapacity / 2) + cityPressure + emptyStockPressure),
      affectedCityIds: impactedCityIds,
      affectedResourceIds: impactedResourceIds,
      reason: 'Option rapide si la réparation immobilise trop longtemps la route.',
    },
    {
      id: `recovery:${routeFeature.routeId}:prioritize-stock`,
      action: 'prioritize-stock',
      label: 'Prioriser convoi/stock',
      badge: 'plan:priorité',
      relativeCost: routeFeature.bottleneckResourceId === null ? 'faible' : 'moyen',
      costScore: routeFeature.bottleneckResourceId === null ? 1 : 2,
      estimatedDelayTurns: 0,
      reDisruptionRisk: emptyStockPressure > 0 ? 'high' : routeFeature.riskLevel >= 45 ? 'medium' : 'low',
      impact: `Protège immédiatement ${bottleneckLabel} avec les stocks et convois visibles.`,
      impactScore: Math.max(1, severityScore + emptyStockPressure + getIntensityScore(routeFeature.decisionCue.intensity)),
      affectedCityIds: impactedCityIds,
      affectedResourceIds: impactedResourceIds,
      reason: 'Action immédiate issue du stress et de la priorité déjà visibles.',
    },
  ].map((option) => {
    const riskPenalty = { high: 2, medium: 1, low: 0 }[option.reDisruptionRisk] ?? 1;

    return {
      ...option,
      score: option.impactScore - option.costScore - option.estimatedDelayTurns - riskPenalty,
    };
  }).sort((left, right) => right.score - left.score
    || right.impactScore - left.impactScore
    || left.estimatedDelayTurns - right.estimatedDelayTurns
    || left.id.localeCompare(right.id));

  return {
    id: `recovery-planner:${routeFeature.routeId}`,
    targetType: 'route',
    targetId: routeFeature.routeId,
    basedOnReplayId: routeFeature.disruptionReplay.id,
    summary: `${routeFeature.label}: ${options[0].label} recommandé après ${routeFeature.disruptionReplay.cause}.`,
    dataCompleteness: impactedCityIds.length === 0
      ? 'partial'
      : impactedResourceIds.length === 0
        ? 'route-only'
        : 'complete',
    recommendedOptionId: options[0].id,
    recommendationReason: options[0].reason,
    options: options.map((option, index) => ({
      ...option,
      recommended: index === 0,
      rank: index + 1,
    })),
  };
}


function buildRecoveryCheckpoints(routeFeature) {
  const planner = routeFeature.recoveryPlanner;
  const chosenOption = planner.options.find((option) => option.id === planner.recommendedOptionId) ?? planner.options[0];
  const hasResidualRisk = chosenOption.reDisruptionRisk !== 'low' || routeFeature.riskLevel >= 35;
  const hasNewBottleneck = routeFeature.bottleneckResourceId !== null;
  const capacityPartial = routeFeature.capacityRemaining > 0 && routeFeature.capacityRemaining < routeFeature.totalCapacity;
  const stableReturn = routeFeature.disruptionReplay.trajectory === 'recovering' && !hasResidualRisk && !hasNewBottleneck;
  const baseSignals = [
    ...(chosenOption.estimatedDelayTurns > 1 ? ['délai'] : []),
    ...(hasNewBottleneck ? ['nouveau goulot'] : []),
    ...(chosenOption.reDisruptionRisk === 'high' ? ['re-perturbation'] : []),
    ...(chosenOption.affectedResourceIds.length === 0 ? ['stock insuffisant'] : []),
  ];

  const checkpoints = [
    {
      id: `${planner.id}:repair-started`,
      stage: 'repair-started',
      label: 'Réparation lancée',
      status: chosenOption.estimatedDelayTurns === 0 ? 'complete' : 'in-progress',
      expectedTurn: 0,
      linkedOptionId: chosenOption.id,
      signal: chosenOption.action === 'prioritize-stock' ? 'priorité engagée' : 'ordre engagé',
      detail: `${chosenOption.label}: coût ${chosenOption.relativeCost}, délai ${chosenOption.estimatedDelayTurns} tour(s).`,
    },
    {
      id: `${planner.id}:partial-capacity`,
      stage: 'partial-capacity',
      label: 'Capacité partielle',
      status: capacityPartial || routeFeature.capacityRemaining > 0 ? 'in-progress' : 'blocked',
      expectedTurn: Math.max(1, Math.min(2, chosenOption.estimatedDelayTurns || 1)),
      linkedOptionId: chosenOption.id,
      signal: capacityPartial ? 'capacité partielle' : 'capacité à confirmer',
      detail: `${routeFeature.capacityRemaining}/${routeFeature.totalCapacity} capacité restante visible après replay.`,
    },
    {
      id: `${planner.id}:residual-risk`,
      stage: 'residual-risk',
      label: 'Risque résiduel',
      status: hasResidualRisk || hasNewBottleneck ? 'watch' : 'complete',
      expectedTurn: Math.max(1, chosenOption.estimatedDelayTurns),
      linkedOptionId: chosenOption.id,
      signal: hasNewBottleneck ? `surveiller ${routeFeature.bottleneckResourceId}` : `risque ${chosenOption.reDisruptionRisk}`,
      detail: hasResidualRisk
        ? `Risque de re-perturbation ${chosenOption.reDisruptionRisk}; revoir si ${baseSignals.join(', ') || 'le stress remonte'}.`
        : 'Risque résiduel bas avec les données visibles.',
    },
    {
      id: `${planner.id}:stable-return`,
      stage: 'stable-return',
      label: 'Retour stable',
      status: stableReturn ? 'complete' : routeFeature.disruptionReplay.trajectory === 'worsening' ? 'revise' : 'pending',
      expectedTurn: chosenOption.estimatedDelayTurns + 1,
      linkedOptionId: chosenOption.id,
      signal: stableReturn ? 'stable' : routeFeature.disruptionReplay.trajectory === 'worsening' ? 'échec' : 'à confirmer',
      detail: stableReturn
        ? `${routeFeature.label} peut revenir en flux stable.`
        : `${routeFeature.label} doit être révisée si le replay reste ${routeFeature.disruptionReplay.trajectory}.`,
    },
  ];

  const blockingSignals = checkpoints
    .filter((checkpoint) => ['blocked', 'watch', 'revise'].includes(checkpoint.status))
    .map((checkpoint) => checkpoint.signal);

  return {
    id: `recovery-checkpoints:${routeFeature.routeId}`,
    targetType: 'route',
    targetId: routeFeature.routeId,
    linkedPlannerId: planner.id,
    linkedOptionId: chosenOption.id,
    status: checkpoints.some((checkpoint) => checkpoint.status === 'revise')
      ? 'needs-revision'
      : checkpoints.some((checkpoint) => checkpoint.status === 'blocked')
        ? 'blocked'
        : checkpoints.some((checkpoint) => checkpoint.status === 'watch')
          ? 'stagnating'
          : checkpoints.every((checkpoint) => checkpoint.status === 'complete')
            ? 'progressing'
            : 'progressing',
    summary: `${routeFeature.label}: checkpoints liés à ${chosenOption.label}.`,
    blockingSignals,
    dataCompleteness: planner.dataCompleteness,
    checkpoints,
  };
}


function classifyRecoveryRisk(checkpoints) {
  if (checkpoints.status === 'needs-revision') {
    return 'échec probable';
  }

  if (checkpoints.status === 'blocked') {
    return 'révision conseillée';
  }

  if (checkpoints.status === 'stagnating' || checkpoints.blockingSignals.length > 0) {
    return 'à surveiller';
  }

  return 'stable';
}

function getRecoveryCause(checkpoints, routeFeature) {
  const signals = checkpoints.blockingSignals.join(' ').toLowerCase();

  if (signals.includes('délai')) {
    return 'délai';
  }

  if (signals.includes('goulot') || signals.includes('surveiller')) {
    return 'goulot persistant';
  }

  if (signals.includes('stock')) {
    return 'stock insuffisant';
  }

  if (signals.includes('re-perturbation') || routeFeature.recoveryPlanner.options[0]?.reDisruptionRisk === 'high') {
    return 're-perturbation';
  }

  return checkpoints.dataCompleteness === 'complete' ? 'dépendance externe' : 'données partielles';
}

function getRecoveryAction(classification, cause, routeFeature) {
  if (classification === 'stable') {
    return 'continuer';
  }

  if (cause === 'goulot persistant') {
    return routeFeature.bottleneckResourceId === null ? 'renforcer' : 'prioriser stock';
  }

  if (cause === 'stock insuffisant') {
    return 'prioriser stock';
  }

  if (cause === 'délai' || cause === 're-perturbation') {
    return 'rerouter';
  }

  if (classification === 'échec probable') {
    return 'abandonner temporairement';
  }

  return 'renforcer';
}

function buildAtRiskRecoverySummary(logisticsFeatures) {
  const entries = logisticsFeatures.map((feature) => {
    const checkpoints = feature.recoveryCheckpoints;
    const classification = classifyRecoveryRisk(checkpoints);
    const cause = getRecoveryCause(checkpoints, feature);
    const action = getRecoveryAction(classification, cause, feature);
    const watchCheckpoint = checkpoints.checkpoints.find((checkpoint) => ['blocked', 'watch', 'revise'].includes(checkpoint.status))
      ?? checkpoints.checkpoints.at(-1);

    return {
      id: `recovery-risk:${feature.routeId}`,
      targetType: 'route',
      targetId: feature.routeId,
      label: feature.label,
      classification,
      cause,
      action,
      linkedCheckpointId: watchCheckpoint?.id ?? null,
      linkedPlannerId: checkpoints.linkedPlannerId,
      linkedOptionId: checkpoints.linkedOptionId,
      severity: classification === 'échec probable'
        ? 'critical'
        : classification === 'révision conseillée'
          ? 'high'
          : classification === 'à surveiller'
            ? 'medium'
            : 'low',
      reason: classification === 'stable'
        ? `${feature.label}: reprise stable, continuer le plan choisi.`
        : `${feature.label}: ${classification} à cause de ${cause}; action courte: ${action}.`,
    };
  }).sort((left, right) => {
    const rank = { critical: 0, high: 1, medium: 2, low: 3 };

    return rank[left.severity] - rank[right.severity]
      || left.label.localeCompare(right.label);
  });
  const riskyEntries = entries.filter((entry) => entry.classification !== 'stable');

  return {
    id: 'logistics-recovery-risk-summary',
    title: 'Synthèse reprises logistiques à risque',
    summary: riskyEntries.length === 0
      ? 'Toutes les reprises logistiques suivent le plan visible.'
      : `${riskyEntries.length} reprise(s) demandent une décision après checkpoints.`,
    entries,
    atRiskCount: riskyEntries.length,
    recommendedEntryId: riskyEntries[0]?.id ?? entries[0]?.id ?? null,
    legend: [
      { key: 'stable', label: 'Stable', tone: 'positive' },
      { key: 'à surveiller', label: 'À surveiller', tone: 'warning' },
      { key: 'révision conseillée', label: 'Révision conseillée', tone: 'danger' },
      { key: 'échec probable', label: 'Échec probable', tone: 'critical' },
    ],
  };
}


function getRecoveryBudgetCost(entry, routeFeature) {
  const option = routeFeature.recoveryPlanner.options.find((candidate) => candidate.id === entry.linkedOptionId)
    ?? routeFeature.recoveryPlanner.options[0];
  const base = Math.max(1, option?.costScore ?? 1);

  if (entry.action === 'prioriser stock') {
    return { stock: base + 1, convoy: 1, labor: 0, routeTime: option?.estimatedDelayTurns ?? 0, portCapacity: 0, relay: 0 };
  }

  if (entry.action === 'rerouter') {
    return { stock: 0, convoy: base, labor: 1, routeTime: Math.max(1, option?.estimatedDelayTurns ?? 1), portCapacity: routeFeature.transportMode === 'sea' ? 1 : 0, relay: 1 };
  }

  if (entry.action === 'abandonner temporairement') {
    return { stock: 0, convoy: 0, labor: 0, routeTime: 0, portCapacity: 0, relay: 0 };
  }

  if (entry.action === 'renforcer') {
    return { stock: 1, convoy: 1, labor: base, routeTime: option?.estimatedDelayTurns ?? 1, portCapacity: routeFeature.transportMode === 'sea' ? 1 : 0, relay: 1 };
  }

  return { stock: 0, convoy: 1, labor: 0, routeTime: 0, portCapacity: 0, relay: 0 };
}

function getRecoveryBudgetGroup(cost, available, entry) {
  const over = Object.entries(cost).filter(([key, value]) => value > (available[key] ?? 0));
  const totalCost = Object.values(cost).reduce((sum, value) => sum + value, 0);

  if (entry.classification === 'stable') {
    return 'faisable maintenant';
  }

  if (over.length === 0 && totalCost <= 4) {
    return 'faisable maintenant';
  }

  if (over.some(([key]) => ['stock', 'convoy', 'labor'].includes(key))) {
    return 'nécessite renfort';
  }

  if (totalCost > 6 || over.some(([key]) => ['routeTime', 'relay'].includes(key))) {
    return 'à séquencer';
  }

  return 'à reporter';
}

function buildRecoveryCapacityBudget(logisticsFeatures, atRiskRecoverySummary) {
  const available = logisticsFeatures.reduce((totals, feature) => ({
    stock: totals.stock + Math.max(0, feature.capacityRemaining),
    convoy: totals.convoy + (feature.priorityBadge.recommendedFilter === 'convoy-priority' ? 1 : 0),
    labor: totals.labor + (feature.disruptionReplay.severity === 'major' ? 1 : 2),
    routeTime: totals.routeTime + Math.max(1, Math.ceil(feature.totalCapacity / 4)),
    portCapacity: totals.portCapacity + (feature.transportMode === 'sea' ? 1 : 0),
    relay: totals.relay + (feature.active ? 1 : 0),
  }), { stock: 0, convoy: 0, labor: 0, routeTime: 0, portCapacity: 0, relay: 0 });
  const entries = atRiskRecoverySummary.entries.map((entry) => {
    const routeFeature = logisticsFeatures.find((feature) => feature.routeId === entry.targetId);
    const cost = routeFeature === undefined
      ? { stock: 0, convoy: 0, labor: 0, routeTime: 0, portCapacity: 0, relay: 0 }
      : getRecoveryBudgetCost(entry, routeFeature);
    const overloads = Object.entries(cost)
      .filter(([key, value]) => value > (available[key] ?? 0))
      .map(([key, value]) => ({
        resource: key,
        required: value,
        available: available[key] ?? 0,
        overBy: value - (available[key] ?? 0),
      }));

    return {
      id: `recovery-budget:${entry.targetId}`,
      targetId: entry.targetId,
      linkedRiskEntryId: entry.id,
      linkedCheckpointId: entry.linkedCheckpointId,
      linkedOptionId: entry.linkedOptionId,
      action: entry.action,
      group: getRecoveryBudgetGroup(cost, available, entry),
      cost,
      overloads,
      cannibalizes: overloads.length > 0
        ? atRiskRecoverySummary.entries.filter((candidate) => candidate.id !== entry.id).map((candidate) => candidate.id)
        : [],
      summary: overloads.length === 0
        ? `${entry.label}: ${entry.action} tient dans le budget visible.`
        : `${entry.label}: ${entry.action} dépasse ${overloads.map((overload) => overload.resource).join(', ')}.`,
    };
  }).sort((left, right) => {
    const rank = { 'nécessite renfort': 0, 'à séquencer': 1, 'à reporter': 2, 'faisable maintenant': 3 };

    return rank[left.group] - rank[right.group]
      || left.id.localeCompare(right.id);
  });
  const totals = entries.reduce((sum, entry) => ({
    stock: sum.stock + entry.cost.stock,
    convoy: sum.convoy + entry.cost.convoy,
    labor: sum.labor + entry.cost.labor,
    routeTime: sum.routeTime + entry.cost.routeTime,
    portCapacity: sum.portCapacity + entry.cost.portCapacity,
    relay: sum.relay + entry.cost.relay,
  }), { stock: 0, convoy: 0, labor: 0, routeTime: 0, portCapacity: 0, relay: 0 });
  const totalOverloads = Object.entries(totals)
    .filter(([key, value]) => value > (available[key] ?? 0))
    .map(([key, value]) => ({ resource: key, required: value, available: available[key] ?? 0, overBy: value - (available[key] ?? 0) }));

  return {
    id: 'logistics-recovery-capacity-budget',
    title: 'Budget capacité reprises logistiques',
    summary: entries.length === 0
      ? 'Aucune reprise à budgéter avec les données actuelles.'
      : totalOverloads.length === 0
        ? `${entries.length} reprise(s) tiennent dans la capacité visible.`
        : `${entries.length} reprise(s), ${totalOverloads.length} dépassement(s) de capacité à arbitrer.`,
    available,
    totals,
    totalOverloads,
    entries,
    groups: [
      { key: 'faisable maintenant', label: 'Faisable maintenant' },
      { key: 'nécessite renfort', label: 'Nécessite renfort' },
      { key: 'à séquencer', label: 'À séquencer' },
      { key: 'à reporter', label: 'À reporter' },
    ],
  };
}

function buildDecisionLegend() {
  return [
    { key: 'critical', label: 'Priorité critique: manque ou saturation immédiate', tone: 'danger' },
    { key: 'high', label: 'Priorité haute: ville isolée ou goulet serré', tone: 'warning' },
    { key: 'medium', label: 'Tension à surveiller: risque ou stabilité fragile', tone: 'caution' },
    { key: 'low', label: 'Marge lisible: route ou stock encore exploitable', tone: 'neutral' },
    { key: 'positive', label: 'Surplus utile: peut soutenir une décision', tone: 'positive' },
    { key: 'muted', label: 'Inactif: signal conservé sans priorité', tone: 'muted' },
  ];
}

function buildEconomyMapLayers(cityOverlays, routeOverlays) {
  const logisticsFeatures = routeOverlays.map((route) => {
    const decisionCue = buildRouteDecisionCue(route);
    const whatIfOptions = buildRouteWhatIfOptions(route, decisionCue);
    const priorityBadge = buildRoutePriorityBadge(route, decisionCue, whatIfOptions);
    const baseFeature = {
      featureId: route.overlayId,
      routeId: route.routeId,
      label: route.label,
      cityIds: [...route.cityIds],
      active: route.active,
      transportMode: route.transportMode,
      riskLevel: route.riskLevel,
      totalCapacity: route.totalCapacity,
      capacityRemaining: route.capacitySpendPreview.capacityRemaining,
      state: route.capacitySpendPreview.state,
      bottleneckResourceId: route.capacitySpendPreview.nextBottleneck?.resourceId ?? null,
      bottleneckIntensity: decisionCue.intensity,
      decisionCue,
      tooltip: decisionCue.tooltip,
      whatIfOptions,
      priorityBadge,
      style: { ...route.style },
    };

    return {
      ...baseFeature,
      disruptionReplay: buildRouteDisruptionReplay({
        ...baseFeature,
        nextBottleneck: route.capacitySpendPreview.nextBottleneck,
      }, decisionCue, priorityBadge),
    };
  });
  const cityFeatures = cityOverlays.map((city) => {
    const decisionCue = buildCityDecisionCue(city);

    return {
      featureId: city.overlayId,
      cityId: city.cityId,
      label: city.label,
      regionId: city.regionId,
      position: city.marker.position,
      marker: { ...city.marker },
      capital: city.capital,
      prosperity: city.prosperity,
      stability: city.stability,
      decisionCue,
      tooltip: decisionCue.tooltip,
    };
  });
  const resourceLayer = buildResourceLayer(cityOverlays);
  const logisticsFeaturesWithPlanners = logisticsFeatures.map((feature) => {
    const recoveryPlanner = buildLogisticsRecoveryPlanner(feature, cityFeatures, resourceLayer.features);
    const featureWithPlanner = {
      ...feature,
      recoveryPlanner,
    };

    return {
      ...featureWithPlanner,
      recoveryCheckpoints: buildRecoveryCheckpoints(featureWithPlanner),
    };
  });
  const atRiskRecoverySummary = buildAtRiskRecoverySummary(logisticsFeaturesWithPlanners);

  return {
    cities: {
      id: 'cities',
      title: 'Villes',
      visibleByDefault: true,
      features: cityFeatures,
      legend: [
        { key: 'positive', label: 'Prospérité élevée', tone: 'positive' },
        { key: 'warning', label: 'Stabilité fragile', tone: 'warning' },
        { key: 'neutral', label: 'Ville stable', tone: 'neutral' },
      ],
    },
    resources: resourceLayer,
    logistics: {
      id: 'logistics',
      title: 'Routes logistiques',
      visibleByDefault: true,
      features: logisticsFeaturesWithPlanners,
      stressFilters: buildRouteStressFilters(logisticsFeaturesWithPlanners),
      recoveryMarkers: buildRecoveryMarkers(cityFeatures, resourceLayer.features, logisticsFeaturesWithPlanners),
      atRiskRecoverySummary,
      recoveryCapacityBudget: buildRecoveryCapacityBudget(logisticsFeaturesWithPlanners, atRiskRecoverySummary),
      recoveryPlannerLegend: [
        { key: 'repair', label: 'Réparer', tone: 'stable' },
        { key: 'reroute', label: 'Rerouter', tone: 'caution' },
        { key: 'prioritize-stock', label: 'Prioriser convoi/stock', tone: 'positive' },
      ],
      recoveryCheckpointLegend: [
        { key: 'repair-started', label: 'Réparation lancée', tone: 'neutral' },
        { key: 'partial-capacity', label: 'Capacité partielle', tone: 'caution' },
        { key: 'residual-risk', label: 'Risque résiduel', tone: 'warning' },
        { key: 'stable-return', label: 'Retour stable', tone: 'positive' },
      ],
      replayLegend: [
        { key: 'recovering', label: 'Récupère', tone: 'positive' },
        { key: 'stagnating', label: 'Stagne', tone: 'warning' },
        { key: 'worsening', label: 'Empire', tone: 'danger' },
      ],
      legend: [
        { key: 'critical', label: 'Goulet saturé: aucune marge restante', tone: 'danger' },
        { key: 'high', label: 'Goulet serré: une marge ou moins', tone: 'warning' },
        { key: 'medium', label: 'Risque logistique élevé', tone: 'caution' },
        { key: 'remaining-margin', label: 'Marge de capacité restante', tone: 'positive' },
        { key: 'fully-spent', label: 'Capacité mobilisée', tone: 'warning' },
        { key: 'no-spend', label: 'Aucune dépense prévue', tone: 'neutral' },
      ],
    },
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

  const layers = buildEconomyMapLayers(cityOverlays, routeOverlays);

  return {
    title: 'Carte économie et logistique',
    summary: `${cityOverlays.length} villes, ${routeOverlays.length} routes logistiques`,
    cities: cityOverlays,
    routes: routeOverlays,
    layers,
    decisionLegend: buildDecisionLegend(),
    interventionComparison: buildInterventionComparison(cityOverlays, layers),
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
