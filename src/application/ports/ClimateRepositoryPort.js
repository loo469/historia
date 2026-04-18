import { ClimateState } from '../../domain/climate/ClimateState.js';

function normalizeClimateState(state) {
  if (state instanceof ClimateState) {
    return state;
  }

  return new ClimateState(state);
}

export class ClimateRepositoryPort {
  loadByRegionId(regionId) {
    throw new Error(`ClimateRepositoryPort.loadByRegionId must be implemented for region ${regionId ?? 'unknown'}.`);
  }

  save(climateState) {
    throw new Error(`ClimateRepositoryPort.save must be implemented for region ${climateState?.regionId ?? 'unknown'}.`);
  }

  loadMany(regionIds) {
    if (!Array.isArray(regionIds)) {
      throw new RangeError('ClimateRepositoryPort.loadMany regionIds must be an array.');
    }

    return regionIds.map((regionId) => this.loadByRegionId(regionId));
  }

  saveMany(climateStates) {
    if (!Array.isArray(climateStates)) {
      throw new RangeError('ClimateRepositoryPort.saveMany climateStates must be an array.');
    }

    return climateStates.map((state) => this.save(normalizeClimateState(state)));
  }
}
