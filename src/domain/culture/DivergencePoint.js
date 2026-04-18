function normalizeUniqueTexts(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const normalizedValues = [...new Set(values.map((value) => String(value).trim()))];

  if (normalizedValues.some((value) => value.length === 0)) {
    throw new RangeError(`${label} cannot contain empty values.`);
  }

  return normalizedValues.sort();
}

export class DivergencePoint {
  constructor({
    id,
    title,
    era,
    baselineSummary,
    divergenceSummary,
    affectedCultureIds = [],
    consequenceIds = [],
    severity,
    discovered = false,
    registeredAt,
    triggeredEventId = null,
  }) {
    this.id = DivergencePoint.#requireText(id, 'DivergencePoint id');
    this.title = DivergencePoint.#requireText(title, 'DivergencePoint title');
    this.era = DivergencePoint.#requireText(era, 'DivergencePoint era');
    this.baselineSummary = DivergencePoint.#requireText(
      baselineSummary,
      'DivergencePoint baselineSummary',
    );
    this.divergenceSummary = DivergencePoint.#requireText(
      divergenceSummary,
      'DivergencePoint divergenceSummary',
    );
    this.affectedCultureIds = normalizeUniqueTexts(
      affectedCultureIds,
      'DivergencePoint affectedCultureIds',
    );
    this.consequenceIds = normalizeUniqueTexts(
      consequenceIds,
      'DivergencePoint consequenceIds',
    );
    this.severity = DivergencePoint.#requireIntegerInRange(
      severity,
      'DivergencePoint severity',
      1,
      5,
    );
    this.discovered = Boolean(discovered);
    this.registeredAt = DivergencePoint.#normalizeDate(
      registeredAt,
      'DivergencePoint registeredAt',
    );
    this.triggeredEventId = DivergencePoint.#normalizeOptionalText(
      triggeredEventId,
      'DivergencePoint triggeredEventId',
    );
  }

  impactsCulture(cultureId) {
    return this.affectedCultureIds.includes(DivergencePoint.#requireText(cultureId, 'cultureId'));
  }

  withDiscovery(triggeredEventId = this.triggeredEventId) {
    return new DivergencePoint({
      ...this.toJSON(),
      discovered: true,
      triggeredEventId,
    });
  }

  withConsequences(consequenceIds) {
    return new DivergencePoint({
      ...this.toJSON(),
      consequenceIds,
    });
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      era: this.era,
      baselineSummary: this.baselineSummary,
      divergenceSummary: this.divergenceSummary,
      affectedCultureIds: [...this.affectedCultureIds],
      consequenceIds: [...this.consequenceIds],
      severity: this.severity,
      discovered: this.discovered,
      registeredAt: this.registeredAt.toISOString(),
      triggeredEventId: this.triggeredEventId,
    };
  }

  static #requireText(value, label) {
    const normalizedValue = String(value ?? '').trim();

    if (!normalizedValue) {
      throw new RangeError(`${label} is required.`);
    }

    return normalizedValue;
  }

  static #normalizeOptionalText(value, label) {
    if (value === null || value === undefined) {
      return null;
    }

    return DivergencePoint.#requireText(value, label);
  }

  static #requireIntegerInRange(value, label, min, max) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
    }

    return value;
  }

  static #normalizeDate(value, label) {
    if (value === null || value === undefined) {
      throw new RangeError(`${label} is required.`);
    }

    const normalizedValue = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(normalizedValue.getTime())) {
      throw new RangeError(`${label} must be a valid date.`);
    }

    return normalizedValue;
  }
}
