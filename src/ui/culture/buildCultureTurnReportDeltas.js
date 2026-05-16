function normalizeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function buildDelta({ deltaId, tone, label, value, reason, regionId, cultureName, changeState = null, linkedPriority = null }) {
  return {
    deltaId,
    tone,
    label,
    value,
    reason,
    regionId,
    cultureName,
    ...(changeState ? { changeState } : {}),
    ...(linkedPriority ? { linkedPriority } : {}),
  };
}

function buildTimelineDeltas(localTimeline, regionId) {
  return (localTimeline?.items ?? []).map((item) => buildDelta({
    deltaId: `${regionId}:timeline:${item.timelineId}`,
    tone: item.signal,
    label: item.kind === 'event' ? 'Événement déclenché' : 'Découverte visible',
    value: item.title,
    reason: item.summary,
    regionId: normalizeText(item.regionId, regionId),
    cultureName: normalizeText(item.cultureName, 'Culture locale'),
  }));
}

function buildMarkerDeltas(selectedMarker, regionId) {
  if (!selectedMarker) {
    return [];
  }

  const deltas = [buildDelta({
    deltaId: `${regionId}:influence:${selectedMarker.overlayId}`,
    tone: selectedMarker.influenceTier === 'dominant' || selectedMarker.influenceTier === 'strong' ? 'opportunity' : 'identity',
    label: 'Influence culturelle',
    value: `${selectedMarker.cultureName} · ${selectedMarker.influenceScore}`,
    reason: `${selectedMarker.influenceTier} · ${selectedMarker.discoveries.length} découverte${selectedMarker.discoveries.length > 1 ? 's' : ''}`,
    regionId,
    cultureName: selectedMarker.cultureName,
  })];

  if ((selectedMarker.activeResearchCount ?? 0) > 0 || (selectedMarker.unlockedResearchIds ?? []).length > 0) {
    deltas.push(buildDelta({
      deltaId: `${regionId}:research:${selectedMarker.overlayId}`,
      tone: 'research',
      label: 'Recherche culturelle',
      value: `${selectedMarker.activeResearchCount ?? 0} active${selectedMarker.activeResearchCount > 1 ? 's' : ''}`,
      reason: (selectedMarker.unlockedResearchIds ?? []).slice(0, 2).join(', ') || 'Progression liée aux découvertes locales',
      regionId,
      cultureName: selectedMarker.cultureName,
    }));
  }

  return deltas;
}

function buildConsequenceDeltas(consequenceChips, regionId) {
  return (consequenceChips ?? [])
    .filter((chip) => chip.tone === 'risk' || chip.tone === 'opportunity')
    .map((chip) => buildDelta({
      deltaId: `${regionId}:chip:${chip.chipId}`,
      tone: chip.tone,
      label: chip.tone === 'risk' ? 'Tension culturelle' : 'Opportunité culturelle',
      value: chip.label,
      reason: chip.explanation,
      regionId: normalizeText(chip.regionId, regionId),
      cultureName: normalizeText(chip.cultureName, 'Culture locale'),
    }));
}

function buildDiscoveryTimelineRecap(localTimeline, selectedMarker, selectedCluster, regionId) {
  const priority = selectedMarker?.narrativePriority ?? selectedCluster?.narrativePriority ?? selectedCluster?.markerCollisionCluster?.narrativePriority ?? null;
  const items = (localTimeline?.items ?? [])
    .filter((item) => item.kind === 'event' || item.kind === 'discovery')
    .map((item, index) => ({
      recapId: `${regionId}:recap:${item.timelineId}`,
      order: item.date ? item.date : `turn-order-${index + 1}`,
      kind: item.kind,
      title: item.title,
      changeState: item.kind === 'discovery' ? 'new' : 'investigate',
      summary: priority?.consequencePreview?.summary ?? item.summary,
      linkedPriority: priority ? {
        state: priority.state,
        microAction: priority.microAction,
        confidence: priority.consequencePreview?.confidence ?? 'medium',
      } : null,
    }))
    .sort((left, right) => left.order.localeCompare(right.order) || left.title.localeCompare(right.title))
    .slice(0, 3);

  return items;
}

function buildInfluenceDiffs(selectedMarker, previousMarker, selectedCluster, regionId) {
  if (!selectedMarker) {
    return [];
  }

  const priority = selectedMarker.narrativePriority ?? selectedCluster?.narrativePriority ?? selectedCluster?.markerCollisionCluster?.narrativePriority ?? null;
  const previousScore = Number.isFinite(previousMarker?.influenceScore) ? previousMarker.influenceScore : null;
  const currentScore = Number.isFinite(selectedMarker.influenceScore) ? selectedMarker.influenceScore : 0;
  const previousDiscoveries = new Set(previousMarker?.discoveries ?? []);
  const hasNewDiscovery = (selectedMarker.discoveries ?? []).some((discoveryId) => !previousDiscoveries.has(discoveryId));
  const confidence = priority?.consequencePreview?.confidence ?? 'medium';
  const changeState = selectedMarker.visible === false || selectedMarker.masked === true
    ? 'masked'
    : previousScore === null
      ? 'new'
      : currentScore > previousScore
        ? 'strengthened'
        : currentScore < previousScore
          ? 'weakened'
          : confidence === 'low'
            ? 'investigate'
            : hasNewDiscovery
              ? 'new'
              : 'stable';

  return [{
    diffId: `${regionId}:influence-diff:${selectedMarker.overlayId}`,
    regionId,
    cultureName: selectedMarker.cultureName,
    previousScore,
    currentScore,
    changeState,
    label: changeState === 'new'
      ? 'nouveau repère'
      : changeState === 'strengthened'
        ? 'influence renforcée'
        : changeState === 'weakened'
          ? 'influence affaiblie'
          : changeState === 'masked'
            ? 'repère masqué'
            : changeState === 'investigate'
              ? 'à investiguer'
              : 'stable',
    reason: priority?.consequencePreview?.summary ?? `${selectedMarker.influenceTier} · ${currentScore}`,
    linkedPriority: priority ? {
      state: priority.state,
      microAction: priority.microAction,
      confidence,
    } : null,
  }];
}

