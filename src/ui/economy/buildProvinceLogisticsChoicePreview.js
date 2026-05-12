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



function inferRecoveryBottleneck(choice, route, localCity, localTension) {
  const neighborBottleneck = choice.neighborEffects.find((effect) => effect.tone !== 'low') ?? null;

  if (!route.active) {
    return {
      type: 'damage',
      label: 'dégâts route',
      detail: `${route.routeName} reste interrompue: réparation nécessaire avant gain visible.`,
      tone: 'high',
    };
  }

  if (route.totalCapacity >= 9) {
    return {
      type: 'capacity',
      label: 'capacité saturée',
      detail: `${route.routeName} porte ${route.totalCapacity} charges: le débit limite la récupération.`,
      tone: 'high',
    };
  }

  if (localTension === 'high') {
    return {
      type: 'unrest',
      label: 'stock critique',
      detail: `${localCity.cityName} absorbe le stock disponible avant que le réseau se normalise.`,
      tone: 'high',
    };
  }

  if (route.riskLevel >= 70) {
    return {
      type: 'climate-pressure',
      label: 'pression risque',
      detail: `Risque ${route.riskLevel} autour de ${route.routeName}: sécurisation lente avant stabilisation.`,
      tone: 'high',
    };
  }

  if (route.riskLevel >= 55) {
    return {
      type: 'distance',
      label: 'trajet exposé',
      detail: `${route.routeName} reste long ou exposé: escorte requise pour raccourcir le délai.`,
      tone: 'medium',
    };
  }

  if (neighborBottleneck) {
    return {
      type: 'neighbor-dependency',
      label: 'dépendance voisine',
      detail: `${neighborBottleneck.route} près de ${neighborBottleneck.target} peut encore retarder le gain.`,
      tone: neighborBottleneck.tone,
    };
  }

  if (localTension === 'medium') {
    return {
      type: 'unrest',
      label: 'stock sous tension',
      detail: `${localCity.cityName} demande un tampon local avant amélioration nette.`,
      tone: 'medium',
    };
  }

  return {
    type: 'none',
    label: 'aucun goulot clair',
    detail: 'Aucun ralentisseur dominant détecté pour cette projection.',
    tone: 'low',
  };
}

function buildRecoveryTimeline(choice, route, localCity, mainResource, localTension) {
  const firstBottleneck = choice.neighborEffects.find((effect) => effect.tone !== 'low') ?? choice.neighborEffects[0] ?? null;
  const nextTurnLabel = choice.choiceId === 'repair'
    ? (!route.active ? 'route rouverte' : 'fragilité réduite')
    : choice.choiceId === 'reroute'
      ? 'flux redistribué'
      : choice.choiceId === 'stockpile'
        ? 'tampon consommé'
        : 'priorité appliquée';
  const remainingRisk = choice.choiceId === 'repair'
    ? Math.max(5, route.riskLevel - (!route.active ? 24 : 16))
    : choice.choiceId === 'reroute'
      ? Math.max(5, route.riskLevel - 10)
      : choice.choiceId === 'stockpile'
        ? Math.max(5, route.riskLevel - 6)
        : Math.max(5, route.riskLevel - 8);
  const riskTone = remainingRisk >= 55 || firstBottleneck?.tone === 'medium' ? 'medium' : 'low';
  const bottleneck = inferRecoveryBottleneck(choice, route, localCity, localTension);

  return [
    {
      step: 'Effet immédiat',
      tone: choice.tone,
      detail: `${choice.label}: ${choice.benefit}`,
    },
    {
      step: 'Prochain tour',
      tone: firstBottleneck?.tone ?? 'low',
      detail: firstBottleneck
        ? `${nextTurnLabel}; ${firstBottleneck.label} sur ${firstBottleneck.route} près de ${firstBottleneck.target}.`
        : `${nextTurnLabel}; aucune route voisine critique détectée.`,
      bottleneck: bottleneck.type === 'neighbor-dependency' ? bottleneck : null,
    },
    {
      step: 'Risque restant',
      tone: riskTone,
      detail: `Risque estimé ${remainingRisk} sur ${route.routeName}; ${firstBottleneck ? `${firstBottleneck.route} reste le goulot à surveiller.` : `${localCity.cityName} garde ${mainResource.label} sous veille.`}`,
      bottleneck,
    },
  ];
}


