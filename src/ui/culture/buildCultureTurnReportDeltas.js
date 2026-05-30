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

function buildCulturalRecommendationRotationPreview(promptFreshnessFilter, promptHistoryDrawer) {
  const entries = promptFreshnessFilter.entries.map((entry) => {
    const historyEntry = promptHistoryDrawer.currentEntries.find((candidate) => candidate.promptId === entry.promptId);
    const alternative = promptFreshnessFilter.entries.find((candidate) => candidate.promptId !== entry.promptId && candidate.freshnessState === 'fresh') ?? null;
    const rotationState = entry.freshnessState === 'fresh'
      ? 'available-now'
      : entry.freshnessState === 'defer'
        ? 'deferred-freshness'
        : alternative
          ? 'review-soon'
          : 'excluded-context';
    const factor = entry.freshnessState === 'fresh'
      ? 'compatibilité'
      : entry.freshnessState === 'defer'
        ? 'historique récent'
        : alternative
          ? 'thème'
          : 'contexte manquant';
    const factorExplanation = rotationState === 'available-now'
      ? `${entry.clusterLabel}: compatible maintenant et sans répétition récente.`
      : rotationState === 'deferred-freshness'
        ? `${entry.clusterLabel}: historique récent trop proche, à revoir après rotation.`
        : rotationState === 'review-soon'
          ? `${entry.clusterLabel}: déjà vu, mais le thème peut revenir après une alternative fraîche.`
          : `${entry.clusterLabel}: écarté faute d’alternative fraîche ou de contexte distinct.`;

    return {
      previewId: `${entry.promptId}:rotation-preview`,
      promptId: entry.promptId,
      promptLabel: entry.promptLabel,
      clusterLabel: entry.clusterLabel,
      rotationState,
      factor,
      factorExplanation,
      alternativePromptId: entry.freshnessState === 'fresh' ? null : alternative?.promptId ?? null,
      alternativeLabel: entry.freshnessState === 'fresh' ? null : alternative?.promptLabel ?? historyEntry?.rotation?.replace ?? 'aucune alternative fraîche visible',
    };
  });

  return {
    state: entries.length === 0
      ? 'quiet'
      : entries.some((entry) => entry.rotationState === 'available-now')
        ? 'ready'
        : entries.some((entry) => entry.rotationState === 'review-soon' || entry.rotationState === 'deferred-freshness')
          ? 'scheduled'
          : 'blocked',
    summary: entries.length === 0
      ? 'Aucun aperçu de rotation culturelle disponible.'
      : `${entries.length} recommandation${entries.length > 1 ? 's' : ''} culturelle${entries.length > 1 ? 's' : ''} planifiée${entries.length > 1 ? 's' : ''} pour rotation.`,
    entries,
    fallback: entries.length === 0 || promptHistoryDrawer.groups.length < 2
      ? 'Fallback stable: historique court ou ambigu, conserver les prompts visibles sans forcer la rotation.'
      : entries.some((entry) => entry.alternativePromptId)
        ? 'Rotation lisible: proposer une alternative fraîche avant de réintroduire les prompts différés.'
        : 'Fallback stable: aucune alternative fraîche sûre, garder le classement actuel et réévaluer au prochain tour.',
  };
}

function buildCulturalRotationCommitmentSummary(recommendationRotationPreview, promptChoiceComparison, bundles, incompatibilities) {
  const entries = recommendationRotationPreview.entries.map((entry) => {
    const comparison = promptChoiceComparison.entries.find((candidate) => candidate.promptId === entry.promptId);
    const bundle = bundles.find((candidate) => entry.promptId.startsWith(candidate.bundleId)) ?? null;
    const unresolvedDependencies = incompatibilities.filter((dependency) => (
      comparison?.recommendationIds ?? []
    ).some((recommendationId) => dependency.recommendationIds.includes(recommendationId)));
    const duration = entry.rotationState === 'available-now'
      ? '1 à 2 tours de suivi culturel'
      : entry.rotationState === 'review-soon'
        ? 'à réévaluer au prochain tour de carte'
        : entry.rotationState === 'deferred-freshness'
          ? 'différer jusqu’à un nouveau signal culturel'
          : 'aucune durée fiable tant que le contexte manque';
    const benefit = bundle
      ? `${bundle.label}: verrouille le bénéfice culturel principal autour de ${entry.clusterLabel}`
      : `${entry.promptLabel}: clarifie le prochain choix culturel visible`;
    const opportunityCost = entry.rotationState === 'available-now'
      ? 'coût narratif/recherche modéré: les autres thèmes restent en file de rotation'
      : entry.rotationState === 'review-soon'
        ? 'coût d’opportunité: retarder évite de répéter un thème déjà vu'
        : entry.rotationState === 'deferred-freshness'
          ? 'coût d’opportunité faible: attendre protège la fraîcheur et laisse une alternative progresser'
          : 'coût d’opportunité incertain: garder les ressources de recherche ouvertes';
    const dependencyWarning = unresolvedDependencies.length > 0
      ? `${unresolvedDependencies.length} dépendance${unresolvedDependencies.length > 1 ? 's' : ''} non résolue${unresolvedDependencies.length > 1 ? 's' : ''}: ${unresolvedDependencies.map((dependency) => dependency.reason).join(' | ')}`
      : entry.rotationState === 'available-now'
        ? 'aucune dépendance bloquante visible avant engagement'
        : 'pas de blocage dur: décision légitime si le contexte narratif le justifie';

    return {
      summaryId: `${entry.promptId}:commitment-summary`,
      promptId: entry.promptId,
      promptLabel: entry.promptLabel,
      clusterLabel: entry.clusterLabel,
      rotationState: entry.rotationState,
      duration,
      benefit,
      opportunityCost,
      dependencyWarning,
      hasUnresolvedDependencies: unresolvedDependencies.length > 0,
      repeatPolicy: entry.rotationState === 'available-now'
        ? 'non répété récemment: peut rester prioritaire'
        : 'répétition récente ou contexte faible: garder dépriorisé et expliqué',
      alternativeLabel: entry.alternativeLabel,
    };
  });
  const selected = entries.find((entry) => entry.rotationState === 'available-now') ?? entries[0] ?? null;

  return {
    state: entries.length === 0
      ? 'quiet'
      : entries.some((entry) => entry.hasUnresolvedDependencies && entry.rotationState === 'available-now')
        ? 'caution'
        : selected?.rotationState === 'available-now'
          ? 'ready'
          : 'defer',
    summary: entries.length === 0
      ? 'Aucun résumé d’engagement culturel disponible.'
      : selected
        ? `${selected.promptLabel}: ${selected.duration}; ${selected.benefit}.`
        : 'Résumé d’engagement culturel en attente.',
    selectedPromptId: selected?.promptId ?? null,
    entries,
  };
}


