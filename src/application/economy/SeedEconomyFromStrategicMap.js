import { City } from '../../domain/economy/City.js';
import { TradeRoute } from '../../domain/economy/TradeRoute.js';

const SUPPLY_MODIFIERS = Object.freeze({
  secure: { prosperity: 12, stability: 10, stock: 18, risk: -12 },
  stable: { prosperity: 6, stability: 6, stock: 12, risk: -6 },
  strained: { prosperity: -4, stability: -2, stock: 6, risk: 8 },
  disrupted: { prosperity: -12, stability: -14, stock: 2, risk: 22 },
  collapsed: { prosperity: -22, stability: -24, stock: 0, risk: 36 },
});

const TERRAIN_RESOURCE_HINTS = Object.freeze({
  coastal: { fish: 10, salt: 6 },
  coast: { fish: 10, salt: 6 },
  forest: { timber: 12, game: 5 },
  highland: { ore: 8, timber: 5 },
  hills: { ore: 8, stone: 5 },
  mountain: { ore: 12, stone: 8 },
  mountains: { ore: 12, stone: 8 },
  plain: { grain: 12, horses: 4 },
  plains: { grain: 12, horses: 4 },
  river: { grain: 8, fish: 7, clay: 4 },
  wetland: { fish: 6, clay: 5 },
  desert: { salt: 8, glass: 4 },
});

function clampInteger(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeProvince(rawProvince) {
  const province = requireObject(rawProvince, 'SeedEconomyFromStrategicMap province');
  const id = requireText(province.id, 'SeedEconomyFromStrategicMap province.id');
  const strategicValue = Number.isInteger(province.strategicValue) ? clampInteger(province.strategicValue, 1, 10) : 1;

  if (!Array.isArray(province.neighborIds)) {
    throw new TypeError('SeedEconomyFromStrategicMap province.neighborIds must be an array.');
  }

  return {
    ...province,
    id,
    name: requireText(province.name, 'SeedEconomyFromStrategicMap province.name'),
    ownerFactionId: requireText(province.ownerFactionId, 'SeedEconomyFromStrategicMap province.ownerFactionId'),
    controllingFactionId: requireText(province.controllingFactionId ?? province.ownerFactionId, 'SeedEconomyFromStrategicMap province.controllingFactionId'),
    supplyLevel: requireText(province.supplyLevel, 'SeedEconomyFromStrategicMap province.supplyLevel'),
    loyalty: Number.isInteger(province.loyalty) ? clampInteger(province.loyalty, 0, 100) : 50,
    strategicValue,
    neighborIds: [...new Set(province.neighborIds.map((neighborId) => requireText(neighborId, 'SeedEconomyFromStrategicMap province.neighborIds[]')))].sort(),
    contested: Boolean(province.contested),
  };
}

function normalizeResourceMap(value, label) {
  const resourceMap = requireObject(value, label);

  return Object.fromEntries(
    Object.entries(resourceMap)
      .map(([resourceId, quantity]) => {
        const normalizedResourceId = requireText(resourceId, `${label} resource id`);

        if (!Number.isInteger(quantity) || quantity < 0) {
          throw new RangeError(`${label} quantities must be integers greater than or equal to 0.`);
        }

        return [normalizedResourceId, quantity];
      })
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId)),
  );
}

function listTerrainKeys(province) {
  return [province.biome, province.terrainType, province.terrain, ...(Array.isArray(province.tags) ? province.tags : [])]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean);
}

function mergeResourceStock(target, source, multiplier = 1) {
  for (const [resourceId, quantity] of Object.entries(source)) {
    target[resourceId] = (target[resourceId] ?? 0) + Math.max(0, Math.round(quantity * multiplier));
  }
}

