function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function requireScore(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new RangeError(`${label} must be an integer between 0 and 100.`);
  }

  return value;
}

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeUniqueTexts(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const normalizedValues = [...new Set(values.map((value) => String(value).trim()))];

  if (normalizedValues.some((value) => value.length === 0)) {
    throw new RangeError(`${label} cannot contain empty values.`);
  }

  return normalizedValues.sort();
}

function computeIntelYield({ readiness, targetSecurity, targetSecrecy, randomFactor }) {
  return Math.max(0, readiness + randomFactor - Math.round((targetSecurity + targetSecrecy) / 2));
}

export function collecterRenseignement({
  operation,
  target,
  randomFactor = 0,
  intelChannelIds = target?.intelChannelIds ?? [],
}) {
  const normalizedOperation = requireObject(operation, 'CollecterRenseignement operation');
  const normalizedTarget = requireObject(target, 'CollecterRenseignement target');
  const normalizedRandomFactor = requireScore(randomFactor, 'CollecterRenseignement randomFactor');
  const normalizedIntelChannelIds = normalizeUniqueTexts(
    intelChannelIds,
    'CollecterRenseignement intelChannelIds',
  );

  const operationId = requireText(normalizedOperation.id, 'CollecterRenseignement operation id');
  const targetId = requireText(normalizedTarget.id, 'CollecterRenseignement target id');
  const readiness = requireScore(normalizedOperation.readiness ?? 0, 'CollecterRenseignement operation readiness');
  const heat = requireScore(normalizedOperation.heat ?? 0, 'CollecterRenseignement operation heat');
  const targetSecurity = requireScore(normalizedTarget.security ?? 0, 'CollecterRenseignement target security');
  const targetSecrecy = requireScore(normalizedTarget.secrecy ?? 0, 'CollecterRenseignement target secrecy');
  const targetAwareness = requireScore(normalizedTarget.awareness ?? 0, 'CollecterRenseignement target awareness');

  if (normalizedIntelChannelIds.length === 0) {
    return {
      collected: false,
      outcome: 'no-intel-channels',
      operation: { ...normalizedOperation, id: operationId },
      target: { ...normalizedTarget, id: targetId },
      summary: 'No intelligence channel was available.',
      intel: {
        intelPoints: 0,
        insightLevel: 0,
        heatIncrease: 0,
        compromisedChannelIds: [],
      },
    };
  }

  const yieldScore = computeIntelYield({
    readiness,
    targetSecurity,
    targetSecrecy,
    randomFactor: normalizedRandomFactor,
  });
  const success = yieldScore > 0;
  const compromisedChannelIds = success
    ? normalizedIntelChannelIds.slice(0, Math.max(1, Math.floor(yieldScore / 25) + 1))
    : [];
  const intelPoints = success ? Math.max(6, Math.round(yieldScore / 2)) : 0;
  const insightLevel = success ? Math.min(100, Math.max(8, Math.round(yieldScore / 1.5))) : 0;
  const awarenessGain = success ? Math.max(4, Math.round(yieldScore / 6)) : Math.max(2, Math.round(normalizedRandomFactor / 10));
  const heatIncrease = Math.min(100 - heat, success ? Math.max(4, 10 - Math.round(readiness / 20)) : 9);

  return {
    collected: true,
    outcome: success ? 'intel-collected' : 'intel-denied',
    operation: {
      ...normalizedOperation,
      id: operationId,
      heat: heat + heatIncrease,
      phase: 'resolved',
      progress: 100,
    },
    target: {
      ...normalizedTarget,
      id: targetId,
      awareness: Math.min(100, targetAwareness + awarenessGain),
      compromisedChannelIds,
    },
    summary: success
      ? `Collected intelligence through ${compromisedChannelIds.length} channel(s).`
      : 'Target security denied meaningful intelligence collection.',
    intel: {
      intelPoints,
      insightLevel,
      heatIncrease,
      compromisedChannelIds,
    },
  };
}