function buildCulturalFollowThroughAgePriority(recentCommitment, matchingCurrent, selected, turn = 1) {
  if (!recentCommitment) {
    return {
      state: selected ? 'next-choice' : 'none',
      label: selected ? 'nouvelle priorité' : 'aucun engagement actif',
      ageTurns: 0,
      priority: selected ? 1 : 0,
      relevance: selected ? 'orienter le prochain choix sans masquer les nouvelles opportunités' : 'aucune promesse culturelle active à vieillir',
      almostExpired: false,
      stale: false,
    };
  }

  const ageTurns = Math.max(0, Number.isFinite(recentCommitment.turn) ? turn - recentCommitment.turn : 1);
  const currentStillRelevant = matchingCurrent && matchingCurrent.clusterLabel === recentCommitment.clusterLabel;
  const rotationState = matchingCurrent?.rotationState ?? 'missing';
  const almostExpired = ageTurns >= 2 || rotationState === 'deferred-freshness' || rotationState === 'review-soon';
  const stale = ageTurns >= 3 || rotationState === 'excluded-context' || !currentStillRelevant;
  const priority = stale
    ? 1
    : almostExpired
      ? 3
      : matchingCurrent?.rotationState === 'available-now'
        ? 4
        : 2;

  return {
    state: stale ? 'stale' : almostExpired ? 'expiring' : 'current',
    label: stale ? 'pertinence perdue' : almostExpired ? 'presque périmé' : 'suivi actif',
    ageTurns,
    priority,
    relevance: stale
      ? 'ne pas laisser cet ancien rappel masquer les opportunités fraîches'
      : almostExpired
        ? 'valider maintenant ou remplacer par une opportunité plus fraîche'
        : 'suivi encore utile si un signal visible confirme la promesse',
    almostExpired,
    stale,
  };
}

function buildCulturalCommitmentFollowThroughReminder(rotationCommitmentSummary, promptHistoryDrawer, turn = 1) {
  const recentCommitment = promptHistoryDrawer.groups
    .flatMap((group) => group.entries)
    .filter((entry) => entry.source === 'history')
    .filter((entry) => ['chosen', 'committed', 'confirmed', 'accepted'].includes(entry.choiceState))
    .sort((left, right) => (right.turn ?? 0) - (left.turn ?? 0))[0] ?? null;
  const selected = rotationCommitmentSummary.entries.find((entry) => entry.promptId === rotationCommitmentSummary.selectedPromptId)
    ?? rotationCommitmentSummary.entries[0]
    ?? null;

  if (!recentCommitment) {
    const agePriority = buildCulturalFollowThroughAgePriority(null, null, selected, turn);

    return {
      state: 'fallback',
      reminderId: 'culture-commitment:follow-through:fallback',
      summary: 'Aucun engagement culturel récent traçable: afficher le prochain choix recommandé sans inventer de promesse passée.',
      sourcePromptLabel: null,
      clusterLabel: selected?.clusterLabel ?? null,
      lastTurn: null,
      agePriority,
      priorityLabel: `${agePriority.label} · priorité ${agePriority.priority}/4`,
      nextCheck: selected
        ? `Vérifier si ${selected.clusterLabel} peut encore suivre ${selected.promptLabel}.`
        : 'Continuer à surveiller les signaux culturels visibles avant d’annoncer un suivi.',
      expectedAction: selected?.hasUnresolvedDependencies
        ? selected.dependencyWarning
        : 'attendre un engagement culturel explicite avant de rappeler une promesse',
    };
  }

  const followTurn = recentCommitment.turn ? recentCommitment.turn + 1 : turn;
  const matchingCurrent = rotationCommitmentSummary.entries.find((entry) => entry.clusterLabel === recentCommitment.clusterLabel)
    ?? selected;
  const hasDependency = matchingCurrent?.hasUnresolvedDependencies === true;
  const agePriority = buildCulturalFollowThroughAgePriority(recentCommitment, matchingCurrent, selected, turn);

  return {
    state: agePriority.stale ? 'stale' : hasDependency || agePriority.almostExpired ? 'watch' : 'ready',
    reminderId: `${recentCommitment.historyId}:follow-through-reminder`,
    summary: `${recentCommitment.clusterLabel}: engagement à suivre au tour ${followTurn} — ${recentCommitment.outcome}.`,
    sourcePromptLabel: recentCommitment.promptLabel,
    clusterLabel: recentCommitment.clusterLabel,
    lastTurn: recentCommitment.turn ?? null,
    agePriority,
    priorityLabel: `${agePriority.label} · ${agePriority.ageTurns} tour${agePriority.ageTurns > 1 ? 's' : ''} · priorité ${agePriority.priority}/4`,
    nextCheck: agePriority.stale
      ? `Remplacer ou reconfirmer ${recentCommitment.promptLabel}: le rappel a perdu sa pertinence.`
      : agePriority.almostExpired
        ? `Décider ce tour si ${recentCommitment.promptLabel} mérite encore une action.`
        : hasDependency
          ? `Lever la dépendance avant de prolonger ${recentCommitment.promptLabel}.`
          : `Confirmer que ${recentCommitment.promptLabel} produit encore un signal culturel visible.`,
    expectedAction: matchingCurrent
      ? `${matchingCurrent.duration}; ${matchingCurrent.repeatPolicy}; ${agePriority.relevance}`
      : `réévaluer le suivi culturel sans répéter tout l’historique; ${agePriority.relevance}`,
  };
}


