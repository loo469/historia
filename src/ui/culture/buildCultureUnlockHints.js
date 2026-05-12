const STATUS_RANK = Object.freeze({ probable: 3, possible: 2, missing: 1 });

function normalizeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function buildFocusTarget({ type = 'province', id, regionId, label }) {
  const targetId = normalizeText(id, regionId);

  return {
    type,
    id: targetId,
    regionId,
    label: normalizeText(label, targetId),
  };
}

function buildUrgency({ status, tone, focusTarget, sourceLabel, timingLabel }) {
  const normalizedSource = normalizeText(sourceLabel, focusTarget.label);
  const normalizedTiming = normalizeText(timingLabel, 'timing local stable');

  if (status === 'probable') {
    return {
      level: 'soon',
      label: 'Expire bientôt',
      window: 'ce tour',
      sourceLabel: normalizedSource,
      timingLabel: normalizedTiming,
      reason: `${normalizedSource} · ${normalizedTiming}`,
      detail: `${focusTarget.label}: fenêtre courte, liée à ${normalizedSource} (${normalizedTiming}).`,
    };
  }

  if (status === 'possible') {
    const isFreshSignal = tone === 'research' || tone === 'discovery';

    return {
      level: isFreshSignal ? 'new' : 'stable',
      label: isFreshSignal ? 'Nouveau signal' : 'Fenêtre stable',
      window: isFreshSignal ? 'maintenant' : '2+ tours',
      sourceLabel: normalizedSource,
      timingLabel: normalizedTiming,
      reason: `${normalizedSource} · ${normalizedTiming}`,
      detail: `${focusTarget.label}: opportunité disponible via ${normalizedSource} (${normalizedTiming}).`,
    };
  }

  return {
    level: 'stable',
    label: 'À préparer',
    window: 'stable',
    sourceLabel: normalizedSource,
    timingLabel: normalizedTiming,
    reason: `${normalizedSource} · ${normalizedTiming}`,
    detail: `${focusTarget.label}: signal incomplet autour de ${normalizedSource} (${normalizedTiming}).`,
  };
}

function buildHint({ status, tone, label, explanation, regionId, cultureName, sourceId, focusTarget, urgencySource, timingLabel }) {
  const normalizedFocusTarget = focusTarget ?? buildFocusTarget({ regionId, label: 'Province liée' });
  const urgency = buildUrgency({
    status,
    tone,
    focusTarget: normalizedFocusTarget,
    sourceLabel: urgencySource,
    timingLabel,
  });

  return {
    hintId: `${status}:${regionId}:${cultureName}:${label}:${sourceId ?? 'source'}`,
    status,
    tone,
    label,
    explanation,
    regionId,
    cultureName,
    sourceId: sourceId ?? null,
    urgency,
    focusTarget: {
      ...normalizedFocusTarget,
      urgency: { ...urgency },
    },
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
      urgencySource: `${item.kind === 'event' ? 'Événement' : 'Découverte'}: ${normalizeText(item.title, label)}`,
      timingLabel: item.date ? `chronologie locale ${item.date}` : 'chronologie locale maintenant',
      focusTarget: buildFocusTarget({
        type: 'timeline',
        id: item.timelineId,
        regionId: normalizeText(item.regionId, fallbackRegionId),
        label: normalizeText(item.title, label),
      }),
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
      urgencySource: (marker.unlockedResearchIds ?? []).length > 0
        ? `Recherche: ${(marker.unlockedResearchIds ?? []).slice(0, 2).join(', ')}`
        : `Recherche active: ${marker.activeResearchCount}`,
      timingLabel: (marker.unlockedResearchIds ?? []).length > 0 ? 'débloquée maintenant' : 'progression locale en cours',
      focusTarget: buildFocusTarget({
        type: 'marker',
        id: marker.overlayId,
        regionId,
        label: cultureName,
      }),
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
      urgencySource: `Découverte: ${marker.discoveries.slice(0, 2).join(', ')}`,
      timingLabel: 'disponible sur la carte locale',
      focusTarget: buildFocusTarget({
        type: 'marker',
        id: marker.overlayId,
        regionId,
        label: cultureName,
      }),
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
      urgencySource: `Événement: ${strongestEvent.name}`,
      timingLabel: (strongestEvent.importance ?? 0) >= 4 ? 'priorité du tour' : 'fenêtre locale stable',
      focusTarget: buildFocusTarget({
        type: 'cluster',
        id: cluster.clusterId,
        regionId,
        label: strongestEvent.name,
      }),
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
      urgencySource: `Découverte: ${discoveryPins.slice(0, 2).map((pin) => pin.name).join(', ')}`,
      timingLabel: 'voisinage culturel disponible',
      focusTarget: buildFocusTarget({
        type: 'cluster',
        id: cluster.clusterId,
        regionId,
        label: cultureName,
      }),
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
      urgencySource: `Cluster: ${cultureName}`,
      timingLabel: 'signal incomplet stable',
      focusTarget: buildFocusTarget({
        type: 'cluster',
        id: cluster.clusterId,
        regionId,
        label: cultureName,
      }),
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
    urgencySource: `Plan: ${actionTitle}`,
    timingLabel: 'aucun signal local actif',
    focusTarget: buildFocusTarget({ regionId, label: 'Province sans unlock' }),
  })];
}
