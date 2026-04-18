import { ClimateRepositoryPort } from '../../application/ports/ClimateRepositoryPort.js';
import { ClimateState } from '../../domain/climate/ClimateState.js';

function requireRegionId(regionId, operation) {
  const normalizedRegionId = String(regionId ?? '').trim();

  if (!normalizedRegionId) {
    throw new RangeError(`InMemoryClimateRepository.${operation} regionId is required.`);
  }

  return normalizedRegionId;
}

function normalizeClimateState(state) {
  if (state instanceof ClimateState) {
    return new ClimateState(state.toJSON());
  }

  if (state === null || typeof state !== 'object' || Array.isArray(state)) {
    throw new TypeError('InMemoryClimateRepository climate state must be a ClimateState or plain object.');
  }

  return new ClimateState(state);
}

export class InMemoryClimateRepository extends ClimateRepositoryPort {
  constructor(seed = []) {
    super();

    if (!Array.isArray(seed)) {
      throw new TypeError('InMemoryClimateRepository seed must be an array.');
    }

    this.states = new Map();

    for (const state of seed) {
      this.save(state);
    }
  }

  loadByRegionId(regionId) {
    const normalizedRegionId = requireRegionId(regionId, 'loadByRegionId');
    const state = this.states.get(normalizedRegionId);
    return state ? new ClimateState(state.toJSON()) : null;
  }

  save(climateState) {
    const normalizedState = normalizeClimateState(climateState);
    this.states.set(normalizedState.regionId, normalizedState);
    return new ClimateState(normalizedState.toJSON());
  }

  deleteByRegionId(regionId) {
    const normalizedRegionId = requireRegionId(regionId, 'deleteByRegionId');
    return this.states.delete(normalizedRegionId);
  }

  snapshot() {
    return [...this.states.values()]
      .sort((left, right) => left.regionId.localeCompare(right.regionId))
      .map((state) => state.toJSON());
  }
}
