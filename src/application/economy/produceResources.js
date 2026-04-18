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

function normalizeCity(city) {
  if (!city || typeof city !== 'object' || Array.isArray(city)) {
    throw new TypeError('produceResources city must be an object.');
  }

  const stockByResource = city.stockByResource ?? {};

  if (!stockByResource || typeof stockByResource !== 'object' || Array.isArray(stockByResource)) {
    throw new TypeError('produceResources city.stockByResource must be an object.');
  }

  return {
    ...city,
    id: requireText(city.id, 'produceResources city.id'),
    workforce: requireInteger(city.workforce ?? 0, 'produceResources city.workforce', 0),
    stockByResource: Object.fromEntries(
      Object.entries(stockByResource).map(([resourceId, quantity]) => [
        requireText(resourceId, 'produceResources city.stock resourceId'),
        requireInteger(quantity, `produceResources city stock quantity for ${String(resourceId).trim()}`, 0),
      ]),
    ),
  };
}

function normalizeRules(rules, cityId) {
  if (!Array.isArray(rules)) {
    throw new TypeError('produceResources productionRules must be an array.');
  }

  return rules.map((rule, index) => normalizeRule(rule, cityId, index));
}

function normalizeRule(rule, cityId, index) {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
    throw new TypeError(`produceResources productionRules[${index}] must be an object.`);
  }

  const normalizedCityId = requireText(rule.cityId, `produceResources productionRules[${index}].cityId`);

  if (normalizedCityId !== cityId) {
    throw new RangeError(
      `produceResources productionRules[${index}].cityId must match city ${cityId}.`,
    );
  }

  const inputByResource = rule.inputByResource ?? {};
  const seasonModifiers = rule.seasonModifiers ?? {};

  if (!inputByResource || typeof inputByResource !== 'object' || Array.isArray(inputByResource)) {
    throw new TypeError(`produceResources productionRules[${index}].inputByResource must be an object.`);
  }

  if (!seasonModifiers || typeof seasonModifiers !== 'object' || Array.isArray(seasonModifiers)) {
    throw new TypeError(`produceResources productionRules[${index}].seasonModifiers must be an object.`);
  }

  return {
    ...rule,
    id: requireText(rule.id, `produceResources productionRules[${index}].id`),
    cityId: normalizedCityId,
    resourceId: requireText(rule.resourceId, `produceResources productionRules[${index}].resourceId`),
    laborRequired: requireInteger(
      rule.laborRequired ?? 0,
      `produceResources productionRules[${index}].laborRequired`,
      0,
    ),
    baseYield: requireInteger(
      rule.baseYield ?? 0,
      `produceResources productionRules[${index}].baseYield`,
      0,
    ),
    active: Boolean(rule.active ?? true),
    priority: requireInteger(
      rule.priority ?? 50,
      `produceResources productionRules[${index}].priority`,
      0,
      100,
    ),
    inputByResource: Object.fromEntries(
      Object.entries(inputByResource).map(([resourceId, quantity]) => [
        requireText(resourceId, `produceResources productionRules[${index}].input resourceId`),
        requireInteger(
          quantity,
          `produceResources productionRules[${index}] input quantity for ${String(resourceId).trim()}`,
          0,
        ),
      ]),
    ),
    seasonModifiers: Object.fromEntries(
      Object.entries(seasonModifiers).map(([season, modifier]) => [
        requireText(season, `produceResources productionRules[${index}].season`),
        requireInteger(
          modifier,
          `produceResources productionRules[${index}] season modifier for ${String(season).trim()}`,
          -100,
          100,
        ),
      ]),
    ),
  };
}

function normalizeContext(context) {
  if (context === undefined) {
    return { season: null };
  }

  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    throw new TypeError('produceResources context must be an object.');
  }

  return {
    season: context.season == null ? null : requireText(context.season, 'produceResources context.season'),
  };
}

function canAffordInputs(stockByResource, inputByResource) {
  return Object.entries(inputByResource).every(
    ([resourceId, quantity]) => (stockByResource[resourceId] ?? 0) >= quantity,
  );
}

function applyInputs(stockByResource, inputByResource) {
  const nextStock = { ...stockByResource };

  for (const [resourceId, quantity] of Object.entries(inputByResource)) {
    nextStock[resourceId] = (nextStock[resourceId] ?? 0) - quantity;
  }

  return nextStock;
}

function applyOutput(stockByResource, resourceId, quantity) {
  return {
    ...stockByResource,
    [resourceId]: (stockByResource[resourceId] ?? 0) + quantity,
  };
}

function computeProducedQuantity(rule, season) {
  const seasonalModifier = season === null ? 0 : (rule.seasonModifiers[season] ?? 0);
  return Math.max(0, Math.floor(rule.baseYield * (100 + seasonalModifier) / 100));
}

export function produceResources(city, productionRules, context = undefined) {
  const normalizedCity = normalizeCity(city);
  const normalizedRules = normalizeRules(productionRules, normalizedCity.id)
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id));
  const normalizedContext = normalizeContext(context);

  let remainingWorkforce = normalizedCity.workforce;
  let nextStock = { ...normalizedCity.stockByResource };
  const executedRules = [];
  const skippedRules = [];

  for (const rule of normalizedRules) {
    if (!rule.active) {
      skippedRules.push({ ruleId: rule.id, reason: 'inactive' });
      continue;
    }

    if (rule.laborRequired > remainingWorkforce) {
      skippedRules.push({ ruleId: rule.id, reason: 'insufficient-workforce' });
      continue;
    }

    if (!canAffordInputs(nextStock, rule.inputByResource)) {
      skippedRules.push({ ruleId: rule.id, reason: 'missing-inputs' });
      continue;
    }

    const producedQuantity = computeProducedQuantity(rule, normalizedContext.season);
    nextStock = applyInputs(nextStock, rule.inputByResource);
    nextStock = applyOutput(nextStock, rule.resourceId, producedQuantity);
    remainingWorkforce -= rule.laborRequired;
    executedRules.push({
      ruleId: rule.id,
      resourceId: rule.resourceId,
      producedQuantity,
      consumedInputs: { ...rule.inputByResource },
      laborUsed: rule.laborRequired,
    });
  }

  return {
    city: {
      ...normalizedCity,
      stockByResource: nextStock,
    },
    producedByResource: executedRules.reduce((summary, execution) => ({
      ...summary,
      [execution.resourceId]: (summary[execution.resourceId] ?? 0) + execution.producedQuantity,
    }), {}),
    executedRules,
    skippedRules,
    workforceUsed: normalizedCity.workforce - remainingWorkforce,
    workforceRemaining: remainingWorkforce,
  };
}
