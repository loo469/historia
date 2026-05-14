import { Culture } from '../../domain/culture/Culture.js';
import { HistoricalEvent } from '../../domain/culture/HistoricalEvent.js';
import { ResearchState } from '../../domain/culture/ResearchState.js';

const DEFAULT_STYLE_BY_MARKER_TYPE = Object.freeze({
  innovation: { color: 'violet', icon: '✦', emphasis: 'high', accent: 'iris', labelTone: 'visionary' },
  balanced: { color: 'teal', icon: '◆', emphasis: 'normal', accent: 'seafoam', labelTone: 'measured' },
  traditional: { color: 'amber', icon: '⬢', emphasis: 'normal', accent: 'ochre', labelTone: 'ancestral' },
  fragmented: { color: 'crimson', icon: '✕', emphasis: 'high', accent: 'ember', labelTone: 'volatile' },
  default: { color: 'slate', icon: '•', emphasis: 'normal', accent: 'mist', labelTone: 'neutral' },
});

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

function normalizeTextArray(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return [...new Set(values.map((value) => requireText(value, label)))].sort();
}

function normalizeCulture(culture) {
  if (culture instanceof Culture) {
    return culture;
  }

  if (culture === null || typeof culture !== 'object' || Array.isArray(culture)) {
    throw new TypeError('CultureMapOverlay cultures must be Culture instances or plain objects.');
  }

  return new Culture(culture);
}

function normalizeResearchState(researchState) {
  if (researchState instanceof ResearchState) {
    return researchState;
  }

  if (researchState === null || typeof researchState !== 'object' || Array.isArray(researchState)) {
    throw new TypeError('CultureMapOverlay researchStates must be ResearchState instances or plain objects.');
  }

  return new ResearchState(researchState);
}

function normalizeHistoricalEvent(historicalEvent) {
  if (historicalEvent instanceof HistoricalEvent) {
    return historicalEvent;
  }

  if (historicalEvent === null || typeof historicalEvent !== 'object' || Array.isArray(historicalEvent)) {
    throw new TypeError('CultureMapOverlay historicalEvents must be HistoricalEvent instances or plain objects.');
  }

  return new HistoricalEvent(historicalEvent);
}

