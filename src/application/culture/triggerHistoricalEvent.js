function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function requireBoolean(value, label) {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${label} must be a boolean.`);
  }

  return value;
}

function requireInteger(value, label, min = 0) {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(`${label} must be an integer greater than or equal to ${min}.`);
  }

  return value;
}

function normalizeUniqueTexts(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const normalizedValues = [...new Set(values.map((value) => String(value).trim()))];

  if (normalizedValues.some((value) => value.length === 0)) {
    throw new RangeError(`${label} cannot contain empty values.`);
  }

  return normalizedValues.sort();
}

function normalizeDate(value, label) {
  const normalizedValue = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(normalizedValue.getTime())) {
    throw new RangeError(`${label} must be a valid date.`);
  }

  return normalizedValue.toISOString();
}

function normalizeHistoricalEvent(historicalEvent) {
  if (!historicalEvent || typeof historicalEvent !== 'object') {
    throw new TypeError('triggerHistoricalEvent historicalEvent must be an object.');
  }

  const normalizedHistoricalEvent = {
    ...historicalEvent,
    id: requireText(historicalEvent.id, 'triggerHistoricalEvent historicalEvent.id'),
    title: requireText(historicalEvent.title, 'triggerHistoricalEvent historicalEvent.title'),
    era: requireText(historicalEvent.era, 'triggerHistoricalEvent historicalEvent.era'),
    summary: requireText(historicalEvent.summary, 'triggerHistoricalEvent historicalEvent.summary'),
    affectedCultureIds: normalizeUniqueTexts(
      historicalEvent.affectedCultureIds ?? [],
      'triggerHistoricalEvent historicalEvent.affectedCultureIds',
    ),
    consequenceIds: normalizeUniqueTexts(
      historicalEvent.consequenceIds ?? [],
      'triggerHistoricalEvent historicalEvent.consequenceIds',
    ),
    unlockedResearchIds: normalizeUniqueTexts(
      historicalEvent.unlockedResearchIds ?? [],
      'triggerHistoricalEvent historicalEvent.unlockedResearchIds',
    ),
    repeatable: requireBoolean(
      historicalEvent.repeatable ?? false,
      'triggerHistoricalEvent historicalEvent.repeatable',
    ),
    triggerCount: requireInteger(
      historicalEvent.triggerCount ?? 0,
      'triggerHistoricalEvent historicalEvent.triggerCount',
      0,
    ),
    lastTriggeredAt:
      historicalEvent.lastTriggeredAt === null || historicalEvent.lastTriggeredAt === undefined
        ? null
        : normalizeDate(
            historicalEvent.lastTriggeredAt,
            'triggerHistoricalEvent historicalEvent.lastTriggeredAt',
          ),
    divergenceId:
      historicalEvent.divergenceId === null || historicalEvent.divergenceId === undefined
        ? null
        : requireText(
            historicalEvent.divergenceId,
            'triggerHistoricalEvent historicalEvent.divergenceId',
          ),
  };

  if (!normalizedHistoricalEvent.repeatable && normalizedHistoricalEvent.triggerCount > 1) {
    throw new RangeError(
      'triggerHistoricalEvent historicalEvent.triggerCount cannot exceed 1 for a non-repeatable event.',
    );
  }

  return normalizedHistoricalEvent;
}

function normalizeExecution(execution) {
  if (!execution || typeof execution !== 'object') {
    throw new TypeError('triggerHistoricalEvent execution must be an object.');
  }

  return {
    triggeredAt: normalizeDate(
      execution.triggeredAt ?? new Date(),
      'triggerHistoricalEvent execution.triggeredAt',
    ),
    triggeredBy: requireText(
      execution.triggeredBy ?? 'system',
      'triggerHistoricalEvent execution.triggeredBy',
    ),
    consequenceIds: normalizeUniqueTexts(
      execution.consequenceIds ?? [],
      'triggerHistoricalEvent execution.consequenceIds',
    ),
    unlockedResearchIds: normalizeUniqueTexts(
      execution.unlockedResearchIds ?? [],
      'triggerHistoricalEvent execution.unlockedResearchIds',
    ),
    divergenceId:
      execution.divergenceId === null || execution.divergenceId === undefined
        ? null
        : requireText(execution.divergenceId, 'triggerHistoricalEvent execution.divergenceId'),
  };
}

export function triggerHistoricalEvent(historicalEvent, execution = {}) {
  const normalizedHistoricalEvent = normalizeHistoricalEvent(historicalEvent);
  const normalizedExecution = normalizeExecution(execution);

  if (!normalizedHistoricalEvent.repeatable && normalizedHistoricalEvent.triggerCount >= 1) {
    throw new RangeError(
      'triggerHistoricalEvent cannot re-trigger a non-repeatable event once it has already fired.',
    );
  }

  if (
    normalizedHistoricalEvent.divergenceId !== null &&
    normalizedExecution.divergenceId !== null &&
    normalizedHistoricalEvent.divergenceId !== normalizedExecution.divergenceId
  ) {
    throw new RangeError(
      'triggerHistoricalEvent execution.divergenceId must match the event divergenceId when one is already attached.',
    );
  }

  const consequenceIds = normalizeUniqueTexts(
    [...normalizedHistoricalEvent.consequenceIds, ...normalizedExecution.consequenceIds],
    'triggerHistoricalEvent merged consequence ids',
  );
  const unlockedResearchIds = normalizeUniqueTexts(
    [...normalizedHistoricalEvent.unlockedResearchIds, ...normalizedExecution.unlockedResearchIds],
    'triggerHistoricalEvent merged unlocked research ids',
  );
  const divergenceId = normalizedExecution.divergenceId ?? normalizedHistoricalEvent.divergenceId;

  return {
    ...normalizedHistoricalEvent,
    consequenceIds,
    unlockedResearchIds,
    divergenceId,
    triggerCount: normalizedHistoricalEvent.triggerCount + 1,
    lastTriggeredAt: normalizedExecution.triggeredAt,
    lastTriggeredBy: normalizedExecution.triggeredBy,
  };
}
