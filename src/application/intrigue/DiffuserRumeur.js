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

function computeRumorPressure({ readiness, credibility, spread, targetStability, alertLevel }) {
  return Math.max(0, readiness + credibility + spread - targetStability - alertLevel);
}

export function diffuserRumeur({
  operation,
  rumor,
  target,
  alertLevel = 0,
  channelIds = rumor?.channelIds ?? [],
}) {
  const normalizedOperation = requireObject(operation, 'DiffuserRumeur operation');
  const normalizedRumor = requireObject(rumor, 'DiffuserRumeur rumor');
  const normalizedTarget = requireObject(target, 'DiffuserRumeur target');
  const normalizedAlertLevel = requireScore(alertLevel, 'DiffuserRumeur alertLevel');
  const normalizedChannelIds = normalizeUniqueTexts(channelIds, 'DiffuserRumeur channelIds');

  const operationId = requireText(normalizedOperation.id, 'DiffuserRumeur operation id');
  const rumorId = requireText(normalizedRumor.id, 'DiffuserRumeur rumor id');
  const targetId = requireText(normalizedTarget.id, 'DiffuserRumeur target id');
  const readiness = requireScore(normalizedOperation.readiness ?? 0, 'DiffuserRumeur operation readiness');
  const heat = requireScore(normalizedOperation.heat ?? 0, 'DiffuserRumeur operation heat');
  const credibility = requireScore(normalizedRumor.credibility ?? 0, 'DiffuserRumeur rumor credibility');
  const spread = requireScore(normalizedRumor.spread ?? 0, 'DiffuserRumeur rumor spread');
  const targetStability = requireScore(normalizedTarget.stability ?? 0, 'DiffuserRumeur target stability');
  const targetLegitimacy = requireScore(normalizedTarget.legitimacy ?? 0, 'DiffuserRumeur target legitimacy');

  if (normalizedChannelIds.length === 0) {
    return {
      propagated: false,
      outcome: 'no-rumor-channels',
      operation: { ...normalizedOperation, id: operationId },
      rumor: { ...normalizedRumor, id: rumorId },
      target: { ...normalizedTarget, id: targetId },
      summary: 'No rumor channel was available.',
      effect: {
        legitimacyLoss: 0,
        stabilityLoss: 0,
        panicGain: 0,
        reachedChannelIds: [],
      },
    };
  }

  const pressure = computeRumorPressure({
    readiness,
    credibility,
    spread,
    targetStability,
    alertLevel: normalizedAlertLevel,
  });
  const success = pressure > 0;
  const reachedChannelIds = success
    ? normalizedChannelIds.slice(0, Math.max(1, Math.floor(pressure / 25) + 1))
    : normalizedChannelIds.slice(0, 1);
  const legitimacyLoss = success ? Math.min(targetLegitimacy, Math.max(4, Math.round(pressure / 3))) : 0;
  const stabilityLoss = success ? Math.min(targetStability, Math.max(2, Math.round(pressure / 5))) : 0;
  const panicGain = success ? Math.min(100, Math.max(6, Math.round(pressure / 2))) : Math.max(2, Math.round(spread / 10));
  const heatIncrease = Math.min(100 - heat, success ? Math.max(5, 12 - Math.round(readiness / 15)) : 10);

  return {
    propagated: true,
    outcome: success ? 'rumor-spread' : 'rumor-contained',
    operation: {
      ...normalizedOperation,
      id: operationId,
      heat: heat + heatIncrease,
      phase: 'resolved',
      progress: 100,
    },
    rumor: {
      ...normalizedRumor,
      id: rumorId,
      channelIds: reachedChannelIds,
      lastOutcome: success ? 'spread' : 'contained',
    },
    target: {
      ...normalizedTarget,
      id: targetId,
      legitimacy: targetLegitimacy - legitimacyLoss,
      stability: targetStability - stabilityLoss,
      panic: Math.min(100, (normalizedTarget.panic ?? 0) + panicGain),
    },
    summary: success
      ? `Rumor spread through ${reachedChannelIds.length} channel(s).`
      : 'Rumor was contained before it caused lasting damage.',
    effect: {
      legitimacyLoss,
      stabilityLoss,
      panicGain,
      reachedChannelIds,
    },
  };
}
