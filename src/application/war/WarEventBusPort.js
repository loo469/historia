function requireEventName(eventName) {
  const normalizedEventName = String(eventName ?? '').trim();

  if (!normalizedEventName) {
    throw new RangeError('WarEventBusPort eventName is required.');
  }

  return normalizedEventName;
}

function requirePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('WarEventBusPort payload must be an object.');
  }

  return { ...payload };
}

function normalizeFrontChange(payload) {
  return {
    frontId: String(payload.frontId ?? '').trim(),
    changeType: String(payload.changeType ?? '').trim(),
    attackerFactionId: String(payload.attackerFactionId ?? '').trim(),
    defenderFactionId: String(payload.defenderFactionId ?? '').trim(),
    pressureDelta: payload.pressureDelta,
  };
}

function requireFrontChangePayload(payload) {
  const normalizedPayload = normalizeFrontChange(requirePayload(payload));

  if (!normalizedPayload.frontId) {
    throw new RangeError('WarEventBusPort frontId is required.');
  }

  if (!normalizedPayload.changeType) {
    throw new RangeError('WarEventBusPort changeType is required.');
  }

  if (!normalizedPayload.attackerFactionId) {
    throw new RangeError('WarEventBusPort attackerFactionId is required.');
  }

  if (!normalizedPayload.defenderFactionId) {
    throw new RangeError('WarEventBusPort defenderFactionId is required.');
  }

  if (!Number.isInteger(normalizedPayload.pressureDelta)) {
    throw new RangeError('WarEventBusPort pressureDelta must be an integer.');
  }

  return normalizedPayload;
}

export class WarEventBusPort {
  async publish(_eventName, _payload) {
    throw new Error('WarEventBusPort.publish must be implemented by an adapter.');
  }

  async publishFrontChange(eventName, payload) {
    const normalizedEventName = requireEventName(eventName);
    const normalizedPayload = requireFrontChangePayload(payload);

    return this.publish(normalizedEventName, normalizedPayload);
  }
}
