const DEFAULT_SECRECY = 50;
const DEFAULT_LOYALTY = 50;
const DEFAULT_EXPOSURE = 0;
const ACTIVE_STATUS = 'active';
const ALLOWED_STATUSES = new Set(['active', 'dormant', 'compromised', 'dismantled']);

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

export class Cellule {
  constructor({
    id,
    factionId,
    codename,
    locationId,
    memberIds = [],
    assetIds = [],
    operationIds = [],
    secrecy = DEFAULT_SECRECY,
    loyalty = DEFAULT_LOYALTY,
    exposure = DEFAULT_EXPOSURE,
    status = ACTIVE_STATUS,
    sleeper = false,
  }) {
    this.id = Cellule.#requireText(id, 'Cellule id');
    this.factionId = Cellule.#requireText(factionId, 'Cellule factionId');
    this.codename = Cellule.#requireText(codename, 'Cellule codename');
    this.locationId = Cellule.#requireText(locationId, 'Cellule locationId');
    this.memberIds = normalizeUniqueTexts(memberIds, 'Cellule memberIds');
    this.assetIds = normalizeUniqueTexts(assetIds, 'Cellule assetIds');
    this.operationIds = normalizeUniqueTexts(operationIds, 'Cellule operationIds');
    this.secrecy = Cellule.#requireIntegerInRange(secrecy, 'Cellule secrecy', 0, 100);
    this.loyalty = Cellule.#requireIntegerInRange(loyalty, 'Cellule loyalty', 0, 100);
    this.exposure = Cellule.#requireIntegerInRange(exposure, 'Cellule exposure', 0, 100);
    this.status = Cellule.#normalizeStatus(status);
    this.sleeper = Boolean(sleeper);
  }

  get operationalReadiness() {
    return Math.max(0, Math.round((this.secrecy + this.loyalty + (100 - this.exposure)) / 3));
  }

  get isExposed() {
    return this.exposure >= 70 || this.status === 'compromised';
  }

  withExposure(exposure) {
    const nextExposure = Cellule.#requireIntegerInRange(exposure, 'Cellule exposure', 0, 100);

    return new Cellule({
      ...this.toJSON(),
      exposure: nextExposure,
      status: nextExposure >= 70 ? 'compromised' : this.status,
    });
  }

  assignOperation(operationId) {
    return new Cellule({
      ...this.toJSON(),
      operationIds: [...this.operationIds, operationId],
      sleeper: false,
      status: this.status === 'dismantled' ? this.status : ACTIVE_STATUS,
    });
  }

  toJSON() {
    return {
      id: this.id,
      factionId: this.factionId,
      codename: this.codename,
      locationId: this.locationId,
      memberIds: [...this.memberIds],
      assetIds: [...this.assetIds],
      operationIds: [...this.operationIds],
      secrecy: this.secrecy,
      loyalty: this.loyalty,
      exposure: this.exposure,
      status: this.status,
      sleeper: this.sleeper,
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

  static #normalizeStatus(value) {
    const normalizedValue = Cellule.#requireText(value, 'Cellule status');

    if (!ALLOWED_STATUSES.has(normalizedValue)) {
      throw new RangeError(`Cellule status must be one of: ${[...ALLOWED_STATUSES].join(', ')}.`);
    }

    return normalizedValue;
  }
}
