function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeUniqueTextList(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const normalizedValues = [...new Set(values.map((value) => String(value).trim()))];

  if (normalizedValues.some((value) => value.length === 0)) {
    throw new RangeError(`${label} cannot contain empty values.`);
  }

  return normalizedValues.sort();
}

function requireInteger(value, label, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
  }

  return value;
}

export class TradeRoute {
  constructor({
    id,
    sourceCityId,
    destinationCityId,
    transportType,
    distance,
    capacity,
    travelTime,
    maintenanceCost = 0,
    riskLevel = 0,
    active = true,
    blocked = false,
    tags = [],
  }) {
    this.sourceCityId = requireText(sourceCityId, 'TradeRoute sourceCityId');
    this.destinationCityId = requireText(destinationCityId, 'TradeRoute destinationCityId');

    if (this.sourceCityId === this.destinationCityId) {
      throw new RangeError('TradeRoute cities must be different.');
    }

    this.id = requireText(id, 'TradeRoute id');
    this.transportType = requireText(transportType, 'TradeRoute transportType');
    this.distance = requireInteger(
      distance,
      'TradeRoute distance',
      1,
      Number.MAX_SAFE_INTEGER,
    );
    this.capacity = requireInteger(
      capacity,
      'TradeRoute capacity',
      0,
      Number.MAX_SAFE_INTEGER,
    );
    this.travelTime = requireInteger(
      travelTime,
      'TradeRoute travelTime',
      1,
      Number.MAX_SAFE_INTEGER,
    );
    this.maintenanceCost = requireInteger(
      maintenanceCost,
      'TradeRoute maintenanceCost',
      0,
      Number.MAX_SAFE_INTEGER,
    );
    this.riskLevel = requireInteger(
      riskLevel,
      'TradeRoute riskLevel',
      0,
      100,
    );
    this.active = Boolean(active);
    this.blocked = Boolean(blocked);
    this.tags = normalizeUniqueTextList(tags, 'TradeRoute tags');
  }

  get isOperational() {
    return this.active && !this.blocked && this.capacity > 0;
  }

  get throughputPerDay() {
    if (this.travelTime === 0) {
      return Infinity;
    }

    return this.capacity / this.travelTime;
  }

  get pressureLevel() {
    if (this.blocked || this.capacity === 0) {
      return 'blocked';
    }

    if (this.riskLevel >= 70) {
      return 'critical';
    }

    if (this.riskLevel >= 40) {
      return 'strained';
    }

    return 'stable';
  }

  withCapacity(capacity) {
    return new TradeRoute({
      ...this.toJSON(),
      capacity,
    });
  }

  withRiskLevel(riskLevel) {
    return new TradeRoute({
      ...this.toJSON(),
      riskLevel,
    });
  }

  withBlocked(blocked) {
    return new TradeRoute({
      ...this.toJSON(),
      blocked,
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
      sourceCityId: this.sourceCityId,
      destinationCityId: this.destinationCityId,
      transportType: this.transportType,
      distance: this.distance,
      capacity: this.capacity,
      travelTime: this.travelTime,
      maintenanceCost: this.maintenanceCost,
      riskLevel: this.riskLevel,
      active: this.active,
      blocked: this.blocked,
      tags: [...this.tags],
    };
  }
}