function buildCulturalBundleCleanupPrompts(groups, commitmentFollowThroughReminder, promptHistoryDrawer) {
  const repetitionSafeguard = promptHistoryDrawer.repetitionSafeguard;

  return groups.map((group) => {
    const currentEntries = group.details.filter((entry) => entry.source === 'current');
    const historyEntries = group.details.filter((entry) => entry.source === 'history');
    const hasCurrentFollowUp = currentEntries.length > 0;
    const replacementEntry = currentEntries[0]
      ?? groups.find((candidate) => candidate.bundleId !== group.bundleId)?.details.find((entry) => entry.source === 'current')
      ?? null;
    const reminderTargetsGroup = commitmentFollowThroughReminder.clusterLabel === group.clusterLabel;
    const isStaleReminder = reminderTargetsGroup && commitmentFollowThroughReminder.agePriority?.stale === true;
    const resolvedWithoutCurrentAction = !hasCurrentFollowUp && historyEntries.length > 0 && !isStaleReminder;
    const riskPersists = group.state === 'urgent'
      || group.state === 'ready'
      || (group.state === 'context' && hasCurrentFollowUp)
      || (reminderTargetsGroup && commitmentFollowThroughReminder.agePriority?.priority >= 3 && !isStaleReminder);
    const cleanupState = isStaleReminder || group.state === 'stale'
      ? 'obsolete'
      : riskPersists
        ? 'risk-persists'
        : resolvedWithoutCurrentAction || group.state === 'context'
          ? 'resolved'
          : 'review';
    const action = cleanupState === 'obsolete'
      ? (replacementEntry ? `remplacer par ${replacementEntry.promptLabel}` : 'archiver le bundle obsolète')
      : cleanupState === 'resolved'
        ? 'archiver le bundle résolu'
        : cleanupState === 'risk-persists'
          ? 'conserver: risque culturel encore actif'
          : 'revoir au prochain tour avant archivage';
    const reason = cleanupState === 'obsolete'
      ? `${group.clusterLabel}: ${commitmentFollowThroughReminder.agePriority?.relevance ?? 'ancien suivi dépassé par le contexte récent'}.`
      : cleanupState === 'resolved'
        ? `${group.clusterLabel}: aucun suivi courant immédiat; l’historique suffit comme trace lisible.`
        : cleanupState === 'risk-persists'
          ? `${group.clusterLabel}: ${group.avoidedLoss}; ${commitmentFollowThroughReminder.nextCheck}`
          : `${group.clusterLabel}: état à surveiller sans relancer toute la répétition.`;

    return {
      cleanupId: `${group.bundleId}:cleanup-prompt`,
      bundleId: group.bundleId,
      clusterLabel: group.clusterLabel,
      state: cleanupState,
      action,
      reason,
      safeguard: repetitionSafeguard,
      replacesPromptLabel: cleanupState === 'obsolete' ? replacementEntry?.promptLabel ?? null : null,
    };
  });
}

function buildCulturalBundleFalloutPreview(cleanupPrompts) {
  const falloutCandidates = cleanupPrompts
    .map((prompt) => {
      const consequenceType = prompt.state === 'obsolete'
        ? 'opportunity-lost'
        : prompt.state === 'risk-persists'
          ? 'tension'
          : prompt.state === 'review'
            ? 'consolidation-delay'
            : 'none';
      const severity = consequenceType === 'opportunity-lost'
        ? 3
        : consequenceType === 'tension'
          ? 2
          : consequenceType === 'consolidation-delay'
            ? 1
            : 0;
      const consequence = consequenceType === 'opportunity-lost'
        ? `${prompt.clusterLabel}: opportunité fraîche masquée si le bundle obsolète reste visible.`
        : consequenceType === 'tension'
          ? `${prompt.clusterLabel}: tension culturelle maintenue si le nettoyage est ignoré.`
          : consequenceType === 'consolidation-delay'
            ? `${prompt.clusterLabel}: consolidation retardée d’un tour si le bundle n’est pas réévalué.`
            : `${prompt.clusterLabel}: aucun fallout immédiat détecté.`;

      return {
        falloutId: `${prompt.cleanupId}:fallout-preview`,
        bundleId: prompt.bundleId,
        clusterLabel: prompt.clusterLabel,
        cleanupState: prompt.state,
        consequenceType,
        consequence,
        severity,
        exceedsThreshold: severity >= 2,
        minimalCleanupAction: severity >= 2 ? prompt.action : null,
      };
    })
    .sort((left, right) => right.severity - left.severity || left.clusterLabel.localeCompare(right.clusterLabel));
  const priority = falloutCandidates.find((candidate) => candidate.severity > 0) ?? null;

  return {
    state: !priority
      ? 'quiet'
      : priority.exceedsThreshold
        ? 'action-needed'
        : 'watch',
    summary: !priority
      ? 'Aucun fallout culturel si les bundles restent en place ce tour.'
      : `${priority.consequence}${priority.exceedsThreshold ? ` Cleanup minimal: ${priority.minimalCleanupAction}.` : ''}`,
    priorityBundleId: priority?.bundleId ?? null,
    affectedCulture: priority?.clusterLabel ?? null,
    consequenceType: priority?.consequenceType ?? 'none',
    consequence: priority?.consequence ?? 'Aucun fallout immédiat détecté.',
    severity: priority?.severity ?? 0,
    minimalCleanupAction: priority?.minimalCleanupAction ?? null,
    entries: falloutCandidates,
  };
}