function buildMomentumLevel(priority, influenceDiff, recapItem) {
  const confidence = priority?.consequencePreview?.confidence ?? influenceDiff?.linkedPriority?.confidence ?? recapItem?.linkedPriority?.confidence ?? 'low';

  if (confidence === 'low' || influenceDiff?.changeState === 'masked' || influenceDiff?.changeState === 'investigate') {
    return 'fragile';
  }

  if (priority?.state === 'opportunity' || influenceDiff?.changeState === 'strengthened') {
    return 'surging';
  }

  if (priority?.state === 'tension' || influenceDiff?.changeState === 'weakened') {
    return 'volatile';
  }

  return 'observing';
}

function buildMomentumFilterState(priority, level) {
  if (priority?.state === 'opportunity' || level === 'surging') {
    return 'opportunity';
  }

  if (priority?.state === 'tension' || level === 'volatile' || level === 'fragile') {
    return 'tension';
  }

  return 'watch';
}

function buildCulturalMomentumLayer({ regionId, selectedMarker, selectedCluster, timelineRecap, influenceDiffs, momentumFilter }) {
  const priority = selectedMarker?.narrativePriority ?? selectedCluster?.narrativePriority ?? selectedCluster?.markerCollisionCluster?.narrativePriority ?? null;
  const discoveryIds = (selectedMarker?.discoveries ?? [])
    .slice(0, 3)
    .sort();
  const fallbackDiscovery = discoveryIds[0] ?? timelineRecap.find((item) => item.kind === 'discovery')?.title ?? priority?.source ?? 'signal culturel';
  const baseDiffs = influenceDiffs.length > 0 ? influenceDiffs : [{
    diffId: `${regionId}:momentum:unknown`,
    regionId,
    cultureName: selectedMarker?.cultureName ?? 'Culture locale',
    changeState: priority?.consequencePreview?.confidence === 'low' ? 'investigate' : 'stable',
    label: priority?.consequencePreview?.confidence === 'low' ? 'à investiguer' : 'stable',
    reason: priority?.reason ?? 'momentum culturel stable',
    linkedPriority: priority ? {
      state: priority.state,
      microAction: priority.microAction,
      confidence: priority.consequencePreview?.confidence ?? 'medium',
    } : null,
  }];
  const items = baseDiffs.map((diff, index) => {
    const recapItem = timelineRecap[index] ?? timelineRecap[0] ?? null;
    const level = buildMomentumLevel(priority, diff, recapItem);
    const filterState = buildMomentumFilterState(priority, level);
    const action = priority?.microAction ?? (level === 'fragile' ? 'observer' : 'attendre');
    const risk = priority?.state === 'tension' || level === 'volatile' || level === 'fragile'
      ? (priority?.consequencePreview?.tradeoff ?? diff.reason)
      : null;

    return {
      momentumId: `${regionId}:momentum:${diff.changeState}:${index + 1}`,
      regionId,
      cultureName: diff.cultureName,
      level,
      filterState,
      discoveryId: discoveryIds[index] ?? fallbackDiscovery,
      influenceState: diff.changeState,
      chain: `${discoveryIds[index] ?? fallbackDiscovery} → ${diff.label} → ${action}`,
      suggestedAction: action,
      opportunity: priority?.consequencePreview?.opportunity ?? recapItem?.summary ?? diff.reason,
      risk,
      confidence: priority?.consequencePreview?.confidence ?? diff.linkedPriority?.confidence ?? 'low',
      markerIds: priority?.consequencePreview?.visibleMarkerIds ?? [],
    };
  });
  const filteredItems = momentumFilter && momentumFilter !== 'all'
    ? items.filter((item) => item.filterState === momentumFilter)
    : items;

  return {
    layerId: `${regionId}:cultural-momentum`,
    regionId,
    activeFilter: momentumFilter ?? 'all',
    availableFilters: ['all', 'opportunity', 'tension', 'watch'],
    summary: filteredItems.length === 0
      ? 'Aucun momentum culturel pour ce filtre.'
      : `${filteredItems.length} chaîne${filteredItems.length > 1 ? 's' : ''} découverte → influence → décision.`,
    items: filteredItems.slice(0, 3),
  };
}

function buildStabilizationAction(momentumItem) {
  if (momentumItem.level === 'surging') {
    return momentumItem.suggestedAction === 'soutenir' ? 'soutenir' : 'amplifier';
  }

  if (momentumItem.level === 'volatile') {
    return 'apaiser';
  }

  if (momentumItem.level === 'fragile') {
    return momentumItem.confidence === 'low' ? 'enquêter' : 'attendre';
  }

  return 'attendre';
}

function buildStabilizationTone(momentumItem, action) {
  if (momentumItem.filterState === 'opportunity' || action === 'amplifier' || action === 'soutenir') {
    return 'opportunity';
  }

  if (momentumItem.filterState === 'tension' || action === 'apaiser') {
    return 'tension';
  }

  return 'watch';
}

function buildCultureStabilizationRecommendations(momentumLayer) {
  const recommendations = (momentumLayer?.items ?? []).map((item, index) => {
    const action = buildStabilizationAction(item);
    const tone = buildStabilizationTone(item, action);
    const reason = `${item.discoveryId} → ${item.level} → ${action}`;
    const expectedEffect = tone === 'opportunity'
      ? `opportunité à saisir: ${item.opportunity}`
      : tone === 'tension'
        ? `tension à calmer: ${item.risk ?? item.opportunity}`
        : 'signal trop fragile pour agir sans observation';

    return {
      recommendationId: `${item.momentumId}:stabilization`,
      regionId: item.regionId,
      cultureName: item.cultureName,
      action,
      tone,
      level: item.level,
      discoveryId: item.discoveryId,
      chain: `${item.chain} → ${action}`,
      reason,
      expectedEffect,
      confidence: item.confidence,
      markerIds: item.markerIds,
      rank: index + 1,
    };
  });

  return {
    activeFilter: momentumLayer?.activeFilter ?? 'all',
    summary: recommendations.length === 0
      ? 'Aucune recommandation culturelle pour ce filtre.'
      : `${recommendations.length} recommandation${recommendations.length > 1 ? 's' : ''} de stabilisation culturelle.`,
    recommendations,
  };
}

