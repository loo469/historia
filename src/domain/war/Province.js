const DEFAULT_LOYALTY = 50;

function normalizeNeighborIds(neighborIds) {
  if (!Array.isArray(neighborIds)) {
    throw new TypeError('Province neighborIds must be an array.');
  }

  const normalizedIds = [...new Set(neighborIds.map((neighborId) => String(neighborId).trim()))];

  if (normalizedIds.some((neighborId) => neighborId.length === 0)) {
    throw new RangeError('Province neighborIds cannot contain empty values.');
  }

  return normalizedIds.sort();
}

export class Province {
  constructor({
    id,
    name,
    ownerFactionId,
    controllingFactionId = ownerFactionId,
    supplyLevel,
    loyalty = DEFAULT_LOYALTY,
    strategicValue = 1,
    neighborIds = [],
    contested = false,
    capturedAt = null,
  }) {
    this.id = Province.#requireText(id, 'Province id');
    this.name = Province.#requireText(name, 'Province name');
    this.ownerFactionId = Province.#requireText(ownerFactionId, 'Province ownerFactionId');
    this.controllingFactionId = Province.#requireText(
      controllingFactionId,
      'Province controllingFactionId',
    );
    this.supplyLevel = Province.#requireText(supplyLevel, 'Province supplyLevel');
    this.loyalty = Province.#requireIntegerInRange(loyalty, 'Province loyalty', 0, 100);
    this.strategicValue = Province.#requireIntegerInRange(
      strategicValue,
      'Province strategicValue',
      1,
      10,
    );
    this.neighborIds = normalizeNeighborIds(neighborIds);
    this.contested = Boolean(contested);
    this.capturedAt = Province.#normalizeDate(capturedAt);
  }

  get isOccupied() {
    return this.ownerFactionId !== this.controllingFactionId;
  }

  withControllingFaction(controllingFactionId, capturedAt = new Date()) {
    return new Province({
      ...this.toJSON(),
      controllingFactionId,
      contested: this.ownerFactionId !== String(controllingFactionId).trim(),
      capturedAt,
    });
  }

  withSupplyLevel(supplyLevel) {
    return new Province({
      ...this.toJSON(),
      supplyLevel,
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      ownerFactionId: this.ownerFactionId,
      controllingFactionId: this.controllingFactionId,
      supplyLevel: this.supplyLevel,
      loyalty: this.loyalty,
      strategicValue: this.strategicValue,
      neighborIds: [...this.neighborIds],
      contested: this.contested,
      capturedAt: this.capturedAt?.toISOString() ?? null,
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

  static #normalizeDate(value) {
    if (value === null || value === undefined) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new RangeError('Province capturedAt must be a valid date.');
    }

    return date;
  }
}
