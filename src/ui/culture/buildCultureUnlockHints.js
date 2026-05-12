const STATUS_RANK = Object.freeze({ probable: 3, possible: 2, missing: 1 });

function normalizeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function buildHint({ status, tone, label, explanation, regionId, cultureName, sourceId }) {
  return {
    hintId: `${status}:${regionId}:${cultureName}:${label}:${sourceId ?? 'source'}`,
    status,
    tone,
    label,
    explanation,
    regionId,
    cultureName,
  };
}

function dedupeAndSort(hints) {
  const hintsByKey = new Map();

  for (const hint of hints) {
    const key = `${hint.status}:${hint.label}:${hint.regionId}:${hint.cultureName}`;
    const existingHint = hintsByKey.get(key);

    if (!existingHint || STATUS_RANK[hint.status] > STATUS_RANK[existingHint.status]) {
      hintsByKey.set(key, hint);
    }
  }

  return [...hintsByKey.values()]
    .sort((left, right) => STATUS_RANK[right.status] - STATUS_RANK[left.status] || left.label.localeCompare(right.label))
    .slice(0, 3);
}

function hintsFromTimeline(localTimeline, actionTitle, fallbackRegionId) {
  return (localTimeline?.items ?? []).map((item) => {
    const status = item.signal === 'opportunity' ? 'probable' : item.signal === 'research' ? 'possible' : 'missing';
    const label = item.kind === 'event'
      ? 'Débloque repère'
      : 'Débloque découverte';

    return buildHint({
      status,
      tone: item.signal,
      label,
      explanation: `${normalizeText(item.title, label)} peut suivre “${actionTitle}”.`,
      regionId: normalizeText(item.regionId, fallbackRegionId),
      cultureName: normalizeText(item.cultureName, 'Culture locale'),
      sourceId: item.timelineId,
    });
  });
}

function hintsFromMarker(marker, actionTitle, fallbackRegionId) {
  if (!marker) {
    return [];
  }

  const regionId = normalizeText(marker.regionId, fallbackRegionId);
  const cultureName = normalizeText(marker.cultureName, 'Culture locale');
  const hints = [];

  if ((marker.unlockedResearchIds ?? []).length > 0 || (marker.activeResearchCount ?? 0) > 0) {
    hints.push(buildHint({
      status: (marker.unlockedResearchIds ?? []).length > 0 ? 'probable' : 'possible',
      tone: 'research',
      label: 'Recherche culture',
      explanation: `${(marker.unlockedResearchIds ?? []).slice(0, 2).join(', ') || `${marker.activeResearchCount} recherche active`} liée à “${actionTitle}”.`,
      regionId,
      cultureName,
      sourceId: marker.overlayId,
    }));
  }

  if ((marker.discoveries ?? []).length > 0) {
    hints.push(buildHint({
      status: 'possible',
      tone: 'discovery',
      label: 'Découverte exploitable',
      explanation: `${marker.discoveries.slice(0, 2).join(', ')} peut nourrir le choix planifié.`,
      regionId,
      cultureName,
      sourceId: marker.overlayId,
    }));
  }

  return hints;
}

function hintsFromCluster(cluster, actionTitle, fallbackRegionId) {
  if (!cluster) {
    return [];
  }

  const regionId = normalizeText(cluster.regionIds?.[0], fallbackRegionId);
  const cultureName = normalizeText(cluster.summary, 'Cluster culturel');
  const discoveryPins = (cluster.pins ?? []).filter((pin) => pin.kind === 'discovery');
  const eventPins = (cluster.pins ?? []).filter((pin) => pin.kind === 'event');
  const hints = [];

  if (eventPins.length > 0) {
    const strongestEvent = eventPins.slice().sort((left, right) => (right.importance ?? 0) - (left.importance ?? 0))[0];
    hints.push(buildHint({
      status: (strongestEvent.importance ?? 0) >= 4 ? 'probable' : 'possible',
      tone: 'event',
      label: 'Événement cluster',
      explanation: `${strongestEvent.name} peut se rattacher à “${actionTitle}”.`,
      regionId,
      cultureName: normalizeText(strongestEvent.cultureName, cultureName),
      sourceId: strongestEvent.pinId,
    }));
  }

  if (discoveryPins.length > 0) {
    hints.push(buildHint({
      status: 'possible',
      tone: 'discovery',
      label: 'Découverte cluster',
      explanation: `${discoveryPins.slice(0, 2).map((pin) => pin.name).join(', ')} disponible dans le voisinage.`,
      regionId,
      cultureName,
      sourceId: cluster.clusterId,
    }));
  }

  if (hints.length === 0) {
    hints.push(buildHint({
      status: 'missing',
      tone: 'identity',
      label: 'Condition manquante',
      explanation: 'Cluster visible, mais aucun pin découverte/événement ne justifie encore un unlock.',
      regionId,
      cultureName,
      sourceId: cluster.clusterId,
    }));
  }

  return hints;
}

export function buildCultureUnlockHints({
  province = null,
  action = null,
  selectedMarker = null,
  selectedCluster = null,
  localTimeline = null,
} = {}) {
  const regionId = normalizeText(province?.provinceId ?? selectedMarker?.regionId ?? selectedCluster?.regionIds?.[0], 'province');
  const actionTitle = normalizeText(action?.title, 'action province');
  const hints = dedupeAndSort([
    ...hintsFromTimeline(localTimeline, actionTitle, regionId),
    ...hintsFromMarker(selectedMarker, actionTitle, regionId),
    ...hintsFromCluster(selectedCluster, actionTitle, regionId),
  ]);

  if (hints.length > 0) {
    return hints;
  }

  return [buildHint({
    status: 'missing',
    tone: 'neutral',
    label: 'Aucun unlock culture',
    explanation: 'Ajoutez découverte, repère ou cluster actif avant d’attendre un gain culturel.',
    regionId,
    cultureName: 'Aucun signal',
    sourceId: actionTitle,
  })];
}
