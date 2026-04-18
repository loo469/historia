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

export function consumeNeeds({ city, needsByResource, stockByResource = city?.stockByResource ?? {} }) {
  const normalizedCity = requireObject(city, 'ConsumeNeeds city');
  const normalizedNeeds = normalizeResourceMap(needsByResource, 'ConsumeNeeds needsByResource');
  const normalizedStock = normalizeResourceMap(stockByResource, 'ConsumeNeeds stockByResource');

  const prosperity = normalizedCity.prosperity ?? 50;
  const stability = normalizedCity.stability ?? 50;

  if (!Number.isInteger(prosperity) || prosperity < 0 || prosperity > 100) {
    throw new RangeError('ConsumeNeeds city prosperity must be an integer between 0 and 100.');
  }

  if (!Number.isInteger(stability) || stability < 0 || stability > 100) {
    throw new RangeError('ConsumeNeeds city stability must be an integer between 0 and 100.');
  }

  const nextStockByResource = { ...normalizedStock };
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
