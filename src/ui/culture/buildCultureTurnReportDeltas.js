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
  };
}
