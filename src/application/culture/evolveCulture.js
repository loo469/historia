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

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function normalizeCulture(culture) {
  if (!culture || typeof culture !== 'object') {
    throw new TypeError('evolveCulture culture must be an object.');
  }

  return {
    ...culture,
    id: requireText(culture.id, 'evolveCulture culture.id'),
    name: requireText(culture.name, 'evolveCulture culture.name'),
    archetype: requireText(culture.archetype, 'evolveCulture culture.archetype'),
    primaryLanguage: requireText(culture.primaryLanguage, 'evolveCulture culture.primaryLanguage'),
    valueIds: normalizeUniqueTexts(culture.valueIds ?? [], 'evolveCulture culture.valueIds'),
    traditionIds: normalizeUniqueTexts(culture.traditionIds ?? [], 'evolveCulture culture.traditionIds'),
    openness: requireInteger(culture.openness ?? 50, 'evolveCulture culture.openness', 0, 100),
    cohesion: requireInteger(culture.cohesion ?? 50, 'evolveCulture culture.cohesion', 0, 100),
    researchDrive: requireInteger(
      culture.researchDrive ?? 50,
      'evolveCulture culture.researchDrive',
      0,
      100,
    ),
    lastEvolvedAt: culture.lastEvolvedAt ?? null,
  };
}

function normalizeEvolution(evolution) {
  if (!evolution || typeof evolution !== 'object') {
    throw new TypeError('evolveCulture evolution must be an object.');
  }

  return {
    opennessDelta: requireInteger(
      evolution.opennessDelta ?? 0,
      'evolveCulture evolution.opennessDelta',
      -100,
      100,
    ),
    cohesionDelta: requireInteger(
      evolution.cohesionDelta ?? 0,
      'evolveCulture evolution.cohesionDelta',
      -100,
      100,
    ),
    researchDriveDelta: requireInteger(
      evolution.researchDriveDelta ?? 0,
      'evolveCulture evolution.researchDriveDelta',
      -100,
      100,
    ),
    addedValueIds: normalizeUniqueTexts(
      evolution.addedValueIds ?? [],
      'evolveCulture evolution.addedValueIds',
    ),
    addedTraditionIds: normalizeUniqueTexts(
      evolution.addedTraditionIds ?? [],
      'evolveCulture evolution.addedTraditionIds',
    ),
    removedValueIds: normalizeUniqueTexts(
      evolution.removedValueIds ?? [],
      'evolveCulture evolution.removedValueIds',
    ),
    removedTraditionIds: normalizeUniqueTexts(
      evolution.removedTraditionIds ?? [],
      'evolveCulture evolution.removedTraditionIds',
    ),
    evolvedAt: normalizeDate(evolution.evolvedAt ?? new Date(), 'evolveCulture evolution.evolvedAt'),
  };
}

function applyListEvolution(currentIds, addedIds, removedIds) {
  const nextIds = new Set(currentIds);

  for (const removedId of removedIds) {
    nextIds.delete(removedId);
  }

  for (const addedId of addedIds) {
    nextIds.add(addedId);
  }

  return [...nextIds].sort();
}

export function evolveCulture(culture, evolution) {
  const normalizedCulture = normalizeCulture(culture);
  const normalizedEvolution = normalizeEvolution(evolution);

  const conflictingValueIds = normalizedEvolution.addedValueIds.filter((valueId) =>
    normalizedEvolution.removedValueIds.includes(valueId),
  );
  const conflictingTraditionIds = normalizedEvolution.addedTraditionIds.filter((traditionId) =>
    normalizedEvolution.removedTraditionIds.includes(traditionId),
  );

  if (conflictingValueIds.length > 0) {
    throw new RangeError('evolveCulture cannot add and remove the same value id in one evolution.');
  }

  if (conflictingTraditionIds.length > 0) {
    throw new RangeError('evolveCulture cannot add and remove the same tradition id in one evolution.');
  }

  return {
    ...normalizedCulture,
    openness: clampScore(normalizedCulture.openness + normalizedEvolution.opennessDelta),
    cohesion: clampScore(normalizedCulture.cohesion + normalizedEvolution.cohesionDelta),
    researchDrive: clampScore(
      normalizedCulture.researchDrive + normalizedEvolution.researchDriveDelta,
    ),
    valueIds: applyListEvolution(
      normalizedCulture.valueIds,
      normalizedEvolution.addedValueIds,
      normalizedEvolution.removedValueIds,
    ),
    traditionIds: applyListEvolution(
      normalizedCulture.traditionIds,
      normalizedEvolution.addedTraditionIds,
      normalizedEvolution.removedTraditionIds,
    ),
    lastEvolvedAt: normalizedEvolution.evolvedAt,
  };
}
