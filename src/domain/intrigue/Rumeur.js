const DEFAULT_CREDIBILITY = 50;
const DEFAULT_PROPAGATION = 0;
const DEFAULT_TENSION = 0;
const DEFAULT_STATUS = 'circulating';
const ALLOWED_STATUSES = new Set(['circulating', 'contained', 'amplified', 'debunked']);
const ALLOWED_CATEGORIES = new Set(['military', 'political', 'economic', 'religious', 'social']);

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

export class Rumeur {
  constructor({
    id,
    sourceCelluleId,
    targetFactionId,
    category,
    narrative,
    originLocationId,
    relayIds = [],
    affectedPopulationIds = [],
    credibility = DEFAULT_CREDIBILITY,
    propagation = DEFAULT_PROPAGATION,
    tension = DEFAULT_TENSION,
    status = DEFAULT_STATUS,
    truthValue = null,
  }) {
    this.id = Rumeur.#requireText(id, 'Rumeur id');
    this.sourceCelluleId = Rumeur.#requireText(sourceCelluleId, 'Rumeur sourceCelluleId');
    this.targetFactionId = Rumeur.#requireText(targetFactionId, 'Rumeur targetFactionId');
    this.category = Rumeur.#normalizeCategory(category);
    this.narrative = Rumeur.#requireText(narrative, 'Rumeur narrative');
    this.originLocationId = Rumeur.#requireText(originLocationId, 'Rumeur originLocationId');
    this.relayIds = normalizeUniqueTexts(relayIds, 'Rumeur relayIds');
    this.affectedPopulationIds = normalizeUniqueTexts(
      affectedPopulationIds,
      'Rumeur affectedPopulationIds',
    );
    this.credibility = Rumeur.#requireIntegerInRange(
      credibility,
      'Rumeur credibility',
      0,
      100,
    );
    this.propagation = Rumeur.#requireIntegerInRange(
      propagation,
      'Rumeur propagation',
      0,
      100,
    );
    this.tension = Rumeur.#requireIntegerInRange(tension, 'Rumeur tension', 0, 100);
    this.status = Rumeur.#normalizeStatus(status);
    this.truthValue = Rumeur.#normalizeTruthValue(truthValue);
  }

  get influenceScore() {
    return Math.max(0, Math.round((this.credibility + this.propagation + this.tension) / 3));
  }

  get isNeutralized() {
    return this.status === 'contained' || this.status === 'debunked';
  }

  amplify({ propagation = this.propagation, tension = this.tension, status = 'amplified' }) {
    return new Rumeur({
      ...this.toJSON(),
      propagation,
      tension,
      status,
    });
  }

  addRelay(relayId) {
    return new Rumeur({
      ...this.toJSON(),
      relayIds: [...this.relayIds, relayId],
    });
  }

  toJSON() {
    return {
      id: this.id,
      sourceCelluleId: this.sourceCelluleId,
      targetFactionId: this.targetFactionId,
      category: this.category,
      narrative: this.narrative,
      originLocationId: this.originLocationId,
      relayIds: [...this.relayIds],
      affectedPopulationIds: [...this.affectedPopulationIds],
      credibility: this.credibility,
      propagation: this.propagation,
      tension: this.tension,
      status: this.status,
      truthValue: this.truthValue,
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

  static #normalizeCategory(value) {
    const normalizedValue = Rumeur.#requireText(value, 'Rumeur category');

    if (!ALLOWED_CATEGORIES.has(normalizedValue)) {
      throw new RangeError(`Rumeur category must be one of: ${[...ALLOWED_CATEGORIES].join(', ')}.`);
    }

    return normalizedValue;
  }

  static #normalizeStatus(value) {
    const normalizedValue = Rumeur.#requireText(value, 'Rumeur status');

    if (!ALLOWED_STATUSES.has(normalizedValue)) {
      throw new RangeError(`Rumeur status must be one of: ${[...ALLOWED_STATUSES].join(', ')}.`);
    }

    return normalizedValue;
  }

  static #normalizeTruthValue(value) {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== 'boolean') {
      throw new TypeError('Rumeur truthValue must be a boolean or null.');
    }

    return value;
  }
}