function normalizeRegionIdsByCulture(options) {
  const rawRegionIdsByCulture = requireObject(
    options.regionIdsByCulture ?? {},
    'CultureMapOverlay regionIdsByCulture',
  );

  return Object.fromEntries(
    Object.entries(rawRegionIdsByCulture)
      .map(([cultureId, regionIds]) => [
        requireText(cultureId, 'CultureMapOverlay regionIdsByCulture cultureId'),
        normalizeTextArray(regionIds, `CultureMapOverlay regionIdsByCulture.${cultureId}`),
      ])
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function normalizeStyle(styleByMarkerType, markerType) {
  const style = styleByMarkerType[markerType] ?? styleByMarkerType.default ?? DEFAULT_STYLE_BY_MARKER_TYPE.default;

  return {
    color: String(style.color ?? DEFAULT_STYLE_BY_MARKER_TYPE[markerType]?.color ?? 'slate').trim() || 'slate',
    icon: String(style.icon ?? DEFAULT_STYLE_BY_MARKER_TYPE[markerType]?.icon ?? '•').trim() || '•',
    emphasis: String(style.emphasis ?? DEFAULT_STYLE_BY_MARKER_TYPE[markerType]?.emphasis ?? 'normal').trim() || 'normal',
    accent: String(style.accent ?? DEFAULT_STYLE_BY_MARKER_TYPE[markerType]?.accent ?? 'mist').trim() || 'mist',
    labelTone: String(style.labelTone ?? DEFAULT_STYLE_BY_MARKER_TYPE[markerType]?.labelTone ?? 'neutral').trim() || 'neutral',
  };
}

function buildMarkerType(culture) {
  if (culture.cohesion <= 30) {
    return 'fragmented';
  }

  if (culture.openness >= 60 && culture.researchDrive >= 60) {
    return 'innovation';
  }

  if (culture.openness <= 40 && culture.cohesion >= 60) {
    return 'traditional';
  }

  return 'balanced';
}

function clampScore(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildInfluenceScore(culture, signals) {
  return clampScore(
    (culture.openness * 0.2)
    + (culture.cohesion * 0.3)
    + (culture.researchDrive * 0.3)
    + (signals.highlightedDiscoveries.length * 6)
    + (signals.eventCount * 5)
  );
}

function buildInfluenceTier(influenceScore) {
  if (influenceScore >= 85) {
    return 'dominant';
  }

  if (influenceScore >= 65) {
    return 'strong';
  }

  if (influenceScore >= 40) {
    return 'emerging';
  }

  return 'faint';
}

function buildZoneStyle(markerType, influenceTier, style, zoneBand) {
  const opacityByTier = {
    dominant: 0.85,
    strong: 0.7,
    emerging: 0.55,
    faint: 0.35,
  };
  const strokeWidthByBand = {
    core: 4,
    inner: 3,
    outer: 2,
  };
  const glowByMarkerType = {
    innovation: 'luminous',
    balanced: 'soft',
    traditional: 'matte',
    fragmented: 'sparking',
  };

  return {
    fill: style.color,
    outline: style.color,
    accent: style.accent,
    markerIcon: style.icon,
    emphasis: style.emphasis,
    labelTone: style.labelTone,
    opacity: opacityByTier[influenceTier] ?? 0.35,
    pattern: markerType === 'traditional'
      ? 'woven'
      : markerType === 'fragmented'
        ? 'fractured'
        : markerType === 'innovation'
          ? 'radiant'
          : 'solid',
    surface: markerType === 'innovation'
      ? 'gloss'
      : markerType === 'traditional'
        ? 'grain'
        : markerType === 'fragmented'
          ? 'shattered'
          : 'matte',
    glow: glowByMarkerType[markerType] ?? 'soft',
    blendMode: zoneBand === 'core' ? 'source-over' : 'multiply',
    strokeWidth: strokeWidthByBand[zoneBand] ?? 2,
  };
}

function summarizeSignals(culture, researchStates, historicalEvents) {
  const discoveredConceptIds = new Set();
  const unlockedResearchIds = new Set();
  let activeResearchCount = 0;

  for (const researchState of researchStates) {
    for (const conceptId of researchState.discoveredConceptIds) {
      discoveredConceptIds.add(conceptId);
    }

    if (researchState.status === 'active') {
      activeResearchCount += 1;
    }

    if (researchState.status === 'completed' || researchState.status === 'active') {
      unlockedResearchIds.add(researchState.topicId);
    }
  }

  const orderedHistoricalEvents = historicalEvents
    .slice()
    .sort((left, right) => left.triggeredAt.getTime() - right.triggeredAt.getTime() || left.title.localeCompare(right.title));
  const eventIds = orderedHistoricalEvents.map((historicalEvent) => historicalEvent.id);
  const highlightedDiscoveries = [...new Set([
    ...[...discoveredConceptIds],
    ...orderedHistoricalEvents.flatMap((historicalEvent) => historicalEvent.discoveryIds),
  ])].sort();

  return {
    discoveredConceptIds: [...discoveredConceptIds].sort(),
    unlockedResearchIds: [...unlockedResearchIds].sort(),
    highlightedDiscoveries,
    activeResearchCount,
    eventIds,
    eventCount: eventIds.length,
    identityTags: [...new Set([...culture.valueIds, ...culture.traditionIds])].sort(),
    orderedHistoricalEvents,
  };
}

function buildRegionPresenceMap(cultures, regionIdsByCulture, cultureSignalsById) {
  const regionPresence = new Map();

  for (const culture of cultures) {
    const regionIds = regionIdsByCulture[culture.id] ?? [];
    const influenceScore = cultureSignalsById.get(culture.id)?.influenceScore ?? 0;

    for (const regionId of regionIds) {
      if (!regionPresence.has(regionId)) {
        regionPresence.set(regionId, []);
      }

      regionPresence.get(regionId).push({
        cultureId: culture.id,
        cultureName: culture.name,
        influenceScore,
      });
    }
  }

  for (const entries of regionPresence.values()) {
    entries.sort((left, right) => right.influenceScore - left.influenceScore || left.cultureId.localeCompare(right.cultureId));
  }

  return regionPresence;
}

function buildZoneBand(index, total) {
  if (index === 0) {
    return 'core';
  }

  if (index === total - 1) {
    return 'outer';
  }

  return 'inner';
}

function buildZoneContour(influenceTier, overlapCount, zoneRank) {
  const radiusByTier = {
    dominant: 26,
    strong: 22,
    emerging: 18,
    faint: 14,
  };
  const baseRadius = radiusByTier[influenceTier] ?? 14;

  return {
    radius: Math.max(8, baseRadius - (zoneRank * 3)),
    feather: overlapCount > 1 ? 4 : 2,
    ringCount: overlapCount > 1 ? Math.min(3, overlapCount) : 1,
  };
}

function buildCultureSupportBundles(culture, regionId, regionPresence, cultureState) {
  const underBorderPressure = regionPresence.some((entry) => entry.cultureId !== culture.id && entry.influenceScore >= cultureState.influenceScore);
  const needsSupport = culture.cohesion < 50
    || (culture.openness < 45 && cultureState.signals.activeResearchCount > 0)
    || (underBorderPressure && culture.cohesion < 50);

  if (!needsSupport) {
    return [];
  }

  const bundles = [];
  const hasDiscovery = cultureState.signals.highlightedDiscoveries.length > 0;
  const hasActiveResearch = cultureState.signals.activeResearchCount > 0;
  const hasEvents = cultureState.signals.eventCount > 0;
  const identityTag = cultureState.signals.identityTags[0] ?? 'identity-anchor';
  const discoveryId = cultureState.signals.highlightedDiscoveries[0] ?? 'known-discovery';
  const researchId = cultureState.signals.unlockedResearchIds[0] ?? 'research-track';
  const rivalCultureIds = regionPresence
    .filter((entry) => entry.cultureId !== culture.id)
    .map((entry) => entry.cultureId)
    .sort();

  if (culture.cohesion < 50) {
    bundles.push({
      id: `${regionId}:${culture.id}:bundle:cohesion-anchor`,
      label: 'ancrer cohésion locale',
      actionIds: [`identity:${identityTag}`, hasEvents ? 'event:mediate-public-memory' : 'ritual:local-assembly'],
      actionKeys: ['protect-identity', hasEvents ? 'mediate-event-memory' : 'local-assembly'],
      expectedBenefit: 'réduit la fragmentation visible avant soutien externe',
      tradeoff: 'cohésion + / ouverture -',
      riskReduced: 'fragmentation culturelle',
      reason: `cohésion ${culture.cohesion} · ${identityTag}`,
      priority: 4,
    });
  }

  if (culture.openness < 45 && (hasDiscovery || hasActiveResearch)) {
    bundles.push({
      id: `${regionId}:${culture.id}:bundle:guided-opening`,
      label: 'ouvrir par relais savant',
      actionIds: [`discovery:${discoveryId}`, `research:${researchId}`],
      actionKeys: ['share-discovery', 'pace-research'],
      expectedBenefit: 'garde l’ouverture lisible sans casser les repères locaux',
      tradeoff: 'ouverture + / cohésion sous surveillance',
      riskReduced: 'isolement du support',
      reason: `ouverture ${culture.openness} · ${discoveryId}`,
      priority: 3,
    });
  }

  if (rivalCultureIds.length > 0) {
    bundles.push({
      id: `${regionId}:${culture.id}:bundle:border-compromise`,
      label: 'composer avec influence voisine',
      actionIds: ['border:shared-mediation', `culture:${rivalCultureIds[0]}`],
      actionKeys: ['shared-mediation', 'limit-border-pressure'],
      expectedBenefit: 'absorbe la pression voisine sans promettre une dominance immédiate',
      tradeoff: 'ouverture + / recherche ralentie',
      riskReduced: 'pression frontalière',
      reason: `voisin ${rivalCultureIds[0]}`,
      priority: 2,
    });
  }

  return rankCultureSupportBundles(bundles).slice(0, 2);
}

function scoreCultureSupportBundle(bundle) {
  const actionScores = {
    'protect-identity': 5,
    'mediate-event-memory': 4,
    'local-assembly': 3,
    'limit-border-pressure': 3,
    'shared-mediation': 2,
    'share-discovery': 2,
    'pace-research': 1,
  };
  const tradeoffPenalty = bundle.tradeoff.includes('recherche ralentie')
    ? 2
    : bundle.tradeoff.includes('sous surveillance') || bundle.tradeoff.includes('ouverture -')
      ? 1
      : 0;

  return Math.max(0, bundle.actionKeys.reduce((total, actionKey) => total + (actionScores[actionKey] ?? 0), 0) + bundle.priority - tradeoffPenalty);
}

function buildCultureSupportBundleSafetyReason(bundle, safetyScore) {
  if (bundle.actionKeys.includes('protect-identity')) {
    return `engagement sûr: ancre identitaire d’abord · score ${safetyScore}`;
  }

  if (bundle.actionKeys.includes('limit-border-pressure')) {
    return `engagement sûr: pression frontalière bornée · score ${safetyScore}`;
  }

  if (bundle.actionKeys.includes('pace-research')) {
    return `engagement sûr: recherche cadencée avant ouverture · score ${safetyScore}`;
  }

  return `engagement sûr: actions compatibles · score ${safetyScore}`;
}

function buildCultureSupportRiskCurrentScore(culture, bundle, regionPresence, cultureState) {
  const rivalPressure = Math.max(
    0,
    ...regionPresence
      .filter((entry) => entry.cultureId !== culture.id)
      .map((entry) => entry.influenceScore - cultureState.influenceScore),
  );

  if (bundle.riskReduced === 'fragmentation culturelle') {
    return clampScore((100 - culture.cohesion) + (rivalPressure > 0 ? 8 : 0));
  }

  if (bundle.riskReduced === 'isolement du support') {
    return clampScore((100 - culture.openness) + (cultureState.signals.activeResearchCount * 5));
  }

  if (bundle.riskReduced === 'pression frontalière') {
    return clampScore(45 + rivalPressure + (regionPresence.length * 3));
  }

  return clampScore(50 - Math.min(culture.cohesion, culture.openness));
}

function buildCultureSupportRiskChangePreview(culture, bundle, regionPresence, cultureState) {
  if (!bundle) {
    return {
      status: 'neutral',
      currentRisk: 0,
      expectedRisk: 0,
      delta: 0,
      monitoredRisk: 'aucun support recommandé',
      tradeoffToWatch: 'aucun',
      reason: 'aucun bundle recommandé: stabilité suffisante',
    };
  }

  const currentRisk = buildCultureSupportRiskCurrentScore(culture, bundle, regionPresence, cultureState);
  const actionRelief = bundle.actionKeys.reduce((total, actionKey) => {
    const reliefByAction = {
      'protect-identity': 16,
      'mediate-event-memory': 10,
      'local-assembly': 8,
      'limit-border-pressure': 12,
      'shared-mediation': 8,
      'share-discovery': 7,
      'pace-research': 6,
    };

    return total + (reliefByAction[actionKey] ?? 4);
  }, 0);
  const expectedRisk = clampScore(currentRisk - actionRelief);

  return {
    status: expectedRisk < currentRisk ? 'improves' : 'steady',
    currentRisk,
    expectedRisk,
    delta: expectedRisk - currentRisk,
    monitoredRisk: bundle.riskReduced,
    tradeoffToWatch: bundle.tradeoff,
    reason: bundle.expectedBenefit,
  };
}

function buildCumulativeRiskLevel(score) {
  if (score >= 75) {
    return 'critical';
  }

  if (score >= 55) {
    return 'elevated';
  }

  if (score >= 30) {
    return 'guarded';
  }

  return 'low';
}

function buildCultureSupportCumulativeRisk(culture, regionId, riskChangePreview, regionPresence, cultureState) {
  if (riskChangePreview.status === 'neutral') {
    return {
      status: 'neutral',
      before: { score: 0, level: 'low' },
      after: { score: 0, level: 'low' },
      reducedRisk: 'aucun support recommandé',
      remainingPriority: 'aucun',
      fragileRegionId: null,
      fragileCultureId: null,
      nextAttention: 'aucune attention supplémentaire recommandée',
    };
  }

  const rivalPressure = Math.max(
    0,
    ...regionPresence
      .filter((entry) => entry.cultureId !== culture.id)
      .map((entry) => entry.influenceScore - cultureState.influenceScore),
  );
  const riskComponents = [
    {
      risk: 'fragmentation culturelle',
      score: clampScore((100 - culture.cohesion) + (rivalPressure > 0 ? 8 : 0)),
      nextAttention: 'consolider les repères locaux après le premier soutien',
    },
    {
      risk: 'isolement du support',
      score: clampScore((100 - culture.openness) + (cultureState.signals.activeResearchCount * 5)),
      nextAttention: 'surveiller les relais savants et le rythme d’ouverture',
    },
    {
      risk: 'pression frontalière',
      score: clampScore(45 + rivalPressure + (regionPresence.length > 1 ? regionPresence.length * 3 : 0)),
      nextAttention: 'suivre les compromis avec les influences voisines',
    },
  ];
  const beforeScore = Math.max(...riskComponents.map((component) => component.score));
  const afterComponents = riskComponents.map((component) => ({
    ...component,
    score: component.risk === riskChangePreview.monitoredRisk
      ? riskChangePreview.expectedRisk
      : component.score,
  }));
  const afterScore = Math.max(...afterComponents.map((component) => component.score));
  const remainingPriority = afterComponents
    .slice()
    .sort((left, right) => right.score - left.score || left.risk.localeCompare(right.risk))[0];

  return {
    status: afterScore < beforeScore ? 'improves' : 'redirects-attention',
    before: {
      score: beforeScore,
      level: buildCumulativeRiskLevel(beforeScore),
    },
    after: {
      score: afterScore,
      level: buildCumulativeRiskLevel(afterScore),
    },
    reducedRisk: riskChangePreview.monitoredRisk,
    remainingPriority: remainingPriority.risk,
    fragileRegionId: regionId,
    fragileCultureId: culture.id,
    nextAttention: remainingPriority.nextAttention,
  };
}

function rankCultureSupportBundles(bundles) {
  return bundles
    .map((bundle) => {
      const safetyScore = scoreCultureSupportBundle(bundle);

      return {
        ...bundle,
        safetyScore,
        safetyReason: buildCultureSupportBundleSafetyReason(bundle, safetyScore),
        monitoredRisk: bundle.riskReduced,
      };
    })
    .sort((left, right) => right.safetyScore - left.safetyScore || right.priority - left.priority || left.id.localeCompare(right.id))
    .map(({ priority, ...bundle }, index) => ({
      ...bundle,
      rank: index + 1,
    }));
}

function buildRecommendedFirstCultureSupportBundle(supportBundles, riskChangePreview, postBundleCumulativeRisk) {
  const firstBundle = supportBundles[0] ?? null;

  if (!firstBundle) {
    return null;
  }

  return {
    bundleId: firstBundle.id,
    label: firstBundle.label,
    safetyScore: firstBundle.safetyScore,
    reason: firstBundle.safetyReason,
    monitoredRisk: firstBundle.monitoredRisk,
    riskChangePreview,
    postBundleCumulativeRisk,
  };
}

function buildNextSafeSupportBundle(supportBundles, recommendedFirstBundle, postBundleCumulativeRisk) {
  if (!recommendedFirstBundle || postBundleCumulativeRisk.status === 'neutral') {
    return null;
  }

  const remainingCandidates = supportBundles
    .filter((bundle) => bundle.id !== recommendedFirstBundle.bundleId)
    .map((bundle) => {
      const residualMatchBonus = bundle.monitoredRisk === postBundleCumulativeRisk.remainingPriority ? 8 : 0;
      const tradeoffGuardPenalty = bundle.tradeoff.includes('recherche ralentie')
        ? 3
        : bundle.tradeoff.includes('sous surveillance') || bundle.tradeoff.includes('ouverture -')
          ? 1
          : 0;
      const residualReliefScore = Math.max(0, bundle.safetyScore + residualMatchBonus - tradeoffGuardPenalty);

      return { ...bundle, residualReliefScore, tradeoffGuardPenalty };
    })
    .filter((bundle) => bundle.residualReliefScore >= 4)
    .sort((left, right) => (
      right.residualReliefScore - left.residualReliefScore
      || right.safetyScore - left.safetyScore
      || left.id.localeCompare(right.id)
    ));

  const nextBundle = remainingCandidates[0] ?? null;

  if (!nextBundle) {
    return null;
  }

  const safetyReason = nextBundle.monitoredRisk === postBundleCumulativeRisk.remainingPriority
    ? `second soutien sûr: cible le risque résiduel ${nextBundle.monitoredRisk} · score ${nextBundle.residualReliefScore}`
    : `second soutien sûr: garde-fou compatible après ${recommendedFirstBundle.label} · score ${nextBundle.residualReliefScore}`;

  return {
    bundleId: nextBundle.id,
    label: nextBundle.label,
    residualReliefScore: nextBundle.residualReliefScore,
    reason: safetyReason,
    monitoredRisk: nextBundle.monitoredRisk,
    tradeoffToWatch: nextBundle.tradeoff,
    followsBundleId: recommendedFirstBundle.bundleId,
  };
}

function rankStabilizationDependencyRetirements(debts) {
  const urgencyWeight = { high: 3, medium: 2, low: 1 };
  const typeWeight = {
    'missing-support': 4,
    'bundle-incompatibility': 3,
    'bundle-dependency': 2,
    'fragile-culture': 1,
    'regional-mediation': 1,
  };

  return debts
    .map((debt) => {
      const blockedUntilSupport = debt.type === 'missing-support';
      const expectedGain = debt.type === 'bundle-incompatibility'
        ? 'retire un tradeoff de support qui entretient la dette de stabilisation'
        : debt.type === 'missing-support'
          ? 'débloque un second soutien sûr avant de réduire la dette restante'
          : debt.type === 'bundle-dependency'
            ? 'simplifie la séquence de soutien et clarifie la prochaine action culturelle'
            : `réduit la priorité régionale ${debt.cause.replace(/^risque restant: |^culture encore fragile: /, '')}`;

      return {
        debtId: debt.debtId,
        type: debt.type,
        cause: debt.cause,
        urgency: debt.urgency,
        nextAction: debt.nextAction,
        expectedGain,
        blockedUntilSupport,
      };
    })
    .sort((left, right) => (
      (urgencyWeight[right.urgency] ?? 0) - (urgencyWeight[left.urgency] ?? 0)
      || (typeWeight[right.type] ?? 0) - (typeWeight[left.type] ?? 0)
      || left.debtId.localeCompare(right.debtId)
    ))
    .slice(0, 3)
    .map((debt, index) => ({
      rank: index + 1,
      ...debt,
    }));
}

function buildTopRetirementReadiness(recommendedFirstRetirement, postBundleCumulativeRisk) {
  if (!recommendedFirstRetirement) {
    return {
      status: 'ready',
      blockers: [],
      nextSmallStep: 'aucune dépendance prioritaire à retirer',
    };
  }

  const blockers = [];

  if (recommendedFirstRetirement.blockedUntilSupport || recommendedFirstRetirement.type === 'missing-support') {
    blockers.push({
      blockerId: `${recommendedFirstRetirement.debtId}:support`,
      type: 'support-prerequisite',
      reason: 'support culturel préalable manquant',
      nextSmallStep: 'identifier un support compatible avant retrait',
    });
  }

  if (recommendedFirstRetirement.type === 'bundle-incompatibility' || recommendedFirstRetirement.type === 'regional-mediation') {
    blockers.push({
      blockerId: `${recommendedFirstRetirement.debtId}:timing`,
      type: 'timing-local-pressure',
      reason: postBundleCumulativeRisk.nextAttention,
      nextSmallStep: 'stabiliser la pression locale avant retrait',
    });
  }

  const limitedBlockers = blockers.slice(0, 2);

  return {
    status: limitedBlockers.length > 0 ? 'blocked' : 'ready',
    blockers: limitedBlockers,
    nextSmallStep: limitedBlockers[0]?.nextSmallStep ?? recommendedFirstRetirement.nextAction,
  };
}

function buildTopRetirementRecoveryPreview(recommendedFirstRetirement, topRetirementReadiness) {
  if (!recommendedFirstRetirement) {
    return {
      status: 'neutral',
      recoveryType: 'none',
      expectedRecovery: 'aucune récupération culturelle prioritaire',
      immediacy: 'immediate',
      closesLoop: 'aucune dépendance bloquante à lever',
    };
  }

  const recoveryType = recommendedFirstRetirement.type === 'bundle-incompatibility'
    ? 'stability'
    : recommendedFirstRetirement.type === 'missing-support'
      ? 'support'
      : recommendedFirstRetirement.type === 'bundle-dependency'
        ? 'unlock'
        : 'margin';
  const immediacy = topRetirementReadiness.status === 'blocked'
    ? 'conditional'
    : recommendedFirstRetirement.type === 'regional-mediation' || recommendedFirstRetirement.type === 'fragile-culture'
      ? 'partial'
      : 'immediate';
  const expectedRecovery = recoveryType === 'stability'
    ? 'stabilité récupérée: le tradeoff culturel cesse de nourrir la dette prioritaire'
    : recoveryType === 'support'
      ? 'soutien récupéré: un second bundle sûr peut redevenir lisible'
      : recoveryType === 'unlock'
        ? 'verrou culturel levé: la séquence de soutien devient plus simple'
        : 'marge récupérée: la pression régionale prioritaire diminue';

  return {
    status: 'preview',
    recoveryType,
    expectedRecovery,
    immediacy,
    closesLoop: `${topRetirementReadiness.nextSmallStep} → ${recommendedFirstRetirement.expectedGain}`,
  };
}

function buildNextDependencyRetirementPath(dependencyRetirementRanking, topRetirementReadiness, topRetirementRecoveryPreview) {
  const nextRetirement = dependencyRetirementRanking[1] ?? null;

  if (!nextRetirement) {
    return {
      status: 'none-safe',
      nextRetirement: null,
      recommendedRecoveryPath: topRetirementRecoveryPreview.expectedRecovery,
      mainRemainingBlocker: topRetirementReadiness.blockers[0] ? { ...topRetirementReadiness.blockers[0] } : null,
      reason: dependencyRetirementRanking.length === 0
        ? 'aucune dette culturelle restante à convertir en retrait suivant'
        : 'aucun retrait suivant sûr avant de confirmer la récupération prioritaire',
    };
  }

  return {
    status: topRetirementReadiness.status === 'blocked' ? 'conditional' : 'ready-after-recovery',
    nextRetirement: {
      debtId: nextRetirement.debtId,
      type: nextRetirement.type,
      rank: nextRetirement.rank,
      cause: nextRetirement.cause,
      expectedGain: nextRetirement.expectedGain,
    },
    recommendedRecoveryPath: topRetirementRecoveryPreview.expectedRecovery,
    mainRemainingBlocker: topRetirementReadiness.blockers[0] ? { ...topRetirementReadiness.blockers[0] } : null,
    reason: topRetirementReadiness.status === 'blocked'
      ? `lever ${topRetirementReadiness.blockers[0].type} pour rendre le retrait #${nextRetirement.rank} lisible`
      : `après récupération prioritaire, viser ${nextRetirement.cause}`,
  };
}

function buildResidualRiskAfterNextRetirement(dependencyRetirementRanking, nextDependencyRetirementPath, postBundleCumulativeRisk) {
  if (dependencyRetirementRanking.length === 0) {
    return {
      status: 'complete',
      principalResidualFragility: null,
      nextActionAfterRetirement: 'aucune action culturelle supplémentaire prioritaire',
      reason: 'aucune dette résiduelle après stabilisation',
    };
  }

  if (!nextDependencyRetirementPath.nextRetirement) {
    const topDebt = dependencyRetirementRanking[0];

    return {
      status: 'important-fragility',
      principalResidualFragility: {
        type: topDebt.type,
        cause: topDebt.cause,
        urgency: topDebt.urgency,
      },
      nextActionAfterRetirement: topDebt.nextAction,
      reason: nextDependencyRetirementPath.reason,
    };
  }

  const nextIndex = dependencyRetirementRanking.findIndex((debt) => debt.debtId === nextDependencyRetirementPath.nextRetirement.debtId);
  const remainingDebts = dependencyRetirementRanking.filter((_, index) => index > nextIndex);
  const principalResidualFragility = remainingDebts[0] ?? null;

  if (!principalResidualFragility) {
    return {
      status: 'complete',
      principalResidualFragility: null,
      nextActionAfterRetirement: 'confirmer la stabilité régionale après retrait suivant',
      reason: 'le retrait suivant absorbe la dernière dette culturelle visible',
    };
  }

  return {
    status: principalResidualFragility.urgency === 'high' ? 'important-fragility' : 'partial',
    principalResidualFragility: {
      type: principalResidualFragility.type,
      cause: principalResidualFragility.cause,
      urgency: principalResidualFragility.urgency,
    },
    nextActionAfterRetirement: principalResidualFragility.nextAction ?? postBundleCumulativeRisk.nextAttention,
    reason: principalResidualFragility.urgency === 'high'
      ? `fragilité importante restante: ${principalResidualFragility.cause}`
      : `stabilisation partielle: surveiller ${principalResidualFragility.cause}`,
  };
}

function buildResidualCultureRiskNextAction(residualRiskAfterNextRetirement) {
  const fragility = residualRiskAfterNextRetirement.principalResidualFragility;

  if (!fragility) {
    return {
      status: 'none-safe',
      actionType: 'none',
      recommendedAction: 'aucune action secondaire sûre requise',
      reason: residualRiskAfterNextRetirement.reason,
    };
  }

  const actionType = fragility.type === 'regional-mediation'
    ? 'mediation'
    : fragility.type === 'missing-support'
      ? 'local-support'
      : fragility.type === 'bundle-incompatibility'
        ? 'timing-pause'
        : fragility.type === 'bundle-dependency'
          ? 'culture-lock'
          : 'pressure-reduction';
  const recommendedAction = actionType === 'mediation'
    ? 'ouvrir une médiation locale courte après le retrait suivant'
    : actionType === 'local-support'
      ? 'préparer un support local compatible avant nouvelle réduction de dette'
      : actionType === 'timing-pause'
        ? 'marquer une pause de timing pour absorber le tradeoff culturel'
        : actionType === 'culture-lock'
          ? 'lever le verrou culturel avant de séquencer un autre soutien'
          : 'réduire la pression régionale avant d’empiler un nouveau retrait';

  return {
    status: residualRiskAfterNextRetirement.status === 'important-fragility' ? 'recommended' : 'optional',
    actionType,
    recommendedAction,
    reason: `bon second pas: ${fragility.cause} reste ${fragility.urgency}`,
  };
}

function buildStabilizationDebtSummary(status, regionId, dependencies, incompatibilities, mediationRegionIds, fragileRegionIds, postBundleCumulativeRisk) {
  const debts = [];

  dependencies.forEach((dependency) => {
    debts.push({
      debtId: `${regionId}:debt:dependency:${dependency.toBundleId ?? 'missing-support'}`,
      type: dependency.toBundleId ? 'bundle-dependency' : 'missing-support',
      cause: dependency.reason,
      urgency: dependency.toBundleId ? 'medium' : 'high',
      nextAction: dependency.toBundleId
        ? 'séquencer les supports avant tout nouveau bundle'
        : 'identifier un support culturel compatible avant relance',
    });
  });

  incompatibilities.forEach((incompatibility) => {
    debts.push({
      debtId: `${regionId}:debt:incompatibility:${incompatibility.bundleId}`,
      type: 'bundle-incompatibility',
      cause: incompatibility.tradeoff,
      urgency: status === 'future-debt' ? 'high' : 'medium',
      nextAction: incompatibility.mitigation,
    });
  });

  mediationRegionIds.forEach((mediationRegionId) => {
    debts.push({
      debtId: `${mediationRegionId}:debt:mediation:${postBundleCumulativeRisk.remainingPriority}`,
      type: 'regional-mediation',
      cause: `risque restant: ${postBundleCumulativeRisk.remainingPriority}`,
      urgency: 'medium',
      nextAction: postBundleCumulativeRisk.nextAttention,
    });
  });

  fragileRegionIds.forEach((fragileRegionId) => {
    debts.push({
      debtId: `${fragileRegionId}:debt:fragile:${postBundleCumulativeRisk.remainingPriority}`,
      type: 'fragile-culture',
      cause: `culture encore fragile: ${postBundleCumulativeRisk.remainingPriority}`,
      urgency: 'high',
      nextAction: postBundleCumulativeRisk.nextAttention,
    });
  });

  const uniqueDebts = debts
    .filter((debt, index, list) => list.findIndex((candidate) => candidate.debtId === debt.debtId) === index)
    .slice(0, 3);

  const dependencyRetirementRanking = rankStabilizationDependencyRetirements(uniqueDebts);
  const recommendedFirstRetirement = dependencyRetirementRanking[0] ? { ...dependencyRetirementRanking[0] } : null;
  const topRetirementReadiness = buildTopRetirementReadiness(recommendedFirstRetirement, postBundleCumulativeRisk);
  const topRetirementRecoveryPreview = buildTopRetirementRecoveryPreview(recommendedFirstRetirement, topRetirementReadiness);
  const nextDependencyRetirementPath = buildNextDependencyRetirementPath(dependencyRetirementRanking, topRetirementReadiness, topRetirementRecoveryPreview);
  const residualRiskAfterNextRetirement = buildResidualRiskAfterNextRetirement(dependencyRetirementRanking, nextDependencyRetirementPath, postBundleCumulativeRisk);

  return {
    status: uniqueDebts.length > 0 ? 'open' : 'neutral',
    count: uniqueDebts.length,
    debts: uniqueDebts,
    dependencyRetirementRanking,
    recommendedFirstRetirement,
    topRetirementReadiness,
    topRetirementRecoveryPreview,
    nextDependencyRetirementPath,
    residualRiskAfterNextRetirement,
    residualCultureRiskNextAction: buildResidualCultureRiskNextAction(residualRiskAfterNextRetirement),
  };
}

function buildCultureStabilizationSummary(regionId, recommendedFirstBundle, nextSafeSupportBundle, postBundleCumulativeRisk) {
  if (postBundleCumulativeRisk.status === 'neutral') {
    return {
      status: 'complete',
      beforeSecondBundle: { score: 0, level: 'low' },
      afterSecondBundle: { score: 0, level: 'low' },
      stableRegionIds: [regionId],
      fragileRegionIds: [],
      mediationRegionIds: [],
      dependencies: [],
      incompatibilities: [],
      stabilizationDebtSummary: buildStabilizationDebtSummary('complete', regionId, [], [], [], [], postBundleCumulativeRisk),
      summary: 'stabilisation complète: aucun second soutien requis',
    };
  }

  if (!nextSafeSupportBundle) {
    const dependencies = recommendedFirstBundle ? [{
      fromBundleId: recommendedFirstBundle.bundleId,
      toBundleId: null,
      reason: 'aucun second soutien sûr disponible après le premier bundle',
    }] : [];
    const fragileRegionIds = [regionId];

    return {
      status: 'future-debt',
      beforeSecondBundle: postBundleCumulativeRisk.after,
      afterSecondBundle: postBundleCumulativeRisk.after,
      stableRegionIds: [],
      fragileRegionIds,
      mediationRegionIds: [],
      dependencies,
      incompatibilities: [],
      stabilizationDebtSummary: buildStabilizationDebtSummary('future-debt', regionId, dependencies, [], [], fragileRegionIds, postBundleCumulativeRisk),
      summary: `dette future: ${postBundleCumulativeRisk.remainingPriority} reste prioritaire`,
    };
  }

  const afterSecondScore = clampScore(postBundleCumulativeRisk.after.score - (nextSafeSupportBundle.residualReliefScore * 2));
  const afterSecondBundle = {
    score: afterSecondScore,
    level: buildCumulativeRiskLevel(afterSecondScore),
  };
  const status = afterSecondScore < 30
    ? 'complete'
    : afterSecondScore < postBundleCumulativeRisk.after.score
      ? 'partial'
      : 'future-debt';
  const tradeoffNeedsMediation = nextSafeSupportBundle.tradeoffToWatch.includes('sous surveillance')
    || nextSafeSupportBundle.tradeoffToWatch.includes('ouverture -')
    || nextSafeSupportBundle.tradeoffToWatch.includes('recherche ralentie');
  const stableRegionIds = status === 'complete' ? [regionId] : [];
  const fragileRegionIds = afterSecondScore >= 55 ? [regionId] : [];
  const mediationRegionIds = afterSecondScore >= 30 && afterSecondScore < 55 ? [regionId] : [];
  const dependencies = [{
    fromBundleId: recommendedFirstBundle.bundleId,
    toBundleId: nextSafeSupportBundle.bundleId,
    reason: 'appliquer le second soutien seulement après stabilisation du premier bundle',
  }];
  const incompatibilities = tradeoffNeedsMediation ? [{
    bundleId: nextSafeSupportBundle.bundleId,
    tradeoff: nextSafeSupportBundle.tradeoffToWatch,
    mitigation: 'médiation ultérieure recommandée avant d’empiler un troisième soutien',
  }] : [];

  return {
    status,
    beforeSecondBundle: postBundleCumulativeRisk.after,
    afterSecondBundle,
    stableRegionIds,
    fragileRegionIds,
    mediationRegionIds,
    dependencies,
    incompatibilities,
    stabilizationDebtSummary: buildStabilizationDebtSummary(status, regionId, dependencies, incompatibilities, mediationRegionIds, fragileRegionIds, postBundleCumulativeRisk),
    summary: status === 'complete'
      ? 'stabilisation complète après le second soutien'
      : status === 'partial'
        ? `amélioration partielle: ${nextSafeSupportBundle.monitoredRisk} baisse, médiation à prévoir`
        : `dette future: ${postBundleCumulativeRisk.remainingPriority} reste prioritaire`,
  };
}

function buildRegionClusterSummary(regionId, regionPresence, cultureSignalsById) {
  const cultureIds = regionPresence.map((entry) => entry.cultureId).sort();
  const cultureNames = regionPresence.map((entry) => entry.cultureName).sort();
  const discoveryPins = regionPresence.flatMap((entry) => (
    cultureSignalsById.get(entry.cultureId)?.signals.highlightedDiscoveries ?? []
  ).map((discoveryId) => ({
    pinId: `${regionId}:${entry.cultureId}:discovery:${discoveryId}`,
    kind: 'discovery',
    name: discoveryId,
    type: 'Découverte',
    regionId,
    cultureId: entry.cultureId,
    cultureName: entry.cultureName,
    importance: null,
  }))).sort((left, right) => left.name.localeCompare(right.name) || left.cultureId.localeCompare(right.cultureId));
  const eventPins = regionPresence.flatMap((entry) => (
    cultureSignalsById.get(entry.cultureId)?.signals.orderedHistoricalEvents ?? []
  ).map((historicalEvent) => ({
    pinId: `${regionId}:${entry.cultureId}:event:${historicalEvent.id}`,
    kind: 'event',
    name: historicalEvent.title,
    type: historicalEvent.category,
    regionId,
    cultureId: entry.cultureId,
    cultureName: entry.cultureName,
    importance: historicalEvent.importance,
  }))).sort((left, right) => (right.importance ?? 0) - (left.importance ?? 0) || left.name.localeCompare(right.name));
  const discoveryIds = [...new Set(discoveryPins.map((pin) => pin.name))].sort();
  const eventCount = eventPins.length;

  return {
    clusterId: `${regionId}:culture-cluster`,
    regionId,
    cultureIds,
    cultureNames,
    cultureCount: cultureIds.length,
    discoveryIds,
    discoveryCount: discoveryIds.length,
    eventCount,
    pins: [...eventPins, ...discoveryPins],
    label: `${cultureIds.length} cultures · ${discoveryIds.length} découvertes`,
    summary: `${cultureNames.slice(0, 3).join(', ')}${cultureNames.length > 3 ? '…' : ''}`,
  };
}

export function buildCultureMapOverlay(payload, options = {}) {
  const normalizedPayload = requireObject(payload, 'CultureMapOverlay payload');
  const normalizedOptions = requireObject(options, 'CultureMapOverlay options');

  const rawCultures = normalizedPayload.cultures === undefined ? [] : normalizedPayload.cultures;
  const rawResearchStates = normalizedPayload.researchStates === undefined ? [] : normalizedPayload.researchStates;
  const rawHistoricalEvents = normalizedPayload.historicalEvents === undefined ? [] : normalizedPayload.historicalEvents;

  if (!Array.isArray(rawCultures)) {
    throw new TypeError('CultureMapOverlay payload.cultures must be an array.');
  }

  if (!Array.isArray(rawResearchStates)) {
    throw new TypeError('CultureMapOverlay payload.researchStates must be an array.');
  }

  if (!Array.isArray(rawHistoricalEvents)) {
    throw new TypeError('CultureMapOverlay payload.historicalEvents must be an array.');
  }

  const cultures = rawCultures.map(normalizeCulture);
  const researchStates = rawResearchStates.map(normalizeResearchState);
  const historicalEvents = rawHistoricalEvents.map(normalizeHistoricalEvent);
  const regionIdsByCulture = normalizeRegionIdsByCulture(normalizedOptions);
  const styleByMarkerType = {
    ...DEFAULT_STYLE_BY_MARKER_TYPE,
    ...requireObject(normalizedOptions.styleByMarkerType ?? {}, 'CultureMapOverlay styleByMarkerType'),
  };
  const cultureSignalsById = new Map(
    cultures.map((culture) => {
      const cultureResearchStates = researchStates.filter((researchState) => researchState.cultureId === culture.id);
      const cultureHistoricalEvents = historicalEvents.filter((historicalEvent) => historicalEvent.affectsCulture(culture.id));
      const signals = summarizeSignals(culture, cultureResearchStates, cultureHistoricalEvents);
      const influenceScore = buildInfluenceScore(culture, signals);
      const influenceTier = buildInfluenceTier(influenceScore);

      return [culture.id, {
        cultureResearchStates,
        cultureHistoricalEvents,
        signals,
        influenceScore,
        influenceTier,
      }];
    }),
  );
  const regionPresenceMap = buildRegionPresenceMap(cultures, regionIdsByCulture, cultureSignalsById);
  const includeClusterSummaries = normalizedOptions.clusterSummaries === true;

  return cultures
    .flatMap((culture) => {
      const cultureState = cultureSignalsById.get(culture.id);
      const markerType = buildMarkerType(culture);
      const regionIds = regionIdsByCulture[culture.id] ?? [];
      const style = normalizeStyle(styleByMarkerType, markerType);

      return regionIds.map((regionId) => {
        const regionPresence = regionPresenceMap.get(regionId) ?? [];
        const zoneRank = regionPresence.findIndex((entry) => entry.cultureId === culture.id);
        const overlapCount = regionPresence.length;
        const dominantCulture = regionPresence[0] ?? null;
        const zoneBand = buildZoneBand(zoneRank, overlapCount);
        const clusterSummary = includeClusterSummaries && overlapCount > 1
          ? buildRegionClusterSummary(regionId, regionPresence, cultureSignalsById)
          : null;
        const supportBundles = buildCultureSupportBundles(culture, regionId, regionPresence, cultureState);
        const riskChangePreview = buildCultureSupportRiskChangePreview(culture, supportBundles[0] ?? null, regionPresence, cultureState);
        const postBundleCumulativeRisk = buildCultureSupportCumulativeRisk(culture, regionId, riskChangePreview, regionPresence, cultureState);
        const recommendedFirstBundle = buildRecommendedFirstCultureSupportBundle(supportBundles, riskChangePreview, postBundleCumulativeRisk);
        const nextSafeSupportBundle = buildNextSafeSupportBundle(supportBundles, recommendedFirstBundle, postBundleCumulativeRisk);
        const cultureStabilizationSummary = buildCultureStabilizationSummary(regionId, recommendedFirstBundle, nextSafeSupportBundle, postBundleCumulativeRisk);

        const regionalDiscoveryLinks = cultureState.signals.highlightedDiscoveries.map((discoveryId) => {
          const linkedEvents = cultureState.signals.orderedHistoricalEvents.filter((historicalEvent) => historicalEvent.discoveryIds.includes(discoveryId));

          return {
            linkId: `${regionId}:${culture.id}:${discoveryId}`,
            regionId,
            cultureId: culture.id,
            discoveryId,
            eventIds: linkedEvents.map((historicalEvent) => historicalEvent.id),
            eventTitles: linkedEvents.map((historicalEvent) => historicalEvent.title),
            eventCount: linkedEvents.length,
            activeResearchCount: cultureState.signals.activeResearchCount,
            label: linkedEvents.length > 0
              ? `${discoveryId} · ${regionId} · ${linkedEvents.length} événement${linkedEvents.length > 1 ? 's' : ''}`
              : `${discoveryId} · ${regionId}`,
          };
        });

        return {
          overlayId: `${regionId}:${culture.id}`,
          regionId,
          cultureId: culture.id,
          cultureName: culture.name,
          archetype: culture.archetype,
          primaryLanguage: culture.primaryLanguage,
          markerType,
          influenceScore: cultureState.influenceScore,
          influenceTier: cultureState.influenceTier,
          label: `${culture.name} (${cultureState.signals.highlightedDiscoveries.length} découvertes)`,
          summary: `${cultureState.signals.activeResearchCount} recherches actives, ${cultureState.signals.eventCount} événements, ${cultureState.signals.identityTags.length} repères culturels`,
          discoveries: cultureState.signals.highlightedDiscoveries,
          regionalDiscoveryLinks,
          unlockedResearchIds: cultureState.signals.unlockedResearchIds,
          activeResearchCount: cultureState.signals.activeResearchCount,
          eventIds: cultureState.signals.eventIds,
          eventTitles: cultureState.signals.orderedHistoricalEvents.map((historicalEvent) => historicalEvent.title),
          eventCount: cultureState.signals.eventCount,
          eventPopups: cultureState.signals.orderedHistoricalEvents.map((historicalEvent, index) => ({
            popupId: `${regionId}:${culture.id}:${historicalEvent.id}:popup`,
            eventId: historicalEvent.id,
            title: historicalEvent.title,
            summary: historicalEvent.summary,
            triggeredAt: historicalEvent.triggeredAt.toISOString(),
            importance: historicalEvent.importance,
            discoveries: [...historicalEvent.discoveryIds],
            unlockedResearchIds: [...cultureState.signals.unlockedResearchIds],
            label: `${historicalEvent.title} · ${historicalEvent.triggeredAt.toISOString().slice(0, 10)}`,
            order: index + 1,
          })),
          identityTags: cultureState.signals.identityTags,
          highlights: [
            ...cultureState.signals.highlightedDiscoveries.slice(0, 2),
            ...cultureState.signals.identityTags.slice(0, Math.max(0, 3 - Math.min(2, cultureState.signals.highlightedDiscoveries.length))),
          ],
          cultureMetrics: {
            openness: culture.openness,
            cohesion: culture.cohesion,
            researchDrive: culture.researchDrive,
          },
          zoneRank,
          overlapCount,
          zoneBand,
          dominantInRegion: dominantCulture?.cultureId === culture.id,
          competingCultureIds: regionPresence.filter((entry) => entry.cultureId !== culture.id).map((entry) => entry.cultureId),
          riskChangePreview,
          postBundleCumulativeRisk,
          nextSafeSupportBundle,
          cultureStabilizationSummary,
          ...(supportBundles.length > 0 ? { supportBundles, recommendedFirstBundle } : {}),
          ...(clusterSummary ? { clusterSummary } : {}),
          zoneContour: buildZoneContour(cultureState.influenceTier, overlapCount, zoneRank),
          style,
          zoneStyle: buildZoneStyle(markerType, cultureState.influenceTier, style, zoneBand),
        };
      });
    })
    .sort((left, right) => {
      const regionComparison = left.regionId.localeCompare(right.regionId);

      if (regionComparison !== 0) {
        return regionComparison;
      }

      return left.cultureId.localeCompare(right.cultureId);
    });
}
