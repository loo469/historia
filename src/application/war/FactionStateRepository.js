function requireFactionId(factionId) {
  const normalizedFactionId = String(factionId ?? '').trim();

  if (!normalizedFactionId) {
    throw new RangeError('FactionStateRepository factionId is required.');
  }

  return normalizedFactionId;
}

function requireFactionState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new TypeError('FactionStateRepository state must be an object.');
  }

  return {
    ...state,
    factionId: requireFactionId(state.factionId),
  };
}

export class FactionStateRepository {
  async getFactionStateById(_factionId) {
    throw new Error('FactionStateRepository.getFactionStateById must be implemented by an adapter.');
  }

  async listFactionStates() {
    throw new Error('FactionStateRepository.listFactionStates must be implemented by an adapter.');
  }

  async saveFactionState(_state) {
    throw new Error('FactionStateRepository.saveFactionState must be implemented by an adapter.');
  }

  async requireFactionStateById(factionId) {
    const normalizedFactionId = requireFactionId(factionId);
    const state = await this.getFactionStateById(normalizedFactionId);

    if (!state || state.factionId !== normalizedFactionId) {
      throw new RangeError(`FactionStateRepository could not find faction state ${normalizedFactionId}.`);
    }

    return state;
  }

  async saveAll(states) {
    if (!Array.isArray(states)) {
      throw new TypeError('FactionStateRepository states must be an array.');
    }

    const savedStates = [];

    for (const state of states) {
      savedStates.push(await this.saveFactionState(requireFactionState(state)));
    }

    return savedStates;
  }
}