function buildRecommendationTrajectory(action) {
  if (action === 'soutenir') {
    return 'consolidation';
  }

  if (action === 'amplifier') {
    return 'expansion';
  }

  if (action === 'apaiser') {
    return 'apaisement';
  }

  if (action === 'enquêter') {
    return 'enquête';
  }

  return 'attente';
}

function normalizeCoherenceRecommendation(recommendation, index) {
  const action = recommendation.action ?? recommendation.suggestedAction ?? 'attendre';
  const trajectory = recommendation.trajectory ?? buildRecommendationTrajectory(action);

  return {
    recommendationId: recommendation.recommendationId ?? `culture-recommendation:${index + 1}`,
    regionId: recommendation.regionId ?? 'province',
    cultureName: recommendation.cultureName ?? 'Culture locale',
    action,
    tone: recommendation.tone ?? 'watch',
    level: recommendation.level ?? 'observing',
    discoveryId: recommendation.discoveryId ?? 'signal culturel',
    confidence: recommendation.confidence ?? 'low',
    chain: recommendation.chain ?? `${recommendation.discoveryId ?? 'signal culturel'} → ${recommendation.level ?? 'observing'} → ${action}`,
    expectedEffect: recommendation.expectedEffect ?? 'effet culturel à confirmer',
    trajectory,
    rank: recommendation.rank ?? index + 1,
    supportKey: recommendation.supportKey ?? recommendation.action ?? action,
    markerIds: recommendation.markerIds ?? [],
    expiresSoon: recommendation.expiresSoon === true,
    timingLabel: recommendation.timingLabel ?? recommendation.timingWindow ?? recommendation.window ?? null,
    timingChoiceState: recommendation.timingChoiceState ?? recommendation.choiceState ?? (recommendation.chosen === true ? 'chosen' : 'recommended'),
  };
}

function collectNormalizedRecommendations(stabilizationRecommendations, activeRecommendations = []) {
  return [
    ...(stabilizationRecommendations?.recommendations ?? []),
    ...(activeRecommendations ?? []),
  ].map(normalizeCoherenceRecommendation);
}

function buildCultureRecommendationCoherenceSummary(stabilizationRecommendations, activeRecommendations = []) {
  const recommendations = collectNormalizedRecommendations(stabilizationRecommendations, activeRecommendations);
  const trajectoryOrder = ['consolidation', 'expansion', 'apaisement', 'enquête', 'attente'];
  const trajectoryGroups = trajectoryOrder
    .map((trajectory) => {
      const members = recommendations.filter((recommendation) => recommendation.trajectory === trajectory);
      return members.length === 0 ? null : {
        trajectory,
        count: members.length,
        actions: [...new Set(members.map((member) => member.action))],
        recommendationIds: members.map((member) => member.recommendationId),
        summary: `${trajectory}: ${members.map((member) => member.cultureName).join(', ')}`,
      };
    })
    .filter(Boolean);
  const tensions = [];
  const expansionRecommendations = recommendations.filter((recommendation) => recommendation.trajectory === 'expansion');
  const apaisementRecommendations = recommendations.filter((recommendation) => recommendation.trajectory === 'apaisement');

  recommendations.forEach((recommendation) => {
    if ((recommendation.action === 'amplifier' || recommendation.action === 'soutenir')
      && (recommendation.level === 'fragile' || recommendation.confidence === 'low')) {
      tensions.push({
        tensionId: `${recommendation.recommendationId}:fragile-amplification`,
        level: 'warning',
        label: 'amplification fragile',
        recommendationIds: [recommendation.recommendationId],
        reason: `${recommendation.discoveryId} → ${recommendation.action}: signal encore fragile`,
      });
    }

    if (recommendation.action === 'enquêter' && recommendation.confidence === 'low') {
      tensions.push({
        tensionId: `${recommendation.recommendationId}:low-confidence-investigation`,
        level: 'uncertain',
        label: 'enquête incertaine',
        recommendationIds: [recommendation.recommendationId],
        reason: `${recommendation.discoveryId} → enquêter: confiance trop basse pour sur-vendre la lecture`,
      });
    }
  });

  if (expansionRecommendations.length > 1) {
    tensions.push({
      tensionId: 'culture-coherence:competing-opportunities',
      level: 'conflict',
      label: 'opportunités concurrentes',
      recommendationIds: expansionRecommendations.map((recommendation) => recommendation.recommendationId),
      reason: `${expansionRecommendations.length} opportunités demandent amplification en parallèle`,
    });
  }

  apaisementRecommendations
    .filter((recommendation) => recommendation.rank > 1 || expansionRecommendations.length > 0)
    .forEach((recommendation) => {
      tensions.push({
        tensionId: `${recommendation.recommendationId}:late-appeasement`,
        level: 'warning',
        label: 'apaisement tardif',
        recommendationIds: [recommendation.recommendationId],
        reason: `${recommendation.discoveryId} → apaiser: risque de passer après une expansion active`,
      });
    });

  return {
    state: recommendations.length === 0 ? 'quiet' : tensions.some((tension) => tension.level === 'conflict') ? 'conflict' : tensions.length > 0 ? 'mixed' : 'coherent',
    activeFilter: stabilizationRecommendations?.activeFilter ?? 'all',
    summary: recommendations.length === 0
      ? 'Aucune cohérence culturelle à synthétiser.'
      : tensions.length === 0
        ? `${recommendations.length} recommandation${recommendations.length > 1 ? 's' : ''} sur une trajectoire culturelle cohérente.`
        : `${tensions.length} tension${tensions.length > 1 ? 's' : ''} entre recommandations culturelles actives.`,
    trajectoryGroups,
    tensions,
    explanation: recommendations.length === 0
      ? 'Aucun signal récent → recommandation → cohérence.'
      : recommendations
        .slice(0, 3)
        .map((recommendation) => `${recommendation.discoveryId} → ${recommendation.action} → ${recommendation.trajectory}`)
        .join(' | '),
    uncertainRecommendationIds: recommendations
      .filter((recommendation) => recommendation.confidence === 'low' || recommendation.level === 'fragile')
      .map((recommendation) => recommendation.recommendationId),
  };
}