function buildStockForProvince(province, resourceHintsByProvinceId) {
  const stockByResource = {};
  const supply = SUPPLY_MODIFIERS[province.supplyLevel] ?? SUPPLY_MODIFIERS.stable;
  const baseMultiplier = 1 + (province.strategicValue - 1) * 0.12;

  mergeResourceStock(stockByResource, { grain: 4 + supply.stock }, baseMultiplier);

  for (const key of listTerrainKeys(province)) {
    if (TERRAIN_RESOURCE_HINTS[key]) {
      mergeResourceStock(stockByResource, TERRAIN_RESOURCE_HINTS[key], baseMultiplier);
    }
  }

  if (Array.isArray(province.resourceIds)) {
    mergeResourceStock(stockByResource, Object.fromEntries(province.resourceIds.map((resourceId) => [requireText(resourceId, 'SeedEconomyFromStrategicMap resourceIds[]'), 6])), baseMultiplier);
  }

  if (province.resourceDeposits !== undefined) {
    mergeResourceStock(stockByResource, normalizeResourceMap(province.resourceDeposits, 'SeedEconomyFromStrategicMap resourceDeposits'));
  }

  const hintedResources = resourceHintsByProvinceId[province.id];
  if (hintedResources !== undefined) {
    mergeResourceStock(stockByResource, normalizeResourceMap(hintedResources, 'SeedEconomyFromStrategicMap resourceHintsByProvinceId'));
  }

  return normalizeResourceMap(stockByResource, 'SeedEconomyFromStrategicMap stockByResource');
}

function buildCityId(province, cityIdByProvinceId) {
  return cityIdByProvinceId[province.id] ?? `city:${province.id}`;
}

function buildCityName(province, cityNameByProvinceId) {
  return cityNameByProvinceId[province.id] ?? `Cité de ${province.name}`;
}

function resolveCityPosition(province, cityPositionByProvinceId, provincePositionById) {
  return cityPositionByProvinceId[province.id]
    ?? province.cityPosition
    ?? province.center
    ?? provincePositionById[province.id]
    ?? null;
}

function deriveTransportMode(leftProvince, rightProvince) {
  const keys = new Set([...listTerrainKeys(leftProvince), ...listTerrainKeys(rightProvince)]);

  if (keys.has('river') || keys.has('wetland')) {
    return 'river';
  }

  if ((keys.has('coastal') || keys.has('coast')) && (leftProvince.ownerFactionId === rightProvince.ownerFactionId || leftProvince.controllingFactionId === rightProvince.controllingFactionId)) {
    return 'sea';
  }

  return 'land';
}

function deriveRouteCapacity(leftCity, rightCity) {
  const capacityByResource = {};
  const resourceIds = [...new Set([...Object.keys(leftCity.stockByResource), ...Object.keys(rightCity.stockByResource)])].sort();

  for (const resourceId of resourceIds) {
    const strongerStock = Math.max(leftCity.stockByResource[resourceId] ?? 0, rightCity.stockByResource[resourceId] ?? 0);
    const weakerStock = Math.min(leftCity.stockByResource[resourceId] ?? 0, rightCity.stockByResource[resourceId] ?? 0);
    const capacity = Math.floor((strongerStock - weakerStock) / 3);

    if (capacity > 0) {
      capacityByResource[resourceId] = clampInteger(capacity, 1, 18);
    }
  }

  if (Object.keys(capacityByResource).length === 0) {
    capacityByResource.grain = 1;
  }

  return capacityByResource;
}

function deriveRouteRisk(leftProvince, rightProvince) {
  const leftSupply = SUPPLY_MODIFIERS[leftProvince.supplyLevel] ?? SUPPLY_MODIFIERS.stable;
  const rightSupply = SUPPLY_MODIFIERS[rightProvince.supplyLevel] ?? SUPPLY_MODIFIERS.stable;
  const contestedRisk = leftProvince.contested || rightProvince.contested ? 18 : 0;
  const frontierRisk = leftProvince.controllingFactionId !== rightProvince.controllingFactionId ? 12 : 0;

  return clampInteger(18 + leftSupply.risk + rightSupply.risk + contestedRisk + frontierRisk, 0, 100);
}

function buildRoute(leftProvince, rightProvince, leftCity, rightCity) {
  const sortedCities = [leftCity, rightCity].sort((left, right) => left.id.localeCompare(right.id));
  const sortedProvinceIds = [leftProvince.id, rightProvince.id].sort();
  const routeId = `route:${sortedProvinceIds.join(':')}`;
  const strategicDelta = Math.abs(leftProvince.strategicValue - rightProvince.strategicValue);

  return new TradeRoute({
    id: routeId,
    name: `Route ${leftProvince.name} — ${rightProvince.name}`,
    stopCityIds: sortedCities.map((city) => city.id),
    distance: 4 + strategicDelta + Math.ceil((leftProvince.strategicValue + rightProvince.strategicValue) / 3),
    capacityByResource: deriveRouteCapacity(leftCity, rightCity),
    transportMode: deriveTransportMode(leftProvince, rightProvince),
    riskLevel: deriveRouteRisk(leftProvince, rightProvince),
    active: !leftProvince.contested && !rightProvince.contested,
  });
}

