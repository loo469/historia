function normalizeText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeProvinceIds(provinceIds, label) {
  if (!Array.isArray(provinceIds)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const normalizedIds = [...new Set(provinceIds.map((provinceId) => normalizeText(provinceId, 'FactionTerritory provinceId')))];

  return normalizedIds.sort();
}

function normalizeNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer.`);
  }

  return value;
}

function normalizeUpdatedAt(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError('FactionTerritory updatedAt must be a valid date.');
  }

  return date;
}

export class FactionTerritory {
  constructor({
    factionId,
    provinceIds = [],
    occupiedProvinceIds = [],
    contestedProvinceIds = [],
    frontlineProvinceIds = [],
    capitalProvinceId = null,
    totalStrategicValue = null,
    updatedAt = null,
  }) {
    this.factionId = normalizeText(factionId, 'FactionTerritory factionId');
    this.provinceIds = normalizeProvinceIds(provinceIds, 'FactionTerritory provinceIds');
    this.occupiedProvinceIds = normalizeProvinceIds(
      occupiedProvinceIds,
      'FactionTerritory occupiedProvinceIds',
    );
    this.contestedProvinceIds = normalizeProvinceIds(
      contestedProvinceIds,
      'FactionTerritory contestedProvinceIds',
    );
    this.frontlineProvinceIds = normalizeProvinceIds(
      frontlineProvinceIds,
      'FactionTerritory frontlineProvinceIds',
    );
    this.capitalProvinceId =
      capitalProvinceId === null ? null : normalizeText(capitalProvinceId, 'FactionTerritory capitalProvinceId');
    this.provinceCount = this.provinceIds.length;
    this.occupiedProvinceCount = this.occupiedProvinceIds.length;
    this.contestedProvinceCount = this.contestedProvinceIds.length;
    this.frontlineProvinceCount = this.frontlineProvinceIds.length;
    this.totalStrategicValue =
      totalStrategicValue === null
        ? this.provinceCount
        : normalizeNonNegativeInteger(totalStrategicValue, 'FactionTerritory totalStrategicValue');
    this.updatedAt = normalizeUpdatedAt(updatedAt);

    this.#assertSubset(this.occupiedProvinceIds, 'occupiedProvinceIds');
    this.#assertSubset(this.contestedProvinceIds, 'contestedProvinceIds');
    this.#assertSubset(this.frontlineProvinceIds, 'frontlineProvinceIds');

    if (this.capitalProvinceId !== null && !this.provinceIds.includes(this.capitalProvinceId)) {
      throw new RangeError('FactionTerritory capitalProvinceId must belong to provinceIds.');
    }
  }

  get controlRatio() {
    if (this.provinceCount === 0) {
      return 0;
    }

    return (this.provinceCount - this.occupiedProvinceCount) / this.provinceCount;
  }

  hasProvince(provinceId) {
    return this.provinceIds.includes(normalizeText(provinceId, 'FactionTerritory provinceId'));
  }

  withProvinceSnapshot({
    provinceIds = this.provinceIds,
    occupiedProvinceIds = this.occupiedProvinceIds,
    contestedProvinceIds = this.contestedProvinceIds,
    frontlineProvinceIds = this.frontlineProvinceIds,
    totalStrategicValue = null,
    updatedAt = new Date(),
  }) {
    return new FactionTerritory({
      ...this.toJSON(),
      provinceIds,
      occupiedProvinceIds,
      contestedProvinceIds,
      frontlineProvinceIds,
      totalStrategicValue,
      updatedAt,
    });
  }

  toJSON() {
    return {
      factionId: this.factionId,
      provinceIds: [...this.provinceIds],
      occupiedProvinceIds: [...this.occupiedProvinceIds],
      contestedProvinceIds: [...this.contestedProvinceIds],
      frontlineProvinceIds: [...this.frontlineProvinceIds],
      capitalProvinceId: this.capitalProvinceId,
      provinceCount: this.provinceCount,
      occupiedProvinceCount: this.occupiedProvinceCount,
      contestedProvinceCount: this.contestedProvinceCount,
      frontlineProvinceCount: this.frontlineProvinceCount,
      totalStrategicValue: this.totalStrategicValue,
      controlRatio: this.controlRatio,
      updatedAt: this.updatedAt?.toISOString() ?? null,
    };
  }

  #assertSubset(provinceIds, label) {
    const missingProvinceId = provinceIds.find((provinceId) => !this.provinceIds.includes(provinceId));

    if (missingProvinceId) {
      throw new RangeError(`FactionTerritory ${label} must be a subset of provinceIds.`);
    }
  }
}