function buildCommitmentBundleName(trajectory) {
  if (trajectory === 'apaisement') {
    return 'apaisement local';
  }

  if (trajectory === 'consolidation') {
    return 'consolidation régionale';
  }

  if (trajectory === 'enquête') {
    return 'enquête';
  }

  if (trajectory === 'expansion') {
    return 'expansion prudente';
  }

  return 'attente';
}

function buildCulturalTimingWindow(bundle, clusterMembers) {
  const expiresSoon = clusterMembers.some((member) => member.expiresSoon);
  const hasImmediateOpportunity = clusterMembers.some((member) => member.tone === 'opportunity' || member.level === 'surging');
  const hasFragileSignal = clusterMembers.some((member) => member.confidence === 'low' || member.level === 'fragile');
  const status = expiresSoon
    ? 'soon-lost'
    : hasImmediateOpportunity && !hasFragileSignal
      ? 'immediate'
      : 'wait';
  const clusterLabel = [...new Set(clusterMembers.map((member) => member.cultureName))].join(', ');
  const regionIds = [...new Set(clusterMembers.map((member) => member.regionId))];
  const timingLabel = clusterMembers.find((member) => member.timingLabel)?.timingLabel
    ?? (expiresSoon ? 'cette fenêtre risque de se fermer au prochain tour' : status === 'immediate' ? 'agir maintenant conserve le momentum' : 'attendre stabilise la lecture');
  const choiceState = clusterMembers.some((member) => member.timingChoiceState === 'chosen' || member.timingChoiceState === 'committed')
    ? 'chosen'
    : 'recommended';
  const delayEffect = expiresSoon
    ? 'retarder peut faire perdre le momentum et transformer l’opportunité en tension à réévaluer'
    : status === 'immediate'
      ? 'retarder baisse la priorité du bundle et peut donner la main aux signaux concurrents'
      : hasFragileSignal
        ? 'attendre garde le bundle lisible mais exige une vérification avant engagement'
        : 'retarder ne change pas encore la décision, surveiller le prochain signal suffit';

  return {
    timingId: `${bundle.bundleId}:timing:${regionIds.join('+') || 'cluster'}`,
    bundleId: bundle.bundleId,
    clusterLabel,
    regionIds,
    status,
    label: status === 'soon-lost' ? 'fenêtre bientôt perdue' : status === 'immediate' ? 'action immédiate' : 'attendre',
    timingLabel,
    choiceState,
    recommendationIds: clusterMembers.map((member) => member.recommendationId),
    delayEffect,
  };
}

function buildCulturalTimingWindows(bundle, members) {
  const clusters = members.reduce((groups, member) => {
    const key = `${member.regionId}:${member.cultureName}`;
    groups.set(key, [...(groups.get(key) ?? []), member]);
    return groups;
  }, new Map());

  return [...clusters.values()]
    .map((clusterMembers) => buildCulturalTimingWindow(bundle, clusterMembers))
    .sort((left, right) => {
      const order = { 'soon-lost': 3, immediate: 2, wait: 1 };
      return (order[right.status] ?? 0) - (order[left.status] ?? 0) || left.clusterLabel.localeCompare(right.clusterLabel);
    });
}

function buildCulturalFollowUpPrompt(window, bundle, incompatibilities) {
  const relatedIncompatibilities = incompatibilities.filter((incompatibility) =>
    (incompatibility.recommendationIds ?? []).some((recommendationId) => window.recommendationIds.includes(recommendationId)));
  const hasBlockingIncompatibility = relatedIncompatibilities.some((incompatibility) => incompatibility.severity === 'choice' || incompatibility.severity === 'sequence');
  const hasUncertainty = bundle.state === 'uncertain'
    || bundle.uncertainRecommendationIds.some((recommendationId) => window.recommendationIds.includes(recommendationId));
  const promptState = window.status === 'wait' || hasUncertainty
    ? 'premature'
    : window.status === 'soon-lost' || hasBlockingIncompatibility
      ? 'risky'
      : 'compatible';
  const trajectoryCopy = {
    apaisement: 'Préparer la médiation locale',
    consolidation: 'Ancrer le soutien régional',
    enquête: 'Lancer une vérification culturelle',
    expansion: 'Ouvrir le récit d’expansion',
    attente: 'Planifier une observation courte',
  };
  const nextStepCopy = {
    compatible: 'enchaîner avec un suivi narratif court et mesurable',
    risky: 'sécuriser le prérequis avant d’engager le suivi complet',
    premature: 'attendre un signal plus net avant de promettre un résultat culturel',
  };
  const reason = window.choiceState === 'chosen'
    ? `fenêtre choisie: ${window.timingLabel}`
    : `fenêtre recommandée: ${window.timingLabel}`;

  return {
    promptId: `${window.timingId}:follow-up`,
    timingId: window.timingId,
    bundleId: bundle.bundleId,
    clusterLabel: window.clusterLabel,
    state: promptState,
    label: trajectoryCopy[bundle.trajectory] ?? 'Préparer le suivi culturel',
    reasonNow: `${reason}; engagement actif ${bundle.label}`,
    nextStep: nextStepCopy[promptState],
    riskReason: promptState === 'compatible'
      ? null
      : hasUncertainty
        ? 'conditions culturelles encore fragiles'
        : relatedIncompatibilities[0]?.reason ?? window.delayEffect,
    recommendationIds: window.recommendationIds,
  };
}

