function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeUniqueTextList(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const normalizedValues = [...new Set(values.map((value) => String(value).trim()))];

  if (normalizedValues.some((value) => value.length === 0)) {
    throw new RangeError(`${label} cannot contain empty values.`);
  }

  return normalizedValues.sort();
}

function requireInteger(value, label, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
  }

  return value;
}

export class ProductionRule {
  constructor({
    id,
    cityId,
    resourceId,
    buildingType,
    laborRequired,
    baseYield,
    inputByResource = {},
    seasonModifiers = {},
    tags = [],
    active = true,
    priority = 50,
  }) {
    this.id = requireText(id, 'ProductionRule id');
    this.cityId = requireText(cityId, 'ProductionRule cityId');
    this.resourceId = requireText(resourceId, 'ProductionRule resourceId');
    this.buildingType = requireText(buildingType, 'ProductionRule buildingType');
    this.laborRequired = requireInteger(
      laborRequired,
      'ProductionRule laborRequired',
      0,
      Number.MAX_SAFE_INTEGER,
    );
    this.baseYield = requireInteger(
      baseYield,
      'ProductionRule baseYield',
      0,
      Number.MAX_SAFE_INTEGER,
    );
    this.inputByResource = ProductionRule.#normalizeInputByResource(inputByResource);
    this.seasonModifiers = ProductionRule.#normalizeSeasonModifiers(seasonModifiers);
    this.tags = normalizeUniqueTextList(tags, 'ProductionRule tags');
    this.active = Boolean(active);
    this.priority = requireInteger(priority, 'ProductionRule priority', 0, 100);
  }

  get totalInputRequired() {
    return Object.values(this.inputByResource).reduce((sum, quantity) => sum + quantity, 0);
  }

  get netBaseYield() {
    return this.baseYield - this.totalInputRequired;
  }

  get hasInputs() {
    return Object.keys(this.inputByResource).length > 0;
  }

  get bestSeason() {
    const entries = Object.entries(this.seasonModifiers);

    if (entries.length === 0) {
      return null;
    }

    return entries.reduce((bestSeason, currentSeason) => {
      if (bestSeason === null || currentSeason[1] > bestSeason[1]) {
        return currentSeason;
      }

      return bestSeason;
    }, null)?.[0] ?? null;
  }

  withPriority(priority) {
    return new ProductionRule({
      ...this.toJSON(),
      priority,
    });
  }

  withActive(active) {
    return new ProductionRule({
      ...this.toJSON(),
      active,
    });
  }

  withSeasonModifier(season, modifier) {
    const normalizedSeason = requireText(season, 'ProductionRule season');

    return new ProductionRule({
      ...this.toJSON(),
      seasonModifiers: {
        ...this.seasonModifiers,
        [normalizedSeason]: requireInteger(
          modifier,
          'ProductionRule season modifier',
          -100,
          100,
        ),
      },
    });
  }

  toJSON() {
    return {
      id: this.id,
      cityId: this.cityId,
      resourceId: this.resourceId,
      buildingType: this.buildingType,
      laborRequired: this.laborRequired,
      baseYield: this.baseYield,
      inputByResource: { ...this.inputByResource },
      seasonModifiers: { ...this.seasonModifiers },
      tags: [...this.tags],
      active: this.active,
      priority: this.priority,
    };
  }

  static #normalizeInputByResource(inputByResource) {
    if (
      inputByResource === null
      || typeof inputByResource !== 'object'
      || Array.isArray(inputByResource)
    ) {
      throw new TypeError('ProductionRule inputByResource must be an object.');
    }

    return Object.fromEntries(
      Object.entries(inputByResource)
        .map(([resourceId, quantity]) => {
          const normalizedResourceId = requireText(resourceId, 'ProductionRule input resourceId');

          return [
            normalizedResourceId,
            requireInteger(
              quantity,
              `ProductionRule input quantity for ${normalizedResourceId}`,
              0,
              Number.MAX_SAFE_INTEGER,
            ),
          ];
        })
        .sort(([leftId], [rightId]) => leftId.localeCompare(rightId)),
    );
  }

  static #normalizeSeasonModifiers(seasonModifiers) {
    if (
      seasonModifiers === null
      || typeof seasonModifiers !== 'object'
      || Array.isArray(seasonModifiers)
    ) {
      throw new TypeError('ProductionRule seasonModifiers must be an object.');
    }

    return Object.fromEntries(
      Object.entries(seasonModifiers)
        .map(([season, modifier]) => {
          const normalizedSeason = requireText(season, 'ProductionRule season');

          return [
            normalizedSeason,
            requireInteger(
              modifier,
              `ProductionRule season modifier for ${normalizedSeason}`,
              -100,
              100,
            ),
          ];
        })
        .sort(([leftSeason], [rightSeason]) => leftSeason.localeCompare(rightSeason)),
    );
  }
}
