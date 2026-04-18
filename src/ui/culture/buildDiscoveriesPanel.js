function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
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

function normalizeHistoricalEvents(events) {
  if (!Array.isArray(events)) {
    throw new TypeError('DiscoveriesPanel historicalEvents must be an array.');
  }

  return events.map((event, index) => {
    const normalizedEvent = requireObject(event, `DiscoveriesPanel historicalEvents[${index}]`);

    return {
      id: requireText(normalizedEvent.id, `DiscoveriesPanel historicalEvents[${index}].id`),
      title: requireText(
        normalizedEvent.title,
        `DiscoveriesPanel historicalEvents[${index}].title`,
      ),
      discoveryIds: normalizeTextArray(
        normalizedEvent.discoveryIds ?? [],
        `DiscoveriesPanel historicalEvents[${index}].discoveryIds`,
      ),
      unlockedResearchIds: normalizeTextArray(
        normalizedEvent.unlockedResearchIds ?? [],
        `DiscoveriesPanel historicalEvents[${index}].unlockedResearchIds`,
      ),
    };
  });
}

export function buildDiscoveriesPanel(researchState, options = {}) {
  const normalizedResearchState = requireObject(researchState, 'DiscoveriesPanel researchState');
  const normalizedOptions = requireObject(options, 'DiscoveriesPanel options');
  const discoveredConceptIds = normalizeTextArray(
    normalizedResearchState.discoveredConceptIds ?? [],
    'DiscoveriesPanel researchState.discoveredConceptIds',
  );
  const unlockedResearchIds = normalizeTextArray(
    normalizedResearchState.unlockedResearchIds ?? [],
    'DiscoveriesPanel researchState.unlockedResearchIds',
  );
  const historicalEvents = normalizeHistoricalEvents(normalizedOptions.historicalEvents ?? []);

  const eventRows = historicalEvents.map((event) => ({
    eventId: event.id,
    eventTitle: event.title,
    discoveryCount: event.discoveryIds.length,
    discoveries: event.discoveryIds,
    unlockedResearchIds: event.unlockedResearchIds,
    label: `${event.title} (${event.discoveryIds.length} découverte${event.discoveryIds.length > 1 ? 's' : ''})`,
  }));

  return {
    cultureId: requireText(normalizedResearchState.cultureId, 'DiscoveriesPanel researchState.cultureId'),
    title: 'Découvertes',
    summary: `${discoveredConceptIds.length} concepts, ${unlockedResearchIds.length} recherches, ${eventRows.length} événements`,
    sections: {
      concepts: discoveredConceptIds,
      research: unlockedResearchIds,
      events: eventRows,
    },
    metrics: {
      conceptCount: discoveredConceptIds.length,
      unlockedResearchCount: unlockedResearchIds.length,
      eventCount: eventRows.length,
    },
  };
}
