function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function requireInteger(value, label, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
  }

  return value;
}

function requirePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('ClimateEventBusPort payload must be an object.');
  }

  return payload;
}

function normalizeBasePayload(payload) {
  const normalizedPayload = requirePayload(payload);

  return {
    regionId: requireText(normalizedPayload.regionId, 'ClimateEventBusPort regionId'),
    season: requireText(normalizedPayload.season, 'ClimateEventBusPort season'),
    droughtIndex: requireInteger(normalizedPayload.droughtIndex, 'ClimateEventBusPort droughtIndex', 0, 100),
    precipitationLevel: requireInteger(normalizedPayload.precipitationLevel, 'ClimateEventBusPort precipitationLevel', 0, 100),
    anomaly: normalizedPayload.anomaly === null || normalizedPayload.anomaly === undefined
      ? null
      : requireText(normalizedPayload.anomaly, 'ClimateEventBusPort anomaly'),
  };
}

function normalizeHarvestImpactPayload(payload) {
  const normalizedPayload = requirePayload(payload);
  const basePayload = normalizeBasePayload(normalizedPayload);

  return {
    ...basePayload,
    resourceId: requireText(normalizedPayload.resourceId, 'ClimateEventBusPort resourceId'),
    impactLevel: requireInteger(normalizedPayload.impactLevel, 'ClimateEventBusPort impactLevel', -100, 100),
    cause: requireText(normalizedPayload.cause ?? 'climate-harvest-impact', 'ClimateEventBusPort cause'),
  };
}

function normalizeUnrestImpactPayload(payload) {
  const normalizedPayload = requirePayload(payload);
  const basePayload = normalizeBasePayload(normalizedPayload);

  return {
    ...basePayload,
    unrestDelta: requireInteger(normalizedPayload.unrestDelta, 'ClimateEventBusPort unrestDelta', -100, 100),
    severity: requireText(normalizedPayload.severity ?? 'moderate', 'ClimateEventBusPort severity'),
    cause: requireText(normalizedPayload.cause ?? 'climate-unrest-impact', 'ClimateEventBusPort cause'),
  };
}

export class ClimateEventBusPort {
  async publish(_eventName, _payload) {
    throw new Error('ClimateEventBusPort.publish must be implemented by an adapter.');
  }

  async publishHarvestImpact(payload) {
    return this.publish('climate.harvest-impact.detected', normalizeHarvestImpactPayload(payload));
  }

  async publishUnrestImpact(payload) {
    return this.publish('climate.unrest-impact.detected', normalizeUnrestImpactPayload(payload));
  }
}
