import { Culture } from '../../domain/culture/Culture.js';
import { HistoricalEvent } from '../../domain/culture/HistoricalEvent.js';
import { ResearchState } from '../../domain/culture/ResearchState.js';

const DEFAULT_STYLE_BY_MARKER_TYPE = Object.freeze({
  innovation: { color: 'violet', icon: '✦', emphasis: 'high' },
  balanced: { color: 'teal', icon: '◆', emphasis: 'normal' },
  traditional: { color: 'amber', icon: '⬢', emphasis: 'normal' },
  fragmented: { color: 'crimson', icon: '✕', emphasis: 'high' },
  default: { color: 'slate', icon: '•', emphasis: 'normal' },
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

  const eventIds = historicalEvents.map((historicalEvent) => historicalEvent.id).sort();
  const highlightedDiscoveries = [...new Set([
    ...[...discoveredConceptIds],
    ...historicalEvents.flatMap((historicalEvent) => historicalEvent.discoveryIds),
  ])].sort();

  return {
    discoveredConceptIds: [...discoveredConceptIds].sort(),
    unlockedResearchIds: [...unlockedResearchIds].sort(),
    highlightedDiscoveries,
    activeResearchCount,
    eventIds,
    eventCount: eventIds.length,
    identityTags: [...new Set([...culture.valueIds, ...culture.traditionIds])].sort(),
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

  return cultures
    .flatMap((culture) => {
      const cultureResearchStates = researchStates.filter((researchState) => researchState.cultureId === culture.id);
      const cultureHistoricalEvents = historicalEvents.filter((historicalEvent) => historicalEvent.affectsCulture(culture.id));
      const signals = summarizeSignals(culture, cultureResearchStates, cultureHistoricalEvents);
      const markerType = buildMarkerType(culture);
      const regionIds = regionIdsByCulture[culture.id] ?? [];

      return regionIds.map((regionId) => ({
        overlayId: `${regionId}:${culture.id}`,
        regionId,
        cultureId: culture.id,
        cultureName: culture.name,
        archetype: culture.archetype,
        primaryLanguage: culture.primaryLanguage,
        markerType,
        label: `${culture.name} (${signals.highlightedDiscoveries.length} découvertes)`,
        summary: `${signals.activeResearchCount} recherches actives, ${signals.eventCount} événements, ${signals.identityTags.length} repères culturels`,
        discoveries: signals.highlightedDiscoveries,
        unlockedResearchIds: signals.unlockedResearchIds,
        activeResearchCount: signals.activeResearchCount,
        eventIds: signals.eventIds,
        eventCount: signals.eventCount,
        identityTags: signals.identityTags,
        cultureMetrics: {
          openness: culture.openness,
          cohesion: culture.cohesion,
          researchDrive: culture.researchDrive,
        },
        style: normalizeStyle(styleByMarkerType, markerType),
      }));
    })
    .sort((left, right) => {
      const regionComparison = left.regionId.localeCompare(right.regionId);

      if (regionComparison !== 0) {
        return regionComparison;
      }

      return left.cultureId.localeCompare(right.cultureId);
    });
}
