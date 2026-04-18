const VALID_SEVERITIES = ['minor', 'major', 'critical'];
const VALID_STATUSES = ['warning', 'active', 'resolved'];

function normalizeRegionIds(regionIds) {
  if (!Array.isArray(regionIds) || regionIds.length === 0) {
    throw new RangeError('Catastrophe regionIds must be a non-empty array.');
  }

  const normalized = [...new Set(regionIds.map((regionId) => Catastrophe.requireText(regionId, 'Catastrophe regionId')))];

  return normalized.sort();
}

export class Catastrophe {
  constructor({
    id,
    type,
    severity,
    status = 'warning',
    regionIds,
    startedAt,
    expectedEndAt = null,
    resolvedAt = null,
    impact = {},
    description = null,
  }) {
    this.id = Catastrophe.requireText(id, 'Catastrophe id');
    this.type = Catastrophe.requireText(type, 'Catastrophe type');
    this.severity = Catastrophe.requireChoice(severity, 'Catastrophe severity', VALID_SEVERITIES);
    this.status = Catastrophe.requireChoice(status, 'Catastrophe status', VALID_STATUSES);
    this.regionIds = normalizeRegionIds(regionIds);
    this.startedAt = Catastrophe.normalizeDate(startedAt, 'Catastrophe startedAt');
    this.expectedEndAt = Catastrophe.normalizeOptionalDate(expectedEndAt, 'Catastrophe expectedEndAt');
    this.resolvedAt = Catastrophe.normalizeOptionalDate(resolvedAt, 'Catastrophe resolvedAt');
    this.impact = Catastrophe.normalizeImpact(impact);
    this.description = description === null ? null : Catastrophe.requireText(description, 'Catastrophe description');

    if (this.status === 'resolved' && this.resolvedAt === null) {
      throw new RangeError('Catastrophe resolved status requires resolvedAt.');
    }

    if (this.resolvedAt !== null && this.resolvedAt < this.startedAt) {
      throw new RangeError('Catastrophe resolvedAt cannot be earlier than startedAt.');
    }
  }

  get isActive() {
    return this.status === 'active';
  }

  get isResolved() {
    return this.status === 'resolved';
  }

  activate() {
    return new Catastrophe({
      ...this.toJSON(),
      status: 'active',
      resolvedAt: null,
    });
  }

  resolve(resolvedAt = new Date()) {
    return new Catastrophe({
      ...this.toJSON(),
      status: 'resolved',
      resolvedAt,
    });
  }

  withImpact(impact) {
    return new Catastrophe({
      ...this.toJSON(),
      impact: {
        ...this.impact,
        ...impact,
      },
    });
  }

  affectsRegion(regionId) {
    const normalizedRegionId = String(regionId ?? '').trim();
    return this.regionIds.includes(normalizedRegionId);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      severity: this.severity,
      status: this.status,
      regionIds: [...this.regionIds],
      startedAt: this.startedAt.toISOString(),
      expectedEndAt: this.expectedEndAt?.toISOString() ?? null,
      resolvedAt: this.resolvedAt?.toISOString() ?? null,
      impact: { ...this.impact },
      description: this.description,
    };
  }

  static requireText(value, label) {
    const normalizedValue = String(value ?? '').trim();

    if (!normalizedValue) {
      throw new RangeError(`${label} is required.`);
    }

    return normalizedValue;
  }

  static requireChoice(value, label, validValues) {
    const normalizedValue = Catastrophe.requireText(value, label);

    if (!validValues.includes(normalizedValue)) {
      throw new RangeError(`${label} must be one of: ${validValues.join(', ')}.`);
    }

    return normalizedValue;
  }

  static normalizeDate(value, label) {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new RangeError(`${label} must be a valid date.`);
    }

    return date;
  }

  static normalizeOptionalDate(value, label) {
    if (value === null || value === undefined) {
      return null;
    }

    return Catastrophe.normalizeDate(value, label);
  }

  static normalizeImpact(impact) {
    if (impact === null || typeof impact !== 'object' || Array.isArray(impact)) {
      throw new RangeError('Catastrophe impact must be an object.');
    }

    const normalized = {};

    for (const [key, value] of Object.entries(impact)) {
      const normalizedKey = Catastrophe.requireText(key, 'Catastrophe impact key');

      if (!Number.isFinite(value)) {
        throw new RangeError(`Catastrophe impact ${normalizedKey} must be a finite number.`);
      }

      normalized[normalizedKey] = value;
    }

    return normalized;
  }
}
