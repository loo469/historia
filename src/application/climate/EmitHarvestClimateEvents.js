import { ClimateState } from '../../domain/climate/ClimateState.js';

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function requireEventBus(eventBus) {
  if (!eventBus || typeof eventBus.publishHarvestImpact !== 'function') {
    throw new TypeError('EmitHarvestClimateEvents eventBus must expose publishHarvestImpact(payload).');
  }

  return eventBus;
}

function normalizeClimateState(climateState) {
  if (climateState instanceof ClimateState) {
    return climateState;
  }

  if (climateState === null || typeof climateState !== 'object' || Array.isArray(climateState)) {
    throw new TypeError('EmitHarvestClimateEvents climateState must be a ClimateState or plain object.');
  }

  return new ClimateState(climateState);
}

function normalizeImpactMap(impactsByResource, label) {
  requireObject(impactsByResource, label);

  return Object.fromEntries(
    Object.entries(impactsByResource)
      .map(([resourceId, impactLevel]) => {
        const normalizedResourceId = String(resourceId ?? '').trim();

        if (!normalizedResourceId) {
          throw new RangeError(`${label} cannot contain an empty resource id.`);
        }

        if (!Number.isInteger(impactLevel) || impactLevel < -100 || impactLevel > 100) {
          throw new RangeError(`${label} impact levels must be integers between -100 and 100.`);
        }

        return [normalizedResourceId, impactLevel];
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

export async function emitHarvestClimateEvents({
  eventBus,
  climateState,
  impactsByResource,
  cause = 'climate-harvest-impact',
} = {}) {
  const normalizedEventBus = requireEventBus(eventBus);
  const normalizedClimateState = normalizeClimateState(climateState);
  const normalizedImpacts = normalizeImpactMap(impactsByResource, 'EmitHarvestClimateEvents impactsByResource');
  const normalizedCause = String(cause ?? '').trim();

  if (!normalizedCause) {
    throw new RangeError('EmitHarvestClimateEvents cause is required.');
  }

  const events = [];

  for (const [resourceId, impactLevel] of Object.entries(normalizedImpacts)) {
    if (impactLevel === 0) {
      continue;
    }

    const event = await normalizedEventBus.publishHarvestImpact({
      regionId: normalizedClimateState.regionId,
      season: normalizedClimateState.season,
      resourceId,
      impactLevel,
      droughtIndex: normalizedClimateState.droughtIndex,
      precipitationLevel: normalizedClimateState.precipitationLevel,
      anomaly: normalizedClimateState.anomaly,
      cause: normalizedCause,
    });

    events.push(event);
  }

  return events;
}
