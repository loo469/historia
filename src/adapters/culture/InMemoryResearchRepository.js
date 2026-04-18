import { ResearchRepositoryPort } from '../../domain/culture/ResearchRepositoryPort.js';

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeUniqueTexts(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const normalizedValues = [...new Set(values.map((value) => requireText(value, label)))];
  return normalizedValues.sort();
}

function normalizeResearchState(researchState) {
  if (!researchState || typeof researchState !== 'object' || Array.isArray(researchState)) {
    throw new TypeError('InMemoryResearchRepository researchState must be an object.');
  }

  return {
    ...researchState,
    id: requireText(researchState.id, 'InMemoryResearchRepository researchState.id'),
    cultureId: requireText(
      researchState.cultureId,
      'InMemoryResearchRepository researchState.cultureId',
    ),
    focusIds: normalizeUniqueTexts(
      researchState.focusIds ?? [],
      'InMemoryResearchRepository researchState.focusIds[]',
    ),
  };
}

function cloneResearchState(researchState) {
  return {
    ...researchState,
    focusIds: [...researchState.focusIds],
  };
}

export class InMemoryResearchRepository extends ResearchRepositoryPort {
  constructor(initialResearchStates = []) {
    super();
    this.researchStates = new Map();

    for (const researchState of initialResearchStates) {
      const normalizedResearchState = normalizeResearchState(researchState);
      this.researchStates.set(normalizedResearchState.id, normalizedResearchState);
    }
  }

  async getById(researchStateId) {
    const normalizedResearchStateId = requireText(
      researchStateId,
      'ResearchRepositoryPort researchStateId',
    );
    const researchState = this.researchStates.get(normalizedResearchStateId);

    return researchState ? cloneResearchState(researchState) : null;
  }

  async save(researchState) {
    const normalizedResearchState = normalizeResearchState(researchState);
    this.researchStates.set(normalizedResearchState.id, normalizedResearchState);
    return cloneResearchState(normalizedResearchState);
  }

  async listByCulture(cultureId) {
    const normalizedCultureId = requireText(cultureId, 'ResearchRepositoryPort cultureId');

    return [...this.researchStates.values()]
      .filter((researchState) => researchState.cultureId === normalizedCultureId)
      .map((researchState) => cloneResearchState(researchState));
  }
}
