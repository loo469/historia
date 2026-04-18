import { FactionStateRepository } from '../../application/war/FactionStateRepository.js';

function normalizeFactionState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new TypeError('InMemoryFactionStateRepository state must be a plain object.');
  }

  const factionId = String(state.factionId ?? '').trim();

  if (!factionId) {
    throw new RangeError('InMemoryFactionStateRepository factionId is required.');
  }

  const occupiedProvinceIds = Array.isArray(state.occupiedProvinceIds)
    ? [...new Set(state.occupiedProvinceIds.map((provinceId) => String(provinceId ?? '').trim()))]
    : [];

  if (occupiedProvinceIds.some((provinceId) => provinceId.length === 0)) {
    throw new RangeError('InMemoryFactionStateRepository occupiedProvinceIds cannot contain empty values.');
  }

  return {
    ...state,
    factionId,
    occupiedProvinceIds: occupiedProvinceIds.sort(),
  };
}

export class InMemoryFactionStateRepository extends FactionStateRepository {
  constructor(states = []) {
    super();
    this.states = new Map();
    this.seed(states);
  }

  seed(states) {
    if (!Array.isArray(states)) {
      throw new TypeError('InMemoryFactionStateRepository states must be an array.');
    }

    for (const state of states) {
      const normalizedState = normalizeFactionState(state);
      this.states.set(normalizedState.factionId, normalizedState);
    }

    return this;
  }

  async getFactionStateById(factionId) {
    return this.states.get(String(factionId).trim()) ?? null;
  }

  async listFactionStates() {
    return [...this.states.values()].sort((left, right) => left.factionId.localeCompare(right.factionId));
  }

  async saveFactionState(state) {
    const normalizedState = normalizeFactionState(state);
    this.states.set(normalizedState.factionId, normalizedState);
    return normalizedState;
  }

  snapshot() {
    return [...this.states.values()]
      .sort((left, right) => left.factionId.localeCompare(right.factionId))
      .map((state) => ({ ...state, occupiedProvinceIds: [...state.occupiedProvinceIds] }));
  }
}