function buildDownstreamShortages(choice, route, localCity, localTension, mainResource) {
  const pressureEffects = choice.neighborEffects.filter((effect) => effect.tone !== 'low').slice(0, 2);

  if (pressureEffects.length > 0) {
    return pressureEffects.map((effect) => {
      const aggravated = choice.choiceId === 'stockpile' || choice.bottleneck.type === 'capacity';
      const displaced = effect.label === 'congestion déplacée' || choice.choiceId === 'reroute' || choice.bottleneck.type === 'neighbor-dependency';
      const status = aggravated ? 'aggravée' : displaced ? 'déplacée' : 'inconnue';

      return {
        target: effect.target,
        route: effect.route,
        resource: mainResource.label,
        status,
        tone: aggravated ? 'high' : 'medium',
        detail: status === 'aggravée'
          ? `${effect.target} risque de manquer de ${mainResource.label}: ${effect.label} maintient la pression aval.`
          : status === 'déplacée'
            ? `${effect.target} récupère une partie de la pression de ${localCity.cityName}; ${effect.route} reste à surveiller.`
            : `${effect.target} manque de signal clair: ${effect.detail}`,
      };
    });
  }

  if (localTension !== 'low') {
    const resolved = choice.choiceId === 'stockpile' || choice.choiceId === 'economic-priority';

    return [{
      target: localCity.cityName,
      route: route.routeName,
      resource: mainResource.label,
      status: resolved ? 'résolue' : 'inconnue',
      tone: resolved ? 'low' : 'medium',
      detail: resolved
        ? `${mainResource.label} couvert localement; aucune pénurie aval nette détectée.`
        : `${localCity.cityName} reste sous tension: confirmer le stock aval après l'action.`,
    }];
  }

  if (choice.bottleneck.type === 'none') {
    return [{
      target: localCity.cityName,
      route: route.routeName,
      resource: mainResource.label,
      status: 'résolue',
      tone: 'low',
      detail: `${mainResource.label} reste couvert; aucune pénurie aval claire détectée.`,
    }];
  }

  return [{
    target: localCity.cityName,
    route: route.routeName,
    resource: mainResource.label,
    status: 'inconnue',
    tone: 'medium',
    detail: `Données aval insuffisantes: vérifier ${mainResource.label} après ${choice.label}.`,
  }];
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

  return rankedChoices.map((choice, index) => {
    const neighborEffects = neighborContexts.map((neighbor) => getNeighborEffect(choice.choiceId, route, localCity, neighbor, mainResource));
    const bottleneck = inferRecoveryBottleneck({ ...choice, neighborEffects }, route, localCity, localTension);
    const enrichedChoice = { ...choice, neighborEffects, bottleneck };

    return {
      ...choice,
      recommended: index === 0,
      comparison: index === 0 ? 'meilleur levier immédiat' : `moins urgent: ${topChoice.blocker} prioritaire`,
      neighborEffects,
      bottleneck,
      timeline: buildRecoveryTimeline(enrichedChoice, route, localCity, mainResource, localTension),
      downstreamShortages: buildDownstreamShortages(enrichedChoice, route, localCity, localTension, mainResource),
    };
  });
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


function getDelayTurns(delay) {
  const match = String(delay ?? '').match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function buildRecoveryPriorityActions(routeChoices) {
  const candidates = routeChoices
    .flatMap((option) => option.recoveryChoices.slice(0, 2).map((choice) => {
      const shortagesAvoided = choice.downstreamShortages.filter((shortage) => shortage.status === 'résolue').length;
      const displacedShortages = choice.downstreamShortages.filter((shortage) => shortage.status === 'déplacée').length;
      const aggravatedShortages = choice.downstreamShortages.filter((shortage) => shortage.status === 'aggravée').length;
      const delayTurns = getDelayTurns(option.delay);
      const structural = choice.bottleneck.tone === 'high' || choice.bottleneck.type === 'capacity' || choice.bottleneck.type === 'damage';
      const impactScore = shortagesAvoided * 40 + displacedShortages * 18 - aggravatedShortages * 32 + (structural ? 26 : 8) - delayTurns * 4 + (option.recommended ? 12 : 0);
      const tradeoff = delayTurns <= 1 && !structural
        ? 'rapide mais limitée'
        : structural
          ? 'plus lente mais structurante'
          : 'équilibrée';

      return {
        actionId: `${option.routeId}:${choice.choiceId}`,
        optionId: option.optionId,
        routeId: option.routeId,
        choiceId: choice.choiceId,
        action: `${choice.label} · ${option.routes[0]}`,
        route: option.routes[0],
        resource: option.resources[0],
        tone: impactScore >= 40 ? 'high' : impactScore >= 18 ? 'medium' : 'low',
        cost: option.cost,
        delay: option.delay,
        impact: choice.benefit,
        reason: `${choice.bottleneck.label}; ${choice.downstreamShortages[0]?.detail ?? 'aucune pénurie aval claire'}`,
        shortagesAvoided,
        downstreamStatus: choice.downstreamShortages[0]?.status ?? 'inconnue',
        tradeoff,
        impactScore,
      };
    }))
    .sort((left, right) => right.impactScore - left.impactScore || left.delay.localeCompare(right.delay) || left.action.localeCompare(right.action))
    .slice(0, 3)
    .map((candidate, index) => ({
      ...candidate,
      recommended: index === 0,
    }));

  return candidates;
}


function buildSelectedActionImpactPreview(priorityAction, routeChoices) {
  if (!priorityAction) {
    return {
      status: 'empty',
      summary: 'Aucune action candidate sélectionnée: impact à confirmer après choix logistique.',
      currentState: 'Données insuffisantes',
      projectedState: 'Projection indisponible',
      badges: [],
      criticalRemaining: false,
    };
  }

  const option = routeChoices.find((candidate) => candidate.routeId === priorityAction.routeId) ?? routeChoices[0] ?? null;
  const choice = option?.recoveryChoices.find((candidate) => candidate.choiceId === priorityAction.choiceId) ?? option?.recoveryChoices[0] ?? null;
  const shortages = choice?.downstreamShortages ?? [];
  const neighborEffects = choice?.neighborEffects ?? [];
  const criticalBefore = option?.recoveryChoices.flatMap((candidate) => candidate.downstreamShortages).filter((shortage) => shortage.status === 'aggravée').length ?? 0;
  const criticalAfter = shortages.filter((shortage) => shortage.status === 'aggravée').length;
  const reducedShortages = Math.max(priorityAction.shortagesAvoided, criticalBefore - criticalAfter, shortages.filter((shortage) => shortage.status === 'résolue').length);
  const relievedRoutes = new Set([
    priorityAction.route,
    ...neighborEffects.filter((effect) => effect.label === 'hub soulagé' || effect.label === 'axe stabilisé' || effect.tone === 'low').map((effect) => effect.route),
  ]).size;
  const delay = priorityAction.delay ?? option?.delay ?? '1 tour';
  const criticalRemaining = criticalAfter > 0 || choice?.bottleneck?.tone === 'high';

  return {
    status: criticalRemaining ? 'critical' : reducedShortages > 0 || relievedRoutes > 1 ? 'improved' : 'limited',
    summary: `${priorityAction.action}: ${reducedShortages} pénurie${reducedShortages > 1 ? 's' : ''} aval réduite${reducedShortages > 1 ? 's' : ''}, ${relievedRoutes} route${relievedRoutes > 1 ? 's' : ''}/province${relievedRoutes > 1 ? 's' : ''} soulagée${relievedRoutes > 1 ? 's' : ''}, délai ${delay}.`,
    currentState: criticalBefore > 0
      ? `Actuel: ${criticalBefore} pénurie${criticalBefore > 1 ? 's' : ''} critique${criticalBefore > 1 ? 's' : ''} ou déplacée${criticalBefore > 1 ? 's' : ''}.`
      : `Actuel: ${priorityAction.downstreamStatus} sur ${priorityAction.route}.`,
    projectedState: criticalRemaining
      ? `Projeté: pénurie critique encore possible (${choice?.bottleneck?.label ?? 'goulot restant'}).`
      : `Projeté: ${priorityAction.downstreamStatus} après ${priorityAction.action}.`,
    badges: [
      { label: 'Pénuries réduites', value: String(reducedShortages), tone: reducedShortages > 0 ? 'low' : 'medium' },
      { label: 'Axes soulagés', value: String(relievedRoutes), tone: relievedRoutes > 1 ? 'low' : 'medium' },
      { label: 'Délai', value: delay, tone: getDelayTurns(delay) > 1 ? 'medium' : 'low' },
    ],
    criticalRemaining,
  };
}


function buildPrimaryLogisticsQueueAction(priorityAction, selectedActionPreview, queuedLogisticsActions = []) {
  if (!priorityAction) {
    return {
      actionId: null,
      label: 'Aucune action logistique à engager',
      status: 'empty',
      disabled: true,
      cost: '—',
      delay: '—',
      gain: 'Projection insuffisante',
      downstreamImpact: 'Aucune pénurie aval claire détectée.',
      queueWarning: 'Sélectionnez une route logistique ou attendez plus de données.',
    };
  }

  const sameRoute = queuedLogisticsActions.find((entry) => entry.routeId === priorityAction.routeId) ?? null;
  const sameAction = queuedLogisticsActions.find((entry) => entry.actionId === priorityAction.actionId || (entry.routeId === priorityAction.routeId && entry.choiceId === priorityAction.choiceId)) ?? null;
  const status = sameAction ? 'redundant' : sameRoute ? 'conflict' : selectedActionPreview.criticalRemaining ? 'risky' : 'ready';
  const queueWarning = sameAction
    ? 'Action déjà en file: confirmer ajouterait un doublon.'
    : sameRoute
      ? `Conflit potentiel avec ${sameRoute.label ?? sameRoute.actionId}: même route déjà planifiée.`
      : status === 'risky'
        ? 'Action engageable, mais une pénurie critique peut rester après résolution.'
        : 'Prêt à engager depuis la carte.';

  return {
    actionId: priorityAction.actionId,
    routeId: priorityAction.routeId,
    choiceId: priorityAction.choiceId,
    label: priorityAction.action,
    status,
    disabled: status === 'redundant' || status === 'conflict',
    cost: priorityAction.cost,
    delay: priorityAction.delay,
    gain: priorityAction.impact,
    downstreamImpact: selectedActionPreview.summary,
    queueWarning,
  };
}

export function buildProvinceLogisticsChoicePreview(province, economyView, options = {}) {
  const normalizedOptions = requireObject(options, 'ProvinceLogisticsChoicePreview options');
  const resourceLabelById = requireObject(normalizedOptions.resourceLabelById ?? {}, 'ProvinceLogisticsChoicePreview resourceLabelById');
  const queuedLogisticsActions = Array.isArray(normalizedOptions.queuedLogisticsActions) ? normalizedOptions.queuedLogisticsActions : [];

  if (!province || !economyView) {
    return { recommendedOptionId: null, timelineStatus: 'empty', timelineSummary: 'Aucune action route/logistique en file: timeline vide.', downstreamStatus: 'neutre', downstreamSummary: 'Aucune pénurie aval claire détectée.', priorityActions: [], prioritySummary: 'Aucune action logistique prioritaire disponible.', selectedActionPreview: buildSelectedActionImpactPreview(null, []), primaryLogisticsAction: buildPrimaryLogisticsQueueAction(null, buildSelectedActionImpactPreview(null, []), queuedLogisticsActions), status: 'stable', summary: 'Aucune donnée logistique disponible.', options: [] };
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
      timelineStatus: 'empty',
      timelineSummary: 'Aucune action route/logistique en file: timeline vide.',
      downstreamStatus: 'neutre',
      downstreamSummary: 'Aucune pénurie aval claire détectée.',
      priorityActions: [],
      prioritySummary: 'Aucune action logistique prioritaire disponible.',
      selectedActionPreview: buildSelectedActionImpactPreview(null, []),
      primaryLogisticsAction: buildPrimaryLogisticsQueueAction(null, buildSelectedActionImpactPreview(null, []), queuedLogisticsActions),
      status: 'stable',
      summary: 'Logistique stable: aucune route liée à la province sélectionnée.',
      options: [],
    };
  }

  const recommended = routeChoices[0];
  const hasBlocker = routeChoices.some((choice) => choice.tone === 'high' || choice.tone === 'medium');
  const priorityActions = buildRecoveryPriorityActions(routeChoices);
  const recommendedPriority = priorityActions[0] ?? null;
  const selectedActionPreview = buildSelectedActionImpactPreview(recommendedPriority, routeChoices);
  const primaryLogisticsAction = buildPrimaryLogisticsQueueAction(recommendedPriority, selectedActionPreview, queuedLogisticsActions);

  return {
    recommendedOptionId: recommended.optionId,
    recoveryChoiceCount: recommended.recoveryChoices.length,
    timelineStatus: hasBlocker ? 'queued' : 'empty',
    timelineSummary: hasBlocker
      ? `${recommended.recoveryChoices[0].label}: amélioration visible au prochain tour; goulot ${recommended.recoveryChoices[0].bottleneck.label}. ${recommended.recoveryChoices[0].timeline[2].detail}`
      : 'Aucune action route/logistique en file: timeline vide.',
    downstreamStatus: hasBlocker ? recommended.recoveryChoices[0].downstreamShortages[0]?.status ?? 'inconnue' : 'neutre',
    downstreamSummary: hasBlocker
      ? `${recommended.recoveryChoices[0].downstreamShortages[0]?.status ?? 'inconnue'}: ${recommended.recoveryChoices[0].downstreamShortages[0]?.detail ?? 'Aucune pénurie aval claire détectée.'}`
      : 'Aucune pénurie aval claire détectée.',
    priorityActions,
    prioritySummary: recommendedPriority
      ? `${recommendedPriority.action} recommandée: ${recommendedPriority.reason} (${recommendedPriority.tradeoff}, ${recommendedPriority.delay}).`
      : 'Aucune action logistique prioritaire disponible.',
    selectedActionPreview,
    primaryLogisticsAction,
    status: hasBlocker ? recommended.tone : 'stable',
    summary: hasBlocker
      ? `${recommended.action} recommandé sur ${recommended.routes[0]}: ${recommended.cause} ${recommended.recoveryChoices[0].label} est prioritaire car ${recommended.recoveryChoices[0].benefit}`
      : `Logistique stable: ${recommended.routes[0]} et ${recommended.affectedCity} restent couverts.`,
    options: routeChoices,
  };
}
