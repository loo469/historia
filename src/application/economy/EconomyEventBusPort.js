function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function requireInteger(value, label, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
  }

  return value;
}

function requirePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('EconomyEventBusPort payload must be an object.');
  }

  return payload;
}

function normalizeShortagePayload(payload) {
  const normalizedPayload = requirePayload(payload);

  return {
    cityId: requireText(normalizedPayload.cityId, 'EconomyEventBusPort cityId'),
    resourceId: requireText(normalizedPayload.resourceId, 'EconomyEventBusPort resourceId'),
    shortageQuantity: requireInteger(
      normalizedPayload.shortageQuantity,
      'EconomyEventBusPort shortageQuantity',
      1,
      Number.MAX_SAFE_INTEGER,
    ),
    requiredQuantity: requireInteger(
      normalizedPayload.requiredQuantity ?? normalizedPayload.shortageQuantity,
      'EconomyEventBusPort requiredQuantity',
      0,
      Number.MAX_SAFE_INTEGER,
    ),
    availableQuantity: requireInteger(
      normalizedPayload.availableQuantity ?? 0,
      'EconomyEventBusPort availableQuantity',
      0,
      Number.MAX_SAFE_INTEGER,
    ),
    cause: requireText(normalizedPayload.cause ?? 'consumption-shortage', 'EconomyEventBusPort cause'),
  };
}

function normalizeSurplusPayload(payload) {
  const normalizedPayload = requirePayload(payload);

  return {
    cityId: requireText(normalizedPayload.cityId, 'EconomyEventBusPort cityId'),
    resourceId: requireText(normalizedPayload.resourceId, 'EconomyEventBusPort resourceId'),
    surplusQuantity: requireInteger(
      normalizedPayload.surplusQuantity,
      'EconomyEventBusPort surplusQuantity',
      1,
      Number.MAX_SAFE_INTEGER,
    ),
    availableQuantity: requireInteger(
      normalizedPayload.availableQuantity ?? normalizedPayload.surplusQuantity,
      'EconomyEventBusPort availableQuantity',
      0,
      Number.MAX_SAFE_INTEGER,
    ),
    desiredQuantity: requireInteger(
      normalizedPayload.desiredQuantity ?? 0,
      'EconomyEventBusPort desiredQuantity',
      0,
      Number.MAX_SAFE_INTEGER,
    ),
    cause: requireText(normalizedPayload.cause ?? 'stock-surplus', 'EconomyEventBusPort cause'),
  };
}

export class EconomyEventBusPort {
  async publish(_eventName, _payload) {
    throw new Error('EconomyEventBusPort.publish must be implemented by an adapter.');
  }

  async publishShortage(payload) {
    return this.publish('economy.shortage.detected', normalizeShortagePayload(payload));
  }

  async publishSurplus(payload) {
    return this.publish('economy.surplus.detected', normalizeSurplusPayload(payload));
  }
}
