function normalizeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function sortPins(pins) {
  return pins
    .slice()
    .sort((left, right) => (right.importance ?? -1) - (left.importance ?? -1) || normalizeText(left.name).localeCompare(normalizeText(right.name)));
}

function buildPinRecommendation(pin, selectedRegionId) {
  const isEvent = pin.kind === 'event';
  const title = isEvent ? 'Suivre le repère culturel' : 'Exploiter la découverte locale';
  const hook = isEvent
    ? `${normalizeText(pin.name, 'Événement culturel')} peut orienter la prochaine action en ${selectedRegionId}.`
    : `${normalizeText(pin.name, 'Découverte')} donne un angle court pour la province sélectionnée.`;

  return {
    recommendationId: `${selectedRegionId}:${pin.pinId}:recommendation`,
    tone: isEvent ? 'event' : 'discovery',
    title,
    hook,
    detail: `${normalizeText(pin.type, isEvent ? 'événement' : 'découverte')} · ${normalizeText(pin.cultureName, pin.cultureId)}${pin.importance ? ` · IMP-${pin.importance}` : ''}`,
    sourcePinId: pin.pinId,
  };
}

export function buildCultureMapRecommendations({ selectedRegionId, selectedMarker = null, selectedCluster = null } = {}) {
  const regionId = normalizeText(selectedRegionId, 'province');
  const pins = sortPins(selectedCluster?.pins ?? []);

  if (pins.length > 0) {
    const topPin = pins[0];
    const recommendation = buildPinRecommendation(topPin, regionId);

    return {
      state: 'linked',
      regionId,
      summary: `${selectedCluster.label} · ${pins.length} pistes liées`,
      recommendations: [
        recommendation,
        ...pins.slice(1, 3).map((pin) => buildPinRecommendation(pin, regionId)),
      ],
    };
  }

  if (selectedCluster) {
    return {
      state: 'empty-cluster',
      regionId,
      summary: `${selectedCluster.label} · aucun pin lié`,
      recommendations: [
        {
          recommendationId: `${regionId}:${selectedCluster.clusterId}:empty`,
          tone: 'neutral',
          title: 'Observer le voisinage culturel',
          hook: 'Cluster visible, mais aucun événement ou découverte exploitable pour l’instant.',
          detail: selectedCluster.summary,
          sourcePinId: null,
        },
      ],
    };
  }

  if (selectedMarker) {
    return {
      state: 'marker',
      regionId,
      summary: `${selectedMarker.cultureName} · ${selectedMarker.influenceTier}`,
      recommendations: [
        {
          recommendationId: `${regionId}:${selectedMarker.overlayId}:marker`,
          tone: selectedMarker.eventCount > 0 ? 'event' : 'neutral',
          title: selectedMarker.eventCount > 0 ? 'Lire le repère historique' : 'Surveiller l’influence culturelle',
          hook: selectedMarker.eventCount > 0
            ? `${selectedMarker.eventCount} repère${selectedMarker.eventCount > 1 ? 's' : ''} historique${selectedMarker.eventCount > 1 ? 's' : ''} alimente${selectedMarker.eventCount > 1 ? 'nt' : ''} cette province.`
            : 'Influence culturelle stable; gardez la province comme référence sans action urgente.',
          detail: `${selectedMarker.discoveries.length} découvertes · score ${selectedMarker.influenceScore}`,
          sourcePinId: null,
        },
      ],
    };
  }

  return {
    state: 'neutral',
    regionId,
    summary: 'Aucun signal culturel prioritaire',
    recommendations: [
      {
        recommendationId: `${regionId}:culture-neutral`,
        tone: 'neutral',
        title: 'Aucune action culturelle immédiate',
        hook: 'Sélection sans cluster, découverte ou événement culturel exploitable.',
        detail: 'Activez Culture ou choisissez une province voisine pour plus de contexte.',
        sourcePinId: null,
      },
    ],
  };
}
