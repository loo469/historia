const LEVELS = Object.freeze([
  { value: 0, code: 'latent', label: 'Latent', surveillanceIntensity: 10 },
  { value: 1, code: 'surveille', label: 'Surveillé', surveillanceIntensity: 30 },
  { value: 2, code: 'renforce', label: 'Renforcé', surveillanceIntensity: 55 },
  { value: 3, code: 'critique', label: 'Critique', surveillanceIntensity: 80 },
  { value: 4, code: 'verrouille', label: 'Verrouillé', surveillanceIntensity: 100 },
]);

const LEVEL_BY_VALUE = new Map(LEVELS.map((level) => [level.value, level]));
const LEVEL_BY_CODE = new Map(LEVELS.map((level) => [level.code, level]));

export class NiveauAlerte {
  constructor(value = 0) {
    this.value = NiveauAlerte.#normalizeValue(value);
  }

  get code() {
    return LEVEL_BY_VALUE.get(this.value).code;
  }

  get label() {
    return LEVEL_BY_VALUE.get(this.value).label;
  }

  get surveillanceIntensity() {
    return LEVEL_BY_VALUE.get(this.value).surveillanceIntensity;
  }

  get isCritical() {
    return this.value >= 3;
  }

  increase(step = 1) {
    const normalizedStep = NiveauAlerte.#normalizeStep(step);
    return new NiveauAlerte(Math.min(this.value + normalizedStep, NiveauAlerte.maximum().value));
  }

  decrease(step = 1) {
    const normalizedStep = NiveauAlerte.#normalizeStep(step);
    return new NiveauAlerte(Math.max(this.value - normalizedStep, NiveauAlerte.minimum().value));
  }

  equals(other) {
    return other instanceof NiveauAlerte && other.value === this.value;
  }

  toJSON() {
    return {
      value: this.value,
      code: this.code,
      label: this.label,
      surveillanceIntensity: this.surveillanceIntensity,
    };
  }

  static from(value) {
    if (value instanceof NiveauAlerte) {
      return new NiveauAlerte(value.value);
    }

    if (typeof value === 'string') {
      const normalizedCode = value.trim().toLowerCase();
      const level = LEVEL_BY_CODE.get(normalizedCode);

      if (!level) {
        throw new RangeError(`NiveauAlerte code must be one of: ${[...LEVEL_BY_CODE.keys()].join(', ')}.`);
      }

      return new NiveauAlerte(level.value);
    }

    return new NiveauAlerte(value);
  }

  static minimum() {
    return new NiveauAlerte(LEVELS[0].value);
  }

  static maximum() {
    return new NiveauAlerte(LEVELS.at(-1).value);
  }

  static all() {
    return LEVELS.map((level) => new NiveauAlerte(level.value));
  }

  static #normalizeValue(value) {
    if (!Number.isInteger(value) || !LEVEL_BY_VALUE.has(value)) {
      throw new RangeError(`NiveauAlerte value must be an integer between 0 and ${LEVELS.at(-1).value}.`);
    }

    return value;
  }

  static #normalizeStep(step) {
    if (!Number.isInteger(step) || step < 0) {
      throw new RangeError('NiveauAlerte step must be a non-negative integer.');
    }

    return step;
  }
}
