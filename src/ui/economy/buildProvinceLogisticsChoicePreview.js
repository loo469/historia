function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

const TONE_RANK = Object.freeze({ high: 3, medium: 2, low: 1 });

function getRouteTone(route, localTension) {
  if (!route.active || route.riskLevel >= 70 || localTension === 'high') {
    return 'high';
  }

  if (route.riskLevel >= 55 || route.totalCapacity >= 9 || localTension === 'medium') {
    return 'medium';
  }

  return 'low';
}

function getMainResource(route, resourceLabelById) {
  const resource = (route.resources ?? [])
    .slice()
    .sort((left, right) => right.capacity - left.capacity || left.resourceId.localeCompare(right.resourceId))[0] ?? null;

  if (!resource) {
    return { resourceId: 'reserve', label: 'capacité réservée', capacity: 0 };
  }

  return {
    ...resource,
    label: resourceLabelById[resource.resourceId] ?? resource.resourceId,
  };
}

function buildChoiceForRoute(route, localCity, localTension, resourceLabelById) {
  const mainResource = getMainResource(route, resourceLabelById);
  const tone = getRouteTone(route, localTension);
  const overloaded = route.totalCapacity >= 9;
  const risky = route.riskLevel >= 55;
  const inactive = !route.active;
  const action = inactive
    ? 'Réparer route'
    : risky
      ? 'Sécuriser convoi'
      : overloaded
        ? 'Détourner flux'
        : localTension !== 'low'
          ? 'Stocker localement'
          : 'Maintenir veille';
  const cost = inactive
    ? '2 équipes · 1 stock outil'
    : risky
      ? '1 escorte · 1 ordre'
      : overloaded
        ? '1 relais · coordination routes'
        : '1 dépôt local';
  const delay = inactive ? '2 tours' : overloaded ? '1-2 tours' : '1 tour';
  const residualRisk = Math.max(5, route.riskLevel - (inactive ? 18 : risky ? 14 : overloaded ? 9 : 5));
  const impact = tone === 'high'
    ? `Réduit la tension ${localTension} et protège ${mainResource.label}.`
    : tone === 'medium'
      ? `Soulage ${mainResource.label} sans masquer le risque résiduel.`
      : `Maintient ${localCity.cityName} stable avec surveillance légère.`;

  return {
    routeId: route.routeId,
    action,
    tone,
    cost,
    delay,
    routes: [route.routeName],
    resources: [mainResource.label],
    affectedCity: localCity.cityName,
    residualRisk,
    impact,
    score: (TONE_RANK[tone] ?? 0) * 100 + route.riskLevel + route.totalCapacity + (localTension === 'high' ? 20 : localTension === 'medium' ? 10 : 0),
  };
}

export function buildProvinceLogisticsChoicePreview(province, economyView, options = {}) {
  const normalizedOptions = requireObject(options, 'ProvinceLogisticsChoicePreview options');
  const resourceLabelById = requireObject(normalizedOptions.resourceLabelById ?? {}, 'ProvinceLogisticsChoicePreview resourceLabelById');

  if (!province || !economyView) {
    return { recommendedOptionId: null, summary: 'Aucune donnée logistique disponible.', options: [] };
  }

  const cities = economyView.overlay?.cities ?? [];
  const routes = economyView.overlay?.routes ?? [];
  const tensionByCityId = Object.fromEntries((economyView.comparison?.rows ?? []).map((row) => [row.cityId, row.tensionLevel ?? 'low']));
  const provinceCities = cities.filter((city) => city.regionId === province.provinceId);
  const provinceCityIds = new Set(provinceCities.map((city) => city.cityId));

  const routeChoices = routes
    .filter((route) => route.cityIds.some((cityId) => provinceCityIds.has(cityId)))
    .map((route) => {
      const localCityId = route.cityIds.find((cityId) => provinceCityIds.has(cityId));
      const localCity = provinceCities.find((city) => city.cityId === localCityId) ?? provinceCities[0];
      const localTension = tensionByCityId[localCity?.cityId] ?? 'low';
      return localCity ? buildChoiceForRoute(route, localCity, localTension, resourceLabelById) : null;
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.action.localeCompare(right.action))
    .slice(0, 4)
    .map((choice, index) => ({
      ...choice,
      optionId: `${province.provinceId}:${choice.routeId}:${index}`,
      recommended: index === 0,
    }));

  if (routeChoices.length === 0) {
    return {
      recommendedOptionId: null,
      summary: 'Aucun reroutage utile: aucune route liée à la province sélectionnée.',
      options: [],
    };
  }

  const recommended = routeChoices[0];
  return {
    recommendedOptionId: recommended.optionId,
    summary: `${recommended.action} recommandé sur ${recommended.routes[0]}: ${recommended.impact}`,
    options: routeChoices,
  };
}
