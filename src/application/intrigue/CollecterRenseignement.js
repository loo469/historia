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

export function collecterRenseignement({
  operation,
  agent,
  target,
  randomFactor = 0,
  intelTags = [],
}) {
  const normalizedOperation = requireObject(operation, 'CollecterRenseignement operation');
  const normalizedAgent = requireObject(agent, 'CollecterRenseignement agent');
  const normalizedTarget = requireObject(target, 'CollecterRenseignement target');
  const normalizedRandomFactor = requireScore(randomFactor, 'CollecterRenseignement randomFactor');
  const normalizedIntelTags = normalizeUniqueTexts(intelTags, 'CollecterRenseignement intelTags');

  const operationId = requireText(normalizedOperation.id, 'CollecterRenseignement operation id');
  const agentId = requireText(normalizedAgent.id, 'CollecterRenseignement agent id');
  const targetId = requireText(normalizedTarget.id, 'CollecterRenseignement target id');
  const detectionRisk = requireScore(
    normalizedOperation.detectionRisk ?? 0,
    'CollecterRenseignement operation detectionRisk',
  );
  const progress = requireScore(
    normalizedOperation.progress ?? 0,
    'CollecterRenseignement operation progress',
  );
  const heat = requireScore(normalizedOperation.heat ?? 0, 'CollecterRenseignement operation heat');
  const agentDiscretion = requireScore(normalizedAgent.discretion ?? 0, 'CollecterRenseignement agent discretion');
  const agentInfluence = requireScore(normalizedAgent.influence ?? 0, 'CollecterRenseignement agent influence');
  const targetSecrecy = requireScore(normalizedTarget.secrecy ?? 0, 'CollecterRenseignement target secrecy');
  const targetStability = requireScore(normalizedTarget.stability ?? 0, 'CollecterRenseignement target stability');

  const intelScore = Math.max(
    0,
    Math.min(
      100,
      Math.round((agentDiscretion + agentInfluence + progress + normalizedRandomFactor - targetSecrecy) / 3),
    ),
  );
  const successful = intelScore >= 35;
  const credibility = successful
    ? Math.min(100, Math.max(30, intelScore + Math.round((100 - targetStability) / 5)))
    : Math.max(0, Math.round(intelScore / 2));
  const heatIncrease = Math.min(100 - heat, successful ? Math.max(3, Math.round(detectionRisk / 8)) : Math.max(8, Math.round(detectionRisk / 5)));
  const nextHeat = heat + heatIncrease;
  const discoveredTags = successful
    ? normalizedIntelTags.slice(0, Math.max(1, Math.ceil(intelScore / 30)))
    : [];

  return {
    collected: successful,
    outcome: successful ? 'intel-collected' : 'intel-compromised',
    operation: {
      ...normalizedOperation,
      id: operationId,
      heat: nextHeat,
      progress: Math.min(100, progress + (successful ? 20 : 10)),
    },
    agent: {
      ...normalizedAgent,
      id: agentId,
    },
    target: {
      ...normalizedTarget,
      id: targetId,
    },
    report: {
      credibility,
      intelScore,
      discoveredTags,
    },
    summary: successful
      ? `Collected ${discoveredTags.length} actionable intelligence tag(s).`
      : 'The intelligence sweep produced fragmented or compromised information.',
  };
}
