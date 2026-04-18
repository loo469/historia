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

function normalizeTextArray(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const normalizedValues = [...new Set(value.map((item) => requireText(item, label)))];
  return normalizedValues.sort();
}

function normalizeHistoricalEvent(event, index) {
  const normalizedEvent = requireObject(event, `loadHistoricalEventsFromJson event[${index}]`);

  return {
    id: requireText(normalizedEvent.id, `loadHistoricalEventsFromJson event[${index}].id`),
    title: requireText(normalizedEvent.title, `loadHistoricalEventsFromJson event[${index}].title`),
    era: requireText(normalizedEvent.era, `loadHistoricalEventsFromJson event[${index}].era`),
    summary: requireText(normalizedEvent.summary, `loadHistoricalEventsFromJson event[${index}].summary`),
    affectedCultureIds: normalizeTextArray(
      normalizedEvent.affectedCultureIds ?? [],
      `loadHistoricalEventsFromJson event[${index}].affectedCultureIds`,
    ),
    consequenceIds: normalizeTextArray(
      normalizedEvent.consequenceIds ?? [],
      `loadHistoricalEventsFromJson event[${index}].consequenceIds`,
    ),
    unlockedResearchIds: normalizeTextArray(
      normalizedEvent.unlockedResearchIds ?? [],
      `loadHistoricalEventsFromJson event[${index}].unlockedResearchIds`,
    ),
    repeatable: Boolean(normalizedEvent.repeatable),
    triggerCount: Number.isInteger(normalizedEvent.triggerCount) ? normalizedEvent.triggerCount : 0,
    lastTriggeredAt:
      normalizedEvent.lastTriggeredAt === null || normalizedEvent.lastTriggeredAt === undefined
        ? null
        : requireText(
            normalizedEvent.lastTriggeredAt,
            `loadHistoricalEventsFromJson event[${index}].lastTriggeredAt`,
          ),
    divergenceId:
      normalizedEvent.divergenceId === null || normalizedEvent.divergenceId === undefined
        ? null
        : requireText(
            normalizedEvent.divergenceId,
            `loadHistoricalEventsFromJson event[${index}].divergenceId`,
          ),
  };
}

export function loadHistoricalEventsFromJson(jsonText) {
  const normalizedJsonText = requireText(jsonText, 'loadHistoricalEventsFromJson jsonText');

  let parsed;
  try {
    parsed = JSON.parse(normalizedJsonText);
  } catch (error) {
    throw new SyntaxError(`loadHistoricalEventsFromJson could not parse JSON: ${error.message}`);
  }

  const root = requireObject(parsed, 'loadHistoricalEventsFromJson root');
  const rawEvents = root.events;

  if (!Array.isArray(rawEvents)) {
    throw new TypeError('loadHistoricalEventsFromJson root.events must be an array.');
  }

  return rawEvents.map((event, index) => normalizeHistoricalEvent(event, index));
}