export function seedEconomyFromStrategicMap(generatedMap, options = {}) {
  const map = requireObject(generatedMap, 'SeedEconomyFromStrategicMap generatedMap');
  const normalizedOptions = requireObject(options, 'SeedEconomyFromStrategicMap options');

  if (!Array.isArray(map.provinces)) {
    throw new TypeError('SeedEconomyFromStrategicMap generatedMap.provinces must be an array.');
  }

  const resourceHintsByProvinceId = requireObject(normalizedOptions.resourceHintsByProvinceId ?? {}, 'SeedEconomyFromStrategicMap resourceHintsByProvinceId');
  const cityIdByProvinceId = requireObject(normalizedOptions.cityIdByProvinceId ?? {}, 'SeedEconomyFromStrategicMap cityIdByProvinceId');
  const cityNameByProvinceId = requireObject(normalizedOptions.cityNameByProvinceId ?? {}, 'SeedEconomyFromStrategicMap cityNameByProvinceId');
  const cityPositionByProvinceId = requireObject(normalizedOptions.cityPositionByProvinceId ?? {}, 'SeedEconomyFromStrategicMap cityPositionByProvinceId');
  const provincePositionById = requireObject(map.provincePositionById ?? {}, 'SeedEconomyFromStrategicMap provincePositionById');
  const provinces = map.provinces.map(normalizeProvince).sort((left, right) => left.id.localeCompare(right.id));
  const provinceById = new Map(provinces.map((province) => [province.id, province]));

  const cityByProvinceId = new Map();
  const cityPositionById = {};

  for (const province of provinces) {
    const supply = SUPPLY_MODIFIERS[province.supplyLevel] ?? SUPPLY_MODIFIERS.stable;
    const stockByResource = buildStockForProvince(province, resourceHintsByProvinceId);
    const cityId = buildCityId(province, cityIdByProvinceId);
    const capital = province.strategicValue >= 8 || Boolean(province.capital);
    const city = new City({
      id: cityId,
      name: buildCityName(province, cityNameByProvinceId),
      regionId: province.id,
      population: clampInteger(60 + province.strategicValue * 18 + Object.keys(stockByResource).length * 7 + (capital ? 35 : 0), 1, Number.MAX_SAFE_INTEGER),
      prosperity: clampInteger(50 + province.strategicValue * 3 + supply.prosperity, 0, 100),
      stability: clampInteger(province.loyalty * 0.55 + 26 + supply.stability - (province.contested ? 12 : 0), 0, 100),
      stockByResource,
      productionRuleIds: Object.keys(stockByResource).map((resourceId) => `produce:${resourceId}`),
      tags: [province.controllingFactionId, province.supplyLevel, capital ? 'capital' : 'regional-hub'],
      capital,
    });

    const position = resolveCityPosition(province, cityPositionByProvinceId, provincePositionById);
    cityByProvinceId.set(province.id, city);
    if (position !== null) {
      cityPositionById[city.id] = position;
    }
  }

  const routeById = new Map();
  for (const province of provinces) {
    for (const neighborId of province.neighborIds) {
      const neighbor = provinceById.get(neighborId);
      if (!neighbor || province.id.localeCompare(neighbor.id) > 0) {
        continue;
      }

      const route = buildRoute(province, neighbor, cityByProvinceId.get(province.id), cityByProvinceId.get(neighbor.id));
      routeById.set(route.id, route);
    }
  }

  const routes = [...routeById.values()].sort((left, right) => left.id.localeCompare(right.id));
  const routeIdsByCityId = new Map();
  for (const route of routes) {
    for (const cityId of route.stopCityIds) {
      routeIdsByCityId.set(cityId, [...(routeIdsByCityId.get(cityId) ?? []), route.id]);
    }
  }

  const cities = [...cityByProvinceId.values()]
    .map((city) => new City({
      ...city.toJSON(),
      tradeRouteIds: routeIdsByCityId.get(city.id) ?? [],
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    cities,
    routes,
    cityPositionById,
    metrics: {
      provinceCount: provinces.length,
      cityCount: cities.length,
      routeCount: routes.length,
      generatedRouteCapacity: routes.reduce((sum, route) => sum + route.totalCapacity, 0),
      stockedResourceIds: [...new Set(cities.flatMap((city) => Object.keys(city.stockByResource)))].sort(),
    },
  };
}
