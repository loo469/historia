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

function getRouteCause(route, localCity, localTension, mainResource) {
  if (!route.active) {
    return {
      label: 'route inactive',
      detail: `${route.routeName}: route interrompue vers ${localCity.cityName}, ${mainResource.label} doit attendre une réparation.`,
    };
  }

  if (route.riskLevel >= 70) {
    return {
      label: 'risque élevé',
      detail: `${route.routeName}: risque ${route.riskLevel} autour de ${localCity.cityName}, escorte requise pour sécuriser ${mainResource.label}.`,
    };
  }

  if (localTension === 'high') {
    return {
      label: 'stock critique',
      detail: `${localCity.cityName}: stock critique, ${route.routeName} doit prioriser ${mainResource.label}.`,
    };
  }

  if (route.totalCapacity >= 9) {
    return {
      label: 'capacité insuffisante',
      detail: `${route.routeName}: capacité ${route.totalCapacity} saturée, relais nécessaire avant surcharge de ${localCity.cityName}.`,
    };
  }

  if (route.riskLevel >= 55) {
    return {
      label: 'risque élevé',
      detail: `${route.routeName}: risque ${route.riskLevel} sur ${mainResource.label}, convoi à sécuriser.`,
    };
  }

  if (localTension === 'medium') {
    return {
      label: 'stock sous tension',
      detail: `${localCity.cityName}: stock sous tension, ${route.routeName} reste à surveiller.`,
    };
  }

  return {
    label: 'logistique stable',
    detail: `${route.routeName}: logistique stable vers ${localCity.cityName}, ${mainResource.label} couvert.`,
  };
}


function getNeighborContexts(route, localCity, cities, routes, tensionByCityId) {
  const cityById = new Map(cities.map((city) => [city.cityId, city]));
  const directNeighbors = route.cityIds
    .filter((cityId) => cityId !== localCity.cityId)
    .map((cityId) => ({ city: cityById.get(cityId), route }))
    .filter((context) => context.city);
  const hubNeighbors = routes
    .filter((candidate) => candidate.routeId !== route.routeId && candidate.cityIds.includes(localCity.cityId))
    .map((candidate) => {
      const neighborCityId = candidate.cityIds.find((cityId) => cityId !== localCity.cityId);
      return { city: cityById.get(neighborCityId), route: candidate };
    })
    .filter((context) => context.city);

  return [...directNeighbors, ...hubNeighbors]
    .map((context) => ({
      ...context,
      tension: tensionByCityId[context.city.cityId] ?? 'low',
      score: (context.route.riskLevel ?? 0) + (context.route.totalCapacity ?? 0) + (tensionByCityId[context.city.cityId] === 'high' ? 20 : tensionByCityId[context.city.cityId] === 'medium' ? 10 : 0),
    }))
    .sort((left, right) => right.score - left.score || left.city.cityName.localeCompare(right.city.cityName))
    .slice(0, 2);
}

function getNeighborEffect(choiceId, route, localCity, neighbor, mainResource) {
  const routeName = neighbor.route.routeName;
  const cityName = neighbor.city.cityName;

  if (choiceId === 'reroute') {
    const displaced = route.totalCapacity >= 9 || neighbor.route.totalCapacity >= 9;
    return {
      target: cityName,
      route: routeName,
      tone: displaced ? 'medium' : 'low',
      label: displaced ? 'congestion déplacée' : 'hub soulagé',
      detail: displaced
        ? `${cityName} peut récupérer une partie du trafic de ${localCity.cityName}; surveiller ${routeName}.`
        : `${routeName} partage mieux ${mainResource.label} et soulage le hub proche.`,
    };
  }

  if (choiceId === 'repair') {
    const fragile = !neighbor.route.active || neighbor.route.riskLevel >= 55;
    return {
      target: cityName,
      route: routeName,
      tone: fragile ? 'medium' : 'low',
      label: fragile ? 'route toujours fragile' : 'axe stabilisé',
      detail: fragile
        ? `${routeName} reste fragile près de ${cityName}; la réparation aide surtout ${localCity.cityName}.`
        : `${routeName} profite de l'axe réparé sans nouvelle surcharge visible.`,
    };
  }

  if (choiceId === 'stockpile') {
    const strained = neighbor.tension !== 'low';
    return {
      target: cityName,
      route: routeName,
      tone: strained ? 'medium' : 'low',
      label: 'stockpile consommé',
      detail: strained
        ? `${cityName} reste sous tension: le tampon protège ${localCity.cityName} mais ne diffuse pas assez.`
        : `${cityName} garde son flux; le stockpile absorbe surtout le choc local.`,
    };
  }

  const improvesNetwork = route.riskLevel >= 55 || route.totalCapacity >= 9 || neighbor.tension !== 'low';
  return {
    target: cityName,
    route: routeName,
    tone: improvesNetwork ? 'medium' : 'low',
    label: improvesNetwork ? 'hub priorisé' : 'effet réseau limité',
    detail: improvesNetwork
      ? `${cityName} bénéficie de la priorité sur ${mainResource.label}, mais ${routeName} reste à suivre.`
      : `${cityName} reçoit peu d'effet: correction surtout administrative pour ${localCity.cityName}.`,
  };
}

