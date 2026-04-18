function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
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

function requireScore(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new RangeError(`${label} must be an integer between 0 and 100.`);
  }

  return value;
}

function getMissingEntries(requiredIds, availableIds, key) {
  const availableSet = new Set(availableIds);

  return requiredIds
    .filter((id) => !availableSet.has(id))
    .map((id) => ({ [key]: id }));
}

function buildExposureEvents({
  cellule,
  operation,
  launched,
  reason,
  readiness,
  alertLevel,
  nextOperation,
}) {
  const operationId = String(operation.id ?? '').trim() || null;
  const celluleId = String(cellule.id ?? '').trim() || null;
  const currentHeat = operation.heat ?? 0;
  const nextHeat = nextOperation.heat ?? currentHeat;
  const heatIncrease = Math.max(0, nextHeat - currentHeat);
  const assessedEvent = {
    type: 'intrigue.exposure.assessed',
    operationId,
    celluleId,
    launched,
    reason,
    readiness,
    celluleExposure: cellule.exposure ?? 0,
    detectionRisk: operation.detectionRisk ?? 0,
    alertLevel,
    heatIncrease,
  };
  const events = [assessedEvent];

  if (launched && (cellule.exposure > 0 || operation.detectionRisk > 0 || alertLevel > 0 || heatIncrease > 0)) {
    events.push({
      type: 'intrigue.exposure.risk-detected',
      operationId,
      celluleId,
      readiness,
      celluleExposure: cellule.exposure ?? 0,
      detectionRisk: operation.detectionRisk ?? 0,
      alertLevel,
      heatIncrease,
    });
  }

  if (!launched && reason === 'cellule-unavailable') {
    events.push({
      type: 'intrigue.exposure.cellule-blocked',
      operationId,
      celluleId,
      celluleStatus: String(cellule.status ?? '').trim(),
      celluleExposure: cellule.exposure ?? 0,
    });
  }

  return events;
}

export function lancerOperation({
  cellule,
  operation,
  availableAgentIds = operation?.assignedAgentIds ?? [],
  availableAssetIds = cellule?.assetIds ?? [],
  alertLevel = 0,
}) {
  const normalizedCellule = requireObject(cellule, 'LancerOperation cellule');
  const normalizedOperation = requireObject(operation, 'LancerOperation operation');
  const normalizedAvailableAgentIds = normalizeUniqueTexts(
    availableAgentIds,
    'LancerOperation availableAgentIds',
  );
  const normalizedAvailableAssetIds = normalizeUniqueTexts(
    availableAssetIds,
    'LancerOperation availableAssetIds',
  );
  const normalizedAssignedAgentIds = normalizeUniqueTexts(
    normalizedOperation.assignedAgentIds ?? [],
    'LancerOperation operation assignedAgentIds',
  );
  const normalizedRequiredAssetIds = normalizeUniqueTexts(
    normalizedOperation.requiredAssetIds ?? [],
    'LancerOperation operation requiredAssetIds',
  );
  const normalizedAlertLevel = requireScore(alertLevel, 'LancerOperation alertLevel');
  const celluleStatus = String(normalizedCellule.status ?? '').trim();
  const celluleExposure = requireScore(normalizedCellule.exposure ?? 0, 'LancerOperation cellule exposure');
  const operationDifficulty = requireScore(
    normalizedOperation.difficulty ?? 0,
    'LancerOperation operation difficulty',
  );
  const operationDetectionRisk = requireScore(
    normalizedOperation.detectionRisk ?? 0,
    'LancerOperation operation detectionRisk',
  );

  if (!celluleStatus) {
    throw new RangeError('LancerOperation cellule status is required.');
  }

  if (normalizedAssignedAgentIds.length === 0) {
    const nextOperation = { ...normalizedOperation };

    return {
      launched: false,
      reason: 'no-assigned-agents',
      nextOperation,
      readiness: 0,
      blockers: [],
      events: buildExposureEvents({
        cellule: normalizedCellule,
        operation: normalizedOperation,
        launched: false,
        reason: 'no-assigned-agents',
        readiness: 0,
        alertLevel: normalizedAlertLevel,
        nextOperation,
      }),
    };
  }

  if (celluleStatus === 'compromised' || celluleStatus === 'dismantled') {
    const nextOperation = { ...normalizedOperation };

    return {
      launched: false,
      reason: 'cellule-unavailable',
      nextOperation,
      readiness: 0,
      blockers: [{ status: celluleStatus }],
      events: buildExposureEvents({
        cellule: normalizedCellule,
        operation: normalizedOperation,
        launched: false,
        reason: 'cellule-unavailable',
        readiness: 0,
        alertLevel: normalizedAlertLevel,
        nextOperation,
      }),
    };
  }

  const missingAgents = getMissingEntries(normalizedAssignedAgentIds, normalizedAvailableAgentIds, 'agentId');

  if (missingAgents.length > 0) {
    const nextOperation = { ...normalizedOperation };

    return {
      launched: false,
      reason: 'missing-agents',
      nextOperation,
      readiness: 0,
      blockers: missingAgents,
      events: buildExposureEvents({
        cellule: normalizedCellule,
        operation: normalizedOperation,
        launched: false,
        reason: 'missing-agents',
        readiness: 0,
        alertLevel: normalizedAlertLevel,
        nextOperation,
      }),
    };
  }

  const missingAssets = getMissingEntries(normalizedRequiredAssetIds, normalizedAvailableAssetIds, 'assetId');

  if (missingAssets.length > 0) {
    const nextOperation = { ...normalizedOperation };

    return {
      launched: false,
      reason: 'missing-assets',
      nextOperation,
      readiness: 0,
      blockers: missingAssets,
      events: buildExposureEvents({
        cellule: normalizedCellule,
        operation: normalizedOperation,
        launched: false,
        reason: 'missing-assets',
        readiness: 0,
        alertLevel: normalizedAlertLevel,
        nextOperation,
      }),
    };
  }

  const readiness = Math.max(
    0,
    Math.min(
      100,
      100 - operationDifficulty - operationDetectionRisk - normalizedAlertLevel - celluleExposure,
    ),
  );
  const nextPhase = normalizedOperation.phase === 'planning' ? 'infiltration' : normalizedOperation.phase;
  const nextProgress = nextPhase === 'infiltration' ? Math.max(normalizedOperation.progress ?? 0, 10) : normalizedOperation.progress ?? 0;

  const nextOperation = {
    ...normalizedOperation,
    phase: nextPhase,
    progress: nextProgress,
    heat: Math.min(100, (normalizedOperation.heat ?? 0) + Math.round(normalizedAlertLevel / 10)),
  };

  return {
    launched: true,
    reason: 'operation-launched',
    readiness,
    blockers: [],
    nextOperation,
    events: buildExposureEvents({
      cellule: normalizedCellule,
      operation: normalizedOperation,
      launched: true,
      reason: 'operation-launched',
      readiness,
      alertLevel: normalizedAlertLevel,
      nextOperation,
    }),
  };
}
