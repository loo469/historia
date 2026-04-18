import { ClimateState } from '../../domain/climate/ClimateState.js';

function requireEventBus(eventBus) {
  if (!eventBus || typeof eventBus.publishUnrestImpact !== 'function') {
    throw new TypeError('EmitUnrestClimateEvents eventBus must expose publishUnrestImpact(payload).');
  }

  return eventBus;
}

function normalizeClimateState(climateState) {
  if (climateState instanceof ClimateState) {
    return climateState;
  }

  if (climateState === null || typeof climateState !== 'object' || Array.isArray(climateState)) {
    throw new TypeError('EmitUnrestClimateEvents climateState must be a ClimateState or plain object.');
  }

  return new ClimateState(climateState);
}

function normalizeUnrestDelta(unrestDelta) {
  if (!Number.isInteger(unrestDelta) || unrestDelta < -100 || unrestDelta > 100) {
    throw new RangeError('EmitUnrestClimateEvents unrestDelta must be an integer between -100 and 100.');
  }

  return unrestDelta;
}

function normalizeSeverity(severity) {
  const normalizedSeverity = String(severity ?? '').trim();

  if (!normalizedSeverity) {
    throw new RangeError('EmitUnrestClimateEvents severity is required.');
  }

  return normalizedSeverity;
}

function normalizeCause(cause) {
  const normalizedCause = String(cause ?? '').trim();

  if (!normalizedCause) {
    throw new RangeError('EmitUnrestClimateEvents cause is required.');
  }

  return normalizedCause;
}

export async function emitUnrestClimateEvents({
  eventBus,
  climateState,
  unrestDelta,
  severity,
  cause = 'climate-unrest-impact',
} = {}) {
  const normalizedEventBus = requireEventBus(eventBus);
  const normalizedClimateState = normalizeClimateState(climateState);
  const normalizedUnrestDelta = normalizeUnrestDelta(unrestDelta);

  if (normalizedUnrestDelta === 0) {
    return [];
  }

  const event = await normalizedEventBus.publishUnrestImpact({
    regionId: normalizedClimateState.regionId,
    season: normalizedClimateState.season,
    unrestDelta: normalizedUnrestDelta,
    droughtIndex: normalizedClimateState.droughtIndex,
    precipitationLevel: normalizedClimateState.precipitationLevel,
    anomaly: normalizedClimateState.anomaly,
    severity: normalizeSeverity(severity ?? 'moderate'),
    cause: normalizeCause(cause),
  });

  return [event];
}