function buildCulturalBundleReplacementRecommendations(groups, cleanupPrompts, falloutPreview) {
  const candidates = cleanupPrompts
    .map((prompt) => {
      const group = groups.find((candidate) => candidate.bundleId === prompt.bundleId) ?? null;
      const fallout = falloutPreview.entries.find((entry) => entry.bundleId === prompt.bundleId) ?? null;
      const freshDetail = group?.details.find((detail) => detail.source === 'current')
        ?? groups.find((candidate) => candidate.bundleId !== prompt.bundleId)?.details.find((detail) => detail.source === 'current')
        ?? null;
      const highRisk = prompt.state === 'obsolete' || (fallout?.severity ?? 0) >= 2;
      if (!highRisk) {
        return null;
      }
      const alternativeType = prompt.state === 'obsolete' && freshDetail
        ? 'renew'
        : prompt.state === 'obsolete'
          ? 'abandon'
          : 'replan';
      const action = alternativeType === 'renew'
        ? `renouveler via ${freshDetail.promptLabel}`
        : alternativeType === 'abandon'
          ? 'abandonner ce bundle obsolète'
          : 'replanifier après cleanup du risque';
      const avoidedConsequence = fallout?.consequence
        ?? (prompt.state === 'obsolete'
          ? `${prompt.clusterLabel}: opportunité fraîche masquée.`
          : `${prompt.clusterLabel}: tension culturelle prolongée.`);
      const urgencyScore = fallout?.severity ?? (prompt.state === 'obsolete' ? 3 : 1);
      const payoffScore = alternativeType === 'renew'
        ? 3
        : alternativeType === 'replan'
          ? 2
          : 1;
      const urgency = urgencyScore >= 3
        ? 'immédiate'
        : urgencyScore === 2
          ? 'haute'
          : 'modérée';
      const payoff = payoffScore >= 3
        ? 'fort'
        : payoffScore === 2
          ? 'moyen'
          : 'léger';
      const replacementMode = avoidedConsequence.includes('opportunité') && alternativeType === 'renew'
        ? 'opportunistic'
        : 'defensive';
      const priority = urgencyScore * 2 + payoffScore + (replacementMode === 'opportunistic' ? 1 : 0);
      const skipAcceptable = urgencyScore <= 1;
      const skipConsequenceType = skipAcceptable
        ? 'acceptable-delay'
        : replacementMode === 'opportunistic'
          ? 'missed-bonus'
          : 'unhandled-loss';
      const nextReviewWindow = urgencyScore >= 3
        ? 'prochain tour avant commit'
        : urgencyScore === 2
          ? 'début du prochain tour culturel'
          : 'prochaine rotation culturelle';
      const skipConsequence = skipAcceptable
        ? `${prompt.clusterLabel}: report acceptable, urgence basse; reconsidérer à la ${nextReviewWindow}.`
        : replacementMode === 'opportunistic'
          ? `${prompt.clusterLabel}: bonus culturel probablement manqué si ${action} attend un tour.`
          : `${prompt.clusterLabel}: perte évitée non traitée au prochain tour si ${action} est ignoré.`;

      return {
        replacementId: `${prompt.cleanupId}:replacement`,
        bundleId: prompt.bundleId,
        clusterLabel: prompt.clusterLabel,
        state: alternativeType,
        action,
        replacementPromptLabel: freshDetail?.promptLabel ?? null,
        avoidedConsequence,
        urgency,
        urgencyScore,
        payoff,
        payoffScore,
        mode: replacementMode,
        rankReason: `${urgency} urgence · payoff ${payoff} · ${replacementMode === 'defensive' ? 'évite une perte' : 'ouvre un bonus'}`,
        skipConsequenceType,
        skipConsequence,
        skipAcceptable,
        nextReviewWindow,
        reason: `${prompt.reason} Alternative compacte: ${action}.`,
        priority,
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.priority - left.priority || right.urgencyScore - left.urgencyScore || right.payoffScore - left.payoffScore || left.clusterLabel.localeCompare(right.clusterLabel))
    .slice(0, 3)
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
      recommended: index === 0,
    }));
  const top = candidates[0] ?? null;

  return {
    state: candidates.length === 0
      ? 'quiet'
      : candidates.some((candidate) => candidate.state === 'renew' || candidate.state === 'abandon')
        ? 'action-needed'
        : 'replan',
    summary: !top
      ? 'Aucun remplacement culturel nécessaire ce tour.'
      : `${top.clusterLabel}: #1 ${top.action} — ${top.rankReason}; évite ${top.avoidedConsequence}`,
    primaryReplacementId: top?.replacementId ?? null,
    skipConsequenceSummary: top?.skipConsequence ?? 'Fallback: conséquence au prochain tour non calculable.',
    nextReviewWindow: top?.nextReviewWindow ?? null,
    rankingFallback: candidates.length === 0
      ? 'Fallback: aucun score disponible, garder les bundles dans l’ordre actuel.'
      : 'Classement par urgence du fallout, payoff du remplacement, puis type défensif/opportuniste.',
    entries: candidates,
  };
}

