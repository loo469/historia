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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function runProduction({ stockByResource, workforce, rule }) {
  const normalizedRule = requireObject(rule, 'UpdateCityEconomy productionRule');
  const workforceRequired = normalizedRule.workforceRequired;

  if (!Number.isInteger(workforceRequired) || workforceRequired < 0) {
    throw new RangeError('UpdateCityEconomy productionRule workforceRequired must be an integer greater than or equal to 0.');
  }

  const inputByResource = normalizeResourceMap(
    normalizedRule.inputByResource ?? {},
    'UpdateCityEconomy productionRule inputByResource',
  );
  const outputByResource = normalizeResourceMap(
    normalizedRule.outputByResource ?? {},
    'UpdateCityEconomy productionRule outputByResource',
  );

  if (Object.keys(outputByResource).length === 0) {
    throw new RangeError('UpdateCityEconomy productionRule outputByResource must define at least one produced resource.');
  }

  if (normalizedRule.enabled === false) {
    return {
      executed: false,
      reason: 'rule-disabled',
      nextStockByResource: { ...stockByResource },
      consumedByResource: {},
      producedByResource: {},
      workforceUsed: 0,
    };
  }

  if (workforce < workforceRequired) {
    return {
      executed: false,
      reason: 'insufficient-workforce',
      nextStockByResource: { ...stockByResource },
      consumedByResource: {},
      producedByResource: {},
      workforceUsed: 0,
    };
  }

  const missingRequirements = Object.entries(inputByResource)
    .filter(([resourceId, quantity]) => (stockByResource[resourceId] ?? 0) < quantity)
    .map(([resourceId, quantity]) => ({
      resourceId,
      required: quantity,
      available: stockByResource[resourceId] ?? 0,
    }));

  if (missingRequirements.length > 0) {
    return {
      executed: false,
      reason: 'insufficient-inputs',
      nextStockByResource: { ...stockByResource },
      consumedByResource: {},
      producedByResource: {},
      workforceUsed: 0,
      missingRequirements,
    };
  }

  const nextStockByResource = { ...stockByResource };

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

function runConsumption({ stockByResource, prosperity, stability, needsByResource }) {
  const normalizedNeeds = normalizeResourceMap(needsByResource, 'UpdateCityEconomy needsByResource');
  const nextStockByResource = { ...stockByResource };
  const consumedByResource = {};
  const shortagesByResource = {};

  for (const [resourceId, requiredQuantity] of Object.entries(normalizedNeeds)) {
    const availableQuantity = nextStockByResource[resourceId] ?? 0;
    const consumedQuantity = Math.min(availableQuantity, requiredQuantity);
    const shortageQuantity = requiredQuantity - consumedQuantity;

    nextStockByResource[resourceId] = availableQuantity - consumedQuantity;
    consumedByResource[resourceId] = consumedQuantity;

    if (shortageQuantity > 0) {
      shortagesByResource[resourceId] = shortageQuantity;
    }
  }

  const totalNeeds = Object.values(normalizedNeeds).reduce((sum, quantity) => sum + quantity, 0);
  const totalConsumed = Object.values(consumedByResource).reduce((sum, quantity) => sum + quantity, 0);
  const satisfactionRatio = totalNeeds === 0 ? 1 : totalConsumed / totalNeeds;
  const shortageRatio = 1 - satisfactionRatio;
  const prosperityDelta = totalNeeds === 0 ? 0 : 0 - Math.ceil(shortageRatio * 12);
  const stabilityDelta = totalNeeds === 0 ? 0 : 0 - Math.ceil(shortageRatio * 18);

  return {
    fullySatisfied: Object.keys(shortagesByResource).length === 0,
    satisfactionRatio,
    nextStockByResource,
    consumedByResource,
    shortagesByResource,
    prosperityDelta,
    stabilityDelta,
    nextProsperity: clamp(prosperity + prosperityDelta, 0, 100),
    nextStability: clamp(stability + stabilityDelta, 0, 100),
  };
}

export function updateCityEconomy({ city, productionRule = null, needsByResource = {} }) {
  const normalizedCity = requireObject(city, 'UpdateCityEconomy city');
  const stockByResource = normalizeResourceMap(
    normalizedCity.stockByResource ?? {},
    'UpdateCityEconomy city stockByResource',
  );
  const workforce = normalizedCity.workforce;
  const prosperity = normalizedCity.prosperity ?? 50;
  const stability = normalizedCity.stability ?? 50;

  if (!Number.isInteger(workforce) || workforce < 0) {
    throw new RangeError('UpdateCityEconomy city workforce must be an integer greater than or equal to 0.');
  }

  if (!Number.isInteger(prosperity) || prosperity < 0 || prosperity > 100) {
    throw new RangeError('UpdateCityEconomy city prosperity must be an integer between 0 and 100.');
  }

  if (!Number.isInteger(stability) || stability < 0 || stability > 100) {
    throw new RangeError('UpdateCityEconomy city stability must be an integer between 0 and 100.');
  }

  const production = productionRule === null
    ? {
        executed: false,
        reason: 'no-production-rule',
        nextStockByResource: { ...stockByResource },
        consumedByResource: {},
        producedByResource: {},
        workforceUsed: 0,
      }
    : runProduction({ stockByResource, workforce, rule: productionRule });

  const consumption = runConsumption({
    stockByResource: production.nextStockByResource,
    prosperity,
    stability,
    needsByResource,
  });

  return {
    cityId: normalizedCity.id ?? null,
    production,
    consumption,
    nextCityState: {
      ...normalizedCity,
      stockByResource: consumption.nextStockByResource,
      prosperity: consumption.nextProsperity,
      stability: consumption.nextStability,
    },
  };
}
