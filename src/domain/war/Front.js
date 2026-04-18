function normalizeText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeSegmentIds(segmentIds) {
  if (!Array.isArray(segmentIds) || segmentIds.length === 0) {
    throw new RangeError('Front segmentIds must be a non-empty array.');
  }

  const normalizedIds = [...new Set(segmentIds.map((segmentId) => normalizeText(segmentId, 'Front segmentId')))];

  return normalizedIds.sort();
}

function normalizePressure(value) {
  if (!Number.isInteger(value) || value < -100 || value > 100) {
    throw new RangeError('Front pressure must be an integer between -100 and 100.');
  }

  return value;
}

function normalizeMomentum(value) {
  if (!Number.isInteger(value) || value < 0 || value > 10) {
    throw new RangeError('Front momentum must be an integer between 0 and 10.');
  }

  return value;
}

function normalizeUpdatedAt(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Front updatedAt must be a valid date.');
  }

  return date;
}

export class Front {
  constructor({
    id,
    attackerFactionId,
    defenderFactionId,
    segmentIds,
    pressure = 0,
    momentum = 0,
    status = 'stalled',
    active = true,
    updatedAt = null,
  }) {
    this.attackerFactionId = normalizeText(attackerFactionId, 'Front attackerFactionId');
    this.defenderFactionId = normalizeText(defenderFactionId, 'Front defenderFactionId');

    if (this.attackerFactionId === this.defenderFactionId) {
      throw new RangeError('Front factions must be different.');
    }

    this.id = normalizeText(
      id ?? `${this.attackerFactionId}::${this.defenderFactionId}`,
      'Front id',
    );
    this.segmentIds = normalizeSegmentIds(segmentIds);
    this.pressure = normalizePressure(pressure);
    this.momentum = normalizeMomentum(momentum);
    this.status = normalizeText(status, 'Front status');
    this.active = Boolean(active);
    this.updatedAt = normalizeUpdatedAt(updatedAt);
  }

  get dominantFactionId() {
    if (this.pressure === 0) {
      return null;
    }

    return this.pressure > 0 ? this.attackerFactionId : this.defenderFactionId;
  }

  withPressure(pressure, updatedAt = new Date()) {
    const normalizedPressure = normalizePressure(pressure);

    return new Front({
      ...this.toJSON(),
      pressure: normalizedPressure,
      status: normalizedPressure === 0 ? 'stalled' : 'active',
      active: true,
      updatedAt,
    });
  }

  reinforce(segmentId, momentum = this.momentum + 1, updatedAt = new Date()) {
    return new Front({
      ...this.toJSON(),
      segmentIds: [...this.segmentIds, segmentId],
      momentum,
      active: true,
      updatedAt,
    });
  }

  conclude(updatedAt = new Date()) {
    return new Front({
      ...this.toJSON(),
      active: false,
      status: 'resolved',
      updatedAt,
    });
  }

  toJSON() {
    return {
      id: this.id,
      attackerFactionId: this.attackerFactionId,
      defenderFactionId: this.defenderFactionId,
      segmentIds: [...this.segmentIds],
      pressure: this.pressure,
      momentum: this.momentum,
      status: this.status,
      active: this.active,
      updatedAt: this.updatedAt?.toISOString() ?? null,
    };
  }
}