function buildCulturalSafeToDeferBundles(groups, cleanupPrompts, falloutPreview, replacementRecommendations, visiblePriorities = []) {
  const urgentReplacementIds = new Set(replacementRecommendations.entries.map((entry) => entry.bundleId));
  const candidates = cleanupPrompts
    .map((prompt) => {
      const group = groups.find((candidate) => candidate.bundleId === prompt.bundleId) ?? null;
      const fallout = falloutPreview.entries.find((entry) => entry.bundleId === prompt.bundleId) ?? null;
      const hasActiveSupport = (group?.details ?? []).some((detail) => detail.source === 'current');
      const lowFallout = (fallout?.severity ?? 0) <= 1;
      const alreadyCovered = prompt.state === 'resolved' || (hasActiveSupport && prompt.state === 'review');
      const safe = !urgentReplacementIds.has(prompt.bundleId) && (lowFallout || alreadyCovered);

      if (!safe) {
        return null;
      }

      const condition = alreadyCovered
        ? (hasActiveSupport
          ? 'soutien actif déjà visible dans la rotation culturelle'
          : 'risque stabilisé par l’historique lisible')
        : 'fallout faible au prochain tour';
      const nextReviewWindow = lowFallout ? 'prochaine rotation culturelle' : 'prochain tour culturel';
      const riskTrigger = hasActiveSupport
        ? 'le soutien actif disparaît'
        : lowFallout
          ? 'le fallout dépasse le niveau faible'
          : 'aucun suivi courant ne couvre le bundle';
      const turningSignal = hasActiveSupport
        ? 'perte du soutien actif'
        : lowFallout
          ? 'fallout en hausse'
          : 'suivi absent';
      const riskThreshold = `Devient risqué si ${riskTrigger} avant la ${nextReviewWindow}.`;
      const deadlineStatus = hasActiveSupport ? 'near-deadline' : 'safe-this-turn';
      const deadlineHint = deadlineStatus === 'near-deadline'
        ? 'à revoir dès le prochain tour'
        : 'sûr ce tour';

      const deadlinePressure = deadlineStatus === 'near-deadline'
        ? 2
        : deadlineStatus === 'safe-this-turn'
          ? 1
          : 0;
      const payoffScore = group?.unlockScore ?? 0;
      const currentSupport = (group?.details ?? []).find((detail) => detail.source === 'current') ?? null;
      const minimalRevisitAction = currentSupport
        ? `confirmer ${currentSupport.promptLabel}`
        : null;

      return {
        deferId: `${prompt.cleanupId}:safe-to-defer`,
        bundleId: prompt.bundleId,
        clusterLabel: prompt.clusterLabel,
        state: 'safe-to-defer',
        label: 'Peut attendre',
        condition,
        reason: `${prompt.clusterLabel}: ${condition}; ${prompt.action}.`,
        riskThreshold,
        turningSignal,
        deadlineHint,
        deadlineStatus,
        deadlinePressure,
        payoffScore,
        priorityReason: deadlinePressure > 0
          ? `${deadlineHint}; payoff ${payoffScore}`
          : `fenêtre non calculable; payoff ${payoffScore}`,
        minimalRevisitAction,
        nextReviewWindow,
        falloutSeverity: fallout?.severity ?? 0,
      };
    })
    .filter(Boolean);
  const hasDeadlineData = candidates.some((candidate) => candidate.deadlinePressure > 0);
  const sortedCandidates = [...candidates].sort((left, right) => {
    if (!hasDeadlineData) {
      return left.falloutSeverity - right.falloutSeverity || left.clusterLabel.localeCompare(right.clusterLabel);
    }

    return right.deadlinePressure - left.deadlinePressure
      || right.payoffScore - left.payoffScore
      || left.falloutSeverity - right.falloutSeverity
      || left.clusterLabel.localeCompare(right.clusterLabel);
  });
  const rankedCandidates = sortedCandidates.map((candidate, index) => {
    const revisitPriority = sortedCandidates.length > 1 && index === 0 ? 'next' : 'later';
    const missedFallout = falloutPreview.entries.find((entry) => entry.bundleId === candidate.bundleId) ?? null;
    const missedWindowConsequence = revisitPriority === 'next'
      ? (missedFallout?.severity > 0
        ? missedFallout.consequence
        : `${candidate.clusterLabel}: ${candidate.riskThreshold}`)
      : null;
    const minimalSafeAction = revisitPriority === 'next' ? candidate.minimalRevisitAction : null;
    const preventedConsequence = minimalSafeAction && missedWindowConsequence
      ? (missedFallout?.consequenceType === 'consolidation-delay'
        ? 'évite une consolidation retardée'
        : missedFallout?.consequenceType === 'tension'
          ? 'évite de maintenir la tension culturelle'
          : missedFallout?.consequenceType === 'opportunity-lost'
            ? 'évite de masquer l’opportunité fraîche'
            : 'évite de franchir le seuil de risque')
      : null;
    const minimalActionAcceptableUntil = minimalSafeAction ? candidate.nextReviewWindow : null;
    const recommendedAction = minimalSafeAction
      ? `revoir ${candidate.clusterLabel} avant ${candidate.nextReviewWindow}`
      : null;
    const lateRiskyAction = minimalSafeAction
      ? `agir après ${candidate.nextReviewWindow} avec ${candidate.turningSignal}`
      : null;
    const minimalActionThresholdReason = minimalSafeAction
      ? (candidate.deadlineStatus === 'near-deadline'
        ? `${candidate.deadlineHint}: la petite action cesse de suffire si ${candidate.turningSignal}.`
        : `payoff ${candidate.payoffScore}: la petite action reste seulement valable jusqu’à la ${candidate.nextReviewWindow}.`)
      : null;
    const recommendedBeyondMinimumBenefit = missedWindowConsequence
      ? buildCulturalBeyondMinimumBenefit(candidate, missedFallout, missedWindowConsequence)
      : null;
    const immediateSynergy = recommendedBeyondMinimumBenefit
      ? buildCulturalBeyondMinimumSynergy(candidate, visiblePriorities, sortedCandidates, missedWindowConsequence)
      : null;
    const deferLadderSummary = buildCulturalDeferLadderSummary({ ...candidate, minimalSafeAction }, recommendedBeyondMinimumBenefit, immediateSynergy);

    return {
      ...candidate,
      revisitRank: sortedCandidates.length > 1 ? index + 1 : null,
      revisitPriority,
      missedWindowConsequence,
      missedWindowConsequenceType: revisitPriority === 'next'
        ? missedFallout?.consequenceType ?? 'threshold-risk'
        : null,
      missedWindowSeverity: revisitPriority === 'next'
        ? missedFallout?.severity ?? candidate.deadlinePressure
        : 0,
      minimalSafeAction,
      preventedConsequence,
      minimalActionAcceptableUntil,
      recommendedAction,
      lateRiskyAction,
      minimalActionThresholdReason,
      recommendedBeyondMinimumBenefit,
      immediateSynergy,
      deferLadderSummary,
    };
  });
  const top = rankedCandidates[0] ?? null;
  const primaryMissedWindowConsequence = top?.revisitPriority === 'next'
    ? top.missedWindowConsequence
    : null;
  const primaryMinimalSafeAction = top?.minimalSafeAction ?? null;
  const primaryMinimalActionThreshold = top?.minimalActionAcceptableUntil ?? null;

  return {
    state: rankedCandidates.length === 0 ? 'none' : 'ready',
    summary: top
      ? `${top.clusterLabel}: Peut attendre — ${top.deadlineHint}; ${top.riskThreshold}`
      : 'Aucun bundle culturel sûr à reporter ce tour.',
    primaryDeferId: rankedCandidates.length > 1 ? top?.deferId ?? null : null,
    primaryMissedWindowConsequence,
    primaryMinimalSafeAction,
    primaryMinimalActionThreshold,
    minimalSafeActionFallback: primaryMinimalSafeAction
      ? 'Action minimale calculée depuis le suivi courant du bundle reporté.'
      : 'Fallback: aucune action minimale sûre connue pour conserver ce report.',
    missedWindowFallback: primaryMissedWindowConsequence
      ? 'Conséquence calculée depuis le fallout/payoff existant du bundle reporté.'
      : 'Fallback: aucune conséquence de fenêtre manquée à afficher sans action reportée prioritaire.',
    priorityFallback: hasDeadlineData
      ? 'Priorité par pression de délai, puis payoff culturel.'
      : 'Fallback: aucune fenêtre de délai calculable, garder l’ordre stable par risque faible puis culture.',
    entries: rankedCandidates,
  };
}

