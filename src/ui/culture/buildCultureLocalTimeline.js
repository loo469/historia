function normalizeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function classifyEvent(event) {
  if ((event.importance ?? 0) >= 4) {
    return 'opportunity';
  }

  if ((event.discoveries ?? []).length > 0) {
    return 'research';
  }

  return 'risk';
}

function buildEventItem(event, cultureName, regionId) {
  const signal = classifyEvent(event);

  return {
    timelineId: `${regionId}:event:${event.eventId}`,
    kind: 'event',
    signal,
    title: normalizeText(event.title, 'Repère culturel'),
    regionId,
    cultureName: normalizeText(cultureName, 'Culture locale'),
    importance: event.importance ?? null,
    summary: signal === 'opportunity'
      ? 'Opportunité culturelle à exploiter maintenant.'
      : signal === 'research'
        ? 'Indice utile pour orienter une recherche locale.'
        : 'Signal faible à surveiller avant une action majeure.',
    detail: normalizeText(event.summary, event.label),
    date: normalizeText(event.triggeredAt).slice(0, 10),
  };
}

function buildDiscoveryItem(pin, regionId) {
  return {
    timelineId: `${regionId}:discovery:${pin.pinId}`,
    kind: 'discovery',
    signal: 'research',
    title: normalizeText(pin.name, 'Découverte'),
    regionId,
    cultureName: normalizeText(pin.cultureName, pin.cultureId),
    importance: pin.importance ?? null,
    summary: 'Découverte disponible comme piste courte de progression.',
    detail: normalizeText(pin.type, 'Découverte'),
    date: '',
  };
}

export function buildCultureLocalTimeline({ selectedRegionId, selectedMarker = null, selectedCluster = null } = {}) {
  const regionId = normalizeText(selectedRegionId, 'province');
  const eventItems = (selectedMarker?.eventPopups ?? [])
    .map((event) => buildEventItem(event, selectedMarker.cultureName, regionId));
  const clusterPinItems = (selectedCluster?.pins ?? [])
    .map((pin) => (pin.kind === 'event'
      ? {
        timelineId: `${regionId}:pin:${pin.pinId}`,
        kind: 'event',
        signal: (pin.importance ?? 0) >= 4 ? 'opportunity' : 'risk',
        title: normalizeText(pin.name, 'Repère culturel'),
        regionId: normalizeText(pin.regionId, regionId),
        cultureName: normalizeText(pin.cultureName, pin.cultureId),
        importance: pin.importance ?? null,
        summary: (pin.importance ?? 0) >= 4
          ? 'Événement fort du cluster à traiter en priorité.'
          : 'Événement local à garder dans le fil de décision.',
        detail: normalizeText(pin.type, 'événement'),
        date: '',
      }
      : buildDiscoveryItem(pin, normalizeText(pin.regionId, regionId))));

  const items = [...new Map([...eventItems, ...clusterPinItems].map((item) => [item.timelineId, item])).values()]
    .sort((left, right) => (right.importance ?? -1) - (left.importance ?? -1) || left.title.localeCompare(right.title))
    .slice(0, 3);

  if (items.length === 0) {
    return {
      state: 'empty',
      regionId,
      heading: 'Chronologie locale calme',
      summary: 'Aucun événement ou découverte culturelle immédiate pour cette province.',
      items: [],
    };
  }

  const narrativePriority = selectedCluster?.narrativePriority ?? selectedMarker?.narrativePriority ?? null;

  return {
    state: 'active',
    regionId,
    heading: 'Chronologie locale',
    summary: narrativePriority
      ? `${narrativePriority.label}: ${narrativePriority.microAction} · ${narrativePriority.consequencePreview?.confidenceLabel ?? narrativePriority.reason}`
      : `${items.length} signal${items.length > 1 ? 's' : ''} culturel${items.length > 1 ? 's' : ''} lié${items.length > 1 ? 's' : ''} à la province sélectionnée.`,
    narrativePriority,
    consequencePreview: narrativePriority?.consequencePreview ?? null,
    items,
  };
}
