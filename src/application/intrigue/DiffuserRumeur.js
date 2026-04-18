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

export function diffuserRumeur({
  rumeur,
  cellule,
  alertLevel = 0,
  randomFactor = 0,
  relayIds = [],
  affectedPopulationIds = rumeur?.affectedPopulationIds ?? [],
}) {
  const normalizedRumeur = requireObject(rumeur, 'DiffuserRumeur rumeur');
  const normalizedCellule = requireObject(cellule, 'DiffuserRumeur cellule');
  const normalizedAlertLevel = requireScore(alertLevel, 'DiffuserRumeur alertLevel');
  const normalizedRandomFactor = requireScore(randomFactor, 'DiffuserRumeur randomFactor');
  const normalizedRelayIds = normalizeUniqueTexts(relayIds, 'DiffuserRumeur relayIds');
  const normalizedExistingRelayIds = normalizeUniqueTexts(
    normalizedRumeur.relayIds ?? [],
    'DiffuserRumeur rumeur relayIds',
  );
  const normalizedPopulationIds = normalizeUniqueTexts(
    affectedPopulationIds,
    'DiffuserRumeur affectedPopulationIds',
  );
  const normalizedExistingPopulationIds = normalizeUniqueTexts(
    normalizedRumeur.affectedPopulationIds ?? [],
    'DiffuserRumeur rumeur affectedPopulationIds',
  );

  const rumeurId = requireText(normalizedRumeur.id, 'DiffuserRumeur rumeur id');
  requireText(normalizedCellule.id, 'DiffuserRumeur cellule id');
  const credibility = requireScore(normalizedRumeur.credibility ?? 0, 'DiffuserRumeur rumeur credibility');
  const propagation = requireScore(normalizedRumeur.propagation ?? 0, 'DiffuserRumeur rumeur propagation');
  const tension = requireScore(normalizedRumeur.tension ?? 0, 'DiffuserRumeur rumeur tension');
  const celluleSecrecy = requireScore(normalizedCellule.secrecy ?? 0, 'DiffuserRumeur cellule secrecy');
  const celluleExposure = requireScore(normalizedCellule.exposure ?? 0, 'DiffuserRumeur cellule exposure');

  const spreadScore = Math.max(
    0,
    Math.min(
      100,
      credibility + Math.round(celluleSecrecy / 4) + normalizedRandomFactor - normalizedAlertLevel - Math.round(celluleExposure / 2),
    ),
  );
  const nextPropagation = Math.min(100, propagation + Math.max(8, Math.round(spreadScore / 5)));
  const nextTension = Math.min(100, tension + Math.max(4, Math.round((normalizedRandomFactor + normalizedAlertLevel) / 6)));
  const nextStatus = spreadScore >= 45 ? 'amplified' : 'contained';
  const nextRelayIds = [...new Set([...normalizedExistingRelayIds, ...normalizedRelayIds])].sort();
  const nextPopulationIds = [...new Set([...normalizedExistingPopulationIds, ...normalizedPopulationIds, ...nextRelayIds])].sort();

  return {
    spread: spreadScore >= 45,
    outcome: spreadScore >= 45 ? 'rumor-amplified' : 'rumor-contained',
    rumeur: {
      ...normalizedRumeur,
      id: rumeurId,
      relayIds: nextRelayIds,
      affectedPopulationIds: nextPopulationIds,
      propagation: nextPropagation,
      tension: nextTension,
      status: nextStatus,
    },
    summary: spreadScore >= 45
      ? `Rumor spread through ${nextRelayIds.length} relay node(s).`
      : 'Rumor circulation was contained before broad amplification.',
    spreadScore,
  };
}