function buildCulturalDeferLadderSummary(candidate, recommendedBeyondMinimumBenefit, immediateSynergy) {
  if (!recommendedBeyondMinimumBenefit || !immediateSynergy) {
    return null;
  }

  const firstFollowUpReason = buildCulturalFirstFollowUpReason(candidate, recommendedBeyondMinimumBenefit, immediateSynergy);
  const sourceAction = normalizeText(immediateSynergy.sourceAction ?? '');

  if (/attendre|observer/.test(sourceAction)) {
    return {
      state: 'observe-first',
      label: 'Observer',
      decision: 'attendre/observer reste le meilleur premier suivi visible',
      summary: `Observer: ${candidate.deadlineHint}; ${immediateSynergy.summary}`,
      firstFollowUpReason,
    };
  }

  if (immediateSynergy.expiryWarning) {
    return {
      state: 'act-now',
      label: 'Agir maintenant',
      decision: 'agir maintenant pour capturer la synergie avant expiration',
      summary: `Agir maintenant: ${immediateSynergy.expiryWarning.summary}`,
      firstFollowUpReason,
    };
  }

  if (candidate.deadlineStatus === 'near-deadline') {
    return {
      state: 'minimum-sufficient',
      label: 'Minimum suffisant',
      decision: 'faire le minimum garde la fenêtre sans perdre la synergie visible',
      summary: `Minimum suffisant: ${candidate.minimalRevisitAction}; ${immediateSynergy.summary}`,
      firstFollowUpReason,
    };
  }

  return {
    state: 'safe-defer',
    label: 'Report sûr',
    decision: 'reporter sans perdre la synergie visible',
    summary: `Report sûr: ${candidate.deadlineHint}; ${immediateSynergy.summary}`,
    firstFollowUpReason,
  };
}

function buildCulturalFirstFollowUpReason(candidate, recommendedBeyondMinimumBenefit, immediateSynergy) {
  const expiryCue = immediateSynergy.expiryWarning
    ? `expiration: ${immediateSynergy.expiryWarning.summary}`
    : 'expiration: aucune expiration visible';
  const deferredTrack = candidate.minimalSafeAction
    ? `piste différée: ${candidate.minimalSafeAction}`
    : `piste différée: ${candidate.condition}`;
  const localSignal = candidate.turningSignal
    ? `signal local: ${candidate.turningSignal}`
    : `signal local: ${candidate.deadlineHint}`;

  return {
    state: immediateSynergy.expiryWarning ? 'expiry-driven' : candidate.deadlineStatus,
    label: 'Pourquoi ce suivi',
    synergy: immediateSynergy.summary,
    expiryCue,
    deferredTrack,
    localSignal,
    summary: `${immediateSynergy.summary}; ${expiryCue}; ${deferredTrack}; ${localSignal}.`,
    payoffCue: recommendedBeyondMinimumBenefit.concreteGain,
  };
}

function buildCulturalBeyondMinimumSynergy(candidate, visiblePriorities, sortedCandidates, missedWindowConsequence) {
  const safePriorities = visiblePriorities.filter((priority) => priority.confidence !== 'low' && priority.level !== 'fragile');
  const sameClusterPriority = safePriorities
    .filter((priority) => priority.cultureName === candidate.clusterLabel)
    .sort((left, right) => Number(right.expiresSoon === true) - Number(left.expiresSoon === true))[0];
  const neighboringPriority = safePriorities.find((priority) => priority.cultureName !== candidate.clusterLabel && priority.action !== 'attendre') ?? null;
  const narrativePrompt = normalizeText(`${candidate.minimalRevisitAction ?? ''} ${candidate.reason ?? ''}`);

  if (sameClusterPriority?.discoveryId && sameClusterPriority.discoveryId !== 'signal culturel') {
    const synergy = {
      state: 'synergy-this-turn',
      label: 'Synergie ce tour',
      sourceType: 'discovery',
      sourceLabel: sameClusterPriority.discoveryId,
      sourceAction: sameClusterPriority.action,
      benefit: `${sameClusterPriority.discoveryId} renforce ${sameClusterPriority.action} avec ${candidate.clusterLabel}`,
      avoidedRisk: `évite de séparer la découverte du suivi reporté: ${missedWindowConsequence}`,
      summary: `synergie ce tour: ${sameClusterPriority.discoveryId} + ${candidate.clusterLabel}; ${sameClusterPriority.action} sécurisé.`,
    };
    return {
      ...synergy,
      expiryWarning: buildCulturalSynergyExpiryWarning(synergy, candidate, sameClusterPriority),
    };
  }

  if (/récit|recit|narrati/i.test(narrativePrompt)) {
    const synergy = {
      state: 'synergy-this-turn',
      label: 'Synergie ce tour',
      sourceType: 'narrative',
      sourceLabel: candidate.minimalRevisitAction ?? candidate.clusterLabel,
      sourceAction: candidate.minimalRevisitAction ?? 'suivre le récit',
      benefit: `le récit actif devient un suivi culturel immédiat pour ${candidate.clusterLabel}`,
      avoidedRisk: `évite de laisser le récit dépasser la fenêtre sûre: ${missedWindowConsequence}`,
      summary: `synergie ce tour: récit actif + ${candidate.clusterLabel}; suivi narratif sécurisé.`,
    };
    return {
      ...synergy,
      expiryWarning: buildCulturalSynergyExpiryWarning(synergy, candidate, null),
    };
  }

  if (neighboringPriority && sortedCandidates.length > 1) {
    const synergy = {
      state: 'synergy-this-turn',
      label: 'Synergie ce tour',
      sourceType: 'neighbor-cluster',
      sourceLabel: neighboringPriority.cultureName,
      sourceAction: neighboringPriority.action,
      benefit: `${candidate.clusterLabel} reste aligné avec ${neighboringPriority.cultureName}`,
      avoidedRisk: `évite que le cluster voisin reprenne seul la priorité: ${missedWindowConsequence}`,
      summary: `synergie ce tour: ${candidate.clusterLabel} + ${neighboringPriority.cultureName}; priorités proches alignées.`,
    };
    return {
      ...synergy,
      expiryWarning: buildCulturalSynergyExpiryWarning(synergy, candidate, neighboringPriority),
    };
  }

  return null;
}

