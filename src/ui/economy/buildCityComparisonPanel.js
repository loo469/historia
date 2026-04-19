import { City } from '../../domain/economy/City.js';

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return value;
}

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function normalizeCity(city) {
  if (city instanceof City) {
    return city;
  }

  if (city === null || typeof city !== 'object' || Array.isArray(city)) {
    throw new TypeError('CityComparisonPanel cities must contain City instances or plain objects.');
  }

  return new City(city);
}

function buildTensionLevel(city, desiredStockByCityId) {
  const desiredStock = desiredStockByCityId[city.id] ?? {};
  const resourceIds = new Set([
    ...Object.keys(city.stockByResource),
    ...Object.keys(desiredStock),
  ]);

  let shortageCount = 0;
  let surplusCount = 0;
  let tensionScore = 0;

  for (const resourceId of resourceIds) {
    const current = city.stockByResource[resourceId] ?? 0;
    const desired = desiredStock[resourceId] ?? 0;
    const delta = current - desired;

    if (delta < 0) {
      shortageCount += 1;
      tensionScore += Math.abs(delta);
    } else if (delta > 0) {
      surplusCount += 1;
    }
  }

  const level = tensionScore >= 10 ? 'high' : tensionScore > 0 ? 'medium' : 'low';

  return {
    shortageCount,
    surplusCount,
    tensionScore,
    level,
  };
}

export function buildCityComparisonPanel(cities, options = {}) {
  const normalizedCities = requireArray(cities, 'CityComparisonPanel cities').map(normalizeCity);
  const normalizedOptions = requireObject(options, 'CityComparisonPanel options');
  const desiredStockByCityId = requireObject(
    normalizedOptions.desiredStockByCityId ?? {},
    'CityComparisonPanel desiredStockByCityId',
  );

  const rows = normalizedCities
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((city) => {
      const totalStock = Object.values(city.stockByResource).reduce((sum, quantity) => sum + quantity, 0);
      const tension = buildTensionLevel(city, desiredStockByCityId);

      return {
        cityId: city.id,
        cityName: city.name,
        regionId: city.regionId,
        population: city.population,
        prosperity: city.prosperity,
        stability: city.stability,
        totalStock,
        scarcityRatio: Number(city.scarcityRatio.toFixed(2)),
        shortageCount: tension.shortageCount,
        surplusCount: tension.surplusCount,
        tensionScore: tension.tensionScore,
        tensionLevel: tension.level,
        label: `${city.name}, stock ${totalStock}, tension ${tension.level}`,
      };
    });

  const highestScarcity = rows.reduce((current, row) => (row.scarcityRatio > current.scarcityRatio ? row : current), rows[0] ?? null);
  const highestTension = rows.reduce((current, row) => (row.tensionScore > current.tensionScore ? row : current), rows[0] ?? null);

  return {
    title: 'Comparatif des villes',
    summary: `${rows.length} villes suivies, ${rows.filter((row) => row.tensionLevel !== 'low').length} sous tension`,
    rows,
    highlights: {
      highestScarcityCityId: highestScarcity?.cityId ?? null,
      highestTensionCityId: highestTension?.cityId ?? null,
    },
    metrics: {
      cityCount: rows.length,
      totalPopulation: rows.reduce((sum, row) => sum + row.population, 0),
      totalStock: rows.reduce((sum, row) => sum + row.totalStock, 0),
      highTensionCount: rows.filter((row) => row.tensionLevel === 'high').length,
    },
  };
}
