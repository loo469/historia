const DEFAULT_DISCRETION = 50;
const DEFAULT_INFLUENCE = 50;
const DEFAULT_HEALTH = 100;
const DEFAULT_COVER_STRENGTH = 50;
const ACTIVE_STATUS = 'active';
const ALLOWED_STATUSES = new Set(['active', 'undercover', 'captured', 'retired', 'missing']);

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

export class Agent {
  constructor({
    id,
    codename,
    factionId,
    celluleId,
    specialtyIds = [],
    contactIds = [],
    coverIdentity = null,
    discretion = DEFAULT_DISCRETION,
    influence = DEFAULT_INFLUENCE,
    health = DEFAULT_HEALTH,
    coverStrength = DEFAULT_COVER_STRENGTH,
    status = ACTIVE_STATUS,
    compromised = false,
  }) {
    this.id = Agent.#requireText(id, 'Agent id');
    this.codename = Agent.#requireText(codename, 'Agent codename');
    this.factionId = Agent.#requireText(factionId, 'Agent factionId');
    this.celluleId = Agent.#requireText(celluleId, 'Agent celluleId');
    this.specialtyIds = normalizeUniqueTexts(specialtyIds, 'Agent specialtyIds');
    this.contactIds = normalizeUniqueTexts(contactIds, 'Agent contactIds');
    this.coverIdentity = Agent.#normalizeOptionalText(coverIdentity);
    this.discretion = Agent.#requireIntegerInRange(discretion, 'Agent discretion', 0, 100);
    this.influence = Agent.#requireIntegerInRange(influence, 'Agent influence', 0, 100);
    this.health = Agent.#requireIntegerInRange(health, 'Agent health', 0, 100);
    this.coverStrength = Agent.#requireIntegerInRange(
      coverStrength,
      'Agent coverStrength',
      0,
      100,
    );
    this.status = Agent.#normalizeStatus(status);
    this.compromised = Boolean(compromised);
  }

  get operationalValue() {
    return Math.max(0, Math.round((this.discretion + this.influence + this.health + this.coverStrength) / 4));
  }

  get isOperational() {
    return this.health > 0 && !this.compromised && this.status !== 'captured' && this.status !== 'retired';
  }

  withCompromise({ compromised, coverStrength = this.coverStrength, status = this.status }) {
    const nextCompromised = Boolean(compromised);

    return new Agent({
      ...this.toJSON(),
      compromised: nextCompromised,
      coverStrength,
      status: nextCompromised ? 'missing' : status,
    });
  }

  assignContact(contactId) {
    return new Agent({
      ...this.toJSON(),
      contactIds: [...this.contactIds, contactId],
    });
  }

  toJSON() {
    return {
      id: this.id,
      codename: this.codename,
      factionId: this.factionId,
      celluleId: this.celluleId,
      specialtyIds: [...this.specialtyIds],
      contactIds: [...this.contactIds],
      coverIdentity: this.coverIdentity,
      discretion: this.discretion,
      influence: this.influence,
      health: this.health,
      coverStrength: this.coverStrength,
      status: this.status,
      compromised: this.compromised,
    };
  }

  static #requireText(value, label) {
    const normalizedValue = String(value ?? '').trim();

    if (!normalizedValue) {
      throw new RangeError(`${label} is required.`);
    }

    return normalizedValue;
  }

  static #normalizeOptionalText(value) {
    if (value === null || value === undefined) {
      return null;
    }

    return Agent.#requireText(value, 'Agent coverIdentity');
  }

  static #requireIntegerInRange(value, label, min, max) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
    }

    return value;
  }

  static #normalizeStatus(value) {
    const normalizedValue = Agent.#requireText(value, 'Agent status');

    if (!ALLOWED_STATUSES.has(normalizedValue)) {
      throw new RangeError(`Agent status must be one of: ${[...ALLOWED_STATUSES].join(', ')}.`);
    }

    return normalizedValue;
  }
}