function buildCulturalSynergyExpiryWarning(synergy, candidate, priority) {
  const expiresBeforeReview = priority?.expiresSoon === true;

  if (!expiresBeforeReview) {
    return null;
  }

  const reviewWindow = candidate.nextReviewWindow ?? priority?.timingLabel ?? 'prochaine revue culturelle';
  const expiryCause = priority?.timingLabel ?? 'priorité visible temporaire';

  return {
    state: 'expires-before-review',
    label: 'expire avant revue',
    reviewWindow,
    expiryCause,
    lostBenefit: `${synergy.sourceLabel} ne renforcera plus ${candidate.clusterLabel} de façon sûre`,
    summary: `expire avant revue: ${expiryCause}; agir maintenant capture ${synergy.sourceLabel}.`,
  };
}

function buildCulturalBeyondMinimumBenefit(candidate, missedFallout, missedWindowConsequence) {
  const recommendedAction = candidate.action
    ? `faire maintenant: ${candidate.action}`
    : `traiter ${candidate.clusterLabel} maintenant`;
  const nextTurnAvoidance = missedFallout?.consequenceType === 'consolidation-delay'
    ? 'évite une urgence de consolidation au prochain tour'
    : missedFallout?.consequenceType === 'opportunity-lost'
      ? 'évite une perte de payoff culturel au prochain tour'
      : missedFallout?.consequenceType === 'replacement-forced'
        ? 'évite un remplacement forcé au prochain tour'
        : missedFallout?.consequenceType === 'tension'
          ? 'évite de maintenir une tension culturelle au prochain tour'
          : 'évite de transformer le report en seuil risqué au prochain tour';
  const concreteGain = candidate.payoffScore > 0
    ? `gain concret: sécurise payoff ${candidate.payoffScore} sans attendre la bascule`
    : 'gain concret: conserve la fenêtre sûre sans créer d’urgence artificielle';

  return {
    state: 'recommended-over-minimum',
    label: 'Au-delà du minimum',
    recommendedAction,
    concreteGain,
    nextTurnAvoidance,
    avoids: missedWindowConsequence,
    summary: `${recommendedAction} — ${concreteGain}; ${nextTurnAvoidance}.`,
  };
}

function buildCulturalFollowThroughBundlePlan(rotationCommitmentSummary, promptHistoryDrawer, commitmentFollowThroughReminder, visiblePriorities = []) {
  const groups = promptHistoryDrawer.groups.map((group) => {
    const currentEntries = group.entries.filter((entry) => entry.source === 'current');
    const historyEntries = group.entries.filter((entry) => entry.source === 'history');
    const matchingCommitment = rotationCommitmentSummary.entries.find((entry) => entry.clusterLabel === group.clusterLabel)
      ?? null;
    const isReminderGroup = commitmentFollowThroughReminder.clusterLabel === group.clusterLabel;
    const agePriority = isReminderGroup ? commitmentFollowThroughReminder.agePriority : null;
    const unlockScore = (agePriority?.priority ?? 0)
      + (matchingCommitment && !matchingCommitment.hasUnresolvedDependencies ? 2 : 0)
      + currentEntries.length
      + Math.min(historyEntries.length, 2);
    const firstDetail = currentEntries[0] ?? historyEntries[0] ?? null;

    return {
      bundleId: `${group.groupId}:follow-through-bundle`,
      clusterLabel: group.clusterLabel,
      theme: group.theme,
      state: agePriority?.stale
        ? 'stale'
        : agePriority?.almostExpired
          ? 'urgent'
          : matchingCommitment?.rotationState === 'available-now'
            ? 'ready'
            : historyEntries.length > 0
              ? 'watch'
              : 'context',
      summary: `${group.clusterLabel}: ${group.entries.length} suivi${group.entries.length > 1 ? 's' : ''} regroupé${group.entries.length > 1 ? 's' : ''} sur ${group.theme}.`,
      groupingReason: historyEntries.length > 0 && currentEntries.length > 0
        ? 'Même région et même thème: comparer la promesse récente avec le suivi proposé.'
        : historyEntries.length > 1
          ? 'Même thème récurrent: traiter ensemble avant de relancer une action.'
          : currentEntries.length > 1
            ? 'Même enjeu actif: choisir un premier suivi au lieu de lire chaque alerte.'
            : 'Même enjeu culturel: garder le contexte visible sans grossir la file.',
      unlockScore,
      bestFirstFollowUp: matchingCommitment
        ? `${matchingCommitment.promptLabel} — ${matchingCommitment.hasUnresolvedDependencies ? matchingCommitment.dependencyWarning : matchingCommitment.benefit}`
        : firstDetail
          ? `${firstDetail.promptLabel} — ${firstDetail.outcome ?? firstDetail.repeatReason ?? 'contexte à confirmer'}`
          : 'Aucun premier suivi disponible.',
      avoidedLoss: agePriority?.stale
        ? 'évite de laisser un ancien suivi masquer une opportunité fraîche'
        : agePriority?.almostExpired
          ? 'évite de perdre la fenêtre avant le prochain tour'
          : matchingCommitment?.benefit ?? 'préserve le contexte culturel groupé',
      detailCount: group.entries.length,
      details: group.entries.map((entry) => ({
        detailId: entry.promptId ?? entry.historyId,
        source: entry.source,
        promptLabel: entry.promptLabel,
        clusterLabel: entry.clusterLabel,
        state: entry.source === 'history' ? entry.choiceState : entry.role,
        note: entry.source === 'history' ? entry.outcome : entry.repeatReason,
      })),
    };
  }).sort((left, right) => right.unlockScore - left.unlockScore || right.detailCount - left.detailCount || left.clusterLabel.localeCompare(right.clusterLabel));
  const top = groups[0] ?? null;
  const cleanupPrompts = buildCulturalBundleCleanupPrompts(groups, commitmentFollowThroughReminder, promptHistoryDrawer);
  const cleanupSummary = cleanupPrompts.length === 0
    ? 'Aucun prompt de nettoyage culturel à proposer.'
    : `${cleanupPrompts.length} prompt${cleanupPrompts.length > 1 ? 's' : ''} de nettoyage: ${cleanupPrompts.map((prompt) => `${prompt.clusterLabel} → ${prompt.action}`).join(' | ')}.`;
  const falloutPreview = buildCulturalBundleFalloutPreview(cleanupPrompts);
  const replacementRecommendations = buildCulturalBundleReplacementRecommendations(groups, cleanupPrompts, falloutPreview);
  const safeToDeferBundles = buildCulturalSafeToDeferBundles(groups, cleanupPrompts, falloutPreview, replacementRecommendations, visiblePriorities);

  return {
    state: groups.length === 0
      ? 'quiet'
      : groups.some((group) => group.state === 'urgent' || group.state === 'stale')
        ? 'actionable'
        : groups.some((group) => group.state === 'ready')
          ? 'ready'
          : 'watch',
    summary: groups.length === 0
      ? 'Aucun plan de suivi culturel groupé.'
      : `${groups.length} plan${groups.length > 1 ? 's' : ''} de suivi culturel groupé${groups.length > 1 ? 's' : ''}; premier: ${top.clusterLabel}.`,
    bestBundleId: top?.bundleId ?? null,
    groups,
    cleanupPrompts,
    cleanupSummary,
    falloutPreview,
    replacementRecommendations,
    safeToDeferBundles,
    detailMode: groups.length === 0
      ? 'Aucun détail individuel à ouvrir.'
      : 'Ouvrir les détails pour vérifier chaque suivi individuel du groupe.',
  };
}

