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
