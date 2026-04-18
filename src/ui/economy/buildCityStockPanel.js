import { City } from '../../domain/economy/City.js';

const TONE_BY_STATUS = Object.freeze({
  surplus: 'positive',
  balanced: 'neutral',
  shortage: 'warning',
});

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function requireNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be an integer greater than or equal to 0.`);
  }

  return value;
}

function normalizeDesiredStock(desiredStockByResource) {
  const normalizedDesiredStock = requireObject(desiredStockByResource, 'CityStockPanel desiredStockByResource');

  return Object.fromEntries(
    Object.entries(normalizedDesiredStock)
      .map(([resourceId, quantity]) => {
        const normalizedResourceId = String(resourceId).trim();

        if (!normalizedResourceId) {
          throw new RangeError('CityStockPanel desiredStockByResource cannot contain an empty resource id.');
        }

        return [normalizedResourceId, requireNonNegativeInteger(quantity, `CityStockPanel desired stock ${normalizedResourceId}`)];
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function buildStockRow(resourceId, currentQuantity, desiredQuantity) {
  const delta = currentQuantity - desiredQuantity;
  const status = delta > 0 ? 'surplus' : delta < 0 ? 'shortage' : 'balanced';

  return {
    resourceId,
    currentQuantity,
    desiredQuantity,
    delta,
    status,
    tone: TONE_BY_STATUS[status],
    label: `${resourceId}: ${currentQuantity}/${desiredQuantity}`,
    detail: delta === 0
      ? 'Objectif atteint'
      : delta > 0
        ? `Surplus de ${delta}`
        : `Manque de ${Math.abs(delta)}`,
  };
}

export function buildCityStockPanel(city, options = {}) {
  const normalizedOptions = requireObject(options, 'CityStockPanel options');
  const normalizedCity = city instanceof City ? city : new City(city ?? {});
  const desiredStockByResource = normalizeDesiredStock(normalizedOptions.desiredStockByResource ?? {});
  const resourceIds = new Set([
    ...Object.keys(normalizedCity.stockByResource),
    ...Object.keys(desiredStockByResource),
  ]);

  const rows = [...resourceIds]
    .sort((left, right) => left.localeCompare(right))
    .map((resourceId) => buildStockRow(
      resourceId,
      normalizedCity.stockByResource[resourceId] ?? 0,
      desiredStockByResource[resourceId] ?? 0,
    ));

  const shortages = rows.filter((row) => row.status === 'shortage').length;
  const surpluses = rows.filter((row) => row.status === 'surplus').length;

  return {
    cityId: normalizedCity.id,
    cityName: normalizedCity.name,
    title: `Stocks de ${normalizedCity.name}`,
    summary: `${rows.length} ressources, ${shortages} en manque, ${surpluses} en surplus`,
    rows,
    metrics: {
      resourceCount: rows.length,
      shortageCount: shortages,
      surplusCount: surpluses,
    },
  };
}
