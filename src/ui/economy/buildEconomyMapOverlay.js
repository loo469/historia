import { City } from '../../domain/economy/City.js';
import { TradeRoute } from '../../domain/economy/TradeRoute.js';

const DEFAULT_CITY_MARKER = Object.freeze({
  icon: 'city',
  tone: 'neutral',
  size: 1,
});

const DEFAULT_ROUTE_STYLE_BY_MODE = Object.freeze({
  land: { stroke: 'ochre', width: 2, pattern: 'solid', opacity: 0.85 },
  river: { stroke: 'blue', width: 2, pattern: 'wave', opacity: 0.85 },
  sea: { stroke: 'navy', width: 3, pattern: 'solid', opacity: 0.85 },
  default: { stroke: 'slate', width: 2, pattern: 'solid', opacity: 0.85 },
  inactive: { stroke: 'slate', width: 1, pattern: 'dashed', opacity: 0.45 },
});

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

function normalizeCity(city) {
  if (city instanceof City) {
    return city;
  }

  if (city === null || typeof city !== 'object' || Array.isArray(city)) {
    throw new TypeError('EconomyMapOverlay cities must be City instances or plain objects.');
  }

  return new City(city);
}

function normalizeRoute(route) {
  if (route instanceof TradeRoute) {
    return route;
  }

  if (route === null || typeof route !== 'object' || Array.isArray(route)) {
    throw new TypeError('EconomyMapOverlay routes must be TradeRoute instances or plain objects.');
  }

  return new TradeRoute(route);
}

function buildResourceSummary(stockByResource) {
  const entries = Object.entries(stockByResource)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([resourceId, quantity]) => ({ resourceId, quantity }));

  const totalStock = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const primaryResourceId = entries[0]?.resourceId ?? null;
  const primaryResourceQuantity = entries[0]?.quantity ?? 0;

  return {
    entries,
    totalStock,
    resourceCount: entries.length,
    primaryResourceId,
    primaryResourceQuantity,
  };
}

function normalizeMarker(marker) {
  return {
    icon: String(marker.icon ?? DEFAULT_CITY_MARKER.icon).trim() || DEFAULT_CITY_MARKER.icon,
    tone: String(marker.tone ?? DEFAULT_CITY_MARKER.tone).trim() || DEFAULT_CITY_MARKER.tone,
    size: Number.isFinite(marker.size) && marker.size > 0 ? marker.size : DEFAULT_CITY_MARKER.size,
  };
}

function buildCityMarker(city, cityPositionById) {
  const position = cityPositionById[city.id] ?? null;
  const tone = city.prosperity >= 70 ? 'positive' : city.stability < 40 ? 'warning' : 'neutral';
  const size = city.capital ? 2 : 1;

  return {
    ...normalizeMarker({ tone, size }),
    position,
  };
}

