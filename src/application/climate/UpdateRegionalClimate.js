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

function buildProgression(previousState, nextState) {
  return {
    regionId: nextState.regionId,
    seasonChanged: previousState.season !== nextState.season,
    temperatureDelta: nextState.temperatureC - previousState.temperatureC,
    precipitationDelta: nextState.precipitationLevel - previousState.precipitationLevel,
    droughtDelta: nextState.droughtIndex - previousState.droughtIndex,
    summary: [
      previousState.season !== nextState.season ? `${previousState.season} → ${nextState.season}` : null,
      `temp ${nextState.temperatureC - previousState.temperatureC >= 0 ? '+' : ''}${nextState.temperatureC - previousState.temperatureC}°C`,
      `précip ${nextState.precipitationLevel - previousState.precipitationLevel >= 0 ? '+' : ''}${nextState.precipitationLevel - previousState.precipitationLevel}`,
      `sécheresse ${nextState.droughtIndex - previousState.droughtIndex >= 0 ? '+' : ''}${nextState.droughtIndex - previousState.droughtIndex}`,
    ].filter(Boolean).join(', '),
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
      progressionByRegion: Object.fromEntries(updatedRegionalStates.map((state, index) => [
        state.regionId,
        buildProgression(states[index], state),
      ])),
    };
  }
}
