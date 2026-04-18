import { ClimateState } from '../../domain/climate/ClimateState.js';
import { SeasonCycle } from '../../domain/climate/SeasonCycle.js';

function normalizeRegionalStates(regionalStates) {
  if (!Array.isArray(regionalStates)) {
    throw new RangeError('AdvanceSeasons regionalStates must be an array.');
  }

  return regionalStates.map((state) => {
    if (state instanceof ClimateState) {
      return state;
    }

    return new ClimateState(state);
  });
}

function computeSeasonalShift(fromSeason, toSeason) {
  const transitions = {
    'spring:summer': { temperatureDelta: 6, precipitationDelta: -8, droughtDelta: 10 },
    'summer:autumn': { temperatureDelta: -7, precipitationDelta: 10, droughtDelta: -8 },
    'autumn:winter': { temperatureDelta: -9, precipitationDelta: 6, droughtDelta: -6 },
    'winter:spring': { temperatureDelta: 8, precipitationDelta: -2, droughtDelta: 2 },
  };

  return transitions[`${fromSeason}:${toSeason}`] ?? { temperatureDelta: 0, precipitationDelta: 0, droughtDelta: 0 };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class AdvanceSeasons {
  execute({ seasonCycle, regionalStates }) {
    const currentCycle = seasonCycle instanceof SeasonCycle ? seasonCycle : new SeasonCycle(seasonCycle);
    const states = normalizeRegionalStates(regionalStates);
    const nextCycle = currentCycle.advanceSeason();
    const shift = computeSeasonalShift(currentCycle.currentSeason, nextCycle.currentSeason);

    const updatedRegionalStates = states.map((state) =>
      state.withSeason(nextCycle.currentSeason).withReadings({
        temperatureC: state.temperatureC + shift.temperatureDelta,
        precipitationLevel: clamp(state.precipitationLevel + shift.precipitationDelta, 0, 100),
        droughtIndex: clamp(state.droughtIndex + shift.droughtDelta, 0, 100),
        anomaly: state.anomaly,
      }),
    );

    return {
      previousCycle: currentCycle,
      nextCycle,
      updatedRegionalStates,
    };
  }
}
