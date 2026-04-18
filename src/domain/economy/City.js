const DEFAULT_PROSPERITY = 50;
const DEFAULT_STABILITY = 50;

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

function normalizeStockByResource(stockByResource) {
  if (stockByResource === null || typeof stockByResource !== 'object' || Array.isArray(stockByResource)) {
    throw new TypeError('City stockByResource must be an object.');
  }

  return Object.fromEntries(
    Object.entries(stockByResource)
      .map(([resourceId, quantity]) => {
        const normalizedResourceId = String(resourceId).trim();

        if (!normalizedResourceId) {
          throw new RangeError('City stockByResource cannot contain an empty resource id.');
        }

        if (!Number.isInteger(quantity) || quantity < 0) {
          throw new RangeError('City stock quantities must be integers greater than or equal to 0.');
        }

        return [normalizedResourceId, quantity];
      })
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId)),
  );
}

export class City {
  constructor({
    id,
    name,
    regionId,
    population,
    workforce = population,
    prosperity = DEFAULT_PROSPERITY,
    stability = DEFAULT_STABILITY,
    stockByResource = {},
    productionRuleIds = [],
    tradeRouteIds = [],
    tags = [],
    capital = false,
  }) {
    this.id = City.#requireText(id, 'City id');
    this.name = City.#requireText(name, 'City name');
    this.regionId = City.#requireText(regionId, 'City regionId');
    this.population = City.#requireIntegerInRange(population, 'City population', 0, Number.MAX_SAFE_INTEGER);
    this.workforce = City.#requireIntegerInRange(workforce, 'City workforce', 0, this.population);
    this.prosperity = City.#requireIntegerInRange(prosperity, 'City prosperity', 0, 100);
    this.stability = City.#requireIntegerInRange(stability, 'City stability', 0, 100);
    this.stockByResource = normalizeStockByResource(stockByResource);
    this.productionRuleIds = normalizeUniqueTextList(productionRuleIds, 'City productionRuleIds');
    this.tradeRouteIds = normalizeUniqueTextList(tradeRouteIds, 'City tradeRouteIds');
    this.tags = normalizeUniqueTextList(tags, 'City tags');
    this.capital = Boolean(capital);
  }

  get scarcityRatio() {
    const totalStock = Object.values(this.stockByResource).reduce((sum, quantity) => sum + quantity, 0);

    if (this.population === 0) {
      return totalStock === 0 ? 0 : Infinity;
    }

    return totalStock / this.population;
  }

  withStock(resourceId, quantity) {
    const normalizedResourceId = City.#requireText(resourceId, 'City resourceId');
    const nextQuantity = City.#requireIntegerInRange(
      quantity,
      'City stock quantity',
      0,
      Number.MAX_SAFE_INTEGER,
    );

    return new City({
      ...this.toJSON(),
      stockByResource: {
        ...this.stockByResource,
        [normalizedResourceId]: nextQuantity,
      },
    });
  }

  withProsperity(prosperity) {
    return new City({
      ...this.toJSON(),
      prosperity,
    });
  }

  withTradeRoute(tradeRouteId) {
    return new City({
      ...this.toJSON(),
      tradeRouteIds: [...this.tradeRouteIds, tradeRouteId],
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      regionId: this.regionId,
      population: this.population,
      workforce: this.workforce,
      prosperity: this.prosperity,
      stability: this.stability,
      stockByResource: { ...this.stockByResource },
      productionRuleIds: [...this.productionRuleIds],
      tradeRouteIds: [...this.tradeRouteIds],
      tags: [...this.tags],
      capital: this.capital,
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
