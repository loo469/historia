function normalizeProvinceId(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizePressure(value) {
  if (!Number.isInteger(value) || value < -100 || value > 100) {
    throw new RangeError('BorderSegment pressure must be an integer between -100 and 100.');
  }

  return value;
}

function normalizePosition(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError('BorderSegment position must be a non-negative integer.');
  }

  return value;
}

export class BorderSegment {
  constructor({
    id,
    provinceAId,
    provinceBId,
    terrainType,
    pressure = 0,
    contested = false,
    chokepoint = false,
    length = 1,
    position = 0,
  }) {
    this.provinceAId = normalizeProvinceId(provinceAId, 'BorderSegment provinceAId');
    this.provinceBId = normalizeProvinceId(provinceBId, 'BorderSegment provinceBId');

    if (this.provinceAId === this.provinceBId) {
      throw new RangeError('BorderSegment provinces must be different.');
    }

    const [leftProvinceId, rightProvinceId] = [this.provinceAId, this.provinceBId].sort();

    this.provinceAId = leftProvinceId;
    this.provinceBId = rightProvinceId;
    this.id = normalizeProvinceId(
      id ?? `${this.provinceAId}::${this.provinceBId}`,
      'BorderSegment id',
    );
    this.terrainType = normalizeProvinceId(terrainType, 'BorderSegment terrainType');
    this.pressure = normalizePressure(pressure);
    this.contested = Boolean(contested);
    this.chokepoint = Boolean(chokepoint);
    this.length = normalizePosition(length);

    if (this.length === 0) {
      throw new RangeError('BorderSegment length must be greater than 0.');
    }

    this.position = normalizePosition(position);
  }

  get dominantProvinceId() {
    if (this.pressure === 0) {
      return null;
    }

    return this.pressure > 0 ? this.provinceAId : this.provinceBId;
  }

  withPressure(pressure) {
    return new BorderSegment({
      ...this.toJSON(),
      pressure,
      contested: pressure !== 0,
    });
  }

  toJSON() {
    return {
      id: this.id,
      provinceAId: this.provinceAId,
      provinceBId: this.provinceBId,
      terrainType: this.terrainType,
      pressure: this.pressure,
      contested: this.contested,
      chokepoint: this.chokepoint,
      length: this.length,
      position: this.position,
    };
  }
}