function buildRecoveryChoices(route, localCity, localTension, mainResource, routeCause, neighborContexts = []) {
  const choices = [
    {
      choiceId: 'reroute',
      label: 'Reroute',
      tone: route.totalCapacity >= 9 || route.riskLevel >= 55 ? 'high' : 'medium',
      benefit: route.totalCapacity >= 9
        ? `Désature ${route.routeName} en répartissant ${mainResource.label} vers un relais voisin.`
        : `Contourne le risque ${route.riskLevel} et garde ${localCity.cityName} alimentée.`,
      blocker: route.totalCapacity >= 9 ? 'relais disponible' : 'route alternative sûre',
      rationale: `Répond à la cause: ${routeCause.label}.`,
      score: (route.totalCapacity >= 9 ? 34 : 22) + (route.riskLevel >= 55 ? 12 : 0),
    },
    {
      choiceId: 'repair',
      label: 'Repair',
      tone: !route.active ? 'high' : route.riskLevel >= 70 ? 'medium' : 'low',
      benefit: !route.active
        ? `Rouvre ${route.routeName} et restaure le flux de ${mainResource.label}.`
        : `Stabilise les points faibles de ${route.routeName} avant le prochain tour.`,
      blocker: !route.active ? 'équipe et stock outil' : 'fenêtre de maintenance',
      rationale: `Répond à la cause: ${routeCause.label}.`,
      score: (!route.active ? 44 : 14) + (route.riskLevel >= 70 ? 10 : 0),
    },
    {
      choiceId: 'stockpile',
      label: 'Stockpile',
      tone: localTension !== 'low' ? 'high' : 'low',
      benefit: `Ajoute un tampon local à ${localCity.cityName} pour absorber la tension sur ${mainResource.label}.`,
      blocker: 'stock disponible',
      rationale: `Répond à la cause: ${routeCause.label}.`,
      score: (localTension === 'high' ? 42 : localTension === 'medium' ? 28 : 8) + mainResource.capacity,
    },
    {
      choiceId: 'economic-priority',
      label: 'Priorité économie',
      tone: route.riskLevel >= 55 || route.totalCapacity >= 9 ? 'medium' : 'low',
      benefit: `Réserve ordres et budget pour ${mainResource.label} au lieu de disperser les flux.`,
      blocker: 'ordre économie disponible',
      rationale: `Répond à la cause: ${routeCause.label}.`,
      score: 16 + (route.riskLevel >= 55 ? 12 : 0) + (route.totalCapacity >= 9 ? 10 : 0),
    },
  ];

  const rankedChoices = choices.sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
  const topChoice = rankedChoices[0];

  return rankedChoices.map((choice, index) => ({
    ...choice,
    recommended: index === 0,
    comparison: index === 0 ? 'meilleur levier immédiat' : `moins urgent: ${topChoice.blocker} prioritaire`,
    neighborEffects: neighborContexts.map((neighbor) => getNeighborEffect(choice.choiceId, route, localCity, neighbor, mainResource)),
  }));
}

function buildChoiceForRoute(route, localCity, localTension, resourceLabelById, context = {}) {
  const mainResource = getMainResource(route, resourceLabelById);
  const tone = getRouteTone(route, localTension);
  const routeCause = getRouteCause(route, localCity, localTension, mainResource);
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
  const neighborContexts = getNeighborContexts(route, localCity, context.cities ?? [], context.routes ?? [], context.tensionByCityId ?? {});
  const recoveryChoices = buildRecoveryChoices(route, localCity, localTension, mainResource, routeCause, neighborContexts);

  return {
    routeId: route.routeId,
    action,
    tone,
    cost,
    delay,
    routes: [route.routeName],
    resources: [mainResource.label],
    affectedCity: localCity.cityName,
    causeLabel: routeCause.label,
    cause: routeCause.detail,
    recoveryChoices,
    residualRisk,
    impact,
    score: (TONE_RANK[tone] ?? 0) * 100 + route.riskLevel + route.totalCapacity + (localTension === 'high' ? 20 : localTension === 'medium' ? 10 : 0),
  };
}

export function buildProvinceLogisticsChoicePreview(province, economyView, options = {}) {
  const normalizedOptions = requireObject(options, 'ProvinceLogisticsChoicePreview options');
  const resourceLabelById = requireObject(normalizedOptions.resourceLabelById ?? {}, 'ProvinceLogisticsChoicePreview resourceLabelById');

  if (!province || !economyView) {
    return { recommendedOptionId: null, status: 'stable', summary: 'Aucune donnée logistique disponible.', options: [] };
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
      return localCity ? buildChoiceForRoute(route, localCity, localTension, resourceLabelById, { cities, routes, tensionByCityId }) : null;
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
      status: 'stable',
      summary: 'Logistique stable: aucune route liée à la province sélectionnée.',
      options: [],
    };
  }

  const recommended = routeChoices[0];
  const hasBlocker = routeChoices.some((choice) => choice.tone === 'high' || choice.tone === 'medium');

  return {
    recommendedOptionId: recommended.optionId,
    recoveryChoiceCount: recommended.recoveryChoices.length,
    status: hasBlocker ? recommended.tone : 'stable',
    summary: hasBlocker
      ? `${recommended.action} recommandé sur ${recommended.routes[0]}: ${recommended.cause} ${recommended.recoveryChoices[0].label} est prioritaire car ${recommended.recoveryChoices[0].benefit}`
      : `Logistique stable: ${recommended.routes[0]} et ${recommended.affectedCity} restent couverts.`,
    options: routeChoices,
  };
}
