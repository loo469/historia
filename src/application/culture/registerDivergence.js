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

function normalizeDivergencePoint(divergencePoint) {
  if (!divergencePoint || typeof divergencePoint !== 'object') {
    throw new TypeError('registerDivergence divergencePoint must be an object.');
  }

  return {
    ...divergencePoint,
    id: requireText(divergencePoint.id, 'registerDivergence divergencePoint.id'),
    title: requireText(divergencePoint.title, 'registerDivergence divergencePoint.title'),
    era: requireText(divergencePoint.era, 'registerDivergence divergencePoint.era'),
    baselineSummary: requireText(
      divergencePoint.baselineSummary,
      'registerDivergence divergencePoint.baselineSummary',
    ),
    divergenceSummary: requireText(
      divergencePoint.divergenceSummary,
      'registerDivergence divergencePoint.divergenceSummary',
    ),
    affectedCultureIds: normalizeUniqueTexts(
      divergencePoint.affectedCultureIds ?? [],
      'registerDivergence divergencePoint.affectedCultureIds',
    ),
    consequenceIds: normalizeUniqueTexts(
      divergencePoint.consequenceIds ?? [],
      'registerDivergence divergencePoint.consequenceIds',
    ),
    severity: requireInteger(
      divergencePoint.severity,
      'registerDivergence divergencePoint.severity',
      1,
      5,
    ),
    discovered: Boolean(divergencePoint.discovered),
    registeredAt: normalizeDate(
      divergencePoint.registeredAt,
      'registerDivergence divergencePoint.registeredAt',
    ),
    triggeredEventId:
      divergencePoint.triggeredEventId === null || divergencePoint.triggeredEventId === undefined
        ? null
        : requireText(
            divergencePoint.triggeredEventId,
            'registerDivergence divergencePoint.triggeredEventId',
          ),
  };
}

function normalizeRegistration(registration) {
  if (!registration || typeof registration !== 'object') {
    throw new TypeError('registerDivergence registration must be an object.');
  }

  return {
    consequenceIds: normalizeUniqueTexts(
      registration.consequenceIds ?? [],
      'registerDivergence registration.consequenceIds',
    ),
    discovered:
      registration.discovered === undefined ? undefined : Boolean(registration.discovered),
    triggeredEventId:
      registration.triggeredEventId === null || registration.triggeredEventId === undefined
        ? null
        : requireText(
            registration.triggeredEventId,
            'registerDivergence registration.triggeredEventId',
          ),
    registeredAt: normalizeDate(
      registration.registeredAt ?? new Date(),
      'registerDivergence registration.registeredAt',
    ),
  };
}

export function registerDivergence(divergencePoint, registration = {}) {
  const normalizedDivergencePoint = normalizeDivergencePoint(divergencePoint);
  const normalizedRegistration = normalizeRegistration(registration);
  const mergedConsequences = normalizeUniqueTexts(
    [...normalizedDivergencePoint.consequenceIds, ...normalizedRegistration.consequenceIds],
    'registerDivergence merged consequence ids',
  );
  const discovered = normalizedRegistration.discovered ?? normalizedDivergencePoint.discovered;
  const triggeredEventId = normalizedRegistration.triggeredEventId ?? normalizedDivergencePoint.triggeredEventId;

  if (discovered && triggeredEventId === null) {
    throw new RangeError(
      'registerDivergence requires a triggeredEventId when a divergence is marked as discovered.',
    );
  }

  if (!discovered && triggeredEventId !== null) {
    throw new RangeError(
      'registerDivergence cannot attach a triggeredEventId while the divergence is undiscovered.',
    );
  }

  return {
    ...normalizedDivergencePoint,
    consequenceIds: mergedConsequences,
    discovered,
    triggeredEventId,
    registeredAt: normalizedRegistration.registeredAt,
  };
}
