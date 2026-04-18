function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return value;
}

function normalizeUniqueTexts(values, label) {
  const normalizedValues = [...new Set(requireArray(values, label).map((value) => String(value).trim()))];

  if (normalizedValues.some((value) => value.length === 0)) {
    throw new RangeError(`${label} cannot contain empty values.`);
  }

  return normalizedValues.sort();
}

function requireResearchState(researchState) {
  if (!researchState || typeof researchState !== 'object' || Array.isArray(researchState)) {
    throw new TypeError('ResearchRepositoryPort researchState must be an object.');
  }

  return {
    ...researchState,
    id: requireText(researchState.id, 'ResearchRepositoryPort researchState.id'),
    cultureId: requireText(researchState.cultureId, 'ResearchRepositoryPort researchState.cultureId'),
    focusIds: normalizeUniqueTexts(
      researchState.focusIds ?? [],
      'ResearchRepositoryPort researchState.focusIds',
    ),
  };
}

export class ResearchRepositoryPort {
  async getById(researchStateId) {
    requireText(researchStateId, 'ResearchRepositoryPort researchStateId');
    throw new Error('ResearchRepositoryPort.getById must be implemented by an adapter.');
  }

  async save(researchState) {
    requireResearchState(researchState);
    throw new Error('ResearchRepositoryPort.save must be implemented by an adapter.');
  }

  async listByCulture(cultureId) {
    requireText(cultureId, 'ResearchRepositoryPort cultureId');
    throw new Error('ResearchRepositoryPort.listByCulture must be implemented by an adapter.');
  }
}