function buildCulturalFollowUpPrompts(bundles, incompatibilities) {
  const prompts = bundles
    .flatMap((bundle) => bundle.timingWindows.map((window) => buildCulturalFollowUpPrompt(window, bundle, incompatibilities)))
    .sort((left, right) => {
      const stateOrder = { risky: 3, compatible: 2, premature: 1 };
      return (stateOrder[right.state] ?? 0) - (stateOrder[left.state] ?? 0) || left.clusterLabel.localeCompare(right.clusterLabel);
    })
    .slice(0, 3);

  return {
    state: prompts.length === 0 ? 'quiet' : prompts.some((prompt) => prompt.state === 'risky') ? 'mixed' : prompts.every((prompt) => prompt.state === 'premature') ? 'premature' : 'ready',
    summary: prompts.length === 0
      ? 'Aucun prompt de suivi culturel après timing.'
      : `${prompts.length} prompt${prompts.length > 1 ? 's' : ''} de suivi culturel après timing.`,
    prompts,
  };
}

function buildCulturalPromptChoiceEntry(prompt, bundles, timingWindows) {
  const bundle = bundles.find((candidate) => candidate.bundleId === prompt.bundleId);
  const window = timingWindows.find((candidate) => candidate.timingId === prompt.timingId);
  const role = prompt.state === 'compatible'
    ? 'best-safe'
    : prompt.state === 'risky'
      ? 'risky-useful'
      : 'wait';
  const narrativeImpact = role === 'best-safe'
    ? `${prompt.label} garde ${bundle?.label ?? 'l’engagement'} lisible et transforme ${prompt.clusterLabel} en suivi narratif immédiat.`
    : role === 'risky-useful'
      ? `${prompt.label} peut préserver le momentum de ${prompt.clusterLabel}, mais le choix doit absorber le risque: ${prompt.riskReason ?? 'précondition fragile'}.`
      : `${prompt.label} reste en attente: ${prompt.riskReason ?? 'conditions prématurées'} sans devenir recommandation forte.`;
  const lostMomentumRisk = window?.status === 'soon-lost'
    ? 'ne rien choisir peut perdre la fenêtre au prochain tour'
    : window?.status === 'immediate'
      ? 'ne rien choisir dilue le momentum actif et laisse les signaux concurrents reprendre la priorité'
      : 'ne rien choisir conserve le suivi, mais reporte l’arbitrage narratif';

  return {
    comparisonId: `${prompt.promptId}:choice-comparison`,
    promptId: prompt.promptId,
    role,
    label: role === 'best-safe' ? 'meilleur suivi sûr' : role === 'risky-useful' ? 'suivi risqué mais utile' : 'suivi à attendre',
    clusterLabel: prompt.clusterLabel,
    promptLabel: prompt.label,
    narrativeImpact,
    lostMomentumRisk,
    recommendationIds: prompt.recommendationIds,
  };
}

function buildCulturalPromptChoiceComparison(followUpPrompts, bundles, timingWindows) {
  const entries = followUpPrompts.prompts.map((prompt) => buildCulturalPromptChoiceEntry(prompt, bundles, timingWindows));
  const hasSafe = entries.some((entry) => entry.role === 'best-safe');
  const hasRisky = entries.some((entry) => entry.role === 'risky-useful');
  const state = entries.length === 0
    ? 'quiet'
    : hasSafe
      ? 'ready'
      : hasRisky
        ? 'risky'
        : 'wait';

  return {
    state,
    summary: entries.length === 0
      ? 'Aucun arbitrage de prompt culturel disponible.'
      : `${entries.length} choix de prompt culturel comparé${entries.length > 1 ? 's' : ''}.`,
    entries,
    noChoiceRisk: entries.length === 0
      ? 'Aucun momentum culturel à arbitrer.'
      : entries.find((entry) => entry.role === 'risky-useful')?.lostMomentumRisk
        ?? entries.find((entry) => entry.role === 'best-safe')?.lostMomentumRisk
        ?? 'ne rien choisir garde les prompts prématurés en attente sans renforcer le récit',
  };
}

function normalizeCulturalPromptHistoryEntry(entry, index) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const promptLabel = normalizeText(entry.promptLabel ?? entry.label ?? entry.title, 'prompt culturel');
  const clusterLabel = normalizeText(entry.clusterLabel ?? entry.territory ?? entry.regionName ?? entry.regionId, 'territoire culturel');
  const theme = normalizeText(entry.theme ?? entry.bundleLabel ?? entry.trajectory ?? promptLabel, promptLabel);

  return {
    historyId: entry.historyId ?? entry.decisionId ?? `culture-prompt-history:${index}`,
    turn: Number.isFinite(entry.turn) ? entry.turn : null,
    regionId: normalizeText(entry.regionId ?? entry.locationId, 'province'),
    clusterLabel,
    theme,
    promptLabel,
    choiceState: entry.choiceState ?? entry.state ?? 'seen',
    outcome: entry.outcome ?? entry.result ?? 'historique conservé',
    repeated: entry.repeated === true,
  };
}

