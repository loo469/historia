const SUPPLY_LEVELS = Object.freeze({
  SECURE: 'secure',
  STABLE: 'stable',
  STRAINED: 'strained',
  DISRUPTED: 'disrupted',
  COLLAPSED: 'collapsed',
});

const SUPPLY_LEVEL_INDEX = Object.freeze({
  [SUPPLY_LEVELS.SECURE]: 4,
  [SUPPLY_LEVELS.STABLE]: 3,
  [SUPPLY_LEVELS.STRAINED]: 2,
  [SUPPLY_LEVELS.DISRUPTED]: 1,
  [SUPPLY_LEVELS.COLLAPSED]: 0,
});

export class SupplyLevel {
  static states() {
    return Object.values(SUPPLY_LEVELS);
  }

  static normalize(value) {
    const normalizedValue = String(value ?? '').trim().toLowerCase();

    if (!SupplyLevel.isValid(normalizedValue)) {
      throw new RangeError(`SupplyLevel must be one of: ${SupplyLevel.states().join(', ')}.`);
    }

    return normalizedValue;
  }

  static isValid(value) {
    return Object.hasOwn(SUPPLY_LEVEL_INDEX, value);
  }

  static compare(left, right) {
    return SUPPLY_LEVEL_INDEX[SupplyLevel.normalize(left)] - SUPPLY_LEVEL_INDEX[SupplyLevel.normalize(right)];
  }

  static degrade(value) {
    const normalizedValue = SupplyLevel.normalize(value);
    const states = SupplyLevel.states();
    const index = states.indexOf(normalizedValue);

    return states[Math.min(index + 1, states.length - 1)];
  }

  static improve(value) {
    const normalizedValue = SupplyLevel.normalize(value);
    const states = SupplyLevel.states();
    const index = states.indexOf(normalizedValue);

    return states[Math.max(index - 1, 0)];
  }
}

export { SUPPLY_LEVELS };
