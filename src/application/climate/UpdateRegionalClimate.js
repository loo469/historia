import { ClimateState } from '../../domain/climate/ClimateState.js';

function normalizeRegionalStates(regionalStates) {
  if (!Array.isArray(regionalStates)) {
    throw new RangeError('UpdateRegionalClimate regionalStates must be an array.');
  }

  return regionalStates.map((state) => {
    if (state instanceof ClimateState) {
      return state;
    }

    return new ClimateState(state);
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeShift(shift = {}) {
  return {
    temperatureDelta: Number.isFinite(shift.temperatureDelta) ? shift.temperatureDelta : 0,
    precipitationDelta: Number.isFinite(shift.precipitationDelta) ? shift.precipitationDelta : 0,
    droughtDelta: Number.isFinite(shift.droughtDelta) ? shift.droughtDelta : 0,
  };
}

export class UpdateRegionalClimate {
  execute({ regionalStates, shiftsByRegionId = {}, defaultShift = {}, nextSeason } = {}) {
    const states = normalizeRegionalStates(regionalStates);
    const normalizedDefaultShift = normalizeShift(defaultShift);

    const updatedRegionalStates = states.map((state) => {
      const regionalShift = normalizeShift(shiftsByRegionId[state.regionId]);
      const shift = {
        temperatureDelta: normalizedDefaultShift.temperatureDelta + regionalShift.temperatureDelta,
        precipitationDelta: normalizedDefaultShift.precipitationDelta + regionalShift.precipitationDelta,
        droughtDelta: normalizedDefaultShift.droughtDelta + regionalShift.droughtDelta,
      };

      return state.withSeason(nextSeason ?? state.season).withReadings({
        temperatureC: state.temperatureC + shift.temperatureDelta,
        precipitationLevel: clamp(state.precipitationLevel + shift.precipitationDelta, 0, 100),
        droughtIndex: clamp(state.droughtIndex + shift.droughtDelta, 0, 100),
      });
    });

    return {
      updatedRegionalStates,
      appliedShiftCount: updatedRegionalStates.length,
    };
  }
}