function tokenizePromptText(value) {
  return normalizeText(value, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .split(/[^a-zà-ÿ0-9]+/i)
    .filter((token) => token.length > 3);
}

function findPromptHistoryRepeat(entry, historyEntries) {
  const entryTokens = new Set(tokenizePromptText(`${entry.promptLabel} ${entry.clusterLabel}`));
  return historyEntries
    .map((historyEntry) => {
      const historyTokens = tokenizePromptText(`${historyEntry.promptLabel} ${historyEntry.theme} ${historyEntry.clusterLabel}`);
      const overlap = historyTokens.filter((token) => entryTokens.has(token)).length;
      const exact = historyEntry.promptLabel === entry.promptLabel && historyEntry.clusterLabel === entry.clusterLabel;
      const sameTerritory = historyEntry.clusterLabel === entry.clusterLabel;
      const sameTheme = historyEntry.theme === entry.promptLabel || historyEntry.promptLabel === entry.promptLabel;
      const repeatState = exact || (sameTerritory && sameTheme)
        ? 'repeated'
        : sameTerritory || overlap >= 2
          ? 'near-repeat'
          : 'new';

      return { historyEntry, repeatState, overlap };
    })
    .filter((candidate) => candidate.repeatState !== 'new')
    .sort((left, right) => {
      const rank = { repeated: 2, 'near-repeat': 1 };
      return (rank[right.repeatState] ?? 0) - (rank[left.repeatState] ?? 0) || right.overlap - left.overlap;
    })[0] ?? null;
}

function buildPromptRotation(entry, repeatMatch, freshAlternative) {
  if (!repeatMatch) {
    return {
      confirm: 'confirmer si le contexte narratif a changé',
      defer: 'différer si aucun nouveau signal ne justifie ce prompt',
      replace: freshAlternative ? `remplacer par ${freshAlternative.promptLabel}` : 'aucune alternative plus fraîche visible',
    };
  }

  return {
    confirm: repeatMatch.repeatState === 'repeated'
      ? 'confirmer seulement si la répétition est intentionnelle'
      : 'confirmer si la variante ajoute une nuance culturelle claire',
    defer: 'différer pour éviter la fatigue de répétition',
    replace: freshAlternative ? `remplacer par ${freshAlternative.promptLabel} (${freshAlternative.clusterLabel})` : 'remplacer par une alternative culturelle plus fraîche dès qu’un signal apparaît',
  };
}

function buildCulturalPromptHistoryDrawer(promptChoiceComparison, promptHistory = [], regionId = 'province') {
  const historyEntries = promptHistory
    .map((entry, index) => normalizeCulturalPromptHistoryEntry(entry, index))
    .filter(Boolean)
    .sort((left, right) => (right.turn ?? 0) - (left.turn ?? 0))
    .slice(0, 5);
  const repeatMatches = promptChoiceComparison.entries.map((entry) => findPromptHistoryRepeat(entry, historyEntries));
  const currentEntries = promptChoiceComparison.entries.map((entry, index) => {
    const repeatMatch = repeatMatches[index];
    const freshAlternative = promptChoiceComparison.entries.find((candidate, candidateIndex) => candidateIndex !== index && !repeatMatches[candidateIndex]);

    return {
      promptId: entry.promptId,
      promptLabel: entry.promptLabel,
      clusterLabel: entry.clusterLabel,
      role: entry.role,
      repeatState: repeatMatch?.repeatState ?? 'new',
      repeatReason: repeatMatch
        ? `${repeatMatch.repeatState === 'repeated' ? 'répète' : 'quasi-équivalent à'} ${repeatMatch.historyEntry.promptLabel} (${repeatMatch.historyEntry.clusterLabel})${repeatMatch.historyEntry.turn ? ` vu au tour ${repeatMatch.historyEntry.turn}` : ''}`
        : 'aucune décision récente similaire dans la limite affichée',
      rotation: buildPromptRotation(entry, repeatMatch, freshAlternative),
      narrativeImpact: entry.narrativeImpact,
    };
  });
  const combined = [
    ...currentEntries.map((entry) => ({ ...entry, source: 'current', theme: entry.promptLabel })),
    ...historyEntries.map((entry) => ({
      source: 'history',
      historyId: entry.historyId,
      turn: entry.turn,
      promptLabel: entry.promptLabel,
      clusterLabel: entry.clusterLabel,
      theme: entry.theme,
      choiceState: entry.choiceState,
      outcome: entry.outcome,
      repeatState: entry.repeated ? 'repeated' : 'seen',
    })),
  ];
  const groups = [...combined.reduce((map, entry) => {
    const key = `${entry.clusterLabel}:${entry.theme}`;
    const existing = map.get(key) ?? {
      groupId: `culture-prompt-history:${key}`,
      clusterLabel: entry.clusterLabel,
      theme: entry.theme,
      entries: [],
      hasRepeat: false,
    };
    existing.entries.push(entry);
    existing.hasRepeat = existing.hasRepeat || entry.repeatState === 'repeated' || entry.repeatState === 'near-repeat';
    map.set(key, existing);
    return map;
  }, new Map()).values()].slice(0, 4);

  return {
    state: groups.length === 0 ? 'quiet' : currentEntries.some((entry) => entry.repeatState === 'repeated') ? 'repeat-warning' : currentEntries.some((entry) => entry.repeatState === 'near-repeat') ? 'near-repeat' : 'ready',
    summary: groups.length === 0
      ? 'Aucun historique de prompt culturel à afficher.'
      : `${groups.length} groupe${groups.length > 1 ? 's' : ''} d’historique culturel limité${groups.length > 1 ? 's' : ''} à comparer.`,
    displayLimit: 5,
    regionId,
    currentEntries,
    groups,
    repetitionSafeguard: currentEntries.length === 0
      ? 'Aucun prompt courant à protéger contre la répétition.'
      : currentEntries.some((entry) => entry.repeatState !== 'new')
        ? 'Rotation courte disponible: confirmer, différer ou remplacer les prompts répétés.'
        : 'Aucune répétition récente détectée: garder les prompts frais en priorité.',
    emptyHint: historyEntries.length === 0
      ? 'Historique léger: comparer seulement les prompts actuels et commencer à mémoriser les décisions.'
      : 'Historique limité aux décisions récentes pour garder le drawer lisible.',
  };
}

function buildCulturalPromptFreshnessFilter(promptChoiceComparison, promptHistoryDrawer) {
  const freshnessEntries = promptChoiceComparison.entries
    .map((entry) => {
      const historyEntry = promptHistoryDrawer.currentEntries.find((candidate) => candidate.promptId === entry.promptId);
      const freshnessState = historyEntry?.repeatState === 'repeated'
        ? 'seen'
        : historyEntry?.repeatState === 'near-repeat'
          ? 'defer'
          : 'fresh';
      const explanation = freshnessState === 'fresh'
        ? 'recommandation fraîche: aucun choix récent similaire dans l’historique lisible'
        : freshnessState === 'seen'
          ? `déjà vue: ${historyEntry.repeatReason}`
          : `à différer: ${historyEntry.repeatReason}`;
      const score = (freshnessState === 'fresh' ? 3 : freshnessState === 'defer' ? 2 : 1)
        + (entry.role === 'best-safe' ? 2 : entry.role === 'risky-useful' ? 1 : 0);

      return {
        freshnessId: `${entry.promptId}:freshness`,
        promptId: entry.promptId,
        promptLabel: entry.promptLabel,
        clusterLabel: entry.clusterLabel,
        role: entry.role,
        freshnessState,
        score,
        explanation,
        rotation: historyEntry?.rotation ?? null,
      };
    })
    .sort((left, right) => right.score - left.score || left.clusterLabel.localeCompare(right.clusterLabel));
  const preferred = freshnessEntries.find((entry) => entry.freshnessState === 'fresh') ?? freshnessEntries[0] ?? null;

  return {
    state: freshnessEntries.length === 0
      ? 'quiet'
      : preferred?.freshnessState === 'fresh'
        ? 'fresh'
        : preferred?.freshnessState === 'defer'
          ? 'mixed'
          : 'stale',
    summary: freshnessEntries.length === 0
      ? 'Aucun filtre de fraîcheur culturel actif.'
      : `${freshnessEntries.length} recommandation${freshnessEntries.length > 1 ? 's' : ''} culturelle${freshnessEntries.length > 1 ? 's' : ''} classée${freshnessEntries.length > 1 ? 's' : ''} par fraîcheur.`,
    preferredPromptId: preferred?.promptId ?? null,
    entries: freshnessEntries,
    fallback: promptHistoryDrawer.groups.length < 2
      ? 'Historique court ou ambigu: conserver le classement stable et expliquer la fraîcheur sans masquer les prompts.'
      : 'Historique suffisant: favoriser les alternatives non répétitives avant les prompts déjà vus.',
  };
}

function buildCulturalCommitmentBundles(stabilizationRecommendations, activeRecommendations = [], promptHistory = [], regionId = 'province') {
  const recommendations = collectNormalizedRecommendations(stabilizationRecommendations, activeRecommendations);
  const trajectories = ['apaisement', 'consolidation', 'enquête', 'expansion', 'attente'];
  const bundles = trajectories
    .map((trajectory) => {
      const members = recommendations.filter((recommendation) => recommendation.trajectory === trajectory);
      if (members.length === 0) {
        return null;
      }

      const uncertainMembers = members.filter((member) => member.confidence === 'low' || member.level === 'fragile');
      const safeMembers = members.filter((member) => !uncertainMembers.includes(member));
      const state = safeMembers.length > 0 && uncertainMembers.length === 0
        ? 'safe'
        : safeMembers.length > 0
          ? 'mixed'
          : 'uncertain';

      const bundle = {
        bundleId: `culture-commitment:${trajectory}`,
        label: buildCommitmentBundleName(trajectory),
        trajectory,
        state,
        safeRecommendationIds: safeMembers.map((member) => member.recommendationId),
        uncertainRecommendationIds: uncertainMembers.map((member) => member.recommendationId),
        actions: [...new Set(members.map((member) => member.action))],
        markerIds: [...new Set(members.flatMap((member) => member.markerIds))],
        explanation: members
          .map((member) => `${member.discoveryId} → ${member.action} → ${state === 'uncertain' ? 'incertain' : buildCommitmentBundleName(trajectory)}`)
          .join(' | '),
      };

      return {
        ...bundle,
        timingWindows: buildCulturalTimingWindows(bundle, members),
      };
    })
    .filter(Boolean);
  const incompatibilities = [];
  const supportGroups = recommendations.reduce((groups, recommendation) => {
    groups.set(recommendation.supportKey, [...(groups.get(recommendation.supportKey) ?? []), recommendation]);
    return groups;
  }, new Map());

  supportGroups.forEach((members, supportKey) => {
    if (members.length > 1 && supportKey !== 'attendre') {
      incompatibilities.push({
        incompatibilityId: `culture-commitment:support:${supportKey}`,
        type: 'same-support-required',
        severity: 'choice',
        recommendationIds: members.map((member) => member.recommendationId),
        reason: `même soutien requis: ${supportKey}`,
      });
    }
  });

  const expansion = recommendations.filter((recommendation) => recommendation.trajectory === 'expansion');
  const apaisement = recommendations.filter((recommendation) => recommendation.trajectory === 'apaisement');
  if (expansion.length > 0 && apaisement.length > 0) {
    incompatibilities.push({
      incompatibilityId: 'culture-commitment:timing:expansion-apaisement',
      type: 'contradictory-narrative-timing',
      severity: 'sequence',
      recommendationIds: [...expansion, ...apaisement].map((member) => member.recommendationId),
      reason: 'timing narratif contradictoire: apaiser avant expansion active',
    });
  }

  recommendations
    .filter((recommendation) => recommendation.confidence === 'low')
    .forEach((recommendation) => {
      incompatibilities.push({
        incompatibilityId: `${recommendation.recommendationId}:low-confidence-commitment`,
        type: 'low-confidence',
        severity: 'uncertain',
        recommendationIds: [recommendation.recommendationId],
        reason: `${recommendation.discoveryId}: confiance trop basse pour engagement sûr`,
      });
    });

  recommendations
    .filter((recommendation) => recommendation.expiresSoon)
    .forEach((recommendation) => {
      incompatibilities.push({
        incompatibilityId: `${recommendation.recommendationId}:expiring-opportunity`,
        type: 'expiring-opportunity',
        severity: 'urgent',
        recommendationIds: [recommendation.recommendationId],
        reason: `${recommendation.discoveryId}: opportunité qui expire`,
      });
    });

  const timingWindows = bundles
    .flatMap((bundle) => bundle.timingWindows)
    .sort((left, right) => {
      const order = { 'soon-lost': 3, immediate: 2, wait: 1 };
      return (order[right.status] ?? 0) - (order[left.status] ?? 0) || left.clusterLabel.localeCompare(right.clusterLabel);
    });

  const followUpPrompts = buildCulturalFollowUpPrompts(bundles, incompatibilities);
  const promptChoiceComparison = buildCulturalPromptChoiceComparison(followUpPrompts, bundles, timingWindows);
  const promptHistoryDrawer = buildCulturalPromptHistoryDrawer(promptChoiceComparison, promptHistory, regionId);
  const promptFreshnessFilter = buildCulturalPromptFreshnessFilter(promptChoiceComparison, promptHistoryDrawer);

  return {
    state: bundles.length === 0 ? 'quiet' : incompatibilities.length > 0 ? 'needs-choice' : 'compatible',
    summary: bundles.length === 0
      ? 'Aucun bundle d’engagement culturel disponible.'
      : `${bundles.length} bundle${bundles.length > 1 ? 's' : ''} d’engagement culturel, ${incompatibilities.length} incompatibilité${incompatibilities.length > 1 ? 's' : ''}.`,
    bundles,
    incompatibilities,
    timingWindows,
    timingSummary: timingWindows.length === 0
      ? 'Aucune fenêtre de timing culturel active.'
      : `${timingWindows.length} fenêtre${timingWindows.length > 1 ? 's' : ''} de timing culturel après bundle.`,
    followUpPrompts,
    promptChoiceComparison,
    promptHistoryDrawer,
    promptFreshnessFilter,
    dependencyExplanation: bundles.length === 0
      ? 'Aucune dépendance entre marqueurs culturels.'
      : bundles
        .slice(0, 3)
        .map((bundle) => `${bundle.label}: ${bundle.explanation}`)
        .join(' | '),
  };
}

function dedupeAndSort(deltas) {
  return [...new Map(deltas.map((delta) => [
    `${delta.tone}:${delta.label}:${delta.value}:${delta.regionId}`,
    delta,
  ])).values()]
    .sort((left, right) => {
      const toneRank = { risk: 5, opportunity: 4, research: 3, identity: 2, neutral: 1 };
      return (toneRank[right.tone] ?? 0) - (toneRank[left.tone] ?? 0) || left.label.localeCompare(right.label);
    })
    .slice(0, 4);
}

export function buildCultureTurnReportDeltas({
  turn = 1,
  selectedRegionId,
  selectedMarker = null,
  selectedCluster = null,
  localTimeline = null,
  consequenceChips = [],
  previousMarker = null,
  momentumFilter = 'all',
  activeRecommendations = [],
  promptHistory = [],
} = {}) {
  const regionId = normalizeText(selectedRegionId ?? selectedMarker?.regionId ?? selectedCluster?.regionIds?.[0], 'province');
  const timelineRecap = buildDiscoveryTimelineRecap(localTimeline, selectedMarker, selectedCluster, regionId);
  const influenceDiffs = buildInfluenceDiffs(selectedMarker, previousMarker, selectedCluster, regionId);
  const momentumLayer = buildCulturalMomentumLayer({
    regionId,
    selectedMarker,
    selectedCluster,
    timelineRecap,
    influenceDiffs,
    momentumFilter,
  });
  const stabilizationRecommendations = buildCultureStabilizationRecommendations(momentumLayer);
  const recommendationCoherence = buildCultureRecommendationCoherenceSummary(stabilizationRecommendations, activeRecommendations);
  const commitmentBundles = buildCulturalCommitmentBundles(stabilizationRecommendations, activeRecommendations, promptHistory, regionId);
  const deltas = dedupeAndSort([
    ...buildTimelineDeltas(localTimeline, regionId),
    ...buildMarkerDeltas(selectedMarker, regionId),
    ...buildConsequenceDeltas(consequenceChips, regionId),
  ]);

  if (deltas.length === 0 && timelineRecap.length === 0 && influenceDiffs.length === 0) {
    return {
      state: 'quiet',
      turn,
      regionId,
      summary: 'Aucun delta culture/découverte visible ce tour.',
      deltas: [],
      timelineRecap: [],
      influenceDiffs: [],
      momentumLayer: {
        layerId: `${regionId}:cultural-momentum`,
        regionId,
        activeFilter: momentumFilter,
        availableFilters: ['all', 'opportunity', 'tension', 'watch'],
        summary: 'Aucun momentum culturel pour ce filtre.',
        items: [],
      },
      stabilizationRecommendations: {
        activeFilter: momentumFilter,
        summary: 'Aucune recommandation culturelle pour ce filtre.',
        recommendations: [],
      },
      recommendationCoherence: {
        state: 'quiet',
        activeFilter: momentumFilter,
        summary: 'Aucune cohérence culturelle à synthétiser.',
        trajectoryGroups: [],
        tensions: [],
        explanation: 'Aucun signal récent → recommandation → cohérence.',
        uncertainRecommendationIds: [],
      },
      commitmentBundles: {
        state: 'quiet',
        summary: 'Aucun bundle d’engagement culturel disponible.',
        bundles: [],
        incompatibilities: [],
        timingWindows: [],
        timingSummary: 'Aucune fenêtre de timing culturel active.',
        followUpPrompts: {
          state: 'quiet',
          summary: 'Aucun prompt de suivi culturel après timing.',
          prompts: [],
        },
        promptChoiceComparison: {
          state: 'quiet',
          summary: 'Aucun arbitrage de prompt culturel disponible.',
          entries: [],
          noChoiceRisk: 'Aucun momentum culturel à arbitrer.',
        },
        promptHistoryDrawer: {
          state: 'quiet',
          summary: 'Aucun historique de prompt culturel à afficher.',
          displayLimit: 5,
          regionId,
          currentEntries: [],
          groups: [],
          repetitionSafeguard: 'Aucun prompt courant à protéger contre la répétition.',
          emptyHint: 'Historique léger: comparer seulement les prompts actuels et commencer à mémoriser les décisions.',
        },
        promptFreshnessFilter: {
          state: 'quiet',
          summary: 'Aucun filtre de fraîcheur culturel actif.',
          preferredPromptId: null,
          entries: [],
          fallback: 'Historique court ou ambigu: conserver le classement stable et expliquer la fraîcheur sans masquer les prompts.',
        },
        dependencyExplanation: 'Aucune dépendance entre marqueurs culturels.',
      },
    };
  }

  return {
    state: 'active',
    turn,
    regionId,
    summary: `Tour ${turn}: ${deltas.length} delta${deltas.length > 1 ? 's' : ''} culture/découverte à vérifier, ${influenceDiffs.length} diff${influenceDiffs.length > 1 ? 's' : ''} d’influence.`,
    deltas,
    timelineRecap,
    influenceDiffs,
    momentumLayer,
    stabilizationRecommendations,
    recommendationCoherence,
    commitmentBundles,
  };
}