function normalizeCapacitySpendPlan(plan, routeId) {
  if (plan === undefined || plan === null) {
    return {
      routeId,
      capacityMobilized: 0,
      mobilizedByResource: {},
      limitingResourceId: null,
    };
  }

  const normalizedPlan = requireObject(plan, `EconomyMapOverlay capacity spend preview ${routeId}`);
  const mobilizedByResource = Object.fromEntries(
    Object.entries(requireObject(normalizedPlan.mobilizedByResource ?? {}, `EconomyMapOverlay mobilizedByResource ${routeId}`))
      .map(([resourceId, capacity]) => {
        const normalizedResourceId = String(resourceId).trim();

        if (!normalizedResourceId) {
          throw new RangeError('EconomyMapOverlay mobilizedByResource cannot contain an empty resource id.');
        }

        if (!Number.isInteger(capacity) || capacity < 0) {
          throw new RangeError('EconomyMapOverlay mobilized capacity must be an integer greater than or equal to 0.');
        }

        return [normalizedResourceId, capacity];
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );
  const mobilizedTotal = Object.values(mobilizedByResource).reduce((sum, capacity) => sum + capacity, 0);
  const fallbackMobilized = normalizedPlan.capacityMobilized ?? mobilizedTotal;

  if (!Number.isInteger(fallbackMobilized) || fallbackMobilized < 0) {
    throw new RangeError('EconomyMapOverlay capacityMobilized must be an integer greater than or equal to 0.');
  }

  return {
    routeId,
    capacityMobilized: mobilizedTotal > 0 ? mobilizedTotal : fallbackMobilized,
    mobilizedByResource,
    limitingResourceId: normalizedPlan.limitingResourceId === undefined || normalizedPlan.limitingResourceId === null
      ? null
      : String(normalizedPlan.limitingResourceId).trim() || null,
  };
}

function buildPreparationOptions(nextResource, resourceRows, routeRiskLevel) {
  if (nextResource === null || nextResource.capacityRemaining > 1) {
    return [];
  }

  const bottleneckResourceId = nextResource.resourceId;
  const missingMargin = nextResource.capacityRemaining === 0 ? 2 : 1;
  const spareResource = resourceRows
    .filter((row) => row.resourceId !== bottleneckResourceId && row.capacityRemaining > missingMargin)
    .sort((left, right) => right.capacityRemaining - left.capacityRemaining || left.resourceId.localeCompare(right.resourceId))[0] ?? null;
  const options = [
    {
      id: `${bottleneckResourceId}:reserve-buffer`,
      action: nextResource.capacityRemaining === 0 ? 'free-route-capacity' : 'reserve-capacity-buffer',
      label: nextResource.capacityRemaining === 0
        ? `Libérer 1 capacité ${bottleneckResourceId}`
        : `Réserver 1 capacité tampon ${bottleneckResourceId}`,
      effort: {
        type: 'capacity',
        amount: 1,
        unit: bottleneckResourceId,
      },
      expectedEffect: {
        marginGain: 1,
        description: nextResource.capacityRemaining === 0
          ? 'Rouvre une marge minimale sur le goulot principal.'
          : 'Transforme la marge critique en tampon exploitable.',
      },
      riskIfIgnored: nextResource.capacityRemaining === 0
        ? 'Blocage probable dès la prochaine dépense sur ce corridor.'
        : 'La prochaine dépense peut épuiser la marge restante.',
      safety: 'safe',
    },
  ];

  if (spareResource !== null) {
    const marginGain = Math.min(2, spareResource.capacityRemaining - 1);

    options.push({
      id: `${bottleneckResourceId}:shift-to-${spareResource.resourceId}`,
      action: 'shift-load-to-spare-resource',
      label: `Reporter une partie du flux vers ${spareResource.resourceId}`,
      effort: {
        type: 'coordination',
        amount: 2,
        unit: 'turns',
      },
      expectedEffect: {
        marginGain,
        description: `Préserve ${bottleneckResourceId} en utilisant la marge ${spareResource.resourceId}.`,
      },
      riskIfIgnored: `La ressource ${bottleneckResourceId} reste le point de rupture malgré la marge ${spareResource.resourceId}.`,
      safety: 'safe',
    });
  }

  if (routeRiskLevel >= 35 || nextResource.capacityRemaining === 0) {
    options.push({
      id: `${bottleneckResourceId}:priority-window`,
      action: 'open-priority-window',
      label: `Ouvrir une fenêtre prioritaire ${bottleneckResourceId}`,
      effort: {
        type: 'operations',
        amount: 3,
        unit: 'orders',
      },
      expectedEffect: {
        marginGain: 2,
        description: 'Gagne une marge temporaire mais expose le corridor à un report de risque.',
      },
      riskIfIgnored: 'Le risque de corridor peut transformer le goulot en rupture opérationnelle.',
      safety: routeRiskLevel >= 50 ? 'risky' : 'conditional',
    });
  }

  return options
    .sort((left, right) => {
      const safetyRank = { safe: 0, conditional: 1, risky: 2 };

      return left.effort.amount - right.effort.amount
        || safetyRank[left.safety] - safetyRank[right.safety]
        || right.expectedEffect.marginGain - left.expectedEffect.marginGain
        || left.id.localeCompare(right.id);
    })
    .slice(0, 3);
}

function scorePreparationOption(option, routeValue, routeRiskLevel) {
  const safetyWeight = { safe: 2, conditional: 1, risky: 0 };
  const riskAvoided = option.safety === 'risky'
    ? Math.ceil(routeRiskLevel / 25)
    : option.safety === 'conditional'
      ? Math.ceil(routeRiskLevel / 35)
      : 1;

  return (option.expectedEffect.marginGain * routeValue)
    + riskAvoided
    + (safetyWeight[option.safety] ?? 0)
    - option.effort.amount;
}

function buildBestValuePreparation(preparationOptions, routeValue, routeRiskLevel) {
  if (preparationOptions.length < 2) {
    return null;
  }

  const scoredOptions = preparationOptions
    .map((option) => ({
      option,
      score: scorePreparationOption(option, routeValue, routeRiskLevel),
      estimatedValueProtected: option.expectedEffect.marginGain * routeValue,
    }))
    .sort((left, right) => right.score - left.score
      || right.estimatedValueProtected - left.estimatedValueProtected
      || left.option.effort.amount - right.option.effort.amount
      || left.option.id.localeCompare(right.option.id));
  const best = scoredOptions[0];
  const cheapest = preparationOptions
    .slice()
    .sort((left, right) => left.effort.amount - right.effort.amount || left.id.localeCompare(right.id))[0];
  const cheaperAcceptable = cheapest.id === best.option.id
    ? null
    : {
      optionId: cheapest.id,
      condition: cheapest.expectedEffect.marginGain >= best.option.expectedEffect.marginGain
        ? 'acceptable si le risque corridor reste stable'
        : 'acceptable seulement si le coût immédiat prime sur la valeur protégée',
    };

  return {
    id: `best-value:${best.option.id}`,
    optionId: best.option.id,
    action: best.option.action,
    estimatedValueProtected: best.estimatedValueProtected,
    marginGain: best.option.expectedEffect.marginGain,
    effort: { ...best.option.effort },
    reason: `Protège ${best.estimatedValueProtected} valeur corridor avec +${best.option.expectedEffect.marginGain} marge pour ${best.option.effort.amount} ${best.option.effort.unit}.`,
    cheaperAcceptable,
  };
}

function buildNextBottleneck(resourceRows, capacityMobilized, limitingResourceId, routeRiskLevel, routeValue) {
  if (capacityMobilized === 0) {
    return null;
  }

  const spentResources = resourceRows
    .filter((row) => row.capacityMobilized > 0)
    .sort((left, right) => left.capacityRemaining - right.capacityRemaining || left.resourceId.localeCompare(right.resourceId));
  const nextResource = spentResources[0] ?? null;

  if (nextResource === null || nextResource.capacityRemaining > 1) {
    return null;
  }

  const preparationOptions = buildPreparationOptions(nextResource, resourceRows, routeRiskLevel);

  return {
    type: nextResource.capacityRemaining === 0 ? 'capacity-exhausted' : 'low-margin',
    resourceId: limitingResourceId ?? nextResource.resourceId,
    marginRemaining: nextResource.capacityRemaining,
    preparationAction: nextResource.capacityRemaining === 0 ? 'free-route-capacity' : 'reserve-capacity-buffer',
    preparationOptions,
    bestValuePreparation: buildBestValuePreparation(preparationOptions, routeValue, routeRiskLevel),
  };
}

function buildCapacitySpendPreview(route, spendPlan) {
  const currentCapacity = route.totalCapacity;
  const capacityMobilized = Math.min(spendPlan.capacityMobilized, currentCapacity);
  const capacityRemaining = Math.max(0, currentCapacity - capacityMobilized);
  const resourceRows = Object.entries(route.capacityByResource)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([resourceId, capacity]) => {
      const mobilized = Math.min(spendPlan.mobilizedByResource[resourceId] ?? 0, capacity);

      return {
        resourceId,
        currentCapacity: capacity,
        capacityMobilized: mobilized,
        capacityRemaining: capacity - mobilized,
      };
    });
  const computedLimitingResourceId = spendPlan.limitingResourceId
    ?? resourceRows
      .filter((row) => row.capacityMobilized > 0)
      .sort((left, right) => left.capacityRemaining - right.capacityRemaining || left.resourceId.localeCompare(right.resourceId))[0]?.resourceId
    ?? null;

  const nextBottleneck = buildNextBottleneck(
    resourceRows,
    capacityMobilized,
    computedLimitingResourceId,
    route.riskLevel,
    currentCapacity,
  );

  return {
    routeId: route.id,
    currentCapacity,
    capacityMobilized,
    capacityRemaining,
    limitingResourceId: computedLimitingResourceId,
    nextBottleneck,
    preparationOptions: nextBottleneck?.preparationOptions ?? [],
    bestValuePreparation: nextBottleneck?.bestValuePreparation ?? null,
    state: capacityMobilized === 0
      ? 'no-spend'
      : capacityRemaining === 0
        ? 'fully-spent'
        : 'remaining-margin',
    resources: resourceRows,
  };
}

function normalizeRouteStyle(route, styleByTransportMode) {
  const style = route.active
    ? (styleByTransportMode[route.transportMode] ?? styleByTransportMode.default ?? DEFAULT_ROUTE_STYLE_BY_MODE.default)
    : (styleByTransportMode.inactive ?? DEFAULT_ROUTE_STYLE_BY_MODE.inactive);

  return {
    stroke: String(style.stroke ?? DEFAULT_ROUTE_STYLE_BY_MODE.default.stroke).trim() || DEFAULT_ROUTE_STYLE_BY_MODE.default.stroke,
    width: Number.isInteger(style.width) && style.width > 0 ? style.width : DEFAULT_ROUTE_STYLE_BY_MODE.default.width,
    pattern: String(style.pattern ?? DEFAULT_ROUTE_STYLE_BY_MODE.default.pattern).trim() || DEFAULT_ROUTE_STYLE_BY_MODE.default.pattern,
    opacity: Number.isFinite(style.opacity) ? Math.max(0, Math.min(1, style.opacity)) : DEFAULT_ROUTE_STYLE_BY_MODE.default.opacity,
  };
}

export function buildEconomyMapOverlay(cities, routes, options = {}) {
  const normalizedCities = requireArray(cities, 'EconomyMapOverlay cities').map(normalizeCity);
  const normalizedRoutes = requireArray(routes, 'EconomyMapOverlay routes').map(normalizeRoute);
  const normalizedOptions = requireObject(options, 'EconomyMapOverlay options');
  const cityPositionById = requireObject(normalizedOptions.cityPositionById ?? {}, 'EconomyMapOverlay cityPositionById');
  const styleByTransportMode = {
    ...DEFAULT_ROUTE_STYLE_BY_MODE,
    ...requireObject(normalizedOptions.styleByTransportMode ?? {}, 'EconomyMapOverlay styleByTransportMode'),
  };
  const recommendedUnlockByRouteId = requireObject(
    normalizedOptions.recommendedUnlockByRouteId ?? {},
    'EconomyMapOverlay recommendedUnlockByRouteId',
  );

  const cityOverlays = normalizedCities
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((city) => {
      const resources = buildResourceSummary(city.stockByResource);

      return {
        overlayId: `city:${city.id}`,
        type: 'city',
        cityId: city.id,
        cityName: city.name,
        regionId: city.regionId,
        population: city.population,
        prosperity: city.prosperity,
        stability: city.stability,
        capital: city.capital,
        label: city.capital ? `${city.name} ★` : city.name,
        resources,
        tradeRouteIds: [...city.tradeRouteIds],
        marker: buildCityMarker(city, cityPositionById),
      };
    });

  const routeOverlays = normalizedRoutes
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((route) => {
      const capacitySpendPlan = normalizeCapacitySpendPlan(recommendedUnlockByRouteId[route.id], route.id);

      return {
        overlayId: `route:${route.id}`,
        type: 'route',
        routeId: route.id,
        routeName: route.name,
        cityIds: [...route.stopCityIds],
        originCityId: route.originCityId,
        destinationCityId: route.destinationCityId,
        active: route.active,
        transportMode: route.transportMode,
        riskLevel: route.riskLevel,
        totalCapacity: route.totalCapacity,
        resources: Object.entries(route.capacityByResource)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([resourceId, capacity]) => ({ resourceId, capacity })),
        capacitySpendPreview: buildCapacitySpendPreview(route, capacitySpendPlan),
        label: `${route.name} (${route.transportMode})`,
        style: normalizeRouteStyle(route, styleByTransportMode),
      };
    });

  return {
    title: 'Carte économie et logistique',
    summary: `${cityOverlays.length} villes, ${routeOverlays.length} routes logistiques`,
    cities: cityOverlays,
    routes: routeOverlays,
    metrics: {
      cityCount: cityOverlays.length,
      capitalCount: cityOverlays.filter((city) => city.capital).length,
      routeCount: routeOverlays.length,
      activeRouteCount: routeOverlays.filter((route) => route.active).length,
      totalStock: cityOverlays.reduce((sum, city) => sum + city.resources.totalStock, 0),
      totalRouteCapacity: routeOverlays.reduce((sum, route) => sum + route.totalCapacity, 0),
    },
  };
}
