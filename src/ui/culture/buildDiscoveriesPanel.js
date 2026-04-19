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

function normalizeDate(value, label) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalizedValue = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(normalizedValue.getTime())) {
    throw new RangeError(`${label} must be a valid date.`);
  }

  return normalizedValue;
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
      summary: String(normalizedEvent.summary ?? '').trim(),
      triggeredAt: normalizeDate(
        normalizedEvent.triggeredAt ?? null,
        `DiscoveriesPanel historicalEvents[${index}].triggeredAt`,
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
    triggeredAt: event.triggeredAt?.toISOString() ?? null,
    label: `${event.title} (${event.discoveryIds.length} découverte${event.discoveryIds.length > 1 ? 's' : ''})`,
  }));

  const timeline = historicalEvents
    .slice()
    .sort((left, right) => {
      const leftTime = left.triggeredAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightTime = right.triggeredAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

      return leftTime - rightTime || left.title.localeCompare(right.title);
    })
    .map((event, index) => ({
      id: `${event.id}:timeline`,
      eventId: event.id,
      title: event.title,
      summary: event.summary || `${event.discoveryIds.length} découverte${event.discoveryIds.length > 1 ? 's' : ''}`,
      triggeredAt: event.triggeredAt?.toISOString() ?? null,
      order: index + 1,
      discoveries: event.discoveryIds,
      unlockedResearchIds: event.unlockedResearchIds,
      label: event.triggeredAt
        ? `${index + 1}. ${event.title} · ${event.triggeredAt.toISOString().slice(0, 10)}`
        : `${index + 1}. ${event.title}`,
    }));

  return {
    cultureId: requireText(normalizedResearchState.cultureId, 'DiscoveriesPanel researchState.cultureId'),
    title: 'Découvertes',
    summary: `${discoveredConceptIds.length} concepts, ${unlockedResearchIds.length} recherches, ${eventRows.length} événements`,
    sections: {
      concepts: discoveredConceptIds,
      research: unlockedResearchIds,
      events: eventRows,
      timeline,
    },
    metrics: {
      conceptCount: discoveredConceptIds.length,
      unlockedResearchCount: unlockedResearchIds.length,
      eventCount: eventRows.length,
      timelineEventCount: timeline.length,
    },
  };
}
