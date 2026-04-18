function normalizeStops(stops) {
  if (!Array.isArray(stops)) {
    throw new TypeError('TradeRoute stopCityIds must be an array.');
  }

  const normalizedStops = stops.map((stopId) => String(stopId).trim());

  if (normalizedStops.length < 2) {
    throw new RangeError('TradeRoute stopCityIds must contain at least two cities.');
  }

  if (normalizedStops.some((stopId) => stopId.length === 0)) {
    throw new RangeError('TradeRoute stopCityIds cannot contain empty values.');
  }

  if (new Set(normalizedStops).size !== normalizedStops.length) {
    throw new RangeError('TradeRoute stopCityIds cannot contain duplicates.');
  }

  return normalizedStops;
}

function normalizeCapacityByResource(capacityByResource) {
  if (capacityByResource === null || typeof capacityByResource !== 'object' || Array.isArray(capacityByResource)) {
    throw new TypeError('TradeRoute capacityByResource must be an object.');
  }

  return Object.fromEntries(
    Object.entries(capacityByResource)
      .map(([resourceId, capacity]) => {
        const normalizedResourceId = String(resourceId).trim();

        if (!normalizedResourceId) {
          throw new RangeError('TradeRoute capacityByResource cannot contain an empty resource id.');
        }

        if (!Number.isInteger(capacity) || capacity < 0) {
          throw new RangeError('TradeRoute capacities must be integers greater than or equal to 0.');
        }

        return [normalizedResourceId, capacity];
      })
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId)),
  );
}

export class TradeRoute {
  constructor({
    id,
    name,
    stopCityIds,
    distance,
    capacityByResource = {},
    transportMode = 'land',
    riskLevel = 0,
    active = true,
  }) {
    this.id = TradeRoute.#requireText(id, 'TradeRoute id');
    this.name = TradeRoute.#requireText(name, 'TradeRoute name');
    this.stopCityIds = normalizeStops(stopCityIds);
    this.distance = TradeRoute.#requireIntegerInRange(
      distance,
      'TradeRoute distance',
      1,
      Number.MAX_SAFE_INTEGER,
    );
    this.capacityByResource = normalizeCapacityByResource(capacityByResource);
    this.transportMode = TradeRoute.#requireText(transportMode, 'TradeRoute transportMode');
    this.riskLevel = TradeRoute.#requireIntegerInRange(riskLevel, 'TradeRoute riskLevel', 0, 100);
    this.active = Boolean(active);
  }

  get originCityId() {
    return this.stopCityIds[0];
  }

  get destinationCityId() {
    return this.stopCityIds[this.stopCityIds.length - 1];
  }

  get totalCapacity() {
    return Object.values(this.capacityByResource).reduce((sum, capacity) => sum + capacity, 0);
  }

  connects(cityId) {
    const normalizedCityId = TradeRoute.#requireText(cityId, 'TradeRoute cityId');

    return this.stopCityIds.includes(normalizedCityId);
  }

  withCapacity(resourceId, capacity) {
    const normalizedResourceId = TradeRoute.#requireText(resourceId, 'TradeRoute resourceId');
    const normalizedCapacity = TradeRoute.#requireIntegerInRange(
      capacity,
      'TradeRoute capacity',
      0,
      Number.MAX_SAFE_INTEGER,
    );

    return new TradeRoute({
      ...this.toJSON(),
      capacityByResource: {
        ...this.capacityByResource,
        [normalizedResourceId]: normalizedCapacity,
      },
    });
  }

  withActive(active) {
    return new TradeRoute({
      ...this.toJSON(),
      active,
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      stopCityIds: [...this.stopCityIds],
      distance: this.distance,
      capacityByResource: { ...this.capacityByResource },
      transportMode: this.transportMode,
      riskLevel: this.riskLevel,
      active: this.active,
    };
  }

  static #requireText(value, label) {
    const normalizedValue = String(value ?? '').trim();

    if (!normalizedValue) {
      throw new RangeError(`${label} is required.`);
    }

    return normalizedValue;
  }

  static #requireIntegerInRange(value, label, min, max) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
    }

    return value;
  }
}
