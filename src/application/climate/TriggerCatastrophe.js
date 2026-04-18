import { Catastrophe } from '../../domain/climate/Catastrophe.js';
import { ClimateState } from '../../domain/climate/ClimateState.js';

function normalizeRegionalStates(regionalStates) {
  if (!Array.isArray(regionalStates)) {
    throw new RangeError('TriggerCatastrophe regionalStates must be an array.');
  }

  return regionalStates.map((state) => {
    if (state instanceof ClimateState) {
      return state;
    }

    return new ClimateState(state);
  });
}

function normalizeThresholds(thresholds = {}) {
  return {
    droughtIndex: Number.isFinite(thresholds.droughtIndex) ? thresholds.droughtIndex : 70,
    precipitationLevel: Number.isFinite(thresholds.precipitationLevel) ? thresholds.precipitationLevel : 18,
    temperatureC: Number.isFinite(thresholds.temperatureC) ? thresholds.temperatureC : 34,
    floodPrecipitationLevel: Number.isFinite(thresholds.floodPrecipitationLevel) ? thresholds.floodPrecipitationLevel : 82,
  };
}

function buildDefaultImpact(state, type) {
  if (type === 'drought') {
    return {
      harvest: -Math.min(60, Math.round(state.droughtIndex * 0.6)),
      unrest: Math.round(Math.max(5, state.droughtIndex * 0.18)),
    };
  }

  if (type === 'flood') {
    return {
      infrastructure: -Math.round(Math.max(10, state.precipitationLevel * 0.35)),
      harvest: -Math.round(Math.max(8, state.precipitationLevel * 0.2)),
    };
  }

  return {
    unrest: -10,
  };
}

function decideCatastropheType(state, thresholds) {
  if (state.droughtIndex >= thresholds.droughtIndex && state.precipitationLevel <= thresholds.precipitationLevel) {
    return {
      type: 'drought',
      severity: state.droughtIndex >= thresholds.droughtIndex + 15 ? 'critical' : 'major',
    };
  }

  if (state.precipitationLevel >= thresholds.floodPrecipitationLevel && state.temperatureC <= thresholds.temperatureC - 10) {
    return {
      type: 'flood',
      severity: state.precipitationLevel >= thresholds.floodPrecipitationLevel + 10 ? 'critical' : 'major',
    };
  }

  if (state.anomaly === 'heatwave' && state.temperatureC >= thresholds.temperatureC) {
    return {
      type: 'heatwave',
      severity: state.temperatureC >= thresholds.temperatureC + 4 ? 'critical' : 'major',
    };
  }

  return null;
}

export class TriggerCatastrophe {
  execute({ regionalStates, triggeredAt = new Date(), thresholds } = {}) {
    const states = normalizeRegionalStates(regionalStates);
    const normalizedThresholds = normalizeThresholds(thresholds);
    const catastrophes = [];
    const updatedRegionalStates = [];

    for (const state of states) {
      const catastropheDecision = decideCatastropheType(state, normalizedThresholds);

      if (catastropheDecision === null || state.activeCatastropheIds.length > 0) {
        updatedRegionalStates.push(state);
        continue;
      }

      const catastrophe = new Catastrophe({
        id: `${state.regionId}-${catastropheDecision.type}-${state.season}`,
        type: catastropheDecision.type,
        severity: catastropheDecision.severity,
        status: 'active',
        regionIds: [state.regionId],
        startedAt: triggeredAt,
        impact: buildDefaultImpact(state, catastropheDecision.type),
        description: `${catastropheDecision.type} in ${state.regionId} during ${state.season}`,
      });

      catastrophes.push(catastrophe);
      updatedRegionalStates.push(state.activateCatastrophe(catastrophe.id));
    }

    return {
      catastrophes,
      updatedRegionalStates,
      triggeredCount: catastrophes.length,
    };
  }
}
