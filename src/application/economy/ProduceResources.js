function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function normalizeResourceMap(resources, label) {
  requireObject(resources, label);

  return Object.fromEntries(
    Object.entries(resources)
      .map(([resourceId, quantity]) => {
        const normalizedResourceId = String(resourceId).trim();

        if (!normalizedResourceId) {
          throw new RangeError(`${label} cannot contain an empty resource id.`);
        }

        if (!Number.isInteger(quantity) || quantity < 0) {
          throw new RangeError(`${label} quantities must be integers greater than or equal to 0.`);
        }

        return [normalizedResourceId, quantity];
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function getMissingRequirements(stock, requirements) {
  return Object.entries(requirements)
    .filter(([resourceId, quantity]) => (stock[resourceId] ?? 0) < quantity)
    .map(([resourceId, quantity]) => ({
      resourceId,
      required: quantity,
      available: stock[resourceId] ?? 0,
    }));
}

export function produceResources({ city, rule, stockByResource = city?.stockByResource ?? {} }) {
  const normalizedCity = requireObject(city, 'ProduceResources city');
  const normalizedRule = requireObject(rule, 'ProduceResources rule');
  const normalizedStock = normalizeResourceMap(stockByResource, 'ProduceResources stockByResource');
  const workforceAvailable = normalizedCity.workforce;

  if (!Number.isInteger(workforceAvailable) || workforceAvailable < 0) {
    throw new RangeError('ProduceResources city workforce must be an integer greater than or equal to 0.');
  }

  const workforceRequired = normalizedRule.workforceRequired;

  if (!Number.isInteger(workforceRequired) || workforceRequired < 0) {
    throw new RangeError('ProduceResources rule workforceRequired must be an integer greater than or equal to 0.');
  }

  const inputByResource = normalizeResourceMap(
    normalizedRule.inputByResource ?? {},
    'ProduceResources rule inputByResource',
  );
  const outputByResource = normalizeResourceMap(
    normalizedRule.outputByResource ?? {},
    'ProduceResources rule outputByResource',
  );

  if (Object.keys(outputByResource).length === 0) {
    throw new RangeError('ProduceResources rule outputByResource must define at least one produced resource.');
  }

  if (normalizedRule.enabled === false) {
    return {
      executed: false,
      reason: 'rule-disabled',
      nextStockByResource: { ...normalizedStock },
      consumedByResource: {},
      producedByResource: {},
      workforceUsed: 0,
    };
  }

  if (workforceAvailable < workforceRequired) {
    return {
      executed: false,
      reason: 'insufficient-workforce',
      nextStockByResource: { ...normalizedStock },
      consumedByResource: {},
      producedByResource: {},
      workforceUsed: 0,
    };
  }

  const missingRequirements = getMissingRequirements(normalizedStock, inputByResource);

  if (missingRequirements.length > 0) {
    return {
      executed: false,
      reason: 'insufficient-inputs',
      nextStockByResource: { ...normalizedStock },
      consumedByResource: {},
      producedByResource: {},
      workforceUsed: 0,
      missingRequirements,
    };
  }

  const nextStockByResource = { ...normalizedStock };

  for (const [resourceId, quantity] of Object.entries(inputByResource)) {
    nextStockByResource[resourceId] -= quantity;
  }

  for (const [resourceId, quantity] of Object.entries(outputByResource)) {
    nextStockByResource[resourceId] = (nextStockByResource[resourceId] ?? 0) + quantity;
  }

  return {
    executed: true,
    reason: 'produced',
    nextStockByResource,
    consumedByResource: inputByResource,
    producedByResource: outputByResource,
    workforceUsed: workforceRequired,
  };
}
