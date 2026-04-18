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

function requireInteger(value, label, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
  }

  return value;
}

function normalizeCities(cities) {
  if (!Array.isArray(cities)) {
    throw new TypeError('PlanLogisticsFlows cities must be an array.');
  }

  return cities.map((city, index) => {
    const normalizedCity = requireObject(city, `PlanLogisticsFlows cities[${index}]`);
    const stockByResource = requireObject(
      normalizedCity.stockByResource ?? {},
      `PlanLogisticsFlows cities[${index}].stockByResource`,
    );

    return {
      ...normalizedCity,
      id: requireText(normalizedCity.id, `PlanLogisticsFlows cities[${index}].id`),
      stockByResource: Object.fromEntries(
        Object.entries(stockByResource).map(([resourceId, quantity]) => [
          requireText(resourceId, `PlanLogisticsFlows cities[${index}] stock resourceId`),
          requireInteger(
            quantity,
            `PlanLogisticsFlows cities[${index}] stock quantity for ${String(resourceId).trim()}`,
            0,
          ),
        ]),
      ),
    };
  });
}

function normalizeRoutes(routes) {
  if (!Array.isArray(routes)) {
    throw new TypeError('PlanLogisticsFlows routes must be an array.');
  }

  return routes.map((route, index) => {
    const normalizedRoute = requireObject(route, `PlanLogisticsFlows routes[${index}]`);
    const stopCityIds = normalizedRoute.stopCityIds;
    const capacityByResource = requireObject(
      normalizedRoute.capacityByResource ?? {},
      `PlanLogisticsFlows routes[${index}].capacityByResource`,
    );

    if (!Array.isArray(stopCityIds) || stopCityIds.length < 2) {
      throw new RangeError(`PlanLogisticsFlows routes[${index}].stopCityIds must contain at least two cities.`);
    }

    return {
      ...normalizedRoute,
      id: requireText(normalizedRoute.id, `PlanLogisticsFlows routes[${index}].id`),
      stopCityIds: stopCityIds.map((cityId, stopIndex) => requireText(cityId, `PlanLogisticsFlows routes[${index}].stopCityIds[${stopIndex}]`)),
      capacityByResource: Object.fromEntries(
        Object.entries(capacityByResource).map(([resourceId, quantity]) => [
          requireText(resourceId, `PlanLogisticsFlows routes[${index}] capacity resourceId`),
          requireInteger(
            quantity,
            `PlanLogisticsFlows routes[${index}] capacity for ${String(resourceId).trim()}`,
            0,
          ),
        ]),
      ),
      active: normalizedRoute.active !== false,
    };
  });
}

function normalizeShortageRequests(shortageRequests) {
  if (!Array.isArray(shortageRequests)) {
    throw new TypeError('PlanLogisticsFlows shortageRequests must be an array.');
  }

  return shortageRequests.map((request, index) => {
    const normalizedRequest = requireObject(request, `PlanLogisticsFlows shortageRequests[${index}]`);

    return {
      cityId: requireText(normalizedRequest.cityId, `PlanLogisticsFlows shortageRequests[${index}].cityId`),
      resourceId: requireText(normalizedRequest.resourceId, `PlanLogisticsFlows shortageRequests[${index}].resourceId`),
      requestedQuantity: requireInteger(
        normalizedRequest.requestedQuantity,
        `PlanLogisticsFlows shortageRequests[${index}].requestedQuantity`,
        1,
      ),
      priority: requireInteger(
        normalizedRequest.priority ?? 50,
        `PlanLogisticsFlows shortageRequests[${index}].priority`,
        0,
        100,
      ),
    };
  }).sort((left, right) => right.priority - left.priority || left.cityId.localeCompare(right.cityId));
}

function getAvailableExports(city, resourceId, reserveByResource) {
  const currentQuantity = city.stockByResource[resourceId] ?? 0;
  const reserveQuantity = reserveByResource[resourceId] ?? 0;
  return Math.max(0, currentQuantity - reserveQuantity);
}

export function planLogisticsFlows({ cities, routes, shortageRequests, reserveByResource = {} }) {
  const normalizedCities = normalizeCities(cities);
  const normalizedRoutes = normalizeRoutes(routes);
  const normalizedRequests = normalizeShortageRequests(shortageRequests);
  const normalizedReserveByResource = requireObject(reserveByResource, 'PlanLogisticsFlows reserveByResource');

  const citiesById = new Map(
    normalizedCities.map((city) => [city.id, { ...city, stockByResource: { ...city.stockByResource } }]),
  );
  const transfers = [];
  const unresolvedRequests = [];

  for (const request of normalizedRequests) {
    const destinationCity = citiesById.get(request.cityId);

    if (!destinationCity) {
      unresolvedRequests.push({ ...request, reason: 'unknown-city' });
      continue;
    }

    let remainingQuantity = request.requestedQuantity;
    const candidateRoutes = normalizedRoutes.filter((route) => route.active && route.stopCityIds.includes(request.cityId));

    for (const route of candidateRoutes) {
      if (remainingQuantity === 0) {
        break;
      }

      const routeCapacity = route.capacityByResource[request.resourceId] ?? 0;

      if (routeCapacity === 0) {
        continue;
      }

      for (const sourceCityId of route.stopCityIds) {
        if (sourceCityId === request.cityId || remainingQuantity === 0) {
          continue;
        }

        const sourceCity = citiesById.get(sourceCityId);

        if (!sourceCity) {
          continue;
        }

        const availableExports = getAvailableExports(
          sourceCity,
          request.resourceId,
          normalizedReserveByResource,
        );
        const transferableQuantity = Math.min(availableExports, remainingQuantity, routeCapacity);

        if (transferableQuantity === 0) {
          continue;
        }

        sourceCity.stockByResource[request.resourceId] = (sourceCity.stockByResource[request.resourceId] ?? 0) - transferableQuantity;
        destinationCity.stockByResource[request.resourceId] = (destinationCity.stockByResource[request.resourceId] ?? 0) + transferableQuantity;
        remainingQuantity -= transferableQuantity;

        transfers.push({
          routeId: route.id,
          sourceCityId,
          destinationCityId: request.cityId,
          resourceId: request.resourceId,
          quantity: transferableQuantity,
        });
      }
    }

    if (remainingQuantity > 0) {
      unresolvedRequests.push({
        ...request,
        unresolvedQuantity: remainingQuantity,
        reason: 'insufficient-capacity-or-stock',
      });
    }
  }

  return {
    cities: Array.from(citiesById.values()),
    transfers,
    unresolvedRequests,
    fulfilledRequestCount: normalizedRequests.length - unresolvedRequests.length,
  };
}
