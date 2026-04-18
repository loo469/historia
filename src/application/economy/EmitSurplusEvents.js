function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
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

function requireEventBus(eventBus) {
  if (!eventBus || typeof eventBus.publishSurplus !== 'function') {
    throw new TypeError('EmitSurplusEvents eventBus must expose publishSurplus(payload).');
  }

  return eventBus;
}

export async function emitSurplusEvents({
  eventBus,
  city,
  surplusesByResource,
  desiredByResource = {},
  availableByResource = {},
  cause = 'stock-surplus',
}) {
  const normalizedEventBus = requireEventBus(eventBus);
  const normalizedCity = requireObject(city, 'EmitSurplusEvents city');
  const normalizedCityId = requireText(normalizedCity.id, 'EmitSurplusEvents city.id');
  const normalizedSurpluses = normalizeResourceMap(surplusesByResource, 'EmitSurplusEvents surplusesByResource');
  const normalizedDesired = normalizeResourceMap(desiredByResource, 'EmitSurplusEvents desiredByResource');
  const normalizedAvailable = normalizeResourceMap(availableByResource, 'EmitSurplusEvents availableByResource');
  const normalizedCause = requireText(cause, 'EmitSurplusEvents cause');

  const events = [];

  for (const [resourceId, surplusQuantity] of Object.entries(normalizedSurpluses)) {
    if (surplusQuantity === 0) {
      continue;
    }

    const event = await normalizedEventBus.publishSurplus({
      cityId: normalizedCityId,
      resourceId,
      surplusQuantity,
      availableQuantity: normalizedAvailable[resourceId] ?? surplusQuantity,
      desiredQuantity: normalizedDesired[resourceId] ?? 0,
      cause: normalizedCause,
    });

    events.push(event);
  }

  return events;
}