function buildCulturalCommitmentBundles(stabilizationRecommendations, activeRecommendations = [], promptHistory = [], regionId = 'province', turn = 1) {
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
  const recommendationRotationPreview = buildCulturalRecommendationRotationPreview(promptFreshnessFilter, promptHistoryDrawer);
  const rotationCommitmentSummary = buildCulturalRotationCommitmentSummary(recommendationRotationPreview, promptChoiceComparison, bundles, incompatibilities);
  const commitmentFollowThroughReminder = buildCulturalCommitmentFollowThroughReminder(rotationCommitmentSummary, promptHistoryDrawer, turn);
  const followThroughBundlePlan = buildCulturalFollowThroughBundlePlan(rotationCommitmentSummary, promptHistoryDrawer, commitmentFollowThroughReminder, recommendations);

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
    recommendationRotationPreview,
    rotationCommitmentSummary,
    commitmentFollowThroughReminder,
    followThroughBundlePlan,
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
  const commitmentBundles = buildCulturalCommitmentBundles(stabilizationRecommendations, activeRecommendations, promptHistory, regionId, turn);
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
        recommendationRotationPreview: {
          state: 'quiet',
          summary: 'Aucun aperçu de rotation culturelle disponible.',
          entries: [],
          fallback: 'Fallback stable: historique court ou ambigu, conserver les prompts visibles sans forcer la rotation.',
        },
        rotationCommitmentSummary: {
          state: 'quiet',
          summary: 'Aucun résumé d’engagement culturel disponible.',
          selectedPromptId: null,
          entries: [],
        },
        commitmentFollowThroughReminder: {
          state: 'fallback',
          reminderId: 'culture-commitment:follow-through:fallback',
          summary: 'Aucun engagement culturel récent traçable: afficher le prochain choix recommandé sans inventer de promesse passée.',
          sourcePromptLabel: null,
          clusterLabel: null,
          lastTurn: null,
          agePriority: {
            state: 'none',
            label: 'aucun engagement actif',
            ageTurns: 0,
            priority: 0,
            relevance: 'aucune promesse culturelle active à vieillir',
            almostExpired: false,
            stale: false,
          },
          priorityLabel: 'aucun engagement actif · priorité 0/4',
          nextCheck: 'Continuer à surveiller les signaux culturels visibles avant d’annoncer un suivi.',
          expectedAction: 'attendre un engagement culturel explicite avant de rappeler une promesse',
        },
        followThroughBundlePlan: {
          state: 'quiet',
          summary: 'Aucun plan de suivi culturel groupé.',
          bestBundleId: null,
          groups: [],
          cleanupPrompts: [],
          cleanupSummary: 'Aucun prompt de nettoyage culturel à proposer.',
          falloutPreview: {
            state: 'quiet',
            summary: 'Aucun fallout culturel si les bundles restent en place ce tour.',
            priorityBundleId: null,
            affectedCulture: null,
            consequenceType: 'none',
            consequence: 'Aucun fallout immédiat détecté.',
            severity: 0,
            minimalCleanupAction: null,
            entries: [],
          },
          replacementRecommendations: {
            state: 'quiet',
            summary: 'Aucun remplacement culturel nécessaire ce tour.',
            primaryReplacementId: null,
            skipConsequenceSummary: 'Fallback: conséquence au prochain tour non calculable.',
            nextReviewWindow: null,
            rankingFallback: 'Fallback: aucun score disponible, garder les bundles dans l’ordre actuel.',
            entries: [],
          },
          safeToDeferBundles: {
            state: 'none',
            summary: 'Aucun bundle culturel sûr à reporter ce tour.',
            primaryDeferId: null,
            primaryMissedWindowConsequence: null,
            primaryMinimalSafeAction: null,
            primaryMinimalActionThreshold: null,
            minimalSafeActionFallback: 'Fallback: aucune action minimale sûre connue pour conserver ce report.',
            missedWindowFallback: 'Fallback: aucune conséquence de fenêtre manquée à afficher sans action reportée prioritaire.',
            priorityFallback: 'Fallback: aucune fenêtre de délai calculable, garder l’ordre stable par risque faible puis culture.',
            entries: [],
          },
          detailMode: 'Aucun détail individuel à ouvrir.',
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
