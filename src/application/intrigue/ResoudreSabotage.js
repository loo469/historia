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

function deriveOutcomeSeverity({ readiness, targetStability, targetSecurity, randomFactor }) {
  return Math.max(0, readiness + randomFactor - Math.round((targetStability + targetSecurity) / 2));
}

function buildSabotageEvents({
  operationId,
  targetId,
  outcome,
  damage,
}) {
  const events = [
    {
      type: 'intrigue.sabotage.resolved',
      operationId,
      targetId,
      outcome,
      damage: { ...damage },
    },
  ];

  if (outcome === 'sabotage-succeeded') {
    events.push({
      type: 'intrigue.sabotage.damage-inflicted',
      operationId,
      targetId,
      industryLoss: damage.industryLoss,
      stabilityLoss: damage.stabilityLoss,
      disruptedInfrastructureIds: [...damage.disruptedInfrastructureIds],
    });
  }

  if (outcome === 'sabotage-failed') {
    events.push({
      type: 'intrigue.sabotage.failed',
      operationId,
      targetId,
      heatIncrease: damage.heatIncrease,
    });
  }

  if (outcome === 'no-target-infrastructure') {
    events.push({
      type: 'intrigue.sabotage.no-target',
      operationId,
      targetId,
    });
  }

  return events;
}

export function resoudreSabotage({
  operation,
  target,
  randomFactor = 0,
  infrastructureIds = target?.infrastructureIds ?? [],
}) {
  const normalizedOperation = requireObject(operation, 'ResoudreSabotage operation');
  const normalizedTarget = requireObject(target, 'ResoudreSabotage target');
  const normalizedRandomFactor = requireScore(randomFactor, 'ResoudreSabotage randomFactor');
  const normalizedInfrastructureIds = normalizeUniqueTexts(
    infrastructureIds,
    'ResoudreSabotage infrastructureIds',
  );
  const operationId = requireText(normalizedOperation.id, 'ResoudreSabotage operation id');
  const targetId = requireText(normalizedTarget.id, 'ResoudreSabotage target id');
  const readiness = requireScore(normalizedOperation.readiness ?? 0, 'ResoudreSabotage operation readiness');
  const heat = requireScore(normalizedOperation.heat ?? 0, 'ResoudreSabotage operation heat');
  const targetStability = requireScore(normalizedTarget.stability ?? 0, 'ResoudreSabotage target stability');
  const targetSecurity = requireScore(normalizedTarget.security ?? 0, 'ResoudreSabotage target security');
  const targetIndustry = requireScore(normalizedTarget.industry ?? 0, 'ResoudreSabotage target industry');

  if (normalizedInfrastructureIds.length === 0) {
    const damage = {
      industryLoss: 0,
      stabilityLoss: 0,
      heatIncrease: 0,
      disruptedInfrastructureIds: [],
    };

    return {
      resolved: false,
      outcome: 'no-target-infrastructure',
      target: { ...normalizedTarget },
      operation: { ...normalizedOperation },
      summary: 'No sabotage target was available.',
      damage,
      events: buildSabotageEvents({
        operationId,
        targetId,
        outcome: 'no-target-infrastructure',
        damage,
      }),
    };
  }

  const severity = deriveOutcomeSeverity({
    readiness,
    targetStability,
    targetSecurity,
    randomFactor: normalizedRandomFactor,
  });
  const success = severity > 0;
  const disruptedInfrastructureIds = success
    ? normalizedInfrastructureIds.slice(0, Math.max(1, Math.floor(severity / 25) + 1))
    : [];
  const industryLoss = success ? Math.min(targetIndustry, Math.max(5, Math.round(severity / 3))) : 0;
  const stabilityLoss = success ? Math.min(targetStability, Math.max(3, Math.round(severity / 4))) : 0;
  const heatIncrease = Math.min(100 - heat, success ? Math.max(8, 18 - Math.round(readiness / 10)) : 14);
  const nextHeat = heat + heatIncrease;

  const outcome = success ? 'sabotage-succeeded' : 'sabotage-failed';
  const damage = {
    industryLoss,
    stabilityLoss,
    heatIncrease,
    disruptedInfrastructureIds,
  };

  return {
    resolved: true,
    outcome,
    operation: {
      ...normalizedOperation,
      id: operationId,
      heat: nextHeat,
      phase: 'resolved',
      progress: 100,
    },
    target: {
      ...normalizedTarget,
      id: targetId,
      industry: targetIndustry - industryLoss,
      stability: targetStability - stabilityLoss,
      disruptedInfrastructureIds,
    },
    summary: success
      ? `Sabotage disrupted ${disruptedInfrastructureIds.length} infrastructure target(s).`
      : 'Sabotage failed to create lasting damage.',
    damage,
    events: buildSabotageEvents({
      operationId,
      targetId,
      outcome,
      damage,
    }),
  };
}
