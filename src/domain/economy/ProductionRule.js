function normalizeTextList(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const normalizedValues = [...new Set(values.map((value) => String(value).trim()))];

  if (normalizedValues.some((value) => value.length === 0)) {
    throw new RangeError(`${label} cannot contain empty values.`);
  }

  return normalizedValues.sort();
}

function normalizeResourceMap(resources, label) {
  if (resources === null || typeof resources !== 'object' || Array.isArray(resources)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return Object.fromEntries(
    Object.entries(resources)
      .map(([resourceId, quantity]) => {
        const normalizedResourceId = String(resourceId).trim();

        if (!normalizedResourceId) {
          throw new RangeError(`${label} cannot contain an empty resource id.`);
        }

        if (!Number.isInteger(quantity) || quantity < 0) {
          throw new RangeError(`${label} quantities must be integers greater than or equal to 0.`);
        }

        return [normalizedResourceId, quantity];
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

export class ProductionRule {
  constructor({
    id,
    name,
    workforceRequired,
    inputByResource = {},
    outputByResource,
    requiredBuildingTags = [],
    requiredCityTags = [],
    prosperityImpact = 0,
    stabilityImpact = 0,
    enabled = true,
  }) {
    this.id = ProductionRule.#requireText(id, 'ProductionRule id');
    this.name = ProductionRule.#requireText(name, 'ProductionRule name');
    this.workforceRequired = ProductionRule.#requireIntegerInRange(
      workforceRequired,
      'ProductionRule workforceRequired',
      0,
      Number.MAX_SAFE_INTEGER,
    );
    this.inputByResource = normalizeResourceMap(inputByResource, 'ProductionRule inputByResource');
    this.outputByResource = normalizeResourceMap(outputByResource, 'ProductionRule outputByResource');
    this.requiredBuildingTags = normalizeTextList(
      requiredBuildingTags,
      'ProductionRule requiredBuildingTags',
    );
    this.requiredCityTags = normalizeTextList(requiredCityTags, 'ProductionRule requiredCityTags');
    this.prosperityImpact = ProductionRule.#requireIntegerInRange(
      prosperityImpact,
      'ProductionRule prosperityImpact',
      -100,
      100,
    );
    this.stabilityImpact = ProductionRule.#requireIntegerInRange(
      stabilityImpact,
      'ProductionRule stabilityImpact',
      -100,
      100,
    );
    this.enabled = Boolean(enabled);
  }

  get isTransformative() {
    return Object.keys(this.inputByResource).length > 0;
  }

  canRun({ workforceAvailable, buildingTags = [], cityTags = [] }) {
    const normalizedWorkforce = ProductionRule.#requireIntegerInRange(
      workforceAvailable,
      'ProductionRule workforceAvailable',
      0,
      Number.MAX_SAFE_INTEGER,
    );
    const normalizedBuildingTags = new Set(normalizeTextList(buildingTags, 'ProductionRule buildingTags'));
    const normalizedCityTags = new Set(normalizeTextList(cityTags, 'ProductionRule cityTags'));

    return (
      this.enabled
      && normalizedWorkforce >= this.workforceRequired
      && this.requiredBuildingTags.every((tag) => normalizedBuildingTags.has(tag))
      && this.requiredCityTags.every((tag) => normalizedCityTags.has(tag))
    );
  }

  withEnabled(enabled) {
    return new ProductionRule({
      ...this.toJSON(),
      enabled,
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      workforceRequired: this.workforceRequired,
      inputByResource: { ...this.inputByResource },
      outputByResource: { ...this.outputByResource },
      requiredBuildingTags: [...this.requiredBuildingTags],
      requiredCityTags: [...this.requiredCityTags],
      prosperityImpact: this.prosperityImpact,
      stabilityImpact: this.stabilityImpact,
      enabled: this.enabled,
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
}
