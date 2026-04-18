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

function normalizeObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function normalizeCity(city) {
  const normalizedCity = normalizeObject(city, 'consumeNeeds city');
  const stockByResource = normalizeObject(normalizedCity.stockByResource ?? {}, 'consumeNeeds city.stockByResource');

  return {
    ...normalizedCity,
    id: requireText(normalizedCity.id, 'consumeNeeds city.id'),
    population: requireInteger(normalizedCity.population ?? 0, 'consumeNeeds city.population', 0),
    prosperity: requireInteger(normalizedCity.prosperity ?? 50, 'consumeNeeds city.prosperity', 0, 100),
    stability: requireInteger(normalizedCity.stability ?? 50, 'consumeNeeds city.stability', 0, 100),
    stockByResource: Object.fromEntries(
      Object.entries(stockByResource).map(([resourceId, quantity]) => [
        requireText(resourceId, 'consumeNeeds city.stock resourceId'),
        requireInteger(quantity, `consumeNeeds city stock quantity for ${String(resourceId).trim()}`, 0),
      ]),
    ),
  };
}

function normalizeNeeds(needs) {
  if (!Array.isArray(needs)) {
    throw new TypeError('consumeNeeds needs must be an array.');
  }

  return needs.map((need, index) => {
    const normalizedNeed = normalizeObject(need, `consumeNeeds needs[${index}]`);

    return {
      resourceId: requireText(normalizedNeed.resourceId, `consumeNeeds needs[${index}].resourceId`),
      requiredQuantity: requireInteger(
        normalizedNeed.requiredQuantity,
        `consumeNeeds needs[${index}].requiredQuantity`,
        0,
      ),
      shortagePenalty: requireInteger(
        normalizedNeed.shortagePenalty ?? 0,
        `consumeNeeds needs[${index}].shortagePenalty`,
        0,
        100,
      ),
      priority: requireInteger(
        normalizedNeed.priority ?? 50,
        `consumeNeeds needs[${index}].priority`,
        0,
        100,
      ),
      affects: requireText(normalizedNeed.affects ?? 'stability', `consumeNeeds needs[${index}].affects`),
    };
  }).sort((left, right) => right.priority - left.priority || left.resourceId.localeCompare(right.resourceId));
}

function consumeResource(stockByResource, resourceId, requiredQuantity) {
  const availableQuantity = stockByResource[resourceId] ?? 0;
  const consumedQuantity = Math.min(availableQuantity, requiredQuantity);
  const shortageQuantity = requiredQuantity - consumedQuantity;

  return {
    nextStockByResource: {
      ...stockByResource,
      [resourceId]: availableQuantity - consumedQuantity,
    },
    consumedQuantity,
    shortageQuantity,
  };
}

function applyPenalty(city, need, shortageQuantity) {
  if (shortageQuantity === 0 || need.shortagePenalty === 0) {
    return city;
  }

  const nextCity = { ...city };
  const penalty = Math.min(need.shortagePenalty, 100);

  if (need.affects === 'prosperity') {
    nextCity.prosperity = Math.max(0, nextCity.prosperity - penalty);
    return nextCity;
  }

  if (need.affects === 'population') {
    nextCity.population = Math.max(0, nextCity.population - penalty);
    return nextCity;
  }

  nextCity.stability = Math.max(0, nextCity.stability - penalty);
  return nextCity;
}

export function consumeNeeds(city, needs) {
  let normalizedCity = normalizeCity(city);
  const normalizedNeeds = normalizeNeeds(needs);
  const consumption = [];
  const shortages = [];
  let nextStockByResource = { ...normalizedCity.stockByResource };

  for (const need of normalizedNeeds) {
    const result = consumeResource(nextStockByResource, need.resourceId, need.requiredQuantity);
    nextStockByResource = result.nextStockByResource;

    consumption.push({
      resourceId: need.resourceId,
      requiredQuantity: need.requiredQuantity,
      consumedQuantity: result.consumedQuantity,
    });

    if (result.shortageQuantity > 0) {
      shortages.push({
        resourceId: need.resourceId,
        shortageQuantity: result.shortageQuantity,
        affects: need.affects,
        penaltyApplied: need.shortagePenalty,
      });
      normalizedCity = applyPenalty(normalizedCity, need, result.shortageQuantity);
    }
  }

  return {
    city: {
      ...normalizedCity,
      stockByResource: nextStockByResource,
    },
    consumption,
    shortages,
    fulfilledNeedCount: consumption.length - shortages.length,
    shortageCount: shortages.length,
  };
}
