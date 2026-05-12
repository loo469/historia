const GROUP_DEFINITIONS = Object.freeze({
  urgent: {
    label: 'Urgent',
    summary: 'À traiter avant le lore de fond.',
    rank: 3,
  },
  active: {
    label: 'Actif',
    summary: 'Signal en cours ou relié à une recherche.',
    rank: 2,
  },
  background: {
    label: 'Fond',
    summary: 'Découverte disponible sans urgence claire.',
    rank: 1,
  },
});

function normalizeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function buildDiscoveryItems(selectedMarker) {
  return (selectedMarker?.regionalDiscoveryLinks ?? []).map((link) => {
    const linkedEventCount = Number(link.eventCount ?? link.eventIds?.length ?? 0);
    const activeResearchCount = Number(link.activeResearchCount ?? selectedMarker.activeResearchCount ?? 0);
    const urgentMarker = selectedMarker.markerType === 'fragmented';
    const group = urgentMarker || (linkedEventCount > 0 && selectedMarker.influenceTier === 'dominant')
      ? 'urgent'
      : activeResearchCount > 0 || linkedEventCount > 0
        ? 'active'
        : 'background';
    const cause = urgentMarker
      ? 'Tension locale'
      : linkedEventCount > 0
        ? `${linkedEventCount} repère${linkedEventCount > 1 ? 's' : ''}`
        : activeResearchCount > 0
          ? 'Recherche active'
          : 'Catalogue';

    return {
      itemId: `discovery:${link.linkId ?? `${link.regionId}:${link.cultureId}:${link.discoveryId}`}`,
      kind: 'discovery',
      group,
      label: normalizeText(link.discoveryId, 'Découverte'),
      shortLabel: normalizeText(link.discoveryId, 'Découverte'),
      cultureName: normalizeText(selectedMarker?.cultureName, link.cultureName ?? 'Culture locale'),
      regionId: normalizeText(link.regionId, selectedMarker?.regionId),
      cause,
      detail: normalizeText(link.label, `${link.discoveryId} · ${link.regionId}`),
      priority: GROUP_DEFINITIONS[group].rank * 100 + linkedEventCount * 10 + activeResearchCount,
    };
  });
}

function buildEventItems(selectedMarker) {
  return (selectedMarker?.eventPopups ?? []).map((event) => {
    const importance = Number(event.importance ?? 0);
    const discoveryCount = Number(event.discoveries?.length ?? 0);
    const group = importance >= 4
      ? 'urgent'
      : importance >= 3 || discoveryCount > 0
        ? 'active'
        : 'background';
    const cause = importance >= 4
      ? `IMP-${importance}`
      : discoveryCount > 0
        ? `${discoveryCount} découverte${discoveryCount > 1 ? 's' : ''}`
        : 'Historique';

    return {
      itemId: `event:${event.popupId ?? event.eventId ?? event.title}`,
      kind: 'event',
      group,
      label: normalizeText(event.title, 'Repère historique'),
      shortLabel: normalizeText(event.title, 'Repère historique'),
      cultureName: normalizeText(selectedMarker?.cultureName, 'Culture locale'),
      regionId: normalizeText(selectedMarker?.regionId, ''),
      cause,
      detail: normalizeText(event.summary, event.label ?? event.title),
      priority: GROUP_DEFINITIONS[group].rank * 100 + importance * 10 + discoveryCount,
    };
  });
}

function buildClusterPinItems(selectedCluster, selectedMarker) {
  return (selectedCluster?.pins ?? []).map((pin) => {
    const importance = Number(pin.importance ?? 0);
    const group = pin.kind === 'event' && importance >= 4
      ? 'urgent'
      : pin.kind === 'event' || selectedMarker?.activeResearchCount > 0
        ? 'active'
        : 'background';
    const cause = pin.kind === 'event'
      ? `IMP-${importance || 'n/a'}`
      : selectedMarker?.activeResearchCount > 0
        ? 'Recherche active'
        : 'Cluster';

    return {
      itemId: `cluster:${pin.pinId}`,
      kind: pin.kind,
      group,
      label: normalizeText(pin.name, pin.type ?? 'Signal culturel'),
      shortLabel: normalizeText(pin.name, pin.type ?? 'Signal culturel'),
      cultureName: normalizeText(pin.cultureName, selectedMarker?.cultureName ?? 'Culture locale'),
      regionId: normalizeText(pin.regionId, selectedMarker?.regionId),
      cause,
      detail: `${normalizeText(pin.type, 'Signal')} · ${normalizeText(pin.regionId, selectedMarker?.regionId)}`,
      priority: GROUP_DEFINITIONS[group].rank * 100 + importance * 10,
    };
  });
}

function dedupeItems(items) {
  const byKey = new Map();

  for (const item of items) {
    const key = `${item.kind}:${item.regionId}:${item.cultureName}:${item.label}`;
    const existing = byKey.get(key);

    if (!existing || item.priority > existing.priority) {
      byKey.set(key, item);
    }
  }

  return [...byKey.values()];
}

export function buildCultureDiscoveryUrgencyGroups({
  selectedMarker = null,
  selectedCluster = null,
} = {}) {
  const items = dedupeItems([
    ...buildEventItems(selectedMarker),
    ...buildDiscoveryItems(selectedMarker),
    ...buildClusterPinItems(selectedCluster, selectedMarker),
  ]).sort((left, right) => right.priority - left.priority || left.label.localeCompare(right.label));

  const groups = Object.entries(GROUP_DEFINITIONS)
    .map(([key, definition]) => ({
      key,
      label: definition.label,
      summary: definition.summary,
      items: items.filter((item) => item.group === key).slice(0, key === 'background' ? 3 : 4),
    }))
    .filter((group) => group.items.length > 0);

  return {
    state: groups.length > 0 ? 'active' : 'quiet',
    summary: groups.length > 0
      ? `${items.length} signal${items.length > 1 ? 's' : ''} culturel${items.length > 1 ? 's' : ''} groupé${items.length > 1 ? 's' : ''} par urgence.`
      : 'Aucun signal culturel détaillé à grouper pour cette province.',
    groups,
  };
}
