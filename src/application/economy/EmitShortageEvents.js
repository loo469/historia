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
  if (!eventBus || typeof eventBus.publishShortage !== 'function') {
    throw new TypeError('EmitShortageEvents eventBus must expose publishShortage(payload).');
  }

  return eventBus;
}

export async function emitShortageEvents({
  eventBus,
  city,
  shortagesByResource,
  requiredByResource = {},
  availableByResource = {},
  cause = 'consumption-shortage',
}) {
  const normalizedEventBus = requireEventBus(eventBus);
  const normalizedCity = requireObject(city, 'EmitShortageEvents city');
  const normalizedCityId = requireText(normalizedCity.id, 'EmitShortageEvents city.id');
  const normalizedShortages = normalizeResourceMap(shortagesByResource, 'EmitShortageEvents shortagesByResource');
  const normalizedRequired = normalizeResourceMap(requiredByResource, 'EmitShortageEvents requiredByResource');
  const normalizedAvailable = normalizeResourceMap(availableByResource, 'EmitShortageEvents availableByResource');
  const normalizedCause = requireText(cause, 'EmitShortageEvents cause');

  const events = [];

  for (const [resourceId, shortageQuantity] of Object.entries(normalizedShortages)) {
    if (shortageQuantity === 0) {
      continue;
    }

    const event = await normalizedEventBus.publishShortage({
      cityId: normalizedCityId,
      resourceId,
      shortageQuantity,
      requiredQuantity: normalizedRequired[resourceId] ?? shortageQuantity,
      availableQuantity: normalizedAvailable[resourceId] ?? 0,
      cause: normalizedCause,
    });

    events.push(event);
  }

  return events;
}
