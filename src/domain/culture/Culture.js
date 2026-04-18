const DEFAULT_COHESION = 50;
const DEFAULT_OPENNESS = 50;
const DEFAULT_RESEARCH_DRIVE = 50;

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

export class Culture {
  constructor({
    id,
    name,
    archetype,
    primaryLanguage,
    valueIds = [],
    traditionIds = [],
    openness = DEFAULT_OPENNESS,
    cohesion = DEFAULT_COHESION,
    researchDrive = DEFAULT_RESEARCH_DRIVE,
    lastEvolvedAt = null,
  }) {
    this.id = Culture.#requireText(id, 'Culture id');
    this.name = Culture.#requireText(name, 'Culture name');
    this.archetype = Culture.#requireText(archetype, 'Culture archetype');
    this.primaryLanguage = Culture.#requireText(primaryLanguage, 'Culture primaryLanguage');
    this.valueIds = normalizeUniqueTexts(valueIds, 'Culture valueIds');
    this.traditionIds = normalizeUniqueTexts(traditionIds, 'Culture traditionIds');
    this.openness = Culture.#requireIntegerInRange(openness, 'Culture openness', 0, 100);
    this.cohesion = Culture.#requireIntegerInRange(cohesion, 'Culture cohesion', 0, 100);
    this.researchDrive = Culture.#requireIntegerInRange(
      researchDrive,
      'Culture researchDrive',
      0,
      100,
    );
    this.lastEvolvedAt = Culture.#normalizeDate(lastEvolvedAt, 'Culture lastEvolvedAt');
  }

  withEvolution({
    openness = this.openness,
    cohesion = this.cohesion,
    researchDrive = this.researchDrive,
    valueIds = this.valueIds,
    traditionIds = this.traditionIds,
    lastEvolvedAt = new Date(),
  } = {}) {
    return new Culture({
      ...this.toJSON(),
      openness,
      cohesion,
      researchDrive,
      valueIds,
      traditionIds,
      lastEvolvedAt,
    });
  }

  embracesInnovation() {
    return this.openness >= 60 && this.researchDrive >= 60;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      archetype: this.archetype,
      primaryLanguage: this.primaryLanguage,
      valueIds: [...this.valueIds],
      traditionIds: [...this.traditionIds],
      openness: this.openness,
      cohesion: this.cohesion,
      researchDrive: this.researchDrive,
      lastEvolvedAt: this.lastEvolvedAt?.toISOString() ?? null,
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

  static #normalizeDate(value, label) {
    if (value === null || value === undefined) {
      return null;
    }

    const normalizedValue = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(normalizedValue.getTime())) {
      throw new RangeError(`${label} must be a valid date.`);
    }

    return normalizedValue;
  }
}
