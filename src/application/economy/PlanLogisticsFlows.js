function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
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

function requireNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be an integer greater than or equal to 0.`);
  }

  return value;
}

function normalizeResourceMap(resources, label) {
  requireObject(resources, label);

  return Object.fromEntries(
    Object.entries(resources)
      .map(([resourceId, quantity]) => [
        requireText(resourceId, `${label} resourceId`),
        requireNonNegativeInteger(quantity, `${label} quantity`),
      ])
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function normalizeCities(cities) {
  return requireArray(cities, 'PlanLogisticsFlows cities').map((city) => {
    const normalizedCity = requireObject(city, 'PlanLogisticsFlows city');

    return {
      id: requireText(normalizedCity.id, 'PlanLogisticsFlows city id'),
      stockByResource: normalizeResourceMap(
        normalizedCity.stockByResource ?? {},
        'PlanLogisticsFlows city stockByResource',
      ),
      desiredStockByResource: normalizeResourceMap(
        normalizedCity.desiredStockByResource ?? {},
        'PlanLogisticsFlows city desiredStockByResource',
      ),
    };
  });
}

function normalizeRoutes(routes) {
  return requireArray(routes, 'PlanLogisticsFlows tradeRoutes').map((route) => {
    const normalizedRoute = requireObject(route, 'PlanLogisticsFlows tradeRoute');

    return {
      id: requireText(normalizedRoute.id, 'PlanLogisticsFlows tradeRoute id'),
      stopCityIds: requireArray(normalizedRoute.stopCityIds, 'PlanLogisticsFlows tradeRoute stopCityIds').map(
        (cityId) => requireText(cityId, 'PlanLogisticsFlows tradeRoute stopCityId'),
      ),
      capacityByResource: normalizeResourceMap(
        normalizedRoute.capacityByResource ?? {},
        'PlanLogisticsFlows tradeRoute capacityByResource',
      ),
      active: normalizedRoute.active !== false,
      riskLevel: requireNonNegativeInteger(normalizedRoute.riskLevel ?? 0, 'PlanLogisticsFlows tradeRoute riskLevel'),
    };
  });
}

function buildSurplusByResource(city) {
  const resourceIds = new Set([
    ...Object.keys(city.stockByResource),
    ...Object.keys(city.desiredStockByResource),
  ]);

  return Object.fromEntries(
    [...resourceIds]
      .map((resourceId) => {
        const stock = city.stockByResource[resourceId] ?? 0;
        const desired = city.desiredStockByResource[resourceId] ?? 0;
        return [resourceId, Math.max(stock - desired, 0)];
      })
      .filter(([, quantity]) => quantity > 0)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function buildDemandByResource(city) {
  const resourceIds = new Set([
    ...Object.keys(city.stockByResource),
    ...Object.keys(city.desiredStockByResource),
  ]);

  return Object.fromEntries(
    [...resourceIds]
      .map((resourceId) => {
        const stock = city.stockByResource[resourceId] ?? 0;
        const desired = city.desiredStockByResource[resourceId] ?? 0;
        return [resourceId, Math.max(desired - stock, 0)];
      })
      .filter(([, quantity]) => quantity > 0)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function planLogisticsFlows({ cities, tradeRoutes }) {
  const normalizedCities = normalizeCities(cities);
  const normalizedRoutes = normalizeRoutes(tradeRoutes);
  const citiesById = new Map(normalizedCities.map((city) => [city.id, city]));
  const remainingDemandByCityId = new Map(
    normalizedCities.map((city) => [city.id, buildDemandByResource(city)]),
  );
  const remainingSurplusByCityId = new Map(
    normalizedCities.map((city) => [city.id, buildSurplusByResource(city)]),
  );
  const plannedFlows = [];

  for (const route of normalizedRoutes) {
    if (!route.active || route.stopCityIds.length < 2) {
      continue;
    }

    const [sourceCityId, ...otherStops] = route.stopCityIds;

    if (!citiesById.has(sourceCityId)) {
      throw new RangeError(`PlanLogisticsFlows tradeRoute source city ${sourceCityId} is unknown.`);
    }

    for (const destinationCityId of otherStops) {
      if (!citiesById.has(destinationCityId)) {
        throw new RangeError(`PlanLogisticsFlows tradeRoute destination city ${destinationCityId} is unknown.`);
      }

      for (const [resourceId, routeCapacity] of Object.entries(route.capacityByResource)) {
        const remainingSurplus = remainingSurplusByCityId.get(sourceCityId)?.[resourceId] ?? 0;
        const remainingDemand = remainingDemandByCityId.get(destinationCityId)?.[resourceId] ?? 0;
        const transferableQuantity = Math.min(remainingSurplus, remainingDemand, routeCapacity);

        if (transferableQuantity <= 0) {
          continue;
        }

        remainingSurplusByCityId.get(sourceCityId)[resourceId] = remainingSurplus - transferableQuantity;
        remainingDemandByCityId.get(destinationCityId)[resourceId] = remainingDemand - transferableQuantity;

        plannedFlows.push({
          tradeRouteId: route.id,
          sourceCityId,
          destinationCityId,
          resourceId,
          quantity: transferableQuantity,
          riskLevel: route.riskLevel,
        });
      }
    }
  }

  return {
    plannedFlows,
    unmetDemandByCityId: Object.fromEntries(
      [...remainingDemandByCityId.entries()].map(([cityId, demandByResource]) => [
        cityId,
        Object.fromEntries(
          Object.entries(demandByResource)
            .filter(([, quantity]) => quantity > 0)
            .sort(([left], [right]) => left.localeCompare(right)),
        ),
      ]),
    ),
    remainingSurplusByCityId: Object.fromEntries(
      [...remainingSurplusByCityId.entries()].map(([cityId, surplusByResource]) => [
        cityId,
        Object.fromEntries(
          Object.entries(surplusByResource)
            .filter(([, quantity]) => quantity > 0)
            .sort(([left], [right]) => left.localeCompare(right)),
        ),
      ]),
    ),
  };
}
