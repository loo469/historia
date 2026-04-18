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

export class HistoricalEvent {
  constructor({
    id,
    title,
    category,
    summary,
    era,
    importance,
    triggeredAt,
    affectedCultureIds = [],
    divergencePointId = null,
    discoveryIds = [],
    tags = [],
    resolved = false,
    resolvedAt = null,
  }) {
    this.id = HistoricalEvent.#requireText(id, 'HistoricalEvent id');
    this.title = HistoricalEvent.#requireText(title, 'HistoricalEvent title');
    this.category = HistoricalEvent.#requireText(category, 'HistoricalEvent category');
    this.summary = HistoricalEvent.#requireText(summary, 'HistoricalEvent summary');
    this.era = HistoricalEvent.#requireText(era, 'HistoricalEvent era');
    this.importance = HistoricalEvent.#requireIntegerInRange(
      importance,
      'HistoricalEvent importance',
      1,
      5,
    );
    this.triggeredAt = HistoricalEvent.#normalizeDate(
      triggeredAt,
      'HistoricalEvent triggeredAt',
    );
    this.affectedCultureIds = normalizeUniqueTexts(
      affectedCultureIds,
      'HistoricalEvent affectedCultureIds',
    );
    this.divergencePointId = HistoricalEvent.#normalizeOptionalText(
      divergencePointId,
      'HistoricalEvent divergencePointId',
    );
    this.discoveryIds = normalizeUniqueTexts(discoveryIds, 'HistoricalEvent discoveryIds');
    this.tags = normalizeUniqueTexts(tags, 'HistoricalEvent tags');
    this.resolved = Boolean(resolved);
    this.resolvedAt = HistoricalEvent.#normalizeOptionalDate(resolvedAt, 'HistoricalEvent resolvedAt');

    if (this.resolved && this.resolvedAt === null) {
      throw new RangeError('HistoricalEvent resolvedAt is required when event is resolved.');
    }

    if (!this.resolved && this.resolvedAt !== null) {
      throw new RangeError('HistoricalEvent resolvedAt must be null when event is unresolved.');
    }
  }

  affectsCulture(cultureId) {
    return this.affectedCultureIds.includes(HistoricalEvent.#requireText(cultureId, 'cultureId'));
  }

  withDiscoveries(discoveryIds) {
    return new HistoricalEvent({
      ...this.toJSON(),
      discoveryIds,
    });
  }

  resolve(resolvedAt = new Date()) {
    return new HistoricalEvent({
      ...this.toJSON(),
      resolved: true,
      resolvedAt,
    });
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      summary: this.summary,
      era: this.era,
      importance: this.importance,
      triggeredAt: this.triggeredAt.toISOString(),
      affectedCultureIds: [...this.affectedCultureIds],
      divergencePointId: this.divergencePointId,
      discoveryIds: [...this.discoveryIds],
      tags: [...this.tags],
      resolved: this.resolved,
      resolvedAt: this.resolvedAt?.toISOString() ?? null,
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

    return HistoricalEvent.#requireText(value, label);
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

  static #normalizeOptionalDate(value, label) {
    if (value === null || value === undefined) {
      return null;
    }

    return HistoricalEvent.#normalizeDate(value, label);
  }
}
