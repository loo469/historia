const SEVERITY_BY_TONE = Object.freeze({
  opportunity: 4,
  risk: 3,
  research: 2,
  identity: 1,
  neutral: 0,
});

function normalizeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function normalizeRegion(value, fallback = 'province') {
  return normalizeText(value, fallback);
}

function buildChip({ tone, label, explanation, cultureName, regionId, severity, sourceId }) {
  return {
    chipId: `${tone}:${regionId}:${cultureName}:${label}:${sourceId ?? 'source'}`,
    tone,
    label,
    explanation,
    cultureName,
    regionId,
    severity,
  };
}

function dedupeAndSort(chips) {
  const chipsByKey = new Map();

  for (const chip of chips) {
    const key = `${chip.tone}:${chip.label}:${chip.cultureName}:${chip.regionId}`;
    const existingChip = chipsByKey.get(key);

    if (!existingChip || chip.severity > existingChip.severity) {
      chipsByKey.set(key, chip);
    }
  }

  return [...chipsByKey.values()]
    .sort((left, right) => right.severity - left.severity || left.label.localeCompare(right.label));
}

function chipFromTimelineItem(item, actionTitle, fallbackRegionId) {
  const tone = ['opportunity', 'risk', 'research'].includes(item.signal) ? item.signal : 'identity';
  const regionId = normalizeRegion(item.regionId, fallbackRegionId);
  const cultureName = normalizeText(item.cultureName, 'Culture locale');
  const severity = Math.max(SEVERITY_BY_TONE[tone] ?? 0, Math.min(5, Math.max(1, item.importance ?? 1)));
  const label = tone === 'opportunity'
    ? 'Ouverture culturelle'
    : tone === 'risk'
      ? 'Tension mémorielle'
      : tone === 'research'
        ? 'Piste recherche'
        : 'Identité locale';

  return buildChip({
    tone,
    label,
    explanation: `${normalizeText(item.title, label)} influence “${actionTitle}”.`,
    cultureName,
    regionId,
    severity,
    sourceId: item.timelineId,
  });
}

function chipsFromMarker(marker, actionTitle, fallbackRegionId) {
  if (!marker) {
    return [];
  }

  const regionId = normalizeRegion(marker.regionId, fallbackRegionId);
  const cultureName = normalizeText(marker.cultureName, 'Culture locale');
  const chips = [];

  if ((marker.eventCount ?? 0) > 0) {
    chips.push(buildChip({
      tone: (marker.influenceTier === 'dominant' || marker.influenceTier === 'strong') ? 'opportunity' : 'risk',
      label: 'Repère historique',
      explanation: `${marker.eventCount} événement${marker.eventCount > 1 ? 's' : ''} à relire avant “${actionTitle}”.`,
      cultureName,
      regionId,
      severity: (marker.influenceTier === 'dominant' || marker.influenceTier === 'strong') ? 4 : 3,
      sourceId: marker.overlayId,
    }));
  }

  if ((marker.discoveries ?? []).length > 0) {
    chips.push(buildChip({
      tone: 'research',
      label: 'Découverte liée',
      explanation: `${marker.discoveries.length} découverte${marker.discoveries.length > 1 ? 's' : ''} peut guider l’action.`,
      cultureName,
      regionId,
      severity: 2,
      sourceId: marker.overlayId,
    }));
  }

  if (chips.length === 0) {
    chips.push(buildChip({
      tone: 'identity',
      label: 'Identité locale',
      explanation: `Tenir compte de ${cultureName} sans urgence culturelle.`,
      cultureName,
      regionId,
      severity: 1,
      sourceId: marker.overlayId,
    }));
  }

  return chips;
}

export function buildCultureConsequenceChips({
  province = null,
  action = null,
  selectedMarker = null,
  selectedCluster = null,
  localTimeline = null,
} = {}) {
  const regionId = normalizeRegion(province?.provinceId ?? selectedMarker?.regionId ?? selectedCluster?.regionIds?.[0]);
  const actionTitle = normalizeText(action?.title, 'action province');
  const timelineItems = localTimeline?.items ?? [];
  const chips = [
    ...timelineItems.map((item) => chipFromTimelineItem(item, actionTitle, regionId)),
    ...chipsFromMarker(selectedMarker, actionTitle, regionId),
  ];

  if (selectedCluster && (selectedCluster.pins?.length ?? 0) === 0) {
    chips.push(buildChip({
      tone: 'identity',
      label: 'Cluster calme',
      explanation: 'Aucun événement actif, mais le voisinage culturel reste pertinent.',
      cultureName: normalizeText(selectedCluster.summary, 'Cluster culturel'),
      regionId,
      severity: 1,
      sourceId: selectedCluster.clusterId,
    }));
  }

  const sortedChips = dedupeAndSort(chips).slice(0, 3);

  if (sortedChips.length > 0) {
    return sortedChips;
  }

  return [buildChip({
    tone: 'neutral',
    label: 'Culture calme',
    explanation: 'Aucune conséquence culturelle immédiate pour ce choix.',
    cultureName: 'Aucun signal',
    regionId,
    severity: 0,
    sourceId: actionTitle,
  })];
}
