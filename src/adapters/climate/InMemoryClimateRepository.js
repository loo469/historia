import { ClimateRepositoryPort } from '../../application/ports/ClimateRepositoryPort.js';
import { ClimateState } from '../../domain/climate/ClimateState.js';

function normalizeClimateState(state) {
  if (state instanceof ClimateState) {
    return state;
  }

  return new ClimateState(state);
}

export class InMemoryClimateRepository extends ClimateRepositoryPort {
  constructor(seed = []) {
    super();
    this.states = new Map();

    this.saveMany(seed);
  }

  loadByRegionId(regionId) {
    const normalizedRegionId = String(regionId ?? '').trim();

    if (!normalizedRegionId) {
      throw new RangeError('InMemoryClimateRepository.loadByRegionId regionId is required.');
    }

    return this.states.get(normalizedRegionId) ?? null;
  }

  save(climateState) {
    const normalizedState = normalizeClimateState(climateState);
    this.states.set(normalizedState.regionId, normalizedState);
    return normalizedState;
  }

  deleteByRegionId(regionId) {
    const normalizedRegionId = String(regionId ?? '').trim();

    if (!normalizedRegionId) {
      throw new RangeError('InMemoryClimateRepository.deleteByRegionId regionId is required.');
    }

    return this.states.delete(normalizedRegionId);
  }

  snapshot() {
    return [...this.states.values()].map((state) => state.toJSON());
  }
}
