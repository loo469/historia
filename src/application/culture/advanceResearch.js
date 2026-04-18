function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function requireInteger(value, label, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
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

function normalizeResearchState(researchState) {
  if (!researchState || typeof researchState !== 'object') {
    throw new TypeError('advanceResearch researchState must be an object.');
  }

  const status = requireText(researchState.status, 'advanceResearch researchState.status');
  const allowedStatuses = new Set(['planned', 'active', 'blocked', 'completed']);

  if (!allowedStatuses.has(status)) {
    throw new RangeError(
      'advanceResearch researchState.status must be one of planned, active, blocked, or completed.',
    );
  }

  return {
    ...researchState,
    id: requireText(researchState.id, 'advanceResearch researchState.id'),
    cultureId: requireText(researchState.cultureId, 'advanceResearch researchState.cultureId'),
    topicId: requireText(researchState.topicId, 'advanceResearch researchState.topicId'),
    status,
    progress: requireInteger(researchState.progress ?? 0, 'advanceResearch researchState.progress', 0, 100),
    currentTier: requireInteger(
      researchState.currentTier ?? 0,
      'advanceResearch researchState.currentTier',
      0,
      10,
    ),
    discoveredConceptIds: normalizeUniqueTexts(
      researchState.discoveredConceptIds ?? [],
      'advanceResearch researchState.discoveredConceptIds',
    ),
    blockedByIds: normalizeUniqueTexts(
      researchState.blockedByIds ?? [],
      'advanceResearch researchState.blockedByIds',
    ),
    lastAdvancedAt: researchState.lastAdvancedAt ?? null,
    completedAt: researchState.completedAt ?? null,
  };
}

export function advanceResearch(researchState, advancement) {
  const normalizedResearchState = normalizeResearchState(researchState);

  if (!advancement || typeof advancement !== 'object') {
    throw new TypeError('advanceResearch advancement must be an object.');
  }

  const amount = requireInteger(advancement.amount, 'advanceResearch advancement.amount', 1, 100);

  if (normalizedResearchState.status === 'completed') {
    throw new RangeError('advanceResearch cannot advance completed research.');
  }

  if (normalizedResearchState.blockedByIds.length > 0) {
    throw new RangeError('advanceResearch cannot advance blocked research.');
  }

  const advancedAt = normalizeDate(
    advancement.advancedAt ?? new Date(),
    'advanceResearch advancement.advancedAt',
  );
  const discoveredConceptIds = normalizeUniqueTexts(
    [
      ...normalizedResearchState.discoveredConceptIds,
      ...(advancement.discoveredConceptIds ?? []),
    ],
    'advanceResearch advancement.discoveredConceptIds',
  );
  const blockedByIds = normalizeUniqueTexts(
    advancement.blockedByIds ?? [],
    'advanceResearch advancement.blockedByIds',
  );
  const progress = Math.min(100, normalizedResearchState.progress + amount);
  const status = progress === 100 ? 'completed' : blockedByIds.length > 0 ? 'blocked' : 'active';

  return {
    ...normalizedResearchState,
    status,
    progress,
    discoveredConceptIds,
    blockedByIds,
    lastAdvancedAt: advancedAt,
    completedAt: status === 'completed' ? advancedAt : null,
  };
}
